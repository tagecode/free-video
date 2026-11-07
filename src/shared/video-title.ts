const SITE_SUFFIXES = [
  '腾讯视频',
  '哔哩哔哩',
  'bilibili',
  '爱奇艺',
  '优酷',
  '芒果TV',
  '芒果tv',
  '搜狐视频',
  '乐视视频',
  '乐视网'
]

const GENERIC_TITLES = new Set([
  '腾讯视频',
  '爱奇艺',
  '优酷',
  '芒果tv',
  '哔哩哔哩',
  'bilibili',
  '搜狐视频',
  '乐视视频',
  '乐视网',
  '首页',
  'loading',
  'untitled',
  '404',
  '403',
  '登录',
  '请登录',
  '安全验证',
  '访问验证',
  '在线播放',
  '视频播放',
  '播放器',
  '视频',
  'about:blank',
  'vip解析',
  '免费解析',
  '全网vip解析',
  'vip视频解析'
])

const MAX_TITLE_LENGTH = 120

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => fromCodePoint(Number.parseInt(code, 16)))
}

function fromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripSiteSuffix(title: string): string {
  let current = title
  let changed = true
  while (changed) {
    changed = false
    for (const site of SITE_SUFFIXES) {
      const pattern = new RegExp(`\\s*[-_|｜—–·]\\s*${escapeRegExp(site)}\\s*$`, 'i')
      const next = current.replace(pattern, '').trim()
      if (next && next !== current) {
        current = next
        changed = true
      }
    }
  }
  return current
}

function isUsableTitle(title: string): boolean {
  if (title.length < 2) return false
  if (/^https?:\/\//i.test(title)) return false
  const compact = title.replace(/\s+/g, '').toLowerCase()
  if (GENERIC_TITLES.has(compact)) return false
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(compact)) return false
  return true
}

/** 把页面标题整理成适合放进历史列表的短名称；站点名、解析页壳标题会被丢掉。 */
export function normalizeVideoTitle(raw: string): string {
  const title = stripSiteSuffix(decodeEntities(collapse(raw)))
    .slice(0, MAX_TITLE_LENGTH)
    .trim()
  return isUsableTitle(title) ? title : ''
}

function matchMeta(html: string, key: string): string {
  const escaped = escapeRegExp(key)
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i')
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]?.trim()) return match[1]
  }
  return ''
}

function matchTitle(html: string): string {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
}

/** 从视频页 HTML 里取作品名：分享标题优先，其次是 title。 */
export function extractVideoTitle(html: string): string {
  const candidates = [
    matchMeta(html, 'og:title'),
    matchMeta(html, 'twitter:title'),
    matchTitle(html)
  ]
  for (const raw of candidates) {
    const title = normalizeVideoTitle(raw)
    if (title) return title
  }
  return ''
}
