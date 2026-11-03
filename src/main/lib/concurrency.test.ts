import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from './concurrency'

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('mapWithConcurrency', () => {
  it('保持结果与输入顺序一致', async () => {
    const items = [30, 10, 20, 5]
    const results = await mapWithConcurrency(items, 2, async (ms) => {
      await delay(ms)
      return ms * 2
    })
    expect(results).toEqual([60, 20, 40, 10])
  })

  it('并发数不超过上限', async () => {
    let running = 0
    let peak = 0
    await mapWithConcurrency(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async () => {
        running += 1
        peak = Math.max(peak, running)
        await delay(5)
        running -= 1
        return null
      }
    )
    expect(peak).toBe(3)
  })

  it('上限大于条目数时按条目数并发', async () => {
    let peak = 0
    let running = 0
    await mapWithConcurrency([1, 2], 10, async () => {
      running += 1
      peak = Math.max(peak, running)
      await delay(5)
      running -= 1
      return null
    })
    expect(peak).toBe(2)
  })

  it('上限为 0 或负数时仍然串行执行完', async () => {
    expect(await mapWithConcurrency([1, 2, 3], 0, async (item) => item)).toEqual([1, 2, 3])
    expect(await mapWithConcurrency([1, 2, 3], -1, async (item) => item)).toEqual([1, 2, 3])
  })

  it('空数组直接返回空数组', async () => {
    expect(await mapWithConcurrency([], 3, async () => 1)).toEqual([])
  })

  it('任务抛错时整体 reject', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) throw new Error('boom')
        return item
      })
    ).rejects.toThrow('boom')
  })
})
