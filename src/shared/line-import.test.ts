import { describe, expect, it } from 'vitest'
import { classifyLineImport, formatImportResult, resolveLineImport } from './line-import'

const existing = [
  {
    id: 'builtin-00',
    name: '线路 OK',
    endpoint: 'https://video.isyour.love/player/getplayer?url=',
    builtin: true
  },
  {
    id: 'custom-1',
    name: '我的线路',
    endpoint: 'https://jx.example/?url=',
    builtin: false
  }
]

describe('classifyLineImport', () => {
  it('分出新线路，并跳过格式不对和文件内重复的条目', () => {
    const json = JSON.stringify([
      { name: '新线路', endpoint: 'https://new.example/?url=', joinMode: 'prefix' },
      { name: '坏掉的' },
      { name: '重复', endpoint: 'https://new.example/?url=', joinMode: 'prefix' }
    ])

    expect(classifyLineImport(json, existing)).toMatchObject({
      fresh: [{ name: '新线路', endpoint: 'https://new.example/?url=', joinMode: 'prefix' }],
      conflicts: [],
      skipped: 2
    })
  })

  it('相同地址视为冲突，并标出内置线路', () => {
    const json = JSON.stringify([
      {
        name: '改名后的 OK',
        endpoint: 'https://video.isyour.love/player/getplayer?url=',
        joinMode: 'prefix'
      }
    ])
    const { conflicts } = classifyLineImport(json, existing)
    expect(conflicts).toEqual([
      {
        endpoint: 'https://video.isyour.love/player/getplayer?url=',
        existingName: '线路 OK',
        builtin: true,
        incoming: {
          name: '改名后的 OK',
          endpoint: 'https://video.isyour.love/player/getplayer?url=',
          joinMode: 'prefix'
        }
      }
    ])
  })

  it('不是数组时拒绝导入', () => {
    expect(() => classifyLineImport('{}', existing)).toThrow('导入内容必须是线路数组')
  })
})

describe('resolveLineImport', () => {
  const json = JSON.stringify([
    { name: '新线路', endpoint: 'https://new.example/?url=', joinMode: 'prefix' },
    {
      name: '覆盖我的线路',
      endpoint: 'https://jx.example/?url=',
      joinMode: 'template',
      note: '备用'
    }
  ])

  it('未选择的冲突保留现有线路', () => {
    const plan = resolveLineImport(existing, json, [])
    expect(plan.imported).toBe(1)
    expect(plan.replaced).toBe(0)
    expect(plan.kept).toBe(1)
    expect(plan.updates).toEqual([])
  })

  it('选中的冲突按导入内容覆盖', () => {
    const plan = resolveLineImport(existing, json, ['https://jx.example/?url='])
    expect(plan.replaced).toBe(1)
    expect(plan.kept).toBe(0)
    expect(plan.updates).toEqual([
      {
        id: 'custom-1',
        builtin: false,
        incoming: {
          name: '覆盖我的线路',
          endpoint: 'https://jx.example/?url=',
          joinMode: 'template',
          note: '备用'
        }
      }
    ])
  })
})

describe('formatImportResult', () => {
  it('只列出实际发生的数量', () => {
    expect(formatImportResult({ imported: 2, replaced: 0, kept: 0, skipped: 0 })).toBe('导入 2 条')
    expect(formatImportResult({ imported: 1, replaced: 1, kept: 2, skipped: 1 })).toBe(
      '导入 1 条，覆盖 1 条，保留 2 条，跳过 1 条'
    )
  })
})
