import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const suites = [
  ['tests/profession-regression.ts', 'profession.cjs'],
  ['tests/equipment-catalog-regression.ts', 'equipment-catalog.cjs'],
  ['tests/world-startup-regression.ts', 'world-startup.cjs'],
  ['tests/building-placement-regression.ts', 'building-placement.cjs'],
  ['tests/ai-regression.ts', 'tests.cjs'],
  ['tests/animal-catalog-regression.ts', 'animal-catalog.cjs'],
  ['tests/animal-simulation-regression.ts', 'animal-simulation.cjs'],
  ['tests/animal-save-regression.ts', 'animal-save.cjs'],
  ['tests/animal-asset-regression.ts', 'animal-asset.cjs'],
  ['tests/elevation-regression.ts', 'elevation-regression.cjs'],
  ['tests/flora-spawn-regression.ts', 'flora-spawn.cjs'],
  ['tests/flora-economy-regression.ts', 'flora-economy.cjs'],
  ['tests/housing-capacity-regression.ts', 'housing-capacity.cjs'],
  ['tests/treasure-regression.ts', 'treasure.cjs'],
  ['tests/cultivation-balance-regression.ts', 'cultivation-balance.cjs'],
  ['tests/ecosystem-integration-regression.ts', 'ecosystem-integration.cjs'],
  ['tests/appearance-benchmark.ts', 'benchmark.cjs'],
];

const dir = await mkdtemp(join(tmpdir(), 'resident-ai-tests-'));
try {
  for (const [entryPoint, outName] of suites) {
    const outfile = join(dir, outName);
    await build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
    });
    const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' });
    if ((result.status ?? 1) !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
