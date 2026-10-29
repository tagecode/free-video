import { DEFAULT_SETTINGS } from '@shared/constants'
import type { Settings } from '@shared/types'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

interface SettingsStore {
  settings: Settings
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  patch: (patch: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  error: null,

  load: async () => {
    try {
      const settings = await api.settings.get()
      set({ settings, loaded: true, error: null })
    } catch (error) {
      set({ loaded: true, error: errorMessage(error) })
    }
  },

  patch: async (patch) => {
    const previous = useSettingsStore.getState().settings
    set({ settings: { ...previous, ...patch } })
    try {
      const settings = await api.settings.patch(patch)
      set({ settings, error: null })
    } catch (error) {
      set({ settings: previous, error: errorMessage(error) })
    }
  }
}))
