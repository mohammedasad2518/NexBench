import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 3 Environmental & Measurement Sensors: Temperature & Humidity
// ============================================================================

// ----------------------------------------------------------------------------
// 1. DHT11 Temperature & Humidity Sensor (4 pins, 2.54mm pitch)
// ----------------------------------------------------------------------------
export const DHT11_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (3.3V - 5.5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.22, z: 0 },
    voltage: '3.3V - 5.5V',
    description: 'Power supply pin (3.3V to 5.5V DC)',
  },
  {
    id: 'PIN_DATA',
    name: '2: DATA (Single-Bus)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: -0.05, y: -0.22, z: 0 },
    description: 'Bidirectional single-wire digital data signal (requires 4.7k-10k pullup)',
  },
  {
    id: 'PIN_NC',
    name: '3: NC (Not Connected)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.05, y: -0.22, z: 0 },
    description: 'No internal connection',
  },
  {
    id: 'PIN_GND',
    name: '4: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0.15, y: -0.22, z: 0 },
    voltage: '0V',
    description: 'Common ground return pin',
  },
];

export const SENSOR_DHT11_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_dht11',
  type: 'sensor_dht11',
  name: 'DHT11 Temperature & Humidity Sensor',
  category: 'environmental_sensors',
  subcategory: 'Temperature & Humidity',
  description: 'Composite digital temperature and humidity sensor module with calibrated single-bus digital output. Measures 0°C to 50°C (±2°C) and 20% to 90% RH (±5% RH).',
  manufacturer: 'Aosong Electronics',
  boardFamily: 'DHT Series',
  modelFactoryId: 'sensor_dht11',
  dimensions: { widthMm: 15.5, heightMm: 28.0, depthMm: 7.7, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7', // Characteristic sky blue slotted casing
  pins: DHT11_PINS,
  sensorConfig: {
    sensorFamily: 'temperature',
    measuredQuantity: 'Temperature & Relative Humidity',
    unit: '°C / %RH',
    minRange: 0,
    maxRange: 50,
    accuracy: '±2°C / ±5% RH',
    responseProtocol: 'digital_io',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.5V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 2.5,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Single-Wire Serial Reading', 'Configurable Temperature (0-50°C)', 'Configurable Humidity (20-90% RH)'],
    notes: 'Default ambient: 24.0°C, 45% RH. Fully interactive slider controls in Inspector.',
    astSupported: true,
  },
  badge: '0-50°C 20-90%RH',
  iconName: 'Thermometer',
  tags: ['dht11', 'temperature', 'humidity', 'sensor', 'aosong', 'single-wire', 'weather'],
};

// ----------------------------------------------------------------------------
// 2. DHT22 / AM2302 High Precision Temp & Humidity Sensor
// ----------------------------------------------------------------------------
export const DHT22_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (3.3V - 6V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.26, z: 0 },
    voltage: '3.3V - 6V',
    description: 'Power supply pin (3.3V to 6V DC)',
  },
  {
    id: 'PIN_DATA',
    name: '2: DATA (Single-Bus)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: -0.05, y: -0.26, z: 0 },
    description: 'High-precision bidirectional digital data pin',
  },
  {
    id: 'PIN_NC',
    name: '3: NC (Not Connected)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.05, y: -0.26, z: 0 },
    description: 'No connection',
  },
  {
    id: 'PIN_GND',
    name: '4: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0.15, y: -0.26, z: 0 },
    voltage: '0V',
    description: 'Common ground return pin',
  },
];

