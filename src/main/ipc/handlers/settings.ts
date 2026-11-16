import { handle } from '../register'
import { loadSettings, patchSettings } from '../../services/settings-service'

export function registerSettingsHandlers(): void {
  handle('settings:get', () => loadSettings())
  handle('settings:patch', (patch) => patchSettings(patch))
}
