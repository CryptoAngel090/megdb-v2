import rawTokens from './size.json'
import { resolveDtcgTokens, type DtcgJson } from './dtcg'

interface CardSizeValue {
  width: number
  height: number
}

interface SizeTokens {
  spaceStep: Record<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '12', string>
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>
  borderRadius: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>
  componentBorderRadius: Record<'button', string>
  radiusUi: Record<
    'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'twoXl' | 'threeXl' | 'full' | 'card' | 'badge' | 'input' | 'glass',
    string
  >
  fontSize: Record<'xs' | 'sm' | 'base' | 'lg' | 'xl', string>
  size: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>
  layoutWidth: Record<'sm' | 'md' | 'lg' | 'xl', string>
  layoutHeight: Record<'sm' | 'md' | 'lg' | 'xl', string>
  fontWeight: Record<'thin' | 'normal' | 'medium' | 'semibold' | 'bold', number>
  lineHeight: Record<'sm' | 'normal' | 'loose', number>
  letterSpacing: Record<'normal' | 'tight' | 'loose', string>
  buttonSize: Record<'xs' | 'sm' | 'md' | 'lg', string>
  iconSize: Record<'xs' | 'sm' | 'md' | 'lg', string>
  buttonPadding: Record<'sm' | 'md' | 'lg', string>
  cardSize: Record<'sm' | 'md' | 'lg', CardSizeValue>
  gridGap: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>
  flexGap: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>
  gridColumn: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number>
}

const tokens = resolveDtcgTokens(rawTokens as DtcgJson) as unknown as SizeTokens

export const spaceStep = tokens.spaceStep
export const spacing = tokens.spacing
export const borderRadius = tokens.borderRadius
export const componentBorderRadius = tokens.componentBorderRadius
export const radiusUi = tokens.radiusUi
export const fontSize = tokens.fontSize
export const size = tokens.size
export const layoutWidth = tokens.layoutWidth
export const layoutHeight = tokens.layoutHeight
export const fontWeight = tokens.fontWeight
export const lineHeight = tokens.lineHeight
export const letterSpacing = tokens.letterSpacing
export const buttonSize = tokens.buttonSize
export const iconSize = tokens.iconSize
export const buttonPadding = tokens.buttonPadding
export const cardSize = tokens.cardSize
export const gridGap = tokens.gridGap
export const flexGap = tokens.flexGap
export const gridColumn = tokens.gridColumn

export type ButtonSizeKey = keyof typeof buttonSize
export type IconSizeKey = keyof typeof iconSize
export type CardSizeKey = keyof typeof cardSize
export type GridGapKey = keyof typeof gridGap
export type FlexGapKey = keyof typeof flexGap
export type GridColumnKey = keyof typeof gridColumn
