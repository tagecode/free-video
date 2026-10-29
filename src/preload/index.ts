import { contextBridge, ipcRenderer } from 'electron'
import type { AppApi } from '@shared/api'
import { NOTIFY } from '@shared/ipc'
import type { LineHealth, ParseLine, PlayerStatus, UpdateStatus } from '@shared/types'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.off(channel, listener)
}

const api: AppApi = {
  app: {
    info: () => ipcRenderer.invoke('app:info')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    patch: (patch) => ipcRenderer.invoke('settings:patch', patch)
  },
  lines: {
    list: () => ipcRenderer.invoke('lines:list'),
    upsert: (input) => ipcRenderer.invoke('lines:upsert', input),
    remove: (id) => ipcRenderer.invoke('lines:remove', id),
    toggle: (id, enabled) => ipcRenderer.invoke('lines:toggle', id, enabled),
    reorder: (ids) => ipcRenderer.invoke('lines:reorder', ids),
    check: (ids) => ipcRenderer.invoke('lines:check', ids),
    importJson: (json) => ipcRenderer.invoke('lines:import', json),
    exportJson: () => ipcRenderer.invoke('lines:export'),
    resetBuiltin: () => ipcRenderer.invoke('lines:reset-builtin'),
    onHealthChanged: (callback) =>
      subscribe<Record<string, LineHealth>>(NOTIFY.linesHealth, callback),
    onChanged: (callback) => subscribe<ParseLine[]>(NOTIFY.linesChanged, callback)
  },
  player: {
    open: (input) => ipcRenderer.invoke('player:open', input),
    close: () => ipcRenderer.invoke('player:close'),
    reload: () => ipcRenderer.invoke('player:reload'),
    setBounds: (rect) => ipcRenderer.invoke('player:set-bounds', rect),
    setVisible: (visible) => ipcRenderer.invoke('player:set-visible', visible),
    toggleFullscreen: () => ipcRenderer.invoke('player:toggle-fullscreen'),
    onState: (callback) => subscribe<PlayerStatus>(NOTIFY.playerState, callback)
  },
  history: {
    list: () => ipcRenderer.invoke('history:list'),
    add: (input) => ipcRenderer.invoke('history:add', input),
    remove: (id) => ipcRenderer.invoke('history:remove', id),
    clear: () => ipcRenderer.invoke('history:clear')
  },
  favorites: {
    list: () => ipcRenderer.invoke('favorites:list'),
    add: (input) => ipcRenderer.invoke('favorites:add', input),
    remove: (id) => ipcRenderer.invoke('favorites:remove', id)
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback) => subscribe<UpdateStatus>(NOTIFY.updaterStatus, callback)
  }
}

contextBridge.exposeInMainWorld('api', api)
