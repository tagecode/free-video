import { cn } from '@/lib/utils'
import { Clock, Home, Heart, Settings, Waypoints } from 'lucide-react'
import type * as React from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '解析播放', icon: Home },
  { to: '/lines', label: '线路管理', icon: Waypoints },
  { to: '/history', label: '播放历史', icon: Clock },
  { to: '/favorites', label: '我的收藏', icon: Heart },
  { to: '/settings', label: '设置', icon: Settings }
]

export function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex h-full w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card/40 px-3 py-4">
        <div className="mb-6 px-2">
          <p className="text-base font-semibold tracking-tight">Free Video</p>
          <p className="text-xs text-muted-foreground">跨平台 VIP 视频解析播放器</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
          仅供学习研究，请支持正版内容
        </p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
