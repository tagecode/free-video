import { clipboard, type BrowserWindow } from 'electron'
import { readClipboardVideoUrl } from '@shared/clipboard-url'
import { NOTIFY } from '@shared/ipc'
import { broadcast } from '../ipc/broadcast'

const POLL_MS = 1000

let lastText: string | null = null
let timer: NodeJS.Timeout | null = null

async function publish(): Promise<void> {
  const text = await clipboard.readText()
  if (text === lastText) return
  lastText = text
  broadcast(NOTIFY.clipboardSuggestion, readClipboardVideoUrl(text))
}

/** 窗口在前台时轮询剪贴板。系统没有跨平台的剪贴板变化事件。 */
export function attachClipboardWatch(window: BrowserWindow): void {
  const stop = (): void => {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  const start = (): void => {
    if (timer || window.isDestroyed()) return
    timer = setInterval(() => {
      if (window.isDestroyed() || !window.isFocused()) return
      void publish()
    }, POLL_MS)
    if (window.isFocused()) void publish()
  }

  window.on('focus', start)
  window.on('blur', stop)
  window.on('closed', stop)
  if (window.isFocused()) start()
}
