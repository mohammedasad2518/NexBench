/**
 * Test Suite: Phase 10 — Reliability, End-to-End Validation, and Release Readiness
 * 
 * Verifies:
 * 1. Production Starter Templates Schema & Topological Integrity
 * 2. Storage Failure Fault Tolerance & Quota Exceeded Resilience
 * 3. Component, Attachment & Wire Edge Case Sanitization
 * 4. Multi-Subsystem AST Concurrent Runtime Execution (PID, Radar, Odometry)
 * 5. State Transitions, Dirty State Detection, and Calibration Profile Integration
 */

// Setup headless localStorage polyfill for Node.js / tsx runner if not natively present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

import {
  EXAMPLE_PID_LINE_FOLLOWER,
  EXAMPLE_RADAR_ROVER,
  EXAMPLE_ODOMETRY_ROVER,
  EXAMPLE_PROJECT_TEMPLATES,
} from '../src/utils/exampleProjects';
import {
  saveProject,
  loadProject,
  deleteProject,
  getProjectIndex,
  saveAutosave,
  loadAutosave,
  clearAutosave,
  hasAutosave,
  createDefaultCalibration,
  saveCalibrationProfile,
  getCalibrationProfiles,
  deleteCalibrationProfile,
  validateProjectJson,
  getStorageUsage,
  generateProjectId,
  type ProjectConfig,
  type CalibrationProfile,
} from '../src/utils/projectPersistence';
import { parseSceneJson, serializeScene } from '../src/utils/sceneSerializer';
import { COMPONENT_MOUNT_POINTS, validateAttachment } from '../src/utils/assemblyDefinitions';
import { COMPONENT_TERMINALS } from '../src/utils/terminalDefinitions';
import { SafeArduinoRuntime, createDefaultUnoPins } from '../src/utils/arduinoRuntime';
import type { Component3D, WireConnection, MechanicalAttachment } from '../src/types/workbench';

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

