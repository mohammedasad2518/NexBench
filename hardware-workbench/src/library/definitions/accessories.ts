import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 1 Connectors & Accessories: 6 Structured Definitions
// ============================================================================

// 1. Male Pin Header (1x40 Breakaway 2.54mm)
export const HEADER_MALE_PINS: ComponentPinDefinition[] = Array.from({ length: 8 }, (_, i) => ({
  id: `PIN_${i + 1}`,
  name: `Pin ${i + 1}`,
  pinNumber: i + 1,
  category: 'signal' as const,
  pinType: 'terminal' as const,
  position: { x: -0.7 + i * 0.2, y: 0.15, z: 0 },
  description: `Gold-plated square male pin ${i + 1} (2.54mm pitch)`,
}));

export const HEADER_MALE_DEFINITION: HardwareComponentDefinition = {
  id: 'header_male_40',
  type: 'header_male_40',
  name: 'Breakaway Male Pin Header Strip (1x40, 2.54mm)',
  category: 'connectors_accessories',
  subcategory: 'Pin Headers',
  description: 'Standard 0.1" (2.54mm) single-row gold-plated breakaway male header pins. Easily snappable to desired pin count for custom PCBs and breadboard adapters.',
  manufacturer: 'Generic',
  boardFamily: 'Connector',
  modelFactoryId: 'header_male_40',
  dimensions: { widthMm: 101.6, heightMm: 11.5, depthMm: 2.54, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#eab308', // Gold pins with black plastic collar
  pins: HEADER_MALE_PINS,
  electrical: {
    operatingVoltage: 'Up to 250V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Pin Interconnection', 'Direct Header Plug'],
    notes: 'Connects to female jumper sockets and breadboard tie points.',
  },
  badge: '1x40 Male',
  iconName: 'Plug',
  tags: ['header', 'male', 'breakaway', '2.54mm', 'pins', 'gold'],
};

// 2. Female Pin Header (1x40 Socket Strip 2.54mm)
export const HEADER_FEMALE_PINS: ComponentPinDefinition[] = Array.from({ length: 8 }, (_, i) => ({
  id: `SOCKET_${i + 1}`,
  name: `Socket ${i + 1}`,
  pinNumber: i + 1,
  category: 'signal' as const,
  pinType: 'terminal' as const,
  position: { x: -0.7 + i * 0.2, y: 0.2, z: 0 },
  description: `Female socket receptacle ${i + 1} (2.54mm pitch)`,
}));

export const HEADER_FEMALE_DEFINITION: HardwareComponentDefinition = {
  id: 'header_female_40',
  type: 'header_female_40',
  name: 'Female Header Socket Strip (1x40, 2.54mm)',
  category: 'connectors_accessories',
  subcategory: 'Pin Headers',
  description: 'Single-row 40-position 0.1" (2.54mm) female socket receptacle strip with phosphor bronze contacts and black thermoplastic insulator.',
  manufacturer: 'Generic',
  boardFamily: 'Connector',
  modelFactoryId: 'header_female_40',
  dimensions: { widthMm: 101.6, heightMm: 8.5, depthMm: 2.54, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b', // Black body
  pins: HEADER_FEMALE_PINS,
  electrical: {
    operatingVoltage: 'Up to 250V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Socket Interconnection', 'Male Pin Acceptance'],
    notes: 'Mates with male jumper pins.',
  },
  badge: '1x40 Female',
  iconName: 'Plug',
  tags: ['header', 'female', 'socket', '2.54mm', 'receptacle'],
};

// 3. Screw Terminal Block (2-Pin 5.08mm)
export const TERMINAL_BLOCK_PINS: ComponentPinDefinition[] = [
  { id: 'TERM_1', name: 'Terminal 1 (+)', category: 'power', pinType: 'terminal', position: { x: -0.25, y: 0.2, z: 0 }, description: 'Positive power / high current lead' },
  { id: 'TERM_2', name: 'Terminal 2 (-)', category: 'ground', pinType: 'terminal', position: { x: 0.25, y: 0.2, z: 0 }, description: 'Negative ground / return lead' },
];

