import ts from 'typescript'

export function parseRobotsSource(path, source) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function propName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

/** Collect string literals from `disallow: [ ... ]` in robots.ts AST. */
export function extractRobotsDisallowLiterals(sourceFile) {
  const set = new Set()
  walk(sourceFile, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'disallow') return
    if (!ts.isArrayLiteralExpression(node.initializer)) return
    for (const el of node.initializer.elements) {
      if (ts.isStringLiteral(el)) set.add(el.text)
    }
  })
  return set
}
