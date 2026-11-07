import { randomUUID } from 'node:crypto'
import { MAX_HISTORY } from '@shared/constants'
import { historyFileSchema, historyItemInputSchema } from '@shared/schemas'
import type { HistoryItem, HistoryItemInput } from '@shared/types'
import { createDomainStore } from './store'

const store = createDomainStore({
  name: 'history',
  schema: historyFileSchema,
  fallback: () => []
})

function list(): HistoryItem[] {
  return store.read()
}

function add(input: HistoryItemInput): HistoryItem[] {
  const parsed = historyItemInputSchema.parse(input)
  const existing = list()
  // 这次没拿到标题时沿用同一链接上一次的标题，避免重播把已经记下来的名称冲掉
  const previousTitle =
    existing.find((entry) => entry.videoUrl === parsed.videoUrl && entry.title.trim())?.title ?? ''
  const title = (parsed.title.trim() || previousTitle).slice(0, 120)
  const item: HistoryItem = { id: randomUUID(), playedAt: Date.now(), ...parsed, title }
  const deduped = existing.filter(
    (entry) => entry.videoUrl !== item.videoUrl || entry.lineId !== item.lineId
  )
  return store.write([item, ...deduped].slice(0, MAX_HISTORY))
}

function remove(id: string): HistoryItem[] {
  return store.write(list().filter((item) => item.id !== id))
}

function clear(): HistoryItem[] {
  return store.write([])
}

export const historyService = { list, add, remove, clear }
