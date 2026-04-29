import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sizeTokens from '../theme/tokens/size.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../theme/tokens/classes.generated.json')

const keyList = (group) => Object.keys(group ?? {})

const buildSinglePrefix = (keys, prefix) =>
  Object.fromEntries(keys.map((key) => [key, `${prefix}-${key}`]))

const buildSquare = (keys) => Object.fromEntries(keys.map((key) => [key, `w-${key} h-${key}`]))

const sizeKeys = keyList(sizeTokens.size)
const spacingKeys = keyList(sizeTokens.spacing)
const borderRadiusKeys = keyList(sizeTokens.borderRadius)
const gridGapKeys = keyList(sizeTokens.gridGap)
const gridColumnKeys = keyList(sizeTokens.gridColumn)
const cardSizeKeys = keyList(sizeTokens.cardSize)

const cardWidthClasses = buildSinglePrefix(cardSizeKeys, 'w-card')
const cardHeightClasses = buildSinglePrefix(cardSizeKeys, 'h-card')

const generated = {
  sizeClasses: buildSquare(sizeKeys),
  spacingClasses: buildSinglePrefix(spacingKeys, 'p'),
  borderRadiusClasses: buildSinglePrefix(borderRadiusKeys, 'rounded'),
  gridGapClasses: buildSinglePrefix(gridGapKeys, 'gap'),
  gridGapLayoutClasses: buildSinglePrefix(gridGapKeys, 'gap-grid'),
  gridColumnLayoutClasses: buildSinglePrefix(gridColumnKeys, 'grid-cols-layout'),
  gridColumnClasses: buildSinglePrefix(gridColumnKeys, 'grid-cols'),
  cardWidthClasses,
  cardHeightClasses,
  cardFrameClasses: Object.fromEntries(
    cardSizeKeys.map((key) => [key, `${cardWidthClasses[key]} ${cardHeightClasses[key]}`])
  ),
}

writeFileSync(OUT, `${JSON.stringify(generated, null, 2)}\n`, 'utf8')
console.log(`Wrote ${OUT}`)
