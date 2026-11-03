import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 3 Environmental & Measurement Sensors: Gas & Air Quality (MQ Series)
// ============================================================================

export const MQ_MODULE_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (+5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.32, z: 0 },
    voltage: '5.0V',
    description: 'Heater and comparator power supply (+5V DC required for internal heater)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.05, y: -0.32, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
  {
    id: 'PIN_DO',
    name: '3: DO (Digital Output)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0.05, y: -0.32, z: 0 },
    voltage: '0V / 5V',
    description: 'Digital alarm output from onboard LM393 comparator (Active LOW when gas exceeds trimpot threshold)',
  },
  {
    id: 'PIN_AO',
    name: '4: AO (Analog Output)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0.15, y: -0.32, z: 0 },
    voltage: '0V - 5.0V',
    description: 'Analog voltage output proportional to detected gas concentration (0.1V - 4.5V)',
  },
];

// ----------------------------------------------------------------------------
// 1. MQ-2 Flammable Gas & Smoke Sensor
// ----------------------------------------------------------------------------
export const SENSOR_MQ2_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_mq2',
  type: 'sensor_mq2',
  name: 'MQ-2 Flammable Gas & Smoke Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Gas & Air Quality',
  description: 'Wide-spectrum gas sensor for combustible gas and smoke detection (LPG, propane, methane, hydrogen, alcohol, smoke). Features internal SnO2 element with stainless steel flame arrestor mesh.',
  manufacturer: 'Winsen Electronics / Hanwei',
  boardFamily: 'MQ Gas Series',
  modelFactoryId: 'sensor_mq2',
  dimensions: { widthMm: 32.0, heightMm: 22.0, depthMm: 20.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7', // Blue carrier PCB with silver mesh
  pins: MQ_MODULE_PINS,
  sensorConfig: {
    sensorFamily: 'gas',
    measuredQuantity: 'LPG, Propane, Smoke, Methane',
    unit: 'PPM',
    minRange: 300,
    maxRange: 10000,
    accuracy: '±15%',
    responseProtocol: 'analog',
    hasHeater: true,
  },
  electrical: {
    operatingVoltage: '5.0V DC (Heater 5V)',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 160, // ~800mW heater consumption
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Analog AO Output Proportional to Gas PPM', 'Digital DO Threshold Alarm (LM393)', 'Internal Heater Warmup Simulation'],
    notes: 'Default concentration: 400 PPM (ambient air). High sensitivity to LPG and butane.',
    astSupported: true,
  },
  badge: 'LPG / Smoke 300-10000ppm',
  iconName: 'Flame',
  tags: ['mq2', 'gas', 'smoke', 'lpg', 'propane', 'methane', 'combustible', 'analog'],
};

// ----------------------------------------------------------------------------
// 2. MQ-3 Alcohol Vapor Gas Sensor
// ----------------------------------------------------------------------------
export const SENSOR_MQ3_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_mq3',
  type: 'sensor_mq3',
  name: 'MQ-3 Alcohol Gas Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Gas & Air Quality',
  description: 'High-sensitivity alcohol sensor module designed for breathalyzer and ethanol vapor detection. High resistance to gasoline, smoke, and vapor noise.',
  manufacturer: 'Winsen Electronics / Hanwei',
  boardFamily: 'MQ Gas Series',
  modelFactoryId: 'sensor_mq3',
  dimensions: { widthMm: 32.0, heightMm: 22.0, depthMm: 20.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7',
  pins: MQ_MODULE_PINS,
  sensorConfig: {
    sensorFamily: 'gas',
    measuredQuantity: 'Ethanol / Alcohol Vapor',
    unit: 'mg/L / PPM',
    minRange: 0.05,
    maxRange: 10.0,
    accuracy: '±10%',
    responseProtocol: 'analog',
    hasHeater: true,
  },
  electrical: {
    operatingVoltage: '5.0V DC',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 150,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Breathalyzer BAC / mg/L Telemetry', 'Linearized Log-Scale Resistance Ratio', 'Comparator DO Threshold'],
    notes: 'Default concentration: 0.0 mg/L (clean). Interactive breath alcohol slider.',
    astSupported: true,
  },
  badge: 'Alcohol 0.05-10 mg/L',
  iconName: 'Wine',
  tags: ['mq3', 'alcohol', 'ethanol', 'breathalyzer', 'gas', 'sensor', 'analog'],
};

