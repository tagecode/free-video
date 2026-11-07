import { writeFileSync } from 'node:fs'
import { BrowserWindow, dialog } from 'electron'
import { NOTIFY } from '@shared/ipc'
import type { ParseLine, Settings } from '@shared/types'
import { broadcast } from '../ipc/broadcast'
import { readSettings, resetSettings } from '../ipc/handlers/settings'
import { favoritesService } from './favorites-service'
import { historyService } from './history-service'
import { lineService } from './line-service'
import { playerService } from './player-service'

export async function exportConfig(): Promise<{ canceled: boolean }> {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const options = {
    title: '导出配置',
    defaultPath: 'free-video-config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return { canceled: true }

  const payload = {
    settings: readSettings(),
    lines: JSON.parse(lineService.exportJson()) as unknown
  }
  writeFileSync(result.filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return { canceled: false }
}

export function clearAllData(): { settings: Settings; lines: ParseLine[] } {
  playerService.close()
  historyService.clear()
  favoritesService.clear()
  const lines = lineService.resetAll()
  const settings = resetSettings()
  broadcast(NOTIFY.linesChanged, lines)
  return { settings, lines }
}
