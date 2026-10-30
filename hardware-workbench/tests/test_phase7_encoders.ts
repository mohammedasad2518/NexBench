import * as THREE from 'three';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import {
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  updateWheelEncoders,
  createInitialWheelEncoderState,
  DEFAULT_ENCODER_CONFIG,
  INITIAL_ROBOT_POSE,
  type WheelEncoderState,
} from '../src/utils/robotKinematics';

console.log('================================================================');
console.log('Hardware Workbench — Phase 7 Automated Test Suite');
console.log('Virtual Wheel Encoders, Odometry & Closed-Loop Motor Control');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       ${details}`);
    failedTests++;
  }
}

async function runTests() {
  // ==========================================================================
  // TEST 1: Interrupt API & AST Parser Compatibility
  // ==========================================================================
  console.log('--- TEST 1: Interrupt Registration & AST Interpreter Support ---');

  const testRuntime = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: () => {},
    onStatsUpdate: () => {},
  });

  const interruptTestSketch = `
    volatile long leftTicks = 0;
    volatile long rightTicks = 0;
    const int pinLeft = 2;
    const int pinRight = 3;

    void leftISR() {
      leftTicks++;
    }

    void rightISR() {
      rightTicks++;
    }

    void setup() {
      pinMode(pinLeft, INPUT_PULLUP);
      pinMode(pinRight, INPUT_PULLUP);
      attachInterrupt(digitalPinToInterrupt(pinLeft), leftISR, RISING);
      attachInterrupt(digitalPinToInterrupt(pinRight), rightISR, RISING);
    }

    void loop() {
      delay(50);
    }
  `;

  const compileSuccess = await testRuntime.run(interruptTestSketch);
  assert(compileSuccess, 'Sketch with volatile modifiers and attachInterrupt compiles & runs cleanly');

  const regInterrupts = testRuntime.getRegisteredInterrupts();
  assert(regInterrupts.size === 2, 'Exactly 2 external interrupts registered (INT0 and INT1)');
  assert(regInterrupts.get(0)?.pin === 2, 'INT0 mapped to Pin 2');
  assert(regInterrupts.get(0)?.functionName === 'leftISR', 'INT0 bound to leftISR');
  assert(regInterrupts.get(1)?.pin === 3, 'INT1 mapped to Pin 3');
  assert(regInterrupts.get(1)?.functionName === 'rightISR', 'INT1 bound to rightISR');
  assert(testRuntime.areInterruptsEnabled(), 'Interrupts are enabled by default');

  // Trigger left and right interrupts
  await testRuntime.triggerInterrupt(2, 'RISING');
  await testRuntime.triggerInterrupt(2, 'RISING');
  await testRuntime.triggerInterrupt(3, 'RISING');

  assert(testRuntime.getGlobal('leftTicks') === 2, 'Left ISR executed twice -> leftTicks == 2');
  assert(testRuntime.getGlobal('rightTicks') === 1, 'Right ISR executed once -> rightTicks == 1');

  // Test noInterrupts()
  const disableTestSketch = `
    void setup() {
      noInterrupts();
    }
    void loop() {}
  `;
  await testRuntime.run(disableTestSketch);
  assert(!testRuntime.areInterruptsEnabled(), 'noInterrupts() successfully disables interrupt execution');

  testRuntime.stop();

  // ==========================================================================
  // TEST 2: Wheel Encoder Physical Dimensions & Pulse Geometry
  // ==========================================================================
  console.log('\n--- TEST 2: Wheel Encoder Physical Geometry & Scale ---');

  const radiusUnits = DEFAULT_ENCODER_CONFIG.wheelRadiusUnits; // 0.9 units
  const unitsToCm = DEFAULT_ENCODER_CONFIG.unitsToCm;          // 20 cm
  const radiusCm = radiusUnits * unitsToCm;                    // 18.0 cm
  const circumferenceCm = 2 * Math.PI * radiusCm;              // ~113.1 cm
  const distPerTickCm = circumferenceCm / DEFAULT_ENCODER_CONFIG.slotsPerRevolution; // ~5.655 cm

  assert(Math.abs(radiusCm - 18.0) < 1e-4, 'Wheel radius is 18.0 cm (0.9 Three.js units)');
  assert(DEFAULT_ENCODER_CONFIG.slotsPerRevolution === 20, 'Optical encoder disk has 20 slots/revolution');
  assert(Math.abs(circumferenceCm - 113.097) < 0.01, 'Wheel circumference is ~113.1 cm');
  assert(Math.abs(distPerTickCm - 5.655) < 0.01, 'Each encoder tick corresponds to ~5.655 cm travel');

  // ==========================================================================
  // TEST 3: Forward Travel Pulse Accumulation
  // ==========================================================================
  console.log('\n--- TEST 3: Forward Travel Encoder Pulse Accumulation ---');

  let encState: WheelEncoderState = createInitialWheelEncoderState();
  assert(encState.leftTicks === 0 && encState.rightTicks === 0, 'Initial encoder state has 0 ticks');
  assert(encState.averageDistanceCm === 0, 'Initial odometry distance is 0.0 cm');

  // Simulate forward motion at PWM 190 (speed = 1.4902 units/s) for 1.0 second (60 frames at dt = 1/60s)
  const dt = 1.0 / 60.0;
  const forwardSpeeds = computeWheelSpeeds(190, 190);
  let totalLeftPulses = 0;
  let totalRightPulses = 0;

  for (let frame = 0; frame < 60; frame++) {
    const res = updateWheelEncoders(encState, forwardSpeeds.leftWheelSpeed, forwardSpeeds.rightWheelSpeed, dt);
    encState = res.nextState;
    if (res.leftPulseTriggered) totalLeftPulses += res.newLeftTicks;
    if (res.rightPulseTriggered) totalRightPulses += res.newRightTicks;
  }

  // Linear distance = 1.4902 units * 20 cm/unit ~= 29.8 cm
  // Expected ticks = floor(29.8 / 5.655) = 5 ticks
  assert(encState.leftTicks === 5, `Forward travel produced exactly 5 left ticks (actual: ${encState.leftTicks})`);
  assert(encState.rightTicks === 5, `Forward travel produced exactly 5 right ticks (actual: ${encState.rightTicks})`);
  assert(totalLeftPulses === 5, 'Accumulated pulse triggers match leftTicks');
  assert(totalRightPulses === 5, 'Accumulated pulse triggers match rightTicks');
  assert(Math.abs(encState.averageDistanceCm - 28.27) < 0.1, `Odometry distance is ~28.3 cm (actual: ${encState.averageDistanceCm.toFixed(1)} cm)`);

  // ==========================================================================
  // TEST 4: Reverse Travel Handling
  // ==========================================================================
  console.log('\n--- TEST 4: Reverse Travel Encoder Accumulation ---');

  // Reverse motion (both wheels negative speed)
  const reverseSpeeds = computeWheelSpeeds(190, 190, -1, -1);
  assert(reverseSpeeds.leftWheelSpeed < 0 && reverseSpeeds.rightWheelSpeed < 0, 'Reverse wheel speeds are negative');

  // Optical interrupter counts slot boundaries regardless of rotation direction
  const revRes = updateWheelEncoders(encState, reverseSpeeds.leftWheelSpeed, reverseSpeeds.rightWheelSpeed, 1.0);
  assert(revRes.nextState.leftTicks > encState.leftTicks, 'Reverse wheel rotation increments optical encoder ticks');
  assert(revRes.leftPulseTriggered, 'Reverse rotation generates pulse triggers');
  assert(revRes.nextState.averageDistanceCm > encState.averageDistanceCm, 'Odometry tracks cumulative wheel ground displacement');

  // ==========================================================================
  // TEST 5: Differential Steering & Turning
  // ==========================================================================
  console.log('\n--- TEST 5: Differential Steering & Turning Encoders ---');

  let turnState: WheelEncoderState = createInitialWheelEncoderState();
  // Turn right: Left motor faster (PWM 220), Right motor slower (PWM 80)
  const turnSpeeds = computeWheelSpeeds(220, 80);

  for (let frame = 0; frame < 60; frame++) {
    const res = updateWheelEncoders(turnState, turnSpeeds.leftWheelSpeed, turnSpeeds.rightWheelSpeed, dt);
    turnState = res.nextState;
  }

  assert(turnState.leftTicks > turnState.rightTicks, `Left wheel produced more ticks than right wheel during right turn (${turnState.leftTicks} > ${turnState.rightTicks})`);
  assert(turnState.leftDistanceCm > turnState.rightDistanceCm, 'Left wheel traveled further ground distance than right wheel');
  assert(turnState.averageDistanceCm === (turnState.leftDistanceCm + turnState.rightDistanceCm) / 2.0, 'Average odometry distance correctly averages both wheels');

  // In-place rotation: Left motor forward, Right motor reverse
  let spinState: WheelEncoderState = createInitialWheelEncoderState();
  const spinSpeeds = computeWheelSpeeds(190, 190, 1, -1);

  for (let frame = 0; frame < 60; frame++) {
    const res = updateWheelEncoders(spinState, spinSpeeds.leftWheelSpeed, spinSpeeds.rightWheelSpeed, dt);
    spinState = res.nextState;
  }

  assert(spinState.leftTicks === spinState.rightTicks, `In-place spin produces equal tick counts on both wheels (${spinState.leftTicks} == ${spinState.rightTicks})`);
  assert(spinState.leftTicks > 0, 'In-place spin increments optical encoder disks');

  // ==========================================================================
  // TEST 6: Reset Behavior
  // ==========================================================================
  console.log('\n--- TEST 6: Encoder State Reset Behavior ---');

  const resetState = createInitialWheelEncoderState();
  assert(resetState.leftTicks === 0, 'Reset encoder leftTicks == 0');
  assert(resetState.rightTicks === 0, 'Reset encoder rightTicks == 0');
  assert(resetState.leftDistanceCm === 0, 'Reset encoder leftDistanceCm == 0');
  assert(resetState.rightDistanceCm === 0, 'Reset encoder rightDistanceCm == 0');
  assert(resetState.averageDistanceCm === 0, 'Reset encoder averageDistanceCm == 0');

  // ==========================================================================
  // TEST 7: Preset 7 Closed-Loop Autonomous Workflow
  // ==========================================================================
  console.log('\n--- TEST 7: Preset 7 Closed-Loop Autonomous Odometry Workflow ---');

  const preset7 = SKETCH_PRESETS.find((p) => p.id === 'odometry_closed_loop');
  assert(Boolean(preset7), 'Preset 7 (odometry_closed_loop) exists in SKETCH_PRESETS');
  assert(preset7?.name.includes('Closed-Loop Odometry'), 'Preset 7 name mentions Closed-Loop Odometry');

  const runtime = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: () => {},
    onStatsUpdate: () => {},
  });

  const sketchStarted = await runtime.run(preset7!.code);
  assert(sketchStarted, 'Preset 7 sketch compiles and starts running');

  const registered = runtime.getRegisteredInterrupts();
  assert(registered.has(0) && registered.has(1), 'Preset 7 registered INT0 and INT1');
  assert(registered.get(0)?.functionName === 'leftISR', 'INT0 points to leftISR');
  assert(registered.get(1)?.functionName === 'rightISR', 'INT1 points to rightISR');

  // Initial state check
  assert(runtime.getGlobal('leftTicks') === 0, 'Initial leftTicks == 0');
  assert(runtime.getGlobal('rightTicks') === 0, 'Initial rightTicks == 0');

  // Simulate cruising forward: Send 5 ticks to both wheels
  for (let i = 0; i < 5; i++) {
    await runtime.triggerInterrupt(2, 'RISING');
    await runtime.triggerInterrupt(3, 'RISING');
  }

  assert(runtime.getGlobal('leftTicks') === 5, 'leftTicks incremented to 5 via interrupts');
  assert(runtime.getGlobal('rightTicks') === 5, 'rightTicks incremented to 5 via interrupts');

  // Simulate motor imbalance: Left wheel gets 2 more ticks (left = 7, right = 5)
  await runtime.triggerInterrupt(2, 'RISING');
  await runtime.triggerInterrupt(2, 'RISING');

  assert(runtime.getGlobal('leftTicks') === 7, 'Left wheel advanced to 7 ticks (faster drift)');
  assert(runtime.getGlobal('rightTicks') === 5, 'Right wheel remained at 5 ticks');

  // Simulate reaching target distance (targetTicks = 11)
  for (let i = 0; i < 6; i++) {
    await runtime.triggerInterrupt(2, 'RISING');
    await runtime.triggerInterrupt(3, 'RISING');
  }

  assert(runtime.getGlobal('leftTicks') >= 11, `Left wheel reached target ticks (actual: ${runtime.getGlobal('leftTicks')})`);
  assert(runtime.getGlobal('rightTicks') >= 11, `Right wheel reached target ticks (actual: ${runtime.getGlobal('rightTicks')})`);

  // Allow one loop cycle to process stop condition
  await new Promise((r) => setTimeout(r, 120));

  const pins = runtime.getPins();
  assert(pins[5].pwmValue === 0, 'Left Motor (Pin 5) stopped (PWM 0) upon reaching target distance');
  assert(pins[6].pwmValue === 0, 'Right Motor (Pin 6) stopped (PWM 0) upon reaching target distance');
  assert(pins[13].digitalValue === 1, 'Status LED (Pin 13) illuminated HIGH indicating precision halt');

  runtime.stop();

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`Phase 7 Test Results: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
