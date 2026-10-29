import { settingsSchema } from './schemas'

export const APP_NAME = 'Free Video'
export const PLAYER_PARTITION = 'persist:player'

export const MAX_HISTORY = 100
export const HEALTH_CONCURRENCY = 6
export const LINE_FAIL_THRESHOLD = 2
export const LINE_FAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000
// 解析页普遍靠 JS 二次渲染，did-finish-load 后需留时间再判断是否为空白页
export const BLANK_PROBE_DELAY_MS = 1200

export const DEFAULT_SETTINGS = settingsSchema.parse({})

export const DISCLAIMER_TEXT = [
  '本软件仅作为第三方网页的播放容器，不存储、不转码、不分发任何视频内容。',
  '解析线路由第三方服务提供，其可用性、合法性与内容安全由该服务自行负责。',
  '请遵守所在地区法律法规，支持正版内容。因使用本软件产生的一切后果由使用者自行承担。'
].join('\n')
