/**
 * Line-Following Controller Benchmark Tool
 * Evaluates performance metrics (Error MAE/RMSE/Max, Oscillations, Speed, Distance)
 * on Straight, Oval, and Wavy tracks.
 */

import {
  sampleFloorSurface,
  DEFAULT_TRACK_CONFIG,
  type TrackConfig,
  type TrackType,
} from '../src/utils/floorTrack';
import {
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  INITIAL_ROBOT_POSE,
  type RobotPose,
  DEFAULT_KINEMATICS_CONFIG,
} from '../src/utils/robotKinematics';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';

export interface BenchmarkMetrics {
  controllerName: string;
  trackType: TrackType;
  durationSeconds: number;
  steps: number;
  maxDeviation: number;       // Max cross-track error (units)
  meanDeviation: number;      // Mean Absolute Error (MAE, units)
  rmse: number;               // Root Mean Square Error (RMSE, units)
  oscillationCount: number;   // Number of steering reversals (PWM_L - PWM_R sign flips)
  meanSteeringJerk: number;   // Mean |d(PWM_L - PWM_R)/dt| (PWM/s)
  avgSpeedCmS: number;        // Average forward velocity in cm/s
  distanceUnits: number;      // Total distance traveled (units)
  onTrackRatio: number;       // Fraction of time robot is within line boundaries
  finalPose: RobotPose;
}

export async function benchmarkControllerOnTrack(
  controllerName: string,
  sketchCode: string,
  trackType: TrackType,
  durationSeconds: number,
  initialPose: RobotPose = { ...INITIAL_ROBOT_POSE }
): Promise<BenchmarkMetrics> {
  const dt = 0.05;
  const totalSteps = Math.round(durationSeconds / dt);
  const trackConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: trackType };

  const currentPins: Record<number, number> = { 5: 0, 6: 0, 13: 0 };
  const rt = new SafeArduinoRuntime({
    onStatusChange: (s) => {
      if (s === 'error') console.error(`[${controllerName}] Runtime ERROR on ${trackType}`);
    },
    onConsoleMessage: () => { },
    onPinChange: (p) => {
      currentPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => { },
  });

  let pose: RobotPose = { ...initialPose };
  const sensorDistFront = 1.25;
  const sensorDistLat = 0.45;

  rt.setSensorResolver(() => {
    const rad = (pose.headingDeg * Math.PI) / 180.0;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const leftWorldX = pose.x + (-sensorDistLat * cos + sensorDistFront * sin);
    const leftWorldZ = pose.z + (-sensorDistLat * -sin + sensorDistFront * cos);

    const rightWorldX = pose.x + (sensorDistLat * cos + sensorDistFront * sin);
    const rightWorldZ = pose.z + (sensorDistLat * -sin + sensorDistFront * cos);

    const leftSample = sampleFloorSurface(leftWorldX, leftWorldZ, trackConfig);
    const rightSample = sampleFloorSurface(rightWorldX, rightWorldZ, trackConfig);

    const sMap = new Map<string, any>();
    sMap.set('line_sensor_left', {
      componentId: 'line_sensor_left',
      isCircuitComplete: true,
      doPin: 4,
      aoPin: 15,
      digitalOutput: leftSample.digitalValue,
      analogOutput: leftSample.analogValue,
      reflectance: leftSample.reflectance,
    });
    sMap.set('line_sensor_right', {
      componentId: 'line_sensor_right',
      isCircuitComplete: true,
      doPin: 7,
      aoPin: 16,
      digitalOutput: rightSample.digitalValue,
      analogOutput: rightSample.analogValue,
      reflectance: rightSample.reflectance,
    });

    return {
      leds: new Map(),
      motors: new Map(),
      ultrasonics: new Map(),
      potentiometers: new Map(),
      lineSensors: sMap,
    } as any;
  });

  await rt.run(sketchCode);

  let maxDeviation = 0;
  let sumDeviation = 0;
  let sumSquaredDeviation = 0;
  let onTrackSteps = 0;
  let totalDistanceUnits = 0;
  let sumLinearVelocity = 0;

  let oscillationCount = 0;
  let totalSteeringDiffDelta = 0;
  let prevSteeringDiff = 0;

  for (let step = 0; step < totalSteps; step++) {
    // Small sleep to let AST interpreter execute loop iterations
    await new Promise((r) => setTimeout(r, 6));

    const p5 = currentPins[5] || 0;
    const p6 = currentPins[6] || 0;

    const speeds = computeWheelSpeeds(p5, p6);
    const kin = computeDifferentialKinematics(speeds.leftWheelSpeed, speeds.rightWheelSpeed);
    const nextPose = integrateRobotPose(pose, kin.linearVelocity, kin.angularVelocityDeg, dt);

    const stepDist = Math.hypot(nextPose.x - pose.x, nextPose.z - pose.z);
    totalDistanceUnits += stepDist;
    sumLinearVelocity += kin.linearVelocity;
    pose = nextPose;

    // Sample distance to line at the robot front center (virtual sensor bar center)
    const rad = (pose.headingDeg * Math.PI) / 180.0;
    const frontX = pose.x + sensorDistFront * Math.sin(rad);
    const frontZ = pose.z + sensorDistFront * Math.cos(rad);
    const sample = sampleFloorSurface(frontX, frontZ, trackConfig);

    const dev = sample.distanceToLineCenter;
    if (dev > maxDeviation) maxDeviation = dev;
    sumDeviation += dev;
    sumSquaredDeviation += dev * dev;

    if (dev <= trackConfig.lineWidthUnits / 2.0 + 0.15) {
      onTrackSteps++;
    }

    // Steering oscillation analysis: steeringDiff = PWM_L - PWM_R
    const steeringDiff = p5 - p6;
    if (step > 0) {
      if ((prevSteeringDiff > 5 && steeringDiff < -5) || (prevSteeringDiff < -5 && steeringDiff > 5)) {
        oscillationCount++;
      }
      totalSteeringDiffDelta += Math.abs(steeringDiff - prevSteeringDiff);
    }
    prevSteeringDiff = steeringDiff;
  }

  rt.stop();

  const meanDeviation = sumDeviation / totalSteps;
  const rmse = Math.sqrt(sumSquaredDeviation / totalSteps);
  const avgLinearVelocity = sumLinearVelocity / totalSteps;
  const avgSpeedCmS = avgLinearVelocity * DEFAULT_KINEMATICS_CONFIG.unitsToCm;
  const meanSteeringJerk = totalSteeringDiffDelta / (totalSteps * dt);
  const onTrackRatio = onTrackSteps / totalSteps;

  return {
    controllerName,
    trackType,
    durationSeconds,
    steps: totalSteps,
    maxDeviation,
    meanDeviation,
    rmse,
    oscillationCount,
    meanSteeringJerk,
    avgSpeedCmS,
    distanceUnits: totalDistanceUnits,
    onTrackRatio,
    finalPose: pose,
  };
}

