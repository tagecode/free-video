import { APP_NAME } from '@shared/constants'
import { Play } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// macOS 的红绿灯浮在左上，Windows/Linux 的窗口控件叠在右上，留白按平台留
const isMac = api.app.platform === 'darwin'

export function TitleBar(): React.JSX.Element {
  return (
    <header
      className={cn(
        'app-drag relative z-20 flex h-11 shrink-0 items-center gap-2.5 border-b border-border/60 bg-background/60 backdrop-blur-xl',
        isMac ? 'pl-[84px] pr-4' : 'pl-4 pr-[148px]'
      )}
    >
      <span className="grid size-[22px] place-items-center rounded-[6px] bg-gradient-to-br from-brand-from to-brand-to text-white shadow-[0_2px_10px_-2px_rgba(217,45,60,0.7)]">
        <Play className="size-3 fill-current" />
      </span>
      <span className="text-[13px] font-semibold tracking-tight">{APP_NAME}</span>
      <span className="hidden text-[11px] text-muted-foreground sm:inline">VIP 视频解析播放器</span>
    </header>
  )
}
