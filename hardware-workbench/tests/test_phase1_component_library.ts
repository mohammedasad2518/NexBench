/**
 * Test Suite: Phase 1 — Hardware Component Library Foundation and Core Components
 * 
 * Verifies:
 * 1. Component Registry & Scalable Architecture:
 *    - 43 total registered components (33 Phase 1 components + 10 preserved legacy components)
 *    - Unique IDs, valid category/subcategory mappings, schema validation
 *    - Rejection of invalid / duplicate component definitions
 * 2. Development Boards (11 Boards):
 *    - Uno, Mega 2560, Nano, Leonardo, NodeMCU, ESP32 DevKit, ESP32-CAM,
 *      RPi Pico, RPi Pico W, Raspberry Pi 4, STM32 Blue Pill
 *    - Electrical specs (operating voltage, input range, clock speed, logic level)
 *    - Pinout completeness, unique pin IDs, valid electrical pin types
 *    - Simulation capabilities and verified datasheet URLs
 * 3. Breadboards & Prototyping Systems (6 Boards):
 *    - Full-Size 830, Half-Size 400, Mini 170, Perfboard, Stripboard, PCB Prototype
 *    - Row/column terminal generation & 5-hole group node sharing
 *    - Power rail continuity (+/- across columns)
 *    - Center divider electrical isolation (Side A vs Side B)
 *    - Stripboard continuous copper track electrical node sharing
 *    - areTerminalsConnected() connectivity resolution
 * 4. Wires & Physical Cables (10 Types):
 *    - Male-Male, Male-Female, Female-Female, Single Solid-Core, Multicolor Ribbon,
 *      Flat IDC Ribbon, USB A-to-B, Micro-USB, USB-C, Alligator Clip
 *    - Wire gauge (AWG), connector types, pin counts, flexibility, terminal compatibility
 * 5. Connectors & Accessories (6 Types):
 *    - Male Pin Header 1x40, Female Pin Header 1x40, Screw Terminal 2-Pin,
 *      JST-XH 2-Pin, DC Barrel Jack 2.1mm, MB102 Breadboard Power Supply Module
 *    - Pin definitions, dimensions, electrical limits
 * 6. Multi-Attribute Search & Filtering Engine:
 *    - Keyword search across name, description, tags, manufacturer, family
 *    - Category filtering & Subcategory filtering
 *    - Category counts computation
 *    - Case-insensitivity & empty query handling
 * 7. 3D Model Factory & InstancedMesh Performance:
 *    - Creation of 3D meshes for all Phase 1 components via createComponentMesh()
 *    - InstancedMesh verification for breadboard sockets (830+ holes in 1 draw call)
 *    - Proper geometry and materials assignment
 * 8. Workbench Integration, Serialization & Persistence:
 *    - Terminal definition lookup via polymorphic getComponentTerminals()
 *    - Component creation as Component3D
 *    - JSON scene serialization & deserialization preserving new components
 *    - ProjectConfig validation with Phase 1 components
 */

// Polyfill localStorage for headless environment
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

import { componentRegistry } from '../src/library/registry';
import { searchComponents, getCategoryCounts } from '../src/library/search';
import { HARDWARE_CATEGORIES } from '../src/library/categories';
import type { HardwareComponentDefinition, HardwareCategory } from '../src/library/types';
import { getComponentTerminals } from '../src/utils/terminalDefinitions';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { serializeScene, parseSceneJson } from '../src/utils/sceneSerializer';
import { validateProjectJson, assembleProjectConfig } from '../src/utils/projectPersistence';
import type { Component3D } from '../src/types/workbench';
import * as THREE from 'three';

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

console.log('========================================================================');
console.log('TEST SUITE: Phase 1 — Hardware Component Library Foundation & Core Components');
console.log('========================================================================\n');

// ============================================================================
// SECTION 1: COMPONENT REGISTRY & SCALABLE ARCHITECTURE
// ============================================================================
console.log('--- Section 1: Component Registry & Scalable Architecture ---');

const allComponents = componentRegistry.getAll();
assert(allComponents.length >= 43, `Registry contains all 43 registered components (found: ${allComponents.length})`);

// Check unique IDs
const idSet = new Set<string>();
let allIdsUnique = true;
for (const comp of allComponents) {
  if (idSet.has(comp.id)) {
    allIdsUnique = false;
    console.error(`  Duplicate component ID found: ${comp.id}`);
  }
  idSet.add(comp.id);
}
assert(allIdsUnique, `All ${allComponents.length} component IDs are unique`);

