import { app } from 'electron'
import updater from 'electron-updater'
import { logger } from './logger'
import type { UpdateStatus } from '@shared/types'

const { autoUpdater } = updater

type StatusListener = (status: UpdateStatus) => void

let current: UpdateStatus = { state: 'idle' }
const listeners = new Set<StatusListener>()

function setStatus(next: UpdateStatus): void {
  current = next
  for (const listener of listeners) {
    listener(next)
  }
}

export function subscribeUpdater(listener: StatusListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initUpdater(): void {
  autoUpdater.logger = logger
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => setStatus({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    setStatus({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => setStatus({ state: 'none' }))
  autoUpdater.on('download-progress', (progress) =>
    setStatus({ state: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    setStatus({ state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (error) =>
    setStatus({ state: 'error', message: error?.message ?? String(error) })
  )
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  if (!app.isPackaged) {
    const status: UpdateStatus = { state: 'idle', message: '开发模式不检查更新' }
    setStatus(status)
    return status
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    logger.warn('[updater] 检查更新失败', error)
    setStatus({ state: 'error', message: error instanceof Error ? error.message : String(error) })
  }
  return current
}

export function installUpdate(): void {
  if (current.state !== 'downloaded') {
    return
  }
  autoUpdater.quitAndInstall()
}
