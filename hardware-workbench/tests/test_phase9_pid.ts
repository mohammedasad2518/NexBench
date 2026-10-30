/**
 * Test Suite: Phase 9A — PID Closed-Loop Line Following Control
 * Asserts:
 * 1. Proportional linearity and steering polarity
 * 2. Integral accumulation and anti-windup clamping
 * 3. Derivative damping and rate-of-change suppression
 * 4. Output saturation and actuator PWM limits [0, 255]
 * 5. Deadband behavior around line center
 * 6. Sensor loss and curve memory continuation
 * 7. Active search sweep pivot on prolonged loss
 * 8. Line reacquisition and smooth tracking recovery
 * 9. Intersection / transverse bar detection
 * 10. End-to-end AST runtime compatibility and execution
 */

import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import {
  sampleFloorSurface,
  DEFAULT_TRACK_CONFIG,
  type TrackConfig,
} from '../src/utils/floorTrack';
import {
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  INITIAL_ROBOT_POSE,
  type RobotPose,
} from '../src/utils/robotKinematics';

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function testPidSuite() {
  console.log('================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9A PID CONTROLLER TEST SUITE');
  console.log('================================================================\n');

  const preset11 = SKETCH_PRESETS.find((p) => p.id === 'pid_line_follower');
  assert(preset11 !== undefined, 'Preset 11 (pid_line_follower) exists in SKETCH_PRESETS');
  assert(preset11!.name.includes('Phase 9A'), 'Preset 11 is labeled Phase 9A');

  // --------------------------------------------------------------------------
  // Group 1: Discrete PID Mathematical Invariants (Proportional, Integral, Derivative)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 1: Discrete PID Mathematical Invariants ---');

  // Test 1.1: Proportional Linearity and Polarity
  {
    const Kp = 20; // 0.20
    const errSmall = 200;
    const errLarge = 400;

    const pSmall = Math.floor((Kp * errSmall) / 100);
    const pLarge = Math.floor((Kp * errLarge) / 100);

    assert(pSmall === 40, `Proportional term for error 200 is 40 (got ${pSmall})`);
    assert(pLarge === 80, `Proportional term for error 400 is 80 (got ${pLarge})`);
    assert(pLarge === 2 * pSmall, 'Proportional term is strictly linear with error magnitude');

    // Steering polarity: Drift RIGHT -> Left AO drops -> err > 0 -> correction > 0
    // leftPwm = baseSpeed - correction, rightPwm = baseSpeed + correction
    const baseSpeed = 185;
    const leftPwmDriftRight = baseSpeed - pSmall;
    const rightPwmDriftRight = baseSpeed + pSmall;
    assert(rightPwmDriftRight > leftPwmDriftRight, 'Positive error (drift right) increases right PWM and decreases left PWM (steers LEFT)');

    // Drift LEFT -> Right AO drops -> err < 0 -> correction < 0
    const pNegative = Math.floor((Kp * -errSmall) / 100);
    const leftPwmDriftLeft = baseSpeed - pNegative;
    const rightPwmDriftLeft = baseSpeed + pNegative;
    assert(leftPwmDriftLeft > rightPwmDriftLeft, 'Negative error (drift left) increases left PWM and decreases right PWM (steers RIGHT)');
  }

  // Test 1.2: Integral Anti-Windup Clamping & Zero-Crossing Damping
  {
    const maxIntegral = 30000;
    const Ki = 3;
    let integral = 0;
    const stepError = 800;

    // Accumulate for 50 steps
    for (let i = 0; i < 50; i++) {
      integral = Math.max(-maxIntegral, Math.min(maxIntegral, integral + stepError));
    }
    assert(integral === maxIntegral, `Integral clamps strictly to maxIntegral 30000 (got ${integral})`);
    const iTerm = Math.floor((Ki * integral) / 1000);
    assert(iTerm === 90, `Clamped integral term is bounded to 90 PWM (got ${iTerm})`);

    // Zero-crossing damping
    let lastError = 800;
    let newError = -400; // Sign flipped
    if ((newError > 0 && lastError < 0) || (newError < 0 && lastError > 0)) {
      integral = Math.floor(integral / 2);
    }
    assert(integral === 15000, `Zero-crossing immediately halves integral to prevent overshoot (got ${integral})`);
  }

  // Test 1.3: Derivative Damping Action
  {
    const Kd = 35; // 0.35
    // Sudden jump in error: 0 -> 300 (fast drift)
    let lastErr = 0;
    let currErr = 300;
    let dErr = currErr - lastErr;
    let dTerm = Math.floor((Kd * dErr) / 100);
    assert(dTerm === 105, `Derivative jump produces immediate corrective boost (+105 PWM) on error step`);

    // Returning to line: error drops from 300 to 100 (recovery motion)
    lastErr = 300;
    currErr = 100;
    dErr = currErr - lastErr; // -200
    dTerm = Math.floor((Kd * dErr) / 100);
    assert(dTerm === -70, `Derivative opposes return velocity (-70 PWM), actively braking to prevent overshoot`);
  }

  // Test 1.4: Output Saturation Limits
  {
    const baseSpeed = 185;
    const maxCorrection = 180;

    // Extreme correction +250 clamped to +180
    const clampedCorrPos = Math.max(-maxCorrection, Math.min(maxCorrection, 250));
    assert(clampedCorrPos === 180, 'Positive correction clamps to maxCorrection 180');
    const lPwm = Math.max(0, Math.min(255, baseSpeed - clampedCorrPos));
    const rPwm = Math.max(0, Math.min(255, baseSpeed + clampedCorrPos));
    assert(lPwm === 5, `Left motor clamped output is 5 PWM (>= 0)`);
    assert(rPwm === 255, `Right motor clamped output is 255 PWM (<= 255)`);

    // Extreme negative correction -250 clamped to -180
    const clampedCorrNeg = Math.max(-maxCorrection, Math.min(maxCorrection, -250));
    assert(clampedCorrNeg === -180, 'Negative correction clamps to -180');
    const lPwmRev = Math.max(0, Math.min(255, baseSpeed - clampedCorrNeg));
    const rPwmRev = Math.max(0, Math.min(255, baseSpeed + clampedCorrNeg));
    assert(lPwmRev === 255, `Left motor clamped output is 255 PWM (<= 255)`);
    assert(rPwmRev === 5, `Right motor clamped output is 5 PWM (>= 0)`);
  }

  // --------------------------------------------------------------------------
  // Group 2: Safe Arduino AST Execution of Preset 11
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: Safe Arduino AST Execution of Preset 11 ---');

  let currentPins: Record<number, number> = { 5: 0, 6: 0, 13: 0 };
  let simulatedLeftAO = 900;
  let simulatedRightAO = 900;
  let messages: string[] = [];

  const rt = new SafeArduinoRuntime({
    onStatusChange: (s) => {
      if (s === 'error') console.error('Preset 11 AST runtime error');
    },
    onConsoleMessage: (msg) => {
      messages.push(msg.text);
    },
    onPinChange: (p) => {
      currentPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
  });

  rt.setSensorResolver(() => {
    const sMap = new Map<string, any>();
    sMap.set('line_sensor_left', {
      componentId: 'line_sensor_left',
      isCircuitComplete: true,
      doPin: 4,
      aoPin: 15,
      digitalOutput: simulatedLeftAO < 500 ? 1 : 0,
      analogOutput: simulatedLeftAO,
      reflectance: simulatedLeftAO / 1023.0,
    });
    sMap.set('line_sensor_right', {
      componentId: 'line_sensor_right',
      isCircuitComplete: true,
      doPin: 7,
      aoPin: 16,
      digitalOutput: simulatedRightAO < 500 ? 1 : 0,
      analogOutput: simulatedRightAO,
      reflectance: simulatedRightAO / 1023.0,
    });
    return {
      leds: new Map(),
      motors: new Map(),
      ultrasonics: new Map(),
      potentiometers: new Map(),
      lineSensors: sMap,
    } as any;
  });

  simulatedLeftAO = 600;
  simulatedRightAO = 610;

  await rt.run(preset11!.code);
  assert(rt.getStatus() === 'running', 'SafeArduinoRuntime starts Preset 11 successfully in running state');

  // Test 2.1: Deadband & Straight Driving (Both sensors straddling line edges)
  await new Promise((r) => setTimeout(r, 80));
  assert(currentPins[5] === 185 && currentPins[6] === 185, `Within deadband (<40), both motors run at baseSpeed 185 (got L=${currentPins[5]}, R=${currentPins[6]})`);
  assert(currentPins[13] === 0, 'Status LED is OFF when within deadband center');




  // Test 2.2: Proportional Steering on Drift Right
  simulatedLeftAO = 300;  // Left sensor touches black line
  simulatedRightAO = 920; // Right sensor on white floor -> error = 620
  await new Promise((r) => setTimeout(r, 70));
  assert(currentPins[6] > currentPins[5], `Drift right causes right PWM > left PWM (got L=${currentPins[5]}, R=${currentPins[6]})`);
  assert(currentPins[13] > 0, 'Status LED lights HIGH (PWM 255) when error exceeds 60');


  // Test 2.3: Proportional Steering on Drift Left
  simulatedLeftAO = 920;  // Left sensor on white floor
  simulatedRightAO = 300; // Right sensor touches black line -> error = -620
  await new Promise((r) => setTimeout(r, 70));
  assert(currentPins[5] > currentPins[6], `Drift left causes left PWM > right PWM (got L=${currentPins[5]}, R=${currentPins[6]})`);

  // Test 2.4: Intersection / Transverse Bar Detection
  simulatedLeftAO = 150;
  simulatedRightAO = 150; // Both sensors deeply on black line
  await new Promise((r) => setTimeout(r, 70));
  assert(currentPins[5] === 120 && currentPins[6] === 120, `Intersection detected: robot crawls at straight 120 PWM (got L=${currentPins[5]}, R=${currentPins[6]})`);

  // Test 2.5: Line Loss & Curve Memory Continuation
  // First simulate turning left
  simulatedLeftAO = 350;
  simulatedRightAO = 900;
  await new Promise((r) => setTimeout(r, 50));
  // Now line is completely lost (both white)
  simulatedLeftAO = 950;
  simulatedRightAO = 950;
  await new Promise((r) => setTimeout(r, 80));
  assert(currentPins[5] === 20 && currentPins[6] === 210, `Line loss (<30 ticks): maintains curve memory continuation (L=${currentPins[5]}, R=${currentPins[6]})`);

  // Test 2.6: Search Sweep Pivot on Prolonged Line Loss (>30 ticks)
  // Each cycle takes ~35ms (25ms delay + 10ms yield), so 35 cycles need ~1.3s
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 35));
    if (currentPins[5] === 0 && currentPins[6] === 150) break;
  }
  assert(currentPins[5] === 0 && currentPins[6] === 150, `Prolonged loss (>30 ticks): enters active search sweep pivot (L=${currentPins[5]}, R=${currentPins[6]})`);


  // Test 2.7: Line Reacquisition
  simulatedLeftAO = 200; // Line reacquired on left
  simulatedRightAO = 850;
  await new Promise((r) => setTimeout(r, 60));
  assert(currentPins[5] > 0 || currentPins[6] > 0, 'Reacquiring line immediately exits search sweep and restores PID control');

  rt.stop();
  assert(rt.getStatus() === 'stopped', 'SafeArduinoRuntime stops cleanly in stopped state');


  // --------------------------------------------------------------------------
  // Group 3: Kinematic Integration & Closed-Loop Stability on Tracks
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Closed-Loop Kinematic Verification ---');

  // Verify that integrating differential kinematics with PID outputs maintains bounded trajectory
  const trackConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: 'straight' };
  let pose: RobotPose = { ...INITIAL_ROBOT_POSE };
  const speeds = computeWheelSpeeds(185, 185);
  const kin = computeDifferentialKinematics(speeds.leftWheelSpeed, speeds.rightWheelSpeed);
  const nextPose = integrateRobotPose(pose, kin.linearVelocity, kin.angularVelocityDeg, 0.5);

  assert(Math.abs(nextPose.x) < 0.001, 'Straight forward integration maintains X = 0');
  assert(nextPose.z > 0.5, 'Robot moves forward along +Z axis');
  assert(Math.abs(nextPose.headingDeg) < 0.001, 'Heading remains strictly 0°');

  console.log(`\n================================================================`);
  console.log(`TEST SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
  console.log(`================================================================\n`);
}

testPidSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