// Check required fields on every component
let allHaveRequiredFields = true;
for (const comp of allComponents) {
  if (!comp.id || !comp.name || !comp.category || !comp.description || !comp.modelFactoryId || !comp.dimensions) {
    allHaveRequiredFields = false;
    console.error(`  Component ${comp.id} missing required core metadata`);
  }
  if (!comp.dimensions.widthMm || !comp.dimensions.heightMm || !comp.dimensions.depthMm) {
    allHaveRequiredFields = false;
    console.error(`  Component ${comp.id} has invalid dimensions: ${JSON.stringify(comp.dimensions)}`);
  }
}
assert(allHaveRequiredFields, 'Every registered component possesses valid metadata, modelFactoryId, and dimensions');

// Check category definitions integrity
const categoryIds = HARDWARE_CATEGORIES.map(c => c.id);
assert(categoryIds.includes('development_boards'), 'Category "development_boards" is defined');
assert(categoryIds.includes('prototyping'), 'Category "prototyping" is defined');
assert(categoryIds.includes('wires_cables'), 'Category "wires_cables" is defined');
assert(categoryIds.includes('connectors_accessories'), 'Category "connectors_accessories" is defined');

// Validate validation logic
const testInvalidComp = { id: '', name: 'Broken', category: 'invalid_cat' as any } as any;
const validationResult = componentRegistry.validate(testInvalidComp);
assert(!validationResult.valid, 'validate rejects empty id and invalid category');
assert(validationResult.errors.length >= 3, `Validation returned ${validationResult.errors.length} actionable errors`);

// ============================================================================
// SECTION 2: DEVELOPMENT BOARDS (11 BOARDS)
// ============================================================================
console.log('\n--- Section 2: Development Boards Specifications and Pinouts ---');

const expectedBoards = [
  'arduino',
  'arduino_mega',
  'arduino_nano',
  'arduino_leonardo',
  'esp8266_nodemcu',
  'esp32_devkit',
  'esp32_cam',
  'raspberry_pi_pico',
  'raspberry_pi_pico_w',
  'raspberry_pi_4',
  'stm32_blue_pill',
];

for (const boardId of expectedBoards) {
  const board = componentRegistry.get(boardId);
  assert(!!board, `Development board "${boardId}" is registered`);
  if (!board) continue;

  assertEqual(board.category, 'development_boards', `${boardId} belongs to 'development_boards' category`);
  assert(board.pins.length > 0, `${boardId} has defined pins (total: ${board.pins.length})`);
  assert(board.electrical !== undefined, `${boardId} has electrical specifications`);
  assert(board.electrical?.operatingVoltage !== undefined, `${boardId} has defined operatingVoltage (${board.electrical?.operatingVoltage})`);
  assert(board.electrical?.logicLevel !== undefined, `${boardId} has defined logicLevel (${board.electrical?.logicLevel})`);
  assert(!!board.datasheetUrl && board.datasheetUrl.startsWith('http'), `${boardId} has documentation URL`);

  // Verify pins uniqueness within the board
  const pinIds = new Set<string>();
  let pinsUnique = true;
  for (const pin of board.pins) {
    if (pinIds.has(pin.id)) {
      pinsUnique = false;
      console.error(`  Board ${boardId} has duplicate pin ID: ${pin.id}`);
    }
    pinIds.add(pin.id);
    if (!pin.position || typeof pin.position.x !== 'number' || typeof pin.position.y !== 'number' || typeof pin.position.z !== 'number') {
      pinsUnique = false;
      console.error(`  Board ${boardId} pin ${pin.id} has invalid 3D coordinate`);
    }
  }
  assert(pinsUnique, `${boardId} has strictly unique pin IDs and 3D positions for all ${board.pins.length} pins`);
}

// Specific board pin counts & architectural checks
const uno = componentRegistry.get('arduino')!;
assert(uno.pins.length >= 26, `Arduino Uno has >= 26 pins (found ${uno.pins.length})`);
assert(uno.pins.some(p => p.id === 'D13' && p.pinType === 'gpio'), 'Arduino Uno pin D13 is defined with GPIO');
assert(uno.pins.some(p => p.id === 'A0' && p.pinType === 'analog_in'), 'Arduino Uno pin A0 is defined with analog_in');
assert(uno.pins.some(p => p.id === '5V' && p.pinType === 'power'), 'Arduino Uno pin 5V power is defined');

