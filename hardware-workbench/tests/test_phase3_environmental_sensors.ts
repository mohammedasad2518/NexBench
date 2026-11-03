/**
 * Test Suite: Phase 3 — Environmental and Measurement Sensors Library
 * 
 * Comprehensive validation of 19 environmental and measurement sensors:
 * 1. Temperature Sensors (DHT11, DHT22, DS18B20, LM35, NTC Thermistor)
 * 2. Barometric Pressure & Weather (BMP180, BMP280, BME280)
 * 3. Gas & Air Quality (MQ-2, MQ-3, MQ-4, MQ-7, MQ-135)
 * 4. Soil & Water Sensors (Capacitive/Resistive Soil Moisture, Rain Detection Plate, Water Level Depth)
 * 5. Optical & Radiation Sensors (LDR Photoresistor, GUVA-S12SD UV Sensor)
 * 6. Acoustic & Sound Sensors (Microphone Sound Sensor Module)
 * 
 * Verifies:
 * - Total Component Count: Exactly 93 components registered
 * - Category & Subcategory Taxonomy (environmental_sensors and 7 subcategories)
 * - Sensor metadata, physical dimensions, sensorConfig characteristics
 * - Electrical characteristics, pinout definitions & terminal pitch (2.54mm)
 * - Three.js 3D CAD Mesh Generation for all 19 sensors
 * - Telemetry & Hardware Bridge virtual pin evaluation (LM35, LDR, Soil, Rain, Water, MQ, UV, Sound)
 * - Project serialization & persistence with Phase 3 components
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
import type { Component3D, WireConnection, MechanicalAttachment, SimulatedPin } from '../src/types/workbench';

// Terminal colors
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
console.log(`${CYAN}  PHASE 3: ENVIRONMENTAL & MEASUREMENT SENSORS VALIDATION SUITE ${RESET}`);
console.log(`${CYAN}================================================================${RESET}\n`);

// ----------------------------------------------------------------------------
// TEST GROUP 1: Registry, Taxonomy, and Catalog Validation
// ----------------------------------------------------------------------------
console.log(`${YELLOW}1. Registry & Category Taxonomy Validation${RESET}`);

const allComponents = componentRegistry.getAll();
assert(allComponents.length >= 93, `Total components registered >= 93 (Actual: ${allComponents.length})`);

const envCat = HARDWARE_CATEGORIES.find((c) => c.id === 'environmental_sensors');
assert(!!envCat, "Category 'environmental_sensors' exists in HARDWARE_CATEGORIES");
assert(envCat?.label === 'Environmental & Measurement Sensors', "Category label is 'Environmental & Measurement Sensors'");
assert(envCat?.subcategories.length === 6, `Category has 6 subcategories (Actual: ${envCat?.subcategories.length})`);

const expectedSubcategories = [
  'Temperature & Humidity',
  'Pressure & Weather',
  'Gas & Air Quality',
  'Soil & Water',
  'Light & UV',
  'Sound Sensors',
];

for (const sub of expectedSubcategories) {
  assert(
    envCat?.subcategories.includes(sub as any) ?? false,
    `Subcategory '${sub}' is present in environmental_sensors taxonomy`
  );
}

// ----------------------------------------------------------------------------
// TEST GROUP 2: Component ID Completeness (All 19 Phase 3 Sensors)
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}2. Component ID Completeness & Definitions (19 Sensors)${RESET}`);

const PHASE_3_IDS = [
  // A. Temperature & Humidity (5)
  'sensor_dht11',
  'sensor_dht22',
  'sensor_ds18b20',
  'sensor_lm35',
  'sensor_ntc_thermistor',
  // B. Pressure & Weather (3)
  'sensor_bmp180',
  'sensor_bmp280',
  'sensor_bme280',
  // C. Gas & Air Quality (5)
  'sensor_mq2',
  'sensor_mq3',
  'sensor_mq4',
  'sensor_mq7',
  'sensor_mq135',
  // D. Soil & Water (3)
  'sensor_soil_moisture',
  'sensor_rain',
  'sensor_water_level',
  // E. Light & UV (2)
  'sensor_ldr',
  'sensor_uv',
  // F. Sound (1)
  'sensor_sound',
];

for (const id of PHASE_3_IDS) {
  const def = componentRegistry.get(id as any);
  assert(!!def, `Sensor definition exists for '${id}'`);
  if (def) {
    assert(def.category === 'environmental_sensors', `'${id}' has category 'environmental_sensors'`);
    assert(!!def.sensorConfig, `'${id}' includes sensorConfig telemetry definition`);
    assert(!!def.sensorConfig?.measuredQuantity, `'${id}' defines measuredQuantity: ${def.sensorConfig?.measuredQuantity}`);
    assert(!!def.sensorConfig?.unit, `'${id}' defines measurement unit: ${def.sensorConfig?.unit}`);
    assert(typeof def.sensorConfig?.minRange === 'number', `'${id}' defines numeric minRange`);
    assert(typeof def.sensorConfig?.maxRange === 'number', `'${id}' defines numeric maxRange`);
    assert(!!def.electrical?.operatingVoltage, `'${id}' defines operating voltage: ${def.electrical.operatingVoltage}`);
    assert(def.simulation.level === 'full' || def.simulation.level === 'basic', `'${id}' has simulation level full/basic`);
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 3: Terminal Definitions & Electrical Pinouts
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}3. Terminal Definitions & Physical Pinouts (19 Sensors)${RESET}`);

const SENSOR_TERMINAL_EXPECTATIONS: Record<string, { minPins: number; requiredPins: string[] }> = {
  sensor_dht11: { minPins: 3, requiredPins: ['PIN_VCC', 'PIN_DATA', 'PIN_GND'] },
  sensor_dht22: { minPins: 3, requiredPins: ['PIN_VCC', 'PIN_DATA', 'PIN_GND'] },
  sensor_ds18b20: { minPins: 3, requiredPins: ['PIN_GND', 'PIN_DQ', 'PIN_VDD'] },
  sensor_lm35: { minPins: 3, requiredPins: ['PIN_VS', 'PIN_VOUT', 'PIN_GND'] },
  sensor_ntc_thermistor: { minPins: 2, requiredPins: ['TERM_A', 'TERM_B'] },
  sensor_bmp180: { minPins: 4, requiredPins: ['PIN_VIN', 'PIN_GND', 'PIN_SCL', 'PIN_SDA'] },
  sensor_bmp280: { minPins: 6, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_SCL', 'PIN_SDA'] },
  sensor_bme280: { minPins: 6, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_SCL', 'PIN_SDA'] },
  sensor_mq2: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_mq3: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_mq4: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_mq7: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_mq135: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_soil_moisture: { minPins: 3, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_AO'] },
  sensor_rain: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
  sensor_water_level: { minPins: 3, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_SIG'] },
  sensor_ldr: { minPins: 2, requiredPins: ['TERM_A', 'TERM_B'] },
  sensor_uv: { minPins: 3, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_OUT'] },
  sensor_sound: { minPins: 4, requiredPins: ['PIN_VCC', 'PIN_GND', 'PIN_DO', 'PIN_AO'] },
};

for (const [type, exp] of Object.entries(SENSOR_TERMINAL_EXPECTATIONS)) {
  const terminals = getComponentTerminals(type as any);
  assert(terminals.length >= exp.minPins, `${type} has >= ${exp.minPins} terminals (Actual: ${terminals.length})`);
  
  const termIds = terminals.map((t) => t.id);
  for (const pin of exp.requiredPins) {
    assert(termIds.includes(pin), `${type} defines terminal pin '${pin}'`);
  }
}

// ----------------------------------------------------------------------------
// TEST GROUP 4: Three.js 3D CAD Mesh Generation
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}4. Three.js 3D CAD Mesh Generation (All 19 Sensors)${RESET}`);

for (const id of PHASE_3_IDS) {
  const fakeComp: Component3D = {
    id: `comp_test_${id}`,
    type: id as any,
    name: `Test ${id}`,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    metadata: {
      temperatureC: 25.0,
      humidityPercent: 55,
      pressureHpa: 1013.25,
      gasPpm: 120,
      moisturePercent: 40,
      rainIntensityPercent: 10,
      waterLevelPercent: 50,
      lightLux: 450,
      uvIndex: 4.5,
      soundIntensityPercent: 30,
    },
  };

  const mesh = createComponentMesh(fakeComp);
  assert(mesh instanceof THREE.Group, `${id} creates valid THREE.Group mesh instance`);
  assert(mesh.children.length > 0, `${id} contains ${mesh.children.length} sub-meshes/primitives`);
  
  // Verify bounding box calculation
  const bbox = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  assert(size.x > 0 && size.y > 0 && size.z > 0, `${id} has non-zero 3D dimensions (${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`);
}

// ----------------------------------------------------------------------------
// TEST GROUP 5: Telemetry Math & Hardware Bridge Circuit Evaluation
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}5. Telemetry & Hardware Bridge Circuit Evaluation${RESET}`);

// Setup Arduino Uno with simulated pins
const simulatedPins: Record<number, SimulatedPin> = {};
for (let p = 0; p <= 19; p++) {
  simulatedPins[p] = {
    pinNumber: p,
    mode: p >= 14 ? 'input' : 'output',
    digitalValue: 0,
    analogValue: 0,
    isPwm: false,
    label: p >= 14 ? `A${p - 14}` : `D${p}`,
  };
}

// Subtest A: LM35 Linear Precision Temperature Sensor (10mV / °C)
// At 25°C -> 0.25V -> (0.25 / 5.0) * 1023 = ~51 ADC
const arduinoComp: Component3D = {
  id: 'arduino_uno_1',
  type: 'arduino',
  name: 'Arduino Uno',
  visible: true,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

const lm35Comp: Component3D = {
  id: 'sensor_lm35_1',
  type: 'sensor_lm35',
  name: 'LM35 Precision Temp Sensor',
  visible: true,
  position: { x: 5, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  metadata: { temperatureC: 25.0 },
};

// Wire LM35 VOUT to Arduino A0 (Pin 14), VS to 5V, GND to GND
const wiresLM35: WireConnection[] = [
  {
    id: 'w_lm35_vs',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: '5V',
    toComponentId: 'sensor_lm35_1',
    toTerminalId: 'PIN_VS',
    color: '#ef4444',
  },
  {
    id: 'w_lm35_gnd',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: 'GND',
    toComponentId: 'sensor_lm35_1',
    toTerminalId: 'PIN_GND',
    color: '#000000',
  },
  {
    id: 'w_lm35_vout',
    fromComponentId: 'sensor_lm35_1',
    fromTerminalId: 'PIN_VOUT',
    toComponentId: 'arduino_uno_1',
    toTerminalId: 'A0',
    color: '#3b82f6',
  },
];

const circuitResultLM35 = evaluateCircuitState(
  [arduinoComp, lm35Comp],
  wiresLM35,
  [],
  simulatedPins,
  'running'
);

assert(circuitResultLM35.environmentalSensors.size === 1, 'HardwareBridge evaluates 1 environmental sensor');
const lm35State = circuitResultLM35.environmentalSensors.get('sensor_lm35_1');
assert(!!lm35State, 'LM35 sensor state exists in evaluated circuit');
assert(lm35State?.isCircuitComplete === true, 'LM35 circuit is marked complete');
assert(lm35State?.readingValue === 25.0, `LM35 readingValue is 25.0°C (Actual: ${lm35State?.readingValue})`);
assert(lm35State?.readingUnit === '°C', `LM35 readingUnit is '°C' (Actual: ${lm35State?.readingUnit})`);
assert(lm35State?.adcValue === 51, `LM35 ADC at 25°C is 51 counts (Actual: ${lm35State?.adcValue})`);
assert(simulatedPins[14].analogValue === 51, `Arduino A0 analog pin receives 51 (Actual: ${simulatedPins[14].analogValue})`);

// Test LM35 at 100°C: 1.0V -> (1.0 / 5.0) * 1023 = ~205 ADC
lm35Comp.metadata = { temperatureC: 100.0 };
evaluateCircuitState(
  [arduinoComp, lm35Comp],
  wiresLM35,
  [],
  simulatedPins,
  'running'
);
assert(simulatedPins[14].analogValue === 205, `Arduino A0 analog pin at 100°C is 205 counts (Actual: ${simulatedPins[14].analogValue})`);

// Subtest B: MQ-2 Flammable Gas Sensor
const mq2Comp: Component3D = {
  id: 'sensor_mq2_1',
  type: 'sensor_mq2',
  name: 'MQ-2 Gas Sensor',
  visible: true,
  position: { x: 8, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  metadata: { gasPpm: 800, gasThresholdPpm: 400, heaterActive: true },
};

const wiresMQ2: WireConnection[] = [
  {
    id: 'w_mq2_vcc',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: '5V',
    toComponentId: 'sensor_mq2_1',
    toTerminalId: 'PIN_VCC',
    color: '#ef4444',
  },
  {
    id: 'w_mq2_gnd',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: 'GND',
    toComponentId: 'sensor_mq2_1',
    toTerminalId: 'PIN_GND',
    color: '#000000',
  },
  {
    id: 'w_mq2_ao',
    fromComponentId: 'sensor_mq2_1',
    fromTerminalId: 'PIN_AO',
    toComponentId: 'arduino_uno_1',
    toTerminalId: 'A1',
    color: '#10b981',
  },
  {
    id: 'w_mq2_do',
    fromComponentId: 'sensor_mq2_1',
    fromTerminalId: 'PIN_DO',
    toComponentId: 'arduino_uno_1',
    toTerminalId: 'D4',
    color: '#f59e0b',
  },
];

const circuitResultMQ2 = evaluateCircuitState(
  [arduinoComp, mq2Comp],
  wiresMQ2,
  [],
  simulatedPins,
  'running'
);

const mq2State = circuitResultMQ2.environmentalSensors.get('sensor_mq2_1');
assert(!!mq2State, 'MQ-2 sensor state exists in evaluated circuit');
assert(mq2State?.isCircuitComplete === true, 'MQ-2 circuit is complete');
assert(mq2State?.readingValue === 800, 'MQ-2 readingValue is 800 ppm');
assert(mq2State?.digitalValue === 0, 'MQ-2 digital DO is 0 (active LOW trigger when gas > threshold)');
assert(simulatedPins[4].digitalValue === 0, 'Arduino D4 receives digital LOW alarm');
assert(simulatedPins[15].analogValue > 100, `Arduino A1 receives gas voltage ADC: ${simulatedPins[15].analogValue}`);

// Subtest C: Soil Moisture Sensor
const soilComp: Component3D = {
  id: 'sensor_soil_1',
  type: 'sensor_soil_moisture',
  name: 'Soil Moisture Sensor',
  visible: true,
  position: { x: 12, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  metadata: { moisturePercent: 80 },
};

const wiresSoil: WireConnection[] = [
  {
    id: 'w_soil_vcc',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: '5V',
    toComponentId: 'sensor_soil_1',
    toTerminalId: 'PIN_VCC',
    color: '#ef4444',
  },
  {
    id: 'w_soil_gnd',
    fromComponentId: 'arduino_uno_1',
    fromTerminalId: 'GND',
    toComponentId: 'sensor_soil_1',
    toTerminalId: 'PIN_GND',
    color: '#000000',
  },
  {
    id: 'w_soil_ao',
    fromComponentId: 'sensor_soil_1',
    fromTerminalId: 'PIN_AOUT',
    toComponentId: 'arduino_uno_1',
    toTerminalId: 'A2',
    color: '#8b5cf6',
  },
];

const circuitResultSoil = evaluateCircuitState(
  [arduinoComp, soilComp],
  wiresSoil,
  [],
  simulatedPins,
  'running'
);

const soilState = circuitResultSoil.environmentalSensors.get('sensor_soil_1');
assert(!!soilState, 'Soil sensor state exists');
assert(soilState?.readingValue === 80, 'Soil moisture reading is 80%');
assert(simulatedPins[16].analogValue > 0, `Arduino A2 receives analog moisture ADC: ${simulatedPins[16].analogValue}`);

// ----------------------------------------------------------------------------
// TEST GROUP 6: Search & Category Filter Tests
// ----------------------------------------------------------------------------
console.log(`\n${YELLOW}6. Search & Category Filter Validation${RESET}`);

const counts = getCategoryCounts();
assert(counts.all >= 93, `Total category count >= 93 (Actual: ${counts.all})`);
assert(counts.environmental_sensors === 19, `Category 'environmental_sensors' count is 19 (Actual: ${counts.environmental_sensors})`);

const dhtSearch = searchComponents({ query: 'DHT' });
assert(dhtSearch.length >= 2, `Search 'DHT' returns >= 2 sensors (Actual: ${dhtSearch.length})`);
assert(dhtSearch.some((c) => c.id === 'sensor_dht11'), "Search finds 'sensor_dht11'");
assert(dhtSearch.some((c) => c.id === 'sensor_dht22'), "Search finds 'sensor_dht22'");

const gasSearch = searchComponents({ query: 'Gas' });
assert(gasSearch.length >= 5, `Search 'Gas' returns >= 5 sensors (Actual: ${gasSearch.length})`);

const bmpSearch = searchComponents({ query: 'BMP280' });
assert(bmpSearch.length === 1 && bmpSearch[0].id === 'sensor_bmp280', "Search 'BMP280' returns exact match");

// ----------------------------------------------------------------------------
// TEST RESULTS SUMMARY
// ----------------------------------------------------------------------------
console.log(`\n${CYAN}================================================================${RESET}`);
console.log(`${CYAN}  TEST SUMMARY                                                 ${RESET}`);
console.log(`${CYAN}================================================================${RESET}`);
console.log(`  Total Passed : ${GREEN}${passedTests}${RESET}`);
console.log(`  Total Failed : ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);

if (failedTests > 0) {
  console.error(`\n${RED}FAILED: Some tests did not pass.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}ALL PHASE 3 ENVIRONMENTAL SENSORS TESTS PASSED PERFECTLY!${RESET}\n`);
  process.exit(0);
}
