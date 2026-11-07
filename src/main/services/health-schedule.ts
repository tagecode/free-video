import { NOTIFY } from '@shared/ipc'
import { broadcast } from '../ipc/broadcast'
import { logger } from './logger'
import { checkLines } from './health-service'
import { lineService } from './line-service'

const STARTUP_DELAY_MS = 8_000

let intervalTimer: NodeJS.Timeout | null = null
let startupTimer: NodeJS.Timeout | null = null

async function runScheduledCheck(): Promise<void> {
  try {
    const { readSettings } = await import('../ipc/handlers/settings')
    const settings = readSettings()
    const targets = lineService.enabled()
    if (targets.length === 0) return
    const health = await checkLines(targets, settings.healthTimeoutMs)
    lineService.applyHealth(health)
    broadcast(NOTIFY.linesHealth, health)
    broadcast(NOTIFY.linesChanged, lineService.list())
  } catch (error) {
    logger.warn('[health] 定时检测失败', error)
  }
}

export function syncHealthInterval(intervalMs: number): void {
  if (intervalTimer) {
    clearInterval(intervalTimer)
    intervalTimer = null
  }
  if (intervalMs <= 0) return
  intervalTimer = setInterval(() => {
    void runScheduledCheck()
  }, intervalMs)
}

/** 启动后延迟检测一次，再按设置里的间隔重复。间隔为 0 时不再重复。 */
export function startHealthSchedule(): void {
  if (startupTimer) return
  startupTimer = setTimeout(() => {
    startupTimer = null
    void runScheduledCheck().finally(async () => {
      const { readSettings } = await import('../ipc/handlers/settings')
      syncHealthInterval(readSettings().healthCheckIntervalMs)
    })
  }, STARTUP_DELAY_MS)
}
