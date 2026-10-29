import { platformLabel } from '@shared/platform'
import type { HistoryItem } from '@shared/types'
import { formatTime } from '@/lib/utils'
import { Play, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/store/player'

export function HistoryPage(): React.JSX.Element {
  const [items, setItems] = useState<HistoryItem[]>([])
  const open = usePlayerStore((state) => state.open)
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
    await open(item.videoUrl, item.lineId)
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">播放历史</h1>
          <p className="text-xs text-muted-foreground">最多保留最近 100 条记录</p>
        </div>
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
      </header>

      <div className="flex-1 overflow-y-auto rounded-xl border">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">暂无播放记录</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/40"
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
