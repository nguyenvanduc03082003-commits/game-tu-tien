import ts from 'typescript';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

// Read-only inventory. Warnings describe maintenance work, not gameplay defects.
const root = process.cwd();
const paths = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:ts|js|mjs)$/.test(entry.name)) paths.push(path);
  }
}
for (const directory of ['src', 'tests', 'scripts']) walk(resolve(root, directory));
paths.sort();
const key = path => relative(root, path).replaceAll('\\', '/');
const graph = new Map();
const files = [];
const errors = [];
for (const path of paths) {
  const text = readFileSync(path, 'utf8');
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true,
    path.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
  const imports = new Set();
  let anyAnnotations = 0;
  let assertions = 0;
  function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) anyAnnotations++;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) assertions++;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) {
      const specifier = node.moduleSpecifier.text;
      const base = resolve(dirname(path), specifier);
      const target = [base, `${base}.ts`, `${base}.js`, resolve(base, 'index.ts')].find(existsSync);
      if (!target) errors.push({ file: key(path), kind: 'missing_relative_import', specifier });
      else imports.add(key(target));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const diagnostic of source.parseDiagnostics) errors.push({ file: key(path), kind: 'syntax',
    line: source.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
  const lines = text.split(/\r?\n/);
  if (/^(?:<{7}|={7}|>{7})\s/m.test(text)) errors.push({ file: key(path), kind: 'merge_marker_candidate' });
  files.push({ file: key(path), sha256: createHash('sha256').update(text).digest('hex'),
    lines: lines.length, bytes: Buffer.byteLength(text), anyAnnotations, assertions,
    longLines: lines.flatMap((line, index) => line.length > 180 ? [index + 1] : []),
    bom: text.charCodeAt(0) === 0xfeff,
    trailingWhitespaceLines: lines.flatMap((line, index) => /[\t ]+$/.test(line) ? [index + 1] : []),
    imports: [...imports].sort() });
  graph.set(key(path), imports);
}
function reachable(roots) {
  const seen = new Set();
  function visit(path) { if (seen.has(path)) return; seen.add(path); for (const dependency of graph.get(path) ?? []) visit(dependency); }
  roots.forEach(visit); return seen;
}
const runtime = reachable(['src/main.ts']);
const all = reachable(['src/main.ts', ...files.filter(file => file.file.startsWith('tests/') || file.file.startsWith('scripts/')).map(file => file.file)]);
const src = files.filter(file => file.file.startsWith('src/'));
const result = { generatedAt: new Date().toISOString(),
  scope: 'Syntax, static relative imports (including type-only), file hygiene and source reachability. Dynamic imports and public API consumers outside this repository are not resolved. Not a full semantic gameplay audit.',
  summary: { codeFiles: files.length, srcFiles: src.length, lines: files.reduce((sum, file) => sum + file.lines, 0),
    errors: errors.length, bomFiles: files.filter(file => file.bom).length,
    trailingWhitespaceLines: files.reduce((sum, file) => sum + file.trailingWhitespaceLines.length, 0),
    longLines: files.reduce((sum, file) => sum + file.longLines.length, 0),
    anyAnnotationsInSrc: src.reduce((sum, file) => sum + file.anyAnnotations, 0) },
  errors, notReachableFromMain: src.filter(file => !runtime.has(file.file)).map(file => file.file),
  notReachableFromMainOrTools: src.filter(file => !all.has(file.file)).map(file => file.file), files };
const option = process.argv.indexOf('--output');
if (option >= 0) {
  if (!process.argv[option + 1]) throw new Error('--output needs a path');
  const output = resolve(root, process.argv[option + 1]);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(result, null, 2));
}
console.log(JSON.stringify({ ...result.summary, notReachableFromMainOrTools: result.notReachableFromMainOrTools }, null, 2));
if (errors.length) { console.error(JSON.stringify(errors, null, 2)); process.exitCode = 1; }