export const TERMINAL_BLOCK_DEFINITION: HardwareComponentDefinition = {
  id: 'terminal_block_2p',
  type: 'terminal_block_2p',
  name: 'Screw Terminal Block (2-Pin, 5.08mm Pitch)',
  category: 'connectors_accessories',
  subcategory: 'Terminal Blocks',
  description: 'Industrial PCB screw terminal block with rising cage clamp mechanism for securing high-current power cables up to 14 AWG safely without soldering.',
  manufacturer: 'Generic / Phoenix Contact Style',
  boardFamily: 'Connector',
  modelFactoryId: 'terminal_block_2p',
  dimensions: { widthMm: 10.16, heightMm: 14.0, depthMm: 10.0, unit: 'mm' },
  defaultScale: { x: 0.8, y: 0.8, z: 0.8 },
  defaultColor: '#15803d', // Classic industrial green
  pins: TERMINAL_BLOCK_PINS,
  electrical: {
    operatingVoltage: 'Up to 300V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 15000, // 15A rating
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['High-Current Wiring', 'Motor & Battery Terminal Clamp'],
    notes: 'Models high-current connection point for motors, batteries, and DC supplies.',
  },
  badge: '2-Pin 15A',
  iconName: 'Wrench',
  tags: ['screw-terminal', 'block', '5.08mm', 'clamp', 'power', 'green'],
};

// 4. JST-XH Connector (2-Pin 2.54mm)
export const CONNECTOR_JST_PINS: ComponentPinDefinition[] = [
  { id: 'JST_PIN_1', name: 'Pin 1 (Red / V+)', category: 'power', pinType: 'power', position: { x: -0.15, y: 0.12, z: 0 }, voltage: 'VCC', description: 'Positive pin' },
  { id: 'JST_PIN_2', name: 'Pin 2 (Black / GND)', category: 'ground', pinType: 'ground', position: { x: 0.15, y: 0.12, z: 0 }, voltage: '0V', description: 'Ground pin' },
];

export const CONNECTOR_JST_DEFINITION: HardwareComponentDefinition = {
  id: 'connector_jst_xh',
  type: 'connector_jst_xh',
  name: 'JST-XH 2.54mm Shrouded Header (2-Pin)',
  category: 'connectors_accessories',
  subcategory: 'Wire Connectors',
  description: 'Polarized 2-pin keyed nylon shrouded header connector commonly found on single-cell LiPo battery packs, balance leads, and modular sensors.',
  manufacturer: 'J.S.T. Mfg. Co. / Generic',
  boardFamily: 'Connector',
  modelFactoryId: 'connector_jst_xh',
  dimensions: { widthMm: 7.5, heightMm: 7.0, depthMm: 6.0, unit: 'mm' },
  defaultScale: { x: 0.7, y: 0.7, z: 0.7 },
  defaultColor: '#f8fafc', // Polarized white nylon
  pins: CONNECTOR_JST_PINS,
  electrical: {
    operatingVoltage: 'Up to 250V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Polarized Battery Connection', 'Reverse Polarity Prevention'],
    notes: 'Keyed notch prevents reverse insertion.',
  },
  badge: 'JST-XH 2.54',
  iconName: 'BatteryCharging',
  tags: ['jst', 'jst-xh', 'lipo', 'battery-connector', 'polarized', 'shrouded'],
};

// 5. DC Barrel Jack (2.1mm x 5.5mm Center Positive)
export const DC_BARREL_JACK_PINS: ComponentPinDefinition[] = [
  { id: 'CENTER_POS', name: 'Center Pin (+)', category: 'power', pinType: 'power', position: { x: 0.2, y: 0.15, z: 0 }, voltage: '7-12V', description: 'Center pin positive (+)' },
  { id: 'SLEEVE_GND', name: 'Outer Sleeve (-)', category: 'ground', pinType: 'ground', position: { x: -0.2, y: 0.15, z: 0 }, voltage: '0V', description: 'Outer sleeve ground (-)' },
];

export const DC_BARREL_JACK_DEFINITION: HardwareComponentDefinition = {
  id: 'dc_barrel_jack',
  type: 'dc_barrel_jack',
  name: 'DC Barrel Power Jack (2.1mm x 5.5mm)',
  category: 'connectors_accessories',
  subcategory: 'Power Accessories',
  description: 'Standard 2.1mm inner diameter, 5.5mm outer diameter DC power socket with center-positive pin. Used for external wall adapter supplies (7V - 12V).',
  manufacturer: 'Generic',
  boardFamily: 'Power Connector',
  modelFactoryId: 'dc_barrel_jack',
  dimensions: { widthMm: 14.0, heightMm: 11.0, depthMm: 9.0, unit: 'mm' },
  defaultScale: { x: 0.8, y: 0.8, z: 0.8 },
  defaultColor: '#18181b', // Black threaded bushing
  pins: DC_BARREL_JACK_PINS,
  electrical: {
    operatingVoltage: 'Up to 24V DC (7-12V typical)',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 5000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['External DC Wall Supply Delivery', 'Reverse Polarity Testing'],
    notes: 'Standard 2.1mm center pin positive socket.',
  },
  badge: '2.1mm DC Jack',
  iconName: 'Zap',
  tags: ['barrel-jack', 'dc-jack', 'power', '2.1mm', '5.5mm', 'adapter'],
};

