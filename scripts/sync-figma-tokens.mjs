import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TOKENS_PATH = resolve(__dirname, '../tokens/style-dictionary.tokens.json')

function to255(channel) {
  return Math.round(channel * 255)
}

function toCssColor(rgba) {
  const r = to255(rgba.r)
  const g = to255(rgba.g)
  const b = to255(rgba.b)
  const a = typeof rgba.a === 'number' ? rgba.a : 1

  if (a >= 1) {
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
  }

  const alpha = Math.round(a * 100) / 100
  return `rgba(${r},${g},${b},${alpha})`
}

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s/-]/g, '')
    .replace(/[\/\s]+/g, '-')
}

async function run() {
  const token = process.env.FIGMA_ACCESS_TOKEN
  const fileKey = process.env.FIGMA_FILE_KEY

  if (!token || !fileKey) {
    throw new Error('Missing FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY')
  }

  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
    headers: {
      'X-Figma-Token': token,
    },
  })

  if (!response.ok) {
    throw new Error(`Figma API ${response.status}: ${await response.text()}`)
  }

  const payload = await response.json()
  const meta = payload.meta ?? {}
  const variables = meta.variables ?? {}
  const collections = meta.variableCollections ?? {}

  const defaultModeByCollection = new Map()
  for (const collection of Object.values(collections)) {
    const modeId = collection.modes?.[0]?.modeId
    if (modeId) defaultModeByCollection.set(collection.id, modeId)
  }

  const colorEntries = {}
  for (const variable of Object.values(variables)) {
    if (variable.resolvedType !== 'COLOR') continue
    const modeId =
      defaultModeByCollection.get(variable.variableCollectionId) ??
      Object.keys(variable.valuesByMode ?? {})[0]
    if (!modeId) continue
    const rgba = variable.valuesByMode?.[modeId]
    if (!rgba || typeof rgba !== 'object') continue

    colorEntries[normalizeName(variable.name)] = { value: toCssColor(rgba) }
  }

  if (Object.keys(colorEntries).length === 0) {
    throw new Error('No color variables found in Figma response')
  }

  const existingRaw = await readFile(TOKENS_PATH, 'utf8')
  const existing = JSON.parse(existingRaw)
  const merged = {
    ...existing,
    color: {
      ...(existing.color ?? {}),
      ...colorEntries,
    },
  }

  await mkdir(dirname(TOKENS_PATH), { recursive: true })
  await writeFile(TOKENS_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
  console.log(`Synced ${Object.keys(colorEntries).length} Figma colors -> ${TOKENS_PATH}`)
}

run().catch((error) => {
  console.error('[sync-figma-tokens]', error)
  process.exit(1)
})
