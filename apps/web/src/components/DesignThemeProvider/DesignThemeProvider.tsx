'use client'

import { applyTheme, createTheme } from '@web-loom/design-core/utils'
// client: uses useEffect to inject CSS variables via design-core theme API
import { useEffect } from 'react'
import {
  borderRadius,
  cardSize,
  componentBorderRadius,
  flexGap,
  fontSize,
  fontWeight,
  gridColumn,
  gridGap,
  layoutHeight,
  layoutWidth,
  letterSpacing,
  lineHeight,
  radiusUi,
  size,
  spaceStep,
  spacing,
} from '@/theme/tokens/size'

type ThemeTokenValue = string | number
type ThemeTokenOverrides = Parameters<typeof createTheme>[1]

function toTokenOverrides(): Record<string, ThemeTokenValue> {
  const out: Record<string, ThemeTokenValue> = {}

  const setEntries = (prefix: string, values: Record<string, ThemeTokenValue>): void => {
    for (const [key, value] of Object.entries(values)) {
      out[`${prefix}-${key}`] = value
    }
  }

  setEntries('ds-space', spaceStep)
  setEntries('ds-spacing', spacing)
  setEntries('ds-grid-gap', gridGap)
  setEntries('ds-flex-gap', flexGap)
  setEntries('ds-br', borderRadius)

  out['ds-br-button'] = componentBorderRadius.button

  for (const [key, value] of Object.entries(radiusUi)) {
    const normalized = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    out[`ds-ui-radius-${normalized}`] = value
  }
  out['ds-ui-radius-button'] = componentBorderRadius.button

  setEntries('ds-size', size)
  setEntries('ds-font', fontSize)
  setEntries('ds-font-weight', fontWeight as Record<string, ThemeTokenValue>)
  setEntries('ds-line-height', lineHeight as Record<string, ThemeTokenValue>)
  setEntries('ds-letter-spacing', letterSpacing)
  setEntries('ds-layout-width', layoutWidth)
  setEntries('ds-layout-height', layoutHeight)

  for (const [key, value] of Object.entries(gridColumn)) {
    out[`ds-grid-template-${key}`] = `repeat(${String(value)}, minmax(0, 1fr))`
  }

  for (const [tier, values] of Object.entries(cardSize)) {
    out[`ds-card-${tier}-width`] = `${String(values.width)}px`
    out[`ds-card-${tier}-height`] = `${String(values.height)}px`
  }

  return out
}

const MEGDB_THEME = createTheme(
  'megdb-default',
  toTokenOverrides() as unknown as ThemeTokenOverrides
)

export function DesignThemeProvider(): null {
  useEffect(() => {
    void applyTheme(MEGDB_THEME, true)
  }, [])

  return null
}
