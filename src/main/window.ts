import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import { APP_NAME, WINDOW_CHROME } from '@shared/constants'
import { NOTIFY } from '@shared/ipc'
import { is } from '@electron-toolkit/utils'
import { appIcon } from './lib/app-icon'
import { cancelCloseRequest, waitCloseResponse } from './lib/close-request'
import { beginQuit, isQuitting } from './lib/quit-state'
import { attachClipboardWatch } from './services/clipboard-watch'
import { readSettings, patchSettings } from './services/settings-service'
import { ensureTray } from './services/tray'
import { getWindowState, saveWindowState } from './services/window-state'
import { registerShortcuts } from './shortcuts'

// 三个平台共用一条 44px 的标题栏：macOS 的红绿灯浮在上面，
// Windows/Linux 用系统的窗口控件覆盖层，界面主体因此完全一致。
const TITLE_BAR_HEIGHT = 44
const isMac = process.platform === 'darwin'

// 已经弹着询问框时不再叠加第二个；用户选过"关闭"的窗口不再二次询问
let closePrompting = false
const closingWindows = new WeakSet<BrowserWindow>()

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

function hideToTray(window: BrowserWindow): void {
  // 建不出托盘图标时退化成最小化，至少还能从任务栏点回来
  if (!ensureTray()) {
    window.minimize()
    return
  }
  window.hide()
}

async function askCloseAction(window: BrowserWindow): Promise<void> {
  if (closePrompting) return

  const contents = window.webContents
  // 页面还没起来或已经崩掉时问不出结果，直接按正常关闭处理，别把窗口卡死
  if (contents.isDestroyed() || contents.isCrashed() || contents.isLoadingMainFrame()) {
    closingWindows.add(window)
    window.close()
    return
  }

  closePrompting = true
  try {
    contents.send(NOTIFY.closeRequest)
    const response = await waitCloseResponse()

    if (response.action === 'cancel') return
    if (response.remember) {
      void patchSettings({ closeAction: response.action })
    }
    if (response.action === 'tray') {
      hideToTray(window)
      return
    }
    // 放行这一次 close，避免又被下面的处理器拦回来
    closingWindows.add(window)
    window.close()
  } finally {
    closePrompting = false
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

  // 右上角关闭、Alt+F4、任务栏关闭都走这里：先记住窗口状态，再按设置决定关还是收进托盘
  window.on('close', (event) => {
    saveWindowState(window)
    if (isQuitting() || closingWindows.has(window)) return

    const action = readSettings().closeAction
    if (action === 'quit') return
    event.preventDefault()
    if (action === 'tray') {
      hideToTray(window)
      return
    }
    void askCloseAction(window)
  })

  window.on('closed', () => {
    cancelCloseRequest()
    nativeTheme.off('updated', onThemeUpdated)
  })

  // 系统关机/重启时不能让询问框挡住退出流程
  window.on('session-end', () => beginQuit())

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
