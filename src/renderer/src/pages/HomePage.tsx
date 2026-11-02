import { isHttpUrl } from '@shared/join-url'
import { platformLabel } from '@shared/platform'
import { Link2, Loader2, Play, RotateCw, Square } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { PlayerSurface } from '@/components/PlayerSurface'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useLinesStore } from '@/store/lines'
import { usePlayerStore } from '@/store/player'
import { useSettingsStore } from '@/store/settings'

function Chip({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2 py-0.5">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </span>
  )
}

export function HomePage(): React.JSX.Element {
  const [videoUrl, setVideoUrl] = useState('')
  const lines = useLinesStore((state) => state.lines)
  const open = usePlayerStore((state) => state.open)
  const status = usePlayerStore((state) => state.status)
  const reload = usePlayerStore((state) => state.reload)
  const close = usePlayerStore((state) => state.close)
  const setOverlayOpen = usePlayerStore((state) => state.setOverlayOpen)
  const settings = useSettingsStore((state) => state.settings)
  const patchSettings = useSettingsStore((state) => state.patch)
  const [lineId, setLineId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enabledLines = useMemo(() => lines.filter((line) => line.enabled), [lines])
  const currentLineId = enabledLines.some((line) => line.id === lineId)
    ? lineId
    : (enabledLines.find((line) => line.id === settings.lastLineId)?.id ??
      enabledLines[0]?.id ??
      '')

  const busy = status.state === 'loading'
  const playing = status.state === 'playing'

  const handlePlay = async (): Promise<void> => {
    setError(null)
    if (!isHttpUrl(videoUrl)) {
      setError('请输入 http/https 开头的视频页面地址')
      return
    }
    if (!currentLineId) {
      setError('请先启用至少一条解析线路')
      return
    }
    await patchSettings({ lastLineId: currentLineId })
    const { failure, lineId: actualLineId } = await open(videoUrl, currentLineId)
    if (failure) {
      setError(failure)
      return
    }
    // 自动降级会落到别的线路上，下拉框和"上次使用"都得跟着改，
    // 否则界面上显示的和实际在播的不是同一条。
    if (actualLineId && actualLineId !== currentLineId) {
      setLineId(actualLineId)
      await patchSettings({ lastLineId: actualLineId })
    }
  }

  const handleLineChange = (nextLineId: string): void => {
    setLineId(nextLineId)
    if (!settings.switchLineOnSelect || status.state !== 'playing' || !status.videoUrl) {
      return
    }
    setError(null)
    void patchSettings({ lastLineId: nextLineId })
    void open(status.videoUrl, nextLineId).then(({ failure, lineId: actualLineId }) => {
      if (failure) {
        setError(failure)
        return
      }
      if (actualLineId && actualLineId !== nextLineId) {
        setLineId(actualLineId)
        void patchSettings({ lastLineId: actualLineId })
      }
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <PageHeader title="解析播放" description="粘贴视频页面地址，选择解析线路后开始播放" />

      <section className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.8)] backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={videoUrl}
              placeholder="粘贴腾讯视频 / 爱奇艺 / 优酷 / 芒果 TV 等视频页面地址"
              onChange={(event) => setVideoUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handlePlay()
              }}
              className="h-10 border-border/60 bg-background/60 pl-9 shadow-sm"
            />
          </div>

          <Select
            value={currentLineId}
            onValueChange={handleLineChange}
            onOpenChange={(isOpen) => setOverlayOpen(isOpen)}
          >
            <SelectTrigger className="h-10 w-44 border-border/60 bg-background/60 shadow-sm">
              <SelectValue placeholder="选择线路" />
            </SelectTrigger>
            <SelectContent>
              {enabledLines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="h-10 gap-2 px-5 shadow-[0_12px_28px_-14px_rgba(217,45,60,0.95)]"
            disabled={busy}
            onClick={() => void handlePlay()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
            {busy ? '解析中' : '开始播放'}
          </Button>

          {playing && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="size-10 border-border/60 bg-background/60"
                onClick={() => void reload()}
                title="重新加载"
              >
                <RotateCw />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="size-10 border-border/60 bg-background/60"
                onClick={() => void close()}
                title="关闭播放"
              >
                <Square />
              </Button>
            </>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 px-1">
          <Chip label="识别平台" value={platformLabel(videoUrl)} />
          <Chip label="可用线路" value={`${enabledLines.length} 条`} />
          {settings.autoFallback ? (
            <Chip label="自动降级" value={`最多 ${settings.maxFallbackAttempts} 条`} />
          ) : (
            <Chip label="自动降级" value="已关闭" />
          )}
        </div>

        {error && <p className="mt-2 px-1 text-xs text-destructive">{error}</p>}
      </section>

      <PlayerSurface />

      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        本软件仅作为第三方网页的播放容器，不存储、不转码、不分发任何视频内容。解析结果由第三方服务提供，
        请遵守所在地区法律法规，支持正版内容。
      </p>
    </div>
  )
}
