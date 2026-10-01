import { runBundledTest } from './run-bundled.mjs';

process.exitCode = await runBundledTest('tests/talent-population.ts', process.argv.slice(2));
