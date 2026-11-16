import type { CloseResponse } from '@shared/types'

/**
 * 关闭询问是"主进程问、页面答"：主进程拦下 close 后等渲染进程回话。
 * 同一时刻只会有一个待答请求（应用是单窗口）；超时或窗口销毁时按"取消"处理，
 * 宁可让窗口留着，也不在用户没选的情况下把程序关掉。
 */
type Pending = (response: CloseResponse) => void

let pending: Pending | null = null

const CANCEL: CloseResponse = { action: 'cancel', remember: false }

export function waitCloseResponse(timeoutMs = 30_000): Promise<CloseResponse> {
  cancelCloseRequest()
  return new Promise<CloseResponse>((resolve) => {
    const finish: Pending = (response) => {
      clearTimeout(timer)
      if (pending === finish) pending = null
      resolve(response)
    }
    const timer = setTimeout(() => finish(CANCEL), timeoutMs)
    pending = finish
  })
}

export function resolveCloseRequest(response: CloseResponse): void {
  pending?.(response)
}

export function cancelCloseRequest(): void {
  pending?.(CANCEL)
}
