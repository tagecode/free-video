import type {
  AppInfo,
  FavoriteInput,
  FavoriteItem,
  HistoryItem,
  HistoryItemInput,
  ImportResult,
  LineHealth,
  OpenPlayerRequest,
  ParseLine,
  ParseLineInput,
  PlayResult,
  PlayerStatus,
  Rect,
  Settings,
  UpdateStatus
} from './types'

export interface IpcContract {
  'app:info': () => AppInfo

  'settings:get': () => Settings
  'settings:patch': (patch: Partial<Settings>) => Settings

  'lines:list': () => ParseLine[]
  'lines:upsert': (input: ParseLineInput) => ParseLine
  'lines:remove': (id: string) => ParseLine[]
  'lines:toggle': (id: string, enabled: boolean) => ParseLine[]
  'lines:reorder': (ids: string[]) => ParseLine[]
  'lines:check': (ids?: string[]) => Record<string, LineHealth>
  'lines:import': (json: string) => ImportResult
  'lines:export': () => string
  'lines:reset-builtin': () => ParseLine[]

  'player:open': (input: OpenPlayerRequest) => PlayResult
  'player:close': () => PlayResult
  'player:reload': () => void
  'player:set-bounds': (rect: Rect) => void
  'player:set-visible': (visible: boolean) => void
  'player:toggle-fullscreen': () => void

  'history:list': () => HistoryItem[]
  'history:add': (input: HistoryItemInput) => HistoryItem[]
  'history:remove': (id: string) => HistoryItem[]
  'history:clear': () => HistoryItem[]

  'favorites:list': () => FavoriteItem[]
  'favorites:add': (input: FavoriteInput) => FavoriteItem[]
  'favorites:remove': (id: string) => FavoriteItem[]

  'updater:check': () => UpdateStatus
  'updater:install': () => void
}

export type IpcChannel = keyof IpcContract
export type IpcArgs<K extends IpcChannel> = Parameters<IpcContract[K]>
export type IpcReturn<K extends IpcChannel> = ReturnType<IpcContract[K]>

export const NOTIFY = {
  playerState: 'player:state',
  linesHealth: 'lines:health-changed',
  linesChanged: 'lines:changed',
  updaterStatus: 'updater:status'
} as const

export interface PlayerStatePayload {
  status: PlayerStatus
}
