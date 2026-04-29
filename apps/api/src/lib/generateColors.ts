import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { encode } from 'blurhash'
import { getColor } from 'colorthief'
import sharp from 'sharp'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface MovieVisualMetadata {
  blurHash: string
  primaryColor: string
}

function toHexColor([r, g, b]: [number, number, number]): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`
}

export async function generateMovieColors(tmdbBackdropPath: string): Promise<MovieVisualMetadata> {
  const normalizedPath = tmdbBackdropPath.startsWith('/')
    ? tmdbBackdropPath
    : `/${tmdbBackdropPath}`
  const imageUrl = `${TMDB_IMAGE_BASE}${normalizedPath}`

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download backdrop: ${response.status} ${imageUrl}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { data, info } = await sharp(buffer)
    .resize(32, 18, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3)

  const tmpPath = join(
    tmpdir(),
    `backdrop-${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`
  )

  await fs.writeFile(tmpPath, buffer)
  try {
    const dominant = (await getColor(tmpPath)) as unknown
    const rgb = Array.isArray(dominant)
      ? ([dominant[0], dominant[1], dominant[2]] as [number, number, number])
      : ([
          (dominant as { r?: number }).r ?? 0,
          (dominant as { g?: number }).g ?? 0,
          (dominant as { b?: number }).b ?? 0,
        ] as [number, number, number])
    const primaryColor = toHexColor(rgb)
    return { blurHash, primaryColor }
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined)
  }
}
