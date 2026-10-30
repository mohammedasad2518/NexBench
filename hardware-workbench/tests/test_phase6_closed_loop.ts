import * as THREE from 'three';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import {
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  calculateRobotRelativeOffsets,
  applyAlignedChildTransform,
  INITIAL_ROBOT_POSE,
  type RobotPose,
} from '../src/utils/robotKinematics';
import { detectObstacleDistance } from '../src/utils/sonarRaycaster';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { evaluateCircuitState } from '../src/utils/hardwareBridge';
import type { Component3D, WireConnection, MechanicalAttachment } from '../src/types/workbench';

console.log('================================================================');
console.log('Hardware Workbench — Phase 6 Closed-Loop Navigation Test');
console.log('End-to-End Sequence: Preset 6 Autonomous Braking & Movement');
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

// 1. Setup Complete Robot Scene
const components: Component3D[] = [
  {
    id: 'chassis_01',
    name: 'Robot Chassis Base',
    type: 'chassis',
    category: 'structural',
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
    visible: true,
  },
  {
    id: 'arduino_01',
    name: 'Arduino Uno',
    type: 'arduino',
    category: 'controller',
    position: { x: 0, y: 0.65, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
    visible: true,
  },
  {
    id: 'motor_left',
    name: 'Left Drive Motor',
    type: 'dc_motor',
    category: 'actuator',
    position: { x: -1.4, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#eab308',
    visible: true,
  },
  {
    id: 'wheel_left',
    name: 'Left Wheel',
    type: 'wheel',
    category: 'actuator',
    position: { x: -2.0, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#1e293b',
    visible: true,
  },
  {
    id: 'motor_right',
    name: 'Right Drive Motor',
    type: 'dc_motor',
    category: 'actuator',
    position: { x: 1.4, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#eab308',
    visible: true,
  },
  {
    id: 'wheel_right',
    name: 'Right Wheel',
    type: 'wheel',
    category: 'actuator',
    position: { x: 2.0, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#1e293b',
    visible: true,
  },
  {
    id: 'status_led',
    name: 'Warning LED',
    type: 'led',
    category: 'output',
    position: { x: 0.8, y: 0.72, z: -0.8 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    color: '#ef4444',
    visible: true,
  },
  {
    id: 'ultrasonic_eye',
    name: 'Sonar Eyes',
    type: 'ultrasonic',
    category: 'sensor',
    position: { x: 0, y: 1.5, z: 1.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#0284c7',
    visible: true,
    metadata: { distanceCm: 55, autoDistanceEnabled: true },
  },
  {
    id: 'obstacle_box_01',
    name: 'Cardboard Box Obstacle',
    type: 'obstacle_box',
    category: 'structural',
    position: { x: 0, y: 1.1, z: 4.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#d97706',
    visible: true,
  },
];

const attachments: MechanicalAttachment[] = [
  {
    id: 'att_motor_left',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_motor_left',
    childComponentId: 'motor_left',
    childMountId: 'mount_chassis',
    jointType: 'fixed',
    relativePosition: { x: -1.4, y: -0.05, z: 0.5 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_wheel_left',
    parentComponentId: 'motor_left',
    parentMountId: 'mount_shaft',
    childComponentId: 'wheel_left',
    childMountId: 'mount_hub',
    jointType: 'revolute',
    motorSpeed: 15,
    motorMaxForce: 8.0,
    relativePosition: { x: -0.6, y: 0, z: 0 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_motor_right',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_motor_right',
    childComponentId: 'motor_right',
    childMountId: 'mount_chassis',
    jointType: 'fixed',
    relativePosition: { x: 1.4, y: -0.05, z: 0.5 },
    relativeRotation: { x: 0, y: 180, z: 0 },
  },
  {
    id: 'att_wheel_right',
    parentComponentId: 'motor_right',
    parentMountId: 'mount_shaft',
    childComponentId: 'wheel_right',
    childMountId: 'mount_hub',
    jointType: 'revolute',
    motorSpeed: 15,
    motorMaxForce: 8.0,
    relativePosition: { x: 0.6, y: 0, z: 0 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
];

const wires: WireConnection[] = [
  // Sonar
  { id: 'w_vcc', fromComponentId: 'arduino_01', fromTerminalId: '5V', toComponentId: 'ultrasonic_eye', toTerminalId: 'VCC', color: '#ef4444' },
  { id: 'w_gnd', fromComponentId: 'arduino_01', fromTerminalId: 'GND_1', toComponentId: 'ultrasonic_eye', toTerminalId: 'GND', color: '#1e293b' },
  { id: 'w_trig', fromComponentId: 'arduino_01', fromTerminalId: 'D11', toComponentId: 'ultrasonic_eye', toTerminalId: 'TRIG', color: '#3b82f6' },
  { id: 'w_echo', fromComponentId: 'arduino_01', fromTerminalId: 'D12', toComponentId: 'ultrasonic_eye', toTerminalId: 'ECHO', color: '#3b82f6' },
  // Motor Left (D5)
  { id: 'w_m1_pos', fromComponentId: 'arduino_01', fromTerminalId: 'D5', toComponentId: 'motor_left', toTerminalId: 'TERM_POS', color: '#eab308' },
  { id: 'w_m1_neg', fromComponentId: 'arduino_01', fromTerminalId: 'GND_2', toComponentId: 'motor_left', toTerminalId: 'TERM_NEG', color: '#1e293b' },
  // Motor Right (D6)
  { id: 'w_m2_pos', fromComponentId: 'arduino_01', fromTerminalId: 'D6', toComponentId: 'motor_right', toTerminalId: 'TERM_POS', color: '#eab308' },
  { id: 'w_m2_neg', fromComponentId: 'arduino_01', fromTerminalId: 'GND_2', toComponentId: 'motor_right', toTerminalId: 'TERM_NEG', color: '#1e293b' },
  // Warning LED (D13)
  { id: 'w_led_pos', fromComponentId: 'arduino_01', fromTerminalId: 'D13', toComponentId: 'status_led', toTerminalId: 'ANODE', color: '#ef4444' },
  { id: 'w_led_neg', fromComponentId: 'arduino_01', fromTerminalId: 'GND_3', toComponentId: 'status_led', toTerminalId: 'CATHODE', color: '#1e293b' },
];

const meshesMap = new Map<string, THREE.Group>();
for (const comp of components) {
  const mesh = createComponentMesh(comp);
  mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
  meshesMap.set(comp.id, mesh);
}

const offsets = calculateRobotRelativeOffsets(components, 'chassis_01');
const preset6 = SKETCH_PRESETS.find((p) => p.id === 'ultrasonic_obstacle')!;
const sonarComp = components.find((c) => c.id === 'ultrasonic_eye')!;
const chassisMesh = meshesMap.get('chassis_01')!;

let robotPose: RobotPose = { ...INITIAL_ROBOT_POSE };
const liveDistances = new Map<string, number>();
const liveObstacleNames = new Map<string, string>();
let currentPins: Record<number, any> = {};

const runtime = new SafeArduinoRuntime({
  onStatusChange: () => {},
  onConsoleMessage: () => {},
  onPinChange: (pin) => {
    currentPins[pin.pin] = pin;
  },
  onStatsUpdate: () => {},
});

runtime.setSensorResolver(() => {
  return evaluateCircuitState(
    components,
    wires,
    attachments,
    currentPins,
    'running',
    liveDistances,
    liveObstacleNames
  );
});

async function runClosedLoopTest() {
  console.log('--- SEQUENCE 1: Initial State & Forward Motion ---');
  // Initial Raycast at Z = 0
  const ray1 = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
  liveDistances.set(sonarComp.id, ray1.distanceCm);
  liveObstacleNames.set(sonarComp.id, ray1.hitComponentName || 'Obstacle');
  assert(ray1.distanceCm > 45 && ray1.distanceCm < 60, `Step 1: Starting distance is ~52 cm (${ray1.distanceCm} cm)`);

  // Start Preset 6
  await runtime.run(preset6.code);
  await new Promise((r) => setTimeout(r, 200));

  const p5_start = currentPins[5]?.pwmValue || 0;
  const p6_start = currentPins[6]?.pwmValue || 0;
  const p13_start = currentPins[13]?.digitalValue || 0;
  assert(p5_start === 190 && p6_start === 190, `Step 2: Motors produced forward motion (PWM 190 on D5 & D6)`);
  assert(p13_start === 0, `Warning LED is OFF (D13 = 0) while cruising`);

  console.log('\n--- SEQUENCE 2: Robot Moves Toward Obstacle & Distance Decreases ---');
  // Integrate motion forward: 1.0 second of cruising
  const speeds1 = computeWheelSpeeds(p5_start, p6_start);
  const kin1 = computeDifferentialKinematics(speeds1.leftWheelSpeed, speeds1.rightWheelSpeed);
  robotPose = integrateRobotPose(robotPose, kin1.linearVelocity, 0, 1.0);
  assert(robotPose.z > 1.4, `Step 3: Robot moved forward toward obstacle (Z = ${robotPose.z.toFixed(2)})`);

  // Propagate pose to chassis and all child meshes
  chassisMesh.position.set(robotPose.x, robotPose.y, robotPose.z);
  offsets.forEach((rel) => {
    const child = meshesMap.get(rel.componentId);
    if (child) applyAlignedChildTransform(child, rel, robotPose);
  });

  // Re-cast ray from moved sensor
  const ray2 = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
  liveDistances.set(sonarComp.id, ray2.distanceCm);
  assert(ray2.distanceCm < ray1.distanceCm, `Step 4: Sonar distance decreased automatically (${ray1.distanceCm} cm -> ${ray2.distanceCm} cm)`);

  console.log('\n--- SEQUENCE 3: Threshold Reached (<= 25 cm) & Autonomous Braking ---');
  // Move forward closer into the braking zone (advance by 0.55 units)
  robotPose = integrateRobotPose(robotPose, kin1.linearVelocity, 0, 0.55);
  chassisMesh.position.set(robotPose.x, robotPose.y, robotPose.z);
  offsets.forEach((rel) => {
    const child = meshesMap.get(rel.componentId);
    if (child) applyAlignedChildTransform(child, rel, robotPose);
  });

  const ray3 = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
  liveDistances.set(sonarComp.id, ray3.distanceCm);
  assert(ray3.distanceCm <= 25, `Sonar distance entered braking zone (now = ${ray3.distanceCm} cm <= 25 cm)`);

  // Allow Preset 6 loop to execute another cycle with the new distance
  await new Promise((r) => setTimeout(r, 250));

  const p5_brake = currentPins[5]?.pwmValue || 0;
  const p6_brake = currentPins[6]?.pwmValue || 0;
  const p13_brake = currentPins[13]?.digitalValue || 0;
  assert(p5_brake === 0, `Step 5: Left motor PWM set to 0 by Arduino sketch`);
  assert(p6_brake === 0, `Step 5: Right motor PWM set to 0 by Arduino sketch`);
  assert(p13_brake === 1, `Step 5: Warning LED turned ON (D13 = HIGH)`);

  // Verify robot stops moving
  const speedsBrake = computeWheelSpeeds(p5_brake, p6_brake);
  const kinBrake = computeDifferentialKinematics(speedsBrake.leftWheelSpeed, speedsBrake.rightWheelSpeed);
  assert(kinBrake.linearVelocity === 0, 'Step 6: Robot halted completely with 0 linear velocity');
  assert(4.5 - robotPose.z > 1.2, `Step 6: Robot stopped safely before colliding with box at Z=4.5 (gap = ${(4.5 - robotPose.z).toFixed(2)} units)`);

  console.log('\n--- SEQUENCE 4: Moving Obstacle Away Resumes Motion ---');
  // Move box farther away to Z = 9.0
  const obsMesh = meshesMap.get('obstacle_box_01')!;
  obsMesh.position.z = 9.0;
  components.find((c) => c.id === 'obstacle_box_01')!.position.z = 9.0;

  const ray4 = detectObstacleDistance(sonarComp, meshesMap, components, attachments);
  liveDistances.set(sonarComp.id, ray4.distanceCm);
  assert(ray4.distanceCm > 60, `Moving obstacle away produced clear reading (now = ${ray4.distanceCm} cm)`);

  // Wait for next loop iteration
  await new Promise((r) => setTimeout(r, 250));

  const p5_resume = currentPins[5]?.pwmValue || 0;
  const p6_resume = currentPins[6]?.pwmValue || 0;
  assert(p5_resume === 190 && p6_resume === 190, `Step 7: Robot resumed forward cruising at PWM 190 when path cleared`);

  console.log('\n--- SEQUENCE 5: Reset Pose Control ---');
  // Reset pose back to origin
  robotPose = { ...INITIAL_ROBOT_POSE };
  chassisMesh.position.set(INITIAL_ROBOT_POSE.x, INITIAL_ROBOT_POSE.y, INITIAL_ROBOT_POSE.z);
  chassisMesh.rotation.set(0, 0, 0);
  offsets.forEach((rel) => {
    const child = meshesMap.get(rel.componentId);
    if (child) applyAlignedChildTransform(child, rel, INITIAL_ROBOT_POSE);
  });
  assert(chassisMesh.position.z === 0, 'Chassis position reset to Z = 0');
  const sensorResetMesh = meshesMap.get('ultrasonic_eye')!;
  assert(sensorResetMesh.position.z === 1.1, 'Sensor reset to Z = 1.1');

  runtime.stop();
  assert(runtime.getStatus() === 'stopped', 'Arduino runtime stopped cleanly');

  console.log('\n================================================================');
  console.log(`Phase 6 Closed-Loop Navigation Test: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runClosedLoopTest().catch((err) => {
  console.error('Fatal error in closed-loop test:', err);
  process.exit(1);
});
