import { registerAppHandlers } from './handlers/app'
import { registerDataHandlers } from './handlers/data'
import { registerFavoriteHandlers } from './handlers/favorites'
import { registerHistoryHandlers } from './handlers/history'
import { registerLineHandlers } from './handlers/lines'
import { registerPlayerHandlers } from './handlers/player'
import { registerSettingsHandlers } from './handlers/settings'
import { registerUpdaterHandlers } from './handlers/updater'
import { registerWindowHandlers } from './handlers/window'

export function registerIpcHandlers(): void {
  registerAppHandlers()

  registerWindowHandlers()

  registerSettingsHandlers()

  registerLineHandlers()
  registerPlayerHandlers()
  registerHistoryHandlers()
  registerFavoriteHandlers()
  registerUpdaterHandlers()
  registerDataHandlers()
}
