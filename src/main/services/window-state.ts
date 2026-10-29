import type { BrowserWindow } from 'electron'
import { windowStateFileSchema } from '@shared/schemas'
import type { WindowStateFile } from '@shared/types'
import { createDomainStore } from './store'

const store = createDomainStore({
  name: 'window-state',
  schema: windowStateFileSchema,
  fallback: (): WindowStateFile => ({ width: 1440, height: 900, maximized: false })
})

export function getWindowState(): WindowStateFile {
  return store.read()
}

export function saveWindowState(window: BrowserWindow): void {
  const bounds = window.getNormalBounds()
  store.write({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized: window.isMaximized()
  })
}
