import type { Component3D, ComponentType, TerminalDefinition, TerminalCategory, WireConnection } from '../types/workbench';

export const COMPONENT_TERMINALS: Record<ComponentType, TerminalDefinition[]> = {
  arduino: [
    // Digital Header (Top header: z = -0.78, y = 0.25)
    {
      id: 'D13',
      name: 'D13',
      category: 'digital',
      position: { x: -0.75, y: 0.25, z: -0.78 },
      description: 'Digital Pin 13 / Built-in LED',
    },
    {
      id: 'D12',
      name: 'D12',
      category: 'digital',
      position: { x: -0.58, y: 0.25, z: -0.78 },
      description: 'Digital Pin 12',
    },
    {
      id: 'D11',
      name: 'D11 ~',
      category: 'digital',
      position: { x: -0.41, y: 0.25, z: -0.78 },
      description: 'Digital Pin 11 (PWM)',
    },
    {
      id: 'D10',
      name: 'D10 ~',
      category: 'digital',
      position: { x: -0.24, y: 0.25, z: -0.78 },
      description: 'Digital Pin 10 (PWM)',
    },
    {
      id: 'D9',
      name: 'D9 ~',
      category: 'digital',
      position: { x: -0.07, y: 0.25, z: -0.78 },
      description: 'Digital Pin 9 (PWM)',
    },
    {
      id: 'D8',
      name: 'D8',
      category: 'digital',
      position: { x: 0.01, y: 0.25, z: -0.78 },
      description: 'Digital Pin 8',
    },
    {
      id: 'D7',
      name: 'D7',
      category: 'digital',
      position: { x: 0.09, y: 0.25, z: -0.78 },
      description: 'Digital Pin 7 / Right Line Sensor DO',
    },
    {
      id: 'D6',
      name: 'D6 ~',
      category: 'digital',
      position: { x: 0.18, y: 0.25, z: -0.78 },
      description: 'Digital Pin 6 (PWM) / Motor Right',
    },
    {
      id: 'D5',
      name: 'D5 ~',
      category: 'digital',
      position: { x: 0.27, y: 0.25, z: -0.78 },
      description: 'Digital Pin 5 (PWM) / Motor Left',
    },
    {
      id: 'D4',
      name: 'D4',
      category: 'digital',
      position: { x: 0.36, y: 0.25, z: -0.78 },
      description: 'Digital Pin 4 / Left Line Sensor DO',
    },
    {
      id: 'D3',
      name: 'D3 ~',
      category: 'digital',
      position: { x: 0.46, y: 0.25, z: -0.78 },
      description: 'Digital Pin 3 (PWM) / INT1',
    },
    {
      id: 'D2',
      name: 'D2',
      category: 'digital',
      position: { x: 0.61, y: 0.25, z: -0.78 },
      description: 'Digital Pin 2 (Interrupt) / INT0',
    },
    {
      id: 'GND_DIG',
      name: 'GND',
      category: 'ground',
      position: { x: 0.78, y: 0.25, z: -0.78 },
      description: 'Digital Ground',
      voltage: '0V',
    },

    // Power & Analog Header (Bottom header: z = 0.78, y = 0.25)
    {
      id: '3V3',
      name: '3.3V',
      category: 'power',
      position: { x: -0.65, y: 0.25, z: 0.78 },
      description: '3.3V Regulated Power Output',
      voltage: '3.3V',
    },
    {
      id: '5V',
      name: '5V',
      category: 'power',
      position: { x: -0.45, y: 0.25, z: 0.78 },
      description: '5V Regulated Power Output',
      voltage: '5V',
    },
    {
      id: 'GND_1',
      name: 'GND',
      category: 'ground',
      position: { x: -0.25, y: 0.25, z: 0.78 },
      description: 'Power Ground 1',
      voltage: '0V',
    },
    {
      id: 'GND_2',
      name: 'GND',
      category: 'ground',
      position: { x: -0.05, y: 0.25, z: 0.78 },
      description: 'Power Ground 2',
      voltage: '0V',
    },
    {
      id: 'VIN',
      name: 'VIN',
      category: 'power',
      position: { x: 0.15, y: 0.25, z: 0.78 },
      description: 'External Power Input (7-12V)',
      voltage: 'VIN',
    },
    {
      id: 'A0',
      name: 'A0',
      category: 'analog',
      position: { x: 0.35, y: 0.25, z: 0.78 },
      description: 'Analog Input Pin 0 (Wiper / Potentiometer)',
    },
    {
      id: 'A1',
      name: 'A1',
      category: 'analog',
      position: { x: 0.55, y: 0.25, z: 0.78 },
      description: 'Analog Input Pin 1 / Left Line Sensor AO',
    },
    {
      id: 'A2',
      name: 'A2',
      category: 'analog',
      position: { x: 0.75, y: 0.25, z: 0.78 },
      description: 'Analog Input Pin 2 / Right Line Sensor AO',
    },
    {
      id: 'A3',
      name: 'A3',
      category: 'analog',
      position: { x: 0.90, y: 0.25, z: 0.78 },
      description: 'Analog Input Pin 3',
    },
  ],

  led: [
    {
      id: 'ANODE',
      name: 'Anode (+)',
      category: 'digital',
      position: { x: -0.08, y: -0.25, z: 0 },
      description: 'Positive lead (Longer pin) / Control input',
      voltage: '~2-3V',
    },
    {
      id: 'CATHODE',
      name: 'Cathode (-)',
      category: 'ground',
      position: { x: 0.08, y: -0.3, z: 0 },
      description: 'Negative lead (Flat edge) / Ground connection',
      voltage: '0V',
    },
  ],

  ultrasonic: [
    {
      id: 'VCC',
      name: 'VCC',
      category: 'power',
      position: { x: -0.3, y: -0.1, z: -0.4 },
      description: '+5V Power Supply Input',
      voltage: '5V',
    },
    {
      id: 'TRIG',
      name: 'TRIG',
      category: 'digital',
      position: { x: -0.1, y: -0.1, z: -0.4 },
      description: 'Trigger Input Pulse Pin (10us TTL pulse)',
    },
    {
      id: 'ECHO',
      name: 'ECHO',
      category: 'digital',
      position: { x: 0.1, y: -0.1, z: -0.4 },
      description: 'Echo Output Pulse Width Pin',
    },
    {
      id: 'GND',
      name: 'GND',
      category: 'ground',
      position: { x: 0.3, y: -0.1, z: -0.4 },
      description: 'Ground Reference',
      voltage: '0V',
    },
  ],

  servo: [
    {
      id: 'GND',
      name: 'GND (Brown)',
      category: 'ground',
      position: { x: -0.12, y: -0.45, z: -0.15 },
      description: 'Servo Ground Return',
      voltage: '0V',
    },
    {
      id: 'VCC',
      name: 'VCC (Red)',
      category: 'power',
      position: { x: 0.0, y: -0.45, z: -0.15 },
      description: 'Servo Power Supply (4.8V - 6.0V)',
      voltage: '5V',
    },
    {
      id: 'SIGNAL',
      name: 'Signal (Orange)',
      category: 'digital',
      position: { x: 0.12, y: -0.45, z: -0.15 },
      description: 'PWM Control Pulse (50Hz duty cycle)',
    },
  ],

  dc_motor: [
    {
      id: 'TERM_POS',
      name: 'Terminal (+)',
      category: 'power',
      position: { x: -1.25, y: 0.0, z: 0.18 },
      description: 'Motor Positive / H-Bridge Driver Channel A',
    },
    {
      id: 'TERM_NEG',
      name: 'Terminal (-)',
      category: 'ground',
      position: { x: -1.25, y: 0.0, z: -0.18 },
      description: 'Motor Negative / H-Bridge Driver Channel B',
    },
  ],

  potentiometer: [
    {
      id: 'VCC',
      name: 'VCC (Pin 1)',
      category: 'power',
      position: { x: -0.22, y: -0.25, z: 0.15 },
      description: 'Potentiometer High Reference (+5V / 3.3V)',
      voltage: '5V',
    },
    {
      id: 'WIPER',
      name: 'Wiper (Pin 2)',
      category: 'analog',
      position: { x: 0.0, y: -0.25, z: 0.15 },
      description: 'Potentiometer Wiper Output (0V - 5V analog to A0-A5)',
    },
    {
      id: 'GND',
      name: 'GND (Pin 3)',
      category: 'ground',
      position: { x: 0.22, y: -0.25, z: 0.15 },
      description: 'Potentiometer Ground Return',
      voltage: '0V',
    },
  ],

  line_sensor: [
    {
      id: 'VCC',
      name: 'VCC',
      category: 'power',
      position: { x: -0.15, y: 0.08, z: -0.25 },
      description: '+5V Power Supply Input',
      voltage: '5V',
    },
    {
      id: 'GND',
      name: 'GND',
      category: 'ground',
      position: { x: -0.05, y: 0.08, z: -0.25 },
      description: 'Ground Reference',
      voltage: '0V',
    },
    {
      id: 'DO',
      name: 'DO',
      category: 'digital',
      position: { x: 0.05, y: 0.08, z: -0.25 },
      description: 'Digital Output (HIGH on black line / LOW on white surface)',
    },
    {
      id: 'AO',
      name: 'AO',
      category: 'analog',
      position: { x: 0.15, y: 0.08, z: -0.25 },
      description: 'Analog Output (reflectance voltage: ~100-950 ADC)',
    },
  ],

  // Non-electrical mechanical components have no terminals
  chassis: [],
  wheel: [],
  obstacle_box: [],
  obstacle_wall: [],
};