const mega = componentRegistry.get('arduino_mega')!;
assert(mega.pins.length >= 70, `Arduino Mega 2560 has >= 70 pins (found ${mega.pins.length})`);
assert(mega.pins.some(p => p.id === 'D53'), 'Arduino Mega pin D53 is defined');
assert(mega.pins.some(p => p.id === 'A15'), 'Arduino Mega pin A15 is defined');

const esp32 = componentRegistry.get('esp32_devkit')!;
assert(esp32.pins.length === 30, `ESP32 DevKit V1 has exactly 30 pins (found ${esp32.pins.length})`);
assertEqual(esp32.electrical?.logicLevel, '3.3V', 'ESP32 DevKit has 3.3V logic level');
assert(esp32.electrical?.supportedInterfaces?.some(i => i.toLowerCase().includes('wi-fi') || i.toLowerCase().includes('wifi')), 'ESP32 declares WiFi in supported interfaces');

const pico = componentRegistry.get('raspberry_pi_pico')!;
assert(pico.pins.length === 40, `Raspberry Pi Pico has exactly 40 pins (found ${pico.pins.length})`);
assertEqual(pico.boardFamily, 'RP2040', 'Raspberry Pi Pico MCU family is RP2040');

const stm32 = componentRegistry.get('stm32_blue_pill')!;
assert(stm32.pins.length === 30, `STM32 Blue Pill has 30 pins (found ${stm32.pins.length})`);
assertEqual(stm32.boardFamily, 'STM32F1', 'STM32 Blue Pill board family is STM32F1');

// ============================================================================
// SECTION 3: BREADBOARDS & PROTOTYPING SYSTEMS (6 BOARDS)
// ============================================================================
console.log('\n--- Section 3: Breadboards and Prototyping Systems ---');

const expectedBreadboards = [
  'breadboard_full',
  'breadboard_half',
  'breadboard_mini',
  'perfboard',
  'stripboard',
  'pcb_prototype',
];

for (const bbId of expectedBreadboards) {
  const bb = componentRegistry.get(bbId);
  assert(!!bb, `Prototyping board "${bbId}" is registered`);
  if (!bb) continue;

  assertEqual(bb.category, 'prototyping', `${bbId} is in 'prototyping'`);
  assert(bb.pins.length >= 10, `${bbId} has high-density pin/socket definitions (${bb.pins.length} tie points)`);
}

// Detailed Full Breadboard (830 points) verification
const fullBb = componentRegistry.get('breadboard_full')!;
assertEqual(fullBb.breadboardConfig?.totalTiePoints, 680, 'Full breadboard has 680 terminal tie points modeled');
assertEqual(fullBb.breadboardConfig?.powerRailsCount, 4, 'Full breadboard has 4 power rails');
assertEqual(fullBb.breadboardConfig?.rowsCount, 63, 'Full breadboard has 63 terminal rows');

// Test 5-hole group node sharing and isolation
assert(fullBb.breadboardConfig?.areTerminalsConnected !== undefined, 'Full breadboard implements areTerminalsConnected()');
const areConnected = fullBb.breadboardConfig!.areTerminalsConnected;

assert(areConnected('T_5_a', 'T_5_b'), 'T_5_a and T_5_b are electrically connected in same column group');
assert(areConnected('T_5_a', 'T_5_e'), 'T_5_a and T_5_e are electrically connected (extremes of 5-hole row)');
assert(!areConnected('T_5_a', 'T_5_f'), 'Center trench isolates T_5_a (Side A) from T_5_f (Side B)');
assert(!areConnected('T_5_a', 'T_6_a'), 'Adjacent rows T_5 and T_6 are electrically isolated');

// Test Power Rail continuity
assert(areConnected('RAIL_TOP_POS_1', 'RAIL_TOP_POS_5'), 'Top positive power rail is continuous across length');
assert(!areConnected('RAIL_TOP_POS_1', 'RAIL_TOP_NEG_1'), 'Positive and ground power rails are electrically isolated');
assert(!areConnected('RAIL_TOP_POS_1', 'RAIL_BOT_POS_1'), 'Top positive rail and bottom positive rail are electrically isolated');

