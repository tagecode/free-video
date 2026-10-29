import type { LineStatus, ParseLine, ParseLineInput } from '@shared/types'
import { cn } from '@/lib/utils'
import { Loader2, Pencil, Plus, RotateCcw, Trash2, Upload, Download, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const resetBuiltin = useLinesStore((state) => state.resetBuiltin)

  const [editing, setEditing] = useState<ParseLine | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ParseLineInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

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

  const submitImport = async (): Promise<void> => {
    try {
      setNotice(await useLinesStore.getState().importJson(importText))
      setImportOpen(false)
      setImportText('')
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  const exportJson = async (): Promise<void> => {
    const json = await api.lines.exportJson()
    await navigator.clipboard.writeText(json)
    setNotice(`已复制 ${lines.length} 条线路配置到剪贴板`)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">线路管理</h1>
          <p className="text-xs text-muted-foreground">
            共 {lines.length} 条，启用 {lines.filter((line) => line.enabled).length}{' '}
            条。内置线路可禁用但不可删除。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={checking} onClick={() => void check()}>
            {checking ? <Loader2 className="animate-spin" /> : <Activity />}
            检测全部
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload />
            导入
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportJson()}>
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
        </div>
      </header>

      {notice && (
        <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {notice}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/95 text-left text-xs text-muted-foreground backdrop-blur">
            <tr>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">地址</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium">延迟</th>
              <th className="px-4 py-2 font-medium">启用</th>
              <th className="px-4 py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-t hover:bg-accent/40">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span>{line.name}</span>
                    {line.builtin && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        内置
                      </span>
                    )}
                  </div>
                </td>
                <td className="max-w-[360px] truncate px-4 py-2 text-xs text-muted-foreground">
                  {line.endpoint}
                </td>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={cn('size-2 rounded-full', STATUS_CLASS[line.status])} />
                    {STATUS_TEXT[line.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {line.latencyMs ? `${line.latencyMs} ms` : '—'}
                </td>
                <td className="px-4 py-2">
                  <Switch
                    checked={line.enabled}
                    onCheckedChange={(value) => void toggle(line.id, value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入线路</DialogTitle>
            <DialogDescription>
              粘贴 JSON 数组，每项包含 name、endpoint、joinMode（prefix/template）与可选 note。
              重复地址会被自动跳过。
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            spellCheck={false}
            className="h-56 w-full resize-none rounded-md border bg-transparent p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder={
              '[\n  { "name": "线路 A", "endpoint": "https://a.com/?url=", "joinMode": "prefix" }\n]'
            }
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button disabled={!importText.trim()} onClick={() => void submitImport()}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
