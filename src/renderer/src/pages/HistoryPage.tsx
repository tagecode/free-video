import { platformLabel } from '@shared/platform'
import type { HistoryItem } from '@shared/types'
import { formatTime } from '@/lib/utils'
import { Clock, Loader2, Play, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { returnToPlayer } from '@/lib/return-to-player'
import { useLinesStore } from '@/store/lines'
import { usePlayerStore } from '@/store/player'
import { useSettingsStore } from '@/store/settings'

export function HistoryPage(): React.JSX.Element {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [openingId, setOpeningId] = useState<string | null>(null)
  const lines = useLinesStore((state) => state.lines)
  const settings = useSettingsStore((state) => state.settings)
  const open = usePlayerStore((state) => state.open)
  const patchSettings = useSettingsStore((state) => state.patch)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    void api.history.list().then((list) => {
      if (active) setItems(list)
    })
    return () => {
      active = false
    }
  }, [])

  const play = async (item: HistoryItem): Promise<void> => {
    if (openingId) return
    setOpeningId(item.id)
    try {
      await returnToPlayer({
        videoUrl: item.videoUrl,
        lines,
        preferredLineId: item.lineId,
        lastLineId: settings.lastLineId,
        open,
        patchSettings,
        navigate
      })
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <PageHeader
        title="播放历史"
        description="最多保留最近 100 条记录"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={items.length === 0}
            onClick={async () => {
              setItems(await api.history.clear())
            }}
          >
            <Trash2 />
            清空
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/70 bg-card/50 backdrop-blur">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-border/60 bg-background/50">
              <Clock className="size-5 text-muted-foreground/70" />
            </span>
            <p className="text-sm text-muted-foreground">暂无播放记录</p>
            <p className="text-xs text-muted-foreground/70">播放过的视频会出现在这里</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const title = item.title.trim()
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className={title ? 'truncate text-sm font-medium' : 'truncate text-sm'}>
                      {title || item.videoUrl}
                    </p>
                    {title && (
                      <p
                        className="truncate text-xs text-muted-foreground/80"
                        title={item.videoUrl}
                      >
                        {item.videoUrl}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {platformLabel(item.videoUrl)} · {formatTime(item.playedAt)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={title ? `解析播放 ${title}` : '解析播放'}
                    title="解析播放"
                    disabled={openingId === item.id}
                    onClick={() => void play(item)}
                  >
                    {openingId === item.id ? <Loader2 className="animate-spin" /> : <Play />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => setItems(await api.history.remove(item.id))}
                  >
                    <Trash2 />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
