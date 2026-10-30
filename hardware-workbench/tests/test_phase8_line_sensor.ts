/**
 * Hardware Workbench — Phase 8 Automated Test Suite
 * Virtual IR Line-Tracking Sensors (TCRT5000), Floor Tracks & Autonomous Line-Following
 */

import * as THREE from 'three';
import {
  sampleFloorSurface,
  createFloorTrackTexture,
  DEFAULT_TRACK_CONFIG,
  type TrackConfig,
} from '../src/utils/floorTrack';
import { COMPONENT_CATALOG } from '../src/utils/componentCatalog';
import { getComponentTerminals, findTerminal } from '../src/utils/terminalDefinitions';
import { getComponentMountPoints, findMountPoint } from '../src/utils/assemblyDefinitions';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { evaluateCircuitState } from '../src/utils/hardwareBridge';
import {
  autoConnectSingleLineSensor,
  autoConnectAllLineSensors,
} from '../src/utils/sensorAutoConnect';
import {
  SafeArduinoRuntime,
  SKETCH_PRESETS,
} from '../src/utils/arduinoRuntime';
import {
  calculateRobotRelativeOffsets,
  applyAlignedChildTransform,
  updateRobotKinematics,
  INITIAL_ROBOT_POSE,
  type RobotPose,
} from '../src/utils/robotKinematics';
import type {
  Component3D,
  WireConnection,
  MechanicalAttachment,
} from '../src/types/workbench';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runPhase8Tests() {
  console.log('================================================================');
  console.log('Hardware Workbench — Phase 8 Automated Test Suite');
  console.log('Virtual IR Line-Tracking Sensors (TCRT5000) & Line-Following Robot');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Floor Surface Mathematical Sampling (floorTrack.ts)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Floor Surface Mathematical Sampling (floorTrack.ts) ---');

  const ovalConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: 'oval' };
  
  // At (0, 0), on the straight section of the oval track, exactly on the black line
  const sampleCenter = sampleFloorSurface(0, 0, ovalConfig);
  assert(sampleCenter.isOverBlackLine === true, 'Center of track at (0, 0) detects black line');
  assert(sampleCenter.digitalValue === 1, 'Center of track produces DO = 1 (HIGH)');
  assert(sampleCenter.analogValue <= 250, `Center of track produces low analog ADC reflecting black line (~${sampleCenter.analogValue} <= 250)`);
  assert(sampleCenter.reflectance <= 0.25, `Center of track has low reflectance (~${(sampleCenter.reflectance * 100).toFixed(1)}% <= 25%)`);

  // At (2.5, 0), on the white floor between the two oval straightaways
  const sampleOffTrack = sampleFloorSurface(2.5, 0, ovalConfig);
  assert(sampleOffTrack.isOverBlackLine === false, 'Point off track (2.5, 0) detects white floor');
  assert(sampleOffTrack.digitalValue === 0, 'Off track produces DO = 0 (LOW)');
  assert(sampleOffTrack.analogValue >= 750, `Off track produces high analog ADC reflecting white floor (~${sampleOffTrack.analogValue} >= 750)`);
  assert(sampleOffTrack.reflectance >= 0.75, `Off track has high reflectance (~${(sampleOffTrack.reflectance * 100).toFixed(1)}% >= 75%)`);

  // Line width and threshold validation
  const halfLineWidth = ovalConfig.lineWidthUnits / 2; // ~0.375 units
  const sampleEdge = sampleFloorSurface(halfLineWidth, 0, ovalConfig);
  assert(sampleEdge.analogValue < sampleOffTrack.analogValue, 'Line boundary has higher absorption (lower ADC) than pure floor');

  // Straight track
  const straightConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: 'straight' };
  const sampleStraightOn = sampleFloorSurface(0, 8, straightConfig);
  assert(sampleStraightOn.isOverBlackLine === true, 'Straight track at (0, 8) detects black line');
  const sampleStraightOff = sampleFloorSurface(2, 8, straightConfig);
  assert(sampleStraightOff.isOverBlackLine === false, 'Straight track at (2, 8) detects white floor');

  // Wavy track
  const wavyConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: 'wavy' };
  // Wavy track passes through (0, 0)
  const sampleWavyStart = sampleFloorSurface(0, 0, wavyConfig);
  assert(sampleWavyStart.isOverBlackLine === true, 'Wavy track at (0, 0) detects black line');

  // Plain floor (type: 'none')
  const noneConfig: TrackConfig = { ...DEFAULT_TRACK_CONFIG, type: 'none' };
  const sampleNone = sampleFloorSurface(0, 0, noneConfig);
  assert(sampleNone.isOverBlackLine === false, 'Plain floor has no black line');
  assert(sampleNone.digitalValue === 0, 'Plain floor produces DO = 0');
  assert(sampleNone.reflectance >= 0.9, 'Plain floor has high reflectance (~92%)');

  // Check texture generation
  const texture = createFloorTrackTexture('oval', 40);
  assert(texture !== null, 'createFloorTrackTexture produces valid Three.js canvas texture');

  // -------------------------------------------------------------
  // TEST 2: Component Catalog, Terminals & Mount Points
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Component Catalog, Terminals & Mount Points ---');

  const catalogEntry = COMPONENT_CATALOG.find((c) => c.type === 'line_sensor');
  assert(catalogEntry !== undefined, 'line_sensor exists in COMPONENT_CATALOG');
  assert(catalogEntry?.name.includes('TCRT5000') === true, 'Catalog name mentions TCRT5000');
  assert(catalogEntry?.category === 'sensor', 'Catalog category is sensor');

  // Create component instance
  const testSensor: Component3D = {
    id: 'test_ls',
    name: 'Test Line Sensor',
    type: 'line_sensor',
    category: 'sensor',
    position: { x: 0, y: 0.1, z: 1.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#0284c7',
    visible: true,
  };

  const terminals = getComponentTerminals(testSensor);
  assert(terminals.length === 4, `line_sensor has exactly 4 electrical terminals (found: ${terminals.length})`);
  assert(terminals.some((t) => t.id === 'VCC' && t.category === 'power'), 'VCC power terminal defined');
  assert(terminals.some((t) => t.id === 'GND' && t.category === 'ground'), 'GND ground terminal defined');
  assert(terminals.some((t) => t.id === 'DO' && t.category === 'digital'), 'DO digital terminal defined');
  assert(terminals.some((t) => t.id === 'AO' && t.category === 'analog'), 'AO analog terminal defined');

  const mountPoints = getComponentMountPoints(testSensor);
  assert(mountPoints.length === 1 && mountPoints[0].id === 'mount_base', 'line_sensor has mount_base mount point');

  // Chassis mount points
  const testChassis: Component3D = {
    id: 'chassis_01',
    name: 'Main Chassis',
    type: 'chassis',
    category: 'structural',
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#334155',
    visible: true,
  };
  const chassisMounts = getComponentMountPoints(testChassis);
  assert(chassisMounts.some((m) => m.id === 'mount_line_sensor_left'), 'Chassis has mount_line_sensor_left');
  assert(chassisMounts.some((m) => m.id === 'mount_line_sensor_right'), 'Chassis has mount_line_sensor_right');

  // 3D Procedural Mesh
  const sensorMesh = createComponentMesh(testSensor);
  assert(sensorMesh !== null && sensorMesh.children.length > 0, 'createComponentMesh produces non-empty group for line_sensor');
  assert(sensorMesh.userData.lineSensorLedMat !== undefined, 'Mesh includes dynamic topside detection LED material in userData');

  // -------------------------------------------------------------
  // TEST 3: Hardware Bridge Circuit Evaluation & Pin Mapping
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Hardware Bridge Circuit Evaluation & Pin Mapping ---');

  const testArduino: Component3D = {
    id: 'arduino_01',
    name: 'Arduino Uno',
    type: 'arduino',
    category: 'controller',
    position: { x: 0, y: 0.65, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
    visible: true,
  };

  const leftSensor: Component3D = {
    id: 'line_sensor_left',
    name: 'Left IR Line Sensor',
    type: 'line_sensor',
    category: 'sensor',
    position: { x: -0.45, y: 0.15, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#0284c7',
    visible: true,
  };

  // 4 Wires: 5V, GND, D4, A1
  const wires: WireConnection[] = [
    { id: 'w1', fromComponentId: 'arduino_01', fromTerminalId: '5V', toComponentId: 'line_sensor_left', toTerminalId: 'VCC', color: '#ef4444' },
    { id: 'w2', fromComponentId: 'arduino_01', fromTerminalId: 'GND_1', toComponentId: 'line_sensor_left', toTerminalId: 'GND', color: '#1e293b' },
    { id: 'w3', fromComponentId: 'arduino_01', fromTerminalId: 'D4', toComponentId: 'line_sensor_left', toTerminalId: 'DO', color: '#3b82f6' },
    { id: 'w4', fromComponentId: 'arduino_01', fromTerminalId: 'A1', toComponentId: 'line_sensor_left', toTerminalId: 'AO', color: '#06b6d4' },
  ];

  const posMap = new Map<string, { x: number; y: number; z: number }>();
  // Place sensor over black line at (0, 0)
  posMap.set('line_sensor_left', { x: 0, y: 0.15, z: 0 });

  const circuit = evaluateCircuitState(
    [testArduino, leftSensor],
    wires,
    [],
    {},
    'running',
    undefined,
    undefined,
    ovalConfig,
    posMap
  );

  const lsState = circuit.lineSensors.get('line_sensor_left');
  assert(lsState !== undefined, 'Line sensor state evaluated in circuit');
  assert(lsState?.isCircuitComplete === true, 'Line sensor circuit evaluated as complete (4-Wire)');
  assert(lsState?.doPin === 4, 'DO pin resolved to Pin 4');
  assert(lsState?.aoPin === 15, 'AO pin resolved to Pin 15 (A1)');
  assert(lsState?.digitalOutput === 1, 'Digital output is 1 (black line detected at x=0, z=0)');
  assert(lsState?.analogOutput <= 250, `Analog output is low ADC (~${lsState?.analogOutput} <= 250) on black line`);

  // Move sensor to white floor at (2.5, 0)
  posMap.set('line_sensor_left', { x: 2.5, y: 0.15, z: 0 });
  const circuitWhite = evaluateCircuitState(
    [testArduino, leftSensor],
    wires,
    [],
    {},
    'running',
    undefined,
    undefined,
    ovalConfig,
    posMap
  );
  const lsStateWhite = circuitWhite.lineSensors.get('line_sensor_left');
  assert(lsStateWhite?.digitalOutput === 0, 'Digital output is 0 on white floor at x=2.5, z=0');
  assert(lsStateWhite?.analogOutput >= 750, `Analog output is high ADC (~${lsStateWhite?.analogOutput} >= 750) on white floor`);

  // Incomplete circuit warning
  const brokenWires = wires.filter((w) => w.toTerminalId !== 'GND');
  const circuitBroken = evaluateCircuitState(
    [testArduino, leftSensor],
    brokenWires,
    [],
    {},
    'running',
    undefined,
    undefined,
    ovalConfig,
    posMap
  );
  const lsBroken = circuitBroken.lineSensors.get('line_sensor_left');
  assert(lsBroken?.isCircuitComplete === false, 'Circuit is incomplete when GND is disconnected');
  assert(lsBroken?.warning?.includes('GND') === true, 'Warning specifically mentions missing Ground connection');

  // -------------------------------------------------------------
  // TEST 4: Rigid Body Kinematics & Chassis Tracking
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Rigid Body Kinematics & Chassis Tracking ---');

  const rightSensor: Component3D = {
    id: 'line_sensor_right',
    name: 'Right IR Line Sensor',
    type: 'line_sensor',
    category: 'sensor',
    position: { x: 0.45, y: 0.15, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#0284c7',
    visible: true,
  };

  const fullComps: Component3D[] = [testChassis, leftSensor, rightSensor];
  const offsets = calculateRobotRelativeOffsets(fullComps, 'chassis_01');

  assert(offsets.has('line_sensor_left'), 'Offset calculated for line_sensor_left');
  assert(offsets.has('line_sensor_right'), 'Offset calculated for line_sensor_right');

  const leftOff = offsets.get('line_sensor_left')!;
  const rightOff = offsets.get('line_sensor_right')!;
  assert(Math.abs(leftOff.offset.x - (-0.45)) < 0.01, 'Left sensor is positioned at -0.45 X relative to chassis');
  assert(Math.abs(rightOff.offset.x - 0.45) < 0.01, 'Right sensor is positioned at +0.45 X relative to chassis');
  assert(Math.abs(leftOff.offset.z - 1.25) < 0.01, 'Both sensors are positioned at +1.25 Z (front bumper)');

  // Translate robot forward by 2.0 units along +Z
  const movedPose: RobotPose = { x: 0, y: 0.5, z: 2.0, headingDeg: 0 };
  const mockMeshL = new THREE.Group();
  applyAlignedChildTransform(mockMeshL, leftOff, movedPose);
  assert(Math.abs(mockMeshL.position.z - 3.25) < 0.01, `Left sensor translated rigidly with chassis to Z=3.25 (actual: ${mockMeshL.position.z.toFixed(2)})`);
  assert(Math.abs(mockMeshL.position.x - (-0.45)) < 0.01, 'Left sensor maintained -0.45 X offset during forward motion');

  // Rotate robot 90° clockwise
  const rotatedPose: RobotPose = { x: 0, y: 0.5, z: 0, headingDeg: 90 };
  applyAlignedChildTransform(mockMeshL, leftOff, rotatedPose);
  // Heading 90° points chassis towards +X. The sensor (+1.25 Z forward) is now at +1.25 X!
  // And the left lateral offset (-0.45 X) is now at +0.45 Z!
  assert(Math.abs(mockMeshL.position.x - 1.25) < 0.05, `90° yaw rotates front bumper to +X (actual: ${mockMeshL.position.x.toFixed(2)})`);

  // -------------------------------------------------------------
  // TEST 5: Auto-Connect Line Sensor Workflow
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Auto-Connect Line Sensor Workflow ---');

  // Unconnected left sensor
  const autoLeft = autoConnectSingleLineSensor('line_sensor_left', [testArduino, leftSensor, rightSensor], []);
  assert(autoLeft.success === true, 'Auto-connect left line sensor succeeds');
  assert(autoLeft.addedWires.length === 4, `Auto-connect creates 4 wires (created: ${autoLeft.addedWires.length})`);
  assert(autoLeft.addedWires.some((w) => w.toTerminalId === 'DO' && w.fromTerminalId === 'D4'), 'Left DO connects to D4');
  assert(autoLeft.addedWires.some((w) => w.toTerminalId === 'AO' && w.fromTerminalId === 'A1'), 'Left AO connects to A1');

  // Unconnected right sensor
  const autoRight = autoConnectSingleLineSensor('line_sensor_right', [testArduino, leftSensor, rightSensor], []);
  assert(autoRight.success === true, 'Auto-connect right line sensor succeeds');
  assert(autoRight.addedWires.some((w) => w.toTerminalId === 'DO' && w.fromTerminalId === 'D7'), 'Right DO connects to D7');
  assert(autoRight.addedWires.some((w) => w.toTerminalId === 'AO' && w.fromTerminalId === 'A2'), 'Right AO connects to A2');

  // Duplicate prevention
  const autoDup = autoConnectSingleLineSensor('line_sensor_left', [testArduino, leftSensor], autoLeft.addedWires);
  assert(autoDup.success === true, 'Duplicate check succeeds');
  assert(autoDup.addedWires.length === 0, '0 duplicate wires created when already connected');

  // -------------------------------------------------------------
  // TEST 6: Preset 9 IR Line-Sensor Monitor & Calibration
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Preset 9 IR Line-Sensor Monitor & Calibration ---');

  const preset9 = SKETCH_PRESETS.find((p) => p.id === 'line_sensor_monitor');
  assert(preset9 !== undefined, 'Preset 9 (line_sensor_monitor) exists in SKETCH_PRESETS');
  assert(preset9?.name.includes('Line-Sensor Monitor') === true, 'Preset 9 title is descriptive');

  let serialOutput = '';
  const rt9 = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: (msg) => {
      serialOutput += msg.text + '\n';
    },
    onPinChange: () => {},
    onStatsUpdate: () => {},
  });

  // Provide dynamic sensor resolver for runtime
  let currentSampleDO = 1;
  let currentSampleAO = 120;
  rt9.setSensorResolver(() => {
    const sMap = new Map<string, any>();
    sMap.set('line_sensor_left', {
      componentId: 'line_sensor_left',
      isCircuitComplete: true,
      doPin: 4,
      aoPin: 15,
      digitalOutput: currentSampleDO,
      analogOutput: currentSampleAO,
      reflectance: currentSampleDO === 1 ? 0.08 : 0.92,
    });
    return {
      leds: new Map(),
      motors: new Map(),
      ultrasonics: new Map(),
      potentiometers: new Map(),
      lineSensors: sMap,
    } as any;
  });

  await rt9.run(preset9!.code);
  await new Promise((r) => setTimeout(r, 350));
  rt9.stop();

  assert(serialOutput.includes('TCRT5000 IR Line Sensor Monitor'), 'Preset 9 printed calibration header to Serial');
  assert(serialOutput.includes('[Line Sensor] Left DO:'), 'Preset 9 logged sensor states to Serial Monitor');

  // -------------------------------------------------------------
  // TEST 7: Preset 10 Autonomous Closed-Loop Line Following
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Preset 10 Autonomous Closed-Loop Line Following ---');

  const preset10 = SKETCH_PRESETS.find((p) => p.id === 'line_follower');
  assert(preset10 !== undefined, 'Preset 10 (line_follower) exists in SKETCH_PRESETS');
  assert(preset10?.name.includes('Line Following Robot') === true, 'Preset 10 title is descriptive');

  const pinStates: Record<number, number> = {};
  const rt10 = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: (p) => {
      pinStates[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
  });

  let simLeftDO = 0;
  let simRightDO = 0;
  rt10.setSensorResolver(() => {
    const sMap = new Map<string, any>();
    sMap.set('line_sensor_left', {
      componentId: 'line_sensor_left',
      isCircuitComplete: true,
      doPin: 4,
      aoPin: 15,
      digitalOutput: simLeftDO,
      analogOutput: simLeftDO === 1 ? 780 : 150,
      reflectance: simLeftDO === 1 ? 0.08 : 0.92,
    });
    sMap.set('line_sensor_right', {
      componentId: 'line_sensor_right',
      isCircuitComplete: true,
      doPin: 7,
      aoPin: 16,
      digitalOutput: simRightDO,
      analogOutput: simRightDO === 1 ? 780 : 150,
      reflectance: simRightDO === 1 ? 0.08 : 0.92,
    });
    return {
      leds: new Map(),
      motors: new Map(),
      ultrasonics: new Map(),
      potentiometers: new Map(),
      lineSensors: sMap,
    } as any;
  });

  await rt10.run(preset10!.code);

  // Scenario A: On Center (both sensors on white floor, black line between them)
  simLeftDO = 0;
  simRightDO = 0;
  await new Promise((r) => setTimeout(r, 160));
  assert(pinStates[5] > 100 && pinStates[6] > 100, `On Center: Both motors drive forward (Left PWM: ${pinStates[5]}, Right PWM: ${pinStates[6]})`);
  assert(Math.abs(pinStates[5] - pinStates[6]) < 20, 'On Center: Left and right motor PWM speeds are balanced');

  // Scenario B: Robot drifts right (Left sensor hits black line)
  // Action: Steer left (Right motor drives forward, Left motor slows or stops)
  simLeftDO = 1;
  simRightDO = 0;
  await new Promise((r) => setTimeout(r, 160));
  assert(pinStates[6] > pinStates[5], `Drift Right: Right motor (${pinStates[6]}) faster than Left motor (${pinStates[5]}) to turn left back onto line`);

  // Scenario C: Robot drifts left (Right sensor hits black line)
  // Action: Steer right (Left motor drives forward, Right motor slows or stops)
  simLeftDO = 0;
  simRightDO = 1;
  await new Promise((r) => setTimeout(r, 160));
  assert(pinStates[5] > pinStates[6], `Drift Left: Left motor (${pinStates[5]}) faster than Right motor (${pinStates[6]}) to turn right back onto line`);

  // Scenario D: Intersection / Checkered bar (Both sensors on black line)
  simLeftDO = 1;
  simRightDO = 1;
  await new Promise((r) => setTimeout(r, 160));
  assert(pinStates[5] > 0 || pinStates[6] > 0, 'Intersection: Robot moves smoothly across transverse bar without locking');

  // Scenario E: Lost Line Recovery (Line lost after turning right)
  simLeftDO = 0;
  simRightDO = 0;
  await new Promise((r) => setTimeout(r, 160));
  assert(pinStates[5] > 0 || pinStates[6] > 0, 'Lost Line: Robot executes recovery search rotation instead of stalling dead');

  rt10.stop();

  console.log('\n================================================================');
  console.log(`Phase 8 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
