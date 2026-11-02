import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 2 Basic Electronics: Diodes, LEDs, and Photodiode
// ============================================================================

// ----------------------------------------------------------------------------
// D. Diodes (Rectifier, Zener, Schottky)
// ----------------------------------------------------------------------------

export const DIODE_PINS: ComponentPinDefinition[] = [
  {
    id: 'ANODE',
    name: 'Anode (+)',
    category: 'power',
    pinType: 'passive',
    position: { x: -0.2, y: 0.08, z: 0 },
    voltage: 'POS',
    description: 'Anode terminal (current enters in forward bias)',
  },
  {
    id: 'CATHODE',
    name: 'Cathode (-) [Marked Band]',
    category: 'ground',
    pinType: 'passive',
    position: { x: 0.2, y: 0.08, z: 0 },
    voltage: 'NEG',
    description: 'Cathode terminal indicated by painted band on body',
  },
];

export const DIODE_RECTIFIER_DEFINITION: HardwareComponentDefinition = {
  id: 'diode_rectifier',
  type: 'diode_rectifier',
  name: 'Standard Rectifier Diode (1N4007, 1000V 1A)',
  category: 'basic_electronics',
  subcategory: 'Diodes',
  description: 'Classic 1A general-purpose power rectifier diode in DO-41 package with silver cathode stripe. Used for reverse polarity protection, AC-to-DC rectification, and flyback protection.',
  manufacturer: 'ON Semi / Vishay / Generic',
  boardFamily: 'Semiconductors',
  modelFactoryId: 'diode_rectifier',
  dimensions: { widthMm: 12.0, heightMm: 2.7, depthMm: 2.7, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0f172a', // Matte black epoxy body with silver cathode ring
  pins: DIODE_PINS,
  diodeConfig: {
    diodeType: 'rectifier',
    forwardVoltage: 0.7,
    maxCurrentMa: 1000,
    reverseBreakdownVoltage: 1000,
  },
  electrical: {
    operatingVoltage: 'Forward: ~0.7V drop; Peak Reverse: 1000V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Unidirectional Current Conduction', 'Flyback Clamp for Inductive Motors', '0.7V Forward Drop'],
    notes: 'Blocks reverse current; passes forward current with ~0.7V drop.',
  },
  datasheetUrl: 'https://www.vishay.com/docs/88503/1n4001.pdf',
  badge: '1N4007 1A',
  iconName: 'Zap',
  tags: ['diode', 'rectifier', '1n4007', 'flyback', 'do41', 'protection', '1000v'],
};

