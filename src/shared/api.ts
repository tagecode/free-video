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

export interface AppApi {
  app: {
    info: () => Promise<AppInfo>
  }
  settings: {
    get: () => Promise<Settings>
    patch: (patch: Partial<Settings>) => Promise<Settings>
  }
  lines: {
    list: () => Promise<ParseLine[]>
    upsert: (input: ParseLineInput) => Promise<ParseLine>
    remove: (id: string) => Promise<ParseLine[]>
    toggle: (id: string, enabled: boolean) => Promise<ParseLine[]>
    reorder: (ids: string[]) => Promise<ParseLine[]>
    check: (ids?: string[]) => Promise<Record<string, LineHealth>>
    importJson: (json: string) => Promise<ImportResult>
    exportJson: () => Promise<string>
    resetBuiltin: () => Promise<ParseLine[]>
    onHealthChanged: (callback: (health: Record<string, LineHealth>) => void) => () => void
    onChanged: (callback: (lines: ParseLine[]) => void) => () => void
  }
  player: {
    open: (input: OpenPlayerRequest) => Promise<PlayResult>
    close: () => Promise<PlayResult>
    reload: () => Promise<void>
    setBounds: (rect: Rect) => Promise<void>
    setVisible: (visible: boolean) => Promise<void>
    toggleFullscreen: () => Promise<void>
    onState: (callback: (status: PlayerStatus) => void) => () => void
  }
  history: {
    list: () => Promise<HistoryItem[]>
    add: (input: HistoryItemInput) => Promise<HistoryItem[]>
    remove: (id: string) => Promise<HistoryItem[]>
    clear: () => Promise<HistoryItem[]>
  }
  favorites: {
    list: () => Promise<FavoriteItem[]>
    add: (input: FavoriteInput) => Promise<FavoriteItem[]>
    remove: (id: string) => Promise<FavoriteItem[]>
  }
  updater: {
    check: () => Promise<UpdateStatus>
    install: () => Promise<void>
    onStatus: (callback: (status: UpdateStatus) => void) => () => void
  }
}
