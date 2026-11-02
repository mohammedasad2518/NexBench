import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 2 Basic Electronics: Transistors, MOSFETs, and Integrated Circuits
// ============================================================================

// ----------------------------------------------------------------------------
// G. Transistors and MOSFETs (TO-92 and TO-220)
// ----------------------------------------------------------------------------

export const TO92_BJT_PINS: ComponentPinDefinition[] = [
  {
    id: 'EMITTER',
    name: 'Emitter (E) [Pin 1]',
    pinNumber: 1,
    category: 'ground',
    pinType: 'terminal',
    position: { x: -0.06, y: 0.1, z: 0 },
    description: 'Emitter lead (typically connects to GND in NPN common-emitter)',
  },
  {
    id: 'BASE',
    name: 'Base (B) [Pin 2]',
    pinNumber: 2,
    category: 'signal',
    pinType: 'gpio',
    position: { x: 0.0, y: 0.1, z: 0 },
    description: 'Base control terminal (requires series base resistor from MCU GPIO)',
  },
  {
    id: 'COLLECTOR',
    name: 'Collector (C) [Pin 3]',
    pinNumber: 3,
    category: 'power',
    pinType: 'terminal',
    position: { x: 0.06, y: 0.1, z: 0 },
    description: 'Collector terminal (connects to low-side load / motor / relay)',
  },
];

export const TRANSISTOR_NPN_DEFINITION: HardwareComponentDefinition = {
  id: 'transistor_npn',
  type: 'transistor_npn',
  name: 'NPN Bipolar Junction Transistor (2N3904 / 2N2222, TO-92)',
  category: 'basic_electronics',
  subcategory: 'Transistors',
  description: 'Ubiquitous general-purpose NPN switching and small-signal amplifier transistor in classic D-shaped TO-92 plastic package. Emitter-Base-Collector pin arrangement.',
  manufacturer: 'ON Semi / Fairchild / Generic',
  boardFamily: 'Semiconductors',
  modelFactoryId: 'transistor_npn',
  dimensions: { widthMm: 4.8, heightMm: 18.0, depthMm: 3.8, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b', // Matte black epoxy body with flat front
  pins: TO92_BJT_PINS,
  transistorConfig: {
    transistorType: 'npn_bjt',
    packageType: 'to92',
    maxVoltageV: 40,
    maxCurrentA: 0.2,
    pinOrder: ['E', 'B', 'C'],
  },
  electrical: {
    operatingVoltage: 'Vce(max): 40V, Vbe(sat): 0.65V - 0.85V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 200,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Saturated Switch Mode (Digital Buffer)', 'Active Region Current Amplification', 'Low-Side Load Driving'],
    notes: 'Allows an Arduino 5V/3.3V GPIO to safely switch heavier loads.',
  },
  datasheetUrl: 'https://www.onsemi.com/pdf/datasheet/2n3903-d.pdf',
  badge: '2N3904 NPN',
  iconName: 'Zap',
  tags: ['transistor', 'npn', 'bjt', '2n3904', '2n2222', 'to92', 'switch', 'amplifier'],
};

