import { nativeTheme, session } from 'electron'
import { HEALTH_PARTITION, PLAYER_PARTITION } from '@shared/constants'
import { settingsSchema } from '@shared/schemas'
import type { Settings } from '@shared/types'
import { syncHealthInterval } from '../../services/health-schedule'
import { createDomainStore } from '../../services/store'

const store = createDomainStore({
  name: 'settings',
  schema: settingsSchema,
  fallback: () => settingsSchema.parse({})
})

let defaultUserAgent = ''

function networkSessions(): Electron.Session[] {
  return [
    session.defaultSession,
    session.fromPartition(PLAYER_PARTITION),
    session.fromPartition(HEALTH_PARTITION)
  ]
}

function applySideEffects(settings: Settings): void {
  nativeTheme.themeSource = settings.theme

  const sessions = networkSessions()
  if (!defaultUserAgent) {
    defaultUserAgent = sessions[0]?.getUserAgent() ?? ''
  }
  const userAgent = settings.userAgent.trim() || defaultUserAgent
  const proxyConfig =
    settings.proxyMode === 'manual' && settings.proxyUrl
      ? { mode: 'fixed_servers' as const, proxyRules: settings.proxyUrl }
      : settings.proxyMode === 'none'
        ? { mode: 'direct' as const }
        : { mode: 'system' as const }

  for (const current of sessions) {
    if (userAgent) current.setUserAgent(userAgent)
    void current.setProxy(proxyConfig).catch(() => {
      /* 代理设置失败不阻断启动 */
    })
  }
}

export function readSettings(): Settings {
  return store.read()
}

export function loadSettings(): Settings {
  const settings = readSettings()
  applySideEffects(settings)
  return settings
}

export function patchSettings(patch: Partial<Settings>): Settings {
  const previous = readSettings()
  const next = settingsSchema.parse({ ...previous, ...patch })
  store.write(next)
  applySideEffects(next)
  if (next.healthCheckIntervalMs !== previous.healthCheckIntervalMs) {
    syncHealthInterval(next.healthCheckIntervalMs)
  }
  return next
}

export function resetSettings(): Settings {
  const settings = store.reset()
  applySideEffects(settings)
  syncHealthInterval(settings.healthCheckIntervalMs)
  return settings
}
