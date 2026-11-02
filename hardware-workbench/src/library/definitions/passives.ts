import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 2 Basic Electronics: Passives (Resistors, Capacitors, Inductor, Crystal, Fuse)
// ============================================================================

// ----------------------------------------------------------------------------
// A. Resistors and Variable Resistors
// ----------------------------------------------------------------------------

export const FIXED_RESISTOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_A',
    name: 'Lead 1 (Terminal A)',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.22, y: 0.08, z: 0 },
    description: 'Axial tinned copper lead 1 (non-polarized)',
  },
  {
    id: 'TERM_B',
    name: 'Lead 2 (Terminal B)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.22, y: 0.08, z: 0 },
    description: 'Axial tinned copper lead 2 (non-polarized)',
  },
];

export const RESISTOR_FIXED_DEFINITION: HardwareComponentDefinition = {
  id: 'resistor_fixed',
  type: 'resistor_fixed',
  name: 'Through-Hole Fixed Resistor (0.25W 5%)',
  category: 'basic_electronics',
  subcategory: 'Resistors',
  description: 'Standard 1/4W axial leaded metal film/carbon film resistor. Configurable standard EIA decade values from 100Ω to 1MΩ with realistic color band coding.',
  manufacturer: 'Yageo / Vishay / Generic',
  boardFamily: 'Passives',
  modelFactoryId: 'resistor_fixed',
  dimensions: { widthMm: 14.0, heightMm: 2.5, depthMm: 2.5, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#d4b483', // Resistor beige body
  pins: FIXED_RESISTOR_PINS,
  resistorConfig: {
    resistanceOhms: 220,
    tolerancePercent: 5,
    powerRatingWatts: 0.25,
    isVariable: false,
    supportedValues: [100, 220, 330, 470, 1000, 2200, 4700, 10000, 47000, 100000, 1000000],
    colorBands: ['#ef4444', '#ef4444', '#78350f', '#eab308'], // Red, Red, Brown, Gold = 220Ω
  },
  electrical: {
    operatingVoltage: 'Up to 250V RMS',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 150,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Ohmic Resistance', 'LED Current Limiting', 'Voltage Divider', 'Pull-Up/Pull-Down'],
    notes: 'Configurable resistance: 100Ω, 220Ω, 330Ω, 470Ω, 1kΩ, 2.2kΩ, 4.7kΩ, 10kΩ, 47kΩ, 100kΩ, 1MΩ.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Resistor',
  badge: '220Ω 1/4W',
  iconName: 'Zap',
  tags: ['resistor', 'fixed', 'passive', 'axial', 'through-hole', 'ohms', '220ohm', '10k'],
};

export const TRIMPOT_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_1',
    name: 'Terminal 1 (CW End)',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.12, y: 0.08, z: -0.1 },
    description: 'Fixed resistive element endpoint 1',
  },
  {
    id: 'WIPER',
    name: 'Wiper (Adjustable)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.0, y: 0.08, z: 0.1 },
    description: 'Variable wiper contact connected to adjustment screw',
  },
  {
    id: 'TERM_2',
    name: 'Terminal 2 (CCW End)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.12, y: 0.08, z: -0.1 },
    description: 'Fixed resistive element endpoint 2',
  },
];

export const RESISTOR_VARIABLE_DEFINITION: HardwareComponentDefinition = {
  id: 'resistor_variable',
  type: 'resistor_variable',
  name: 'Cermet Trimpot / Variable Resistor (10kΩ)',
  category: 'basic_electronics',
  subcategory: 'Resistors',
  description: 'Precision 3-pin cermet trimming potentiometer with top screwdriver adjustment. Used for calibration, sensor threshold tuning, and analog reference adjustment.',
  manufacturer: 'Bourns / Generic',
  boardFamily: 'Passives',
  modelFactoryId: 'resistor_variable',
  dimensions: { widthMm: 9.5, heightMm: 10.0, depthMm: 5.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#2563eb', // Bourns Blue casing
  pins: TRIMPOT_PINS,
  resistorConfig: {
    resistanceOhms: 10000,
    tolerancePercent: 10,
    powerRatingWatts: 0.5,
    isVariable: true,
  },
  electrical: {
    operatingVoltage: 'Up to 200V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 100,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Adjustable Wiper Ratio (0-100%)', 'Analog Voltage Division', 'Tuning Trimmer'],
    notes: 'Interactive screw adjustment updates wiper voltage continuously.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Trimmer_(electronics)',
  badge: '10kΩ Trimpot',
  iconName: 'Sliders',
  tags: ['trimpot', 'variable', 'potentiometer', 'resistor', 'trimmer', '10k', 'bourns'],
};

export const ROTARY_POTENTIOMETER_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_1',
    name: 'Terminal 1 (GND / Min)',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.15, y: 0.12, z: -0.15 },
    description: 'Resistive track start terminal (CCW limit)',
  },
  {
    id: 'WIPER',
    name: 'Wiper (Analog Output)',
    category: 'analog',
    pinType: 'analog_out',
    position: { x: 0.0, y: 0.12, z: -0.15 },
    description: 'Rotating wiper contact connected to rotary dial shaft',
  },
  {
    id: 'TERM_2',
    name: 'Terminal 2 (VCC / Max)',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.15, y: 0.12, z: -0.15 },
    description: 'Resistive track end terminal (CW limit)',
  },
];