export const TRANSISTOR_PNP_DEFINITION: HardwareComponentDefinition = {
  id: 'transistor_pnp',
  type: 'transistor_pnp',
  name: 'PNP Bipolar Junction Transistor (2N3906, TO-92)',
  category: 'basic_electronics',
  subcategory: 'Transistors',
  description: 'Complementary general-purpose PNP switching and amplifier transistor in TO-92 package. Used for high-side switching, push-pull driver stages, and inverter logic.',
  manufacturer: 'ON Semi / STMicro / Generic',
  boardFamily: 'Semiconductors',
  modelFactoryId: 'transistor_pnp',
  dimensions: { widthMm: 4.8, heightMm: 18.0, depthMm: 3.8, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b',
  pins: TO92_BJT_PINS,
  transistorConfig: {
    transistorType: 'pnp_bjt',
    packageType: 'to92',
    maxVoltageV: 40,
    maxCurrentA: 0.2,
    pinOrder: ['E', 'B', 'C'],
  },
  electrical: {
    operatingVoltage: 'Vce(max): -40V, Vbe: -0.65V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 200,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['High-Side Switching', 'Push-Pull Stage Complement', 'Inverted Logic Drive'],
    notes: 'Conducts when base voltage is pulled lower than emitter voltage.',
  },
  datasheetUrl: 'https://www.onsemi.com/pdf/datasheet/2n3906-d.pdf',
  badge: '2N3906 PNP',
  iconName: 'Zap',
  tags: ['transistor', 'pnp', 'bjt', '2n3906', 'to92', 'high-side', 'switch'],
};

export const TO220_MOSFET_PINS: ComponentPinDefinition[] = [
  {
    id: 'GATE',
    name: 'Gate (G) [Pin 1]',
    pinNumber: 1,
    category: 'signal',
    pinType: 'gpio',
    position: { x: -0.08, y: 0.1, z: 0 },
    description: 'Insulated Gate voltage-controlled input (high impedance)',
  },
  {
    id: 'DRAIN',
    name: 'Drain (D) [Pin 2 / Tab]',
    pinNumber: 2,
    category: 'power',
    pinType: 'terminal',
    position: { x: 0.0, y: 0.1, z: 0 },
    description: 'Drain terminal (connected internally to metal heatsink tab)',
  },
  {
    id: 'SOURCE',
    name: 'Source (S) [Pin 3]',
    pinNumber: 3,
    category: 'ground',
    pinType: 'terminal',
    position: { x: 0.08, y: 0.1, z: 0 },
    description: 'Source return terminal connects to ground / power rail',
  },
];

export const MOSFET_N_CHANNEL_DEFINITION: HardwareComponentDefinition = {
  id: 'mosfet_n_channel',
  type: 'mosfet_n_channel',
  name: 'N-Channel Power MOSFET (IRF540N, 100V 33A, TO-220)',
  category: 'basic_electronics',
  subcategory: 'Transistors',
  description: 'High-current N-channel enhancement-mode HEXFET power MOSFET in heavy-duty TO-220 package with metal mounting tab. Extremely low RDS(on) for driving high-power DC motors and solenoids.',
  manufacturer: 'Infineon / International Rectifier / Generic',
  boardFamily: 'Power MOSFET',
  modelFactoryId: 'mosfet_n_channel',
  dimensions: { widthMm: 10.0, heightMm: 29.0, depthMm: 4.5, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#18181b', // Black molding with shiny metal heatsink tab
  pins: TO220_MOSFET_PINS,
  transistorConfig: {
    transistorType: 'n_channel_mosfet',
    packageType: 'to220',
    maxVoltageV: 100,
    maxCurrentA: 33,
    pinOrder: ['G', 'D', 'S'],
  },
  electrical: {
    operatingVoltage: 'Vds(max): 100V, Vgs(th): 2.0V - 4.0V, Rds(on): 44mΩ',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 33000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Voltage-Controlled PWM Motor Driver', 'Ultra-Low Rds(on) Conduction', 'High-Power Load Switching'],
    notes: 'Gate-controlled low-side driver for heavy DC robotics gearmotors.',
  },
  datasheetUrl: 'https://www.infineon.com/dgdl/irf540n.pdf?fileId=5546d462533600a4015355e396b3199c',
  badge: 'IRF540N 33A',
  iconName: 'Zap',
  tags: ['mosfet', 'n-channel', 'irf540n', 'to220', 'power', 'motor-driver', 'heatsink'],
};

export const MOSFET_P_CHANNEL_DEFINITION: HardwareComponentDefinition = {
  id: 'mosfet_p_channel',
  type: 'mosfet_p_channel',
  name: 'P-Channel Power MOSFET (IRF9540, -100V -23A, TO-220)',
  category: 'basic_electronics',
  subcategory: 'Transistors',
  description: 'High-power P-channel enhancement-mode MOSFET in TO-220 package. Used for high-side power supply switching, reverse battery protection, and H-bridge upper arms.',
  manufacturer: 'Vishay / Infineon / Generic',
  boardFamily: 'Power MOSFET',
  modelFactoryId: 'mosfet_p_channel',
  dimensions: { widthMm: 10.0, heightMm: 29.0, depthMm: 4.5, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#18181b',
  pins: TO220_MOSFET_PINS,
  transistorConfig: {
    transistorType: 'p_channel_mosfet',
    packageType: 'to220',
    maxVoltageV: 100,
    maxCurrentA: 23,
    pinOrder: ['G', 'D', 'S'],
  },
  electrical: {
    operatingVoltage: 'Vds(max): -100V, Vgs(th): -2.0V - -4.0V, Rds(on): 117mΩ',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 23000,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['High-Side Power Bus Control', 'H-Bridge Upper Bridge Driver'],
    notes: 'Turns ON when gate voltage is pulled significantly below source voltage.',
  },
  datasheetUrl: 'https://www.vishay.com/docs/91078/91078.pdf',
  badge: 'IRF9540 -23A',
  iconName: 'Zap',
  tags: ['mosfet', 'p-channel', 'irf9540', 'to220', 'high-side', 'power'],
};

// ----------------------------------------------------------------------------
// J. Integrated Circuits (Generic DIP, OpAmp, Logic Gate, Optocoupler)
// ----------------------------------------------------------------------------

export const OPAMP_LM358_PINS: ComponentPinDefinition[] = [
  { id: 'PIN_1', name: 'OUT1 (Output 1)', pinNumber: 1, category: 'signal', pinType: 'analog_out', position: { x: -0.15, y: 0.1, z: -0.15 } },
  { id: 'PIN_2', name: 'IN1- (Inverting 1)', pinNumber: 2, category: 'signal', pinType: 'analog_in', position: { x: -0.05, y: 0.1, z: -0.15 } },
  { id: 'PIN_3', name: 'IN1+ (Non-Inverting 1)', pinNumber: 3, category: 'signal', pinType: 'analog_in', position: { x: 0.05, y: 0.1, z: -0.15 } },
  { id: 'PIN_4', name: 'GND (Negative Supply)', pinNumber: 4, category: 'ground', pinType: 'ground', position: { x: 0.15, y: 0.1, z: -0.15 } },
  { id: 'PIN_5', name: 'IN2+ (Non-Inverting 2)', pinNumber: 5, category: 'signal', pinType: 'analog_in', position: { x: 0.15, y: 0.1, z: 0.15 } },
  { id: 'PIN_6', name: 'IN2- (Inverting 2)', pinNumber: 6, category: 'signal', pinType: 'analog_in', position: { x: 0.05, y: 0.1, z: 0.15 } },
  { id: 'PIN_7', name: 'OUT2 (Output 2)', pinNumber: 7, category: 'signal', pinType: 'analog_out', position: { x: -0.05, y: 0.1, z: 0.15 } },
  { id: 'PIN_8', name: 'VCC (Positive Supply)', pinNumber: 8, category: 'power', pinType: 'power', position: { x: -0.15, y: 0.1, z: 0.15 } },
];

export const IC_OPAMP_DEFINITION: HardwareComponentDefinition = {
  id: 'ic_opamp',
  type: 'ic_opamp',
  name: 'Dual Operational Amplifier IC (LM358, DIP-8)',
  category: 'basic_electronics',
  subcategory: 'Integrated Circuits',
  description: 'Classic dual independent high-gain frequency-compensated operational amplifier in standard 8-pin DIP package. Features single or dual power supply operation down to ground.',
  manufacturer: 'Texas Instruments / ST / Generic',
  boardFamily: 'Analog ICs',
  modelFactoryId: 'ic_opamp',
  dimensions: { widthMm: 9.3, heightMm: 7.2, depthMm: 8.5, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b', // Black DIP-8 epoxy body with pin-1 notch
  pins: OPAMP_LM358_PINS,
  icConfig: {
    packageType: 'dip8',
    pinCount: 8,
    pinLabels: {
      1: 'OUT1', 2: 'IN1-', 3: 'IN1+', 4: 'GND',
      5: 'IN2+', 6: 'IN2-', 7: 'OUT2', 8: 'VCC'
    },
    family: 'LM358',
  },
  electrical: {
    operatingVoltage: 'Single supply: 3V - 32V DC; Dual: ±1.5V - ±16V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 40,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Comparator Differential Detection', 'Voltage Follower / Unity Gain Buffer', 'Analog Signal Amplification'],
    notes: 'LM358 standard pinout. Configurable in inverting, non-inverting, or comparator topology.',
  },
  datasheetUrl: 'https://www.ti.com/lit/ds/symlink/lm358.pdf',
  badge: 'LM358 DIP-8',
  iconName: 'Cpu',
  tags: ['opamp', 'lm358', 'dual-opamp', 'dip8', 'amplifier', 'comparator', 'analog'],
};

export const LOGIC_7400_PINS: ComponentPinDefinition[] = [
  { id: 'PIN_1', name: '1A (Gate 1 In A)', pinNumber: 1, category: 'signal', pinType: 'gpio', position: { x: -0.3, y: 0.1, z: -0.15 } },
  { id: 'PIN_2', name: '1B (Gate 1 In B)', pinNumber: 2, category: 'signal', pinType: 'gpio', position: { x: -0.2, y: 0.1, z: -0.15 } },
  { id: 'PIN_3', name: '1Y (Gate 1 Out)', pinNumber: 3, category: 'signal', pinType: 'gpio', position: { x: -0.1, y: 0.1, z: -0.15 } },
  { id: 'PIN_4', name: '2A (Gate 2 In A)', pinNumber: 4, category: 'signal', pinType: 'gpio', position: { x: 0.0, y: 0.1, z: -0.15 } },
  { id: 'PIN_5', name: '2B (Gate 2 In B)', pinNumber: 5, category: 'signal', pinType: 'gpio', position: { x: 0.1, y: 0.1, z: -0.15 } },
  { id: 'PIN_6', name: '2Y (Gate 2 Out)', pinNumber: 6, category: 'signal', pinType: 'gpio', position: { x: 0.2, y: 0.1, z: -0.15 } },
  { id: 'PIN_7', name: 'GND (Ground)', pinNumber: 7, category: 'ground', pinType: 'ground', position: { x: 0.3, y: 0.1, z: -0.15 } },
  { id: 'PIN_8', name: '3Y (Gate 3 Out)', pinNumber: 8, category: 'signal', pinType: 'gpio', position: { x: 0.3, y: 0.1, z: 0.15 } },
  { id: 'PIN_9', name: '3A (Gate 3 In A)', pinNumber: 9, category: 'signal', pinType: 'gpio', position: { x: 0.2, y: 0.1, z: 0.15 } },
  { id: 'PIN_10', name: '3B (Gate 3 In B)', pinNumber: 10, category: 'signal', pinType: 'gpio', position: { x: 0.1, y: 0.1, z: 0.15 } },
  { id: 'PIN_11', name: '4Y (Gate 4 Out)', pinNumber: 11, category: 'signal', pinType: 'gpio', position: { x: 0.0, y: 0.1, z: 0.15 } },
  { id: 'PIN_12', name: '4A (Gate 4 In A)', pinNumber: 12, category: 'signal', pinType: 'gpio', position: { x: -0.1, y: 0.1, z: 0.15 } },
  { id: 'PIN_13', name: '4B (Gate 4 In B)', pinNumber: 13, category: 'signal', pinType: 'gpio', position: { x: -0.2, y: 0.1, z: 0.15 } },
  { id: 'PIN_14', name: 'VCC (Power Supply)', pinNumber: 14, category: 'power', pinType: 'power', position: { x: -0.3, y: 0.1, z: 0.15 } },
];

export const IC_LOGIC_GATE_DEFINITION: HardwareComponentDefinition = {
  id: 'ic_logic_gate',
  type: 'ic_logic_gate',
  name: 'Quad 2-Input NAND Gate IC (74HC00, DIP-14)',
  category: 'basic_electronics',
  subcategory: 'Integrated Circuits',
  description: 'Standard 7400-series high-speed CMOS quadruple 2-input NAND gate IC in 14-pin DIP package. Universal logic gate capable of constructing any Boolean logic function.',
  manufacturer: 'Texas Instruments / Nexperia / Generic',
  boardFamily: '7400 Series Logic',
  modelFactoryId: 'ic_logic_gate',
  dimensions: { widthMm: 19.3, heightMm: 7.2, depthMm: 8.5, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b',
  pins: LOGIC_7400_PINS,
  icConfig: {
    packageType: 'dip14',
    pinCount: 14,
    pinLabels: {
      1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
      8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC'
    },
    family: '74HC00',
  },
  electrical: {
    operatingVoltage: '2.0V - 6.0V DC (Standard 5.0V TTL/CMOS)',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 25,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['7400 Truth Table Evaluation (Y = NOT(A AND B))', 'Digital Pin State Routing'],
    notes: 'Standard 14-pin DIP configuration with Pin-1 notch and dot.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/7400-series_integrated_circuits',
  badge: '74HC00 DIP-14',
  iconName: 'Cpu',
  tags: ['logic-gate', '74hc00', '7400', 'nand', 'dip14', 'digital-logic', 'ttl', 'cmos'],
};

export const OPTOCOUPLER_PC817_PINS: ComponentPinDefinition[] = [
  { id: 'ANODE', name: 'Pin 1: Anode (IR LED +)', pinNumber: 1, category: 'power', pinType: 'gpio', position: { x: -0.06, y: 0.1, z: -0.15 } },
  { id: 'CATHODE', name: 'Pin 2: Cathode (IR LED -)', pinNumber: 2, category: 'ground', pinType: 'ground', position: { x: 0.06, y: 0.1, z: -0.15 } },
  { id: 'EMITTER', name: 'Pin 3: Emitter (Phototransistor)', pinNumber: 3, category: 'ground', pinType: 'terminal', position: { x: 0.06, y: 0.1, z: 0.15 } },
  { id: 'COLLECTOR', name: 'Pin 4: Collector (Phototransistor)', pinNumber: 4, category: 'power', pinType: 'terminal', position: { x: -0.06, y: 0.1, z: 0.15 } },
];

export const IC_OPTOCOUPLER_DEFINITION: HardwareComponentDefinition = {
  id: 'ic_optocoupler',
  type: 'ic_optocoupler',
  name: 'Optical Isolator / Optocoupler IC (PC817 / 4N35, DIP-4)',
  category: 'basic_electronics',
  subcategory: 'Integrated Circuits',
  description: 'High-isolation 4-pin DIP photocoupler containing an infrared emitting diode optically coupled to a phototransistor. Provides 5,000Vrms galvanic isolation between low-voltage microcontrollers and noisy inductive motor circuits.',
  manufacturer: 'Sharp / Everlight / Generic',
  boardFamily: 'Optocouplers',
  modelFactoryId: 'ic_optocoupler',
  dimensions: { widthMm: 6.5, heightMm: 7.2, depthMm: 8.5, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b',
  pins: OPTOCOUPLER_PC817_PINS,
  icConfig: {
    packageType: 'dip4',
    pinCount: 4,
    pinLabels: {
      1: 'Anode', 2: 'Cathode', 3: 'Emitter', 4: 'Collector'
    },
    family: 'PC817',
  },
  electrical: {
    operatingVoltage: 'Input: 1.2V - 1.4V (20mA); Output: Vceo 35V / 80V',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 50,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Galvanic Optical Isolation', 'LED-Activated Phototransistor Switch', 'Noise Barrier'],
    notes: 'Input current through Pin 1-2 optically closes Pin 3-4 phototransistor.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Opto-isolator',
  badge: '5000Vrms Isolator',
  iconName: 'Cpu',
  tags: ['optocoupler', 'pc817', '4n35', 'isolator', 'optical', 'galvanic', 'dip4'],
};

// Generic DIP IC (configurable pin counts: 8, 14, 16, 28)
function generateGenericDipPins(pinCount: number): ComponentPinDefinition[] {
  const pins: ComponentPinDefinition[] = [];
  const half = pinCount / 2;
  const xPitch = 0.08;
  const xStart = -((half - 1) * xPitch) / 2;

  // Left row: pins 1 to half
  for (let i = 1; i <= half; i++) {
    pins.push({
      id: `PIN_${i}`,
      name: `Pin ${i}`,
      pinNumber: i,
      category: 'signal',
      pinType: 'gpio',
      position: { x: xStart + (i - 1) * xPitch, y: 0.1, z: -0.15 },
      description: `Configurable DIP pin ${i}`,
    });
  }

  // Right row: pins half+1 to pinCount (running reverse direction)
  for (let i = 1; i <= half; i++) {
    const pinNum = half + i;
    pins.push({
      id: `PIN_${pinNum}`,
      name: `Pin ${pinNum}`,
      pinNumber: pinNum,
      category: 'signal',
      pinType: 'gpio',
      position: { x: -xStart - (i - 1) * xPitch, y: 0.1, z: 0.15 },
      description: `Configurable DIP pin ${pinNum}`,
    });
  }

  return pins;
}

export const IC_DIP_GENERIC_PINS = generateGenericDipPins(16);

export const IC_DIP_GENERIC_DEFINITION: HardwareComponentDefinition = {
  id: 'ic_dip_generic',
  type: 'ic_dip_generic',
  name: 'Generic Dual In-Line Package IC (DIP 8/14/16/28)',
  category: 'basic_electronics',
  subcategory: 'Integrated Circuits',
  description: 'Customizable Dual In-Line Package (DIP) IC with configurable pin count (8, 14, 16, or 28 pins), Pin-1 notch, Pin-1 index dot, and user-definable pin labels.',
  manufacturer: 'Generic / Customizable',
  boardFamily: 'DIP ICs',
  modelFactoryId: 'ic_dip_generic',
  dimensions: { widthMm: 19.3, heightMm: 7.2, depthMm: 8.5, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#18181b',
  pins: IC_DIP_GENERIC_PINS,
  icConfig: {
    packageType: 'dip16',
    pinCount: 16,
    pinLabels: {
      1: 'Pin 1', 2: 'Pin 2', 3: 'Pin 3', 4: 'Pin 4',
      5: 'Pin 5', 6: 'Pin 6', 7: 'Pin 7', 8: 'GND',
      9: 'Pin 9', 10: 'Pin 10', 11: 'Pin 11', 12: 'Pin 12',
      13: 'Pin 13', 14: 'Pin 14', 15: 'Pin 15', 16: 'VCC'
    },
    isConfigurable: true,
  },
  electrical: {
    operatingVoltage: 'User Configurable (typically 3.3V or 5V)',
    logicLevel: '5.0V',
    maxCurrentPerPinMa: 25,
  },
  simulation: {
    level: 'pin_mapping',
    supportedFeatures: ['Configurable Pin Count (8, 14, 16, 28)', 'Custom Pin Names', 'Wiring Harness Graph Mapping'],
    notes: 'Pin count and labels can be customized in the Properties panel.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Dual_in-line_package',
  badge: 'DIP Configurable',
  iconName: 'Cpu',
  tags: ['ic', 'dip', 'generic', 'custom', 'dual-inline', 'chip', 'dip8', 'dip14', 'dip16', 'dip28'],
};

export const SEMICONDUCTORS_DEFINITIONS: HardwareComponentDefinition[] = [
  TRANSISTOR_NPN_DEFINITION,
  TRANSISTOR_PNP_DEFINITION,
  MOSFET_N_CHANNEL_DEFINITION,
  MOSFET_P_CHANNEL_DEFINITION,
  IC_OPAMP_DEFINITION,
  IC_LOGIC_GATE_DEFINITION,
  IC_OPTOCOUPLER_DEFINITION,
  IC_DIP_GENERIC_DEFINITION,
];
