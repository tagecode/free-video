import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_NAME } from '@shared/constants'
import { registerIpcHandlers } from './ipc'
import { beginQuit } from './lib/quit-state'
import { logger } from './services/logger'
import { playerService } from './services/player-service'
import { startHealthSchedule } from './services/health-schedule'
import { registerTrayActions } from './services/tray'
import { checkForUpdates, initUpdater } from './services/updater'
import { createMainWindow } from './window'

app.setName(APP_NAME)

// 任何真正的退出（托盘退出、更新安装、首启声明里的"退出"）都先置位，
// 关窗逻辑据此跳过"关闭还是最小化到托盘"的询问。
app.on('before-quit', () => beginQuit())

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null

  /** 托盘「显示主界面」和 macOS Dock 点击共用：窗口被关掉时重建 */
  function openMainWindow(): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      return
    }
    mainWindow = createMainWindow()
    playerService.attach(mainWindow)
  }

  app.on('second-instance', () => openMainWindow())

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.tagecode.freevideo')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerIpcHandlers()
    initUpdater()
    if (app.isPackaged) {
      void checkForUpdates()
    }
    startHealthSchedule()

    registerTrayActions({
      showMainWindow: openMainWindow,
      quit: () => {
        beginQuit()
        app.quit()
      }
    })

    mainWindow = createMainWindow()
    playerService.attach(mainWindow)

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    app.on('activate', () => openMainWindow())
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

process.on('uncaughtException', (error) => {
  logger.error('[main] 未捕获异常', error)
})