export const POTENTIOMETER_ROTARY_DEFINITION: HardwareComponentDefinition = {
  id: 'potentiometer_rotary',
  type: 'potentiometer_rotary',
  name: 'Rotary Panel Potentiometer (10kΩ Linear)',
  category: 'basic_electronics',
  subcategory: 'Resistors',
  description: 'Standard 16mm round metal panel potentiometer with 6mm knurled shaft. Generates 0 to 1023 analog signals for motor speed control and user input.',
  manufacturer: 'Alpha / Alps / Generic',
  boardFamily: 'Controls',
  modelFactoryId: 'potentiometer_rotary',
  dimensions: { widthMm: 16.0, heightMm: 24.0, depthMm: 16.0, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#94a3b8', // Metallic aluminum
  pins: ROTARY_POTENTIOMETER_PINS,
  resistorConfig: {
    resistanceOhms: 10000,
    tolerancePercent: 20,
    powerRatingWatts: 0.2,
    isVariable: true,
  },
  electrical: {
    operatingVoltage: 'Up to 50V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 20,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['0-100% Rotary Wiper Dial', 'Analog ADC Read (0-1023)', 'Speed Throttle'],
    notes: 'Interactive knob rotation adjusts analog voltage and resistance ratio.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Potentiometer',
  badge: '10kΩ Rotary',
  iconName: 'RotateCw',
  tags: ['potentiometer', 'rotary', 'analog', 'knob', 'dial', '10k', 'volume'],
};

// ----------------------------------------------------------------------------
// B. Capacitors
// ----------------------------------------------------------------------------

export const CERAMIC_CAPACITOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_1',
    name: 'Lead 1',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.06, y: 0.08, z: 0 },
    description: 'Non-polarized ceramic disc lead 1',
  },
  {
    id: 'TERM_2',
    name: 'Lead 2',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.06, y: 0.08, z: 0 },
    description: 'Non-polarized ceramic disc lead 2',
  },
];

export const CAPACITOR_CERAMIC_DEFINITION: HardwareComponentDefinition = {
  id: 'capacitor_ceramic',
  type: 'capacitor_ceramic',
  name: 'Ceramic Disc Capacitor (100nF / 0.1µF 50V)',
  category: 'basic_electronics',
  subcategory: 'Capacitors',
  description: 'Non-polarized ceramic disc/MLCC capacitor for high-frequency bypass, power supply decoupling, and noise filtering across IC power rails.',
  manufacturer: 'Murata / TDK / Generic',
  boardFamily: 'Passives',
  modelFactoryId: 'capacitor_ceramic',
  dimensions: { widthMm: 5.0, heightMm: 12.0, depthMm: 2.5, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#ea580c', // Orange-tan ceramic disc
  pins: CERAMIC_CAPACITOR_PINS,
  capacitorConfig: {
    capacitanceFarads: 100e-9, // 100nF
    capacitanceLabel: '100nF',
    ratedVoltageVolts: 50,
    isPolarized: false,
    dielectric: 'ceramic',
  },
  electrical: {
    operatingVoltage: '50V DC Maximum',
    logicLevel: 'passive',
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['High-Frequency Decoupling Representation', 'Non-Polarized AC Shunt'],
    notes: 'Configurable values: 10pF, 100pF, 1nF, 10nF, 100nF, 1µF.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Ceramic_capacitor',
  badge: '100nF 50V',
  iconName: 'Zap',
  tags: ['capacitor', 'ceramic', 'disc', '100nf', '0.1uf', 'decoupling', 'bypass'],
};

export const ELECTROLYTIC_CAPACITOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'ANODE',
    name: 'Anode (+) [Long Lead]',
    category: 'power',
    pinType: 'passive',
    position: { x: -0.06, y: 0.08, z: 0 },
    voltage: 'POS',
    description: 'Positive polarity lead (longer leg)',
  },
  {
    id: 'CATHODE',
    name: 'Cathode (-) [Short Lead / Stripe]',
    category: 'ground',
    pinType: 'passive',
    position: { x: 0.06, y: 0.08, z: 0 },
    voltage: 'NEG',
    description: 'Negative polarity lead marked with colored body stripe (-)',
  },
];

