import { net } from 'electron'
import { extractVideoTitle } from '@shared/video-title'
import { logger } from './logger'

const TITLE_TIMEOUT_MS = 2500
const TITLE_MAX_BYTES = 256 * 1024
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * 读取视频页开头的 HTML，抽出作品名。
 * 解析页标题通常是线路自己的名字，不能用来说明这条链接是什么。
 * 失败或超时都返回空字符串，调用方继续记一条没有标题的历史。
 */
export async function fetchVideoTitle(videoUrl: string): Promise<string> {
  try {
    const response = await net.fetch(videoUrl, {
      signal: AbortSignal.timeout(TITLE_TIMEOUT_MS),
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'User-Agent': BROWSER_USER_AGENT
      }
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      return ''
    }
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      await response.body?.cancel().catch(() => undefined)
      return ''
    }
    const bytes = await readUpTo(response, TITLE_MAX_BYTES)
    return extractVideoTitle(decodeHtml(bytes, contentType))
  } catch {
    logger.debug(`[history] 读取视频标题失败：${videoUrl}`)
    return ''
  }
}

async function readUpTo(response: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()

  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read()
      if (done || !value) break
      const room = maxBytes - total
      const slice = value.byteLength > room ? value.subarray(0, room) : value
      chunks.push(slice)
      total += slice.byteLength
      if (includesHeadEnd(chunks)) break
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }

  const buffer = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }
  return buffer
}

function includesHeadEnd(chunks: Uint8Array[]): boolean {
  const tail = chunks.at(-1)
  if (!tail) return false
  const previous = chunks.length > 1 ? chunks[chunks.length - 2] : undefined
  const overlap = previous ? previous.subarray(Math.max(0, previous.length - 16)) : undefined
  const window = overlap ? concatBytes(overlap, tail) : tail
  return /<\/head>/i.test(Buffer.from(window).toString('latin1'))
}

function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  const out = new Uint8Array(left.length + right.length)
  out.set(left, 0)
  out.set(right, left.length)
  return out
}

function decodeHtml(bytes: Uint8Array, contentType: string): string {
  const sniff = new TextDecoder('utf-8').decode(bytes.subarray(0, 4096))
  const meta = /<meta[^>]+charset=["']?\s*([\w-]+)/i.exec(sniff)?.[1]
  const header = /charset=["']?\s*([\w-]+)/i.exec(contentType)?.[1]
  const charset = normalizeCharset(meta || header || 'utf-8')
  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function normalizeCharset(charset: string): string {
  const name = charset.trim().toLowerCase()
  if (name === 'gbk' || name === 'gb2312' || name === 'gb18030') return 'gb18030'
  return name === 'utf8' ? 'utf-8' : name
}
