import type { HardwareComponentDefinition, ComponentPinDefinition, BreadboardConnectivityDefinition } from '../types';

// ============================================================================
// Phase 1 Breadboards and Prototyping: 6 Structured Definitions
// ============================================================================

/**
 * Helper to generate systematic terminal definitions and electrical node mapping
 * for a solderless breadboard.
 */
function generateBreadboardTerminals(
  rowsCount: number,
  hasPowerRails: boolean,
  xPitch: number,
  yPitch: number,
  xOffset: number
): { pins: ComponentPinDefinition[]; connectivity: BreadboardConnectivityDefinition } {
  const pins: ComponentPinDefinition[] = [];

  // 1. Center Terminal Columns (a-e on Side A, f-j on Side B)
  for (let r = 1; r <= rowsCount; r++) {
    const x = xOffset + (r - 1) * xPitch;

    // Side A: columns a, b, c, d, e (z from -0.8 to -0.2)
    const colsA = ['a', 'b', 'c', 'd', 'e'];
    colsA.forEach((col, cIdx) => {
      const z = -0.25 - (4 - cIdx) * yPitch;
      pins.push({
        id: `T_${r}_${col}`,
        name: `Row ${r}${col.toUpperCase()}`,
        pinNumber: r,
        category: 'signal',
        pinType: 'terminal',
        position: { x, y: 0.12, z },
        description: `Terminal Row ${r}, Column ${col.toUpperCase()} (Side A node)`,
      });
    });

    // Side B: columns f, g, h, i, j (z from 0.2 to 0.8)
    const colsB = ['f', 'g', 'h', 'i', 'j'];
    colsB.forEach((col, cIdx) => {
      const z = 0.25 + cIdx * yPitch;
      pins.push({
        id: `T_${r}_${col}`,
        name: `Row ${r}${col.toUpperCase()}`,
        pinNumber: r,
        category: 'signal',
        pinType: 'terminal',
        position: { x, y: 0.12, z },
        description: `Terminal Row ${r}, Column ${col.toUpperCase()} (Side B node)`,
      });
    });
  }

  // 2. Power Rails (Top +, Top -, Bottom +, Bottom -)
  if (hasPowerRails) {
    const railInterval = Math.max(1, Math.floor(rowsCount / 5)); // Sample tap points every 5 rows
    for (let i = 0; i < 5; i++) {
      const r = 1 + i * railInterval;
      const x = xOffset + (r - 1) * xPitch;

      // Top Rails (Red +, Blue -)
      pins.push({
        id: `RAIL_TOP_POS_${i + 1}`,
        name: `Top Rail (+) [${i + 1}]`,
        category: 'power',
        pinType: 'power',
        position: { x, y: 0.12, z: -0.9 },
        voltage: 'VCC',
        description: 'Top Positive Power Bus (+)',
      });
      pins.push({
        id: `RAIL_TOP_NEG_${i + 1}`,
        name: `Top Rail (-) [${i + 1}]`,
        category: 'ground',
        pinType: 'ground',
        position: { x, y: 0.12, z: -0.75 },
        voltage: '0V',
        description: 'Top Negative Ground Bus (-)',
      });

      // Bottom Rails (Red +, Blue -)
      pins.push({
        id: `RAIL_BOT_POS_${i + 1}`,
        name: `Bottom Rail (+) [${i + 1}]`,
        category: 'power',
        pinType: 'power',
        position: { x, y: 0.12, z: 0.75 },
        voltage: 'VCC',
        description: 'Bottom Positive Power Bus (+)',
      });
      pins.push({
        id: `RAIL_BOT_NEG_${i + 1}`,
        name: `Bottom Rail (-) [${i + 1}]`,
        category: 'ground',
        pinType: 'ground',
        position: { x, y: 0.12, z: 0.9 },
        voltage: '0V',
        description: 'Bottom Negative Ground Bus (-)',
      });
    }
  }

  const connectivity: BreadboardConnectivityDefinition = {
    totalTiePoints: rowsCount * 10 + (hasPowerRails ? 50 : 0),
    rowsCount,
    columnsPerRow: 10,
    hasCenterDivider: true,
    powerRailsCount: hasPowerRails ? 4 : 0,
    splitPowerRails: false,
    areTerminalsConnected: (termAId: string, termBId: string): boolean => {
      if (termAId === termBId) return true;

      // Check Top Positive Rail
      if (termAId.startsWith('RAIL_TOP_POS') && termBId.startsWith('RAIL_TOP_POS')) return true;
      // Check Top Negative Rail
      if (termAId.startsWith('RAIL_TOP_NEG') && termBId.startsWith('RAIL_TOP_NEG')) return true;
      // Check Bottom Positive Rail
      if (termAId.startsWith('RAIL_BOT_POS') && termBId.startsWith('RAIL_BOT_POS')) return true;
      // Check Bottom Negative Rail
      if (termAId.startsWith('RAIL_BOT_NEG') && termBId.startsWith('RAIL_BOT_NEG')) return true;

      // Check Row groups: T_{row}_{col}
      const matchA = termAId.match(/^T_(\d+)_([a-j])$/);
      const matchB = termBId.match(/^T_(\d+)_([a-j])$/);
      if (matchA && matchB) {
        const rowA = matchA[1];
        const rowB = matchB[1];
        if (rowA !== rowB) return false;

        const colA = matchA[2];
        const colB = matchB[2];
        const sideA = ['a', 'b', 'c', 'd', 'e'].includes(colA) ? 'A' : 'B';
        const sideB = ['a', 'b', 'c', 'd', 'e'].includes(colB) ? 'A' : 'B';
        return sideA === sideB;
      }

      return false;
    },
  };

  return { pins, connectivity };
}

