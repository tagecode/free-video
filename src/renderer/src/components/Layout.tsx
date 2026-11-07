import type { AppInfo } from '@shared/types'
import {
  Clock,
  Heart,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Waypoints
} from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { TitleBar } from '@/components/TitleBar'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useLinesStore } from '@/store/lines'
import { usePlayerStore } from '@/store/player'

const NAV_ITEMS = [
  { to: '/', label: '解析播放', icon: Home },
  { to: '/lines', label: '线路管理', icon: Waypoints },
  { to: '/history', label: '播放历史', icon: Clock },
  { to: '/favorites', label: '我的收藏', icon: Heart },
  { to: '/settings', label: '设置', icon: Settings }
]

const SIDEBAR_EXPANDED_KEY = 'free-video.sidebar-expanded'

function readSidebarExpanded(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_EXPANDED_KEY) !== 'false'
  } catch {
    return true
  }
}

function Sidebar(): React.JSX.Element {
  const [expanded, setExpanded] = useState(readSidebarExpanded)

  function toggleExpanded(): void {
    setExpanded((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(next))
      } catch {
        // 偏好写不进去时，本次会话里的展开状态仍然有效
      }
      return next
    })
  }

  return (
    <aside
      id="app-sidebar"
      className={cn(
        'relative z-20 flex shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-[width] duration-200 ease-out motion-reduce:transition-none',
        expanded ? 'w-60 overflow-hidden' : 'w-[4.5rem] overflow-visible'
      )}
    >
      <nav className={cn('flex flex-1 flex-col gap-1', expanded ? 'p-3' : 'px-2 py-3')}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={expanded ? undefined : label}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center rounded-xl py-2.5 text-[13px] transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                expanded ? 'gap-3 px-3' : 'justify-center px-0',
                isActive
                  ? 'bg-accent font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-lg border transition-colors',
                    isActive
                      ? 'border-transparent bg-gradient-to-br from-brand-from to-brand-to text-white shadow-[0_4px_12px_-4px_rgba(217,45,60,0.8)]'
                      : 'border-border/60 bg-background/50 text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className={cn('truncate whitespace-nowrap', !expanded && 'sr-only')}>
                  {label}
                </span>
                {!expanded && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-[calc(100%+0.5rem)] -translate-y-1/2 rounded-md border border-border/70 bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          'flex border-t border-border/60',
          expanded ? 'items-end gap-2 px-3 py-3' : 'justify-center px-2 py-2'
        )}
      >
        {expanded && (
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground/80">
            仅供学习研究，请支持正版内容
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('text-muted-foreground', !expanded && 'size-10')}
          aria-expanded={expanded}
          aria-controls="app-sidebar"
          aria-label={expanded ? '收起导航栏' : '展开导航栏'}
          title={expanded ? '收起导航栏' : '展开导航栏'}
          onClick={toggleExpanded}
        >
          {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>
    </aside>
  )
}

function StatusBar(): React.JSX.Element {
  const status = usePlayerStore((state) => state.status)
  const lines = useLinesStore((state) => state.lines)
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    let active = true
    void api.app.info().then((value) => {
      if (active) setInfo(value)
    })
    return () => {
      active = false
    }
  }, [])

  const enabled = lines.filter((line) => line.enabled).length
  const healthy = lines.filter((line) => line.status === 'ok').length
  const state =
    status.state === 'playing'
      ? { text: '播放中', dot: 'bg-success' }
      : status.state === 'loading'
        ? { text: '解析中', dot: 'bg-warning' }
        : status.state === 'failed'
          ? { text: '播放失败', dot: 'bg-destructive' }
          : { text: '就绪', dot: 'bg-muted-foreground/50' }

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border/60 bg-background/50 px-4 text-[11px] text-muted-foreground backdrop-blur-xl">
      <span className="flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', state.dot)} />
        {state.text}
      </span>
      <span className="text-border">|</span>
      <span>
        线路 {enabled}/{lines.length} 启用
        {healthy > 0 && <span className="text-muted-foreground/70"> · {healthy} 条可用</span>}
      </span>
      <span className="ml-auto hidden sm:inline">{info?.platform}</span>
      <span className="tabular-nums">v{info?.version ?? '—'}</span>
    </footer>
  )
}

export function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div aria-hidden className="app-canvas pointer-events-none absolute inset-0" />
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <StatusBar />
    </div>
  )
}
