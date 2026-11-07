import { parseLineInputSchema } from './schemas'
import type { JoinMode, ParseLine } from './schemas'
import type { ImportResult } from './types'

export interface ImportCandidate {
  name: string
  endpoint: string
  joinMode: JoinMode
  note?: string
}

export interface ImportConflict {
  endpoint: string
  existingName: string
  builtin: boolean
  incoming: ImportCandidate
}

export interface ClassifiedImport {
  fresh: ImportCandidate[]
  conflicts: ImportConflict[]
  skipped: number
}

export interface ImportUpdate {
  id: string
  builtin: boolean
  incoming: ImportCandidate
}

export interface ResolvedImport {
  additions: ImportCandidate[]
  updates: ImportUpdate[]
  imported: number
  replaced: number
  kept: number
  skipped: number
}

type ExistingLine = Pick<ParseLine, 'id' | 'name' | 'endpoint' | 'builtin'>

function toCandidate(value: unknown): ImportCandidate | null {
  const result = parseLineInputSchema.safeParse(value)
  if (!result.success) return null
  const note = result.data.note?.trim()
  return {
    name: result.data.name,
    endpoint: result.data.endpoint,
    joinMode: result.data.joinMode,
    note: note || undefined
  }
}

/** 把导入 JSON 分成新线路、与现有地址冲突的线路，以及无效或文件内重复的条目。 */
export function classifyLineImport(json: string, existing: ExistingLine[]): ClassifiedImport {
  const parsed: unknown = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new Error('导入内容必须是线路数组')
  }

  const byEndpoint = new Map(existing.map((line) => [line.endpoint, line]))
  const seen = new Set<string>()
  const fresh: ImportCandidate[] = []
  const conflicts: ImportConflict[] = []
  let skipped = 0

  for (const item of parsed) {
    const candidate = toCandidate(item)
    if (!candidate || seen.has(candidate.endpoint)) {
      skipped += 1
      continue
    }
    seen.add(candidate.endpoint)
    const current = byEndpoint.get(candidate.endpoint)
    if (current) {
      conflicts.push({
        endpoint: candidate.endpoint,
        existingName: current.name,
        builtin: current.builtin,
        incoming: candidate
      })
    } else {
      fresh.push(candidate)
    }
  }

  return { fresh, conflicts, skipped }
}

/** 按用户对每条冲突的选择，算出要新增和要覆盖的线路。未选择的冲突保留现有线路。 */
export function resolveLineImport(
  existing: ExistingLine[],
  json: string,
  replaceEndpoints: readonly string[]
): ResolvedImport {
  const classified = classifyLineImport(json, existing)
  const replace = new Set(replaceEndpoints)
  const updates: ImportUpdate[] = []
  let kept = 0

  for (const conflict of classified.conflicts) {
    const current = existing.find((line) => line.endpoint === conflict.endpoint)
    if (!current || !replace.has(conflict.endpoint)) {
      kept += 1
      continue
    }
    updates.push({ id: current.id, builtin: current.builtin, incoming: conflict.incoming })
  }

  return {
    additions: classified.fresh,
    updates,
    imported: classified.fresh.length,
    replaced: updates.length,
    kept,
    skipped: classified.skipped
  }
}

export function formatImportResult(result: ImportResult): string {
  const parts = [`导入 ${result.imported} 条`]
  if (result.replaced > 0) parts.push(`覆盖 ${result.replaced} 条`)
  if (result.kept > 0) parts.push(`保留 ${result.kept} 条`)
  if (result.skipped > 0) parts.push(`跳过 ${result.skipped} 条`)
  return parts.join('，')
}
