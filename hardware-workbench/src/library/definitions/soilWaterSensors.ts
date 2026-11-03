import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 3 Environmental & Measurement Sensors: Soil & Water Sensors
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Soil Moisture Sensor (Fork Probe + LM393 Comparator Module)
// ----------------------------------------------------------------------------
export const SOIL_MOISTURE_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (3.3V - 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.35, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Power supply voltage pin (3.3V to 5.0V DC)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.05, y: -0.35, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
  {
    id: 'PIN_DO',
    name: '3: DO (Digital Output)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0.05, y: -0.35, z: 0 },
    voltage: '0V / 5V',
    description: 'Digital dry/wet alarm trigger output (LOW when soil moisture exceeds threshold)',
  },
  {
    id: 'PIN_AO',
    name: '4: AO (Analog Output)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0.15, y: -0.35, z: 0 },
    voltage: '0V - 5.0V',
    description: 'Analog voltage output inversely proportional to soil conductivity/moisture',
  },
];

export const SENSOR_SOIL_MOISTURE_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_soil_moisture',
  type: 'sensor_soil_moisture',
  name: 'Soil Moisture Sensor (Fork Probe + LM393)',
  category: 'environmental_sensors',
  subcategory: 'Soil & Water',
  description: 'Dual-prong immersion soil moisture hygrometer module with onboard LM393 comparator. Measures volumetric water content of soil through electrical conductivity changes.',
  manufacturer: 'Waveshare / Generic',
  boardFamily: 'Soil & Water',
  modelFactoryId: 'sensor_soil_moisture',
  dimensions: { widthMm: 20.0, heightMm: 60.0, depthMm: 8.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7', // Blue carrier board with golden nickel tines
  pins: SOIL_MOISTURE_PINS,
  sensorConfig: {
    sensorFamily: 'soil_water',
    measuredQuantity: 'Soil Volumetric Moisture',
    unit: '%',
    minRange: 0,
    maxRange: 100,
    accuracy: '±5%',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 15,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Soil Moisture Percentage Slider (0-100%)', 'Dry / Wet ADC Calibration Points', 'Comparator Digital Switch Threshold'],
    notes: 'Default moisture: 35% (normal soil). In water: 100% (~200 ADC), In dry air: 0% (~1020 ADC).',
    astSupported: true,
  },
  badge: '0-100% Moisture AO/DO',
  iconName: 'Droplet',
  tags: ['soil', 'moisture', 'hygrometer', 'irrigation', 'plants', 'agriculture', 'analog'],
};

// ----------------------------------------------------------------------------
// 2. Raindrop Detection Sensor Module (Plate + LM393)
// ----------------------------------------------------------------------------
export const RAIN_SENSOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (3.3V - 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.3, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Module power supply (3.3V to 5V DC)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.05, y: -0.3, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
  {
    id: 'PIN_DO',
    name: '3: DO (Digital Rain Trigger)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0.05, y: -0.3, z: 0 },
    voltage: '0V / 5V',
    description: 'Digital rain threshold switch output (LOW when raindrops detected on plate)',
  },
  {
    id: 'PIN_AO',
    name: '4: AO (Analog Rain Level)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0.15, y: -0.3, z: 0 },
    voltage: '0V - 5.0V',
    description: 'Analog output voltage reflecting raindrop surface coverage',
  },
];

export const SENSOR_RAIN_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_rain',
  type: 'sensor_rain',
  name: 'Raindrops Detection Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Soil & Water',
  description: 'Weather rain sensor featuring an external nickel-plated serpentine detection grid and LM393 processing module. Outputs both analog rain intensity and digital rain alert signal.',
  manufacturer: 'Waveshare / Generic',
  boardFamily: 'Soil & Water',
  modelFactoryId: 'sensor_rain',
  dimensions: { widthMm: 50.0, heightMm: 40.0, depthMm: 6.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0369a1', // Serpentine detection board with blue LM393 module
  pins: RAIN_SENSOR_PINS,
  sensorConfig: {
    sensorFamily: 'soil_water',
    measuredQuantity: 'Rain Intensity / Surface Droplets',
    unit: '%',
    minRange: 0,
    maxRange: 100,
    accuracy: '±5%',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 15,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Rain Intensity Slider (0-100%)', 'Serpentine Track Resistance Simulation', 'Rain Trigger Digital Alarm Output'],
    notes: 'Default: 0% (dry plate). Increasing droplets reduces trace resistance and drops AO voltage.',
    astSupported: true,
  },
  badge: 'Rain Detection 0-100%',
  iconName: 'CloudDrizzle',
  tags: ['rain', 'weather', 'raindrops', 'precipitation', 'water', 'analog', 'digital'],
};

// ----------------------------------------------------------------------------
// 3. Water Level / Depth Sensor (Submersible PCB Trace)
// ----------------------------------------------------------------------------
export const WATER_LEVEL_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_SIG',
    name: '1: SIG / S (Analog Output)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: -0.1, y: -0.35, z: 0 },
    voltage: '0V - 4.2V',
    description: 'Analog signal output proportional to liquid immersion depth (0V dry to ~4.2V fully submerged)',
  },
  {
    id: 'PIN_VCC',
    name: '2: + / VCC (3.3V - 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: 0, y: -0.35, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Power supply voltage pin',
  },
  {
    id: 'PIN_GND',
    name: '3: - / GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0.1, y: -0.35, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
];

export const SENSOR_WATER_LEVEL_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_water_level',
  type: 'sensor_water_level',
  name: 'Analog Water Level / Depth Sensor',
  category: 'environmental_sensors',
  subcategory: 'Soil & Water',
  description: 'Submersible water level detection sensor with exposed parallel copper conductors. The conductive area submerged in liquid determines the analog output voltage (depth range 0 to 40mm).',
  manufacturer: 'Funduino / Generic',
  boardFamily: 'Soil & Water',
  modelFactoryId: 'sensor_water_level',
  dimensions: { widthMm: 20.0, heightMm: 62.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#ef4444', // Characteristic red PCB with vertical immersion comb
  pins: WATER_LEVEL_PINS,
  sensorConfig: {
    sensorFamily: 'soil_water',
    measuredQuantity: 'Water Depth / Immersion Level',
    unit: '% (0-40mm)',
    minRange: 0,
    maxRange: 100,
    accuracy: '±2mm',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 20,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Water Immersion Level (0 - 100%)', 'Direct Analog Voltage Output (0V - 4.2V)', 'Liquid Tank Fill Height Simulation'],
    notes: 'Default level: 0% (empty/dry). Output voltage scales linearly with water contact depth.',
    astSupported: true,
  },
  badge: '0-40mm Water Depth',
  iconName: 'Waves',
  tags: ['water', 'level', 'depth', 'tank', 'liquid', 'submersible', 'analog', 'reservoir'],
};

export const SOIL_WATER_SENSOR_DEFINITIONS = [
  SENSOR_SOIL_MOISTURE_DEFINITION,
  SENSOR_RAIN_DEFINITION,
  SENSOR_WATER_LEVEL_DEFINITION,
];
