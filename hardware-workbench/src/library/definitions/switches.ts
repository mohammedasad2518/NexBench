import type { HardwareComponentDefinition, ComponentPinDefinition } from '../types';

// ============================================================================
// Phase 2 Basic Electronics: Switches (Pushbutton, Toggle, Slide, DIP)
// ============================================================================

// 1. Tactile Push Button (6x6mm, 4 Pins)
export const TACTILE_SWITCH_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_1A',
    name: 'Contact 1A',
    category: 'signal',
    pinType: 'terminal',
    position: { x: -0.12, y: 0.08, z: -0.1 },
    description: 'Internally connected to Contact 1B',
  },
  {
    id: 'PIN_1B',
    name: 'Contact 1B',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.12, y: 0.08, z: -0.1 },
    description: 'Internally connected to Contact 1A',
  },
  {
    id: 'PIN_2A',
    name: 'Contact 2A',
    category: 'signal',
    pinType: 'terminal',
    position: { x: -0.12, y: 0.08, z: 0.1 },
    description: 'Internally connected to Contact 2B; connects to 1 when button pressed',
  },
  {
    id: 'PIN_2B',
    name: 'Contact 2B',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.12, y: 0.08, z: 0.1 },
    description: 'Internally connected to Contact 2A; connects to 1 when button pressed',
  },
];

