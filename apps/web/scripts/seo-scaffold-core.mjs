import ts from 'typescript'
import {
  hasCallExpression,
  hasExportedFunction,
  isExportedVariable,
  walk,
} from './ts-ast-utils.mjs'

export function parseScaffoldSource(path, source) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind)
}

function propName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return ''
}

function hasAlternatesCanonical(ast) {
  let ok = false
  walk(ast, (node) => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'alternates') return
    if (ts.isObjectLiteralExpression(node.initializer)) {
      for (const p of node.initializer.properties) {
        if (ts.isPropertyAssignment(p) && propName(p.name) === 'canonical') ok = true
      }
      return
    }
    if (ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression)) {
      if (node.initializer.expression.text === 'discoverPageAlternates') ok = true
    }
  })
  return ok
}

function hasMetadataContract(ast) {
  let hasMeta = false
  walk(ast, (node) => {
    if (isExportedVariable(node, 'metadata')) hasMeta = true
    if (isExportedVariable(node, 'generateMetadata')) hasMeta = true
  })
  return hasMeta || hasExportedFunction(ast, 'generateMetadata')
}

function hasSocialContract(ast) {
  if (hasCallExpression(ast, ['discoverSocialMeta'])) return true
  let hasOg = false
  let hasTw = false
  walk(ast, (node) => {
    if (!ts.isPropertyAssignment(node)) return
    const n = propName(node.name)
    if (n === 'openGraph') hasOg = true
    if (n === 'twitter') hasTw = true
  })
  return hasOg && hasTw
}

function jsxAttrTypeValue(attr) {
  if (!ts.isJsxAttribute(attr)) return null
  const name = attr.name.getText?.() ?? (ts.isIdentifier(attr.name) ? attr.name.text : '')
  if (name !== 'type') return null
  const init = attr.initializer
  if (ts.isStringLiteral(init)) return init.text
  if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
    return init.expression.text
  }
  return null
}

function isJsonLdScriptTypeAttr(attr) {
  return jsxAttrTypeValue(attr) === 'application/ld+json'
}

function hasJsonLdContract(ast) {
  let ok = false
  walk(ast, (node) => {
    if (ts.isJsxSelfClosingElement(node)) {
      if (node.tagName.getText(ast) === 'WebPageJsonLd') ok = true
      if (
        node.tagName.getText(ast) === 'script' &&
        node.attributes.properties.some(isJsonLdScriptTypeAttr)
      ) {
        ok = true
      }
      return
    }
    if (ts.isJsxElement(node)) {
      const open = node.openingElement
      if (open.tagName.getText(ast) === 'WebPageJsonLd') ok = true
      if (
        open.tagName.getText(ast) === 'script' &&
        open.attributes.properties.some(isJsonLdScriptTypeAttr)
      ) {
        ok = true
      }
    }
  })
  return ok
}

/** JSON-LD on page or delegated to detail shells that inject ld+json. */
export function pageJsonLdCoverage(ast) {
  if (hasJsonLdContract(ast)) return true
  if (hasCallExpression(ast, ['TvSeriesDetailPageApp', 'CartoonDetailPageApp'])) return true
  return false
}

/**
 * @param {string} pathHint - file path (used only for TSX vs TS)
 * @param {string} source
 */
export function scaffoldChecksForSource(pathHint, source) {
  const ast = parseScaffoldSource(pathHint, source)
  return {
    metadata: hasMetadataContract(ast),
    canonical: hasAlternatesCanonical(ast),
    social: hasSocialContract(ast),
    jsonLd: pageJsonLdCoverage(ast),
  }
}
