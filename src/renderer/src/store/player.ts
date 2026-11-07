import type { PlayerStatus } from '@shared/types'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

interface OpenOutcome {
  failure: string | null
  // 实际播放的线路：自动降级时可能不是请求的那条
  lineId: string | null
}

interface PlayerStore {
  status: PlayerStatus
  visible: boolean
  // 下拉菜单、弹窗等 HTML 浮层打开时必须收起原生视图，
  // 否则浮层即使 z-index 再高也会被原生子视图整块盖住。
  overlayOpen: boolean
  open: (videoUrl: string, lineId: string) => Promise<OpenOutcome>
  close: () => Promise<void>
  reload: () => Promise<void>
  toggleFullscreen: () => Promise<void>
  setVisible: (visible: boolean) => void
  setOverlayOpen: (open: boolean) => void
  subscribe: () => () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  status: { state: 'idle' },
  visible: false,
  overlayOpen: false,

  open: async (videoUrl, lineId) => {
    set({ status: { state: 'loading', videoUrl, lineId }, visible: true })
    try {
      const result = await api.player.open({ videoUrl, lineId })
      return result.ok
        ? { failure: null, lineId: result.lineId ?? lineId }
        : { failure: result.error ?? '播放失败', lineId: null }
    } catch (error) {
      const message = errorMessage(error)
      set({ status: { state: 'failed', videoUrl, error: message } })
      return { failure: message, lineId: null }
    }
  },

  close: async () => {
    await api.player.close()
    set({ status: { state: 'idle' }, visible: false })
  },

  reload: async () => {
    await api.player.reload()
  },

  toggleFullscreen: async () => {
    await api.player.toggleFullscreen()
  },

  setVisible: (visible) => set({ visible }),

  setOverlayOpen: (open) => set({ overlayOpen: open }),

  subscribe: () => api.player.onState((status) => set({ status }))
}))
