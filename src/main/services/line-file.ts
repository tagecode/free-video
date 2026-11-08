import { readFileSync, writeFileSync } from 'node:fs'
import { BrowserWindow, dialog } from 'electron'
import { lineService } from './line-service'

const JSON_FILTER = [{ name: 'JSON', extensions: ['json'] }]

function targetWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export async function saveLinesFile(): Promise<{ canceled: boolean }> {
  const window = targetWindow()
  const options = {
    title: '导出线路',
    defaultPath: 'free-video-lines.json',
    filters: JSON_FILTER
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return { canceled: true }

  writeFileSync(result.filePath, `${lineService.exportJson()}\n`, 'utf8')
  return { canceled: false }
}

export async function pickLinesFile(): Promise<{ canceled: boolean; json?: string }> {
  const window = targetWindow()
  const options = {
    title: '导入线路',
    filters: JSON_FILTER,
    properties: ['openFile'] as Array<'openFile'>
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  const filePath = result.filePaths[0]
  if (result.canceled || !filePath) return { canceled: true }

  return { canceled: false, json: readFileSync(filePath, 'utf8') }
}