export const DIODE_ZENER_DEFINITION: HardwareComponentDefinition = {
  id: 'diode_zener',
  type: 'diode_zener',
  name: 'Zener Voltage Regulator Diode (1N4733A, 5.1V 1W)',
  category: 'basic_electronics',
  subcategory: 'Diodes',
  description: 'Precision 5.1V 1W Zener diode in glass DO-35 encapsulation with black cathode band. Provides stable voltage clamping and reference voltage regulation under reverse breakdown.',
  manufacturer: 'Microsemi / Diodes Inc / Generic',
  boardFamily: 'Semiconductors',
  modelFactoryId: 'diode_zener',
  dimensions: { widthMm: 9.0, heightMm: 2.0, depthMm: 2.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#dc2626', // Orange-red translucent glass with black band
  pins: DIODE_PINS,
  diodeConfig: {
    diodeType: 'zener',
    forwardVoltage: 0.7,
    maxCurrentMa: 180,
    reverseBreakdownVoltage: 5.1,
  },
  electrical: {
    operatingVoltage: 'Zener Breakdown: 5.1V DC; Forward: 0.7V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 180,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['5.1V Voltage Clamping', 'Overvoltage Protection Clamp'],
    notes: 'Maintains 5.1V across terminals in reverse breakdown configuration.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Zener_diode',
  badge: '5.1V Zener',
  iconName: 'Zap',
  tags: ['zener', 'diode', 'voltage-regulator', 'clamp', '1n4733a', '5.1v', 'glass'],
};

export const DIODE_SCHOTTKY_DEFINITION: HardwareComponentDefinition = {
  id: 'diode_schottky',
  type: 'diode_schottky',
  name: 'Schottky Barrier Diode (1N5819, 40V 1A)',
  category: 'basic_electronics',
  subcategory: 'Diodes',
  description: 'High-efficiency metal-semiconductor Schottky barrier diode with low forward voltage drop (~0.3V) and ultra-fast recovery time. Ideal for high-efficiency solar battery paths and SMPS.',
  manufacturer: 'STMicroelectronics / Generic',
  boardFamily: 'Semiconductors',
  modelFactoryId: 'diode_schottky',
  dimensions: { widthMm: 12.0, heightMm: 2.7, depthMm: 2.7, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#18181b', // Matte black with gold cathode band
  pins: DIODE_PINS,
  diodeConfig: {
    diodeType: 'schottky',
    forwardVoltage: 0.35,
    maxCurrentMa: 1000,
    reverseBreakdownVoltage: 40,
  },
  electrical: {
    operatingVoltage: 'Low Forward Drop: ~0.35V; Reverse: 40V Peak',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Low Forward Drop (0.35V)', 'High-Speed Switching'],
    notes: 'Lower forward loss than standard silicon diodes.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Schottky_diode',
  badge: '1N5819 40V 1A',
  iconName: 'Zap',
  tags: ['schottky', 'diode', '1n5819', 'fast-switching', 'low-drop', 'power'],
};

// ----------------------------------------------------------------------------
// E. LEDs (Red, Green, Blue, Yellow, White, RGB, Infrared)
// ----------------------------------------------------------------------------

export const STANDARD_LED_PINS: ComponentPinDefinition[] = [
  {
    id: 'ANODE',
    name: 'Anode (+) [Long Lead]',
    category: 'power',
    pinType: 'gpio',
    position: { x: -0.05, y: 0.12, z: 0 },
    voltage: 'VCC',
    description: 'Longer positive anode lead connects to MCU GPIO or VCC',
  },
  {
    id: 'CATHODE',
    name: 'Cathode (-) [Flat Edge]',
    category: 'ground',
    pinType: 'ground',
    position: { x: 0.05, y: 0.12, z: 0 },
    voltage: 'GND',
    description: 'Shorter negative cathode lead with flat rim collar connects to GND or resistor',
  },
];

function createLedDefinition(
  id: string,
  type: any,
  name: string,
  colorName: string,
  hexColor: string,
  forwardVoltage: number,
  wavelength: number | undefined,
  badgeText: string,
  isIr: boolean = false
): HardwareComponentDefinition {
  return {
    id,
    type,
    name,
    category: 'basic_electronics',
    subcategory: 'LEDs',
    description: isIr
      ? '940nm Infrared Gallium-Arsenide emitter diode with dark filtered lens for optical remote controls and proximity sensing.'
      : `Standard 5mm radial T-1 3/4 through-hole diffused ${colorName} indicator LED with ${forwardVoltage}V forward drop and internal leadframe.`,
    manufacturer: 'Kingbright / Cree / Generic',
    boardFamily: 'Optoelectronics',
    modelFactoryId: id,
    dimensions: { widthMm: 5.8, heightMm: 16.0, depthMm: 5.8, unit: 'mm' },
    defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
    defaultColor: hexColor,
    pins: STANDARD_LED_PINS,
    diodeConfig: {
      diodeType: 'led',
      forwardVoltage,
      maxCurrentMa: 25,
      color: hexColor,
      wavelengthNm: wavelength,
    },
    electrical: {
      operatingVoltage: `Forward: ~${forwardVoltage}V DC (requires current-limiting resistor)`,
      logicLevel: 'passive',
      maxCurrentPerPinMa: 25,
    },
    simulation: {
      level: 'full',
      supportedFeatures: ['Arduino Digital/PWM Output Drive', 'Dynamic 3D Dome Illumination', 'Glow Intensity Bloom'],
      notes: 'Directly supported by the AST runtime on digital and analogWrite (PWM) pins.',
    },
    datasheetUrl: 'https://en.wikipedia.org/wiki/Light-emitting_diode',
    badge: badgeText,
    iconName: 'Lightbulb',
    tags: ['led', 'light', colorName.toLowerCase(), 'diode', 'indicator', '5mm', 'through-hole'],
  };
}

export const LED_RED_DEFINITION = createLedDefinition(
  'led_red', 'led_red', '5mm Red Diffused LED', 'Red', '#ef4444', 2.0, 625, 'Red 2.0V'
);

export const LED_GREEN_DEFINITION = createLedDefinition(
  'led_green', 'led_green', '5mm Green Diffused LED', 'Green', '#22c55e', 2.2, 525, 'Green 2.2V'
);

export const LED_BLUE_DEFINITION = createLedDefinition(
  'led_blue', 'led_blue', '5mm Blue Water-Clear LED', 'Blue', '#3b82f6', 3.1, 470, 'Blue 3.1V'
);

export const LED_YELLOW_DEFINITION = createLedDefinition(
  'led_yellow', 'led_yellow', '5mm Yellow Diffused LED', 'Yellow', '#eab308', 2.1, 590, 'Yellow 2.1V'
);

export const LED_WHITE_DEFINITION = createLedDefinition(
  'led_white', 'led_white', '5mm Bright White LED', 'White', '#f8fafc', 3.2, undefined, 'White 3.2V'
);

export const LED_IR_DEFINITION = createLedDefinition(
  'led_ir', 'led_ir', '5mm Infrared Emitter LED (940nm)', 'Infrared', '#312e81', 1.4, 940, 'IR 940nm', true
);

// RGB LED (4 Leads: Red, Common, Green, Blue)
export const RGB_LED_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_R',
    name: 'Red Anode / Pin',
    category: 'signal',
    pinType: 'pwm',
    position: { x: -0.09, y: 0.12, z: 0 },
    voltage: '2.0V',
    description: 'Red LED die channel',
  },
  {
    id: 'COM',
    name: 'Common Pin (Cathode/Anode)',
    category: 'ground',
    pinType: 'ground',
    position: { x: -0.03, y: 0.12, z: 0 },
    voltage: 'GND/VCC',
    description: 'Longest lead: Common Cathode (GND default) or Common Anode (+5V)',
  },
  {
    id: 'PIN_G',
    name: 'Green Anode / Pin',
    category: 'signal',
    pinType: 'pwm',
    position: { x: 0.03, y: 0.12, z: 0 },
    voltage: '3.1V',
    description: 'Green LED die channel',
  },
  {
    id: 'PIN_B',
    name: 'Blue Anode / Pin',
    category: 'signal',
    pinType: 'pwm',
    position: { x: 0.09, y: 0.12, z: 0 },
    voltage: '3.1V',
    description: 'Blue LED die channel',
  },
];

export const LED_RGB_DEFINITION: HardwareComponentDefinition = {
  id: 'led_rgb',
  type: 'led_rgb',
  name: '5mm Tri-Color RGB LED (4-Pin Common Cathode)',
  category: 'basic_electronics',
  subcategory: 'LEDs',
  description: 'Diffuse 5mm 4-pin RGB LED combining red, green, and blue dies in a single frosted lens. Connects to 3 PWM pins to blend over 16 million colors.',
  manufacturer: 'Generic',
  boardFamily: 'Optoelectronics',
  modelFactoryId: 'led_rgb',
  dimensions: { widthMm: 5.8, heightMm: 16.0, depthMm: 5.8, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#f1f5f9', // Milky translucent epoxy dome
  pins: RGB_LED_PINS,
  diodeConfig: {
    diodeType: 'led',
    forwardVoltage: 2.8,
    maxCurrentMa: 60,
    isRgb: true,
    rgbCommon: 'common_cathode',
  },
  electrical: {
    operatingVoltage: 'Red: ~2.0V, Green: ~3.1V, Blue: ~3.1V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 20,
    totalCurrentLimitMa: 60,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Multi-channel PWM Color Mixing', 'Common Cathode / Common Anode Toggle', 'Real-Time Dynamic Dome Tint'],
    notes: 'Configurable common pin polarity (Common Cathode vs Common Anode) in Properties panel.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Light-emitting_diode#RGB_LEDs',
  badge: '4-Pin RGB',
  iconName: 'Palette',
  tags: ['rgb', 'led', 'tricolor', '4pin', 'common-cathode', 'pwm', 'color'],
};

// ----------------------------------------------------------------------------
// F. Photodiode
// ----------------------------------------------------------------------------

export const PHOTODIODE_PINS: ComponentPinDefinition[] = [
  {
    id: 'ANODE',
    name: 'Anode (+)',
    category: 'signal',
    pinType: 'analog_out',
    position: { x: -0.05, y: 0.12, z: 0 },
    description: 'Anode lead (connects to ground or op-amp inverting node)',
  },
  {
    id: 'CATHODE',
    name: 'Cathode (-) [Flat Edge]',
    category: 'power',
    pinType: 'analog_in',
    position: { x: 0.05, y: 0.12, z: 0 },
    description: 'Cathode lead connects to positive bias voltage in reverse photoconductive mode',
  },
];

export const PHOTODIODE_DEFINITION: HardwareComponentDefinition = {
  id: 'photodiode',
  type: 'photodiode',
  name: 'Silicon PIN Photodiode (5mm Optical Sensor)',
  category: 'basic_electronics',
  subcategory: 'Optical Components',
  description: 'High-speed silicon PIN photodiode in clear 5mm epoxy dome. Operates in reverse-bias photoconductive mode to convert incident ambient light into proportional current.',
  manufacturer: 'Vishay / Osram / Generic',
  boardFamily: 'Optoelectronics',
  modelFactoryId: 'photodiode',
  dimensions: { widthMm: 5.8, heightMm: 16.0, depthMm: 5.8, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#0284c7', // Water-clear with dark silicon chip die
  pins: PHOTODIODE_PINS,
  diodeConfig: {
    diodeType: 'photodiode',
    forwardVoltage: 0.7,
    maxCurrentMa: 10,
    reverseBreakdownVoltage: 32,
  },
  electrical: {
    operatingVoltage: 'Reverse Bias: 5V - 30V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 10,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Reverse Photoconductive Mode', 'Light-to-Current Conversion', 'Optical Ambient Detection'],
    notes: 'Responsive from 400nm to 1100nm with peak at 900nm.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Photodiode',
  badge: '5mm Optical',
  iconName: 'Eye',
  tags: ['photodiode', 'optical', 'light-sensor', 'photodetector', 'pin-diode', '5mm'],
};

export const DIODES_LEDS_DEFINITIONS: HardwareComponentDefinition[] = [
  DIODE_RECTIFIER_DEFINITION,
  DIODE_ZENER_DEFINITION,
  DIODE_SCHOTTKY_DEFINITION,
  LED_RED_DEFINITION,
  LED_GREEN_DEFINITION,
  LED_BLUE_DEFINITION,
  LED_YELLOW_DEFINITION,
  LED_WHITE_DEFINITION,
  LED_RGB_DEFINITION,
  LED_IR_DEFINITION,
  PHOTODIODE_DEFINITION,
];
