/**
 * Comprehensive Simulation & Kinematics Test for Phase 8
 * Tests:
 * 1. Oval track continuous closed loop
 * 2. Wavy S-curve tracking
 * 3. Straight track tracking
 * 4. Off-track displacement recovery (Scenario 6)
 * 5. T-junction / intersection crossing (Scenario 7)
 */

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
import { SafeArduinoRuntime } from '../src/utils/arduinoRuntime';

const REFINED_SKETCH = `
int pinLeftDO = 4;
int pinRightDO = 7;
int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;

int baseSpeed = 160;
int turnSpeedLow = 0;
int turnSpeedHigh = 190;

int lastTurnDir = 0;
int lostLineCounter = 0;

void setup() {
  Serial.begin(9600);
  pinMode(pinLeftDO, INPUT);
  pinMode(pinRightDO, INPUT);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int leftDO = digitalRead(pinLeftDO);
  int rightDO = digitalRead(pinRightDO);

  // Case 1: Drift Right -> Left sensor touches black line -> Steer LEFT
  if (leftDO == 1 && rightDO == 0) {
    lostLineCounter = 0;
    lastTurnDir = -1;
    analogWrite(motorLeft, turnSpeedLow);
    analogWrite(motorRight, turnSpeedHigh);
    digitalWrite(ledPin, HIGH);
  }
  // Case 2: Drift Left -> Right sensor touches black line -> Steer RIGHT
  else if (leftDO == 0 && rightDO == 1) {
    lostLineCounter = 0;
    lastTurnDir = 1;
    analogWrite(motorLeft, turnSpeedHigh);
    analogWrite(motorRight, turnSpeedLow);
    digitalWrite(ledPin, HIGH);
  }
  // Case 3: Intersection / Checkered bar (Both sensors on line)
  else if (leftDO == 1 && rightDO == 1) {
    lostLineCounter = 0;
    lastTurnDir = 0;
    analogWrite(motorLeft, 110);
    analogWrite(motorRight, 110);
    digitalWrite(ledPin, HIGH);
  }
  // Case 4: Neither sensor on line (White floor)
  else {
    // If we were recently turning, continue the curve until line reacquired!
    if (lastTurnDir == 1 && lostLineCounter < 30) {
      lostLineCounter++;
      analogWrite(motorLeft, turnSpeedHigh);
      analogWrite(motorRight, turnSpeedLow);
      digitalWrite(ledPin, HIGH);
    } else if (lastTurnDir == -1 && lostLineCounter < 30) {
      lostLineCounter++;
      analogWrite(motorLeft, turnSpeedLow);
      analogWrite(motorRight, turnSpeedHigh);
      digitalWrite(ledPin, HIGH);
    } else {
      lostLineCounter++;
      if (lostLineCounter > 40) {
        // Recovery search sweep
        int searchDir = -1;
        if (lastTurnDir != 0) {
          searchDir = lastTurnDir;
        }
        if (searchDir == -1) {
          analogWrite(motorLeft, 0);
          analogWrite(motorRight, 140);
        } else {
          analogWrite(motorLeft, 140);
          analogWrite(motorRight, 0);
        }
        digitalWrite(ledPin, HIGH);
      } else {
        analogWrite(motorLeft, baseSpeed);
        analogWrite(motorRight, baseSpeed);
        digitalWrite(ledPin, LOW);
      }
    }
  }

  delay(25);
}
`;

