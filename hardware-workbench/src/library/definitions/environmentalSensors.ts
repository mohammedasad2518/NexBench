import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 3 Environmental & Measurement Sensors: Pressure & Weather
// ============================================================================

// ----------------------------------------------------------------------------
// 1. BMP180 Digital Barometric Pressure & Temperature Sensor (I2C)
// ----------------------------------------------------------------------------
export const BMP180_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VIN',
    name: '1: VIN (3.3V - 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.15, y: -0.15, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Onboard 3.3V LDO regulator input (accepts 3.3V to 5V)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.05, y: -0.15, z: 0 },
    voltage: '0V',
    description: 'Common ground',
  },
  {
    id: 'PIN_SCL',
    name: '3: SCL (I2C Clock)',
    category: 'signal',
    pinType: 'i2c_scl',
    position: { x: 0.05, y: -0.15, z: 0 },
    description: 'I2C Serial Clock (level-shifted)',
  },
  {
    id: 'PIN_SDA',
    name: '4: SDA (I2C Data)',
    category: 'signal',
    pinType: 'i2c_sda',
    position: { x: 0.15, y: -0.15, z: 0 },
    description: 'I2C Serial Data (level-shifted)',
  },
];

export const SENSOR_BMP180_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_bmp180',
  type: 'sensor_bmp180',
  name: 'BMP180 Digital Barometric Pressure Sensor',
  category: 'environmental_sensors',
  subcategory: 'Pressure & Weather',
  description: 'Bosch Sensortec high-precision barometric pressure sensor with I2C interface. Measures atmospheric pressure from 300 to 1100 hPa (+9000m to -500m sea level) with temperature compensation.',
  manufacturer: 'Bosch Sensortec',
  boardFamily: 'BMP Series',
  modelFactoryId: 'sensor_bmp180',
  dimensions: { widthMm: 14.0, heightMm: 12.0, depthMm: 2.8, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#1d4ed8', // Characteristic blue breakout board
  pins: BMP180_PINS,
  sensorConfig: {
    sensorFamily: 'pressure',
    measuredQuantity: 'Barometric Pressure & Temperature',
    unit: 'hPa / °C',
    minRange: 300,
    maxRange: 1100,
    accuracy: '±0.12 hPa (equiv. to ±1m altitude)',
    responseProtocol: 'i2c',
    defaultI2CAddress: '0x77',
  },
  electrical: {
    operatingVoltage: '3.3V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 0.032,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['I2C Bus Communication (0x77)', 'Pressure Reading (300-1100 hPa)', 'Altitude Hypsometric Formula', 'Temperature Output'],
    notes: 'Default: 1013.25 hPa (standard sea level), 25.0°C. Interactive pressure & altitude sliders.',
    astSupported: true,
  },
  badge: 'I2C 0x77 300-1100hPa',
  iconName: 'Gauge',
  tags: ['bmp180', 'bosch', 'pressure', 'barometer', 'altitude', 'i2c', 'weather'],
};

// ----------------------------------------------------------------------------
// 2. BMP280 High-Precision Barometric Pressure + Temp (I2C / SPI)
// ----------------------------------------------------------------------------
export const BMP280_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (1.8V - 3.6V / 5V)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.25, y: -0.16, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Power supply voltage pin',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.15, y: -0.16, z: 0 },
    voltage: '0V',
    description: 'Common ground return',
  },
  {
    id: 'PIN_SCL',
    name: '3: SCL (I2C Clock / SCK)',
    category: 'signal',
    pinType: 'i2c_scl',
    position: { x: -0.05, y: -0.16, z: 0 },
    description: 'I2C Clock / SPI Serial Clock',
  },
  {
    id: 'PIN_SDA',
    name: '4: SDA (I2C Data / SDI)',
    category: 'signal',
    pinType: 'i2c_sda',
    position: { x: 0.05, y: -0.16, z: 0 },
    description: 'I2C Data / SPI Serial Data In',
  },
  {
    id: 'PIN_CSB',
    name: '5: CSB (Chip Select)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.15, y: -0.16, z: 0 },
    description: 'Chip Select (pull HIGH for I2C, LOW for SPI)',
  },
  {
    id: 'PIN_SDO',
    name: '6: SDO (I2C Addr Select / SDO)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.25, y: -0.16, z: 0 },
    description: 'I2C address bit (GND=0x76, VCC=0x77) / SPI Data Out',
  },
];

