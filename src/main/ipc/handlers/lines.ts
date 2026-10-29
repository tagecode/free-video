import { NOTIFY } from '@shared/ipc'
import type { LineHealth, ParseLine } from '@shared/types'
import { checkLines } from '../../services/health-service'
import { lineService } from '../../services/line-service'
import { broadcast } from '../broadcast'
import { handle } from '../register'
import { loadSettings } from './settings'

function notifyLines(lines: ParseLine[]): ParseLine[] {
  broadcast(NOTIFY.linesChanged, lines)
  return lines
}

export function registerLineHandlers(): void {
  handle('lines:list', () => lineService.list())

  handle('lines:upsert', (input) => {
    const line = lineService.upsert(input)
    notifyLines(lineService.list())
    return line
  })

  handle('lines:remove', (id) => notifyLines(lineService.remove(id)))

  handle('lines:toggle', (id, enabled) => notifyLines(lineService.toggle(id, enabled)))

  handle('lines:reorder', (ids) => notifyLines(lineService.reorder(ids)))

  handle('lines:check', async (ids?: string[]): Promise<Record<string, LineHealth>> => {
    const settings = loadSettings()
    const all = lineService.list()
    const targets = ids ? all.filter((line) => ids.includes(line.id)) : all
    const health = await checkLines(targets, settings.healthTimeoutMs)
    lineService.applyHealth(health)
    broadcast(NOTIFY.linesHealth, health)
    notifyLines(lineService.list())
    return health
  })

  handle('lines:import', (json) => {
    const result = lineService.importJson(json)
    notifyLines(lineService.list())
    return result
  })

  handle('lines:export', () => lineService.exportJson())

  handle('lines:reset-builtin', () => notifyLines(lineService.resetBuiltin()))
}
