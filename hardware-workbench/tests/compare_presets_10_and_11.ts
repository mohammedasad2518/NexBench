/**
 * Comparative Evaluation: Preset 10 (Bang-Bang) vs. Preset 11 (Discrete PID)
 * Executes identical simulation runs across Straight, Oval, and Wavy tracks.
 */

import {
  benchmarkControllerOnTrack,
  formatBenchmarkTable,
  type BenchmarkMetrics,
} from './benchmark_line_controllers';
import { SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import { INITIAL_ROBOT_POSE } from '../src/utils/robotKinematics';

async function main() {
  console.log('================================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9A CONTROLLER COMPARISON (PRESET 10 vs PRESET 11)');
  console.log('================================================================================\n');

  const preset10 = SKETCH_PRESETS.find((p) => p.id === 'line_follower');
  const preset11 = SKETCH_PRESETS.find((p) => p.id === 'pid_line_follower');

  if (!preset10 || !preset11) {
    throw new Error('Could not find Preset 10 or Preset 11 in SKETCH_PRESETS!');
  }

  const results: BenchmarkMetrics[] = [];

  // Track 1: Straight Track (10s)
  console.log('[1/6] Running Preset 10 on Straight Track (10s)...');
  results.push(await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'straight', 10, { ...INITIAL_ROBOT_POSE }));

  console.log('[2/6] Running Preset 11 on Straight Track (10s)...');
  results.push(await benchmarkControllerOnTrack('Preset 11 (Discrete PID)', preset11.code, 'straight', 10, { ...INITIAL_ROBOT_POSE }));

  // Track 2: Oval Track (30s)
  console.log('[3/6] Running Preset 10 on Oval Track (30s)...');
  results.push(await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'oval', 30, { ...INITIAL_ROBOT_POSE }));

  console.log('[4/6] Running Preset 11 on Oval Track (30s)...');
  results.push(await benchmarkControllerOnTrack('Preset 11 (Discrete PID)', preset11.code, 'oval', 30, { ...INITIAL_ROBOT_POSE }));

  // Track 3: Wavy Track (25s)
  console.log('[5/6] Running Preset 10 on Wavy Track (25s)...');
  results.push(await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'wavy', 25, { ...INITIAL_ROBOT_POSE, headingDeg: 40 }));

  console.log('[6/6] Running Preset 11 on Wavy Track (25s)...');
  results.push(await benchmarkControllerOnTrack('Preset 11 (Discrete PID)', preset11.code, 'wavy', 25, { ...INITIAL_ROBOT_POSE, headingDeg: 40 }));

  console.log('\n================================================================================');
  console.log('EMPIRICAL COMPARISON RESULTS (PRESET 10 vs. PRESET 11)');
  console.log('================================================================================\n');
  console.log(formatBenchmarkTable(results));
  console.log('\n================================================================================\n');
}

main().catch((err) => {
  console.error('Comparative benchmark failed:', err);
  process.exit(1);
});
