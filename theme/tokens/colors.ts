import rawTokens from './colors.json'
import { resolveDtcgTokens, type DtcgJson } from './dtcg'

interface ColorTokenMap {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  danger: string
  warning: string
  success: string
  info: string
  muted: string
  bg: string
  card: string
  br: string
  ac: string
  acg: string
  acs: string
  acb: string
  t1: string
  t2: string
  t3: string
}

interface SemanticTokenMap {
  button: string
  buttonHover: string
  buttonActive: string
  buttonDisabled: string
  background: string
  text: string
  textLink: string
}

interface ColorTokenRoot {
  color: ColorTokenMap
  semantic: SemanticTokenMap
}

const resolved = resolveDtcgTokens(rawTokens as DtcgJson) as unknown as ColorTokenRoot

export const color = resolved.color
export const semantic = resolved.semantic