// 1. Full-Size Breadboard (830 Tie Points)
const fullBreadboardData = generateBreadboardTerminals(63, true, 0.05, 0.09, -1.55);

export const BREADBOARD_FULL_DEFINITION: HardwareComponentDefinition = {
  id: 'breadboard_full',
  type: 'breadboard_full',
  name: 'Full-Size Solderless Breadboard (830 Tie Points)',
  category: 'prototyping',
  subcategory: 'Solderless Breadboards',
  description: 'Standard 830-tie-point solderless breadboard with 63 terminal rows and 4 continuous distribution power rails (+/-).',
  manufacturer: 'Generic / MB-102',
  boardFamily: 'Breadboard',
  modelFactoryId: 'breadboard_full',
  dimensions: { widthMm: 165.0, heightMm: 8.5, depthMm: 55.0, unit: 'mm' },
  defaultScale: { x: 1.5, y: 1.0, z: 1.0 },
  defaultColor: '#f8fafc', // Crisp white ABS
  pins: fullBreadboardData.pins,
  breadboardConfig: fullBreadboardData.connectivity,
  electrical: {
    operatingVoltage: 'Up to 30V DC / AC peak',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1500, // 1.5A contact spring rating
    totalCurrentLimitMa: 3000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['5-Hole Group Node Sharing', 'Independent Power Rails (+/-)', 'Central Trench Isolation', 'Virtual Wiring'],
    notes: 'Models genuine solderless breadboard electrical nodes. Terminals on row side a-e connect together; side f-j connect together.',
  },
  datasheetUrl: 'https://en.wikipedia.org/wiki/Breadboard',
  badge: '830 Tie Points',
  iconName: 'Grid',
  tags: ['breadboard', 'full-size', '830', 'prototyping', 'solderless', 'mb102'],
};

// 2. Half-Size Breadboard (400 Tie Points)
const halfBreadboardData = generateBreadboardTerminals(30, true, 0.075, 0.09, -1.1);

export const BREADBOARD_HALF_DEFINITION: HardwareComponentDefinition = {
  id: 'breadboard_half',
  type: 'breadboard_half',
  name: 'Half-Size Solderless Breadboard (400 Tie Points)',
  category: 'prototyping',
  subcategory: 'Solderless Breadboards',
  description: 'Compact 400-tie-point breadboard with 30 terminal rows and 4 power distribution rails. Perfect for mobile robots and microcontroller shields.',
  manufacturer: 'Generic / BB-400',
  boardFamily: 'Breadboard',
  modelFactoryId: 'breadboard_half',
  dimensions: { widthMm: 85.0, heightMm: 8.5, depthMm: 55.0, unit: 'mm' },
  defaultScale: { x: 1.0, y: 1.0, z: 1.0 },
  defaultColor: '#f8fafc',
  pins: halfBreadboardData.pins,
  breadboardConfig: halfBreadboardData.connectivity,
  electrical: {
    operatingVoltage: 'Up to 30V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1500,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['5-Hole Node Sharing', 'Power Rails', 'Center Trench', 'Virtual Wiring'],
    notes: '30 rows of 5-hole pairs with full rail connectivity.',
  },
  badge: '400 Tie Points',
  iconName: 'Grid',
  tags: ['breadboard', 'half-size', '400', 'prototyping', 'compact'],
};