export const CAPACITOR_ELECTROLYTIC_DEFINITION: HardwareComponentDefinition = {
  id: 'capacitor_electrolytic',
  type: 'capacitor_electrolytic',
  name: 'Aluminum Electrolytic Capacitor (100µF 25V)',
  category: 'basic_electronics',
  subcategory: 'Capacitors',
  description: 'Radial polarized aluminum electrolytic capacitor with high capacitance density for DC power smoothing, filtering, and energy reservoir buffers.',
  manufacturer: 'Nichicon / Panasonic / Generic',
  boardFamily: 'Passives',
  modelFactoryId: 'capacitor_electrolytic',
  dimensions: { widthMm: 6.3, heightMm: 16.0, depthMm: 6.3, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#1e3a8a', // Dark blue vinyl sleeve with silver top
  pins: ELECTROLYTIC_CAPACITOR_PINS,
  capacitorConfig: {
    capacitanceFarads: 100e-6, // 100µF
    capacitanceLabel: '100µF',
    ratedVoltageVolts: 25,
    isPolarized: true,
    dielectric: 'electrolytic',
  },
  electrical: {
    operatingVoltage: '25V DC Maximum (POLARIZED)',
    logicLevel: 'passive',
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Polarity Orientation Check', 'Power Rail Filtering Buffer', 'Transient Smoothing'],
    notes: 'Configurable values: 1µF, 10µF, 47µF, 100µF, 470µF, 1000µF. Reverse polarity warning indicator.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Electrolytic_capacitor',
  badge: '100µF 25V',
  iconName: 'Zap',
  tags: ['capacitor', 'electrolytic', 'polarized', '100uf', 'radial', 'filter', 'aluminum'],
};

// ----------------------------------------------------------------------------
// C. Inductor and Crystal
// ----------------------------------------------------------------------------

export const INDUCTOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_A',
    name: 'Terminal A',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.16, y: 0.08, z: 0 },
    description: 'Inductor winding terminal A',
  },
  {
    id: 'TERM_B',
    name: 'Terminal B',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.16, y: 0.08, z: 0 },
    description: 'Inductor winding terminal B',
  },
];

