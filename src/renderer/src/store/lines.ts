import type { ParseLine, ParseLineInput } from '@shared/types'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

interface LinesStore {
  lines: ParseLine[]
  loaded: boolean
  checking: boolean
  error: string | null
  load: () => Promise<void>
  upsert: (input: ParseLineInput) => Promise<boolean>
  remove: (id: string) => Promise<void>
  toggle: (id: string, enabled: boolean) => Promise<void>
  reorder: (ids: string[]) => Promise<void>
  check: (ids?: string[]) => Promise<void>
  importJson: (json: string) => Promise<string>
  resetBuiltin: () => Promise<void>
  subscribe: () => () => void
}

export const useLinesStore = create<LinesStore>((set) => ({
  lines: [],
  loaded: false,
  checking: false,
  error: null,

  load: async () => {
    try {
      set({ lines: await api.lines.list(), loaded: true, error: null })
    } catch (error) {
      set({ loaded: true, error: errorMessage(error) })
    }
  },

  upsert: async (input) => {
    try {
      await api.lines.upsert(input)
      set({ lines: await api.lines.list(), error: null })
      return true
    } catch (error) {
      set({ error: errorMessage(error) })
      return false
    }
  },

  remove: async (id) => {
    try {
      set({ lines: await api.lines.remove(id), error: null })
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },

  toggle: async (id, enabled) => {
    try {
      set({ lines: await api.lines.toggle(id, enabled), error: null })
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },

  reorder: async (ids) => {
    try {
      set({ lines: await api.lines.reorder(ids), error: null })
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },

  check: async (ids) => {
    set({ checking: true })
    try {
      await api.lines.check(ids)
      set({ lines: await api.lines.list(), checking: false, error: null })
    } catch (error) {
      set({ checking: false, error: errorMessage(error) })
    }
  },

  importJson: async (json) => {
    const result = await api.lines.importJson(json)
    set({ lines: await api.lines.list() })
    return `导入 ${result.imported} 条，跳过 ${result.skipped} 条`
  },

  resetBuiltin: async () => {
    try {
      set({ lines: await api.lines.resetBuiltin(), error: null })
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },

  subscribe: () => {
    const offChanged = api.lines.onChanged((lines) => set({ lines }))
    const offHealth = api.lines.onHealthChanged(() => {
      void api.lines.list().then((lines) => set({ lines }))
    })
    return () => {
      offChanged()
      offHealth()
    }
  }
}))