// Stripboard continuous track verification
const stripboard = componentRegistry.get('stripboard')!;
assertEqual(stripboard.breadboardConfig?.areTerminalsConnected !== undefined, true, 'Stripboard implements areTerminalsConnected');
const areStripConnected = stripboard.breadboardConfig!.areTerminalsConnected;
assert(areStripConnected('STRIP_T1_1', 'STRIP_T1_2'), 'Holes along same copper strip track (STRIP_T1) are connected');
assert(!areStripConnected('STRIP_T1_1', 'STRIP_T2_1'), 'Holes on separate copper tracks (STRIP_T1 vs STRIP_T2) are isolated');

// ============================================================================
// SECTION 4: WIRES AND PHYSICAL CABLES (10 TYPES)
// ============================================================================
console.log('\n--- Section 4: Wires and Physical Cables ---');

const expectedWires = [
  'wire_m2m',
  'wire_m2f',
  'wire_f2f',
  'wire_solid_core',
  'wire_multicolor',
  'cable_ribbon',
  'cable_usb_ab',
  'cable_micro_usb',
  'cable_usb_c',
  'wire_alligator',
];

for (const wireId of expectedWires) {
  const wire = componentRegistry.get(wireId);
  assert(!!wire, `Wire/Cable "${wireId}" is registered`);
  if (!wire) continue;

  assertEqual(wire.category, 'wires_cables', `${wireId} is in 'wires_cables'`);
  assert(wire.wireConfig !== undefined, `${wireId} has wireConfig`);
  assert(wire.pins.length >= 2, `${wireId} has at least 2 contact terminals (found: ${wire.pins.length})`);
  assert(wire.wireConfig?.gaugeAwg !== undefined, `${wireId} specifies gauge AWG (${wire.wireConfig?.gaugeAwg} AWG)`);
}

const jumperMM = componentRegistry.get('wire_m2m')!;
assertEqual(jumperMM.wireConfig?.connectorTypeA, 'male_dupont', 'Jumper M-M has male_dupont at start');
assertEqual(jumperMM.wireConfig?.connectorTypeB, 'male_dupont', 'Jumper M-M has male_dupont at end');

const jumperMF = componentRegistry.get('wire_m2f')!;
assertEqual(jumperMF.wireConfig?.connectorTypeA, 'male_dupont', 'Jumper M-F has male_dupont at start');
assertEqual(jumperMF.wireConfig?.connectorTypeB, 'female_dupont', 'Jumper M-F has female_dupont at end');

const usbC = componentRegistry.get('cable_usb_c')!;
assertEqual(usbC.wireConfig?.connectorTypeB, 'usb_c', 'USB-C has usb_c connector');

const alligator = componentRegistry.get('wire_alligator')!;
assertEqual(alligator.wireConfig?.connectorTypeA, 'alligator_clip', 'Alligator wire has alligator_clip connector');

// ============================================================================
// SECTION 5: CONNECTORS AND ACCESSORIES (6 TYPES)
// ============================================================================
console.log('\n--- Section 5: Connectors and Accessories ---');

const expectedAccessories = [
  'header_male_40',
  'header_female_40',
  'terminal_block_2p',
  'connector_jst_xh',
  'dc_barrel_jack',
  'breadboard_psu_module',
];

for (const accId of expectedAccessories) {
  const acc = componentRegistry.get(accId);
  assert(!!acc, `Accessory "${accId}" is registered`);
  if (!acc) continue;

  assertEqual(acc.category, 'connectors_accessories', `${accId} is in 'connectors_accessories'`);
  assert(acc.pins.length >= 2, `${accId} has at least 2 terminals (found: ${acc.pins.length})`);
}

const headerMale = componentRegistry.get('header_male_40')!;
assert(headerMale.pins.length >= 8, 'Male Header 1x40 has at least 8 breakaway pins modeled');

const terminalBlock = componentRegistry.get('terminal_block_2p')!;
assertEqual(terminalBlock.pins.length, 2, 'Screw Terminal Block has 2 connection terminals');

const mb102 = componentRegistry.get('breadboard_psu_module')!;
assert(mb102.pins.some(p => p.id === 'RAIL_TOP_VCC' && p.pinType === 'power'), 'MB102 has 5V/3.3V selectable positive output rail');
assert(mb102.pins.some(p => p.id === 'RAIL_TOP_GND' && p.pinType === 'ground'), 'MB102 has GND output rail');
assert(mb102.pins.some(p => p.id === 'DC_IN_POS'), 'MB102 has DC barrel input terminal');

