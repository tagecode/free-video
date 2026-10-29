import { join } from 'node:path'
import { BrowserWindow, shell } from 'electron'
import { APP_NAME } from '@shared/constants'
import { is } from '@electron-toolkit/utils'
import { getWindowState, saveWindowState } from './services/window-state'

export function createMainWindow(): BrowserWindow {
  const state = getWindowState()

  const window = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: APP_NAME,
    backgroundColor: '#0b0b0f',
    autoHideMenuBar: true,
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

  window.on('close', () => saveWindowState(window))

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
