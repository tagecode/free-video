import { describe, expect, it } from 'vitest'
import {
  NO_ENABLED_LINE,
  isPlayRequest,
  pickPlayLineId,
  playRequestState,
  returnToPlayer
} from './return-to-player'

const lines = [
  { id: 'line-a', enabled: true },
  { id: 'line-b', enabled: true },
  { id: 'line-off', enabled: false }
]

describe('pickPlayLineId', () => {
  it('历史记录里的线路仍启用时优先使用', () => {
    expect(pickPlayLineId(lines, ['line-b', 'line-a'])).toBe('line-b')
  })

  it('指定线路已禁用时退到上次使用的线路', () => {
    expect(pickPlayLineId(lines, ['line-off', 'line-a'])).toBe('line-a')
  })

  it('没有可用的指定线路时用第一条启用的线路', () => {
    expect(pickPlayLineId(lines, [undefined, 'missing'])).toBe('line-a')
  })

  it('一条都没启用时返回空', () => {
    expect(pickPlayLineId([{ id: 'line-off', enabled: false }], ['line-off'])).toBe('')
  })
})

describe('returnToPlayer', () => {
  it('没有启用线路时只跳回解析页并带上地址和提示', async () => {
    const opened: string[] = []
    let state: unknown
    await returnToPlayer({
      videoUrl: 'https://v.qq.com/x/cover/a.html',
      lines: [{ id: 'line-off', enabled: false }],
      lastLineId: 'line-off',
      open: async (videoUrl, lineId) => {
        opened.push(`${videoUrl}:${lineId}`)
        return { failure: null, lineId }
      },
      patchSettings: async () => undefined,
      navigate: (_path, options) => {
        state = options.state
      }
    })
    expect(opened).toEqual([])
    expect(isPlayRequest(state)).toBe(true)
    if (!isPlayRequest(state)) return
    expect(state.videoUrl).toBe('https://v.qq.com/x/cover/a.html')
    expect(state.error).toBe(NO_ENABLED_LINE)
  })

  it('收藏和历史走同一条路径：先记下线路，再打开，再带着地址跳回', async () => {
    const patches: string[] = []
    const opened: string[] = []
    let state: unknown
    await returnToPlayer({
      videoUrl: 'https://v.qq.com/x/cover/b.html',
      lines,
      preferredLineId: 'line-off',
      lastLineId: 'line-b',
      open: async (videoUrl, lineId) => {
        opened.push(`${videoUrl}:${lineId}`)
        return { failure: '解析失败', lineId: null }
      },
      patchSettings: async (patch) => {
        patches.push(patch.lastLineId)
      },
      navigate: (_path, options) => {
        state = options.state
      }
    })
    expect(patches).toEqual(['line-b'])
    expect(opened).toEqual(['https://v.qq.com/x/cover/b.html:line-b'])
    if (!isPlayRequest(state)) throw new Error('missing play request')
    expect(state.videoUrl).toBe('https://v.qq.com/x/cover/b.html')
    expect(state.error).toBe('解析失败')
  })

  it('实际播到别的线路时，跳回前改成那一条', async () => {
    const patches: string[] = []
    await returnToPlayer({
      videoUrl: 'https://v.qq.com/x/cover/c.html',
      lines,
      preferredLineId: 'line-a',
      open: async () => ({ failure: null, lineId: 'line-b' }),
      patchSettings: async (patch) => {
        patches.push(patch.lastLineId)
      },
      navigate: () => undefined
    })
    expect(patches).toEqual(['line-a', 'line-b'])
  })
})

describe('playRequestState', () => {
  it('带上可识别的 nonce', () => {
    const state = playRequestState('https://example.com/a', null)
    expect(isPlayRequest(state)).toBe(true)
    expect(state.videoUrl).toBe('https://example.com/a')
    expect(state.error).toBeNull()
  })
})
