import { detectPlatform } from '@shared/platform'
import type { PlayResult } from '@shared/types'
import { historyService } from '../../services/history-service'
import { lineService } from '../../services/line-service'
import { playerService } from '../../services/player-service'
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

    const result = await playerService.open({
      lines: candidates,
      videoUrl: request.videoUrl,
      timeoutMs: settings.playTimeoutMs
    })

    if (result.ok) {
      historyService.add({
        videoUrl: request.videoUrl,
        platform: detectPlatform(request.videoUrl)?.id ?? 'unknown',
        title: '',
        lineId: result.lineId ?? request.lineId
      })
    }

    return result
  })

  handle('player:close', (): PlayResult => playerService.close())

  handle('player:reload', (): void => playerService.reload())

  handle('player:set-bounds', (rect): void => playerService.setBounds(rect))

  handle('player:set-visible', (visible): void => playerService.setVisible(visible))

  handle('player:toggle-fullscreen', (): void => playerService.toggleFullscreen())
}