export function formatBenchmarkTable(results: BenchmarkMetrics[]): string {
  const header = `| Controller | Track | Dur | Max Dev | MAE | RMSE | Oscillations | Steer Jerk | Avg Speed | Dist | On-Track |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`;

  const rows = results.map((r) => {
    return `| ${r.controllerName} | ${r.trackType.padEnd(8)} | ${r.durationSeconds}s | ${r.maxDeviation.toFixed(3)} | ${r.meanDeviation.toFixed(3)} | ${r.rmse.toFixed(3)} | ${r.oscillationCount} flips | ${r.meanSteeringJerk.toFixed(1)}/s | ${r.avgSpeedCmS.toFixed(1)} cm/s | ${r.distanceUnits.toFixed(1)} | ${(r.onTrackRatio * 100).toFixed(1)}% |`;
  });

  return [header, ...rows].join('\n');
}

// Standalone runner to measure Preset 10 baseline
async function runBaseline() {
  console.log('========================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9A CONTROLLER BENCHMARK: PRESET 10 BASELINE');
  console.log('========================================================================\n');

  const preset10 = SKETCH_PRESETS.find((p) => p.id === 'line_follower');
  if (!preset10) {
    throw new Error('Preset 10 not found in SKETCH_PRESETS!');
  }

  const results: BenchmarkMetrics[] = [];

  console.log('[1/3] Benchmarking Preset 10 on Straight Track (10s)...');
  const straight = await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'straight', 10, { ...INITIAL_ROBOT_POSE });
  results.push(straight);

  console.log('[2/3] Benchmarking Preset 10 on Oval Track (30s)...');
  const oval = await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'oval', 30, { ...INITIAL_ROBOT_POSE });
  results.push(oval);

  console.log('[3/3] Benchmarking Preset 10 on Wavy Track (25s)...');
  const wavy = await benchmarkControllerOnTrack('Preset 10 (Bang-Bang)', preset10.code, 'wavy', 25, { ...INITIAL_ROBOT_POSE, headingDeg: 40 });
  results.push(wavy);

  console.log('\n--- PRESET 10 BASELINE MEASUREMENT RESULTS ---');
  console.log(formatBenchmarkTable(results));
  console.log('\nBaseline benchmarking complete.\n');
}

export { runBaseline };

if (process.argv[1]?.replace(/\\/g, '/').endsWith('benchmark_line_controllers.ts')) {
  runBaseline().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}


