/**
 * PID Tuning & Parameter Optimization Tool for Phase 9A
 */

import {
  benchmarkControllerOnTrack,
  formatBenchmarkTable,
  type BenchmarkMetrics,
} from './benchmark_line_controllers';
import { INITIAL_ROBOT_POSE } from '../src/utils/robotKinematics';

function generatePidSketch(kp: number, ki: number, kd: number, baseSpeed: number = 190): string {
  return `// High-Speed Discrete PID Line Following Robot (Phase 9A)
// Analog Pin A1 = Left Sensor AO (Pin 15), Analog Pin A2 = Right Sensor AO (Pin 16)
// Digital Pin 5 = Left Motor PWM, Digital Pin 6 = Right Motor PWM
// Digital Pin 13 = Status LED

int pinLeftAO = 15;
int pinRightAO = 16;
int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;

int baseSpeed = ${baseSpeed};
int maxCorrection = 180;

// Scaled Discrete PID Parameters
// Kp scaled by 100: ${kp} -> Kp = ${(kp / 100).toFixed(2)}
// Ki scaled by 1000: ${ki} -> Ki = ${(ki / 1000).toFixed(3)}
// Kd scaled by 10: ${kd} -> Kd = ${(kd / 10).toFixed(1)}
int Kp = ${kp};
int Ki = ${ki};
int Kd = ${kd};

int integral = 0;
int maxIntegral = 30000;
int lastError = 0;

int lostCounter = 0;
int lastTurnDir = 0; // -1: Left, 1: Right, 0: Straight

void setup() {
  Serial.begin(9600);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);

  Serial.println("Preset 11: Discrete PID Closed-Loop Controller active.");
  Serial.println("Reading analog reflectance on pins A1 & A2...");
}

void loop() {
  int leftAO = analogRead(pinLeftAO);
  int rightAO = analogRead(pinRightAO);

  // Black line ~100-250 (absorbs), White floor ~850-980 (reflects)
  // When centered: leftAO ~ rightAO -> error ~ 0
  // Drift RIGHT -> left sensor enters black line (leftAO drops) -> error > 0 -> steer LEFT
  // Drift LEFT  -> right sensor enters black line (rightAO drops) -> error < 0 -> steer RIGHT
  int error = rightAO - leftAO;

  // Case 1: Both sensors detect white floor -> Line Lost / Curve overshoot
  if (leftAO > 750 && rightAO > 750) {
    lostCounter++;
    integral = 0; // Anti-windup: reset integral on loss

    if (lostCounter < 30) {
      // Memory continuation: continue steering along last curve
      if (lastTurnDir == -1) {
        analogWrite(motorLeft, 20);
        analogWrite(motorRight, 210);
      } else if (lastTurnDir == 1) {
        analogWrite(motorLeft, 210);
        analogWrite(motorRight, 20);
      } else {
        analogWrite(motorLeft, baseSpeed);
        analogWrite(motorRight, baseSpeed);
      }
      digitalWrite(ledPin, HIGH);
    } else {
      // Search sweep pivot
      if (lastTurnDir == -1) {
        analogWrite(motorLeft, 0);
        analogWrite(motorRight, 150);
      } else {
        analogWrite(motorLeft, 150);
        analogWrite(motorRight, 0);
      }
      digitalWrite(ledPin, HIGH);
    }
  }
  // Case 2: Intersection / Transverse Bar -> Both sensors detect black line
  else if (leftAO < 300 && rightAO < 300) {
    lostCounter = 0;
    integral = 0;
    analogWrite(motorLeft, 120);
    analogWrite(motorRight, 120);
    digitalWrite(ledPin, HIGH);
  }
  // Case 3: Closed-Loop Discrete PID Tracking
  else {
    lostCounter = 0;

    // Track last turn direction for curve memory
    if (error > 80) {
      lastTurnDir = -1; // Steering Left
    } else if (error < -80) {
      lastTurnDir = 1;  // Steering Right
    }

    // Deadband around line center (line centered between dual sensors)
    int activeError = error;
    if (abs(error) < 50) {
      activeError = 0;
    }

    // 1. Proportional Term (scaled by 100)
    int pTerm = (Kp * activeError) / 100;

    // 2. Integral Term (scaled by 1000) with Anti-Windup Clamping
    if (activeError == 0 || (activeError > 0 && lastError < 0) || (activeError < 0 && lastError > 0)) {
      integral = integral / 2;
    }
    integral = constrain(integral + activeError, -maxIntegral, maxIntegral);
    int iTerm = (Ki * integral) / 1000;

    // 3. Derivative Term (scaled by 100)
    int dError = activeError - lastError;
    int dTerm = (Kd * dError) / 100;
    lastError = activeError;

    // Total Steering Correction
    int correction = pTerm + iTerm + dTerm;
    correction = constrain(correction, -maxCorrection, maxCorrection);

    int leftPwm = constrain(baseSpeed - correction, 0, 255);
    int rightPwm = constrain(baseSpeed + correction, 0, 255);

    analogWrite(motorLeft, leftPwm);
    analogWrite(motorRight, rightPwm);

    // LED illuminates proportionally to cross-track correction magnitude
    if (abs(activeError) > 80) {
      digitalWrite(ledPin, HIGH);
    } else {
      digitalWrite(ledPin, LOW);
    }
  }

  delay(25);
}
`;
}

async function runTuning() {
  console.log('====================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9A PID MULTI-TRACK TEST');
  console.log('====================================================\n');

  // Candidate: Kp=20, Ki=3, Kd=30, Speed=185
  const cand = { name: 'Preset 11 PID (Kp=20, Ki=3, Kd=30)', kp: 20, ki: 3, kd: 30, speed: 185 };
  const code = generatePidSketch(cand.kp, cand.ki, cand.kd, cand.speed);


  const results: BenchmarkMetrics[] = [];

  console.log('Running on Straight Track (10s)...');
  const straight = await benchmarkControllerOnTrack(cand.name, code, 'straight', 10, { ...INITIAL_ROBOT_POSE });
  results.push(straight);

  console.log('Running on Oval Track (30s)...');
  const oval = await benchmarkControllerOnTrack(cand.name, code, 'oval', 30, { ...INITIAL_ROBOT_POSE });
  results.push(oval);

  console.log('Running on Wavy Track (25s)...');
  const wavy = await benchmarkControllerOnTrack(cand.name, code, 'wavy', 25, { ...INITIAL_ROBOT_POSE, headingDeg: 40 });
  results.push(wavy);

  console.log('\n--- PRESET 11 CANDIDATE RESULTS ---');
  console.log(formatBenchmarkTable(results));
}



runTuning().catch((err) => {
  console.error('Tuning error:', err);
  process.exit(1);
});
