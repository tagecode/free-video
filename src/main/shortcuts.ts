import type { BrowserWindow } from 'electron'

/**
 * F11 切换窗口全屏、Esc 退出全屏。
 * 解析页是独立的 WebContentsView，焦点在它里面时按键不会经过主界面，两处都要挂。
 */
export function registerShortcuts(window: BrowserWindow, contents: Electron.WebContents): void {
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.control || input.meta || input.alt) {
      return
    }
    if (input.key === 'F11') {
      event.preventDefault()
      window.setFullScreen(!window.isFullScreen())
      return
    }
    // 不拦截 Esc：主界面的下拉框、对话框还靠它关闭，播放器里的 Esc
    // 也要留给 Chromium 自己退出 HTML 全屏；这里只负责收起窗口全屏。
    if (input.key === 'Escape' && window.isFullScreen()) {
      window.setFullScreen(false)
    }
  })
}
