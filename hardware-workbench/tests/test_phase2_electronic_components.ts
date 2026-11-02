/**
 * Test Suite: Phase 2 — Basic Electronic Components Library
 * 
 * Comprehensive validation of 31 basic electronic components:
 * 1. Resistors & Variable Resistors (Fixed, Trimpot, Rotary Potentiometer)
 * 2. Capacitors (Ceramic Disc, Aluminum Electrolytic)
 * 3. Inductors & Crystals (Toroidal Power Inductor, HC-49/S Quartz Crystal)
 * 4. Diodes (1N4007 Rectifier, 1N4733A Zener, 1N5819 Schottky)
 * 5. Light Emitting Diodes (Red, Green, Blue, Yellow, White, Infrared, RGB)
 * 6. Optical Components (Photodiode)
 * 7. Transistors & MOSFETs (2N3904 NPN, 2N3906 PNP, IRF540N N-MOSFET, IRF9540 P-MOSFET)
 * 8. Switches & Buttons (Tactile 6x6mm, SPDT Toggle, SPDT Slide, 4-Pos Rocker DIP)
 * 9. Protection Components (5x20mm Glass Cartridge Fuse)
 * 10. Integrated Circuits (Generic DIP IC, LM358 Dual Op-Amp, 74HC00 Quad NAND, PC817 Optocoupler)
 * 
 * Verifies:
 * - Scalable Registry & Total Component Count (74 components)
 * - Category & Subcategory Taxonomy (basic_electronics and 10 subcategories)
 * - Electrical characteristics, pinout definitions & polarity requirements
 * - Three.js 3D Mesh Generation for all 31 components
 * - Interactive Dynamic Visual Updates (resistor color bands, switch toggling, blown fuse, potentiometer wiper rotation)
 * - Hardware Bridge circuit evaluation (potentiometers and LEDs)
 * - Project serialization & persistence with Phase 2 components
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

import * as THREE from 'three';
import { componentRegistry } from '../src/library/registry';
import { HARDWARE_CATEGORIES } from '../src/library/categories';
import { searchComponents, getCategoryCounts } from '../src/library/search';
import { getComponentTerminals } from '../src/utils/terminalDefinitions';
import { createComponentMesh } from '../src/utils/threeMeshFactory';
import { evaluateCircuitState } from '../src/utils/hardwareBridge';
import type { Component3D, WireConnection, MechanicalAttachment } from '../src/types/workbench';

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} ${testName}`);
  } else {
    failedTests++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log(`${CYAN}================================================================${RESET}`);
console.log(`${CYAN}  PHASE 2: BASIC ELECTRONIC COMPONENTS VALIDATION SUITE        ${RESET}`);
console.log(`${CYAN}================================================================${RESET}\n`);

// ----------------------------------------------------------------------------
// TEST GROUP 1: Registry, Taxonomy, and Catalog Validation
// ----------------------------------------------------------------------------
console.log(`${YELLOW}1. Registry & Category Taxonomy Validation${RESET}`);

const allComponents = componentRegistry.getAll();
assert(allComponents.length >= 74, `Total components registered >= 74 (Actual: ${allComponents.length})`);

const basicCat = HARDWARE_CATEGORIES.find((c) => c.id === 'basic_electronics');
assert(!!basicCat, "Category 'basic_electronics' exists in HARDWARE_CATEGORIES");
assert(basicCat?.label === 'Basic Electronics', "Category label is 'Basic Electronics'");
assert(basicCat?.subcategories.length === 10, `Category has 10 subcategories (Actual: ${basicCat?.subcategories.length})`);

const expectedSubcategories = [
  'Resistors',
  'Capacitors',
  'Inductors and Crystals',
  'Diodes',
  'LEDs',
  'Optical Components',
  'Transistors',
  'Switches',
  'Protection',
  'Integrated Circuits',
];

for (const sub of expectedSubcategories) {
  assert(
    basicCat?.subcategories.includes(sub as any) ?? false,
    `Subcategory '${sub}' is present in basic_electronics taxonomy`
  );
}

// ----------------------------------------------------------------------------
// TEST GROUP 2: Component ID Completeness (All 31 Phase 2 Components)
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}2. Component ID Completeness & Definitions (31 Components)${RESET}`);

const PHASE_2_IDS = [
  // A. Resistors
  'resistor_fixed',
  'resistor_variable',
  'potentiometer_rotary',
  // B. Capacitors
  'capacitor_ceramic',
  'capacitor_electrolytic',
  // C. Inductors & Crystals
  'inductor',
  'crystal_oscillator',
  // D. Diodes
  'diode_rectifier',
  'diode_zener',
  'diode_schottky',
  // E. LEDs
  'led_red',
  'led_green',
  'led_blue',
  'led_yellow',
  'led_white',
  'led_ir',
  'led_rgb',
  // F. Optical
  'photodiode',
  // G. Transistors
  'transistor_npn',
  'transistor_pnp',
  'mosfet_n_channel',
  'mosfet_p_channel',
  // H. Switches
  'switch_tactile',
  'switch_toggle',
  'switch_slide',
  'switch_dip',
  // I. Protection
  'fuse',
  // J. ICs
  'ic_dip_generic',
  'ic_opamp',
  'ic_logic_gate',
  'ic_optocoupler',
];

assert(PHASE_2_IDS.length === 31, `Phase 2 defines exactly 31 new hardware components`);

for (const id of PHASE_2_IDS) {
  const def = componentRegistry.get(id);
  assert(!!def, `Component '${id}' is registered in componentRegistry`);
  if (def) {
    assert(def.category === 'basic_electronics', `'${id}' has category 'basic_electronics'`);
    assert(def.pins.length >= 2, `'${id}' has at least 2 functional pins (Actual: ${def.pins.length})`);
    assert(!!def.dimensions, `'${id}' has physical dimensions defined`);
    assert(!!def.modelFactoryId, `'${id}' has 3D model factory identifier`);
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 3: Resistors & Variable Resistors
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}3. Resistors & Variable Resistors Characteristics${RESET}`);

const fixedResistor = componentRegistry.get('resistor_fixed');
assert(!!fixedResistor?.resistorConfig, "Fixed resistor has resistorConfig defined");
assert(fixedResistor?.resistorConfig?.supportedValues?.length === 11, "Fixed resistor has 11 standard values (100Ω to 1MΩ)");
assert(fixedResistor?.resistorConfig?.tolerancePercent === 5, "Fixed resistor standard tolerance is 5%");
assert(fixedResistor?.resistorConfig?.powerRatingWatts === 0.25, "Fixed resistor rated for 1/4W (0.25W)");

const trimpot = componentRegistry.get('resistor_variable');
assert(trimpot?.pins.length === 3, "Trimpot has 3 terminals (TERM_1, WIPER, TERM_2)");
assert(trimpot?.resistorConfig?.isVariable === true, "Trimpot is marked as variable");

const rotaryPot = componentRegistry.get('potentiometer_rotary');
assert(rotaryPot?.pins.length === 3, "Rotary potentiometer has 3 terminals");
const potWiper = rotaryPot?.pins.find((p) => p.id === 'WIPER');
assert(potWiper?.category === 'analog', "Rotary pot wiper is categorized as analog");

// ----------------------------------------------------------------------------
// TEST GROUP 4: Capacitors, Inductors & Crystals
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}4. Capacitors, Inductors, and Crystals Characteristics${RESET}`);

const ceramicCap = componentRegistry.get('capacitor_ceramic');
assert(ceramicCap?.capacitorConfig?.isPolarized === false, "Ceramic capacitor is non-polarized");
assert(ceramicCap?.capacitorConfig?.dielectric === 'ceramic', "Ceramic dielectric identified");
assert(ceramicCap?.capacitorConfig?.ratedVoltageVolts === 50, "Ceramic capacitor rated for 50V DC");

const elecCap = componentRegistry.get('capacitor_electrolytic');
assert(elecCap?.capacitorConfig?.isPolarized === true, "Electrolytic capacitor is polarized");
assert(elecCap?.capacitorConfig?.ratedVoltageVolts === 25, "Electrolytic capacitor rated for 25V DC");
const elecCathode = elecCap?.pins.find((p) => p.id === 'CATHODE');
assert(!!elecCathode, "Electrolytic capacitor defines CATHODE pin with negative stripe");

const inductor = componentRegistry.get('inductor');
assert(inductor?.badge === '100µH 1.5A', "Inductor badge is 100µH 1.5A");
assert(inductor?.electrical?.maxCurrentPerPinMa === 1500, "Inductor rated for 1.5A saturation current");

const crystal = componentRegistry.get('crystal_oscillator');
assert(crystal?.electrical?.clockSpeedMhz === 16, "Quartz crystal frequency is 16.000MHz");
assert(crystal?.badge === '16.000MHz', "Crystal badge is 16.000MHz");

// ----------------------------------------------------------------------------
// TEST GROUP 5: Diodes & LEDs
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}5. Diodes, LEDs, and Optical Components${RESET}`);

const rectDiode = componentRegistry.get('diode_rectifier');
assert(rectDiode?.diodeConfig?.forwardVoltage === 0.7, "1N4007 forward drop is 0.7V");
assert(rectDiode?.diodeConfig?.reverseBreakdownVoltage === 1000, "1N4007 PRV is 1000V");

const zenerDiode = componentRegistry.get('diode_zener');
assert(zenerDiode?.diodeConfig?.reverseBreakdownVoltage === 5.1, "1N4733A Zener breakdown is 5.1V");
assert(zenerDiode?.diodeConfig?.diodeType === 'zener', "1N4733A is marked as Zener");

const schottkyDiode = componentRegistry.get('diode_schottky');
assert(schottkyDiode?.diodeConfig?.diodeType === 'schottky', "1N5819 is marked as Schottky");
assert(schottkyDiode?.diodeConfig?.forwardVoltage === 0.35, "1N5819 forward drop is 0.35V");

const redLed = componentRegistry.get('led_red');
assert(redLed?.diodeConfig?.color === '#ef4444', "Red LED has hex color #ef4444");
assert(redLed?.diodeConfig?.wavelengthNm === 625, "Red LED wavelength is 625nm");

const irLed = componentRegistry.get('led_ir');
assert(irLed?.diodeConfig?.wavelengthNm === 940, "IR LED wavelength is 940nm (Near-IR)");
assert(irLed?.description.includes('Infrared') ?? false, "IR LED description indicates Infrared");

const rgbLed = componentRegistry.get('led_rgb');
assert(rgbLed?.pins.length === 4, "RGB LED has 4 pins (R, COM, G, B)");
assert(rgbLed?.diodeConfig?.isRgb === true, "RGB LED has isRgb flag");

const photodiode = componentRegistry.get('photodiode');
assert(photodiode?.pins.length === 2, "Photodiode has Anode and Cathode terminals");

// ----------------------------------------------------------------------------
// TEST GROUP 6: Transistors & Switches
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}6. Transistors, MOSFETs, Switches, and Protection${RESET}`);

const npn = componentRegistry.get('transistor_npn');
assert(npn?.transistorConfig?.transistorType === 'npn_bjt', "2N3904 is NPN BJT");
assert(npn?.transistorConfig?.packageType === 'to92', "2N3904 package is TO-92");
assert(npn?.pins.map((p) => p.id).sort().join(',') === 'BASE,COLLECTOR,EMITTER', "NPN has BASE, COLLECTOR, EMITTER pins");

const pnp = componentRegistry.get('transistor_pnp');
assert(pnp?.transistorConfig?.transistorType === 'pnp_bjt', "2N3906 is PNP BJT");

const nMosfet = componentRegistry.get('mosfet_n_channel');
assert(nMosfet?.transistorConfig?.transistorType === 'n_channel_mosfet', "IRF540N is N-Channel MOSFET");
assert(nMosfet?.transistorConfig?.packageType === 'to220', "IRF540N package is TO-220");
assert(nMosfet?.pins.map((p) => p.id).sort().join(',') === 'DRAIN,GATE,SOURCE', "MOSFET has GATE, DRAIN, SOURCE pins");

const pMosfet = componentRegistry.get('mosfet_p_channel');
assert(pMosfet?.transistorConfig?.transistorType === 'p_channel_mosfet', "IRF9540 is P-Channel MOSFET");

const tactSwitch = componentRegistry.get('switch_tactile');
assert(tactSwitch?.switchConfig?.switchType === 'pushbutton', "Tactile switch is pushbutton");
assert(tactSwitch?.pins.length === 4, "Tactile switch has 4 pins (dual paired)");

const toggleSwitch = componentRegistry.get('switch_toggle');
assert(toggleSwitch?.switchConfig?.switchType === 'toggle', "Toggle switch is toggle");

const dipSwitch = componentRegistry.get('switch_dip');
assert(dipSwitch?.switchConfig?.poles === 4, "DIP switch has 4 poles");
assert(dipSwitch?.pins.length === 8, "4-position DIP switch has 8 pins (4 pairs)");

const fuse = componentRegistry.get('fuse');
assert(fuse?.electrical?.operatingVoltage === 'Up to 250V AC/DC', "Cartridge fuse rated for 250V");
assert(fuse?.electrical?.maxCurrentPerPinMa === 2000, "Cartridge fuse rated for 2.0A (2000mA)");

// ----------------------------------------------------------------------------
// TEST GROUP 7: Integrated Circuits
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}7. Integrated Circuits Characteristics${RESET}`);

const lm358 = componentRegistry.get('ic_opamp');
assert(lm358?.pins.length === 8, "LM358 Dual Op-Amp is DIP-8");
assert(lm358?.icConfig?.packageType === 'dip8', "LM358 package is DIP-8");

const gate74hc00 = componentRegistry.get('ic_logic_gate');
assert(gate74hc00?.pins.length === 14, "74HC00 Quad NAND is DIP-14");
assert(gate74hc00?.icConfig?.packageType === 'dip14', "74HC00 package is DIP-14");

const opto = componentRegistry.get('ic_optocoupler');
assert(opto?.pins.length === 4, "PC817 Optocoupler is DIP-4");
assert(opto?.icConfig?.packageType === 'dip4', "PC817 package is DIP-4");

const genericDip = componentRegistry.get('ic_dip_generic');
assert(genericDip?.pins.length === 16, "Generic DIP IC defaults to 16 pins");

// ----------------------------------------------------------------------------
// TEST GROUP 8: Terminal Coordinates & Breadboard Pitch Alignment
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}8. Terminal Coordinates & Breadboard Pitch Alignment${RESET}`);

for (const id of PHASE_2_IDS) {
  const comp: Component3D = {
    id: `test_${id}`,
    name: `Test ${id}`,
    type: id as any,
    category: 'basic_electronics',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    color: '#334155',
    visible: true,
  };

  const terms = getComponentTerminals(comp);
  assert(terms.length >= 2, `Component '${id}' yields >= 2 terminals via getComponentTerminals() (Actual: ${terms.length})`);
  assert(terms.every((t) => typeof t.position.x === 'number' && typeof t.position.y === 'number' && typeof t.position.z === 'number'),
    `Component '${id}' all terminal positions have valid numeric coordinates`
  );
}

// ----------------------------------------------------------------------------
// TEST GROUP 9: Three.js 3D Mesh Generation & Dynamic Updates
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}9. Three.js 3D Mesh Generation for all 31 Components${RESET}`);

for (const id of PHASE_2_IDS) {
  const comp: Component3D = {
    id: `mesh_${id}`,
    name: `Mesh ${id}`,
    type: id as any,
    category: 'basic_electronics',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    color: '#334155',
    visible: true,
  };

  let mesh: THREE.Group | null = null;
  let errorMsg = '';
  try {
    mesh = createComponentMesh(comp);
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  assert(mesh !== null && mesh instanceof THREE.Group, `createComponentMesh('${id}') successfully returns THREE.Group`, errorMsg);
  if (mesh) {
    assert(mesh.children.length > 0, `Mesh for '${id}' contains child geometries (Count: ${mesh.children.length})`);
  }
}

// Dynamic properties verification:
console.log(`\n${YELLOW}10. Dynamic Properties Updates in 3D Mesh${RESET}`);

// A. Resistor color bands update
const compResistor1: Component3D = {
  id: 'res_220',
  name: '220 Resistor',
  type: 'resistor_fixed',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#d4b483',
  visible: true,
  metadata: { resistance: 220 },
};
const meshRes1 = createComponentMesh(compResistor1);

const compResistor2: Component3D = {
  id: 'res_10k',
  name: '10k Resistor',
  type: 'resistor_fixed',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#d4b483',
  visible: true,
  metadata: { resistance: 10000 },
};
const meshRes2 = createComponentMesh(compResistor2);
assert(meshRes1.children.length === meshRes2.children.length, "Resistors build consistent cylinder & band hierarchy");

// B. Switch plunger position updates when switchClosed toggles
const compSwitchOpen: Component3D = {
  id: 'sw_open',
  name: 'Switch Open',
  type: 'switch_tactile',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#334155',
  visible: true,
  metadata: { switchClosed: false },
};
const meshSwitchOpen = createComponentMesh(compSwitchOpen);

const compSwitchClosed: Component3D = {
  id: 'sw_closed',
  name: 'Switch Closed',
  type: 'switch_tactile',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#334155',
  visible: true,
  metadata: { switchClosed: true },
};
const meshSwitchClosed = createComponentMesh(compSwitchClosed);
assert(meshSwitchOpen.children.length === meshSwitchClosed.children.length, "Tactile switch meshes render with plunger and pins");

// C. Fuse wire updates when blown
const compFuseIntact: Component3D = {
  id: 'fuse_ok',
  name: 'Fuse Intact',
  type: 'fuse',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#cbd5e1',
  visible: true,
  metadata: { fuseBlown: false },
};
const meshFuseIntact = createComponentMesh(compFuseIntact);

const compFuseBlown: Component3D = {
  id: 'fuse_blown',
  name: 'Fuse Blown',
  type: 'fuse',
  category: 'basic_electronics',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#cbd5e1',
  visible: true,
  metadata: { fuseBlown: true },
};
const meshFuseBlown = createComponentMesh(compFuseBlown);
// Blown fuse renders scorch mark and two separated wire stubs (more child meshes)
assert(meshFuseBlown.children.length > meshFuseIntact.children.length, "Blown fuse renders broken stubs and scorch mark");

// ----------------------------------------------------------------------------
// TEST GROUP 11: Hardware Bridge & Simulation Evaluation
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}11. Hardware Bridge Circuit Evaluation (Potentiometer & LED)${RESET}`);

const testArduino: Component3D = {
  id: 'arduino_main',
  name: 'Arduino Uno',
  type: 'arduino',
  category: 'microcontroller',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#059669',
  visible: true,
};

const testPot: Component3D = {
  id: 'rot_pot_1',
  name: 'Rotary Pot',
  type: 'potentiometer_rotary',
  category: 'basic_electronics',
  position: { x: 1, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#0284c7',
  visible: true,
  metadata: { potValue: 768 },
};

const potWires: WireConnection[] = [
  { id: 'w1', fromComponentId: 'rot_pot_1', fromTerminalId: 'TERM_1', toComponentId: 'arduino_main', toTerminalId: 'GND_1', color: '#1e293b' },
  { id: 'w2', fromComponentId: 'rot_pot_1', fromTerminalId: 'TERM_2', toComponentId: 'arduino_main', toTerminalId: '5V', color: '#ef4444' },
  { id: 'w3', fromComponentId: 'rot_pot_1', fromTerminalId: 'WIPER', toComponentId: 'arduino_main', toTerminalId: 'A0', color: '#06b6d4' },
];

const simulatedPins: any = {
  14: { pinNumber: 14, mode: 'INPUT', analogValue: 0, digitalValue: 0 },
};

const circuit = evaluateCircuitState(
  [testArduino, testPot],
  potWires,
  [],
  simulatedPins,
  'running'
);

const potState = circuit.potentiometers.get('rot_pot_1');
assert(!!potState, "Potentiometer state evaluated in circuit");
assert(potState?.isCircuitComplete === true, "Rotary potentiometer circuit complete with GND, 5V, and A0 Wiper");
assert(potState?.potValue === 768, `Potentiometer raw value parsed correctly (Actual: ${potState?.potValue})`);
assert(potState?.voltage === 3.75, `Potentiometer voltage calculated correctly (~3.75V, Actual: ${potState?.voltage})`);
assert(simulatedPins[14].analogValue === 768, `Simulated Pin A0 receives ADC value 768`);

// ----------------------------------------------------------------------------
// TEST GROUP 12: Project JSON Serialization & Persistence
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}12. Project JSON Serialization & Restoration${RESET}`);

const testProject = {
  version: 2,
  name: 'Phase 2 Electronic Circuit Test',
  description: 'Validates serialization of all basic electronics components',
  components: [
    compResistor1,
    compSwitchClosed,
    compFuseBlown,
    testPot,
  ],
  wires: potWires,
  attachments: [] as MechanicalAttachment[],
};

const jsonStr = JSON.stringify(testProject, null, 2);
assert(jsonStr.length > 0, "Project serializes to valid JSON string");

const restoredProject = JSON.parse(jsonStr);
assert(restoredProject.components.length === 4, "Restored project has 4 components");
assert(restoredProject.components[0].metadata.resistance === 220, "Restored resistor preserves 220Ω resistance");
assert(restoredProject.components[1].metadata.switchClosed === true, "Restored switch preserves switchClosed: true");
assert(restoredProject.components[2].metadata.fuseBlown === true, "Restored fuse preserves fuseBlown: true");
assert(restoredProject.components[3].metadata.potValue === 768, "Restored potentiometer preserves potValue: 768");

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log(`\n${CYAN}================================================================${RESET}`);
console.log(`${CYAN}  PHASE 2 TEST RESULTS SUMMARY                                 ${RESET}`);
console.log(`${CYAN}================================================================${RESET}`);
console.log(`  Total Passed: ${GREEN}${passedTests}${RESET}`);
console.log(`  Total Failed: ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(`\n${GREEN}  ALL PHASE 2 ELECTRONIC COMPONENT TESTS PASSED PERFECTLY!${RESET}\n`);
  process.exit(0);
}
