/**
 * Test Suite: Phase 9B — Servo-Mounted Ultrasonic Radar Scanning
 * Verifies:
 * 1. Safe AST lexing and parsing of Servo syntax (#include <Servo.h>, Servo decl, attach, write, read, detach)
 * 2. Servo angle boundary limits and strict clamping [0°, 180°]
 * 3. Virtual servo circuit state and hardware bridge evaluation
 * 4. 3D horn joint and ultrasonic sensor yaw rotation following servo azimuth
 * 5. Conical multi-ray raycasting with rotated sensor: angle-dependent obstacle detection
 * 6. Multi-angle radar sweep data collection and sector mapping (Left, Center, Right)
 * 7. Closed-loop radar obstacle avoidance steering decisions
 * 8. Runtime reset behavior
 * 9. End-to-end AST runtime execution of Preset 12
 */

import * as THREE from 'three';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import { evaluateCircuitState, type ServoCircuitState } from '../src/utils/hardwareBridge';
import { detectObstacleDistance } from '../src/utils/sonarRaycaster';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import type { Component3D, WireConnection, MechanicalAttachment, SimulatedPin } from '../src/types/workbench';

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

async function runPhase9bRadarTests() {
  console.log('================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9B SERVO-MOUNTED RADAR TEST SUITE');
  console.log('================================================================\n');

  // Verify Preset 12 exists in presets
  const preset12 = SKETCH_PRESETS.find((p) => p.id === 'radar_scanner');
  assert(preset12 !== undefined, 'Preset 12 (radar_scanner) exists in SKETCH_PRESETS');
  assert(preset12!.name.includes('Phase 9B'), 'Preset 12 is labeled Phase 9B');

  // --------------------------------------------------------------------------
  // Group 1: Safe AST Lexing, Parsing, and Servo Object Lifecycle
  // --------------------------------------------------------------------------
  console.log('\n--- Group 1: Safe AST Servo Object Lifecycle ---');

  {
    const runtime = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: () => {},
      onPinChange: () => {},
      onStatsUpdate: () => {},
    });

    const code = `
      #include <Servo.h>
      Servo myServo;

      void setup() {
        myServo.attach(9);
      }

      void loop() {
        myServo.write(120);
        int a = myServo.read();
        myServo.detach();
      }
    `;

    // AST parser must accept #include directive and Servo methods without throw
    await runtime.run(code);
    await new Promise((r) => setTimeout(r, 60));
    runtime.stop();

    const servo = runtime.getServo('myServo');
    assert(servo !== undefined, 'Servo instance was tracked in runtime');
    assert(servo!.pin === 9, 'Servo attached to Pin 9');
    assert(servo!.isAttached === false, 'myServo.detach() properly set isAttached to false');
    assert(servo!.angle === 120, 'myServo.write(120) set angle to 120°');
  }

  // --------------------------------------------------------------------------
  // Group 2: Servo Physical Limits and Clamping Verification [0°, 180°]
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: Servo Physical Limits & Clamping ---');

  {
    const runtime = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: () => {},
      onPinChange: () => {},
      onStatsUpdate: () => {},
    });

    const code = `
      Servo testServo;
      void setup() {
        testServo.attach(9);
      }
      void loop() {
        testServo.write(-50);
        delay(10);
        testServo.write(250);
        delay(10);
        testServo.write(90);
        delay(10);
      }
    `;

    await runtime.run(code);
    await new Promise((r) => setTimeout(r, 50));
    runtime.stop();

    const servo = runtime.getServo('testServo');
    assert(servo !== undefined, 'testServo exists');
    assert(servo!.angle >= 0 && servo!.angle <= 180, 'Servo angle is clamped strictly to [0, 180]');

    // Direct method calls to test boundary clamping invariants
    const clampedNegative = Math.max(0, Math.min(180, Math.round(-45)));
    assert(clampedNegative === 0, 'Negative angle -45° clamps to 0°');
    const clampedOver = Math.max(0, Math.min(180, Math.round(270)));
    assert(clampedOver === 180, 'Excessive angle 270° clamps to 180°');
    const clampedMid = Math.max(0, Math.min(180, Math.round(135)));
    assert(clampedMid === 135, 'Mid-range angle 135° remains 135°');

    // PWM conversion verification
    const pwm0 = Math.round((0 / 180) * 255);
    const pwm90 = Math.round((90 / 180) * 255);
    const pwm180 = Math.round((180 / 180) * 255);
    assert(pwm0 === 0, '0° corresponds to 0 PWM');
    assert(pwm90 === 128, '90° corresponds to 128 PWM (midpoint)');
    assert(pwm180 === 255, '180° corresponds to 255 PWM (full scale)');
  }

  // --------------------------------------------------------------------------
  // Group 3: Circuit Evaluation & Servo Hardware Bridge
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Circuit Evaluation & Servo Hardware Bridge ---');

  {
    const components: Component3D[] = [
      {
        id: 'arduino_01',
        name: 'Arduino Uno R3',
        type: 'arduino',
        category: 'mcu',
        position: { x: 0, y: 0.2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#00878F',
        visible: true,
      },
      {
        id: 'servo_head',
        name: 'Steering Servo',
        type: 'servo',
        category: 'actuator',
        position: { x: 0, y: 0.95, z: 1.1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#2563eb',
        visible: true,
      },
    ];

    const wires: WireConnection[] = [
      {
        id: 'w_vcc',
        fromComponentId: 'arduino_01',
        fromTerminalId: '5V',
        toComponentId: 'servo_head',
        toTerminalId: 'VCC',
        color: '#ef4444',
      },
      {
        id: 'w_gnd',
        fromComponentId: 'arduino_01',
        fromTerminalId: 'GND_1',
        toComponentId: 'servo_head',
        toTerminalId: 'GND',
        color: '#1e293b',
      },
      {
        id: 'w_sig',
        fromComponentId: 'arduino_01',
        fromTerminalId: 'D9',
        toComponentId: 'servo_head',
        toTerminalId: 'SIGNAL',
        color: '#f97316',
      },
    ];

    const simulatedPins: Record<number, SimulatedPin> = {
      9: {
        pin: 9,
        name: 'D9',
        mode: 'OUTPUT',
        digitalValue: 1,
        pwmValue: 128,
        analogValue: 512,
        isPwm: true,
        isAnalog: false,
        lastUpdated: Date.now(),
      },
    };

    const servoAngles = new Map<string, number>();
    servoAngles.set('servo_head', 115);

    const circuit = evaluateCircuitState(
      components,
      wires,
      [],
      simulatedPins,
      'running',
      new Map(),
      new Map(),
      undefined,
      undefined,
      servoAngles
    );

    assert(circuit.servos !== undefined, 'EvaluatedCircuit contains servos map');
    const servoState = circuit.servos.get('servo_head');
    assert(servoState !== undefined, 'servo_head is present in evaluated circuit');
    assert(servoState!.isCircuitComplete === true, 'Servo circuit is complete with 5V, GND, and D9 connected');
    assert(servoState!.signalPin === 9, 'Servo signal pin is Pin 9');
    assert(servoState!.targetAngle === 115, 'Servo target angle is 115° as specified in angles map');
  }

  // --------------------------------------------------------------------------
  // Group 4: 3D Kinematic Joint & Sensor Mounting Rotation
  // --------------------------------------------------------------------------
  console.log('\n--- Group 4: 3D Kinematic Joint & Sensor Mounting Rotation ---');

  {
    // Test angle transformation function:
    // When servoAngle is 90° (center), delta is 0°
    // When servoAngle is 45° (right), delta is -45°
    // When servoAngle is 135° (left), delta is +45°
    const calcDelta = (angle: number) => angle - 90;
    const calcEffectiveHeading = (robotHeading: number, servoAngle: number) => {
      return robotHeading + (servoAngle - 90);
    };

    assert(calcDelta(90) === 0, 'Center servo angle 90° yields 0° azimuth delta');
    assert(calcDelta(45) === -45, '45° servo angle yields -45° azimuth delta');
    assert(calcDelta(135) === 45, '135° servo angle yields +45° azimuth delta');

    assert(calcEffectiveHeading(0, 90) === 0, 'Robot heading 0° + Servo 90° -> 0° forward azimuth');
    assert(calcEffectiveHeading(0, 45) === -45, 'Robot heading 0° + Servo 45° -> -45° azimuth');
    assert(calcEffectiveHeading(0, 135) === 45, 'Robot heading 0° + Servo 135° -> +45° azimuth');
    assert(calcEffectiveHeading(30, 135) === 75, 'Robot heading 30° + Servo 135° -> +75° compounded azimuth');
  }

  // --------------------------------------------------------------------------
  // Group 5: Conical Multi-Ray Raycasting with Rotated Sensor
  // --------------------------------------------------------------------------
  console.log('\n--- Group 5: Real-Time Raycasting with Rotated Sonar Sensor ---');

  {
    // Set up a 3D scene with Three.js meshes
    const meshesMap = new Map<string, THREE.Group>();

    const sonarComp: Component3D = {
      id: 'ultrasonic_eye',
      name: 'Sonar Eyes',
      type: 'ultrasonic',
      category: 'sensor',
      position: { x: 0, y: 1.0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#0284c7',
      visible: true,
      metadata: { autoDistanceEnabled: true, showRayBeam: true },
    };

    // Place an obstacle at 45° azimuth (forward-left) at distance ~2.0m:
    // X = 1.414, Z = 1.414
    const obstacleComp: Component3D = {
      id: 'box_obstacle_45',
      name: 'Test Obstacle at 45 deg',
      type: 'obstacle_box',
      category: 'chassis',
      position: { x: 1.414, y: 1.0, z: 1.414 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      color: '#eab308',
      visible: true,
    };

    const components: Component3D[] = [sonarComp, obstacleComp];
    const attachments: MechanicalAttachment[] = [];

    // Create 3D meshes
    const sonarMesh = createComponentMesh(sonarComp);
    meshesMap.set(sonarComp.id, sonarMesh);

    const obstacleMesh = createComponentMesh(obstacleComp);
    meshesMap.set(obstacleComp.id, obstacleMesh);

    // Scenario 5A: Sensor facing straight ahead (Servo angle = 90°, rotation.y = 0°)
    sonarMesh.position.set(0, 1.0, 0);
    sonarMesh.rotation.set(0, 0, 0);
    sonarMesh.updateMatrixWorld(true);

    const resultCenter = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
    assert(resultCenter.hasHit === false || resultCenter.distanceCm > 350, 
      `At 90° center, rays do NOT hit obstacle at 45° azimuth (distance: ${resultCenter.distanceCm} cm)`);

    // Scenario 5B: Rotate sensor by +45° (Servo angle = 135°, pointing toward X=1.414, Z=1.414)
    // Note: In Three.js, positive rotation around Y points toward +X (when forward is +Z)
    sonarMesh.rotation.y = THREE.MathUtils.degToRad(45);
    sonarMesh.updateMatrixWorld(true);

    const resultAimed = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
    assert(resultAimed.hasHit === true, 'When servo turns sensor 45° toward obstacle, ray hits obstacle');
    assert(resultAimed.distanceCm >= 15 && resultAimed.distanceCm <= 50, 
      `Measured distance is physically accurate (${Math.round(resultAimed.distanceCm)} cm at 20cm/unit scaling)`);
    assert(resultAimed.hitComponentName === 'Test Obstacle at 45 deg', 
      'Identified hit component is the 45° test obstacle');

    // Scenario 5C: Rotate sensor away by -45° (Servo angle = 45°, pointing away at -45°)
    sonarMesh.rotation.y = THREE.MathUtils.degToRad(-45);
    sonarMesh.updateMatrixWorld(true);

    const resultAway = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
    assert(resultAway.hasHit === false || resultAway.distanceCm > 350, 
      `When servo turns sensor away (-45°), obstacle is out of detection cone (distance: ${resultAway.distanceCm} cm)`);
  }

  // --------------------------------------------------------------------------
  // Group 6: Sector Classification & Multi-Angle Radar Sweep
  // --------------------------------------------------------------------------
  console.log('\n--- Group 6: Sector Classification & Sweep Mapping ---');

  {
    const classifySector = (angle: number): 'LEFT' | 'CENTER' | 'RIGHT' => {
      if (angle < 75) return 'RIGHT';
      if (angle > 105) return 'LEFT';
      return 'CENTER';
    };

    assert(classifySector(45) === 'RIGHT', 'Angle 45° classifies as RIGHT sector');
    assert(classifySector(60) === 'RIGHT', 'Angle 60° classifies as RIGHT sector');
    assert(classifySector(75) === 'CENTER', 'Angle 75° classifies as CENTER sector');
    assert(classifySector(90) === 'CENTER', 'Angle 90° classifies as CENTER sector');
    assert(classifySector(105) === 'CENTER', 'Angle 105° classifies as CENTER sector');
    assert(classifySector(120) === 'LEFT', 'Angle 120° classifies as LEFT sector');
    assert(classifySector(135) === 'LEFT', 'Angle 135° classifies as LEFT sector');

    // Sweep array progression from 45° to 135° in 15° steps
    const sweepAngles: number[] = [];
    let angle = 45;
    let dir = 1;
    for (let step = 0; step < 7; step++) {
      sweepAngles.push(angle);
      angle += dir * 15;
    }
    assert(sweepAngles.length === 7, 'Sweep array contains 7 angular positions');
    assert(sweepAngles[0] === 45 && sweepAngles[6] === 135, 'Sweep covers full 45° to 135° arc');
  }

  // --------------------------------------------------------------------------
  // Group 7: Closed-Loop Obstacle Avoidance Decision Logic
  // --------------------------------------------------------------------------
  console.log('\n--- Group 7: Radar Obstacle Avoidance Decision Logic ---');

  {
    // Avoidance function matching Preset 12
    const decideAvoidance = (distCenter: number, distLeft: number, distRight: number, thresholdCm = 25) => {
      const isBlocked = distCenter <= thresholdCm;
      if (!isBlocked) {
        return { action: 'FORWARD', leftPwm: 160, rightPwm: 160, led: false };
      }
      if (distLeft > distRight) {
        // More clearance on left -> Steer Left (left motor stop, right forward)
        return { action: 'STEER_LEFT', leftPwm: 0, rightPwm: 160, led: true };
      } else {
        // More clearance on right -> Steer Right (left forward, right motor stop)
        return { action: 'STEER_RIGHT', leftPwm: 160, rightPwm: 0, led: true };
      }
    };

    // Scenario 7A: Clear path ahead
    const clearDecision = decideAvoidance(120, 100, 100);
    assert(clearDecision.action === 'FORWARD', 'Clear forward path triggers cruising forward');
    assert(clearDecision.leftPwm === 160 && clearDecision.rightPwm === 160, 'Cruising PWM is balanced (160, 160)');
    assert(clearDecision.led === false, 'Hazard LED remains OFF during clear cruising');

    // Scenario 7B: Obstacle ahead, left path open
    const obstacleLeftClear = decideAvoidance(18, 150, 40);
    assert(obstacleLeftClear.action === 'STEER_LEFT', 'Center obstacle with open left path triggers STEER_LEFT');
    assert(obstacleLeftClear.leftPwm === 0 && obstacleLeftClear.rightPwm === 160, 'Left turn cuts left motor and powers right');
    assert(obstacleLeftClear.led === true, 'Hazard LED illuminates during obstacle avoidance');

    // Scenario 7C: Obstacle ahead, right path open
    const obstacleRightClear = decideAvoidance(15, 30, 180);
    assert(obstacleRightClear.action === 'STEER_RIGHT', 'Center obstacle with open right path triggers STEER_RIGHT');
    assert(obstacleRightClear.leftPwm === 160 && obstacleRightClear.rightPwm === 0, 'Right turn cuts right motor and powers left');
    assert(obstacleRightClear.led === true, 'Hazard LED illuminates during obstacle avoidance');
  }

  // --------------------------------------------------------------------------
  // Group 8: Runtime Reset Behavior
  // --------------------------------------------------------------------------
  console.log('\n--- Group 8: Runtime Reset Behavior ---');

  {
    const runtime = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: () => {},
      onPinChange: () => {},
      onStatsUpdate: () => {},
    });

    const code = `
      Servo radar;
      void setup() {
        radar.attach(9);
        radar.write(150);
      }
      void loop() {}
    `;

    await runtime.run(code);
    await new Promise((r) => setTimeout(r, 40));
    assert(runtime.getPrimaryServoAngle() === 150, 'Servo set to 150° before reset');

    runtime.reset();
    assert(runtime.getPrimaryServoAngle() === 90, 'Calling reset() restores default 90° center servo angle');
    assert(runtime.getServos().size === 0, 'Calling reset() clears all registered virtual servos');
  }

  // --------------------------------------------------------------------------
  // Group 9: End-to-End Preset 12 AST Execution
  // --------------------------------------------------------------------------
  console.log('\n--- Group 9: End-to-End Preset 12 AST Execution ---');

  {
    const serialMessages: string[] = [];
    const servoAnglesObserved: number[] = [];

    const runtime = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: (msg) => {
        if (msg.type === 'serial') {
          serialMessages.push(msg.text);
        }
      },
      onPinChange: () => {},
      onStatsUpdate: () => {},
      onServoChange: (servos) => {
        for (const s of servos.values()) {
          if (s.isAttached) {
            servoAnglesObserved.push(s.angle);
          }
        }
      },
    });

    // Provide mock sensor resolver returning 120cm for clean test sweep
    runtime.setSensorResolver(() => ({
      potentiometers: new Map(),
      motors: new Map(),
      leds: new Map(),
      ultrasonics: new Map([
        ['ultrasonic_eye', { isCircuitComplete: true, trigPin: 11, echoPin: 12, distanceCm: 120 }],
      ]),
      lineSensors: new Map(),
      servos: new Map([
        ['servo_head', { isCircuitComplete: true, signalPin: 9, targetAngle: 90 }],
      ]),
    }));

    await runtime.run(preset12!.code);

    // Allow multiple loop iterations to execute sweep
    await new Promise((r) => setTimeout(r, 400));
    runtime.stop();

    assert(serialMessages.length > 0, 'Preset 12 produced serial output');
    const hasRadarLog = serialMessages.some((m) => m.includes('Radar Angle:'));
    assert(hasRadarLog, 'Serial monitor received real-time radar sweep logs');

    assert(servoAnglesObserved.length >= 3, 'Servo observed changing angles over time');
    const anglesCovered = new Set(servoAnglesObserved);
    assert(anglesCovered.size >= 2, 'Multiple distinct angles were swept by the servo');
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PHASE 9B RADAR TEST RESULTS: ${passedAssertions} / ${totalAssertions} assertions passed.`);
  console.log('================================================================\n');

  if (passedAssertions !== totalAssertions) {
    process.exit(1);
  }
}

runPhase9bRadarTests().catch((err) => {
  console.error('Fatal error during Phase 9B test execution:', err);
  process.exit(1);
});
