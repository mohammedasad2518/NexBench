import type { HardwareCategory, HardwareSubcategory } from './types';

export interface CategoryMetadata {
  id: HardwareCategory;
  label: string;
  description: string;
  iconName: string;
  badgeColor: string;
  order: number;
  subcategories: HardwareSubcategory[];
}

export const HARDWARE_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'development_boards',
    label: 'Development Boards',
    description: 'Microcontroller units, Single Board Computers (SBCs), and IoT development platforms.',
    iconName: 'Cpu',
    badgeColor: '#059669', // Emerald
    order: 1,
    subcategories: ['Arduino', 'Espressif', 'Raspberry Pi', 'STM32', 'Other Boards'],
  },
  {
    id: 'prototyping',
    label: 'Breadboards & Prototyping',
    description: 'Solderless breadboards, perfboards, stripboards, and rapid circuit prototyping platforms.',
    iconName: 'Grid',
    badgeColor: '#0284c7', // Sky Blue
    order: 2,
    subcategories: ['Solderless Breadboards', 'Perfboards & Stripboards', 'PCB Prototyping'],
  },
  {
    id: 'wires_cables',
    label: 'Wires & Cables',
    description: 'DuPont jumper wires, ribbon cables, USB interconnects, and test leads.',
    iconName: 'Cable',
    badgeColor: '#8b5cf6', // Violet
    order: 3,
    subcategories: ['DuPont Jumper Wires', 'Solid Hookup Wires', 'Ribbon Cables', 'USB & Data Cables', 'Test Leads'],
  },
  {
    id: 'connectors_accessories',
    label: 'Connectors & Accessories',
    description: 'Pin headers, screw terminals, JST plugs, DC jacks, and breadboard power supplies.',
    iconName: 'Plug',
    badgeColor: '#f59e0b', // Amber
    order: 4,
    subcategories: ['Pin Headers', 'Terminal Blocks', 'Wire Connectors', 'Power Accessories'],
  },
  // Legacy categories preserved for existing robot & sensor assemblies
  {
    id: 'structural',
    label: 'Structure & Robotics',
    description: 'Chassis plates, mounting brackets, and physical obstacles.',
    iconName: 'Layers',
    badgeColor: '#475569',
    order: 5,
    subcategories: ['Chassis & Frames', 'Obstacles & Track'],
  },
  {
    id: 'actuator',
    label: 'Actuators & Motors',
    description: 'DC gearmotors, drive wheels, and micro servo actuators.',
    iconName: 'Zap',
    badgeColor: '#eab308',
    order: 6,
    subcategories: ['Motors & Wheels'],
  },
  {
    id: 'sensor',
    label: 'Sensors',
    description: 'Ultrasonic rangefinders, IR reflectance trackers, and analog potentiometers.',
    iconName: 'Radio',
    badgeColor: '#06b6d4',
    order: 7,
    subcategories: ['Sensors'],
  },
  {
    id: 'output',
    label: 'Displays & Outputs',
    description: 'LED indicators and visual signal devices.',
    iconName: 'Lightbulb',
    badgeColor: '#ef4444',
    order: 8,
    subcategories: ['Visual Indicators'],
  },
];

export function getCategoryMetadata(category: HardwareCategory): CategoryMetadata | undefined {
  return HARDWARE_CATEGORIES.find((cat) => cat.id === category);
}

export function getAllCategories(): CategoryMetadata[] {
  return [...HARDWARE_CATEGORIES].sort((a, b) => a.order - b.order);
}