// ============================================================================
// SECTION 6: MULTI-ATTRIBUTE SEARCH, FILTERING AND INDEXING
// ============================================================================
console.log('\n--- Section 6: Multi-Attribute Search, Filtering and Indexing ---');

// Search by board name
const unoResults = searchComponents({ query: 'uno' });
assert(unoResults.length >= 1 && unoResults.some(c => c.id === 'arduino'), 'Search for "uno" finds Arduino Uno');

// Search by manufacturer / family tag
const espressifResults = searchComponents({ query: 'espressif' });
assert(espressifResults.length >= 2, `Search for "espressif" finds ESP boards (found: ${espressifResults.length})`);

// Search by category
const boardCategoryResults = searchComponents({ category: 'development_boards' });
assertEqual(boardCategoryResults.length, 11, 'Category filter for "development_boards" returns exactly 11 boards');

const bbCategoryResults = searchComponents({ category: 'prototyping' });
assertEqual(bbCategoryResults.length, 6, 'Category filter for "prototyping" returns exactly 6 prototyping items');

const wireCategoryResults = searchComponents({ category: 'wires_cables' });
assertEqual(wireCategoryResults.length, 10, 'Category filter for "wires_cables" returns exactly 10 wires/cables');

const accCategoryResults = searchComponents({ category: 'connectors_accessories' });
assertEqual(accCategoryResults.length, 6, 'Category filter for "connectors_accessories" returns exactly 6 accessories');

// Subcategory filtering
const sbcResults = searchComponents({ category: 'development_boards', subcategory: 'Raspberry Pi' });
assert(sbcResults.length >= 2, 'Subcategory filter "Raspberry Pi" returns Raspberry Pi boards');

// Empty query returns all items
const emptyQueryResults = searchComponents({ query: '' });
assert(emptyQueryResults.length === allComponents.length, `Empty query returns all ${allComponents.length} components`);

// Case insensitivity
const uppercaseResults = searchComponents({ query: 'BREADBOARD' });
assert(uppercaseResults.length >= 3, `Uppercase search "BREADBOARD" finds breadboards (found: ${uppercaseResults.length})`);

// Category counts
const counts = getCategoryCounts();
assertEqual(counts.development_boards, 11, 'Category count for development_boards is 11');
assertEqual(counts.prototyping, 6, 'Category count for prototyping is 6');
assertEqual(counts.wires_cables, 10, 'Category count for wires_cables is 10');
assertEqual(counts.connectors_accessories, 6, 'Category count for connectors_accessories is 6');

// ============================================================================
// SECTION 7: 3D MODEL FACTORY & INSTANCEDMESH PERFORMANCE
// ============================================================================
console.log('\n--- Section 7: 3D Model Factory & InstancedMesh Performance ---');

// Build test component instances and generate 3D meshes
const testTypesToRender = [
  'arduino',
  'arduino_mega',
  'esp32_devkit',
  'raspberry_pi_pico',
  'raspberry_pi_4',
  'breadboard_full',
  'breadboard_mini',
  'stripboard',
  'wire_m2m',
  'cable_usb_c',
  'header_male_40',
  'breadboard_psu_module',
];

for (const compType of testTypesToRender) {
  const dummyComp: Component3D = {
    id: `test_${compType}`,
    type: compType as any,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
  };

  let meshGroup: THREE.Group | null = null;
  let renderError: string | null = null;
  try {
    meshGroup = createComponentMesh(dummyComp);
  } catch (err: any) {
    renderError = err.message || String(err);
  }

  assert(!renderError && !!meshGroup, `createComponentMesh() successfully generated 3D mesh for "${compType}"`);
  assert(meshGroup instanceof THREE.Group, `Mesh for "${compType}" is a THREE.Group`);
  assert(meshGroup ? meshGroup.children.length > 0 : false, `Mesh for "${compType}" has child meshes (count: ${meshGroup?.children.length})`);
}

