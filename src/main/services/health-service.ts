import { WebContentsView } from 'electron'
import { HEALTH_CONCURRENCY, HEALTH_PARTITION } from '@shared/constants'
import { buildParseUrl } from '@shared/join-url'
import type { LineHealth, ParseLine } from '@shared/types'
import { mapWithConcurrency } from '../lib/concurrency'

const PROBE_VIDEO_URL = 'https://v.qq.com/x/cover/mzc00200mp8vo9b.html'
const PLAYER_SELECTOR = 'video, iframe, canvas, object, embed'
const POLL_INTERVAL_MS = 400

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function hasPlayer(contents: Electron.WebContents): Promise<boolean> {
  return contents
    .executeJavaScript(`!!document.querySelector(${JSON.stringify(PLAYER_SELECTOR)})`, true)
    .then((value) => value === true)
    .catch(() => false)
}

/**
 * 只看 HTTP 状态码会把"返回 200 的空白页 / 只有 JS 外壳的页面"判成可用，
 * 用户照着"可用"去选线路却播不出来。这里真的把解析页渲染一遍，
 * 以页面里是否出现播放器元素为准。
 */
async function probe(line: ParseLine, timeoutMs: number): Promise<LineHealth> {
  const checkedAt = Date.now()
  const view = new WebContentsView({
    webPreferences: {
      partition: HEALTH_PARTITION,
      sandbox: true,
      contextIsolation: true,
      // 探测视图不挂在窗口上，不关掉节流会让渲染与定时器停在后台状态
      backgroundThrottling: false,
      autoplayPolicy: 'document-user-activation-required'
    }
  })
  const contents = view.webContents
  contents.setAudioMuted(true)
  contents.setWindowOpenHandler(() => ({ action: 'deny' as const }))

  let loaded = false
  let failed = false
  contents.once('did-finish-load', () => {
    loaded = true
  })
  contents.on('did-fail-load', (_event, _code, _description, _url, isMainFrame) => {
    if (isMainFrame) {
      failed = true
    }
  })

  void contents.loadURL(buildParseUrl(line, PROBE_VIDEO_URL)).catch(() => {
    failed = true
  })

  const deadline = checkedAt + timeoutMs
  try {
    while (Date.now() < deadline) {
      await delay(POLL_INTERVAL_MS)
      if (failed) {
        return { status: 'fail', checkedAt }
      }
      if (await hasPlayer(contents)) {
        return { status: 'ok', latencyMs: Date.now() - checkedAt, checkedAt }
      }
    }
    // 加载完了却始终没出现播放器元素，说明是空白页；连加载都没完成才是超时
    return { status: loaded ? 'fail' : 'timeout', checkedAt }
  } finally {
    if (!contents.isDestroyed()) {
      contents.close()
    }
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
