import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = {
  width: 512,
  height: 512,
}

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#121212',
        color: '#E50914',
        fontSize: 220,
        fontWeight: 800,
      }}
    >
      M
    </div>,
    {
      ...size,
    }
  )
}
