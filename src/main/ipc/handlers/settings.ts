import { nativeTheme, session } from 'electron'
import { settingsSchema } from '@shared/schemas'
import type { Settings } from '@shared/types'
import { createDomainStore } from '../../services/store'

const store = createDomainStore({
  name: 'settings',
  schema: settingsSchema,
  fallback: () => settingsSchema.parse({})
})

function applySideEffects(settings: Settings): void {
  nativeTheme.themeSource = settings.theme

  const proxyConfig =
    settings.proxyMode === 'manual' && settings.proxyUrl
      ? { mode: 'fixed_servers' as const, proxyRules: settings.proxyUrl }
      : settings.proxyMode === 'none'
        ? { mode: 'direct' as const }
        : { mode: 'system' as const }

  void session.defaultSession.setProxy(proxyConfig).catch(() => {
    /* 代理设置失败不阻断启动 */
  })
}

export function loadSettings(): Settings {
  const settings = store.read()
  applySideEffects(settings)
  return settings
}

export function patchSettings(patch: Partial<Settings>): Settings {
  const next = settingsSchema.parse({ ...store.read(), ...patch })
  store.write(next)
  applySideEffects(next)
  return next
}
