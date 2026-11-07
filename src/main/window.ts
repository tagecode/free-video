import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, BrowserWindow, nativeImage, nativeTheme, shell } from 'electron'
import { APP_NAME } from '@shared/constants'
import { is } from '@electron-toolkit/utils'
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

function titleBarOverlay(): Electron.TitleBarOverlay {
  return {
    color: nativeTheme.shouldUseDarkColors ? '#171a22' : '#f7f8fa',
    symbolColor: nativeTheme.shouldUseDarkColors ? '#9aa4b2' : '#4b5563',
    height: TITLE_BAR_HEIGHT
  }
}

function syncTitleBarOverlay(window: BrowserWindow): void {
  if (isMac) return
  try {
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
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#171a22' : '#f7f8fa',
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

  // 主题切换后系统控件要跟着换色，否则浅色界面顶着一排深色按钮
  const onThemeUpdated = (): void => {
    if (!window.isDestroyed()) syncTitleBarOverlay(window)
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
