import { previewParseUrl } from '@shared/join-url'
import { classifyLineImport, type ImportConflict } from '@shared/line-import'
import { moveLineOrder, type LineMove } from '@shared/line-order'
import type { LineStatus, ParseLine, ParseLineInput } from '@shared/types'
import { cn } from '@/lib/utils'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Download,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/utils'
import { useLinesStore } from '@/store/lines'

const STATUS_TEXT: Record<LineStatus, string> = {
  unknown: '未检测',
  ok: '可用',
  fail: '不可用',
  timeout: '超时',
  unsupported: '不支持'
}

const STATUS_CLASS: Record<LineStatus, string> = {
  unknown: 'bg-muted-foreground/40',
  ok: 'bg-success',
  fail: 'bg-destructive',
  timeout: 'bg-warning',
  unsupported: 'bg-muted-foreground/40'
}

const EMPTY_FORM: ParseLineInput = {
  name: '',
  endpoint: '',
  joinMode: 'prefix',
  note: ''
}

export function LinesPage(): React.JSX.Element {
  const lines = useLinesStore((state) => state.lines)
  const checking = useLinesStore((state) => state.checking)
  const load = useLinesStore((state) => state.load)
  const toggle = useLinesStore((state) => state.toggle)
  const remove = useLinesStore((state) => state.remove)
  const upsert = useLinesStore((state) => state.upsert)
  const check = useLinesStore((state) => state.check)
  const reorder = useLinesStore((state) => state.reorder)
  const resetBuiltin = useLinesStore((state) => state.resetBuiltin)

  const [editing, setEditing] = useState<ParseLine | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ParseLineInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [conflicts, setConflicts] = useState<ImportConflict[] | null>(null)
  const [choices, setChoices] = useState<Record<string, 'keep' | 'replace'>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const preview = previewParseUrl(form)
  const previewHint =
    form.joinMode === 'template' && form.endpoint.trim() && !form.endpoint.includes('{url}')
      ? '模板模式需要在地址中包含 {url}'
      : null

  useEffect(() => {
    if (lines.length === 0) void load()
  }, [lines.length, load])

  const openCreate = (): void => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (line: ParseLine): void => {
    setEditing(line)
    setForm({
      id: line.id,
      name: line.name,
      endpoint: line.endpoint,
      joinMode: line.joinMode,
      note: line.note ?? ''
    })
    setFormError(null)
    setFormOpen(true)
  }

  const submitForm = async (): Promise<void> => {
    const ok = await upsert(form)
    if (ok) {
      setFormOpen(false)
    } else {
      setFormError(useLinesStore.getState().error ?? '保存失败')
    }
  }

  const beginImport = async (): Promise<void> => {
    try {
      const picked = await api.lines.pickImport()
      if (picked.canceled || !picked.json) {
        setNotice('已取消导入')
        return
      }
      const classified = classifyLineImport(picked.json, lines)
      if (classified.conflicts.length === 0) {
        setNotice(await useLinesStore.getState().importJson(picked.json, []))
        return
      }
      setImportText(picked.json)
      setConflicts(classified.conflicts)
      setChoices(
        Object.fromEntries(classified.conflicts.map((item) => [item.endpoint, 'keep' as const]))
      )
      setImportOpen(true)
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  const confirmImport = async (): Promise<void> => {
    if (!conflicts) return
    try {
      const replaceEndpoints = conflicts
        .filter((item) => choices[item.endpoint] === 'replace')
        .map((item) => item.endpoint)
      setNotice(await useLinesStore.getState().importJson(importText, replaceEndpoints))
      setImportOpen(false)
      setImportText('')
      setConflicts(null)
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  const chooseAll = (choice: 'keep' | 'replace'): void => {
    if (!conflicts) return
    setChoices(Object.fromEntries(conflicts.map((item) => [item.endpoint, choice])))
  }

  const move = (id: string, action: LineMove): void => {
    const next = moveLineOrder(
      lines.map((line) => line.id),
      id,
      action
    )
    if (next) void reorder(next)
  }

  const exportLines = async (): Promise<void> => {
    try {
      const result = await api.lines.exportFile()
      setNotice(result.canceled ? '已取消导出' : '线路已导出')
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <PageHeader
        title="线路管理"
        description={`共 ${lines.length} 条，启用 ${lines.filter((line) => line.enabled).length} 条。靠前的线路会优先播放和自动切换。内置线路可禁用但不可删除。`}
        actions={
          <>
            <Button variant="outline" size="sm" disabled={checking} onClick={() => void check()}>
              {checking ? <Loader2 className="animate-spin" /> : <Activity />}
              检测全部
            </Button>
            <Button variant="outline" size="sm" onClick={() => void beginImport()}>
              <Upload />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportLines()}>
              <Download />
              导出
            </Button>
            <Button variant="outline" size="sm" onClick={() => void resetBuiltin()}>
              <RotateCcw />
              重置内置
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus />
              新增线路
            </Button>
          </>
        }
      />

      {notice && (
        <div className="rounded-xl border border-border/70 bg-card/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          {notice}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border/70 bg-card/50 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/95 text-left text-[11px] text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-4 py-2.5 font-medium">名称</th>
              <th className="px-4 py-2.5 font-medium">地址</th>
              <th className="px-4 py-2.5 font-medium">状态</th>
              <th className="px-4 py-2.5 font-medium">延迟</th>
              <th className="px-4 py-2.5 font-medium">启用</th>
              <th className="px-4 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id} className="border-t border-border/60 hover:bg-accent/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span>{line.name}</span>
                    {line.builtin && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        内置
                      </span>
                    )}
                  </div>
                </td>
                <td className="max-w-[360px] truncate px-4 py-2.5 text-xs text-muted-foreground">
                  {line.endpoint}
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={cn('size-2 rounded-full', STATUS_CLASS[line.status])} />
                    {STATUS_TEXT[line.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {line.latencyMs ? `${line.latencyMs} ms` : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <Switch
                    checked={line.enabled}
                    onCheckedChange={(value) => void toggle(line.id, value)}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`置顶 ${line.name}`}
                      title="置顶"
                      disabled={index === 0}
                      onClick={() => move(line.id, 'top')}
                    >
                      <ArrowUpToLine />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`上移 ${line.name}`}
                      title="上移"
                      disabled={index === 0}
                      onClick={() => move(line.id, 'up')}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`下移 ${line.name}`}
                      title="下移"
                      disabled={index === lines.length - 1}
                      onClick={() => move(line.id, 'down')}
                    >
                      <ArrowDown />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => void check([line.id])}>
                      <Activity />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(line)}>
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={line.builtin}
                      onClick={() => void remove(line.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑线路' : '新增线路'}</DialogTitle>
            <DialogDescription>
              前置拼接：将编码后的视频地址直接拼接到地址末尾；模板模式：使用 {'{url}'} 作为占位符。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="line-name">名称</Label>
              <Input
                id="line-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="例如：线路 43"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="line-endpoint">解析地址</Label>
              <Input
                id="line-endpoint"
                value={form.endpoint}
                disabled={editing?.builtin}
                onChange={(event) => setForm({ ...form, endpoint: event.target.value })}
                placeholder="https://example.com/parse?url={url}"
              />
              {editing?.builtin && (
                <p className="text-xs text-muted-foreground">内置线路仅支持修改名称</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>拼接方式</Label>
              <Select
                value={form.joinMode}
                disabled={editing?.builtin}
                onValueChange={(value) =>
                  setForm({ ...form, joinMode: value as ParseLineInput['joinMode'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefix">前置拼接</SelectItem>
                  <SelectItem value="template">模板占位符</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preview && (
              <p className="break-all text-xs text-muted-foreground">预览拼接结果：{preview}</p>
            )}
            {previewHint && <p className="text-xs text-destructive">{previewHint}</p>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="line-note">备注</Label>
              <Input
                id="line-note"
                value={form.note ?? ''}
                disabled={editing?.builtin}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="可选"
              />
            </div>

            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void submitForm()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open)
          if (!open) {
            setImportText('')
            setConflicts(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理重复线路</DialogTitle>
            <DialogDescription>
              文件里这些地址已经存在。可以选择保留现有线路，或用文件内容覆盖。内置线路只会更新名称。
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => chooseAll('keep')}>
                全部保留
              </Button>
              <Button size="sm" variant="outline" onClick={() => chooseAll('replace')}>
                全部覆盖
              </Button>
            </div>
            {(conflicts ?? []).map((item) => (
              <div key={item.endpoint} className="rounded-lg border border-border/70 px-3 py-2">
                <p className="truncate text-sm">
                  现有「{item.existingName}」 / 导入「{item.incoming.name}」
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.endpoint}</p>
                {item.builtin && (
                  <p className="text-xs text-muted-foreground">内置线路只会更新名称</p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant={choices[item.endpoint] === 'keep' ? 'default' : 'outline'}
                    onClick={() => setChoices({ ...choices, [item.endpoint]: 'keep' })}
                  >
                    保留现有
                  </Button>
                  <Button
                    size="sm"
                    variant={choices[item.endpoint] === 'replace' ? 'default' : 'outline'}
                    onClick={() => setChoices({ ...choices, [item.endpoint]: 'replace' })}
                  >
                    使用导入
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void confirmImport()}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
