import { runBundledTest } from './run-bundled.mjs';

process.exitCode = await runBundledTest(
  process.argv[2] ?? 'tests/social-phase5-regression.ts',
  process.argv.slice(3),
);