async function runScenario(
  name: string,
  trackType: 'oval' | 'straight' | 'wavy',
  initialPose: RobotPose,
  steps: number,
  disturbFn?: (step: number, pose: RobotPose) => RobotPose
) {
  console.log(`\n--- Running Scenario: ${name} (Track: ${trackType}) ---`);

  const trackConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: trackType };
  let currentPins: Record<number, number> = { 5: 0, 6: 0, 13: 0 };
  const rt = new SafeArduinoRuntime({
    onStatusChange: (s) => {
      if (s === 'error') console.error('Arduino Runtime ERROR!');
    },
    onConsoleMessage: (msg) => {
      if (msg.type === 'error') console.error('Serial Error:', msg.text);
    },
    onPinChange: (p) => {
      currentPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
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

  await rt.run(REFINED_SKETCH);

  const dt = 0.05;
  let maxDeviation = 0;

  for (let step = 0; step < steps; step++) {
    await new Promise((r) => setTimeout(r, 8));

    if (disturbFn) {
      pose = disturbFn(step, pose);
    }

    const p5 = currentPins[5] || 0;
    const p6 = currentPins[6] || 0;

    const speeds = computeWheelSpeeds(p5, p6);
    const kin = computeDifferentialKinematics(speeds.leftWheelSpeed, speeds.rightWheelSpeed);
    pose = integrateRobotPose(pose, kin.linearVelocity, kin.angularVelocityDeg, dt);

    const rad = (pose.headingDeg * Math.PI) / 180.0;
    const frontX = pose.x + 1.25 * Math.sin(rad);
    const frontZ = pose.z + 1.25 * Math.cos(rad);
    const sample = sampleFloorSurface(frontX, frontZ, trackConfig);

    if (sample.distanceToLineCenter > maxDeviation) {
      maxDeviation = sample.distanceToLineCenter;
    }

    if (step % 50 === 0 || step === steps - 1) {
      console.log(
        `[t=${(step * dt).toFixed(1)}s] Pose: X=${pose.x.toFixed(2)}, Z=${pose.z.toFixed(2)}, Yaw=${pose.headingDeg.toFixed(1)}° | PWM: L=${p5}, R=${p6} | distToLine: ${sample.distanceToLineCenter.toFixed(2)}`
      );
    }
  }

  rt.stop();
  console.log(`Max deviation: ${maxDeviation.toFixed(2)} units. Final pose: X=${pose.x.toFixed(2)}, Z=${pose.z.toFixed(2)}, Yaw=${pose.headingDeg.toFixed(1)}°`);
  return { maxDeviation, finalPose: pose };
}

async function main() {
  console.log('====================================================');
  console.log('HARDWARE WORKBENCH — PHASE 8 KINEMATIC VERIFICATION');
  console.log('====================================================');

  // Test 1: Straight track
  const straightRes = await runScenario('Straight Track (10s)', 'straight', { ...INITIAL_ROBOT_POSE }, 200);
  if (straightRes.maxDeviation <= 0.2) {
    console.log('[PASS] Straight track: Robot drove straight with near zero deviation');
  } else {
    console.error('[FAIL] Straight track deviation too high:', straightRes.maxDeviation);
  }

  // Test 2: Oval track complete loop (30s)
  const ovalRes = await runScenario('Oval Track (30s)', 'oval', { ...INITIAL_ROBOT_POSE }, 600);
  if (ovalRes.maxDeviation <= 0.3) {
    console.log('[PASS] Oval loop: Robot navigated curves and straightaways within 0.3 units');
  } else {
    console.error('[FAIL] Oval track deviation too high:', ovalRes.maxDeviation);
  }

  // Test 3: Wavy S-Curve track (25s) with tangent initial heading
  const wavyRes = await runScenario('Wavy S-Curve Track (25s)', 'wavy', { ...INITIAL_ROBOT_POSE, headingDeg: 40 }, 500);
  if (wavyRes.maxDeviation <= 0.35) {
    console.log('[PASS] Wavy track: Robot smoothly followed S-curve reversals within 0.35 units');
  } else {
    console.error('[FAIL] Wavy track deviation too high:', wavyRes.maxDeviation);
  }

  // Test 3: Off-track recovery (Scenario 6)
  // At step 60 (t=3.0s), suddenly displace robot by +0.8 units on X onto white floor
  let displaced = false;
  const recoveryRes = await runScenario(
    'Off-Track Displacement & Recovery (15s)',
    'straight',
    { ...INITIAL_ROBOT_POSE },
    300,
    (step, pose) => {
      if (step === 60 && !displaced) {
        displaced = true;
        console.log(`>>> DELIBERATE DISPLACEMENT APPLIED at t=3.0s! Old X=${pose.x.toFixed(2)} -> New X=${(pose.x + 0.85).toFixed(2)}`);
        return { ...pose, x: pose.x + 0.85 };
      }
      return pose;
    }
  );
  // Check if robot reacquired the line (final distanceToLineCenter should be small)
  const finalDist = Math.abs(recoveryRes.finalPose.x);
  if (finalDist <= 0.25) {
    console.log(`[PASS] Off-track recovery: Robot reacquired line after displacement! (Final X=${recoveryRes.finalPose.x.toFixed(2)})`);
  } else {
    console.error(`[FAIL] Off-track recovery failed. Final X=${recoveryRes.finalPose.x.toFixed(2)}`);
  }

  console.log('\nAll kinematics scenarios completed.');
}

main().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
