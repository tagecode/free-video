import { api } from '@/lib/api'
import { usePlayerStore } from '@/store/player'
import { Loader2, MonitorPlay, RotateCw, Square } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from './ui/button'

export function PlayerSurface(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const status = usePlayerStore((state) => state.status)
  const reload = usePlayerStore((state) => state.reload)
  const close = usePlayerStore((state) => state.close)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let frame = 0

    const sync = (): void => {
      const rect = element.getBoundingClientRect()
      void api.player.setBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      })
    }

    const schedule = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(sync)
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
  }, [status.state])

  const isActive = status.state === 'playing' || status.state === 'loading'

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl border bg-black">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ visibility: isActive ? 'hidden' : 'visible' }}
      />

      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <MonitorPlay className="size-12 opacity-40" />
          <p className="text-sm">
            {status.state === 'failed'
              ? (status.error ?? '播放失败')
              : '输入视频地址后选择线路开始播放'}
          </p>
        </div>
      )}

      {status.state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">正在尝试线路（第 {status.attempt ?? 1} 次）</p>
          <p className="max-w-[80%] truncate text-xs text-muted-foreground">{status.playUrl}</p>
        </div>
      )}

      {status.state === 'playing' && (
        <div className="absolute top-2 right-2 flex gap-2">
          <Button size="icon" variant="secondary" onClick={() => void reload()} title="重新加载">
            <RotateCw />
          </Button>
          <Button size="icon" variant="secondary" onClick={() => void close()} title="关闭播放">
            <Square />
          </Button>
        </div>
      )}
    </div>
  )
}
