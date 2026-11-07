import { clearAllData, exportConfig } from '../../services/data-service'
import { handle } from '../register'

export function registerDataHandlers(): void {
  handle('data:export', () => exportConfig())
  handle('data:clear', () => clearAllData())
}
