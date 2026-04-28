const BASE83_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'

const BASE83_LOOKUP = new Map<string, number>([...BASE83_CHARS].map((char, index) => [char, index]))

function decodeBase83(value: string): number {
  let result = 0
  for (const char of value) {
    const digit = BASE83_LOOKUP.get(char)
    if (digit === undefined) {
      throw new Error('Invalid blurhash character')
    }
    result = result * 83 + digit
  }
  return result
}

function sRgbToLinear(value: number): number {
  const v = value / 255
  if (v <= 0.04045) return v / 12.92
  return ((v + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value: number): number {
  const v = Math.max(0, Math.min(1, value))
  if (v <= 0.0031308) return Math.round(v * 12.92 * 255)
  return Math.round((1.055 * v ** (1 / 2.4) - 0.055) * 255)
}

function signPow(value: number, exp: number): number {
  return Math.sign(value) * Math.abs(value) ** exp
}

function decodeDc(value: number): [number, number, number] {
  const r = value >> 16
  const g = (value >> 8) & 255
  const b = value & 255
  return [sRgbToLinear(r), sRgbToLinear(g), sRgbToLinear(b)]
}

function decodeAc(value: number, maxAc: number): [number, number, number] {
  const r = Math.floor(value / (19 * 19))
  const g = Math.floor(value / 19) % 19
  const b = value % 19
  return [
    signPow((r - 9) / 9, 2) * maxAc,
    signPow((g - 9) / 9, 2) * maxAc,
    signPow((b - 9) / 9, 2) * maxAc,
  ]
}

function decodeBlurhash(blurHash: string, width: number, height: number): Uint8ClampedArray | null {
  if (blurHash.length < 6) return null

  let sizeFlag = 0
  try {
    sizeFlag = decodeBase83(blurHash[0] ?? '')
  } catch {
    return null
  }
  const componentsX = (sizeFlag % 9) + 1
  const componentsY = Math.floor(sizeFlag / 9) + 1
  const expectedLength = 4 + 2 * componentsX * componentsY
  if (blurHash.length !== expectedLength) return null

  let quantisedMaxValue = 0
  try {
    quantisedMaxValue = decodeBase83(blurHash[1] ?? '')
  } catch {
    return null
  }
  const maxAc = (quantisedMaxValue + 1) / 166
  const colors: Array<[number, number, number]> = []

  for (let i = 0; i < componentsX * componentsY; i += 1) {
    if (i === 0) {
      const dcValue = decodeBase83(blurHash.slice(2, 6))
      colors.push(decodeDc(dcValue))
      continue
    }
    const from = 4 + i * 2
    const acValue = decodeBase83(blurHash.slice(from, from + 2))
    colors.push(decodeAc(acValue, maxAc))
  }

  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      for (let j = 0; j < componentsY; j += 1) {
        for (let i = 0; i < componentsX; i += 1) {
          const basis = Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height)
          const color = colors[i + j * componentsX]
          if (!color) continue
          r += color[0] * basis
          g += color[1] * basis
          b += color[2] * basis
        }
      }
      const index = 4 * (x + y * width)
      pixels[index] = linearToSrgb(r)
      pixels[index + 1] = linearToSrgb(g)
      pixels[index + 2] = linearToSrgb(b)
      pixels[index + 3] = 255
    }
  }

  return pixels
}

function blurHashToDataURL(hash: string, width = 32, height = 18): string | null {
  if (typeof document === 'undefined') return null
  const pixels = decodeBlurhash(hash, width, height)
  if (!pixels) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const imageData = ctx.createImageData(width, height)
  imageData.data.set(pixels)
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

export function blurHashToDataUrl(
  blurHash: string | null | undefined,
  width = 32,
  height = 18
): string | null {
  if (!blurHash) return null
  const hash = blurHash.trim()
  if (!hash) return null
  return blurHashToDataURL(hash, width, height)
}