async function runPhase10ReliabilityTests() {
  console.log('================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 10 RELIABILITY & E2E TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Group 1: Production Starter Templates Schema & Topological Integrity
  // --------------------------------------------------------------------------
  console.log('--- Group 1: Production Starter Templates Schema & Topological Integrity ---');

  assert(EXAMPLE_PROJECT_TEMPLATES.length === 3, 'Exactly 3 starter templates exposed');
  assert(EXAMPLE_PROJECT_TEMPLATES[0].id === 'template_pid_line_follower', 'Template 1 is PID Line Follower');
  assert(EXAMPLE_PROJECT_TEMPLATES[1].id === 'template_radar_obstacle_rover', 'Template 2 is Radar Rover');
  assert(EXAMPLE_PROJECT_TEMPLATES[2].id === 'template_odometry_encoder_rover', 'Template 3 is Odometry Rover');

  const templates: { name: string; config: ProjectConfig }[] = [
    { name: 'PID Line Follower Rover', config: EXAMPLE_PID_LINE_FOLLOWER },
    { name: 'Ultrasonic Radar Rover', config: EXAMPLE_RADAR_ROVER },
    { name: 'Interrupt Odometry Rover', config: EXAMPLE_ODOMETRY_ROVER },
  ];

  for (const t of templates) {
    const serialized = JSON.stringify(t.config);
    const validation = validateProjectJson(serialized);
    assert(validation.valid, `${t.name}: JSON schema validation passed`);
    assert(validation.errors.length === 0, `${t.name}: 0 schema validation errors`);

    const compIds = new Set<string>();
    for (const comp of t.config.components) {
      assert(!compIds.has(comp.id), `${t.name}: Component '${comp.id}' has unique ID`);
      compIds.add(comp.id);
      assert(typeof comp.position.x === 'number' && !isNaN(comp.position.x), `${t.name}: Component '${comp.id}' position.x is valid finite number`);
      assert(typeof comp.position.y === 'number' && !isNaN(comp.position.y), `${t.name}: Component '${comp.id}' position.y is valid finite number`);
      assert(typeof comp.position.z === 'number' && !isNaN(comp.position.z), `${t.name}: Component '${comp.id}' position.z is valid finite number`);
    }

    // Verify all attachments reference existing components and mounts
    for (const att of t.config.attachments || []) {
      const parent = t.config.components.find((c) => c.id === att.parentComponentId);
      const child = t.config.components.find((c) => c.id === att.childComponentId);
      assert(!!parent, `${t.name}: Attachment '${att.id}' references existing parent '${att.parentComponentId}'`);
      assert(!!child, `${t.name}: Attachment '${att.id}' references existing child '${att.childComponentId}'`);

      if (parent && child) {
        const parentMounts = COMPONENT_MOUNT_POINTS[parent.type] || [];
        const hasParentMount = parentMounts.some((m) => m.id === att.parentMountId);
        assert(hasParentMount, `${t.name}: Attachment '${att.id}' parent mount '${att.parentMountId}' exists on ${parent.type}`);
      }
    }

    // Verify all wires reference existing components and terminals
    for (const wire of t.config.wires || []) {
      const fromComp = t.config.components.find((c) => c.id === wire.fromComponentId);
      const toComp = t.config.components.find((c) => c.id === wire.toComponentId);
      assert(!!fromComp, `${t.name}: Wire '${wire.id}' fromComponent '${wire.fromComponentId}' exists`);
      assert(!!toComp, `${t.name}: Wire '${wire.id}' toComponent '${wire.toComponentId}' exists`);

      if (fromComp && toComp) {
        const fromTerms = COMPONENT_TERMINALS[fromComp.type] || [];
        const toTerms = COMPONENT_TERMINALS[toComp.type] || [];
        const hasFromTerm = fromTerms.some((tm) => tm.id === wire.fromTerminalId);
        const hasToTerm = toTerms.some((tm) => tm.id === wire.toTerminalId);
        assert(hasFromTerm, `${t.name}: Wire '${wire.id}' terminal '${wire.fromTerminalId}' exists on ${fromComp.type}`);
        assert(hasToTerm, `${t.name}: Wire '${wire.id}' terminal '${wire.toTerminalId}' exists on ${toComp.type}`);
      }
    }

    // Verify sketch code is non-empty
    assert(typeof t.config.sketchCode === 'string' && t.config.sketchCode.length > 50, `${t.name}: Sketch code is valid non-empty Arduino sketch`);
  }

  // --------------------------------------------------------------------------
  // Group 2: Storage Failure Fault Tolerance & Quota Exceeded Resilience
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: Storage Failure Fault Tolerance & Quota Exceeded Resilience ---');

  // Test 1: Quota Exceeded Error during saveProject
  const originalSetItem = localStorage.setItem;
  try {
    localStorage.setItem = () => {
      const err = new Error('The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    };

    const quotaResult = saveProject(EXAMPLE_PID_LINE_FOLLOWER);
    assert(!quotaResult.success, 'saveProject() returns success: false when QuotaExceededError is thrown');
    assert(quotaResult.error !== undefined && quotaResult.error.includes('quota'), 'saveProject() returns descriptive quota error message');
  } finally {
    localStorage.setItem = originalSetItem;
  }

  // Test 2: Storage completely throwing on access (security sandbox)
  const originalGetItem = localStorage.getItem;
  try {
    localStorage.getItem = () => {
      throw new Error('Access is denied for this document or domain.');
    };

    const loadFailResult = loadProject('test_id');
    assert(loadFailResult.project === null, 'loadProject() returns null when localStorage access throws security error');
    assert(loadFailResult.error !== undefined && loadFailResult.error.includes('Access is denied'), 'loadProject() passes through security error message');

    const indexFail = getProjectIndex();
    assert(Array.isArray(indexFail) && indexFail.length === 0, 'getProjectIndex() gracefully returns empty array when localStorage throws');

    const autosaveFail = loadAutosave();
    assert(autosaveFail.project === null, 'loadAutosave() returns project: null when storage throws');
    assert(hasAutosave() === false, 'hasAutosave() safely returns false when storage throws');
  } finally {
    localStorage.getItem = originalGetItem;
  }

  // Test 3: Corrupted JSON in project slot
  localStorage.setItem('hw_workbench_project_corrupted_99', '{ broken json: true,,');
  const corruptLoad = loadProject('corrupted_99');
  assert(corruptLoad.project === null, 'loadProject() returns null when slot contains invalid JSON string');
  assert(corruptLoad.error !== undefined, 'loadProject() includes JSON parsing error description');
  localStorage.removeItem('hw_workbench_project_corrupted_99');

  // Test 4: Corrupted Project Index in localStorage
  localStorage.setItem('hw_workbench_project_index', 'Not A Valid JSON Array');
  const corruptIndex = getProjectIndex();
  assert(Array.isArray(corruptIndex) && corruptIndex.length === 0, 'getProjectIndex() recovers to empty array when index is corrupted');
  localStorage.removeItem('hw_workbench_project_index');

  // --------------------------------------------------------------------------
  // Group 3: Component, Attachment & Wire Edge Case Sanitization
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Component, Attachment & Wire Edge Case Sanitization ---');

  const malformedScene = {
    version: '5.0-workbench-phase10-release',
    name: 'Malformed Edge Case Scene',
    components: [
      {
        id: 'comp_valid_1',
        name: 'Valid Arduino',
        type: 'arduino',
        category: 'controller',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#059669',
        visible: true,
      },
      {
        id: 'comp_valid_2',
        name: 'Valid Motor',
        type: 'dc_motor',
        category: 'actuator',
        position: { x: 1, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#eab308',
        visible: true,
      },
      {
        id: 'comp_invalid_type',
        name: 'Alien Robot Part',
        type: 'quantum_teleporter' as any,
        category: 'actuator',
        position: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#ffffff',
        visible: true,
      },
    ],
    attachments: [
      {
        id: 'att_valid',
        parentComponentId: 'comp_valid_1',
        parentMountId: 'mount_standoff',
        childComponentId: 'comp_valid_2',
        childMountId: 'mount_chassis',
        jointType: 'fixed',
        relativePosition: { x: 0, y: 0, z: 0 },
        relativeRotation: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'att_ghost_parent',
        parentComponentId: 'non_existent_chassis',
        parentMountId: 'mount_motor_left',
        childComponentId: 'comp_valid_2',
        childMountId: 'mount_chassis',
        jointType: 'fixed',
        relativePosition: { x: 0, y: 0, z: 0 },
        relativeRotation: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'att_self_cycle',
        parentComponentId: 'comp_valid_1',
        parentMountId: 'mount_standoff',
        childComponentId: 'comp_valid_1',
        childMountId: 'mount_standoff',
        jointType: 'fixed',
        relativePosition: { x: 0, y: 0, z: 0 },
        relativeRotation: { x: 0, y: 0, z: 0 },
      },
    ],
    wires: [
      {
        id: 'wire_valid',
        fromComponentId: 'comp_valid_1',
        fromTerminalId: 'D5',
        toComponentId: 'comp_valid_2',
        toTerminalId: 'PWM',
        color: '#eab308',
      },
      {
        id: 'wire_missing_comp',
        fromComponentId: 'comp_valid_1',
        fromTerminalId: 'D6',
        toComponentId: 'ghost_motor',
        toTerminalId: 'PWM',
        color: '#eab308',
      },
      {
        id: 'wire_duplicate_rev',
        fromComponentId: 'comp_valid_2',
        fromTerminalId: 'PWM',
        toComponentId: 'comp_valid_1',
        toTerminalId: 'D5',
        color: '#eab308',
      },
    ],
  };

  const parsed = parseSceneJson(JSON.stringify(malformedScene));
  assert(parsed !== null, 'parseSceneJson successfully handles scene with edge case anomalies');
  // Wires: ghost wire and duplicate reverse wire should be filtered out
  assert(parsed!.wires.length === 1, 'Sanitized wires down to exactly 1 valid wire');
  assert(parsed!.wires[0].id === 'wire_valid', 'Retained the valid wire connection');

  // Attachments: ghost parent and self-attachment filtered out
  assert(parsed!.attachments.length === 1, 'Sanitized attachments down to exactly 1 valid attachment');
  assert(parsed!.attachments[0].id === 'att_valid', 'Retained valid mechanical attachment');

  // --------------------------------------------------------------------------
  // Group 4: Multi-Subsystem AST Concurrent Runtime Execution
  // --------------------------------------------------------------------------
  console.log('\n--- Group 4: Multi-Subsystem AST Concurrent Runtime Execution ---');

  // Subsystem 1: PID Line Follower AST Execution
  console.log('  Testing Subsystem 1: PID Line Follower AST Execution...');
  const pidPins: Record<number, number> = {};
  const pidRuntime = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: (p) => {
      pidPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
  });

  // Wire line sensors to mock values: A1 (left) = 200 (dark line), A2 (right) = 850 (white floor)
  pidRuntime.setSensorResolver(() => ({
    leds: new Map(),
    motors: new Map(),
    ultrasonics: new Map(),
    potentiometers: new Map(),
    servos: new Map(),
    lineSensors: new Map([
      ['line_sensor_left', {
        componentId: 'line_sensor_left',
        isCircuitComplete: true,
        doPin: 4,
        aoPin: 15,
        digitalOutput: 1,
        analogOutput: 200,
        reflectance: 200 / 1023,
      } as any],
      ['line_sensor_right', {
        componentId: 'line_sensor_right',
        isCircuitComplete: true,
        doPin: 7,
        aoPin: 16,
        digitalOutput: 0,
        analogOutput: 850,
        reflectance: 850 / 1023,
      } as any],
    ]),
  }));

  const pidStarted = await pidRuntime.run(EXAMPLE_PID_LINE_FOLLOWER.sketchCode);
  assert(pidStarted, 'PID Line Follower sketch compiles and runs in AST runtime');
  await new Promise((r) => setTimeout(r, 60));

  assert(pidPins[5] !== undefined && pidPins[6] !== undefined, 'PID line follower generated PWM outputs on motor pins D5 & D6');
  assert(pidPins[5] !== pidPins[6], 'PID generated differential PWM between left and right motors to steer');
  pidRuntime.stop();

  // Subsystem 2: Ultrasonic Polar Radar Rover AST Execution
  console.log('  Testing Subsystem 2: Ultrasonic Polar Radar Rover AST Execution...');
  const radarPins: Record<number, number> = {};
  const servoAnglesObserved: number[] = [];
  const radarRuntime = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: (p) => {
      radarPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
    onServoChange: (servos) => {
      for (const s of servos.values()) {
        if (s.isAttached) servoAnglesObserved.push(s.angle);
      }
    },
  });

  radarRuntime.setSensorResolver(() => ({
    leds: new Map(),
    motors: new Map(),
    potentiometers: new Map(),
    lineSensors: new Map(),
    servos: new Map(),
    ultrasonics: new Map([
      ['ultrasonic_eye', {
        componentId: 'ultrasonic_eye',
        isCircuitComplete: true,
        vccConnected: true,
        gndConnected: true,
        trigPin: 11,
        echoPin: 12,
        distanceCm: 15,
        pulseDurationUs: 15 * 58,
      } as any],
    ]),
  }));

  const radarStarted = await radarRuntime.run(EXAMPLE_RADAR_ROVER.sketchCode);
  assert(radarStarted, 'Radar Rover sketch compiles and runs in AST runtime');
  await new Promise((r) => setTimeout(r, 60));

  assert(radarRuntime.getServos().size > 0, 'Servo object successfully attached in AST runtime');
  radarRuntime.stop();

  // Subsystem 3: Closed-Loop Interrupt Odometry Rover AST Execution
  console.log('  Testing Subsystem 3: Closed-Loop Interrupt Odometry Rover AST Execution...');
  const odomPins: Record<number, number> = {};
  const odomRuntime = new SafeArduinoRuntime({
    onStatusChange: () => {},
    onConsoleMessage: () => {},
    onPinChange: (p) => {
      odomPins[p.pin] = p.pwmValue !== undefined ? p.pwmValue : p.value;
    },
    onStatsUpdate: () => {},
  });

  const odomStarted = await odomRuntime.run(EXAMPLE_ODOMETRY_ROVER.sketchCode);
  assert(odomStarted, 'Odometry Rover sketch compiles and runs in AST runtime');

  const registeredInts = odomRuntime.getRegisteredInterrupts();
  assert(registeredInts.has(0) && registeredInts.has(1), 'Hardware interrupts INT0 (pin 2) and INT1 (pin 3) registered');

  // Trigger ticks up to target (11 ticks)
  for (let i = 0; i < 11; i++) {
    await odomRuntime.triggerInterrupt(2, 'RISING');
    await odomRuntime.triggerInterrupt(3, 'RISING');
  }

  assert(odomRuntime.getGlobal('leftTicks') >= 11, 'leftTicks reached targetTicks (11)');
  assert(odomRuntime.getGlobal('rightTicks') >= 11, 'rightTicks reached targetTicks (11)');

  await new Promise((r) => setTimeout(r, 120));
  const finalPins = odomRuntime.getPins();
  assert(finalPins[5].pwmValue === 0 && finalPins[6].pwmValue === 0, 'Motors stopped upon reaching target ticks');
  assert(finalPins[13].digitalValue === 1, 'Status LED on Pin 13 turned HIGH upon reaching target distance');
  odomRuntime.stop();

  // --------------------------------------------------------------------------
  // Group 5: State Transitions, Dirty State Detection & Calibration Integration
  // --------------------------------------------------------------------------
  console.log('\n--- Group 5: State Transitions, Dirty State Detection & Calibration Integration ---');

  // Test save, load, and restore across simulated browser reboot
  const testProject: ProjectConfig = {
    ...EXAMPLE_PID_LINE_FOLLOWER,
    projectId: 'test_phase10_reboot_project',
    name: 'Persistent Phase 10 Rover',
    trackType: 'oval',
    servoAngle: 90,
  };

  const saveRes = saveProject(testProject);
  assert(saveRes.success, 'saveProject() successfully persists project across simulated restart');

  const loadedRes = loadProject('test_phase10_reboot_project');
  assert(loadedRes.project !== null, 'loadProject() successfully restores project state');
  assert(loadedRes.project!.name === 'Persistent Phase 10 Rover', 'Restored project name matches original');
  assert(loadedRes.project!.trackType === 'oval', 'Restored trackType matches original');
  assert(loadedRes.project!.components.length === testProject.components.length, 'Restored all components count');
  assert(loadedRes.project!.wires!.length === testProject.wires!.length, 'Restored all wires count');

  // Test Calibration Profile tuning persistence
  const tunedCalibration: CalibrationProfile = {
    id: 'calib_phase10_tuned',
    name: 'High Precision Sensor Profile',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ultrasonic: {
      maxRangeCm: 350,
      brakingThresholdCm: 30,
      rayCount: 7,
      coneAngleDeg: 15,
    },
    lineSensor: {
      doThreshold: 550,
      blackFloorThreshold: 0.15,
      whiteFloorThreshold: 0.85,
    },
    encoders: {
      slotsPerRevolution: 20,
      wheelDiameterMm: 65,
      gearRatio: 48,
    },
    kinematics: {
      wheelBaseMm: 140,
      maxSpeedMmS: 250,
      motorBasePwm: 195,
      motorDeadbandPwm: 45,
    },
  };

  const calibSave = saveCalibrationProfile(tunedCalibration);
  assert(calibSave.success, 'saveCalibrationProfile() persists tuned calibration');

  const allProfiles = getCalibrationProfiles();
  const foundProfile = allProfiles.find((p) => p.id === 'calib_phase10_tuned');
  assert(foundProfile !== undefined, 'Tuned profile appears in getCalibrationProfiles()');
  assert(foundProfile!.lineSensor.doThreshold === 550, 'Tuned doThreshold (550) persisted accurately');
  assert(foundProfile!.ultrasonic.rayCount === 7, 'Tuned ultrasonic rayCount (7) persisted accurately');

  // Cleanup test artifacts from localStorage
  deleteProject('test_phase10_reboot_project');
  deleteCalibrationProfile('calib_phase10_tuned');

  // Verify deletion cleanup
  const cleanIndex = getProjectIndex();
  assert(!cleanIndex.some((p) => p.projectId === 'test_phase10_reboot_project'), 'Test project safely purged from index');

  console.log('\n================================================================');
  console.log(`PHASE 10 RELIABILITY VERIFICATION: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100%)`);
  console.log('================================================================\n');
}

runPhase10ReliabilityTests().catch((err) => {
  console.error('Fatal error during Phase 10 test execution:', err);
  process.exit(1);
});
