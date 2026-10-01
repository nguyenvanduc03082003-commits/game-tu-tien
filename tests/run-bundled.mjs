import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Bundle one Node fixture and remove only the temporary directory we created. */
export async function runBundledTest(entryPoint, args = []) {
  const directory = await mkdtemp(join(tmpdir(), 'game-tu-tien-test-'));
  try {
    const outfile = join(directory, 'test.cjs');
    await build({ entryPoints: [entryPoint], outfile, bundle: true, platform: 'node', format: 'cjs' });
    const result = spawnSync(process.execPath, [outfile, ...args], { stdio: 'inherit' });
    if (result.error) throw result.error;
    return result.status ?? 1;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
