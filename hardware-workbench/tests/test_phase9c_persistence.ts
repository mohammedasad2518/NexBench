/**
 * Test Suite: Phase 9C — Project Persistence, State Export/Import & Calibration Profiles
 * 
 * Verifies:
 * 1. Project assembly and schema serialization (SceneConfig & ProjectConfig superset)
 * 2. Local project save, load, and retrieval via project persistence manager
 * 3. Project index management (multi-project slots, metadata listing, deletion)
 * 4. Autosave snapshot creation, recovery checking, and clearing
 * 5. Calibration profiles creation, tuning persistence, and profile switching
 * 6. JSON serialization, export formatting, and schema validation
 * 7. Corrupted JSON rejection and malformed structure error reporting
 * 8. Sanitization of invalid wires, cyclic attachments, and missing component references
 * 9. Storage usage metrics and size breakdown
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
  assembleProjectConfig,
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
  type CalibrationProfile,
  type ProjectConfig,
} from '../src/utils/projectPersistence';
import { serializeScene, parseSceneJson } from '../src/utils/sceneSerializer';
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

// Sample test robot components
const TEST_COMPONENTS: Component3D[] = [
  {
    id: 'chassis_01',
    name: 'Main Chassis',
    type: 'chassis',
    category: 'structural',
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#334155',
    visible: true,
  },
  {
    id: 'arduino_01',
    name: 'Uno Controller',
    type: 'arduino',
    category: 'controller',
    position: { x: 0, y: 0.65, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
    visible: true,
  },
  {
    id: 'sonar_01',
    name: 'Ultrasonic Eye',
    type: 'ultrasonic',
    category: 'sensor',
    position: { x: 0, y: 1.0, z: 1.0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#0284c7',
    visible: true,
  },
];

const TEST_WIRES: WireConnection[] = [
  {
    id: 'wire_5v',
    fromComponentId: 'arduino_01',
    fromTerminalId: '5V',
    toComponentId: 'sonar_01',
    toTerminalId: 'VCC',
    color: '#ef4444',
  },
  {
    id: 'wire_gnd',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_1',
    toComponentId: 'sonar_01',
    toTerminalId: 'GND',
    color: '#1e293b',
  },
];

const TEST_ATTACHMENTS: MechanicalAttachment[] = [
  {
    id: 'att_chassis_board',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_center',
    childComponentId: 'arduino_01',
    childMountId: 'mount_standoff',
    jointType: 'fixed',
    relativePosition: { x: 0, y: 0.15, z: -0.2 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
];

async function runPhase9cPersistenceTests() {
  console.log('================================================================');
  console.log('HARDWARE WORKBENCH — PHASE 9C PROJECT PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  // Clear storage before tests
  localStorage.clear();

  // --------------------------------------------------------------------------
  // Group 1: Project Assembly & Metadata Generation
  // --------------------------------------------------------------------------
  console.log('--- Group 1: Project Assembly & Metadata Generation ---');

  const pId1 = generateProjectId();
  assert(pId1.startsWith('proj_'), 'generateProjectId() produces a valid prefixed ID');

  const defaultCalib = createDefaultCalibration();
  assert(defaultCalib.ultrasonic.maxRangeCm === 400, 'Default ultrasonic max range is 400cm');
  assert(defaultCalib.lineSensor.doThreshold === 500, 'Default line sensor DO threshold is 500');
  assert(defaultCalib.wheelEncoder.slotsPerRevolution === 20, 'Default wheel encoder slots is 20');
  assert(defaultCalib.motor.baseSpeedPwm === 185, 'Default motor base speed PWM is 185');

  const project1 = assembleProjectConfig({
    projectId: pId1,
    name: 'Autonomous Rover Alpha',
    components: TEST_COMPONENTS,
    wires: TEST_WIRES,
    attachments: TEST_ATTACHMENTS,
    settings: {
      gridVisible: true,
      axesVisible: true,
      snapTranslate: true,
      snapRotate: true,
      snapTranslateStep: 0.5,
      snapRotateStep: 15,
    },
    sketchCode: '// Autonomous loop\nvoid setup() {} void loop() {}',
    calibration: defaultCalib,
    trackType: 'oval',
    servoAngle: 75,
  });

  assert(project1.version.includes('phase9c-persistence'), 'Assembled project includes phase9c version header');
  assert(project1.projectId === pId1, 'Assembled project preserves projectId');
  assert(project1.components.length === 3, 'Assembled project includes all 3 components');
  assert(project1.wires?.length === 2, 'Assembled project includes both wires');
  assert(project1.attachments?.length === 1, 'Assembled project includes mechanical attachment');
  assert(project1.trackType === 'oval', 'Assembled project preserves trackType');
  assert(project1.servoAngle === 75, 'Assembled project preserves servoAngle');
  assert(project1.calibration?.name === 'Default Robot Calibration', 'Assembled project embeds calibration profile');

  // --------------------------------------------------------------------------
  // Group 2: Project Save, Load, and Index Management
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: Project Save, Load, and Index Management ---');

  const saveRes1 = saveProject(project1);
  assert(saveRes1.success === true, 'saveProject() returns success: true');

  const index1 = getProjectIndex();
  assert(index1.length === 1, 'Project index has 1 recorded project');
  assert(index1[0].projectId === pId1, 'Index entry has matching projectId');
  assert(index1[0].name === 'Autonomous Rover Alpha', 'Index entry has matching project name');
  assert(index1[0].componentCount === 3, 'Index entry correctly counts 3 components');
  assert(index1[0].wireCount === 2, 'Index entry correctly counts 2 wires');
  assert(index1[0].attachmentCount === 1, 'Index entry correctly counts 1 attachment');
  assert(index1[0].hasCalibration === true, 'Index entry records hasCalibration: true');
  assert(index1[0].trackType === 'oval', 'Index entry records trackType: oval');

  const loadRes1 = loadProject(pId1);
  assert(loadRes1.project !== null, 'loadProject() successfully retrieves saved project');
  assert(loadRes1.project?.name === 'Autonomous Rover Alpha', 'Loaded project retains project name');
  assert(loadRes1.project?.components.length === 3, 'Loaded project retains 3 components');
  assert(loadRes1.project?.wires?.[0].fromTerminalId === '5V', 'Loaded project retains wire terminals');
  assert(loadRes1.project?.calibration?.ultrasonic.brakingThresholdCm === 25, 'Loaded project retains calibration parameters');
  assert(loadRes1.project?.servoAngle === 75, 'Loaded project retains servo angle');

  // Test loading non-existent project
  const loadNonExistent = loadProject('proj_non_existent_123');
  assert(loadNonExistent.project === null, 'loadProject() returns null for unknown project');
  assert(loadNonExistent.error !== undefined, 'loadProject() returns descriptive error for unknown project');

  // --------------------------------------------------------------------------
  // Group 3: Multiple Project Slots & Deletion
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Multiple Project Slots & Deletion ---');

  const pId2 = generateProjectId();
  const project2 = assembleProjectConfig({
    projectId: pId2,
    name: 'Radar Scanner Bot',
    components: [TEST_COMPONENTS[0]],
    wires: [],
    attachments: [],
    settings: {
      gridVisible: false,
      axesVisible: false,
      snapTranslate: false,
      snapRotate: false,
      snapTranslateStep: 1.0,
      snapRotateStep: 45,
    },
    trackType: 'straight',
    servoAngle: 120,
  });

  saveProject(project2);
  const index2 = getProjectIndex();
  assert(index2.length === 2, 'Project index now tracks 2 distinct projects');

  // Update project 1 name
  project1.name = 'Autonomous Rover Alpha (Tuned)';
  saveProject(project1);
  const indexUpdated = getProjectIndex();
  assert(indexUpdated.length === 2, 'Saving an existing project does not duplicate index slots');
  const meta1Updated = indexUpdated.find((m) => m.projectId === pId1);
  assert(meta1Updated?.name === 'Autonomous Rover Alpha (Tuned)', 'Index reflects updated project name');

  // Delete project 2
  const delRes = deleteProject(pId2);
  assert(delRes.success === true, 'deleteProject() returns success: true');
  const indexAfterDel = getProjectIndex();
  assert(indexAfterDel.length === 1, 'Index length decreases to 1 after deletion');
  assert(indexAfterDel[0].projectId === pId1, 'Remaining project is project 1');
  assert(loadProject(pId2).project === null, 'Deleted project cannot be loaded');

  // --------------------------------------------------------------------------
  // Group 4: Autosave and Session Recovery
  // --------------------------------------------------------------------------
  console.log('\n--- Group 4: Autosave and Session Recovery ---');

  assert(hasAutosave() === false, 'Initially hasAutosave() is false');
  assert(loadAutosave().project === null, 'loadAutosave() returns null when empty');

  const autoRes = saveAutosave(project1);
  assert(autoRes.success === true, 'saveAutosave() successfully writes snapshot');
  assert(hasAutosave() === true, 'hasAutosave() returns true after save');

  const loadedAuto = loadAutosave();
  assert(loadedAuto.project !== null, 'loadAutosave() returns valid project');
  assert(loadedAuto.project?.projectId === pId1, 'Autosaved project has correct ID');
  assert(loadedAuto.savedAt !== undefined, 'Autosaved metadata contains savedAt timestamp');

  clearAutosave();
  assert(hasAutosave() === false, 'clearAutosave() purges autosave slot');
  assert(loadAutosave().project === null, 'loadAutosave() returns null after clear');

  // --------------------------------------------------------------------------
  // Group 5: Calibration Profiles Management
  // --------------------------------------------------------------------------
  console.log('\n--- Group 5: Calibration Profiles Management ---');

  assert(getCalibrationProfiles().length === 0, 'Initially no custom calibration profiles stored');

  const highSpeedProfile: CalibrationProfile = {
    id: 'calib_highspeed',
    name: 'High Speed Competition Track',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ultrasonic: {
      maxRangeCm: 450,
      brakingThresholdCm: 35,
      rayCount: 7,
      coneAngleDeg: 15,
    },
    lineSensor: {
      doThreshold: 450,
      blackReflectance: 0.08,
      whiteReflectance: 0.98,
      trackLineWidth: 0.85,
    },
    wheelEncoder: {
      slotsPerRevolution: 30,
      wheelDiameter: 1.1,
      wheelBase: 3.0,
    },
    motor: {
      baseSpeedPwm: 220,
      maxPwm: 255,
      minPwm: 20,
      speedScaleFactor: 4.5,
    },
  };

  const calibSaveRes = saveCalibrationProfile(highSpeedProfile);
  assert(calibSaveRes.success === true, 'saveCalibrationProfile() returns success: true');

  const profilesList = getCalibrationProfiles();
  assert(profilesList.length === 1, 'getCalibrationProfiles() returns 1 profile');
  assert(profilesList[0].id === 'calib_highspeed', 'Stored profile ID matches');
  assert(profilesList[0].motor.baseSpeedPwm === 220, 'Stored profile base speed is 220');
  assert(profilesList[0].ultrasonic.brakingThresholdCm === 35, 'Stored profile braking threshold is 35cm');

  const calibDelRes = deleteCalibrationProfile('calib_highspeed');
  assert(calibDelRes.success === true, 'deleteCalibrationProfile() returns success: true');
  assert(getCalibrationProfiles().length === 0, 'Profiles list empty after profile deletion');

  // --------------------------------------------------------------------------
  // Group 6: JSON Serialization & Parsing (sceneSerializer.ts)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 6: JSON Serialization & Parsing ---');

  const serializedScene = serializeScene(
    TEST_COMPONENTS,
    TEST_WIRES,
    TEST_ATTACHMENTS,
    {
      gridVisible: true,
      axesVisible: true,
      snapTranslate: true,
      snapRotate: true,
      snapTranslateStep: 0.5,
      snapRotateStep: 15,
    },
    'Test Serialized Scene',
    'void loop() {}',
    'wavy',
    105,
    highSpeedProfile,
    'proj_serialized_123'
  );

  assert(serializedScene.version.includes('phase9c-persistence'), 'Serialized version matches phase9c');
  assert(serializedScene.trackType === 'wavy', 'Serialized trackType is wavy');
  assert(serializedScene.servoAngle === 105, 'Serialized servoAngle is 105');
  assert(serializedScene.calibration?.name === 'High Speed Competition Track', 'Serialized calibration matches');
  assert(serializedScene.projectId === 'proj_serialized_123', 'Serialized projectId matches');

  const jsonStr = JSON.stringify(serializedScene);
  const parsedScene = parseSceneJson(jsonStr);

  assert(parsedScene.name === 'Test Serialized Scene', 'Parsed scene name matches');
  assert(parsedScene.components.length === 3, 'Parsed components count matches');
  assert(parsedScene.wires?.length === 2, 'Parsed wires count matches');
  assert(parsedScene.attachments?.length === 1, 'Parsed attachments count matches');
  assert(parsedScene.trackType === 'wavy', 'Parsed trackType preserved as wavy');
  assert(parsedScene.servoAngle === 105, 'Parsed servoAngle preserved as 105');
  assert(parsedScene.calibration?.motor.baseSpeedPwm === 220, 'Parsed calibration parameters restored');
  assert(parsedScene.projectId === 'proj_serialized_123', 'Parsed projectId restored');

  // --------------------------------------------------------------------------
  // Group 7: JSON Validation & Schema Guarding
  // --------------------------------------------------------------------------
  console.log('\n--- Group 7: JSON Validation & Schema Guarding ---');

  // Valid project JSON validation
  const valGood = validateProjectJson(serializedScene);
  assert(valGood.valid === true, 'validateProjectJson() accepts valid serialized scene');
  assert(valGood.errors.length === 0, 'No errors for valid project');

  // Null input
  const valNull = validateProjectJson(null);
  assert(valNull.valid === false, 'validateProjectJson() rejects null input');
  assert(valNull.errors[0].includes('valid JSON object'), 'Reports invalid JSON object');

  // Missing components
  const valNoComps = validateProjectJson({ version: '5.0', name: 'Corrupt' });
  assert(valNoComps.valid === false, 'validateProjectJson() rejects missing components array');

  // Invalid component without ID or type
  const valBadComp = validateProjectJson({
    components: [{ id: '', type: 'chassis' }, { id: 'c2' }],
  });
  assert(valBadComp.valid === false, 'validateProjectJson() catches components missing id or type');

  // Non-array wires
  const valBadWires = validateProjectJson({
    components: [{ id: 'c1', type: 'chassis' }],
    wires: 'not-an-array',
  });
  assert(valBadWires.valid === false, 'validateProjectJson() catches non-array wires');

  // Unknown track type warning
  const valTrackWarn = validateProjectJson({
    components: [{ id: 'c1', type: 'chassis' }],
    trackType: 'super-loop-unknown',
  });
  assert(valTrackWarn.valid === true, 'Unknown track type allows parsing with warning');
  assert(valTrackWarn.warnings.some((w) => w.includes('default to "oval"')), 'Warns about fallback to oval track');

  // --------------------------------------------------------------------------
  // Group 8: Sanitization of Cyclic Attachments & Corrupt Wires
  // --------------------------------------------------------------------------
  console.log('\n--- Group 8: Sanitization of Cyclic Attachments & Corrupt Wires ---');

  const corruptJson = JSON.stringify({
    version: '5.0',
    name: 'Corrupt Scene',
    components: [
      { id: 'part_a', name: 'Part A', type: 'chassis' },
      { id: 'part_b', name: 'Part B', type: 'servo' },
    ],
    wires: [
      // Valid wire
      { id: 'w1', fromComponentId: 'part_a', fromTerminalId: 'T1', toComponentId: 'part_b', toTerminalId: 'T2' },
      // Duplicate wire (reversed direction)
      { id: 'w2', fromComponentId: 'part_b', fromTerminalId: 'T2', toComponentId: 'part_a', toTerminalId: 'T1' },
      // Wire referencing non-existent component
      { id: 'w3', fromComponentId: 'part_a', fromTerminalId: 'T1', toComponentId: 'ghost_part', toTerminalId: 'T2' },
    ],
    attachments: [
      // Valid attachment: A -> B
      { id: 'att_1', parentComponentId: 'part_a', parentMountId: 'm1', childComponentId: 'part_b', childMountId: 'm2' },
      // Cyclic attachment: B -> A (illegal cycle!)
      { id: 'att_2', parentComponentId: 'part_b', parentMountId: 'm2', childComponentId: 'part_a', childMountId: 'm1' },
      // Self-attachment: A -> A
      { id: 'att_3', parentComponentId: 'part_a', parentMountId: 'm1', childComponentId: 'part_a', childMountId: 'm2' },
    ],
  });

  const sanitized = parseSceneJson(corruptJson);
  assert(sanitized.components.length === 2, 'Parsed sanitized components');
  assert(sanitized.wires?.length === 1, 'Duplicate reversed wire and ghost wire removed (only 1 valid wire)');
  assert(sanitized.attachments?.length === 1, 'Cycle and self-attachment filtered out (only 1 valid attachment)');
  assert(sanitized.attachments?.[0].id === 'att_1', 'Kept valid parent-child relationship');

  // --------------------------------------------------------------------------
  // Group 9: Storage Metrics Breakdown
  // --------------------------------------------------------------------------
  console.log('\n--- Group 9: Storage Metrics Breakdown ---');

  const storageUsage = getStorageUsage();
  assert(storageUsage.totalBytes > 0, 'Storage usage reports non-zero total bytes');
  assert(storageUsage.projectBytes.has(pId1), 'Storage metrics breaks down size for project 1');
  console.log(`  [INFO] Total storage used: ${storageUsage.totalBytes} bytes`);

  // Final assertions check
  console.log('\n================================================================');
  console.log(`PHASE 9C PERSISTENCE VERIFICATION: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100%)`);
  console.log('================================================================\n');
}

runPhase9cPersistenceTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
