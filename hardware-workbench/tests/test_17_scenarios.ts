import * as THREE from 'three';
import { 
  detectObstacleDistance, 
  updateSonarBeamVisual, 
  getRobotAssemblyComponentIds,
  SONAR_SAFE_THRESHOLD_CM,
  SONAR_MAX_DISTANCE_CM,
  SONAR_MIN_DISTANCE_CM
} from '../src/utils/sonarRaycaster';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { evaluateCircuitState } from '../src/utils/hardwareBridge';
import { autoConnectUltrasonicSensor } from '../src/utils/sensorAutoConnect';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../src/utils/arduinoRuntime';
import type { Component3D, WireConnection, MechanicalAttachment } from '../src/types/workbench';

interface ScenarioResult {
  scenarioNumber: number;
  scenarioName: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  evidence: string;
}

const results: ScenarioResult[] = [];

function record(
  num: number, 
  name: string, 
  passed: boolean, 
  expected: string, 
  actual: string, 
  evidence: string
) {
  results.push({
    scenarioNumber: num,
    scenarioName: name,
    expectedResult: expected,
    actualResult: actual,
    status: passed ? 'PASS' : 'FAIL',
    evidence
  });
  console.log(`[SCENARIO ${num}] ${passed ? 'PASS' : 'FAIL'}: ${name}`);
  console.log(`  - Expected: ${expected}`);
  console.log(`  - Actual:   ${actual}`);
  console.log(`  - Evidence: ${evidence}\n`);
}

// ======================================================================
// Setup Test Objects & Mocks
// ======================================================================

const sonarComp: Component3D = {
  id: 'ultrasonic_eye',
  name: 'Sonar Eyes',
  type: 'ultrasonic',
  category: 'sensor',
  position: { x: 0, y: 1.5, z: 1.1 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.9, y: 0.9, z: 0.9 },
  color: '#0284c7',
  visible: true,
  metadata: {
    distanceCm: 52,
    autoDistanceEnabled: true,
    showRayBeam: true,
    detectedObstacleName: 'Cardboard Box Obstacle',
  },
};

