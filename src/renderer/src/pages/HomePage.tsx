import { isHttpUrl } from '@shared/join-url'
import { platformLabel } from '@shared/platform'
import { Loader2, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
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

export function HomePage(): React.JSX.Element {
  const [videoUrl, setVideoUrl] = useState('')
  const lines = useLinesStore((state) => state.lines)
  const open = usePlayerStore((state) => state.open)
  const status = usePlayerStore((state) => state.status)
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
    const failure = await open(videoUrl, currentLineId)
    if (failure) {
      setError(failure)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Input
            value={videoUrl}
            placeholder="粘贴腾讯视频 / 爱奇艺 / 优酷 / 芒果 TV 等视频页面地址"
            onChange={(event) => setVideoUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handlePlay()
            }}
            className="h-10 flex-1"
          />

          <Select value={currentLineId} onValueChange={setLineId}>
            <SelectTrigger className="h-10 w-44">
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

          <Button className="h-10 px-6" disabled={busy} onClick={() => void handlePlay()}>
            {busy ? <Loader2 className="animate-spin" /> : <Play />}
            {busy ? '解析中' : '开始播放'}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            识别平台：
            <span className="text-foreground">{platformLabel(videoUrl)}</span>
          </span>
          <span>·</span>
          <span>
            可用线路：<span className="text-foreground">{enabledLines.length}</span> 条
          </span>
          {settings.autoFallback && (
            <>
              <span>·</span>
              <span>自动降级已开启（最多 {settings.maxFallbackAttempts} 条）</span>
            </>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <PlayerSurface />

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        本软件仅作为第三方网页的播放容器，不存储、不转码、不分发任何视频内容。解析结果由第三方服务提供，
        请遵守所在地区法律法规，支持正版内容。
      </p>
    </div>
  )
}