export const SENSOR_DHT22_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_dht22',
  type: 'sensor_dht22',
  name: 'DHT22 / AM2302 Precision Temp & Humidity',
  category: 'environmental_sensors',
  subcategory: 'Temperature & Humidity',
  description: 'High-precision digital temperature and relative humidity sensor. Extended range from -40°C to 80°C (±0.5°C) and 0% to 100% RH (±2% RH) with 0.1°C resolution.',
  manufacturer: 'Aosong Electronics',
  boardFamily: 'DHT Series',
  modelFactoryId: 'sensor_dht22',
  dimensions: { widthMm: 15.1, heightMm: 25.1, depthMm: 7.7, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#f1f5f9', // Matte white slotted housing
  pins: DHT22_PINS,
  sensorConfig: {
    sensorFamily: 'temperature',
    measuredQuantity: 'Temperature & Relative Humidity',
    unit: '°C / %RH',
    minRange: -40,
    maxRange: 80,
    accuracy: '±0.5°C / ±2% RH',
    responseProtocol: 'digital_io',
  },
  electrical: {
    operatingVoltage: '3.3V - 6.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 1.5,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Single-Wire High-Precision Reading', 'Sub-Zero Temperature Support', '0.1°C / 0.1% RH Resolution'],
    notes: 'Default ambient: 22.5°C, 50% RH. Interactive extended range.',
    astSupported: true,
  },
  badge: '±0.5°C 0-100%RH',
  iconName: 'ThermometerSnowflake',
  tags: ['dht22', 'am2302', 'precision', 'temperature', 'humidity', 'weather', 'digital'],
};

// ----------------------------------------------------------------------------
// 3. DS18B20 Programmable 1-Wire Digital Thermometer (TO-92 / Probe)
// ----------------------------------------------------------------------------
export const DS18B20_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_GND',
    name: '1: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.1, y: -0.16, z: 0 },
    voltage: '0V',
    description: 'Ground connection pin',
  },
  {
    id: 'PIN_DQ',
    name: '2: DQ (1-Wire Data)',
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0, y: -0.16, z: 0 },
    description: 'Open-drain 1-Wire serial communication line',
  },
  {
    id: 'PIN_VDD',
    name: '3: VDD (Power 3.0V-5.5V)',
    category: 'power',
    pinType: 'power',
    position: { x: 0.1, y: -0.16, z: 0 },
    voltage: '3.0V - 5.5V',
    description: 'Optional external power supply (can also operate in parasite power mode)',
  },
];

export const SENSOR_DS18B20_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_ds18b20',
  type: 'sensor_ds18b20',
  name: 'DS18B20 1-Wire Digital Temperature Sensor',
  category: 'environmental_sensors',
  subcategory: 'Temperature & Humidity',
  description: 'Dallas/Maxim 1-Wire programmable digital thermometer. -55°C to +125°C range with 9-bit to 12-bit user-selectable resolution and unique 64-bit ROM address.',
  manufacturer: 'Analog Devices / Maxim Integrated',
  boardFamily: '1-Wire Sensors',
  modelFactoryId: 'sensor_ds18b20',
  dimensions: { widthMm: 4.8, heightMm: 18.0, depthMm: 3.8, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#1e293b', // Black TO-92 epoxy package
  pins: DS18B20_PINS,
  sensorConfig: {
    sensorFamily: 'temperature',
    measuredQuantity: 'Temperature',
    unit: '°C',
    minRange: -55,
    maxRange: 125,
    accuracy: '±0.5°C (-10°C to +85°C)',
    responseProtocol: 'one_wire',
  },
  electrical: {
    operatingVoltage: '3.0V - 5.5V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 1.5,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['1-Wire Protocol', '9-12 Bit Resolution Modes', 'Wide Range -55°C to +125°C', 'Parasite Power Aware'],
    notes: 'Default ambient: 25.0°C. Selectable TO-92 or waterproof probe model in properties.',
    astSupported: true,
  },
  badge: '1-Wire -55..+125°C',
  iconName: 'Thermometer',
  tags: ['ds18b20', 'dallas', 'maxim', '1-wire', 'onewire', 'temperature', 'probe'],
};

// ----------------------------------------------------------------------------
// 4. LM35 Precision Centigrade Temperature Sensor (TO-92)
// ----------------------------------------------------------------------------
export const LM35_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VS',
    name: '1: +VS (Supply Voltage)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.1, y: -0.16, z: 0 },
    voltage: '4V - 30V',
    description: 'Positive supply voltage pin (+4V to +30V DC)',
  },
  {
    id: 'PIN_VOUT',
    name: '2: VOUT (Analog Output)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: 0, y: -0.16, z: 0 },
    voltage: '0V - 1.5V (10mV/°C)',
    description: 'Linear analog output: 10 mV per degree Celsius (250mV at 25°C)',
  },
  {
    id: 'PIN_GND',
    name: '3: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0.1, y: -0.16, z: 0 },
    voltage: '0V',
    description: 'Ground return pin',
  },
];

