import { HEALTH_CONCURRENCY } from '@shared/constants'
import { buildParseUrl } from '@shared/join-url'
import type { LineHealth, ParseLine } from '@shared/types'
import { mapWithConcurrency } from '../lib/concurrency'

const PROBE_VIDEO_URL = 'https://v.qq.com/x/cover/mzc00200mp8vo9b.html'
const PROBE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function probe(line: ParseLine, timeoutMs: number): Promise<LineHealth> {
  const checkedAt = Date.now()
  try {
    const response = await fetch(buildParseUrl(line, PROBE_VIDEO_URL), {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': PROBE_UA }
    })
    const latencyMs = Date.now() - checkedAt
    await response.body?.cancel()
    return {
      status: response.status >= 400 ? 'fail' : 'ok',
      latencyMs,
      checkedAt
    }
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    return { status: timedOut ? 'timeout' : 'fail', checkedAt }
  }
}

export async function checkLines(
  lines: ParseLine[],
  timeoutMs: number
): Promise<Record<string, LineHealth>> {
  const results = await mapWithConcurrency(lines, HEALTH_CONCURRENCY, (line) =>
    probe(line, timeoutMs)
  )

  return results.reduce<Record<string, LineHealth>>((acc, health, index) => {
    acc[lines[index].id] = health
    return acc
  }, {})
}
