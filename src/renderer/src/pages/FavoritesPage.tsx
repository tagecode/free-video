import { isHttpUrl } from '@shared/join-url'
import { detectPlatform, platformLabel } from '@shared/platform'
import type { FavoriteItem } from '@shared/types'
import { formatTime } from '@/lib/utils'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

export function FavoritesPage(): React.JSX.Element {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void api.favorites.list().then((list) => {
      if (active) setItems(list)
    })
    return () => {
      active = false
    }
  }, [])

  const add = async (): Promise<void> => {
    if (!isHttpUrl(value)) {
      setError('请输入 http/https 开头的视频页面地址')
      return
    }
    try {
      setItems(
        await api.favorites.add({
          videoUrl: value,
          platform: detectPlatform(value)?.id ?? 'unknown',
          title: ''
        })
      )
      setValue('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <PageHeader title="我的收藏" description="保存常看的视频页面地址，随时回看" />

      <div className="flex gap-2 rounded-2xl border border-border/70 bg-card/60 p-2 backdrop-blur">
        <Input
          value={value}
          placeholder="粘贴视频页面地址"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
        />
        <Button onClick={() => void add()}>
          <Plus />
          收藏
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/70 bg-card/50 backdrop-blur">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-border/60 bg-background/50">
              <Heart className="size-5 text-muted-foreground/70" />
            </span>
            <p className="text-sm text-muted-foreground">还没有收藏任何内容</p>
            <p className="text-xs text-muted-foreground/70">在上方粘贴地址即可收藏</p>
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
                    {platformLabel(item.videoUrl)} · {formatTime(item.createdAt)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => setItems(await api.favorites.remove(item.id))}
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
