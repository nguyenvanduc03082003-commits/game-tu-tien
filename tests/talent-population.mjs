import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'resident-talent-pop-'));
try {
  const outfile = join(dir, 'talent-population.cjs');
  await build({
    entryPoints: ['tests/talent-population.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
  });
  const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
