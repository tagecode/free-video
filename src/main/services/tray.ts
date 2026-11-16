import { Menu, Tray, nativeImage } from 'electron'
import { APP_NAME } from '@shared/constants'
import { appIcon } from '../lib/app-icon'
import { logger } from './logger'

interface TrayActions {
  /** 从托盘恢复主窗口；窗口已被关掉时要重建 */
  showMainWindow: () => void
  /** 真正退出应用，不再走关窗询问 */
  quit: () => void
}

let tray: Tray | null = null
let actions: TrayActions | null = null

/** 主窗口的动作由 index.ts 在启动时注入，托盘服务不持有窗口引用 */
export function registerTrayActions(next: TrayActions): void {
  actions = next
}

/**
 * 第一次「最小化到托盘」时创建托盘图标，之后一直保留到应用退出。
 * 返回 null 表示当前环境建不出托盘（缺图标、Linux 没有托盘宿主等），
 * 调用方应退化成最小化窗口，避免窗口被藏起来又找不回来。
 */
export function ensureTray(): Tray | null {
  if (tray) return tray
  if (!actions) return null
  const icon = trayIcon()
  if (!icon) return null

  // Linux 上各桌面环境的托盘实现差异很大，构造也可能直接抛错，
  // 这里兜住，让调用方回退到最小化而不是把关闭流程炸掉。
  try {
    tray = new Tray(icon)
    tray.setToolTip(APP_NAME)
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: '显示主界面', click: () => actions?.showMainWindow() },
        { type: 'separator' },
        { label: '退出', click: () => actions?.quit() }
      ])
    )
    tray.on('click', () => actions?.showMainWindow())
    tray.on('double-click', () => actions?.showMainWindow())
    return tray
  } catch (error) {
    logger.warn('[tray] 托盘图标创建失败，改为最小化窗口', error)
    tray = null
    return null
  }
}

/** 托盘只按 16px 渲染，直接把 1024px 原图丢进去会被系统缩放得发糊；
 * 同时给出 1x/2x 两档，高分屏下也能清晰。 */
function trayIcon(): Electron.NativeImage | null {
  const source = appIcon()
  if (!source) return null
  const image = nativeImage.createEmpty()
  for (const scaleFactor of [1, 2]) {
    const size = 16 * scaleFactor
    image.addRepresentation({
      scaleFactor,
      width: size,
      height: size,
      buffer: source.resize({ width: size, height: size, quality: 'best' }).toPNG()
    })
  }
  return image
}
