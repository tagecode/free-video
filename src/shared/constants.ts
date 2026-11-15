import { settingsSchema } from './schemas'

export const APP_NAME = 'Free Video'
export const PROJECT_URL = 'https://github.com/tagecode/free-video'
export const LICENSE_NAME = 'MIT'
export const LICENSE_URL = 'https://github.com/tagecode/free-video/blob/main/LICENSE'
export const PLAYER_PARTITION = 'persist:player'
export const HEALTH_PARTITION = 'persist:health'

// 主进程读不到 CSS 变量，窗口底色和系统窗口按钮的图案色只能在这里镜像一份；
// 取值必须与 src/renderer/src/assets/main.css 的 --background / --muted-foreground 保持一致。
export const WINDOW_CHROME = {
  light: { background: '#f3f4f7', symbol: '#646974' },
  dark: { background: '#0d0f15', symbol: '#9499a0' }
} as const

export const MAX_HISTORY = 100
// 健康检查要真实渲染整页，并发太高会拖慢所有线路的判定
export const HEALTH_CONCURRENCY = 3
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
