import generated from './classes.generated.json'
import { borderRadius, cardSize, gridColumn, gridGap, size, spacing } from './size'

type TokenKey<T extends Record<string, unknown>> = Extract<keyof T, string>

/**
 * Unified utility-class maps bound to token keys from `size.ts`.
 * Examples:
 * - `sizeClasses.xs` => `w-xs h-xs`
 * - `spacingClasses.md` => `p-md`
 * - `borderRadiusClasses.lg` => `rounded-lg`
 */
export const sizeClasses = generated.sizeClasses as Record<
  TokenKey<typeof size>,
  string
>

export const spacingClasses = generated.spacingClasses as Record<
  TokenKey<typeof spacing>,
  string
>

export const borderRadiusClasses = generated.borderRadiusClasses as Record<
  TokenKey<typeof borderRadius>,
  string
>

export const gridGapClasses = generated.gridGapClasses as Record<TokenKey<typeof gridGap>, string>

export const gridGapLayoutClasses = generated.gridGapLayoutClasses as Record<
  TokenKey<typeof gridGap>,
  string
>

export const gridColumnLayoutClasses = generated.gridColumnLayoutClasses as Record<
  TokenKey<typeof gridColumn>,
  string
>

export const gridColumnClasses = generated.gridColumnClasses as Record<
  TokenKey<typeof gridColumn>,
  string
>

export const cardWidthClasses = generated.cardWidthClasses as Record<
  TokenKey<typeof cardSize>,
  string
>

export const cardHeightClasses = generated.cardHeightClasses as Record<
  TokenKey<typeof cardSize>,
  string
>

export const cardFrameClasses = generated.cardFrameClasses as Record<
  TokenKey<typeof cardSize>,
  string
>
