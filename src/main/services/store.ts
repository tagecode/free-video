import { copyFileSync } from 'node:fs'
import Store from 'electron-store'
import type { z } from 'zod'
import { logger } from './logger'

export interface DomainStore<T> {
  read: () => T
  write: (value: T) => T
  reset: () => T
  readonly path: string
}

interface DomainStoreOptions<S extends z.ZodType> {
  name: string
  schema: S
  fallback: () => z.infer<S>
  migrate?: (raw: unknown) => unknown
}

/**
 * electron-store 的领域封装：只负责读写与损坏兜底，
 * 校验交给 zod，避免再引入一套 JSON Schema。
 */
export function createDomainStore<S extends z.ZodType>(
  options: DomainStoreOptions<S>
): DomainStore<z.infer<S>> {
  const store = new Store<{ data?: unknown }>({ name: options.name })

  const write = (value: z.infer<S>): z.infer<S> => {
    store.set('data', value)
    return value
  }

  const read = (): z.infer<S> => {
    const raw = store.get('data')
    const migrated = options.migrate ? options.migrate(raw) : raw
    const parsed = options.schema.safeParse(migrated)
    if (parsed.success) {
      return parsed.data
    }

    if (raw !== undefined) {
      const backupPath = `${store.path}.corrupt-${Date.now()}`
      try {
        copyFileSync(store.path, backupPath)
        logger.warn(`[store] ${options.name} 校验失败，已备份至 ${backupPath}`)
      } catch (error) {
        logger.warn(`[store] ${options.name} 备份失败`, error)
      }
    }

    return write(options.fallback())
  }

  return {
    read,
    write,
    reset: () => write(options.fallback()),
    path: store.path
  }
}
