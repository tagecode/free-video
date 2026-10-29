import { NOTIFY } from '@shared/ipc'
import { checkForUpdates, installUpdate, subscribeUpdater } from '../../services/updater'
import { broadcast } from '../broadcast'
import { handle } from '../register'

export function registerUpdaterHandlers(): void {
  subscribeUpdater((status) => broadcast(NOTIFY.updaterStatus, status))

  handle('updater:check', () => checkForUpdates())
  handle('updater:install', (): void => installUpdate())
}
