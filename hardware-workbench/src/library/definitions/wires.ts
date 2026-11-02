import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 1 Wires & Cables: 10 Structured Definitions
// ============================================================================

export const WIRE_M2M_PINS: ComponentPinDefinition[] = [
  { id: 'PIN_A', name: 'Pin End A (Male 2.54mm)', category: 'signal', pinType: 'terminal', position: { x: -0.8, y: 0.1, z: 0 }, description: 'Square DuPont male pin' },
  { id: 'PIN_B', name: 'Pin End B (Male 2.54mm)', category: 'signal', pinType: 'terminal', position: { x: 0.8, y: 0.1, z: 0 }, description: 'Square DuPont male pin' },
];

export const WIRE_M2M_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_m2m',
  type: 'wire_m2m',
  name: 'Male-to-Male Jumper Wire (20cm)',
  category: 'wires_cables',
  subcategory: 'DuPont Jumper Wires',
  description: 'Flexible 26 AWG insulated copper jumper wire with standard 0.1" (2.54mm) square male DuPont pins on both ends. Ideal for breadboards and Arduino headers.',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'wire_m2m',
  dimensions: { widthMm: 200.0, heightMm: 3.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#ef4444', // Red default
  pins: WIRE_M2M_PINS,
  wireConfig: {
    wireType: 'jumper',
    gaugeAwg: 26,
    connectorTypeA: 'male_dupont',
    connectorTypeB: 'male_dupont',
    isPhysicalCableObject: true,
    defaultLengthMm: 200,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Terminal-to-Terminal Connection', 'Bezier Curve Routing', 'Color Selection', 'Circuit Graph Evaluation'],
    notes: 'Directly supported by the interactive wiring system and circuit evaluator.',
  },
  badge: 'Male-to-Male',
  iconName: 'Cable',
  tags: ['wire', 'jumper', 'm2m', 'dupont', 'cable', 'breadboard'],
};

export const WIRE_M2F_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_m2f',
  type: 'wire_m2f',
  name: 'Male-to-Female Jumper Wire (20cm)',
  category: 'wires_cables',
  subcategory: 'DuPont Jumper Wires',
  description: 'Jumper wire with a male 2.54mm pin on one end and a female DuPont socket on the other. Connects breadboards directly to sensor header pins.',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'wire_m2f',
  dimensions: { widthMm: 200.0, heightMm: 3.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#3b82f6', // Blue default
  pins: [
    { id: 'PIN_MALE', name: 'Male Pin End (2.54mm)', category: 'signal', pinType: 'terminal', position: { x: -0.8, y: 0.1, z: 0 } },
    { id: 'SOCKET_FEMALE', name: 'Female Socket End (2.54mm)', category: 'signal', pinType: 'terminal', position: { x: 0.8, y: 0.1, z: 0 } },
  ],
  wireConfig: {
    wireType: 'jumper',
    gaugeAwg: 26,
    connectorTypeA: 'male_dupont',
    connectorTypeB: 'female_dupont',
    isPhysicalCableObject: true,
    defaultLengthMm: 200,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Terminal-to-Terminal Connection', 'Circuit Evaluation'],
    notes: 'Connects male pins to female headers in the virtual wiring engine.',
  },
  badge: 'Male-to-Female',
  iconName: 'Cable',
  tags: ['wire', 'jumper', 'm2f', 'dupont', 'socket'],
};

export const WIRE_F2F_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_f2f',
  type: 'wire_f2f',
  name: 'Female-to-Female Jumper Wire (20cm)',
  category: 'wires_cables',
  subcategory: 'DuPont Jumper Wires',
  description: 'Jumper wire with female 2.54mm DuPont receptacle sockets on both ends. Connects male header pins together (e.g. board-to-sensor or motor driver).',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'wire_f2f',
  dimensions: { widthMm: 200.0, heightMm: 3.0, depthMm: 3.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#10b981', // Green default
  pins: [
    { id: 'SOCKET_A', name: 'Female Socket A (2.54mm)', category: 'signal', pinType: 'terminal', position: { x: -0.8, y: 0.1, z: 0 } },
    { id: 'SOCKET_B', name: 'Female Socket B (2.54mm)', category: 'signal', pinType: 'terminal', position: { x: 0.8, y: 0.1, z: 0 } },
  ],
  wireConfig: {
    wireType: 'jumper',
    gaugeAwg: 26,
    connectorTypeA: 'female_dupont',
    connectorTypeB: 'female_dupont',
    isPhysicalCableObject: true,
    defaultLengthMm: 200,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Terminal-to-Terminal Connection', 'Circuit Evaluation'],
    notes: 'Connects two male headers.',
  },
  badge: 'Female-to-Female',
  iconName: 'Cable',
  tags: ['wire', 'jumper', 'f2f', 'dupont', 'header-to-header'],
};

