import { randomUUID } from 'node:crypto'
import { favoriteInputSchema, favoritesFileSchema } from '@shared/schemas'
import type { FavoriteInput, FavoriteItem } from '@shared/types'
import { mapWithConcurrency } from '../lib/concurrency'
import { createDomainStore } from './store'
import { fetchVideoTitle } from './video-title'

const store = createDomainStore({
  name: 'favorites',
  schema: favoritesFileSchema,
  fallback: () => []
})

function list(): FavoriteItem[] {
  return store.read()
}

const TITLE_FILL_CONCURRENCY = 3
const attemptedTitleIds = new Set<string>()

function add(input: FavoriteInput): FavoriteItem[] {
  const parsed = favoriteInputSchema.parse(input)
  const existing = list()
  const previous = existing.find((entry) => entry.videoUrl === parsed.videoUrl)
  // 这次没拿到标题或备注时沿用同一链接上一次的内容，避免重新收藏把已经记下来的名称冲掉
  const title = (parsed.title.trim() || previous?.title || '').slice(0, 120)
  const note = (parsed.note?.trim() || previous?.note || '').slice(0, 200)
  const item: FavoriteItem = {
    id: randomUUID(),
    createdAt: Date.now(),
    videoUrl: parsed.videoUrl,
    platform: parsed.platform,
    title,
    note: note || undefined
  }
  const deduped = existing.filter((entry) => entry.videoUrl !== item.videoUrl)
  return store.write([item, ...deduped])
}

function updateNote(id: string, note: string): FavoriteItem[] {
  const cleaned = note.trim().slice(0, 200)
  const items = list()
  if (!items.some((item) => item.id === id)) {
    throw new Error('收藏不存在')
  }
  return store.write(
    items.map((item) => (item.id === id ? { ...item, note: cleaned || undefined } : item))
  )
}

/** 给还没有作品名的旧收藏补标题。同一进程里失败过的不再反复请求。 */
async function fillTitles(): Promise<FavoriteItem[]> {
  const items = list()
  const missing = items.filter((item) => !item.title.trim() && !attemptedTitleIds.has(item.id))
  if (missing.length === 0) return items

  for (const item of missing) attemptedTitleIds.add(item.id)
  const titles = await mapWithConcurrency(missing, TITLE_FILL_CONCURRENCY, (item) =>
    fetchVideoTitle(item.videoUrl)
  )
  const byId = new Map(missing.map((item, index) => [item.id, titles[index].trim().slice(0, 120)]))
  // 请求期间列表可能已变化，按最新内容补标题，避免把刚收藏的条目写丢
  const latest = list()
  const next = latest.map((item) => {
    const title = byId.get(item.id)
    return title && !item.title.trim() ? { ...item, title } : item
  })
  const changed = next.some((item, index) => item.title !== latest[index]?.title)
  return changed ? store.write(next) : latest
}

function remove(id: string): FavoriteItem[] {
  return store.write(list().filter((item) => item.id !== id))
}

function clear(): FavoriteItem[] {
  return store.write([])
}

export const favoritesService = { list, add, updateNote, remove, clear, fillTitles }
