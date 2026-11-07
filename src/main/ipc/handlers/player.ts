import { detectPlatform } from '@shared/platform'
import type { PlayResult } from '@shared/types'
import { logger } from '../../services/logger'
import { historyService } from '../../services/history-service'
import { lineService } from '../../services/line-service'
import { playerService } from '../../services/player-service'
import { fetchVideoTitle } from '../../services/video-title'
import { handle } from '../register'
import { loadSettings } from './settings'

export function registerPlayerHandlers(): void {
  handle('player:open', async (request): Promise<PlayResult> => {
    const settings = loadSettings()
    const enabled = lineService.enabled()
    const startIndex = enabled.findIndex((line) => line.id === request.lineId)
    const ordered =
      startIndex > 0 ? [...enabled.slice(startIndex), ...enabled.slice(0, startIndex)] : enabled
    const candidates = settings.autoFallback
      ? ordered.slice(0, settings.maxFallbackAttempts)
      : ordered.slice(0, 1)

    // 和播放并行去原页面拿标题，播放本身不用等这次请求
    const titlePromise = fetchVideoTitle(request.videoUrl)
    const result = await playerService.open({
      lines: candidates,
      videoUrl: request.videoUrl,
      timeoutMs: settings.playTimeoutMs
    })

    if (result.ok) {
      try {
        const fetched = await titlePromise
        historyService.add({
          videoUrl: request.videoUrl,
          platform: detectPlatform(request.videoUrl)?.id ?? 'unknown',
          title: fetched || playerService.pageTitle(),
          lineId: result.lineId ?? request.lineId
        })
      } catch (error) {
        logger.warn(
          `[history] 写入播放历史失败：${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    return result
  })

  handle('player:close', (): PlayResult => playerService.close())

  handle('player:reload', (): void => playerService.reload())

  handle('player:set-bounds', (rect): void => playerService.setBounds(rect))

  handle('player:set-visible', (visible): void => playerService.setVisible(visible))

  handle('player:toggle-fullscreen', (): void => playerService.toggleFullscreen())
}