export function getComponentTerminals(comp: Component3D): TerminalDefinition[] {
  return COMPONENT_TERMINALS[comp.type] || [];
}

export function findTerminal(comp: Component3D, terminalId: string): TerminalDefinition | undefined {
  const terminals = getComponentTerminals(comp);
  return terminals.find((t) => t.id === terminalId);
}

export function getTerminalCategoryColor(category: TerminalCategory): string {
  switch (category) {
    case 'power': return '#ef4444'; // Red
    case 'ground': return '#334155'; // Dark Slate
    case 'digital': return '#3b82f6'; // Blue
    case 'analog': return '#06b6d4'; // Cyan
    case 'signal': return '#10b981'; // Green
    default: return '#94a3b8';
  }
}

export function getDefaultWireColor(fromCat: TerminalCategory, toCat: TerminalCategory): string {
  if (fromCat === 'ground' || toCat === 'ground') {
    return '#1e293b'; // Black / Dark Slate for Ground
  }
  if (fromCat === 'power' || toCat === 'power') {
    return '#ef4444'; // Red for Power (VCC / 5V)
  }
  if (fromCat === 'analog' || toCat === 'analog') {
    return '#06b6d4'; // Cyan for Analog
  }
  if (fromCat === 'digital' || toCat === 'digital') {
    return '#3b82f6'; // Blue for Digital
  }
  return '#10b981'; // Green for General Signal
}

