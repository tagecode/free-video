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
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { usePlayerStore } from '@/store/player'

export type CloseChoice = 'tray' | 'quit' | 'cancel'

/**
 * 关闭窗口的询问框：主进程拦住 close 后广播，这里用应用内对话框作答，
 * 和设置页、免责声明保持同一套视觉，不再弹系统原生消息框。
 */
export function ClosePrompt(): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [remember, setRemember] = useState(false)
  const setOverlayOpen = usePlayerStore((state) => state.setOverlayOpen)

  useEffect(
    () =>
      api.window.onCloseRequest(() => {
        setRemember(false)
        setOpen(true)
      }),
    []
  )

  // 原生播放视图永远盖在 DOM 之上，询问框打开时要先把它收起来
  useEffect(() => {
    if (!open) return
    setOverlayOpen(true)
    return () => setOverlayOpen(false)
  }, [open, setOverlayOpen])

  const respond = (action: CloseChoice): void => {
    setOpen(false)
    void api.window.respondClose({ action, remember })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) respond('cancel')
      }}
    >
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          respond('cancel')
        }}
      >
        <DialogHeader>
          <DialogTitle>要关闭窗口吗？</DialogTitle>
          <DialogDescription>
            最小化到托盘后程序会继续在后台运行，点托盘图标可以随时打开。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm">记住我的选择</p>
            <p className="text-xs text-muted-foreground">下次点关闭不再询问，可在设置里改回来</p>
          </div>
          <Switch checked={remember} onCheckedChange={setRemember} aria-label="记住我的选择" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => respond('cancel')}>
            取消
          </Button>
          <Button variant="outline" onClick={() => respond('quit')}>
            关闭
          </Button>
          <Button onClick={() => respond('tray')}>最小化到托盘</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
