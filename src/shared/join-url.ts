import type { ParseLine } from './schemas'

/** 线路表单里用来演示拼接结果的示例视频页，不发起真实播放。 */
export const PARSE_PREVIEW_VIDEO_URL = 'https://v.qq.com/x/cover/example.html'

export function previewParseUrl(line: Pick<ParseLine, 'endpoint' | 'joinMode'>): string | null {
  const endpoint = line.endpoint.trim()
  if (!endpoint) return null
  if (line.joinMode === 'template' && !endpoint.includes('{url}')) return null
  return buildParseUrl({ endpoint, joinMode: line.joinMode }, PARSE_PREVIEW_VIDEO_URL)
}

export function buildParseUrl(
  line: Pick<ParseLine, 'endpoint' | 'joinMode'>,
  videoUrl: string
): string {
  const encoded = encodeURIComponent(videoUrl.trim())
  if (line.joinMode === 'template') {
    // 用函数形式替换：字符串替换会把地址里的 `$&` 之类的序列当成替换模式
    return line.endpoint.replace('{url}', () => encoded)
  }
  return `${line.endpoint}${encoded}`
}

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value.trim())
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