export const WIRE_SOLID_CORE_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_solid_core',
  type: 'wire_solid_core',
  name: 'Single Solid-Core Hookup Wire (22 AWG)',
  category: 'wires_cables',
  subcategory: 'Solid Hookup Wires',
  description: 'Rigid single-strand 22 AWG tinned copper wire with stripped ends. Sits flush and neat against solderless breadboards and perfboards.',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'wire_solid_core',
  dimensions: { widthMm: 100.0, heightMm: 1.5, depthMm: 1.5, unit: 'mm' },
  defaultScale: { x: 0.8, y: 0.8, z: 0.8 },
  defaultColor: '#eab308', // Yellow
  pins: [
    { id: 'END_A', name: 'Stripped End A', category: 'signal', pinType: 'terminal', position: { x: -0.6, y: 0.05, z: 0 } },
    { id: 'END_B', name: 'Stripped End B', category: 'signal', pinType: 'terminal', position: { x: 0.6, y: 0.05, z: 0 } },
  ],
  wireConfig: {
    wireType: 'solid_core',
    gaugeAwg: 22,
    connectorTypeA: 'stripped',
    connectorTypeB: 'stripped',
    isPhysicalCableObject: true,
    defaultLengthMm: 100,
  },
  electrical: {
    operatingVoltage: 'Up to 300V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Flush Breadboard Routing', 'Direct Connection'],
    notes: 'Low resistance solid copper conductor.',
  },
  badge: '22 AWG Solid',
  iconName: 'Cable',
  tags: ['wire', 'solid-core', '22awg', 'hookup', 'flush-routing'],
};

export const WIRE_MULTICOLOR_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_multicolor',
  type: 'wire_multicolor',
  name: 'Multicolor Jumper Wire Ribbon (10-Wire)',
  category: 'wires_cables',
  subcategory: 'DuPont Jumper Wires',
  description: '10-conductor peelable rainbow flat ribbon jumper wire bundle for organized multi-signal bus routing.',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'wire_multicolor',
  dimensions: { widthMm: 200.0, heightMm: 4.0, depthMm: 14.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#f97316',
  pins: Array.from({ length: 10 }, (_, i) => ({
    id: `BUS_PIN_${i + 1}`,
    name: `Conductor ${i + 1}`,
    category: 'signal' as const,
    pinType: 'terminal' as const,
    position: { x: -0.8 + i * 0.16, y: 0.1, z: 0 },
  })),
  wireConfig: {
    wireType: 'ribbon',
    gaugeAwg: 28,
    connectorTypeA: 'male_dupont',
    connectorTypeB: 'female_dupont',
    isPhysicalCableObject: true,
    defaultLengthMm: 200,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 500,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Multi-signal Bus Routing'],
    notes: '10-wire bundled jumper ribbon.',
  },
  badge: '10-Pin Rainbow',
  iconName: 'Cable',
  tags: ['rainbow', 'ribbon', 'multicolor', 'bundle', 'bus'],
};

