import { isHttpUrl } from '@shared/join-url'
import { detectPlatform, platformLabel } from '@shared/platform'
import type { FavoriteItem } from '@shared/types'
import { formatTime } from '@/lib/utils'
import { Check, Copy, Heart, Loader2, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { returnToPlayer } from '@/lib/return-to-player'
import { errorMessage } from '@/lib/utils'
import { useLinesStore } from '@/store/lines'
import { usePlayerStore } from '@/store/player'
import { useSettingsStore } from '@/store/settings'

export function FavoritesPage(): React.JSX.Element {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const lines = useLinesStore((state) => state.lines)
  const settings = useSettingsStore((state) => state.settings)
  const patchSettings = useSettingsStore((state) => state.patch)
  const open = usePlayerStore((state) => state.open)

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 1500)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  useEffect(() => {
    let active = true
    void api.favorites.list().then((list) => {
      if (!active) return
      setItems(list)
      if (list.some((item) => !item.title.trim())) {
        void api.favorites
          .fillTitles()
          .then((filled) => {
            if (active) setItems(filled)
          })
          .catch(() => undefined)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const add = async (): Promise<void> => {
    if (saving) return
    if (!isHttpUrl(value)) {
      setError('请输入 http/https 开头的视频页面地址')
      return
    }
    setSaving(true)
    try {
      setItems(
        await api.favorites.add({
          videoUrl: value,
          platform: detectPlatform(value)?.id ?? 'unknown',
          title: '',
          note: note.trim() || undefined
        })
      )
      setValue('')
      setNote('')
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async (item: FavoriteItem): Promise<void> => {
    try {
      await navigator.clipboard.writeText(item.videoUrl)
    } catch {
      const area = document.createElement('textarea')
      area.value = item.videoUrl
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.append(area)
      area.select()
      const copied = document.execCommand('copy')
      area.remove()
      if (!copied) {
        setError('复制失败，请手动选择链接')
        return
      }
    }
    setCopiedId(item.id)
    setError(null)
  }

  const saveNote = async (id: string): Promise<void> => {
    try {
      setItems(await api.favorites.updateNote(id, noteDraft))
      setEditingNoteId(null)
      setError(null)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const play = async (item: FavoriteItem): Promise<void> => {
    if (openingId) return
    setOpeningId(item.id)
    try {
      await returnToPlayer({
        videoUrl: item.videoUrl,
        lines,
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
      <PageHeader title="我的收藏" description="保存常看的视频，并记下作品名方便以后找回" />

      <div className="flex gap-2 rounded-2xl border border-border/70 bg-card/60 p-2 backdrop-blur">
        <Input
          value={value}
          placeholder="粘贴视频页面地址"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
        />
        <Input
          className="w-48"
          value={note}
          placeholder="备注名称，可选"
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
        />
        <Button disabled={saving} onClick={() => void add()}>
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          {saving ? '读取标题' : '收藏'}
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
            {items.map((item) => {
              const title = item.title.trim()
              const remark = item.note?.trim() ?? ''
              const displayName = remark || title || item.videoUrl
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    {editingNoteId === item.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={noteDraft}
                          placeholder="备注名称"
                          maxLength={200}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void saveNote(item.id)
                            if (event.key === 'Escape') setEditingNoteId(null)
                          }}
                        />
                        <Button size="sm" onClick={() => void saveNote(item.id)}>
                          保存
                        </Button>
                      </div>
                    ) : (
                      <p
                        className={
                          displayName === item.videoUrl
                            ? 'truncate text-sm select-text'
                            : 'truncate text-sm font-medium'
                        }
                      >
                        {displayName}
                      </p>
                    )}
                    {remark && title && remark !== title && (
                      <p className="truncate text-xs text-muted-foreground/80">{title}</p>
                    )}
                    {displayName !== item.videoUrl && (
                      <p
                        className="truncate text-xs text-muted-foreground/80 select-text"
                        title={item.videoUrl}
                      >
                        {item.videoUrl}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {platformLabel(item.videoUrl)} · {formatTime(item.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={remark ? `修改备注 ${remark}` : '添加备注'}
                    title="备注"
                    onClick={() => {
                      setEditingNoteId(item.id)
                      setNoteDraft(remark)
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={
                      displayName !== item.videoUrl ? `解析播放 ${displayName}` : '解析播放'
                    }
                    title="解析播放"
                    disabled={openingId === item.id}
                    onClick={() => void play(item)}
                  >
                    {openingId === item.id ? <Loader2 className="animate-spin" /> : <Play />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={copiedId === item.id ? '已复制链接' : '复制链接'}
                    title={copiedId === item.id ? '已复制' : '复制链接'}
                    onClick={() => void copyLink(item)}
                  >
                    {copiedId === item.id ? <Check /> : <Copy />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={displayName !== item.videoUrl ? `删除 ${displayName}` : '删除收藏'}
                    onClick={async () => setItems(await api.favorites.remove(item.id))}
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
