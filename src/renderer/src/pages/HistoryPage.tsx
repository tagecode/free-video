import { platformLabel } from '@shared/platform'
import type { HistoryItem } from '@shared/types'
import { formatTime } from '@/lib/utils'
import { Clock, Play, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/store/player'
import { useSettingsStore } from '@/store/settings'

export function HistoryPage(): React.JSX.Element {
  const [items, setItems] = useState<HistoryItem[]>([])
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
    if (!item.lineId) {
      navigate('/')
      return
    }
    const { lineId } = await open(item.videoUrl, item.lineId)
    // 首页下拉框按 lastLineId 回显，降级后要记成真正播放的那条
    if (lineId) {
      void patchSettings({ lastLineId: lineId })
    }
    navigate('/')
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
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.videoUrl}</p>
                  <p className="text-xs text-muted-foreground">
                    {platformLabel(item.videoUrl)} · {formatTime(item.playedAt)}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => void play(item)}>
                  <Play />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => setItems(await api.history.remove(item.id))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
