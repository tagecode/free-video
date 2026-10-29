import { app } from 'electron'
import type { AppInfo } from '@shared/types'
import { handle } from '../register'

export function registerAppHandlers(): void {
  handle('app:info', (): AppInfo => ({
    version: app.getVersion(),
    platform: `${process.platform}-${process.arch}`,
    userDataPath: app.getPath('userData'),
    isDev: !app.isPackaged
  }))
}
