import type { ParseLine } from './schemas'

export type {
  BuiltinLine,
  FavoriteInput,
  FavoriteItem,
  HistoryItem,
  HistoryItemInput,
  JoinMode,
  LineHealth,
  LineStatus,
  LinesFile,
  ParseLine,
  ParseLineInput,
  Settings,
  ThemeMode,
  WindowStateFile
} from './schemas'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'failed'

export interface PlayerStatus {
  state: PlayerState
  lineId?: string
  videoUrl?: string
  playUrl?: string
  attempt?: number
  error?: string
}

export interface OpenPlayerRequest {
  lineId: string
  videoUrl: string
}

export interface OpenPlayerInput {
  lines: ParseLine[]
  videoUrl: string
  timeoutMs: number
}

export interface PlayResult {
  ok: boolean
  lineId?: string
  playUrl?: string
  error?: string
}

export interface ImportResult {
  imported: number
  skipped: number
}

export interface AppInfo {
  version: string
  platform: string
  userDataPath: string
  isDev: boolean
}

export type UpdateState =
  'idle' | 'checking' | 'available' | 'none' | 'downloading' | 'downloaded' | 'error'

export interface UpdateStatus {
  state: UpdateState
  version?: string
  percent?: number
  message?: string
}