// ----------------------------------------------------------------------------
// 3. MQ-4 Natural Gas / Methane Sensor
// ----------------------------------------------------------------------------
export const SENSOR_MQ4_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_mq4',
  type: 'sensor_mq4',
  name: 'MQ-4 Methane & Natural Gas Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Gas & Air Quality',
  description: 'Specialized sensor for Compressed Natural Gas (CNG) and Methane (CH4) leak detection in industrial and domestic safety systems.',
  manufacturer: 'Winsen Electronics / Hanwei',
  boardFamily: 'MQ Gas Series',
  modelFactoryId: 'sensor_mq4',
  dimensions: { widthMm: 32.0, heightMm: 22.0, depthMm: 20.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7',
  pins: MQ_MODULE_PINS,
  sensorConfig: {
    sensorFamily: 'gas',
    measuredQuantity: 'Methane (CH4), CNG',
    unit: 'PPM',
    minRange: 200,
    maxRange: 10000,
    accuracy: '±15%',
    responseProtocol: 'analog',
    hasHeater: true,
  },
  electrical: {
    operatingVoltage: '5.0V DC',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 160,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Methane Leak Detection', 'AO Voltage Curve', 'DO Leakage Alarm Trigger'],
    notes: 'Default concentration: 250 PPM. High sensitivity to methane with low alcohol cross-sensitivity.',
    astSupported: true,
  },
  badge: 'Methane CH4 200-10000ppm',
  iconName: 'Flame',
  tags: ['mq4', 'methane', 'cng', 'natural gas', 'ch4', 'safety', 'leak'],
};

// ----------------------------------------------------------------------------
// 4. MQ-7 Carbon Monoxide (CO) Sensor
// ----------------------------------------------------------------------------
export const SENSOR_MQ7_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_mq7',
  type: 'sensor_mq7',
  name: 'MQ-7 Carbon Monoxide (CO) Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Gas & Air Quality',
  description: 'High-sensitivity sensor for toxic Carbon Monoxide (CO) detection. Uses cyclic high/low temperature heating cycles (5V heating / 1.4V detection) to prevent sensor poisoning.',
  manufacturer: 'Winsen Electronics / Hanwei',
  boardFamily: 'MQ Gas Series',
  modelFactoryId: 'sensor_mq7',
  dimensions: { widthMm: 32.0, heightMm: 22.0, depthMm: 20.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7',
  pins: MQ_MODULE_PINS,
  sensorConfig: {
    sensorFamily: 'gas',
    measuredQuantity: 'Carbon Monoxide (CO)',
    unit: 'PPM',
    minRange: 20,
    maxRange: 2000,
    accuracy: '±15%',
    responseProtocol: 'analog',
    hasHeater: true,
  },
  electrical: {
    operatingVoltage: '5.0V DC (Cycle 5.0V / 1.4V)',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 150,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Carbon Monoxide PPM Telemetry', 'Cyclic Heating Simulation', 'Audible Alarm DO Threshold'],
    notes: 'Default concentration: 35 PPM. Critical life-safety sensor simulation.',
    astSupported: true,
  },
  badge: 'CO 20-2000ppm',
  iconName: 'AlertTriangle',
  tags: ['mq7', 'co', 'carbon monoxide', 'toxic', 'safety', 'air quality'],
};

// ----------------------------------------------------------------------------
// 5. MQ-135 Air Quality & Hazardous Gas Sensor
// ----------------------------------------------------------------------------
export const SENSOR_MQ135_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_mq135',
  type: 'sensor_mq135',
  name: 'MQ-135 Air Quality & Hazardous Gas Sensor',
  category: 'environmental_sensors',
  subcategory: 'Gas & Air Quality',
  description: 'Wide-spectrum air quality sensor sensitive to ammonia (NH3), nitrogen oxides (NOx), alcohol, benzene, smoke, and CO2. The standard sensor for indoor air pollution monitors.',
  manufacturer: 'Winsen Electronics / Hanwei',
  boardFamily: 'MQ Gas Series',
  modelFactoryId: 'sensor_mq135',
  dimensions: { widthMm: 32.0, heightMm: 22.0, depthMm: 20.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7',
  pins: MQ_MODULE_PINS,
  sensorConfig: {
    sensorFamily: 'gas',
    measuredQuantity: 'NH3, NOx, Benzene, CO2, Smoke',
    unit: 'PPM / AQI',
    minRange: 10,
    maxRange: 1000,
    accuracy: '±20%',
    responseProtocol: 'analog',
    hasHeater: true,
  },
  electrical: {
    operatingVoltage: '5.0V DC',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 160,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Air Quality Index (AQI) Calculation', 'Multi-Gas PPM Detection', 'Linearized Curve Modeling'],
    notes: 'Default ambient: 400 PPM CO2-equivalent. Great for smart air purifiers and HVAC systems.',
    astSupported: true,
  },
  badge: 'AQI / NH3 / CO2 10-1000ppm',
  iconName: 'Wind',
  tags: ['mq135', 'air quality', 'aqi', 'pollution', 'co2', 'ammonia', 'benzene', 'smoke'],
};

export const GAS_SENSOR_DEFINITIONS = [
  SENSOR_MQ2_DEFINITION,
  SENSOR_MQ3_DEFINITION,
  SENSOR_MQ4_DEFINITION,
  SENSOR_MQ7_DEFINITION,
  SENSOR_MQ135_DEFINITION,
];