export const SENSOR_BMP280_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_bmp280',
  type: 'sensor_bmp280',
  name: 'BMP280 Precision Barometric Pressure Sensor',
  category: 'environmental_sensors',
  subcategory: 'Pressure & Weather',
  description: 'Bosch Sensortec upgraded digital pressure and temperature sensor designed for mobile applications. Ultra-low noise, high resolution, I2C/SPI interfaces.',
  manufacturer: 'Bosch Sensortec',
  boardFamily: 'BMP Series',
  modelFactoryId: 'sensor_bmp280',
  dimensions: { widthMm: 15.2, heightMm: 12.0, depthMm: 2.5, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#7c3aed', // Characteristic purple breakout board
  pins: BMP280_PINS,
  sensorConfig: {
    sensorFamily: 'pressure',
    measuredQuantity: 'Barometric Pressure & Temperature',
    unit: 'hPa / °C',
    minRange: 300,
    maxRange: 1100,
    accuracy: '±0.12 hPa (0.18 m resolution)',
    responseProtocol: 'i2c',
    defaultI2CAddress: '0x76',
  },
  electrical: {
    operatingVoltage: '1.8V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 0.025,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['I2C (0x76/0x77) and SPI Mode', 'Configurable Altitude & Sea-Level Pressure', 'High Precision Temperature Output'],
    notes: 'Default: 1013.25 hPa, 24.5°C. Address selectable via SDO pin state.',
    astSupported: true,
  },
  badge: 'I2C/SPI 0x76/0x77',
  iconName: 'Gauge',
  tags: ['bmp280', 'bosch', 'pressure', 'barometer', 'altitude', 'i2c', 'spi'],
};

// ----------------------------------------------------------------------------
// 3. BME280 Combined Pressure + Temp + Humidity Sensor (I2C / SPI)
// ----------------------------------------------------------------------------
export const BME280_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_VCC',
    name: '1: VCC (Power)',
    category: 'power',
    pinType: 'power',
    position: { x: -0.25, y: -0.16, z: 0 },
    voltage: '3.3V - 5.0V',
    description: 'Power supply voltage pin (3.3V - 5V DC)',
  },
  {
    id: 'PIN_GND',
    name: '2: GND (Ground)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.15, y: -0.16, z: 0 },
    voltage: '0V',
    description: 'Common ground return pin',
  },
  {
    id: 'PIN_SCL',
    name: '3: SCL (I2C Clock / SCK)',
    category: 'signal',
    pinType: 'i2c_scl',
    position: { x: -0.05, y: -0.16, z: 0 },
    description: 'I2C Serial Clock / SPI Clock',
  },
  {
    id: 'PIN_SDA',
    name: '4: SDA (I2C Data / SDI)',
    category: 'signal',
    pinType: 'i2c_sda',
    position: { x: 0.05, y: -0.16, z: 0 },
    description: 'I2C Serial Data / SPI Serial Data In',
  },
  {
    id: 'PIN_CSB',
    name: '5: CSB (Chip Select)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.15, y: -0.16, z: 0 },
    description: 'Chip Select (I2C when pulled HIGH, SPI when LOW)',
  },
  {
    id: 'PIN_SDO',
    name: '6: SDO (I2C Addr Select / SDO)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.25, y: -0.16, z: 0 },
    description: 'I2C address bit (0x76 or 0x77) / SPI Data Out',
  },
];

export const SENSOR_BME280_DEFINITION: HardwareComponentDefinition = {
  id: 'sensor_bme280',
  type: 'sensor_bme280',
  name: 'BME280 Environmental Sensor (Temp/Pressure/Humidity)',
  category: 'environmental_sensors',
  subcategory: 'Pressure & Weather',
  description: 'All-in-one Bosch Sensortec environmental sensor combining individual high linearity, high accuracy sensors for pressure, humidity and temperature in a single package.',
  manufacturer: 'Bosch Sensortec',
  boardFamily: 'BME Series',
  modelFactoryId: 'sensor_bme280',
  dimensions: { widthMm: 15.2, heightMm: 12.0, depthMm: 2.5, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#9333ea', // Deep purple breakout PCB with metal lid
  pins: BME280_PINS,
  sensorConfig: {
    sensorFamily: 'pressure',
    measuredQuantity: 'Pressure, Humidity, Temperature',
    unit: 'hPa / %RH / °C',
    minRange: 300,
    maxRange: 1100,
    accuracy: '±1 hPa, ±3% RH, ±1°C',
    responseProtocol: 'i2c',
    defaultI2CAddress: '0x76',
  },
  electrical: {
    operatingVoltage: '1.8V - 5.0V DC',
    logicLevel: '3.3V / 5.0V tolerant',
    maxCurrentPerPinMa: 0.035,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Simultaneous 3-in-1 Telemetry', 'I2C Address 0x76 / 0x77', 'Dew Point Calculation', 'Barometric Altitude Formula'],
    notes: 'Default: 1013.25 hPa, 45% RH, 23.0°C. Triple interactive telemetry sliders.',
    astSupported: true,
  },
  badge: 'Temp+Hum+Press 3-in-1',
  iconName: 'CloudRain',
  tags: ['bme280', 'bosch', 'pressure', 'humidity', 'temperature', 'weather', 'i2c', 'dew-point'],
};

export const ENVIRONMENTAL_SENSOR_DEFINITIONS = [
  SENSOR_BMP180_DEFINITION,
  SENSOR_BMP280_DEFINITION,
  SENSOR_BME280_DEFINITION,
];
