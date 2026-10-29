import type { PlayerStatus } from '@shared/types'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

interface PlayerStore {
  status: PlayerStatus
  visible: boolean
  open: (videoUrl: string, lineId: string) => Promise<string | null>
  close: () => Promise<void>
  reload: () => Promise<void>
  setVisible: (visible: boolean) => void
  subscribe: () => () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  status: { state: 'idle' },
  visible: false,

  open: async (videoUrl, lineId) => {
    set({ status: { state: 'loading', videoUrl, lineId }, visible: true })
    try {
      const result = await api.player.open({ videoUrl, lineId })
      return result.ok ? null : (result.error ?? '播放失败')
    } catch (error) {
      const message = errorMessage(error)
      set({ status: { state: 'failed', videoUrl, error: message } })
      return message
    }
  },

  close: async () => {
    await api.player.close()
    set({ status: { state: 'idle' }, visible: false })
  },

  reload: async () => {
    await api.player.reload()
  },

  setVisible: (visible) => set({ visible }),

  subscribe: () => api.player.onState((status) => set({ status }))
}))
