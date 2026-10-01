import { readdirSync } from 'node:fs';
import { runBundledTest } from './run-bundled.mjs';

// Discover every regression automatically; keep social acceptance suites first.
// Baselines, browser fixtures and population reports remain explicit commands.
const first = ['social-phase6-regression.ts', 'social-phase5-regression.ts'];
const regressions = readdirSync('tests').filter(name => name.endsWith('-regression.ts')).sort();
const suites = [
  ...first.filter(name => regressions.includes(name)),
  ...regressions.filter(name => !first.includes(name)),
  'appearance-benchmark.ts',
].map(name => `tests/${name}`);
const continueOnFailure = process.argv.includes('--continue');
const failedSuites = [];
let executed = 0;
for (const entryPoint of suites) {
  executed++;
  try {
    const status = await runBundledTest(entryPoint);
    if (status === 0) continue;
    process.exitCode = status;
  } catch (error) {
    console.error(`Failed to run ${entryPoint}:`, error);
    process.exitCode = 1;
  }
  failedSuites.push(entryPoint);
  if (!continueOnFailure) break;
}
console.log('SUITE SUMMARY', JSON.stringify({ total: suites.length, executed,
  passed: executed - failedSuites.length, failed: failedSuites, skipped: suites.length - executed }));