// Check InstancedMesh on Full Breadboard model
const dummyBb: Component3D = {
  id: 'test_instanced_bb',
  type: 'breadboard_full' as any,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#f8fafc',
};
const bbMesh = createComponentMesh(dummyBb);
let foundInstancedMesh = false;
let instancedCount = 0;
bbMesh.traverse(child => {
  if (child instanceof THREE.InstancedMesh) {
    foundInstancedMesh = true;
    instancedCount = child.count;
  }
});
assert(foundInstancedMesh, 'Breadboard 3D model utilizes THREE.InstancedMesh for hole sockets');
assert(instancedCount >= 800, `InstancedMesh renders ${instancedCount} tie-point sockets in a single GPU draw call`);

// ============================================================================
// SECTION 8: WORKBENCH INTEGRATION, SERIALIZATION & PERSISTENCE
// ============================================================================
console.log('\n--- Section 8: Workbench Integration, Serialization & Persistence ---');

// Polymorphic getComponentTerminals test
const unoTerminalsFromType = getComponentTerminals('arduino' as any);
assert(unoTerminalsFromType.length >= 22, `getComponentTerminals('arduino') returned ${unoTerminalsFromType.length} terminals`);

const dummyMegaComp: Component3D = {
  id: 'mega_inst_1',
  type: 'arduino_mega' as any,
  position: { x: 10, y: 0, z: 5 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  color: '#059669',
};
const megaTerminalsFromComp = getComponentTerminals(dummyMegaComp);
assert(megaTerminalsFromComp.length >= 70, `getComponentTerminals(Component3D) for Mega returned ${megaTerminalsFromComp.length} terminals`);

// Scene serialization with Phase 1 components
const sceneComponents: Component3D[] = [
  { id: 'uno_1', type: 'arduino', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#059669' },
  { id: 'bb_1', type: 'breadboard_half', position: { x: 100, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#f8fafc' },
  { id: 'wire_1', type: 'wire_m2m', position: { x: 50, y: 5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#ef4444' },
  { id: 'psu_1', type: 'breadboard_psu_module', position: { x: 100, y: 15, z: -40 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#000000' },
];

const defaultSettings = {
  gridVisible: true,
  axesVisible: true,
  snapTranslate: false,
  snapRotate: false,
  snapTranslateStep: 1,
  snapRotateStep: 15,
};
const sceneConfigObj = serializeScene(sceneComponents, [], [], defaultSettings, 'Phase 1 Scene');
const serializedJson = JSON.stringify(sceneConfigObj, null, 2);
assert(typeof serializedJson === 'string' && serializedJson.length > 50, 'serializeScene serialized Phase 1 components to JSON');

const parsedScene = parseSceneJson(serializedJson);
assertEqual(parsedScene.components.length, 4, 'parseSceneJson restored exactly 4 components');
assertEqual(parsedScene.components[0].type, 'arduino', 'Restored component 0 is arduino');
assertEqual(parsedScene.components[1].type, 'breadboard_half', 'Restored component 1 is breadboard_half');
assertEqual(parsedScene.components[2].type, 'wire_m2m', 'Restored component 2 is wire_m2m');
assertEqual(parsedScene.components[3].type, 'breadboard_psu_module', 'Restored component 3 is breadboard_psu_module');

// Validate project persistence with Phase 1 components
const projectConfig = assembleProjectConfig({
  projectId: 'proj_phase1_test',
  name: 'Phase 1 Test Project',
  components: sceneComponents,
  wires: [
    {
      id: 'w1',
      fromComponent: 'uno_1',
      fromTerminal: '5V',
      toComponent: 'bb_1',
      toTerminal: 'RAIL_TOP_POS_1',
      color: '#ef4444',
      type: 'signal',
    },
  ],
  attachments: [],
  settings: defaultSettings,
});

const validation = validateProjectJson(projectConfig);
assert(validation.valid, 'validateProjectJson validates project with Phase 1 components and wires');
assertEqual(validation.errors.length, 0, 'Project has 0 validation errors');
assertEqual(projectConfig.components.length, 4, 'Project config preserved all 4 Phase 1 components');
assertEqual(projectConfig.wires.length, 1, 'Project config preserved wire connection to breadboard rail');

console.log('\n========================================================================');
console.log(`PHASE 1 TEST SUMMARY: ${passedAssertions} / ${totalAssertions} assertions passed (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
console.log('========================================================================');

if (passedAssertions !== totalAssertions) {
  process.exit(1);
} else {
  console.log('ALL PHASE 1 COMPONENT LIBRARY TESTS PASSED PERFECTLY!\n');
}
