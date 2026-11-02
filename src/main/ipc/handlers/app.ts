import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import type { AppInfo } from '@shared/types'
import { handle } from '../register'

/** 未打包运行时 app.getVersion() 会退回 Electron 自身的版本，界面上显示成 44.x */
function appVersion(): string {
  if (app.isPackaged) return app.getVersion()
  try {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8'))
    return pkg.version ?? app.getVersion()
  } catch {
    return app.getVersion()
  }
}

export function registerAppHandlers(): void {
  handle('app:info', (): AppInfo => ({
    version: appVersion(),
    platform: `${process.platform}-${process.arch}`,
    userDataPath: app.getPath('userData'),
    isDev: !app.isPackaged
  }))
}
