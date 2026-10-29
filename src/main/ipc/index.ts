import { registerAppHandlers } from './handlers/app'
import { registerFavoriteHandlers } from './handlers/favorites'
import { registerHistoryHandlers } from './handlers/history'
import { registerLineHandlers } from './handlers/lines'
import { registerPlayerHandlers } from './handlers/player'
import { loadSettings, patchSettings } from './handlers/settings'
import { registerUpdaterHandlers } from './handlers/updater'
import { handle } from './register'

export function registerIpcHandlers(): void {
  registerAppHandlers()

  handle('settings:get', () => loadSettings())
  handle('settings:patch', (patch) => patchSettings(patch))

  registerLineHandlers()
  registerPlayerHandlers()
  registerHistoryHandlers()
  registerFavoriteHandlers()
  registerUpdaterHandlers()
}
