export interface PlatformInfo {
  id: string
  name: string
}

const PLATFORMS: { info: PlatformInfo; hosts: string[] }[] = [
  { info: { id: 'tencent', name: '腾讯视频' }, hosts: ['v.qq.com', 'film.qq.com'] },
  { info: { id: 'iqiyi', name: '爱奇艺' }, hosts: ['iqiyi.com'] },
  { info: { id: 'youku', name: '优酷' }, hosts: ['youku.com'] },
  { info: { id: 'mgtv', name: '芒果 TV' }, hosts: ['mgtv.com'] },
  { info: { id: 'bilibili', name: '哔哩哔哩' }, hosts: ['bilibili.com'] },
  { info: { id: 'sohu', name: '搜狐视频' }, hosts: ['tv.sohu.com', 'sohu.com'] },
  { info: { id: 'le', name: '乐视视频' }, hosts: ['le.com'] }
]

export function detectPlatform(videoUrl: string): PlatformInfo | undefined {
  let host: string
  try {
    host = new URL(videoUrl.trim()).hostname.toLowerCase()
  } catch {
    return undefined
  }

  const match = PLATFORMS.find(({ hosts }) =>
    hosts.some((domain) => host === domain || host.endsWith(`.${domain}`))
  )
  return match?.info
}

export function platformLabel(videoUrl: string): string {
  return detectPlatform(videoUrl)?.name ?? '未知平台'
}
