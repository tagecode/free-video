import { DISCLAIMER_TEXT } from '@shared/constants'
import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { LinesPage } from '@/pages/LinesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useLinesStore } from '@/store/lines'
import { usePlayerStore } from '@/store/player'
import { useSettingsStore } from '@/store/settings'

function useTheme(): void {
  const theme = useSettingsStore((state) => state.settings.theme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (): void => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

function DisclaimerGate(): React.JSX.Element | null {
  const accepted = useSettingsStore((state) => state.settings.disclaimerAccepted)
  const patch = useSettingsStore((state) => state.patch)
  const loaded = useSettingsStore((state) => state.loaded)

  if (!loaded || accepted) {
    return null
  }

  return (
    <Dialog open>
      <DialogContent
        className="max-w-xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>使用前请阅读</DialogTitle>
          <DialogDescription>
            Free Video 是一个纯播放容器，请自行判断内容来源的合法性。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/50 p-4 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
          {DISCLAIMER_TEXT}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => window.close()}>
            退出
          </Button>
          <Button onClick={() => void patch({ disclaimerAccepted: true })}>我已阅读并同意</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function App(): React.JSX.Element {
  const loadSettings = useSettingsStore((state) => state.load)
  const loadLines = useLinesStore((state) => state.load)
  const subscribeLines = useLinesStore((state) => state.subscribe)
  const subscribePlayer = usePlayerStore((state) => state.subscribe)

  useTheme()

  useEffect(() => {
    void loadSettings()
    void loadLines()
    const offLines = subscribeLines()
    const offPlayer = subscribePlayer()
    return () => {
      offLines()
      offPlayer()
    }
  }, [loadSettings, loadLines, subscribeLines, subscribePlayer])

  return (
    <HashRouter>
      <DisclaimerGate />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lines" element={<LinesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
