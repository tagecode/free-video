import { historyService } from '../../services/history-service'
import { handle } from '../register'

export function registerHistoryHandlers(): void {
  handle('history:list', () => historyService.list())
  handle('history:add', (input) => historyService.add(input))
  handle('history:remove', (id) => historyService.remove(id))
  handle('history:clear', () => historyService.clear())
}