export const CABLE_RIBBON_DEFINITION: HardwareComponentDefinition = {
  id: 'cable_ribbon',
  type: 'cable_ribbon',
  name: 'IDC Flat Ribbon Cable (16-Pin)',
  category: 'wires_cables',
  subcategory: 'Ribbon Cables',
  description: '16-conductor 0.05" pitch flat gray ribbon cable terminated with 2x8 0.1" (2.54mm) female IDC socket connectors and polarizing key.',
  manufacturer: 'Generic',
  boardFamily: 'Interconnect',
  modelFactoryId: 'cable_ribbon',
  dimensions: { widthMm: 150.0, heightMm: 6.0, depthMm: 24.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#94a3b8', // Gray ribbon
  pins: [
    { id: 'IDC_A', name: 'IDC Socket Header A', category: 'signal', pinType: 'terminal', position: { x: -0.7, y: 0.15, z: 0 } },
    { id: 'IDC_B', name: 'IDC Socket Header B', category: 'signal', pinType: 'terminal', position: { x: 0.7, y: 0.15, z: 0 } },
  ],
  wireConfig: {
    wireType: 'ribbon',
    gaugeAwg: 28,
    connectorTypeA: 'female_dupont',
    connectorTypeB: 'female_dupont',
    isPhysicalCableObject: true,
    defaultLengthMm: 150,
  },
  electrical: {
    operatingVoltage: '300V RMS',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Physical Cable Staging', 'Parallel Bus Representation'],
    notes: 'Visual CAD model of standard 16-pin IDC ribbon.',
  },
  badge: '16-Pin IDC',
  iconName: 'Cable',
  tags: ['ribbon', 'idc', 'flat-cable', 'gray', 'parallel'],
};

export const CABLE_USB_AB_DEFINITION: HardwareComponentDefinition = {
  id: 'cable_usb_ab',
  type: 'cable_usb_ab',
  name: 'USB 2.0 Cable (Type-A to Type-B)',
  category: 'wires_cables',
  subcategory: 'USB & Data Cables',
  description: 'Standard USB-A to square USB-B peripheral cable used for powering and programming the Arduino Uno R3 and Arduino Mega 2560.',
  manufacturer: 'Generic',
  boardFamily: 'Cable',
  modelFactoryId: 'cable_usb_ab',
  dimensions: { widthMm: 500.0, heightMm: 12.0, depthMm: 16.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#0284c7', // Translucent Arduino blue
  pins: [
    { id: 'USB_A_PLUG', name: 'USB-A Plug (PC Host)', category: 'power', pinType: 'terminal', position: { x: -0.8, y: 0.15, z: 0 }, voltage: '5V' },
    { id: 'USB_B_PLUG', name: 'USB-B Plug (Arduino Uno/Mega)', category: 'power', pinType: 'terminal', position: { x: 0.8, y: 0.15, z: 0 }, voltage: '5V' },
  ],
  wireConfig: {
    wireType: 'usb',
    gaugeAwg: 28,
    connectorTypeA: 'usb_a',
    connectorTypeB: 'usb_b',
    isPhysicalCableObject: true,
    defaultLengthMm: 500,
  },
  electrical: {
    operatingVoltage: '5V DC',
    logicLevel: '3.3V',
    maxCurrentPerPinMa: 500,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['5V Host Power Delivery', 'Arduino Programming Uplink'],
    notes: 'Powers connected Arduino Uno / Mega boards.',
  },
  badge: 'USB-A to USB-B',
  iconName: 'Cable',
  tags: ['usb', 'usb-b', 'cable', 'uno-cable', 'mega-cable', 'printer'],
};

export const CABLE_MICRO_USB_DEFINITION: HardwareComponentDefinition = {
  id: 'cable_micro_usb',
  type: 'cable_micro_usb',
  name: 'Micro-USB Cable (Type-A to Micro-B)',
  category: 'wires_cables',
  subcategory: 'USB & Data Cables',
  description: 'Slim USB-A to Micro-USB 2.0 data/charge cable compatible with NodeMCU, ESP32 DevKit, Raspberry Pi Pico, and STM32 Blue Pill.',
  manufacturer: 'Generic',
  boardFamily: 'Cable',
  modelFactoryId: 'cable_micro_usb',
  dimensions: { widthMm: 500.0, heightMm: 8.0, depthMm: 14.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#1e293b', // Black molded PVC
  pins: [
    { id: 'USB_A_HOST', name: 'USB-A Plug (Host)', category: 'power', pinType: 'terminal', position: { x: -0.7, y: 0.12, z: 0 }, voltage: '5V' },
    { id: 'MICRO_B_PLUG', name: 'Micro-USB Plug (Board)', category: 'power', pinType: 'terminal', position: { x: 0.7, y: 0.12, z: 0 }, voltage: '5V' },
  ],
  wireConfig: {
    wireType: 'usb',
    gaugeAwg: 28,
    connectorTypeA: 'usb_a',
    connectorTypeB: 'micro_usb',
    isPhysicalCableObject: true,
    defaultLengthMm: 500,
  },
  electrical: {
    operatingVoltage: '5V DC',
    logicLevel: '3.3V',
    maxCurrentPerPinMa: 2000,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['5V USB Power Supply', 'Serial Data Link'],
    notes: 'Power and data connection for ESP32 and RP2040.',
  },
  badge: 'Micro-USB',
  iconName: 'Cable',
  tags: ['usb', 'micro-usb', 'cable', 'esp32-cable', 'pico-cable'],
};

export const CABLE_USB_C_DEFINITION: HardwareComponentDefinition = {
  id: 'cable_usb_c',
  type: 'cable_usb_c',
  name: 'USB-C Cable (Type-C to Type-C / Type-A)',
  category: 'wires_cables',
  subcategory: 'USB & Data Cables',
  description: 'Reversible high-speed USB-C cable for high-current power delivery (up to 3A @ 5V) to modern single-board computers like the Raspberry Pi 4.',
  manufacturer: 'Generic',
  boardFamily: 'Cable',
  modelFactoryId: 'cable_usb_c',
  dimensions: { widthMm: 500.0, heightMm: 7.0, depthMm: 12.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#f8fafc', // White silicone
  pins: [
    { id: 'USB_C_END_1', name: 'USB-C Connector 1', category: 'power', pinType: 'terminal', position: { x: -0.7, y: 0.12, z: 0 }, voltage: '5V' },
    { id: 'USB_C_END_2', name: 'USB-C Connector 2', category: 'power', pinType: 'terminal', position: { x: 0.7, y: 0.12, z: 0 }, voltage: '5V' },
  ],
  wireConfig: {
    wireType: 'usb',
    gaugeAwg: 24, // 24 AWG power conductors for 3A delivery
    connectorTypeA: 'usb_c',
    connectorTypeB: 'usb_c',
    isPhysicalCableObject: true,
    defaultLengthMm: 500,
  },
  electrical: {
    operatingVoltage: '5V - 20V DC (USB-PD)',
    logicLevel: '3.3V',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['5V 3A Power Delivery', 'Fast USB 3.0 Telemetry'],
    notes: 'Powers Raspberry Pi 4 Model B.',
  },
  badge: 'USB-C 3A',
  iconName: 'Cable',
  tags: ['usb', 'usb-c', 'type-c', 'rpi4-power', 'fast-charge'],
};

export const WIRE_ALLIGATOR_DEFINITION: HardwareComponentDefinition = {
  id: 'wire_alligator',
  type: 'wire_alligator',
  name: 'Alligator Clip Test Lead (50cm)',
  category: 'wires_cables',
  subcategory: 'Test Leads',
  description: 'Flexible 22 AWG copper test wire with spring-loaded nickel-plated steel alligator clips and color-coded protective vinyl insulation boots.',
  manufacturer: 'Generic',
  boardFamily: 'Test Equipment',
  modelFactoryId: 'wire_alligator',
  dimensions: { widthMm: 300.0, heightMm: 8.0, depthMm: 8.0, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#10b981', // Green alligator boot
  pins: [
    { id: 'CLIP_A', name: 'Alligator Clip Jaw A', category: 'signal', pinType: 'terminal', position: { x: -0.85, y: 0.12, z: 0 } },
    { id: 'CLIP_B', name: 'Alligator Clip Jaw B', category: 'signal', pinType: 'terminal', position: { x: 0.85, y: 0.12, z: 0 } },
  ],
  wireConfig: {
    wireType: 'alligator',
    gaugeAwg: 22,
    connectorTypeA: 'alligator_clip',
    connectorTypeB: 'alligator_clip',
    isPhysicalCableObject: true,
    defaultLengthMm: 300,
  },
  electrical: {
    operatingVoltage: 'Up to 30V AC / 60V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 5000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Temporary Circuit Probing', 'Lug Connection'],
    notes: 'Clamps onto motor solder lugs, battery contacts, and test pins.',
  },
  badge: 'Alligator Clip',
  iconName: 'Cable',
  tags: ['alligator', 'clip', 'croc', 'test-lead', 'probe'],
};

export const WIRES_DEFINITIONS: HardwareComponentDefinition[] = [
  WIRE_M2M_DEFINITION,
  WIRE_M2F_DEFINITION,
  WIRE_F2F_DEFINITION,
  WIRE_SOLID_CORE_DEFINITION,
  WIRE_MULTICOLOR_DEFINITION,
  CABLE_RIBBON_DEFINITION,
  CABLE_USB_AB_DEFINITION,
  CABLE_MICRO_USB_DEFINITION,
  CABLE_USB_C_DEFINITION,
  WIRE_ALLIGATOR_DEFINITION,
];
