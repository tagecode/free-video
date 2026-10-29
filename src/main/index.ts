import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { APP_NAME } from '@shared/constants'
import { registerIpcHandlers } from './ipc'
import { logger } from './services/logger'
import { playerService } from './services/player-service'
import { initUpdater } from './services/updater'
import { createMainWindow } from './window'

app.setName(APP_NAME)

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null

  app.on('second-instance', () => {
    if (!mainWindow) {
      return
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.tagecode.freevideo')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerIpcHandlers()
    initUpdater()

    mainWindow = createMainWindow()
    playerService.attach(mainWindow)

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
        playerService.attach(mainWindow)
      }
    })
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