// 3. Mini Breadboard (170 Tie Points)
const miniBreadboardData = generateBreadboardTerminals(17, false, 0.09, 0.09, -0.72);

export const BREADBOARD_MINI_DEFINITION: HardwareComponentDefinition = {
  id: 'breadboard_mini',
  type: 'breadboard_mini',
  name: 'Mini Solderless Breadboard (170 Tie Points)',
  category: 'prototyping',
  subcategory: 'Solderless Breadboards',
  description: 'Tiny 170-tie-point modular breadboard without power rails. Ideal for wearable electronics, modular sensor daughterboards, and micro robots.',
  manufacturer: 'Generic / SYB-170',
  boardFamily: 'Breadboard',
  modelFactoryId: 'breadboard_mini',
  dimensions: { widthMm: 45.0, heightMm: 8.5, depthMm: 35.0, unit: 'mm' },
  defaultScale: { x: 0.65, y: 0.65, z: 0.65 },
  defaultColor: '#38bdf8', // Vibrant Light Blue
  pins: miniBreadboardData.pins,
  breadboardConfig: miniBreadboardData.connectivity,
  electrical: {
    operatingVoltage: 'Up to 30V DC',
    logicLevel: 'passive',
    maxCurrentPerPinMa: 1000,
  },
  simulation: {
    level: 'full',
    supportedFeatures: ['5-Hole Node Sharing', 'Center Trench Isolation'],
    notes: '17 rows of dual 5-hole groups. No power rails.',
  },
  badge: '170 Tie Points',
  iconName: 'Grid',
  tags: ['breadboard', 'mini', '170', 'syb-170', 'tiny'],
};

// 4. Perfboard (Universal Dot Prototyping Board)
export const PERFBOARD_PINS: ComponentPinDefinition[] = [
  ...Array.from({ length: 16 }, (_, i) => ({
    id: `PAD_${i + 1}`,
    name: `Pad ${i + 1}`,
    pinNumber: i + 1,
    category: 'signal' as const,
    pinType: 'terminal' as const,
    position: { x: -0.75 + (i % 8) * 0.2, y: 0.05, z: -0.3 + Math.floor(i / 8) * 0.6 },
    description: `Isolated Plated Through-Hole Pad ${i + 1}`,
  })),
];

