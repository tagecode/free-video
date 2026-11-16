import { afterEach, describe, expect, it, vi } from 'vitest'
import { cancelCloseRequest, resolveCloseRequest, waitCloseResponse } from './close-request'

afterEach(() => {
  cancelCloseRequest()
  vi.useRealTimers()
})

describe('waitCloseResponse', () => {
  it('拿到页面的选择', async () => {
    const pending = waitCloseResponse()
    resolveCloseRequest({ action: 'tray', remember: true })
    await expect(pending).resolves.toEqual({ action: 'tray', remember: true })
  })

  it('取消与超时都按"继续使用"处理', async () => {
    const cancelled = waitCloseResponse()
    cancelCloseRequest()
    await expect(cancelled).resolves.toEqual({ action: 'cancel', remember: false })

    vi.useFakeTimers()
    const timedOut = waitCloseResponse(1000)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(timedOut).resolves.toEqual({ action: 'cancel', remember: false })
  })

  it('上一次的等待会被新的请求顶掉，不会串台', async () => {
    const first = waitCloseResponse()
    const second = waitCloseResponse()
    resolveCloseRequest({ action: 'quit', remember: false })
    await expect(first).resolves.toEqual({ action: 'cancel', remember: false })
    await expect(second).resolves.toEqual({ action: 'quit', remember: false })
  })
})
