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
  const item: HistoryItem = { id: randomUUID(), playedAt: Date.now(), ...parsed }
  const deduped = list().filter(
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
