import { platformLabel } from '@shared/platform'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { playRequestState } from '@/lib/return-to-player'

export function ClipboardPrompt(): React.JSX.Element | null {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const dismissed = useRef<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    return api.clipboard.onSuggestion((next) => {
      if (!next) {
        setVideoUrl(null)
        return
      }
      if (dismissed.current === next) return
      setVideoUrl(next)
    })
  }, [])

  if (!videoUrl) return null

  const accept = (): void => {
    const url = videoUrl
    dismissed.current = url
    setVideoUrl(null)
    navigate('/', { state: playRequestState(url) })
  }

  const ignore = (): void => {
    dismissed.current = videoUrl
    setVideoUrl(null)
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/70 bg-card/80 px-4 py-2 backdrop-blur">
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="text-muted-foreground">{platformLabel(videoUrl)} · </span>
        {videoUrl}
      </p>
      <Button size="sm" onClick={accept}>
        解析此链接
      </Button>
      <Button size="sm" variant="ghost" onClick={ignore}>
        忽略
      </Button>
    </div>
  )
}