export const PERFBOARD_DEFINITION: HardwareComponentDefinition = {
  id: 'perfboard',
  type: 'perfboard',
  name: 'Perfboard (Universal Dot Matrix)',
  category: 'prototyping',
  subcategory: 'Perfboards & Stripboards',
  description: 'Standard 0.1" (2.54mm) pitch phenolic / FR4 prototype board with an array of electrically isolated copper solder pads.',
  manufacturer: 'Generic',
  boardFamily: 'Prototyping PCB',
  modelFactoryId: 'perfboard',
  dimensions: { widthMm: 70.0, heightMm: 1.6, depthMm: 50.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#b45309', // Classic brown phenolic copper
  pins: PERFBOARD_PINS,
  electrical: {
    operatingVoltage: 'Passive through-hole matrix',
    logicLevel: 'passive',
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Isolated Solder Pads', 'Through-Hole Mounting'],
    notes: 'Pads are electrically isolated from each other until wired or jumpered.',
  },
  badge: 'Isolated Pads',
  iconName: 'Grid',
  tags: ['perfboard', 'dot-matrix', 'pcb', 'solder', 'fr4', 'phenolic'],
};

// 5. Stripboard (Veroboard with Parallel Copper Tracks)
export const STRIPBOARD_PINS: ComponentPinDefinition[] = [
  ...Array.from({ length: 16 }, (_, i) => {
    const track = (i % 4) + 1;
    return {
      id: `STRIP_T${track}_${Math.floor(i / 4) + 1}`,
      name: `Track ${track} [Tap ${Math.floor(i / 4) + 1}]`,
      pinNumber: track,
      category: 'signal' as const,
      pinType: 'terminal' as const,
      position: { x: -0.75 + Math.floor(i / 4) * 0.45, y: 0.05, z: -0.45 + (track - 1) * 0.3 },
      description: `Stripboard Track ${track} shared conductive copper rail`,
    };
  }),
];

export const STRIPBOARD_DEFINITION: HardwareComponentDefinition = {
  id: 'stripboard',
  type: 'stripboard',
  name: 'Stripboard (Veroboard Tracks)',
  category: 'prototyping',
  subcategory: 'Perfboards & Stripboards',
  description: 'Veroboard with parallel continuous conductive copper tracks running along the length of the board.',
  manufacturer: 'Vero Technologies / Generic',
  boardFamily: 'Prototyping PCB',
  modelFactoryId: 'stripboard',
  dimensions: { widthMm: 75.0, heightMm: 1.6, depthMm: 50.0, unit: 'mm' },
  defaultScale: { x: 0.9, y: 0.9, z: 0.9 },
  defaultColor: '#d97706',
  pins: STRIPBOARD_PINS,
  breadboardConfig: {
    totalTiePoints: 16,
    rowsCount: 4,
    columnsPerRow: 4,
    hasCenterDivider: false,
    powerRailsCount: 0,
    splitPowerRails: false,
    isStripboard: true,
    areTerminalsConnected: (termA: string, termB: string): boolean => {
      if (termA === termB) return true;
      const matchA = termA.match(/^STRIP_T(\d+)_/);
      const matchB = termB.match(/^STRIP_T(\d+)_/);
      if (matchA && matchB && matchA[1] === matchB[1]) return true;
      return false;
    },
  },
  electrical: {
    operatingVoltage: 'Passive conductive tracks',
    logicLevel: 'passive',
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Continuous Track Node Sharing', 'Veroboard Wiring'],
    notes: 'All holes along a single continuous strip share electrical connectivity.',
  },
  badge: 'Conductive Strips',
  iconName: 'Grid',
  tags: ['stripboard', 'veroboard', 'tracks', 'copper-strips', 'pcb'],
};

// 6. PCB Prototype Board (Double-Sided FR4 with Power Buses)
export const PCB_PROTOTYPE_PINS: ComponentPinDefinition[] = [
  { id: 'BUS_VCC_1', name: 'VCC Bus Top', category: 'power', pinType: 'power', position: { x: -0.6, y: 0.06, z: -0.5 }, voltage: 'VCC' },
  { id: 'BUS_GND_1', name: 'GND Bus Top', category: 'ground', pinType: 'ground', position: { x: 0.6, y: 0.06, z: -0.5 }, voltage: '0V' },
  { id: 'BUS_VCC_2', name: 'VCC Bus Bot', category: 'power', pinType: 'power', position: { x: -0.6, y: 0.06, z: 0.5 }, voltage: 'VCC' },
  { id: 'BUS_GND_2', name: 'GND Bus Bot', category: 'ground', pinType: 'ground', position: { x: 0.6, y: 0.06, z: 0.5 }, voltage: '0V' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `PAD_IC_${i + 1}`,
    name: `IC Pad ${i + 1}`,
    category: 'signal' as const,
    pinType: 'terminal' as const,
    position: { x: -0.35 + (i % 4) * 0.25, y: 0.06, z: -0.15 + Math.floor(i / 4) * 0.3 },
  })),
];

export const PCB_PROTOTYPE_DEFINITION: HardwareComponentDefinition = {
  id: 'pcb_prototype',
  type: 'pcb_prototype',
  name: 'Double-Sided FR4 Prototype PCB',
  category: 'prototyping',
  subcategory: 'PCB Prototyping',
  description: 'High-quality double-sided FR4 plated-through PCB with perimeter power distribution traces and standard 2.54mm hole grid.',
  manufacturer: 'Generic',
  boardFamily: 'Prototyping PCB',
  modelFactoryId: 'pcb_prototype',
  dimensions: { widthMm: 80.0, heightMm: 1.6, depthMm: 60.0, unit: 'mm' },
  defaultScale: { x: 0.95, y: 0.95, z: 0.95 },
  defaultColor: '#166534', // Dark solder-mask green
  pins: PCB_PROTOTYPE_PINS,
  electrical: {
    operatingVoltage: 'Passive double-sided PCB',
    logicLevel: 'passive',
  },
  simulation: {
    level: 'basic',
    supportedFeatures: ['Dual Power Distribution Buses', 'Through-Hole Soldering'],
    notes: 'Perimeter buses share power/ground; center pads are isolated.',
  },
  badge: 'FR4 Double-Sided',
  iconName: 'Grid',
  tags: ['pcb', 'fr4', 'prototype', 'double-sided', 'green-mask'],
};

export const PROTOTYPING_DEFINITIONS: HardwareComponentDefinition[] = [
  BREADBOARD_FULL_DEFINITION,
  BREADBOARD_HALF_DEFINITION,
  BREADBOARD_MINI_DEFINITION,
  PERFBOARD_DEFINITION,
  STRIPBOARD_DEFINITION,
  PCB_PROTOTYPE_DEFINITION,
];