export const SWITCH_TACTILE_DEFINITION: HardwareComponentDefinition = {
  id: 'switch_tactile',
  type: 'switch_tactile',
  name: 'Momentary Tactile Push Button (6×6mm, 4-Pin)',
  category: 'basic_electronics',
  subcategory: 'Switches',
  description: 'Standard 6×6mm momentary single-pole normally-open tactile pushbutton switch with round actuator cap and 4 breadboard-straddling through-hole leads. Connects contacts while pressed.',
  manufacturer: 'Omron / Generic',
  boardFamily: 'Electromechanical',
  modelFactoryId: 'switch_tactile',
  dimensions: { widthMm: 6.0, heightMm: 7.5, depthMm: 6.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#1e293b', // Dark body with bright blue button plunger
  pins: TACTILE_SWITCH_PINS,
  switchConfig: {
    switchType: 'pushbutton',
    poles: 1,
    throws: 1,
    isMomentary: true,
    initialClosed: false,
  },
  electrical: {
    operatingVoltage: 'Up to 24V DC / 50mA',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 50,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Momentary Press Contact Closure', 'Active-Low Pull-Up Input', 'Breadboard Center Trench Straddling'],
    notes: 'Pressing the button connects Contacts 1A/B to 2A/B.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Push-button',
  badge: '6×6mm Tactile',
  iconName: 'ToggleLeft',
  tags: ['switch', 'pushbutton', 'tactile', 'momentary', 'button', '6x6mm', 'input'],
};

// 2. Toggle Switch (SPDT, Bat Lever)
export const TOGGLE_SWITCH_PINS: ComponentPinDefinition[] = [
  {
    id: 'TERM_NO',
    name: 'Normally Open (NO)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: -0.12, y: 0.1, z: 0 },
    description: 'Contact closed when toggle lever is switched forward',
  },
  {
    id: 'TERM_COM',
    name: 'Common (COM)',
    category: 'power',
    pinType: 'terminal',
    position: { x: 0.0, y: 0.1, z: 0 },
    description: 'Central common wiper contact',
  },
  {
    id: 'TERM_NC',
    name: 'Normally Closed (NC)',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.12, y: 0.1, z: 0 },
    description: 'Contact closed when toggle lever is switched backward',
  },
];

export const SWITCH_TOGGLE_DEFINITION: HardwareComponentDefinition = {
  id: 'switch_toggle',
  type: 'switch_toggle',
  name: 'Miniature SPDT Bat Toggle Switch (ON-ON)',
  category: 'basic_electronics',
  subcategory: 'Switches',
  description: 'Heavy-duty single-pole double-throw (SPDT) latching toggle switch with chrome metal bat lever and threaded panel mounting bushing. Retains selected position.',
  manufacturer: 'NKK / C&K / Generic',
  boardFamily: 'Electromechanical',
  modelFactoryId: 'switch_toggle',
  dimensions: { widthMm: 8.0, heightMm: 22.0, depthMm: 12.0, unit: 'mm' },
  defaultScale: { x: 0.85, y: 0.85, z: 0.85 },
  defaultColor: '#1d4ed8', // Blue body with chrome metal lever
  pins: TOGGLE_SWITCH_PINS,
  switchConfig: {
    switchType: 'toggle',
    poles: 1,
    throws: 2,
    isMomentary: false,
    positionsCount: 2,
    initialClosed: false,
  },
  electrical: {
    operatingVoltage: 'Up to 250V AC / 3A (28V DC 5A)',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Latching Lever Flip', 'SPDT Contact Routing', 'Main Power Bus Cutoff'],
    notes: 'Clicking the toggle lever flips the internal contact between NO and NC.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Switch#Toggle_switch',
  badge: 'SPDT Toggle',
  iconName: 'ToggleRight',
  tags: ['switch', 'toggle', 'spdt', 'bat-handle', 'latching', 'power-switch'],
};

// 3. Slide Switch (SPDT, Miniature Breadboard)
export const SLIDE_SWITCH_PINS: ComponentPinDefinition[] = [
  {
    id: 'PIN_1',
    name: 'Terminal 1',
    category: 'signal',
    pinType: 'terminal',
    position: { x: -0.1, y: 0.08, z: 0 },
    description: 'Contact closed when slider is pushed left',
  },
  {
    id: 'COM',
    name: 'Common Pole',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.0, y: 0.08, z: 0 },
    description: 'Central common pole terminal',
  },
  {
    id: 'PIN_2',
    name: 'Terminal 2',
    category: 'signal',
    pinType: 'terminal',
    position: { x: 0.1, y: 0.08, z: 0 },
    description: 'Contact closed when slider is pushed right',
  },
];

export const SWITCH_SLIDE_DEFINITION: HardwareComponentDefinition = {
  id: 'switch_slide',
  type: 'switch_slide',
  name: 'Miniature SPDT Slide Switch (2.54mm Pitch)',
  category: 'basic_electronics',
  subcategory: 'Switches',
  description: 'Subminiature breadboard-friendly slide switch with 0.1" (2.54mm) pin pitch and sliding black knob actuator. Widely used for battery on/off power selection.',
  manufacturer: 'Generic',
  boardFamily: 'Electromechanical',
  modelFactoryId: 'switch_slide',
  dimensions: { widthMm: 8.5, heightMm: 8.0, depthMm: 4.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#94a3b8', // Silver metal frame with black slider
  pins: SLIDE_SWITCH_PINS,
  switchConfig: {
    switchType: 'slide',
    poles: 1,
    throws: 2,
    isMomentary: false,
    positionsCount: 2,
    initialClosed: false,
  },
  electrical: {
    operatingVoltage: 'Up to 50V DC / 0.5A',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 500,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Position Slotted Contact Selection', 'Power Rail Isolation'],
    notes: 'Sliding actuator changes contact between Pin 1 and Pin 2.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Switch#Slide_switch',
  badge: 'SPDT Slide',
  iconName: 'Sliders',
  tags: ['switch', 'slide', 'spdt', 'miniature', 'power', 'on-off'],
};

// 4. DIP Switch (4-Position Rocker)
export const DIP_SWITCH_PINS: ComponentPinDefinition[] = [
  // Inputs (Bottom row)
  { id: 'SW1_IN', name: 'Switch 1 In', pinNumber: 1, category: 'signal', pinType: 'terminal', position: { x: -0.15, y: 0.08, z: -0.15 } },
  { id: 'SW2_IN', name: 'Switch 2 In', pinNumber: 2, category: 'signal', pinType: 'terminal', position: { x: -0.05, y: 0.08, z: -0.15 } },
  { id: 'SW3_IN', name: 'Switch 3 In', pinNumber: 3, category: 'signal', pinType: 'terminal', position: { x: 0.05, y: 0.08, z: -0.15 } },
  { id: 'SW4_IN', name: 'Switch 4 In', pinNumber: 4, category: 'signal', pinType: 'terminal', position: { x: 0.15, y: 0.08, z: -0.15 } },
  // Outputs (Top row)
  { id: 'SW1_OUT', name: 'Switch 1 Out', pinNumber: 8, category: 'signal', pinType: 'terminal', position: { x: -0.15, y: 0.08, z: 0.15 } },
  { id: 'SW2_OUT', name: 'Switch 2 Out', pinNumber: 7, category: 'signal', pinType: 'terminal', position: { x: -0.05, y: 0.08, z: 0.15 } },
  { id: 'SW3_OUT', name: 'Switch 3 Out', pinNumber: 6, category: 'signal', pinType: 'terminal', position: { x: 0.05, y: 0.08, z: 0.15 } },
  { id: 'SW4_OUT', name: 'Switch 4 Out', pinNumber: 5, category: 'signal', pinType: 'terminal', position: { x: 0.15, y: 0.08, z: 0.15 } },
];

export const SWITCH_DIP_DEFINITION: HardwareComponentDefinition = {
  id: 'switch_dip',
  type: 'switch_dip',
  name: '4-Position Rocker DIP Switch (2.54mm Pitch)',
  category: 'basic_electronics',
  subcategory: 'Switches',
  description: 'Bright red 4-pole Dual In-Line Package (DIP) switch with individual miniature white rocker actuators. Used for hardware mode configuration, device addressing, and option selection.',
  manufacturer: 'CTS / C&K / Generic',
  boardFamily: 'Electromechanical',
  modelFactoryId: 'switch_dip',
  dimensions: { widthMm: 10.5, heightMm: 6.5, depthMm: 9.8, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#dc2626', // Flame red DIP casing
  pins: DIP_SWITCH_PINS,
  switchConfig: {
    switchType: 'dip',
    poles: 4,
    throws: 1,
    isMomentary: false,
    positionsCount: 4,
    initialClosed: false,
  },
  electrical: {
    operatingVoltage: 'Up to 24V DC / 25mA',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 25,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['Independent 4-Channel Binary Configuration', 'Individual Rocker Toggle'],
    notes: 'Each of the 4 switches can be toggled independently between ON and OFF.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/DIP_switch',
  badge: '4-Pole DIP',
  iconName: 'ToggleRight',
  tags: ['dip', 'switch', 'rocker', '4-position', 'binary', 'config', 'address'],
};

export const SWITCHES_DEFINITIONS: HardwareComponentDefinition[] = [
  SWITCH_TACTILE_DEFINITION,
  SWITCH_TOGGLE_DEFINITION,
  SWITCH_SLIDE_DEFINITION,
  SWITCH_DIP_DEFINITION,
];