export const INDUCTOR_DEFINITION: HardwareComponentDefinition = {
  id: 'inductor',
  type: 'inductor',
  name: 'Power Inductor (100µH, 1.5A)',
  category: 'basic_electronics',
  subcategory: 'Inductors and Crystals',
  description: 'Toroidal or axial wire-wound power inductor with ferrite magnetic core. Used for DC-DC buck/boost converters, LC ripple filters, and EMI suppression.',
  manufacturer: 'Bourns / Wurth / Generic',
  boardFamily: 'Passives',
  modelFactoryId: 'inductor',
  dimensions: { widthMm: 12.0, heightMm: 10.0, depthMm: 12.0, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#15803d', // Green enamel / copper windings
  pins: INDUCTOR_PINS,
  electrical: {
    operatingVoltage: 'Up to 50V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1500,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Inductive Current Storage', 'LC Filtering Representation'],
    notes: 'Inductance: 100µH. Maximum DC saturation current: 1.5A.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Inductor',
  badge: '100µH 1.5A',
  iconName: 'Zap',
  tags: ['inductor', 'coil', 'choke', '100uh', 'magnetic', 'ferrite', 'filter'],
};

export const CRYSTAL_OSCILLATOR_PINS: ComponentPinDefinition[] = [
  {
    id: 'XTAL_1',
    name: 'XTAL Pin 1',
    category: 'signal',
    pinType: 'passive',
    position: { x: -0.08, y: 0.08, z: 0 },
    description: 'Piezoelectric quartz crystal electrode 1 (OSC_IN)',
  },
  {
    id: 'XTAL_2',
    name: 'XTAL Pin 2',
    category: 'signal',
    pinType: 'passive',
    position: { x: 0.08, y: 0.08, z: 0 },
    description: 'Piezoelectric quartz crystal electrode 2 (OSC_OUT)',
  },
];

export const CRYSTAL_OSCILLATOR_DEFINITION: HardwareComponentDefinition = {
  id: 'crystal_oscillator',
  type: 'crystal_oscillator',
  name: 'Quartz Crystal Resonator (16.000MHz HC-49/S)',
  category: 'basic_electronics',
  subcategory: 'Inductors and Crystals',
  description: 'Precision 16.000MHz HC-49/S low-profile metal can quartz crystal resonator. Provides the primary system clock frequency for ATmega328P microcontrollers.',
  manufacturer: 'Abracon / Citizen / Generic',
  boardFamily: 'Frequency Control',
  modelFactoryId: 'crystal_oscillator',
  dimensions: { widthMm: 11.5, heightMm: 4.0, depthMm: 4.8, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#cbd5e1', // Nickel-silver metal can
  pins: CRYSTAL_OSCILLATOR_PINS,
  electrical: {
    operatingVoltage: '3.3V - 5.0V Oscillator Circuits',
    logicLevel: 'passive',
    clockSpeedMhz: 16,
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['16MHz Clock Source Link', 'MCU Oscillator Pair'],
    notes: 'Connects to XTAL1/XTAL2 pins with dual 22pF load capacitors.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Crystal_oscillator',
  badge: '16.000MHz',
  iconName: 'Cpu',
  tags: ['crystal', 'oscillator', '16mhz', 'resonator', 'clock', 'quartz', 'hc49'],
};

// ----------------------------------------------------------------------------
// I. Protection Component
// ----------------------------------------------------------------------------

export const FUSE_PINS: ComponentPinDefinition[] = [
  {
    id: 'CAP_A',
    name: 'Ferrule Contact A',
    category: 'power',
    pinType: 'passive',
    position: { x: -0.22, y: 0.08, z: 0 },
    description: 'Nickel-plated brass cartridge end cap A',
  },
  {
    id: 'CAP_B',
    name: 'Ferrule Contact B',
    category: 'power',
    pinType: 'passive',
    position: { x: 0.22, y: 0.08, z: 0 },
    description: 'Nickel-plated brass cartridge end cap B',
  },
];

export const FUSE_DEFINITION: HardwareComponentDefinition = {
  id: 'fuse',
  type: 'fuse',
  name: 'Fast-Acting Glass Cartridge Fuse (5×20mm, 250V 2A)',
  category: 'basic_electronics',
  subcategory: 'Protection',
  description: 'Standard 5×20mm miniature cylindrical glass fuse cartridge with nickel-plated end caps and visible interior fusible alloy wire. Protects against overcurrent faults.',
  manufacturer: 'Littelfuse / Bussmann / Generic',
  boardFamily: 'Circuit Protection',
  modelFactoryId: 'fuse',
  dimensions: { widthMm: 20.0, heightMm: 5.2, depthMm: 5.2, unit: 'mm' },
  defaultScale: { x: 1, y: 1, z: 1 },
  defaultColor: '#e2e8f0', // Clear glass cylinder
  pins: FUSE_PINS,
  electrical: {
    operatingVoltage: 'Up to 250V AC/DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 2000,
    totalCurrentLimitMa: 2000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Overcurrent Trip', 'Visual Wire State (Intact vs Blown)', 'Open-Circuit Protection'],
    notes: 'Toggles between intact conducting state and blown open-circuit state in Properties panel.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Fuse_(electrical)',
  badge: '2A 250V Glass',
  iconName: 'Zap',
  tags: ['fuse', 'protection', 'glass', 'cartridge', '5x20mm', '2a', 'overcurrent'],
};

export const PASSIVE_ELECTRONICS_DEFINITIONS: HardwareComponentDefinition[] = [
  RESISTOR_FIXED_DEFINITION,
  RESISTOR_VARIABLE_DEFINITION,
  POTENTIOMETER_ROTARY_DEFINITION,
  CAPACITOR_CERAMIC_DEFINITION,
  CAPACITOR_ELECTROLYTIC_DEFINITION,
  INDUCTOR_DEFINITION,
  CRYSTAL_OSCILLATOR_DEFINITION,
  FUSE_DEFINITION,
];
