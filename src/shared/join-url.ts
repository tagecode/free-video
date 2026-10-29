import type { ParseLine } from './schemas'

export function buildParseUrl(
  line: Pick<ParseLine, 'endpoint' | 'joinMode'>,
  videoUrl: string
): string {
  const encoded = encodeURIComponent(videoUrl.trim())
  if (line.joinMode === 'template') {
    return line.endpoint.replace('{url}', encoded)
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