// 6. Breadboard Power Supply Module (MB102 3.3V / 5V)
export const BREADBOARD_PSU_PINS: ComponentPinDefinition[] = [
  // DC Barrel Jack & USB Inputs
  { id: 'DC_IN_POS', name: 'DC Jack In (+)', category: 'power', pinType: 'power', position: { x: -0.65, y: 0.25, z: -0.4 }, voltage: '7-12V' },
  { id: 'DC_IN_GND', name: 'DC Jack In (-)', category: 'ground', pinType: 'ground', position: { x: -0.65, y: 0.25, z: -0.2 }, voltage: '0V' },
  { id: 'USB_5V_OUT', name: 'USB-A 5V Output', category: 'power', pinType: 'power', position: { x: -0.65, y: 0.25, z: 0.3 }, voltage: '5V' },
  // Rail Output Pins (plugs into breadboard power rails)
  { id: 'RAIL_TOP_VCC', name: 'Top Rail VCC Out', category: 'power', pinType: 'power', position: { x: 0.55, y: -0.15, z: -0.55 }, voltage: '3.3V or 5V', description: 'Selectable via jumper' },
  { id: 'RAIL_TOP_GND', name: 'Top Rail GND Out', category: 'ground', pinType: 'ground', position: { x: 0.55, y: -0.15, z: -0.4 }, voltage: '0V' },
  { id: 'RAIL_BOT_VCC', name: 'Bottom Rail VCC Out', category: 'power', pinType: 'power', position: { x: 0.55, y: -0.15, z: 0.4 }, voltage: '3.3V or 5V', description: 'Selectable via jumper' },
  { id: 'RAIL_BOT_GND', name: 'Bottom Rail GND Out', category: 'ground', pinType: 'ground', position: { x: 0.55, y: -0.15, z: 0.55 }, voltage: '0V' },
];

export const BREADBOARD_PSU_DEFINITION: HardwareComponentDefinition = {
  id: 'breadboard_psu_module',
  type: 'breadboard_psu_module',
  name: 'Breadboard Power Supply Module (MB102, 3.3V / 5V)',
  category: 'connectors_accessories',
  subcategory: 'Power Accessories',
  description: 'Plug-in dual voltage regulator module for full-size and half-size solderless breadboards with independent 3.3V/5V rail jumpers, push button power switch, DC barrel input, and USB power output.',
  manufacturer: 'Generic / MB-102',
  boardFamily: 'Power Supply',
  modelFactoryId: 'breadboard_psu_module',
  dimensions: { widthMm: 53.0, heightMm: 15.0, depthMm: 35.0, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#1e293b', // Black PCB with green power LED
  pins: BREADBOARD_PSU_PINS,
  electrical: {
    operatingVoltage: 'Input: 6.5V - 12V DC; Output: 3.3V or 5V regulated',
    inputVoltageLimit: '6.5V - 12V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 700, // 700mA max on 3.3V/5V rails
    totalCurrentLimitMa: 700,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Breadboard Rail Power Injection', '3.3V / 5V Jumper Selection', 'Latching Power Toggle'],
    notes: 'Plugs directly into standard breadboard power rails.',
  },
  datasheetUrl: 'https://www.makerguides.com/mb102-breadboard-power-supply-module/',
  badge: 'Dual 3.3V/5V Rail',
  iconName: 'Zap',
  tags: ['power-supply', 'psu', 'mb102', 'breadboard-power', 'regulator', '3.3v', '5v'],
};

export const ACCESSORIES_DEFINITIONS: HardwareComponentDefinition[] = [
  HEADER_MALE_DEFINITION,
  HEADER_FEMALE_DEFINITION,
  TERMINAL_BLOCK_DEFINITION,
  CONNECTOR_JST_DEFINITION,
  DC_BARREL_JACK_DEFINITION,
  BREADBOARD_PSU_DEFINITION,
];
