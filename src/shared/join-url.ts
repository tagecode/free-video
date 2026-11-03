import type { ParseLine } from './schemas'

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
