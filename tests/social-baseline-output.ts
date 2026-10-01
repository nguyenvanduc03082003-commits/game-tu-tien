import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Separate G6 snapshots; refuse overwriting evidence unless explicitly requested. */
export function socialBaselineOutputPath(defaultPath: string): string {
  const args = process.argv.slice(2);
  const option = args.indexOf('--output');
  if (option >= 0 && !args[option + 1]) throw new Error('--output needs a path');
  const output = resolve(option >= 0 ? args[option + 1] : defaultPath);
  if (existsSync(output) && !args.includes('--overwrite')) throw new Error(`Evidence already exists: ${output}; use another --output or --overwrite`);
  return output;
}

export function writeSocialBaseline(defaultPath: string, data: object): void {
  const output = socialBaselineOutputPath(defaultPath);
  const sources: Record<string, string> = {};
  const hash = (path: string) => { sources[path.replaceAll('\\', '/')] = createHash('sha256').update(readFileSync(path)).digest('hex'); };
  const walk = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child); else if (entry.name.endsWith('.ts')) hash(child);
    }
  };
  walk('src');
  for (const path of ['tests/social-baseline.ts', 'tests/social-integration-baseline.ts', 'tests/social-world-baseline.ts', 'tests/social-phase6-regression.ts', 'tests/social-fixture.ts', 'tests/social-baseline-output.ts']) if (existsSync(path)) hash(path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ ...data, evidence: {
    generatedAt: new Date().toISOString(), nodeVersion: process.version,
    configHash: sources['src/config/social.config.ts'], sourceHashes: sources,
    scope: 'Harness metadata; timing is not a whole Engine benchmark',
  } }, null, 2));
  console.log(`Saved social evidence: ${output}`);
}
