import { randomUUID } from 'node:crypto'
import { favoriteInputSchema, favoritesFileSchema } from '@shared/schemas'
import type { FavoriteInput, FavoriteItem } from '@shared/types'
import { createDomainStore } from './store'

const store = createDomainStore({
  name: 'favorites',
  schema: favoritesFileSchema,
  fallback: () => []
})

function list(): FavoriteItem[] {
  return store.read()
}

function add(input: FavoriteInput): FavoriteItem[] {
  const parsed = favoriteInputSchema.parse(input)
  const item: FavoriteItem = { id: randomUUID(), createdAt: Date.now(), ...parsed }
  const deduped = list().filter((entry) => entry.videoUrl !== item.videoUrl)
  return store.write([item, ...deduped])
}

function remove(id: string): FavoriteItem[] {
  return store.write(list().filter((item) => item.id !== id))
}

export const favoritesService = { list, add, remove }