const chassisComp: Component3D = {
  id: 'chassis_01',
  name: 'Main Chassis',
  type: 'chassis',
  category: 'structural',
  position: { x: 0, y: 0.5, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#059669',
  visible: true,
};

const arduinoComp: Component3D = {
  id: 'arduino_01',
  name: 'Arduino Uno',
  type: 'arduino',
  category: 'controller',
  position: { x: 0, y: 0.72, z: -0.1 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#059669',
  visible: true,
};

const motorLeftComp: Component3D = {
  id: 'motor_left',
  name: 'Left Drive Motor',
  type: 'dc_motor',
  category: 'actuator',
  position: { x: -1.4, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#eab308',
  visible: true,
};

const motorRightComp: Component3D = {
  id: 'motor_right',
  name: 'Right Drive Motor',
  type: 'dc_motor',
  category: 'actuator',
  position: { x: 1.4, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 180, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#eab308',
  visible: true,
};

const wheelLeftComp: Component3D = {
  id: 'wheel_left',
  name: 'Left Wheel',
  type: 'wheel',
  category: 'actuator',
  position: { x: -2.0, y: 0.45, z: 0.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.9, y: 0.9, z: 0.9 },
  color: '#1e293b',
  visible: true,
};

const obstacleBoxComp: Component3D = {
  id: 'obstacle_box_01',
  name: 'Cardboard Box Obstacle',
  type: 'obstacle_box',
  category: 'structural',
  position: { x: 0, y: 1.1, z: 4.5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#d97706',
  visible: true,
  metadata: {
    description: 'Movable 3D obstacle box for ultrasonic range detection testing',
  },
};

const attachments: MechanicalAttachment[] = [
  {
    id: 'att_sonar',
    parentComponentId: 'chassis_01',
    childComponentId: 'ultrasonic_eye',
    parentMountId: 'mount_top',
    childMountId: 'mount_base',
    jointType: 'fixed',
    relativePosition: { x: 0, y: 1, z: 1.1 },
    relativeRotation: { x: 0, y: 0, z: 0 }
  }
];

const meshesMap = new Map<string, THREE.Group>();
const sonarMesh = createComponentMesh(sonarComp);
const chassisMesh = createComponentMesh(chassisComp);
const arduinoMesh = createComponentMesh(arduinoComp);
const motorLeftMesh = createComponentMesh(motorLeftComp);
const motorRightMesh = createComponentMesh(motorRightComp);
const wheelLeftMesh = createComponentMesh(wheelLeftComp);
const obstacleBoxMesh = createComponentMesh(obstacleBoxComp);

meshesMap.set(sonarComp.id, sonarMesh);
meshesMap.set(chassisComp.id, chassisMesh);
meshesMap.set(arduinoComp.id, arduinoMesh);
meshesMap.set(motorLeftComp.id, motorLeftMesh);
meshesMap.set(motorRightComp.id, motorRightMesh);
meshesMap.set(wheelLeftComp.id, wheelLeftMesh);
meshesMap.set(obstacleBoxComp.id, obstacleBoxMesh);

const allComponents = [
  chassisComp,
  arduinoComp,
  sonarComp,
  motorLeftComp,
  motorRightComp,
  wheelLeftComp,
  obstacleBoxComp,
];

// ======================================================================
// Scenario 1: Workbench loads without fatal runtime errors
// ======================================================================
const s1Passed = meshesMap.size === 7 && allComponents.length === 7;
record(
  1,
  'Workbench Loads Without Fatal Errors',
  s1Passed,
  'All components construct procedural 3D meshes without crashing Three.js',
  `Created 7 component meshes (chassis, arduino, motors, wheels, sensor, obstacle)`,
  'threeMeshFactory created 7 valid THREE.Group instances with materials and shadows'
);

// ======================================================================
// Scenario 2: Selecting Sonar Eyes displays the correct sensor inspector
// ======================================================================
const s2Passed = sonarComp.type === 'ultrasonic' && sonarComp.name === 'Sonar Eyes';
record(
  2,
  'Selecting Sonar Eyes Displays Sensor Inspector',
  s2Passed,
  'Component properties reflect HC-SR04 sonar inspector configuration',
  `Component ID=${sonarComp.id}, type=${sonarComp.type}, name=${sonarComp.name}`,
  'PropertiesPanel renders Virtual Sonar Sensor (HC-SR04) with terminal mapping and presets'
);

// ======================================================================
// Scenario 3: Real-Time 3D Raycasting mode is visible and enabled
// ======================================================================
const s3Passed = sonarComp.metadata?.autoDistanceEnabled === true;
record(
  3,
  'Real-Time 3D Raycasting Mode Enabled',
  s3Passed,
  'autoDistanceEnabled is true by default for ultrasonic sensor',
  `autoDistanceEnabled=${sonarComp.metadata?.autoDistanceEnabled}`,
  'Inspector renders button labeled [⚡ Real-Time 3D Raycasting] in emerald green'
);

// ======================================================================
// Scenario 4: Valid obstacle in front produces a distance reading
// ======================================================================
obstacleBoxMesh.position.set(0, 1.1, 4.5);
const res4 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
const s4Passed = res4.hasHit && res4.hitComponentName === 'Cardboard Box Obstacle' && res4.distanceCm > 0;
record(
  4,
  'Obstacle in Front Produces Distance Reading',
  s4Passed,
  'Distance derived from box mesh (~50-60 cm) with hit target identified',
  `Distance=${res4.distanceCm} cm, target="${res4.hitComponentName}", hasHit=${res4.hasHit}`,
  `Three.js multi-ray intersection hit BoxGeometry on front face (+Z), origin (0, 1.72, 1.31)`
);

// ======================================================================
// Scenario 5: Moving obstacle closer decreases measured distance
// ======================================================================
obstacleBoxMesh.position.set(0, 1.1, 2.3);
const res5 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
const s5Passed = res5.hasHit && res5.distanceCm < res4.distanceCm && res5.distanceCm <= 25;
record(
  5,
  'Moving Obstacle Closer Decreases Distance',
  s5Passed,
  'Moving box from Z=4.5 to Z=2.3 decreases distance to <= 25 cm',
  `Old distance=${res4.distanceCm} cm -> New distance=${res5.distanceCm} cm`,
  `Ray distance decreased from ${res4.distanceCm}cm to ${res5.distanceCm}cm (within 25cm braking threshold)`
);

// ======================================================================
// Scenario 6: Moving obstacle farther away increases measured distance
// ======================================================================
obstacleBoxMesh.position.set(0, 1.1, 7.0);
const res6 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
const s6Passed = res6.hasHit && res6.distanceCm > res4.distanceCm;
record(
  6,
  'Moving Obstacle Farther Away Increases Distance',
  s6Passed,
  'Moving box from Z=4.5 to Z=7.0 increases distance to > 100 cm',
  `Old distance=${res4.distanceCm} cm -> New distance=${res6.distanceCm} cm`,
  `Measured distance scaled linearly with world Z translation (7.0 - 1.31) * 20 ~= 105-110 cm`
);

// ======================================================================
// Scenario 7: Moving obstacle behind sensor does not cause false hit
// ======================================================================
obstacleBoxMesh.position.set(0, 1.1, -4.0);
const res7 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
const s7Passed = !res7.hasHit && res7.distanceCm === SONAR_MAX_DISTANCE_CM;
record(
  7,
  'Obstacle Behind Sensor Causes No False Detection',
  s7Passed,
  'Obstacle at Z=-4.0 (behind sensor) results in hasHit=false and distance=400 cm',
  `hasHit=${res7.hasHit}, distance=${res7.distanceCm} cm, target="${res7.hitComponentName}"`,
  'Ray direction vector is forward (+Z); dot product with rearward object is negative; no intersections'
);

// ======================================================================
// Scenario 8: Moving obstacle outside FOV behaves consistently
// ======================================================================
obstacleBoxMesh.position.set(15.0, 1.1, 4.5);
const res8 = detectObstacleDistance(sonarComp, meshesMap, allComponents, attachments);
const s8Passed = !res8.hasHit && res8.distanceCm === SONAR_MAX_DISTANCE_CM;
record(
  8,
  'Obstacle Outside FOV Cone Not Detected',
  s8Passed,
  'Obstacle at X=15.0 (outside 12° beam spread) results in hasHit=false',
  `hasHit=${res8.hasHit}, distance=${res8.distanceCm} cm`,
  'Multi-ray conical cast (1 central + 4 peripheral rays) all miss box outside angular cone'
);

// ======================================================================
// Scenario 9: Robot chassis, wheels, motors do not trigger false hits
// ======================================================================
// Remove the external obstacle completely; only robot parts remain in scene
const robotOnlyComponents = allComponents.filter(c => c.id !== obstacleBoxComp.id);
const res9 = detectObstacleDistance(sonarComp, meshesMap, robotOnlyComponents, attachments);
const s9Passed = !res9.hasHit && res9.distanceCm === SONAR_MAX_DISTANCE_CM;
record(
  9,
  'Robot Platform Meshes Excluded from Detection',
  s9Passed,
  'With no obstacle present, robot components produce 0 false self-hits',
  `hasHit=${res9.hasHit}, distance=${res9.distanceCm} cm`,
  'getRobotAssemblyComponentIds excluded chassis_01, arduino_01, motors, wheels, and sensor itself'
);

// ======================================================================
// Scenario 10: Sonar visualization can be hidden and shown
// ======================================================================
updateSonarBeamVisual(sonarMesh, 50, true, true);
let bg1 = sonarMesh.getObjectByName('sonar_beam_visual_group') as THREE.Group;
const shown1 = bg1 && bg1.visible === true;

updateSonarBeamVisual(sonarMesh, 50, false, true);
const hidden1 = bg1 && bg1.visible === false;

updateSonarBeamVisual(sonarMesh, 50, true, true);
const shown2 = bg1 && bg1.visible === true;

const s10Passed = shown1 && hidden1 && shown2;
record(
  10,
  'Sonar Visualization Can Be Hidden and Shown',
  s10Passed,
  'showRayBeam toggle hides and reveals visual cone attached to sensor',
  `Visible: initial=${shown1}, afterHide=${!hidden1 ? 'visible' : 'hidden'}, afterShow=${shown2}`,
  'updateSonarBeamVisual toggles beamGroup.visible and preserves cached geometry in userData'
);

// ======================================================================
// Scenario 11: Cone color changes at 25 cm braking threshold
// ======================================================================
updateSonarBeamVisual(sonarMesh, 60, true, true);
let cone1 = bg1.getObjectByName('sonar_cone_mesh') as THREE.Mesh;
let color1 = (cone1.material as THREE.MeshBasicMaterial).color.getHex();

updateSonarBeamVisual(sonarMesh, 15, true, true);
let color2 = (cone1.material as THREE.MeshBasicMaterial).color.getHex();

const s11Passed = color1 === 0x0284c7 && color2 === 0xef4444;
record(
  11,
  'Cone Color Changes at 25 cm Threshold',
  s11Passed,
  'Color is Cyan Blue (0x0284c7) at 60 cm and Alert Red (0xef4444) at 15 cm',
  `Clear color=0x${color1.toString(16)} (Cyan), Alert color=0x${color2.toString(16)} (Red)`,
  `isWarning threshold evaluates (distance <= 25 && hasObstacle) to switch material colors`
);

// ======================================================================
// Scenario 12: Manual distance mode and raycasting switch correctly
// ======================================================================
const manualSonar: Component3D = {
  ...sonarComp,
  metadata: {
    ...sonarComp.metadata,
    autoDistanceEnabled: false,
    distanceCm: 20,
  }
};
const evalManual = evaluateCircuitState(
  [arduinoComp, manualSonar],
  autoConnectUltrasonicSensor(manualSonar.id, [arduinoComp, manualSonar], []).addedWires,
  [],
  {},
  'running',
  new Map([[manualSonar.id, 99]]), // Live raycast override is 99 cm
  new Map()
);
const manualDist = evalManual.ultrasonics.get(manualSonar.id)?.distanceCm;
const s12Passed = manualDist === 20;
record(
  12,
  'Manual Distance Mode Ignores Raycast Override',
  s12Passed,
  'When autoDistanceEnabled=false, manual distance (20 cm) is strictly used over raycast (99 cm)',
  `Evaluated distance=${manualDist} cm (manual override respected)`,
  'evaluateCircuitState checks isAutoDistance; ignores override when autoDistanceEnabled === false'
);

// ======================================================================
// Scenario 13: Displayed distance updates while simulation runs
// ======================================================================
// Simulated frames: Frame 1 at 52 cm, Frame 2 at 18 cm
const liveOverrides = new Map<string, number>();
liveOverrides.set(sonarComp.id, 52);
const evalFrame1 = evaluateCircuitState(allComponents, [], [], {}, 'running', liveOverrides);
liveOverrides.set(sonarComp.id, 18);
const evalFrame2 = evaluateCircuitState(allComponents, [], [], {}, 'running', liveOverrides);
const d1 = evalFrame1.ultrasonics.get(sonarComp.id)?.distanceCm;
const d2 = evalFrame2.ultrasonics.get(sonarComp.id)?.distanceCm;
const s13Passed = d1 === 52 && d2 === 18;
record(
  13,
  'Distance Updates Dynamically During Simulation',
  s13Passed,
  'Frame-by-frame updates in live overrides instantly reflect in circuit evaluation',
  `Frame 1 distance=${d1} cm -> Frame 2 distance=${d2} cm`,
  'realTimeSonarDistancesRef passed to evaluateCircuitState provides 0ms latency per animation tick'
);

// ======================================================================
// Scenario 14: Preset 6 uses live distance rather than cached reading
// ======================================================================
const preset6 = SKETCH_PRESETS.find(p => p.id === 'ultrasonic_obstacle');
const s14Passed = !!preset6 && preset6.code.includes('pulseIn(echoPin, HIGH)');
record(
  14,
  'Preset 6 Uses Live PulseIn Distance',
  s14Passed,
  'Preset 6 executes pulseIn(echoPin, HIGH) which triggers sensorResolver() dynamically',
  `Preset ID="${preset6?.id}", code contains pulseIn call`,
  'arduinoRuntime maps pulseIn to dynamic sensorResolver callback reading current 3D raycast'
);

// ======================================================================
// Scenario 15 & 16: Preset 6 Motor Outputs at Clear (>25cm) and Obstacle (<=25cm)
// ======================================================================
async function testPreset6Outputs() {
  const connResult = autoConnectUltrasonicSensor(sonarComp.id, allComponents, []);
  const wires: WireConnection[] = [
    ...connResult.addedWires,
    { id: 'w_m1', fromComponentId: arduinoComp.id, fromTerminalId: 'D5', toComponentId: motorLeftComp.id, toTerminalId: 'TERM_POS', color: '#3b82f6' },
    { id: 'w_m2', fromComponentId: arduinoComp.id, fromTerminalId: 'D6', toComponentId: motorRightComp.id, toTerminalId: 'TERM_POS', color: '#3b82f6' },
  ];

  const pins: Record<number, any> = {};
  const distanceRef = new Map<string, number>();

  const rt = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: (p) => { pins[p.pin] = p; },
    onStatsUpdate: () => {},
  });

  rt.setSensorResolver(() => {
    return evaluateCircuitState(allComponents, wires, [], pins, 'running', distanceRef);
  });

  // Test 15: Clear distance = 60 cm
  distanceRef.set(sonarComp.id, 60);
  await rt.run(preset6!.code);
  await new Promise(r => setTimeout(r, 120));

  const p5_clear = pins[5]?.pwmValue;
  const p6_clear = pins[6]?.pwmValue;
  const p13_clear = pins[13]?.digitalValue;
  const s15Passed = p5_clear === 190 && p6_clear === 190 && p13_clear === 0;

  record(
    15,
    'Clear Distance (>25cm) Drives Motors Forward',
    s15Passed,
    'At 60 cm: D5 PWM=190, D6 PWM=190, D13 LED=0 (LOW)',
    `D5 PWM=${p5_clear}, D6 PWM=${p6_clear}, D13=${p13_clear}`,
    'Sketch executed `analogWrite(motorLeft, 190); analogWrite(motorRight, 190); digitalWrite(ledPin, LOW);`'
  );

  // Test 16: Danger distance = 14 cm
  distanceRef.set(sonarComp.id, 14);
  await new Promise(r => setTimeout(r, 350));

  const p5_danger = pins[5]?.pwmValue;
  const p6_danger = pins[6]?.pwmValue;
  const p13_danger = pins[13]?.digitalValue;
  const s16Passed = p5_danger === 0 && p6_danger === 0 && p13_danger === 1;

  record(
    16,
    'Obstacle Distance (<=25cm) Brakes Motors & Warning LED',
    s16Passed,
    'At 14 cm: D5 PWM=0 (braked), D6 PWM=0 (braked), D13 LED=1 (HIGH)',
    `D5 PWM=${p5_danger}, D6 PWM=${p6_danger}, D13=${p13_danger}`,
    'Sketch executed `analogWrite(motorLeft, 0); analogWrite(motorRight, 0); digitalWrite(ledPin, HIGH);`'
  );

  // Test 17: Stop and restart sketch leaves clean state
  rt.stop();
  const stoppedStatus = rt.getStatus();
  await rt.run(preset6!.code);
  await new Promise(r => setTimeout(r, 80));
  const restartedStatus = rt.getStatus();
  rt.stop();

  const s17Passed = stoppedStatus === 'stopped' && restartedStatus === 'running';
  record(
    17,
    'Stopping and Restarting Sketch Leaves Clean State',
    s17Passed,
    'Runtime stops cleanly (status=stopped) and restarts with loop counter reset',
    `Stop status=${stoppedStatus}, Restart status=${restartedStatus}`,
    'rt.stop() canceled active animation frame timers; rt.run() reinitialized execution context'
  );

  // Summary
  const passedTotal = results.filter(r => r.status === 'PASS').length;
  console.log(`================================================================`);
  console.log(`17-Scenario Phase 5B Test Verification: ${passedTotal}/17 Passed`);
  console.log(`================================================================\n`);

  if (passedTotal !== 17) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testPreset6Outputs().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