export interface ValidationResult {
  valid: boolean;
  severity?: 'error' | 'warning' | 'info';
  message?: string;
}

export function validateTerminalConnection(
  source: { comp: Component3D; term: TerminalDefinition },
  dest: { comp: Component3D; term: TerminalDefinition },
  existingWires: WireConnection[]
): ValidationResult {
  // 1. Same terminal or component check
  if (source.comp.id === dest.comp.id && source.term.id === dest.term.id) {
    return { valid: false, severity: 'error', message: 'Cannot connect a terminal to itself.' };
  }
  if (source.comp.id === dest.comp.id) {
    return { valid: false, severity: 'error', message: 'Cannot connect terminals on the same component.' };
  }

  // 2. Duplicate connection check (in either direction)
  const isDuplicate = existingWires.some(
    (w) =>
      (w.fromComponentId === source.comp.id &&
       w.fromTerminalId === source.term.id &&
       w.toComponentId === dest.comp.id &&
       w.toTerminalId === dest.term.id) ||
      (w.fromComponentId === dest.comp.id &&
       w.fromTerminalId === dest.term.id &&
       w.toComponentId === source.comp.id &&
       w.toTerminalId === source.term.id)
  );

  if (isDuplicate) {
    return { valid: false, severity: 'error', message: 'This wire connection already exists.' };
  }

  // 3. Electrical Category Compatibility Checks
  const isPowerA = source.term.category === 'power';
  const isPowerB = dest.term.category === 'power';
  const isGndA = source.term.category === 'ground';
  const isGndB = dest.term.category === 'ground';

  // Direct short-circuit between Power and Ground
  if ((isPowerA && isGndB) || (isGndA && isPowerB)) {
    return {
      valid: false,
      severity: 'error',
      message: 'Direct Short Circuit Warning: Cannot connect Power (VCC) directly to Ground (GND)!',
    };
  }

  // Ground to Ground is valid common ground
  if (isGndA && isGndB) {
    return { valid: true, severity: 'info', message: 'Valid Common Ground connection.' };
  }

  // Power to Power is valid (e.g. 5V rail to VCC)
  if (isPowerA && isPowerB) {
    return { valid: true, severity: 'info', message: 'Valid Power Rail connection.' };
  }

  // Standard valid signal connections
  return { valid: true };
}
