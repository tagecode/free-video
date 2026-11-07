import { randomUUID } from 'node:crypto'
import builtinData from '../../../resources/lines.default.json'
import { resolveLineImport } from '@shared/line-import'
import { builtinLineFileSchema, linesFileSchema, parseLineInputSchema } from '@shared/schemas'
import type {
  BuiltinLine,
  ImportResult,
  LineHealth,
  LinesFile,
  ParseLine,
  ParseLineInput
} from '@shared/types'
import { createDomainStore } from './store'

const builtinLines: BuiltinLine[] = builtinLineFileSchema.parse(builtinData)

const store = createDomainStore({
  name: 'lines',
  schema: linesFileSchema,
  fallback: (): LinesFile => ({ builtinOverrides: {}, custom: [], health: {} })
})

const isBuiltin = (id: string): boolean => builtinLines.some((line) => line.id === id)

function resolveAll(file: LinesFile): ParseLine[] {
  const builtin: ParseLine[] = builtinLines.map((line, index) => {
    const override = file.builtinOverrides[line.id]
    const health = file.health[line.id]
    return {
      id: line.id,
      name: override?.name ?? line.name,
      endpoint: line.endpoint,
      joinMode: line.joinMode,
      note: line.note,
      builtin: true,
      enabled: override?.enabled ?? true,
      order: override?.order ?? index,
      status: health?.status ?? 'unknown',
      latencyMs: health?.latencyMs,
      checkedAt: health?.checkedAt
    }
  })

  const custom: ParseLine[] = file.custom.map((line) => {
    const health = file.health[line.id]
    return {
      ...line,
      status: health?.status ?? line.status,
      latencyMs: health?.latencyMs ?? line.latencyMs,
      checkedAt: health?.checkedAt ?? line.checkedAt
    }
  })

  return [...builtin, ...custom].sort((a, b) => a.order - b.order)
}

function list(): ParseLine[] {
  return resolveAll(store.read())
}

function enabled(): ParseLine[] {
  return list().filter((line) => line.enabled)
}

function findOne(id: string): ParseLine {
  const line = list().find((item) => item.id === id)
  if (!line) {
    throw new Error(`线路不存在：${id}`)
  }
  return line
}

function nextOrder(file: LinesFile): number {
  const orders = [
    ...builtinLines.map((line, index) => file.builtinOverrides[line.id]?.order ?? index),
    ...file.custom.map((line) => line.order)
  ]
  return orders.reduce((max, order) => Math.max(max, order), -1) + 1
}

function upsert(raw: ParseLineInput): ParseLine {
  const input = parseLineInputSchema.parse(raw)
  const file = store.read()

  if (input.id && isBuiltin(input.id)) {
    file.builtinOverrides[input.id] = {
      ...file.builtinOverrides[input.id],
      name: input.name
    }
    store.write(file)
    return findOne(input.id)
  }

  if (input.id) {
    const index = file.custom.findIndex((line) => line.id === input.id)
    if (index < 0) {
      throw new Error(`线路不存在：${input.id}`)
    }
    file.custom[index] = {
      ...file.custom[index],
      name: input.name,
      endpoint: input.endpoint,
      joinMode: input.joinMode,
      note: input.note
    }
    store.write(file)
    return file.custom[index]
  }

  const created: ParseLine = {
    id: randomUUID(),
    name: input.name,
    endpoint: input.endpoint,
    joinMode: input.joinMode,
    note: input.note,
    builtin: false,
    enabled: true,
    order: nextOrder(file),
    status: 'unknown'
  }
  file.custom.push(created)
  store.write(file)
  return created
}

function remove(id: string): ParseLine[] {
  if (isBuiltin(id)) {
    throw new Error('内置线路不可删除，可以将其禁用')
  }
  const file = store.read()
  file.custom = file.custom.filter((line) => line.id !== id)
  delete file.health[id]
  store.write(file)
  return list()
}

function toggle(id: string, value: boolean): ParseLine[] {
  const file = store.read()
  if (isBuiltin(id)) {
    file.builtinOverrides[id] = { ...file.builtinOverrides[id], enabled: value }
  } else {
    const target = file.custom.find((line) => line.id === id)
    if (!target) {
      throw new Error(`线路不存在：${id}`)
    }
    target.enabled = value
  }
  store.write(file)
  return list()
}

function reorder(ids: string[]): ParseLine[] {
  const file = store.read()
  ids.forEach((id, index) => {
    if (isBuiltin(id)) {
      file.builtinOverrides[id] = { ...file.builtinOverrides[id], order: index }
      return
    }
    const target = file.custom.find((line) => line.id === id)
    if (target) {
      target.order = index
    }
  })
  store.write(file)
  return list()
}

function applyHealth(health: Record<string, LineHealth>): void {
  const file = store.read()
  file.health = { ...file.health, ...health }
  store.write(file)
}

function importJson(json: string, replaceEndpoints: string[] = []): ImportResult {
  const plan = resolveLineImport(list(), json, replaceEndpoints)
  if (plan.additions.length === 0 && plan.updates.length === 0) {
    return {
      imported: plan.imported,
      replaced: plan.replaced,
      kept: plan.kept,
      skipped: plan.skipped
    }
  }

  const file = store.read()
  for (const candidate of plan.additions) {
    file.custom.push({
      id: randomUUID(),
      name: candidate.name,
      endpoint: candidate.endpoint,
      joinMode: candidate.joinMode,
      note: candidate.note,
      builtin: false,
      enabled: true,
      order: nextOrder(file),
      status: 'unknown'
    })
  }
  for (const update of plan.updates) {
    if (update.builtin) {
      file.builtinOverrides[update.id] = {
        ...file.builtinOverrides[update.id],
        name: update.incoming.name
      }
      continue
    }
    const index = file.custom.findIndex((line) => line.id === update.id)
    if (index < 0) continue
    file.custom[index] = {
      ...file.custom[index],
      name: update.incoming.name,
      endpoint: update.incoming.endpoint,
      joinMode: update.incoming.joinMode,
      note: update.incoming.note
    }
  }
  store.write(file)
  return {
    imported: plan.imported,
    replaced: plan.replaced,
    kept: plan.kept,
    skipped: plan.skipped
  }
}

function exportJson(): string {
  const payload = list().map(({ name, endpoint, joinMode, note }) => ({
    name,
    endpoint,
    joinMode,
    note
  }))
  return JSON.stringify(payload, null, 2)
}

function resetBuiltin(): ParseLine[] {
  const file = store.read()
  file.builtinOverrides = {}
  store.write(file)
  return list()
}

function resetAll(): ParseLine[] {
  store.reset()
  return list()
}

export const lineService = {
  list,
  enabled,
  findOne,
  upsert,
  remove,
  toggle,
  reorder,
  applyHealth,
  importJson,
  exportJson,
  resetBuiltin,
  resetAll
}
