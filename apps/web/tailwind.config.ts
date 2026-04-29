import type { Config } from 'tailwindcss'

import {
  cardSize,
  gridColumn,
  layoutHeight,
  layoutWidth,
  letterSpacing,
  lineHeight,
} from '../../theme/tokens/size'
import { color } from '../../theme/tokens/colors'

/**
 * Maps `theme/tokens/size.ts` into Tailwind theme keys.
 * Semantic: `w-xs`…`w-xl` / `h-xs`…`h-xl` in components (never `w-8` / `h-12` in TSX).
 * Numeric width/height aliases exist only here, bound to `size`:
 * - `w-8` / `h-8` → `size.sm` (32px)
 * - `w-12` / `h-12` → `size.md` (40px)
 * - `w-16` / `h-16` → `size.lg` (48px)
 * Spacing aliases (legacy safety): `2`→`xs`, `4`→`md`, `6`→`lg`, `8`→`xl`.
 * Layout gaps: `gap-md` (semantic) and `gap-grid-md` (legacy alias) from `gridGap`.
 * Grid columns: `grid-cols-md` (semantic) and `grid-cols-layout-md` (legacy alias) from `gridColumn`.
 * Min/max **block** sizes from `size.ts` use `*-sz-*` keys (`max-w-sz-md`) so Tailwind’s
 * default `max-w-md` / `max-h-lg` (rem prose widths) stay intact.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}'],
  /**
   * `w-${size}` / `h-${size}` in TSX are not static strings — JIT cannot see them without safelist.
   * Keys mirror `theme/tokens/size.ts` `size` export.
   */
  safelist: [
    { pattern: /^w-(xs|sm|md|lg|xl)$/ },
    { pattern: /^h-(xs|sm|md|lg|xl)$/ },
    { pattern: /^w-card-(sm|md|lg)$/ },
    { pattern: /^h-card-(sm|md|lg)$/ },
    { pattern: /^aspect-card-(sm|md|lg)$/ },
    { pattern: /^gap-(xs|sm|md|lg|xl)$/ },
    { pattern: /^gap-(grid|flex)-(xs|sm|md|lg|xl)$/ },
    { pattern: /^grid-cols-(xs|sm|md|lg|xl)$/ },
    { pattern: /^grid-cols-layout-(xs|sm|md|lg|xl)$/ },
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      spacing: {
        xs: 'var(--ds-spacing-xs)',
        sm: 'var(--ds-spacing-sm)',
        md: 'var(--ds-spacing-md)',
        lg: 'var(--ds-spacing-lg)',
        xl: 'var(--ds-spacing-xl)',
        2: 'var(--ds-spacing-xs)',
        4: 'var(--ds-spacing-md)',
        6: 'var(--ds-spacing-lg)',
        8: 'var(--ds-spacing-xl)',
        'grid-xs': 'var(--ds-grid-gap-xs)',
        'grid-sm': 'var(--ds-grid-gap-sm)',
        'grid-md': 'var(--ds-grid-gap-md)',
        'grid-lg': 'var(--ds-grid-gap-lg)',
        'grid-xl': 'var(--ds-grid-gap-xl)',
        'flex-xs': 'var(--ds-flex-gap-xs)',
        'flex-sm': 'var(--ds-flex-gap-sm)',
        'flex-md': 'var(--ds-flex-gap-md)',
        'flex-lg': 'var(--ds-flex-gap-lg)',
        'flex-xl': 'var(--ds-flex-gap-xl)',
      },
      borderRadius: {
        xs: 'var(--ds-br-xs)',
        sm: 'var(--ds-br-sm)',
        md: 'var(--ds-br-md)',
        lg: 'var(--ds-br-lg)',
        xl: 'var(--ds-br-xl)',
        button: 'var(--ds-br-button)',
      },
      fontSize: {
        xs: 'var(--ds-font-xs)',
        sm: 'var(--ds-font-sm)',
        base: 'var(--ds-font-base)',
        lg: 'var(--ds-font-lg)',
        xl: 'var(--ds-font-xl)',
      },
      colors: {
        primary: color.primary,
        secondary: color.secondary,
        accentBase: color.accent,
        background: color.background,
        text: color.text,
        danger: color.danger,
        warning: color.warning,
        success: color.success,
        info: color.info,
        muted: color.muted,
        bg: color.bg,
        card: color.card,
        border: color.br,
        accent: {
          DEFAULT: color.ac,
          glow: color.acg,
          soft: color.acs,
          border: color.acb,
        },
        t1: color.t1,
        t2: color.t2,
        t3: color.t3,
      },
      fontWeight: {
        thin: 'var(--ds-font-weight-thin)',
        normal: 'var(--ds-font-weight-normal)',
        medium: 'var(--ds-font-weight-medium)',
        semibold: 'var(--ds-font-weight-semibold)',
        bold: 'var(--ds-font-weight-bold)',
      },
      lineHeight: {
        ...Object.fromEntries(
          (Object.keys(lineHeight) as Array<keyof typeof lineHeight>).map((k) => [
            k,
            `var(--ds-line-height-${k})`,
          ])
        ),
      },
      letterSpacing: {
        ...Object.fromEntries(
          (Object.keys(letterSpacing) as Array<keyof typeof letterSpacing>).map((k) => [
            k,
            `var(--ds-letter-spacing-${k})`,
          ])
        ),
      },
      width: {
        xs: 'var(--ds-size-xs)',
        sm: 'var(--ds-size-sm)',
        md: 'var(--ds-size-md)',
        lg: 'var(--ds-size-lg)',
        xl: 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
        'card-sm': 'var(--ds-card-sm-width)',
        'card-md': 'var(--ds-card-md-width)',
        'card-lg': 'var(--ds-card-lg-width)',
      },
      height: {
        xs: 'var(--ds-size-xs)',
        sm: 'var(--ds-size-sm)',
        md: 'var(--ds-size-md)',
        lg: 'var(--ds-size-lg)',
        xl: 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
        'card-sm': 'var(--ds-card-sm-height)',
        'card-md': 'var(--ds-card-md-height)',
        'card-lg': 'var(--ds-card-lg-height)',
      },
      minWidth: {
        'sz-xs': 'var(--ds-size-xs)',
        'sz-sm': 'var(--ds-size-sm)',
        'sz-md': 'var(--ds-size-md)',
        'sz-lg': 'var(--ds-size-lg)',
        'sz-xl': 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
      },
      minHeight: {
        'sz-xs': 'var(--ds-size-xs)',
        'sz-sm': 'var(--ds-size-sm)',
        'sz-md': 'var(--ds-size-md)',
        'sz-lg': 'var(--ds-size-lg)',
        'sz-xl': 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
      },
      maxWidth: {
        ...Object.fromEntries(
          (Object.keys(layoutWidth) as Array<keyof typeof layoutWidth>).flatMap((k) => [
            [k, `var(--ds-layout-width-${k})`],
            [`layout-${k}`, `var(--ds-layout-width-${k})`],
          ])
        ),
        'sz-xs': 'var(--ds-size-xs)',
        'sz-sm': 'var(--ds-size-sm)',
        'sz-md': 'var(--ds-size-md)',
        'sz-lg': 'var(--ds-size-lg)',
        'sz-xl': 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
      },
      maxHeight: {
        ...Object.fromEntries(
          (Object.keys(layoutHeight) as Array<keyof typeof layoutHeight>).flatMap((k) => [
            [k, `var(--ds-layout-height-${k})`],
            [`layout-${k}`, `var(--ds-layout-height-${k})`],
          ])
        ),
        'sz-xs': 'var(--ds-size-xs)',
        'sz-sm': 'var(--ds-size-sm)',
        'sz-md': 'var(--ds-size-md)',
        'sz-lg': 'var(--ds-size-lg)',
        'sz-xl': 'var(--ds-size-xl)',
        8: 'var(--ds-size-sm)',
        12: 'var(--ds-size-md)',
        16: 'var(--ds-size-lg)',
      },
      aspectRatio: {
        'card-sm': `${cardSize.sm.width} / ${cardSize.sm.height}`,
        'card-md': `${cardSize.md.width} / ${cardSize.md.height}`,
        'card-lg': `${cardSize.lg.width} / ${cardSize.lg.height}`,
      },
      gridTemplateColumns: Object.fromEntries(
        (Object.keys(gridColumn) as Array<keyof typeof gridColumn>).flatMap((k) => [
          [k, `repeat(${gridColumn[k]}, minmax(0, 1fr))`],
          [`layout-${k}`, `repeat(${gridColumn[k]}, minmax(0, 1fr))`],
        ])
      ),
    },
  },
  plugins: [],
}

export default config
