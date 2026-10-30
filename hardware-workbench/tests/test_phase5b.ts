import * as THREE from 'three';
import { 
  detectObstacleDistance, 
  updateSonarBeamVisual, 
  getRobotAssemblyComponentIds,
  SONAR_SAFE_THRESHOLD_CM,
  SONAR_MAX_DISTANCE_CM
} from '../src/utils/sonarRaycaster';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { evaluateCircuitState } from '../src/utils/hardwareBridge';
import { autoConnectUltrasonicSensor } from '../src/utils/sensorAutoConnect';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import type { Component3D, WireConnection, MechanicalAttachment } from '../src/types/workbench';

console.log('================================================================');
console.log('Hardware Workbench — Phase 5B Automated Test Suite');
console.log('Real-Time Ultrasonic 3D Raycasting & Dynamic Obstacle Avoidance');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------
// Test 1: Mesh Generation for Movable Obstacles (Box and Wall)
// ----------------------------------------------------------------------
console.log('--- TEST 1: Movable 3D Obstacle Components Creation ---');

const obstacleBoxComp: Component3D = {
  id: 'box_obs_1',
  name: 'Cardboard Box Obstacle',
  type: 'obstacle_box',
  category: 'structural',
  position: { x: 0, y: 1.1, z: 4.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#d97706',
  visible: true,
};

const obstacleWallComp: Component3D = {
  id: 'wall_obs_1',
  name: 'Obstacle Barrier Wall',
  type: 'obstacle_wall',
  category: 'structural',
  position: { x: 2, y: 1.2, z: 5.0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#64748b',
  visible: true,
};

const boxMesh = createComponentMesh(obstacleBoxComp);
const wallMesh = createComponentMesh(obstacleWallComp);

assert(boxMesh instanceof THREE.Group, 'obstacle_box creates valid THREE.Group');
assert(wallMesh instanceof THREE.Group, 'obstacle_wall creates valid THREE.Group');
assert(boxMesh.userData.isObstacle === true, 'obstacle_box tagged with isObstacle = true');
assert(wallMesh.userData.isObstacle === true, 'obstacle_wall tagged with isObstacle = true');

// ----------------------------------------------------------------------
// Test 2: Robot Self-Mesh Exclusion Filtering
// ----------------------------------------------------------------------
console.log('\n--- TEST 2: Robot Self-Mesh Exclusion Filtering ---');

const sonarComp: Component3D = {
  id: 'sonar_1',
  name: 'Sonar Eyes',
  type: 'ultrasonic',
  category: 'sensor',
  position: { x: 0, y: 1.5, z: 1.1 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.9, y: 0.9, z: 0.9 },
  color: '#0284c7',
  visible: true,
  metadata: { autoDistanceEnabled: true, showRayBeam: true, distanceCm: 68 },
};

const chassisComp: Component3D = {
  id: 'chassis_1',
  name: 'Main Chassis',
  type: 'chassis',
  category: 'structural',
  position: { x: 0, y: 0.5, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#1e293b',
  visible: true,
};

const wheelComp: Component3D = {
  id: 'wheel_1',
  name: 'Left Wheel',
  type: 'wheel',
  category: 'actuator',
  position: { x: -2, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.9, y: 0.9, z: 0.9 },
  color: '#1e293b',
  visible: true,
};

const robotComps = [sonarComp, chassisComp, wheelComp];
const attachments: MechanicalAttachment[] = [
  { 
    id: 'att_chassis_sonar', 
    parentComponentId: 'chassis_1', 
    childComponentId: 'sonar_1', 
    parentMountId: 'mount_1',
    childMountId: 'mount_child',
    jointType: 'fixed',
    relativePosition: { x: 0, y: 1, z: 1.1 },
    relativeRotation: { x: 0, y: 0, z: 0 }
  }
];

const robotExcludedIds = getRobotAssemblyComponentIds(sonarComp.id, robotComps, attachments);
assert(robotExcludedIds.has('sonar_1'), 'Self-sensor excluded from raycasting');
assert(robotExcludedIds.has('chassis_1'), 'Robot chassis excluded from raycasting');
assert(robotExcludedIds.has('wheel_1'), 'Robot wheel excluded from raycasting');
assert(!robotExcludedIds.has('box_obs_1'), 'Obstacle box is NOT excluded (candidate for detection)');

// ----------------------------------------------------------------------
// Test 3: Real-Time 3D Raycasting Detection with Three.js Meshes
// ----------------------------------------------------------------------
console.log('\n--- TEST 3: Real-Time Three.js Multi-Ray Conical Obstacle Raycasting ---');

const meshesMap = new Map<string, THREE.Group>();
const sonarMesh = createComponentMesh(sonarComp);
sonarMesh.position.set(sonarComp.position.x, sonarComp.position.y, sonarComp.position.z);
meshesMap.set(sonarComp.id, sonarMesh);

boxMesh.position.set(obstacleBoxComp.position.x, obstacleBoxComp.position.y, obstacleBoxComp.position.z);
meshesMap.set(obstacleBoxComp.id, boxMesh);

const allComponents = [...robotComps, obstacleBoxComp];

// Initial raycast with box at Z = 4.5
const rayResult1 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
assert(rayResult1.hasHit === true, 'Raycast hits obstacle box at Z=4.5');
assert(rayResult1.hitComponentName === 'Cardboard Box Obstacle', 'Detected obstacle name matches component');
assert(rayResult1.distanceCm >= 50 && rayResult1.distanceCm <= 65, 
  `Raycast distance at Z=4.5 is within expected range (~55cm)`, `got ${rayResult1.distanceCm} cm`);

// Move box closer: Z = 2.3 -> directly in warning range (<= 25 cm)
boxMesh.position.set(0, 1.1, 2.3);
const rayResult2 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
assert(rayResult2.hasHit === true, 'Raycast hits obstacle box at Z=2.3');
assert(rayResult2.distanceCm <= SONAR_SAFE_THRESHOLD_CM, 
  `Raycast distance at Z=2.3 is within danger brake zone (<= 25 cm)`, `got ${rayResult2.distanceCm} cm`);

// Move box far away: Z = 30 (beyond 400 cm max range)
boxMesh.position.set(0, 1.1, 30.0);
const rayResult3 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
assert(rayResult3.hasHit === false, 'Obstacle beyond 20 units (400 cm) is not detected');
assert(rayResult3.distanceCm === SONAR_MAX_DISTANCE_CM, 'Distance clamps to SONAR_MAX_DISTANCE_CM (400 cm)');

// Move box behind the sensor (Z = -3.0) -> sensor faces forward (+Z), should NOT detect it
boxMesh.position.set(0, 1.1, -3.0);
const rayResult4 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
assert(rayResult4.hasHit === false, 'Obstacle behind sensor face is NOT detected');

// ----------------------------------------------------------------------
// Test 4: Visual Sonar Cone Updates & Styling
// ----------------------------------------------------------------------
console.log('\n--- TEST 4: Visual Sonar Cone Updates & Color Thresholds ---');

// Far distance (60 cm) -> Clear blue cone
updateSonarBeamVisual(sonarMesh, 60, true, true);
let beamGroup = sonarMesh.getObjectByName('sonar_beam_visual_group') as THREE.Group;
assert(!!beamGroup, 'Sonar beam visual group attached to sensor mesh');
assert(beamGroup.visible === true, 'Sonar beam group is visible');
let coneMesh = beamGroup.getObjectByName('sonar_cone_mesh') as THREE.Mesh;
let coneMat = coneMesh.material as THREE.MeshBasicMaterial;
assert(coneMat.color.getHex() === 0x0284c7, 'Beam color is Cyan Blue when distance > 25 cm (Clear)');

// Close distance (15 cm) -> Red alert cone
updateSonarBeamVisual(sonarMesh, 15, true, true);
coneMat = coneMesh.material as THREE.MeshBasicMaterial;
assert(coneMat.color.getHex() === 0xef4444, 'Beam color switches to Alert Red when distance <= 25 cm (Warning)');

// Toggle beam off
updateSonarBeamVisual(sonarMesh, 15, false, true);
assert(beamGroup.visible === false, 'Sonar beam group is hidden when showRayBeam is false');

// ----------------------------------------------------------------------
// Test 5: End-to-End Autonomous Preset 6 Obstacle Avoidance Reaction
// ----------------------------------------------------------------------
console.log('\n--- TEST 5: Preset 6 Autonomous Braking & Obstacle Avoidance Execution ---');

const mockArduino: Component3D = {
  id: 'arduino_01',
  name: 'Arduino Uno',
  type: 'arduino',
  category: 'controller',
  position: { x: 0, y: 0.5, z: -0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#059669',
  visible: true,
};

const motorLeft: Component3D = {
  id: 'motor_left',
  name: 'Left Motor',
  type: 'dc_motor',
  category: 'actuator',
  position: { x: -1.4, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#eab308',
  visible: true,
};

const motorRight: Component3D = {
  id: 'motor_right',
  name: 'Right Motor',
  type: 'dc_motor',
  category: 'actuator',
  position: { x: 1.4, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#eab308',
  visible: true,
};

const fullSceneComps = [mockArduino, sonarComp, motorLeft, motorRight, obstacleBoxComp];

// Auto-connect ultrasonic sensor (VCC->5V, GND->GND, TRIG->D11, ECHO->D12)
const connResult = autoConnectUltrasonicSensor(sonarComp.id, fullSceneComps, []);
let sceneWires: WireConnection[] = [...connResult.addedWires];

// Wire motorLeft (D5) and motorRight (D6)
sceneWires.push(
  { id: 'w_m1_pos', fromComponentId: 'arduino_01', fromTerminalId: 'D5', toComponentId: 'motor_left', toTerminalId: 'TERM_POS', color: '#3b82f6' },
  { id: 'w_m1_neg', fromComponentId: 'arduino_01', fromTerminalId: 'D6', toComponentId: 'motor_left', toTerminalId: 'TERM_NEG', color: '#1e293b' },
  { id: 'w_m2_pos', fromComponentId: 'arduino_01', fromTerminalId: 'D9', toComponentId: 'motor_right', toTerminalId: 'TERM_POS', color: '#3b82f6' },
  { id: 'w_m2_neg', fromComponentId: 'arduino_01', fromTerminalId: 'D10', toComponentId: 'motor_right', toTerminalId: 'TERM_NEG', color: '#1e293b' }
);

const sonarDistanceOverrides = new Map<string, number>();
const sonarObstacleNames = new Map<string, string>();

let currentPinStates: Record<number, any> = {};

const runtime = new SafeArduinoRuntime({
  onStatusChange: () => {},
  onConsoleMessage: () => {},
  onPinChange: (pin) => {
    currentPinStates[pin.pin] = pin;
  },
  onStatsUpdate: () => {},
});

runtime.setSensorResolver(() => {
  return evaluateCircuitState(
    fullSceneComps,
    sceneWires,
    [],
    currentPinStates,
    'running',
    sonarDistanceOverrides,
    sonarObstacleNames
  );
});

// Load Preset 6: Smart Obstacle Avoidance Robot
const preset6 = SKETCH_PRESETS.find(p => p.id === 'ultrasonic_obstacle');
assert(!!preset6, 'Preset 6 (Obstacle Avoidance Robot) exists in SKETCH_PRESETS');

// STEP A: Clear Path (Raycast distance = 60 cm > 25 cm safe threshold)
sonarDistanceOverrides.set(sonarComp.id, 60);
sonarObstacleNames.set(sonarComp.id, 'Clear Path');

async function runAsyncTests() {
  // Run iterations of the sketch loop
  await runtime.run(preset6!.code);
  await new Promise(r => setTimeout(r, 120));

  // Check motor pins: D5 (PWM) and D6 (PWM) should be driven forward (PWM ~190)
  const pin5_clear = currentPinStates[5];
  const pin6_clear = currentPinStates[6];
  assert(pin5_clear && pin5_clear.pwmValue > 150, 
    `Clear path (>25cm): Left motor pin D5 PWM is driving forward (>150)`, 
    `got ${pin5_clear?.pwmValue}`);
  assert(pin6_clear && pin6_clear.pwmValue > 150, 
    `Clear path (>25cm): Right motor pin D6 PWM is driving forward (>150)`, 
    `got ${pin6_clear?.pwmValue}`);

  // STEP B: Imminent Obstacle Detected (Real-time raycast updates to 14 cm <= 25 cm)
  sonarDistanceOverrides.set(sonarComp.id, 14);
  sonarObstacleNames.set(sonarComp.id, 'Cardboard Box Obstacle');

  // Wait for next loop cycles
  await new Promise(r => setTimeout(r, 350));

  // Check reaction: Pin 5 and Pin 6 should brake to 0 PWM, and Pin 13 warning LED should be HIGH
  const pin5_obs = currentPinStates[5];
  const pin6_obs = currentPinStates[6];
  const pin13_obs = currentPinStates[13];
  assert(pin5_obs && pin5_obs.pwmValue === 0, 
    'Obstacle detected (14cm <= 25cm): Left motor D5 braked to 0 PWM', 
    `D5 PWM=${pin5_obs?.pwmValue}`);
  assert(pin6_obs && pin6_obs.pwmValue === 0, 
    'Obstacle detected (14cm <= 25cm): Right motor D6 braked to 0 PWM', 
    `D6 PWM=${pin6_obs?.pwmValue}`);
  assert(pin13_obs && pin13_obs.digitalValue === 1, 
    'Obstacle detected (14cm <= 25cm): Warning LED (Pin 13) switched to HIGH', 
    `D13=${pin13_obs?.digitalValue}`);

  runtime.stop();

  // ----------------------------------------------------------------------
  // Test 6: Manual Distance Override Preservation
  // ----------------------------------------------------------------------
  console.log('\n--- TEST 6: Manual Distance Controls Preservation ---');

  const manualSonarComp: Component3D = {
    ...sonarComp,
    metadata: {
      ...sonarComp.metadata,
      autoDistanceEnabled: false,
      distanceCm: 12,
    }
  };

  const manualCircuit = evaluateCircuitState(
    [mockArduino, manualSonarComp],
    connResult.addedWires,
    [],
    {},
    'running',
    // Even if a real-time raycast override exists:
    new Map([[manualSonarComp.id, 85]]),
    new Map()
  );

  const manualState = manualCircuit.ultrasonics.get(manualSonarComp.id);
  assert(manualState?.distanceCm === 12, 
    'When autoDistanceEnabled is false, manual distance (12 cm) is strictly preserved', 
    `got ${manualState?.distanceCm}`);

  // ----------------------------------------------------------------------
  // Final Test Results Summary
  // ----------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`Phase 5B Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAsyncTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
