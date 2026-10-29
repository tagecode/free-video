import { APP_NAME } from '@shared/constants'
import type { AppInfo, Settings, UpdateStatus } from '@shared/types'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { useSettingsStore } from '@/store/settings'

function Row({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="min-w-0">
        <p className="text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const patch = useSettingsStore((state) => state.patch)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [update, setUpdate] = useState<UpdateStatus | null>(null)

  useEffect(() => {
    void api.app.info().then(setInfo)
    return api.updater.onStatus(setUpdate)
  }, [])

  const set = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    void patch({ [key]: value } as Partial<Settings>)
  }

  const checkUpdate = async (): Promise<void> => {
    setUpdate({ state: 'checking' })
    setUpdate(await api.updater.check())
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <header>
        <h1 className="text-lg font-semibold">设置</h1>
        <p className="text-xs text-muted-foreground">修改后立即生效并持久化到本地</p>
      </header>

      <section className="rounded-xl border px-4 py-2">
        <h2 className="pt-2 text-xs font-medium text-muted-foreground">外观</h2>
        <Row title="主题" description="跟随系统或手动指定明暗">
          <Select
            value={settings.theme}
            onValueChange={(value) => set('theme', value as Settings['theme'])}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">跟随系统</SelectItem>
              <SelectItem value="light">浅色</SelectItem>
              <SelectItem value="dark">深色</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </section>

      <section className="rounded-xl border px-4 py-2">
        <h2 className="pt-2 text-xs font-medium text-muted-foreground">播放</h2>
        <Row title="自动降级" description="当前线路失败时自动尝试下一条">
          <Switch
            checked={settings.autoFallback}
            onCheckedChange={(value) => set('autoFallback', value)}
          />
        </Row>
        <Separator />
        <Row
          title="选中线路后立即切换"
          description="播放中在下拉框换线路时直接重新解析；关闭则需再点「开始播放」"
        >
          <Switch
            checked={settings.switchLineOnSelect}
            onCheckedChange={(value) => set('switchLineOnSelect', value)}
          />
        </Row>
        <Separator />
        <Row title="最大尝试线路数" description="自动降级时最多尝试的线路数量（1-10）">
          <Input
            type="number"
            min={1}
            max={10}
            className="w-24"
            value={settings.maxFallbackAttempts}
            onChange={(event) => set('maxFallbackAttempts', Number(event.target.value) || 1)}
          />
        </Row>
        <Separator />
        <Row title="播放超时" description="单条线路等待加载的最长毫秒数（5000-60000）">
          <Input
            type="number"
            min={5000}
            max={60000}
            step={1000}
            className="w-28"
            value={settings.playTimeoutMs}
            onChange={(event) => set('playTimeoutMs', Number(event.target.value) || 15000)}
          />
        </Row>
      </section>

      <section className="rounded-xl border px-4 py-2">
        <h2 className="pt-2 text-xs font-medium text-muted-foreground">线路检测</h2>
        <Row title="检测超时" description="单条线路探测的最长毫秒数（3000-20000）">
          <Input
            type="number"
            min={3000}
            max={20000}
            step={1000}
            className="w-28"
            value={settings.healthTimeoutMs}
            onChange={(event) => set('healthTimeoutMs', Number(event.target.value) || 8000)}
          />
        </Row>
      </section>

      <section className="rounded-xl border px-4 py-2">
        <h2 className="pt-2 text-xs font-medium text-muted-foreground">网络</h2>
        <Row title="代理模式" description="作用于主界面与播放器会话">
          <Select
            value={settings.proxyMode}
            onValueChange={(value) => set('proxyMode', value as Settings['proxyMode'])}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">跟随系统</SelectItem>
              <SelectItem value="none">不使用</SelectItem>
              <SelectItem value="manual">手动</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        {settings.proxyMode === 'manual' && (
          <>
            <Separator />
            <Row title="代理地址" description="例如 http://127.0.0.1:7890">
              <Input
                className="w-64"
                value={settings.proxyUrl}
                onChange={(event) => set('proxyUrl', event.target.value)}
              />
            </Row>
          </>
        )}
      </section>

      <section className="rounded-xl border px-4 py-2">
        <h2 className="pt-2 text-xs font-medium text-muted-foreground">关于</h2>
        <Row title={`${APP_NAME} ${info?.version ?? ''}`} description={info?.platform}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {update?.state === 'checking'
                ? '检查中…'
                : update?.state === 'none'
                  ? '已是最新'
                  : update?.state === 'available'
                    ? `发现新版本 ${update.version}`
                    : update?.state === 'downloading'
                      ? `下载中 ${update.percent ?? 0}%`
                      : update?.state === 'downloaded'
                        ? '下载完成，重启安装'
                        : (update?.message ?? '')}
            </span>
            {update?.state === 'downloaded' ? (
              <Button size="sm" onClick={() => void api.updater.install()}>
                重启安装
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => void checkUpdate()}>
                检查更新
              </Button>
            )}
          </div>
        </Row>
        <Separator />
        <Row title="数据目录" description={info?.userDataPath}>
          <Label className="text-xs text-muted-foreground">
            settings / lines / history / favorites
          </Label>
        </Row>
      </section>

      <p className="pb-4 text-[11px] leading-relaxed text-muted-foreground">
        本软件仅作为第三方网页的播放容器，不存储、不转码、不分发任何视频内容。请遵守所在地区法律法规，支持正版内容。
      </p>
    </div>
  )
}
