import { BrowserWindow, WebContentsView, session, shell } from 'electron'
import { PLAYER_PARTITION } from '@shared/constants'
import { buildParseUrl } from '@shared/join-url'
import { NOTIFY } from '@shared/ipc'
import type { OpenPlayerInput, PlayResult, PlayerStatus, Rect } from '@shared/types'
import { logger } from './logger'

type LoadOutcome = 'ok' | 'fail'

class PlayerService {
  private window: BrowserWindow | null = null
  private view: WebContentsView | null = null
  private status: PlayerStatus = { state: 'idle' }
  private attempt = 0

  attach(window: BrowserWindow): void {
    this.window = window
    const playerSession = session.fromPartition(PLAYER_PARTITION)
    playerSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  }

  private ensureView(): WebContentsView {
    if (this.view && !this.view.webContents.isDestroyed()) {
      return this.view
    }
    if (!this.window) {
      throw new Error('播放器尚未绑定主窗口')
    }

    const view = new WebContentsView({
      webPreferences: {
        partition: PLAYER_PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    })

    view.setBackgroundColor('#000000')
    view.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) {
        void shell.openExternal(url)
      }
      return { action: 'deny' }
    })
    view.webContents.on('will-navigate', (event, url) => {
      if (!/^https?:/i.test(url)) {
        event.preventDefault()
      }
    })

    this.window.contentView.addChildView(view)
    this.view = view
    return view
  }

  private emit(status: PlayerStatus): void {
    this.status = status
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(NOTIFY.playerState, status)
    }
  }

  private loadOnce(url: string, timeoutMs: number): Promise<LoadOutcome> {
    const contents = this.ensureView().webContents

    return new Promise<LoadOutcome>((resolve) => {
      const cleanup = (): void => {
        clearTimeout(timer)
        contents.off('did-finish-load', onFinish)
        contents.off('did-fail-load', onFail)
      }
      const timer = setTimeout(() => {
        cleanup()
        resolve('fail')
      }, timeoutMs)

      function onFinish(): void {
        cleanup()
        resolve('ok')
      }

      function onFail(
        _event: Electron.Event,
        _code: number,
        _description: string,
        _validatedUrl: string,
        isMainFrame: boolean
      ): void {
        if (!isMainFrame) {
          return
        }
        cleanup()
        resolve('fail')
      }

      contents.once('did-finish-load', onFinish)
      contents.on('did-fail-load', onFail)
      void contents.loadURL(url).catch(() => {
        /* 失败统一由 did-fail-load 上报 */
      })
    })
  }

  async open(input: OpenPlayerInput): Promise<PlayResult> {
    const candidates = input.lines.filter((line) => line.enabled)
    if (candidates.length === 0) {
      this.emit({ state: 'failed', error: '没有可用的解析线路' })
      return { ok: false, error: '没有可用的解析线路' }
    }

    this.ensureView().setVisible(true)
    const token = ++this.attempt

    for (const [index, line] of candidates.entries()) {
      if (token !== this.attempt) {
        return { ok: false, error: '已取消' }
      }

      const playUrl = buildParseUrl(line, input.videoUrl)
      this.emit({
        state: 'loading',
        lineId: line.id,
        videoUrl: input.videoUrl,
        playUrl,
        attempt: index + 1
      })

      const outcome = await this.loadOnce(playUrl, input.timeoutMs)
      if (token !== this.attempt) {
        return { ok: false, error: '已取消' }
      }
      if (outcome === 'ok') {
        this.emit({
          state: 'playing',
          lineId: line.id,
          videoUrl: input.videoUrl,
          playUrl,
          attempt: index + 1
        })
        return { ok: true, lineId: line.id, playUrl }
      }
      logger.warn(`[player] 线路 ${line.name} 播放超时或失败，尝试下一条`)
    }

    this.emit({ state: 'failed', videoUrl: input.videoUrl, error: '所有线路均播放失败' })
    return { ok: false, error: '所有线路均播放失败' }
  }

  close(): PlayResult {
    this.attempt += 1
    if (this.view && !this.view.webContents.isDestroyed()) {
      this.view.setVisible(false)
      this.view.webContents.stop()
    }
    this.emit({ state: 'idle' })
    return { ok: true }
  }

  reload(): void {
    this.view?.webContents.reload()
  }

  setBounds(rect: Rect): void {
    this.view?.setBounds({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }

  setVisible(visible: boolean): void {
    this.view?.setVisible(visible)
  }

  toggleFullscreen(): void {
    if (!this.window) {
      return
    }
    this.window.setFullScreen(!this.window.isFullScreen())
  }

  currentStatus(): PlayerStatus {
    return this.status
  }
}

export const playerService = new PlayerService()
