import { isHttpUrl } from './join-url'
import { detectPlatform } from './platform'

/** 从剪贴板文本里取出一条已识别平台的视频页地址；没有则返回 null。 */
export function readClipboardVideoUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i)
  if (!match) return null
  const candidate = match[0].replace(/[),.;。！？，、]+$/u, '')
  if (!isHttpUrl(candidate) || !detectPlatform(candidate)) return null
  return candidate
}
