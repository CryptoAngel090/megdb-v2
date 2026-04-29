import { useId } from 'react'
import blockStyles from './MovieTrailerBlock.module.css'
import { MovieTrailerBlockClient } from './MovieTrailerBlock.client'

type MovieTrailerBlockProps = {
  videoKey: string
  embedTitle: string
  boxClassName: string | undefined
}

function normalizeYoutubeKey(raw: string): string {
  const s = raw.trim()
  const fromQuery = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (fromQuery) return fromQuery[1]!
  const fromShort = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (fromShort) return fromShort[1]!
  const fromEmbed = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (fromEmbed) return fromEmbed[1]!
  return s
}

export function MovieTrailerBlock({ videoKey, embedTitle, boxClassName }: MovieTrailerBlockProps) {
  const sectionId = useId().replace(/:/g, '')

  const k = normalizeYoutubeKey(videoKey)
  const poster = `https://img.youtube.com/vi/${k}/hqdefault.jpg`

  return (
    <>
      <div id={sectionId} className={blockStyles.wrap}>
        <div className={boxClassName} style={{ background: '#0a0a0a' }}>
          <div
            className={blockStyles.posterLayer}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.5)), url(${poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <button
            type="button"
            data-trailer-play="true"
            className={blockStyles.playOverlay}
            aria-label={`Play trailer: ${embedTitle}`}
          >
            <span className={blockStyles.playDisc} aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className={blockStyles.playLabel}>Play trailer</span>
          </button>
        </div>
      </div>
      <MovieTrailerBlockClient sectionId={sectionId} videoKey={k} embedTitle={embedTitle} />
    </>
  )
}