export const SENSOR_LM35_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_lm35',
  type: 'sensor_lm35',
  name: 'LM35 Precision Centigrade Temperature Sensor',
  category: 'environmental_sensors',
  subcategory: 'Temperature & Humidity',
  description: 'Precision integrated-circuit temperature sensor whose output voltage is linearly proportional to the Celsius temperature. Low self-heating, 10 mV/°C scale factor.',
  manufacturer: 'Texas Instruments',
  boardFamily: 'Analog Sensors',
  modelFactoryId: 'sensor_lm35',
  dimensions: { widthMm: 4.8, heightMm: 18.0, depthMm: 3.8, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#334155', // Slate black TO-92
  pins: LM35_PINS,
  sensorConfig: {
    sensorFamily: 'temperature',
    measuredQuantity: 'Temperature',
    unit: '°C',
    minRange: -55,
    maxRange: 150,
    accuracy: '±0.5°C at 25°C',
    responseProtocol: 'analog',
  },
  electrical: {
    operatingVoltage: '4.0V - 30.0V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 0.13,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Linear 10mV/°C ADC Voltage Output', 'Direct Arduino analogRead(A0) Formula', 'Vout = Temp * 0.010V'],
    notes: 'Default ambient: 25.0°C (yields 250mV = ADC raw ~51 at 5V reference).',
    astSupported: true,
  },
  badge: 'Linear 10mV/°C',
  iconName: 'Activity',
  tags: ['lm35', 'ti', 'temperature', 'analog', 'linear', 'centigrade', 'adc'],
};

// ----------------------------------------------------------------------------
// 5. NTC Thermistor (10kΩ at 25°C, B=3950)
// ----------------------------------------------------------------------------
export const NTC_THERMISTOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_A',
    name: 'Lead 1 (Terminal A)',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.08, y: -0.14, z: 0 },
    description: 'Non-polarized copper lead 1',
  },
  {
    id: 'TERM_B',
    name: 'Lead 2 (Terminal B)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.08, y: -0.14, z: 0 },
    description: 'Non-polarized copper lead 2',
  },
];

export const SENSOR_NTC_THERMISTOR_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_ntc_thermistor',
  type: 'sensor_ntc_thermistor',
  name: 'NTC Thermistor (10kΩ B=3950)',
  category: 'environmental_sensors',
  subcategory: 'Temperature & Humidity',
  description: 'Negative Temperature Coefficient ceramic disc thermistor. Resistance decreases predictably as temperature rises according to the Steinhart-Hart equation.',
  manufacturer: 'TDK / Epcos / Murata',
  boardFamily: 'Passives',
  modelFactoryId: 'sensor_ntc_thermistor',
  dimensions: { widthMm: 5.0, heightMm: 22.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#10b981', // Emerald green epoxy bead
  pins: NTC_THERMISTOR_PINS,
  sensorConfig: {
    sensorFamily: 'temperature',
    measuredQuantity: 'Temperature',
    unit: '°C',
    minRange: -40,
    maxRange: 125,
    accuracy: '±1%',
    responseProtocol: 'analog',
  },
  resistorConfig: {
    resistanceOhms: 10000,
    tolerancePercent: 1,
    isVariable: true,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 10,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Steinhart-Hart / Beta Equation (B=3950)', 'Voltage Divider Circuit Simulation', 'Configurable Ambient Temp'],
    notes: 'Nominal 10kΩ at 25°C. Pair with 10k resistor in voltage divider for ADC input.',
    astSupported: true,
  },
  badge: '10kΩ NTC B=3950',
  iconName: 'Zap',
  tags: ['ntc', 'thermistor', 'temperature', 'steinhart', 'divider', 'analog', 'resistance'],
};

export const TEMPERATURE_SENSOR_DEFINITIONS = [
  SENSOR_DHT11_DEFINITION,
  SENSOR_DHT22_DEFINITION,
  SENSOR_DS18B20_DEFINITION,
  SENSOR_LM35_DEFINITION,
  SENSOR_NTC_THERMISTOR_DEFINITION,
];
