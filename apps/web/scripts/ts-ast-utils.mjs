import ts from 'typescript'

export function parseTsFile(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

export function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

export function isExportedVariable(node, name) {
  if (!ts.isVariableStatement(node)) return false
  const hasExport = (node.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  if (!hasExport) return false
  return node.declarationList.declarations.some(
    (d) => ts.isIdentifier(d.name) && d.name.text === name
  )
}

export function getVariableInitializer(sourceFile, name) {
  let found = null
  walk(sourceFile, (node) => {
    if (!ts.isVariableDeclaration(node)) return
    if (!ts.isIdentifier(node.name) || node.name.text !== name) return
    found = node.initializer ?? null
  })
  return found
}

export function hasExportedFunction(sourceFile, name) {
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isFunctionDeclaration(node) || !node.name) return
    if (node.name.text !== name) return
    const hasExport = (node.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (hasExport) ok = true
  })
  return ok
}

export function hasCallExpression(sourceFile, calleeNames) {
  const set = new Set(calleeNames)
  let ok = false
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node)) return
    if (ts.isIdentifier(node.expression) && set.has(node.expression.text)) ok = true
  })
  return ok
}

export function extractStaticRouteTokensFromArray(initializer) {
  const tokens = []
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) return tokens
  for (const el of initializer.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue
    const urlProp = el.properties.find(
      (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'url'
    )
    if (!urlProp || !ts.isPropertyAssignment(urlProp)) continue
    const expr = urlProp.initializer
    if (ts.isIdentifier(expr) && expr.text === 'SITE_URL') {
      tokens.push('SITE_URL')
      continue
    }
    if (ts.isTemplateExpression(expr) && expr.templateSpans.length === 1) {
      const span = expr.templateSpans[0]
      if (ts.isIdentifier(span.expression) && span.expression.text === 'SITE_URL') {
        tokens.push(`\${SITE_URL}${span.literal.text}`)
      }
    }
  }
  return tokens
}
