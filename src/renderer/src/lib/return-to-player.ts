interface PlayLine {
  id: string
  enabled: boolean
}

export interface PlayRequest {
  videoUrl: string
  nonce: number
  error?: string | null
}

export const NO_ENABLED_LINE = '请先启用至少一条解析线路'

export function playRequestState(videoUrl: string, error?: string | null): PlayRequest {
  return { videoUrl, nonce: Date.now(), error }
}

export function isPlayRequest(value: unknown): value is PlayRequest {
  if (!value || typeof value !== 'object') return false
  const request = value as PlayRequest
  return typeof request.videoUrl === 'string' && typeof request.nonce === 'number'
}

/** 优先用调用方指定的线路（历史记录里那条），不可用时再退到上次使用，最后用第一条启用的线路。 */
export function pickPlayLineId(lines: PlayLine[], preferred: Array<string | undefined>): string {
  const enabled = lines.filter((line) => line.enabled)
  for (const id of preferred) {
    if (id && enabled.some((line) => line.id === id)) return id
  }
  return enabled[0]?.id ?? ''
}

interface OpenOutcome {
  failure: string | null
  lineId: string | null
}

interface ReturnToPlayerOptions {
  videoUrl: string
  lines: PlayLine[]
  preferredLineId?: string
  lastLineId?: string
  open: (videoUrl: string, lineId: string) => Promise<OpenOutcome>
  patchSettings: (patch: { lastLineId: string }) => Promise<unknown>
  navigate: (path: string, options: { state: PlayRequest }) => void
}

export async function returnToPlayer(options: ReturnToPlayerOptions): Promise<void> {
  const { videoUrl, navigate } = options
  const lineId = pickPlayLineId(options.lines, [options.preferredLineId, options.lastLineId])
  if (!lineId) {
    navigate('/', { state: playRequestState(videoUrl, NO_ENABLED_LINE) })
    return
  }
  await options.patchSettings({ lastLineId: lineId })
  const result = await options.open(videoUrl, lineId)
  if (result.lineId) {
    await options.patchSettings({ lastLineId: result.lineId })
  }
  navigate('/', { state: playRequestState(videoUrl, result.failure) })
}
