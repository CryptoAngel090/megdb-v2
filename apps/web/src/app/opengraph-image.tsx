import { ImageResponse } from 'next/og'
import { fontWeight, layoutWidth, letterSpacing, lineHeight } from '@/theme/tokens/size'

export const runtime = 'edge'
export const alt = 'MegDB — Movies, Series, Cartoons & TV Shows'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        background: 'radial-gradient(circle at 20% 20%, #3b82f6 0%, #1e40af 35%, #0f172a 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#ffffff',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: fontWeight.bold,
            fontSize: 24,
          }}
        >
          M
        </div>
        <div
          style={{ fontSize: 30, fontWeight: fontWeight.bold, letterSpacing: letterSpacing.tight }}
        >
          MegDB
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: fontWeight.bold,
            lineHeight: lineHeight.sm,
            letterSpacing: letterSpacing.tight,
            maxWidth: layoutWidth.lg,
          }}
        >
          Movies, Series, Cartoons and TV Shows
        </div>
        <div
          style={{
            fontSize: 30,
            opacity: 0.92,
            lineHeight: lineHeight.normal,
            letterSpacing: letterSpacing.normal,
            maxWidth: layoutWidth.md,
          }}
        >
          Discover what to watch next with fast search and smart browse filters.
        </div>
      </div>

      <div style={{ fontSize: 22, opacity: 0.86 }}>megdb.com</div>
    </div>,
    size
  )
}
