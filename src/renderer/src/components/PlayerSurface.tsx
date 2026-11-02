import { api } from '@/lib/api'
import { usePlayerStore } from '@/store/player'
import { Loader2, MonitorPlay } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

export function PlayerSurface(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const status = usePlayerStore((state) => state.status)
  const overlayOpen = usePlayerStore((state) => state.overlayOpen)

  // 原生视图永远盖在 HTML 之上，加载中必须收起，否则会挡住"正在尝试线路"的进度提示；
  // 下拉菜单等浮层打开时同样要收起，否则选项被播放器整块遮住、点不中。
  const playing = status.state === 'playing'
  const isActive = playing && !overlayOpen

  const syncBounds = useCallback((): void => {
    const element = containerRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    void api.player.setBounds({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    })
  }, [])

  // 只绑定一次：容器尺寸恒定，状态变化不该重建观察器，
  // 更不该在清理时隐藏视图——那会在每次状态流转的瞬间把播放画面抹掉。
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let frame = 0

    const schedule = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(syncBounds)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    schedule()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      void api.player.setVisible(false)
    }
  }, [syncBounds])

  useEffect(() => {
    // 视图可能是这次播放才创建的，显示前必须补一次真实尺寸，
    // 否则主进程沿用 0×0，解析页 viewport 为 0，只剩声音没有画面。
    if (isActive) syncBounds()
    void api.player.setVisible(isActive)
  }, [isActive, syncBounds])

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/60 bg-black shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ visibility: isActive ? 'hidden' : 'visible' }}
      />

      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <MonitorPlay className="size-7 text-white/35" />
          </span>
          <div className="max-w-[70%] text-center">
            <p className="text-sm text-white/70">
              {status.state === 'failed' ? '播放失败' : '尚未开始播放'}
            </p>
            <p className="mt-1 text-xs text-white/35">
              {status.state === 'failed'
                ? (status.error ?? '换一条线路再试试')
                : '粘贴视频地址后点击开始播放 · F11 全屏'}
            </p>
          </div>
        </div>
      )}

      {status.state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-white/70" />
          <p className="text-sm text-white/80">正在尝试线路（第 {status.attempt ?? 1} 次）</p>
          <p className="max-w-[80%] truncate text-xs text-white/35">{status.playUrl}</p>
        </div>
      )}
    </div>
  )
}
