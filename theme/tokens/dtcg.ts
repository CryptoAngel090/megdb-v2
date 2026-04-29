interface DtcgToken {
  $type?: string
  $value: unknown
}

type DtcgNode = DtcgToken | { [key: string]: DtcgNode }
export type DtcgJson = Record<string, DtcgNode>

function isToken(node: DtcgNode): node is DtcgToken {
  return typeof node === 'object' && node !== null && '$value' in node
}

function getByPath(root: DtcgJson, path: string): DtcgNode {
  const segments = path.split('.')
  let current: DtcgNode | undefined = root

  for (const segment of segments) {
    if (!current || isToken(current) || typeof current !== 'object') {
      throw new Error(`Invalid DTCG alias path: ${path}`)
    }
    current = (current as Record<string, DtcgNode>)[segment]
  }

  if (!current) {
    throw new Error(`Missing DTCG alias target: ${path}`)
  }

  return current
}

function resolveAliasPath(raw: string): string | null {
  const match = raw.match(/^\{([a-zA-Z0-9._-]+)\}$/)
  return match?.[1] ?? null
}

function resolveNode(
  root: DtcgJson,
  node: DtcgNode,
  stack: string[],
): unknown {
  if (isToken(node)) {
    if (typeof node.$value === 'string') {
      const aliasPath = resolveAliasPath(node.$value)
      if (!aliasPath) return node.$value
      if (stack.includes(aliasPath)) {
        throw new Error(`Circular DTCG alias detected: ${[...stack, aliasPath].join(' -> ')}`)
      }
      const aliasNode = getByPath(root, aliasPath)
      return resolveNode(root, aliasNode, [...stack, aliasPath])
    }
    return node.$value
  }

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    out[key] = resolveNode(root, value, stack)
  }
  return out
}

export function resolveDtcgTokens(json: DtcgJson): Record<string, unknown> {
  return resolveNode(json, json, []) as Record<string, unknown>
}
