import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, nativeImage, nativeTheme, shell } from 'electron'
import { APP_NAME, WINDOW_CHROME } from '@shared/constants'
import { is } from '@electron-toolkit/utils'
import { attachClipboardWatch } from './services/clipboard-watch'
import { getWindowState, saveWindowState } from './services/window-state'
import { registerShortcuts } from './shortcuts'

// 三个平台共用一条 44px 的标题栏：macOS 的红绿灯浮在上面，
// Windows/Linux 用系统的窗口控件覆盖层，界面主体因此完全一致。
const TITLE_BAR_HEIGHT = 44
const isMac = process.platform === 'darwin'

function appIcon(): Electron.NativeImage | undefined {
  const file = [
    join(import.meta.dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.png')
  ].find((candidate) => existsSync(candidate))
  if (!file) return undefined
  const image = nativeImage.createFromPath(file)
  return image.isEmpty() ? undefined : image
}

function chromeColors(): (typeof WINDOW_CHROME)[keyof typeof WINDOW_CHROME] {
  return nativeTheme.shouldUseDarkColors ? WINDOW_CHROME.dark : WINDOW_CHROME.light
}

function titleBarOverlay(): Electron.TitleBarOverlay {
  return {
    // 覆盖层只负责画系统按钮，底色保持透明交给页面：标题栏的半透明底、品牌色光晕
    // 和下边框都是渲染进程画的，一旦覆盖层填纯色，右上角就会盖出与标题栏其余部分
    // 不一致的一块色差，并且会把下边框截断。
    color: '#00000000',
    symbolColor: chromeColors().symbol,
    height: TITLE_BAR_HEIGHT
  }
}

function syncWindowChrome(window: BrowserWindow): void {
  if (isMac) return
  try {
    window.setBackgroundColor(chromeColors().background)
    window.setTitleBarOverlay(titleBarOverlay())
  } catch {
    /* 窗口已销毁或平台不支持覆盖层时保持系统默认控件 */
  }
}

export function createMainWindow(): BrowserWindow {
  const state = getWindowState()
  const icon = appIcon()
  // 开发时进程仍是 Electron 本体，不单独设的话 Dock / 任务栏继续显示默认原子图标
  if (isMac && icon) app.dock?.setIcon(icon)

  const window = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: APP_NAME,
    icon,
    backgroundColor: chromeColors().background,
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 18, y: 15 } }
      : { titleBarOverlay: titleBarOverlay() }),
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (state.maximized) {
    window.maximize()
  }

  window.on('ready-to-show', () => window.show())

  registerShortcuts(window, window.webContents)
  attachClipboardWatch(window)

  // 主题切换后窗口底色和系统按钮图案要跟着换色，否则浅色界面顶着一排深色按钮
  const onThemeUpdated = (): void => {
    if (!window.isDestroyed()) syncWindowChrome(window)
  }
  nativeTheme.on('updated', onThemeUpdated)

  window.on('close', () => saveWindowState(window))

  window.on('closed', () => nativeTheme.off('updated', onThemeUpdated))

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }

  return window
}
