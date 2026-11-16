import { resolveCloseRequest } from '../../lib/close-request'
import { handle } from '../register'

export function registerWindowHandlers(): void {
  handle('window:close-response', (response) => resolveCloseRequest(response))
}
