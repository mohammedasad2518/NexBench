import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 3 Environmental & Measurement Sensors: Light, UV & Sound Sensors
// ============================================================================

// ----------------------------------------------------------------------------
// 1. LDR Photoresistor (Light Dependent Resistor, 5mm CdS)
// ----------------------------------------------------------------------------
export const LDR_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_A',
    name: 'Lead 1 (Terminal A)',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.08, y: -0.12, z: 0 },
    description: 'Non-polarized copper lead 1',
  },
  {
    id: 'TERM_B',
    name: 'Lead 2 (Terminal B)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.08, y: -0.12, z: 0 },
    description: 'Non-polarized copper lead 2',
  },
];

export const SENSOR_LDR_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_ldr',
  type: 'sensor_ldr',
  name: 'LDR Photoresistor (5mm Light Sensor)',
  category: 'environmental_sensors',
  subcategory: 'Light & UV',
  description: 'Cadmium Sulfide (CdS) photoconductive cell. Electrical resistance drops sharply as incident illumination increases, from >1MΩ in complete darkness down to ~1kΩ in bright sunlight.',
  manufacturer: 'Generic / GL5528',
  boardFamily: 'Passives',
  modelFactoryId: 'sensor_ldr',
  dimensions: { widthMm: 5.0, heightMm: 16.0, depthMm: 2.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#f97316', // Orange-tinted ceramic face with serpentine cadmium track
  pins: LDR_PINS,
  sensorConfig: {
    sensorFamily: 'light_uv',
    measuredQuantity: 'Ambient Light Level',
    unit: 'Lux',
    minRange: 0.1,
    maxRange: 100000,
    accuracy: '±15%',
    responseProtocol: 'analog',
  },
  resistorConfig: {
    resistanceOhms: 10000,
    tolerancePercent: 20,
    isVariable: true,
  },
  electrical: {
    operatingVoltage: 'Up to 150V DC / Peak AC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 20,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Light Lux Slider (0.1 - 10,000 Lux)', 'Dynamic Photo-Resistance Curve (R ~ 500k / Lux^0.7)', 'Voltage Divider Circuit Calculations'],
    notes: 'Default illuminance: 500 Lux (office ambient ~10kΩ). Pairs with 10k resistor for analogRead.',
    astSupported: true,
  },
  badge: '0.1-100k Lux LDR',
  iconName: 'Sun',
  tags: ['ldr', 'photoresistor', 'light', 'photocell', 'lux', 'cds', 'gl5528', 'analog'],
};

// ----------------------------------------------------------------------------
// 2. GUVA-S12SD UV Sensor Module
// ----------------------------------------------------------------------------
export const UV_SENSOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (2.7V - 5.5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.1, y: -0.15, z: 0 },
    voltage: '2.7V - 5.5V',
    description: 'Power supply voltage pin (2.7V to 5.5V DC)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0, y: -0.15, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
  {
    id: 'PIN_OUT',
    name: '3: OUT (Analog UV Index)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0.1, y: -0.15, z: 0 },
    voltage: '0V - 1.2V (0.1V / UV index)',
    description: 'Analog output voltage linearly proportional to UV Index (~0.1V per UV index unit)',
  },
];

export const SENSOR_UV_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_uv',
  type: 'sensor_uv',
  name: 'GUVA-S12SD Ultraviolet (UV) Sensor Module',
  category: 'environmental_sensors',
  subcategory: 'Light & UV',
  description: 'True ultraviolet radiation sensor with Gallium Nitride (GaN) photodiode sensitive to UV-A and UV-B (240nm - 370nm). Provides linear analog output directly translating to UV Index (0 to 14).',
  manufacturer: 'GenUV / Adafruit',
  boardFamily: 'Optical Sensors',
  modelFactoryId: 'sensor_uv',
  dimensions: { widthMm: 14.0, heightMm: 11.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#3b82f6', // Characteristic blue PCB with circular transparent filter window
  pins: UV_SENSOR_PINS,
  sensorConfig: {
    sensorFamily: 'light_uv',
    measuredQuantity: 'Ultraviolet Index (UV-A / UV-B)',
    unit: 'UV Index (0-14)',
    minRange: 0,
    maxRange: 14,
    accuracy: '±1 UV Index',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '2.7V - 5.5V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 0.2,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['UV Index Slider (0 to 14)', 'Linear 0.1V/UV-Index Voltage Output', 'Sunburn Risk Category Indicator'],
    notes: 'Default: UV Index 3.0 (moderate sun = 300mV output). Matches WHO UV index scale.',
    astSupported: true,
  },
  badge: 'UV Index 0-14 Linear',
  iconName: 'SunMedium',
  tags: ['uv', 'ultraviolet', 'guva', 's12sd', 'uva', 'uvb', 'sun', 'solar', 'radiation'],
};

// ----------------------------------------------------------------------------
// 3. Sound / Acoustic Sensor Module (Microphone + LM393)
// ----------------------------------------------------------------------------
export const SOUND_SENSOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (3.3V - 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.25, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Power supply voltage pin (3.3V to 5V DC)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.05, y: -0.25, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
  {
    id: 'PIN_DO',
    name: '3: DO (Digital Sound Trigger)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0.05, y: -0.25, z: 0 },
    voltage: '0V / 5V',
    description: 'Digital clap/sound trigger output (Active LOW when volume exceeds onboard potentiometer threshold)',
  },
  {
    id: 'PIN_AO',
    name: '4: AO (Analog Audio Signal)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0.15, y: -0.25, z: 0 },
    voltage: '0V - 5.0V',
    description: 'Real-time analog acoustic signal waveform output from microphone preamplifier',
  },
];

export const SENSOR_SOUND_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_sound',
  type: 'sensor_sound',
  name: 'Sound Sensor Module (Microphone + LM393)',
  category: 'environmental_sensors',
  subcategory: 'Sound Sensors',
  description: 'High-sensitivity acoustic sensor module with electret condenser microphone and LM393 comparator. Features potentiometer threshold tuning for clap switches and acoustic noise monitoring.',
  manufacturer: 'Waveshare / Keyes',
  boardFamily: 'Acoustic Sensors',
  modelFactoryId: 'sensor_sound',
  dimensions: { widthMm: 35.0, heightMm: 15.0, depthMm: 14.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0f172a', // Black breakout PCB with cylindrical silver microphone capsule
  pins: SOUND_SENSOR_PINS,
  sensorConfig: {
    sensorFamily: 'sound',
    measuredQuantity: 'Sound / Acoustic Intensity',
    unit: '% (30-120 dB)',
    minRange: 0,
    maxRange: 100,
    accuracy: '±5%',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 10,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Sound Intensity % Slider (0-100%)', 'Comparator Threshold Triggering', 'Simulated Clap/Sound Pulse'],
    notes: 'Default ambient: 20% (quiet room). Clapping raises level to 85%, tripping DO alarm.',
    astSupported: true,
  },
  badge: 'Mic + LM393 AO/DO',
  iconName: 'Volume2',
  tags: ['sound', 'mic', 'microphone', 'audio', 'acoustic', 'clap', 'decibel', 'noise'],
};

export const OPTICAL_SOUND_SENSOR_DEFINITIONS = [
  SENSOR_LDR_DEFINITION,
  SENSOR_UV_DEFINITION,
  SENSOR_SOUND_DEFINITION,
];
