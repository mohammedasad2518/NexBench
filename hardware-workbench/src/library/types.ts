import type { Vector3D, TerminalCategory, ComponentType } from '../types/workbench';

// ============================================================================
// Phase 1: Hardware Component Library Foundation — Type Definitions
// ============================================================================

/** Core Hardware Categories as specified in Phase 1 & Phase 2 */
export type HardwareCategory = 
  | 'development_boards'
  | 'basic_electronics'
  | 'environmental_sensors'
  | 'prototyping'
  | 'wires_cables'
  | 'connectors_accessories'
  // Preserved legacy categories for backward compatibility
  | 'structural'
  | 'actuator'
  | 'controller'
  | 'output'
  | 'sensor';

/** Subcategories for organized browsing */
export type HardwareSubcategory =
  // Development Boards
  | 'Arduino'
  | 'Espressif'
  | 'Raspberry Pi'
  | 'STM32'
  | 'Other Boards'
  // Phase 2 Basic Electronics
  | 'Resistors'
  | 'Capacitors'
  | 'Inductors and Crystals'
  | 'Diodes'
  | 'LEDs'
  | 'Optical Components'
  | 'Transistors'
  | 'Switches'
  | 'Protection'
  | 'Integrated Circuits'
  // Phase 3 Environmental & Measurement Sensors
  | 'Temperature & Humidity'
  | 'Pressure & Weather'
  | 'Gas & Air Quality'
  | 'Soil & Water'
  | 'Light & UV'
  | 'Sound Sensors'
  // Breadboards & Prototyping
  | 'Solderless Breadboards'
  | 'Perfboards & Stripboards'
  | 'PCB Prototyping'
  // Wires & Cables
  | 'DuPont Jumper Wires'
  | 'Solid Hookup Wires'
  | 'Ribbon Cables'
  | 'USB & Data Cables'
  | 'Test Leads'
  // Connectors & Accessories
  | 'Pin Headers'
  | 'Terminal Blocks'
  | 'Wire Connectors'
  | 'Power Accessories'
  // Legacy
  | 'Chassis & Frames'
  | 'Motors & Wheels'
  | 'Sensors'
  | 'Visual Indicators'
  | 'Obstacles & Track';

/** Verification level of simulation support for a component */
export type SimulationLevel = 
  | 'full'          // Fully executable in Arduino AST / physics / kinematics
  | 'basic'         // Partial simulation (e.g. passive electrical / continuity)
  | 'pin_mapping'   // Verified pin definitions & terminal graph only
  | 'visual_only';  // 3D CAD model & spatial representation

/** Pin / Terminal Electrical Type */
export type PinElectricalType =
  | 'gpio'
  | 'pwm'
  | 'analog_in'
  | 'analog_out'
  | 'power'
  | 'ground'
  | 'passive'
  | 'i2c_sda'
  | 'i2c_scl'
  | 'spi_mosi'
  | 'spi_miso'
  | 'spi_sck'
  | 'spi_ss'
  | 'uart_tx'
  | 'uart_rx'
  | 'reset'
  | 'swd'
  | 'terminal';

/** Detailed Pin / Terminal Definition */
export interface ComponentPinDefinition {
  /** Unique terminal identifier (e.g. 'D13', 'A0', '5V', 'GND_1', 'PIN_A1') */
  id: string;
  /** Human-readable display label */
  name: string;
  /** Physical pin number on board / IC (e.g. 1 to 40), if applicable */
  pinNumber?: number;
  /** High-level category used by wiring & styling engine */
  category: TerminalCategory;
  /** Granular electrical pin type */
  pinType: PinElectricalType;
  /** 3D Local offset on component coordinate system */
  position: Vector3D;
  /** Nominal operating voltage string (e.g. '5V', '3.3V', '0V', '1.8V-5.5V') */
  voltage?: string;
  /** Maximum safe current per pin in milliamps, if documented */
  maxCurrentMa?: number;
  /** Technical description of this pin's capabilities */
  description?: string;
  /** Supported alternate hardware peripherals on this pin */
  alternateFunctions?: string[];
  /** Default pin mode if microcontroller GPIO */
  defaultMode?: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
}

/** Electrical Specifications */
export interface ElectricalCharacteristics {
  operatingVoltage: string;
  inputVoltageLimit?: string;
  logicLevel: '3.3V' | '5.0V' | '3.3V / 5.0V tolerant' | 'passive' | 'unspecified';
  maxCurrentPerPinMa?: number;
  totalCurrentLimitMa?: number;
  clockSpeedMhz?: number;
  flashMemoryKb?: number;
  sramKb?: number;
  supportedInterfaces?: string[];
}

/** Verified Simulation Capabilities */
export interface ComponentSimulationCapabilities {
  level: SimulationLevel;
  supportedFeatures: string[];
  notes: string;
  astSupported?: boolean;
}

/** Component Physical Dimensions in Millimeters and Scene Units */
export interface ComponentDimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  unit: 'mm';
}

/** Solderless Breadboard Logical Connectivity Specification */
export interface BreadboardConnectivityDefinition {
  totalTiePoints: number;
  rowsCount: number;
  columnsPerRow: number;
  hasCenterDivider: boolean;
  powerRailsCount: number;
  splitPowerRails: boolean;
  isStripboard?: boolean;
  /**
   * Helper that checks if two terminal IDs on this breadboard share an internal electrical node.
   * e.g., terminals in the same row on column side a-e share a node.
   */
  areTerminalsConnected: (termAId: string, termBId: string) => boolean;
}

/** Wire & Cable Specific Characteristics */
export interface WireCharacteristicsDefinition {
  wireType: 'jumper' | 'solid_core' | 'ribbon' | 'usb' | 'alligator';
  gaugeAwg?: number;
  connectorTypeA: 'male_dupont' | 'female_dupont' | 'stripped' | 'usb_a' | 'usb_b' | 'micro_usb' | 'usb_c' | 'alligator_clip';
  connectorTypeB: 'male_dupont' | 'female_dupont' | 'stripped' | 'usb_a' | 'usb_b' | 'micro_usb' | 'usb_c' | 'alligator_clip';
  isPhysicalCableObject: boolean;
  defaultLengthMm?: number;
}

/** Resistor Specific Characteristics */
export interface ResistorCharacteristics {
  resistanceOhms: number;
  tolerancePercent?: number;
  powerRatingWatts?: number;
  isVariable?: boolean;
  supportedValues?: number[];
  colorBands?: string[];
}

/** Capacitor Specific Characteristics */
export interface CapacitorCharacteristics {
  capacitanceFarads: number;
  capacitanceLabel: string;
  ratedVoltageVolts: number;
  isPolarized: boolean;
  dielectric: 'ceramic' | 'electrolytic' | 'film' | 'tantalum';
}

/** Diode & LED Specific Characteristics */
export interface DiodeCharacteristics {
  diodeType: 'rectifier' | 'zener' | 'schottky' | 'led' | 'photodiode';
  forwardVoltage: number;
  maxCurrentMa: number;
  reverseBreakdownVoltage?: number;
  color?: string;
  wavelengthNm?: number;
  isRgb?: boolean;
  rgbCommon?: 'common_cathode' | 'common_anode';
}

/** Transistor & MOSFET Specific Characteristics */
export interface TransistorCharacteristics {
  transistorType: 'npn_bjt' | 'pnp_bjt' | 'n_channel_mosfet' | 'p_channel_mosfet';
  packageType: 'to92' | 'to220';
  maxVoltageV: number;
  maxCurrentA: number;
  pinOrder: string[]; // e.g. ['E', 'B', 'C'] or ['G', 'D', 'S']
}

/** Switch Specific Characteristics */
export interface SwitchCharacteristics {
  switchType: 'pushbutton' | 'toggle' | 'slide' | 'dip';
  poles: number;
  throws: number;
  isMomentary: boolean;
  positionsCount?: number;
  initialClosed?: boolean;
}

/** Integrated Circuit Specific Characteristics */
export interface ICCharacteristics {
  packageType: 'dip4' | 'dip8' | 'dip14' | 'dip16' | 'dip28';
  pinCount: number;
  pinLabels: Record<number, string>;
  family?: string;
  isConfigurable?: boolean;
}

/** Environmental & Measurement Sensor Specific Characteristics */
export interface SensorCharacteristics {
  sensorFamily: 'temperature' | 'pressure' | 'gas' | 'soil_water' | 'light_uv' | 'sound';
  measuredQuantity: string;
  unit: string;
  minRange: number;
  maxRange: number;
  accuracy?: string;
  responseProtocol: 'analog' | 'digital_io' | 'i2c' | 'one_wire';
  defaultI2CAddress?: string;
  hasHeater?: boolean;
}

/** Complete Structured Hardware Component Definition */
export interface HardwareComponentDefinition {
  /** Unique component ID / catalog identifier */
  id: string;
  /** Component type matching ComponentType enum */
  type: ComponentType;
  /** Full official display name */
  name: string;
  /** Primary category */
  category: HardwareCategory;
  /** Granular subcategory */
  subcategory: HardwareSubcategory;
  /** Detailed technical summary */
  description: string;
  /** Manufacturer or open-source foundation */
  manufacturer?: string;
  /** Board family or product series */
  boardFamily?: string;
  /** 3D model factory identifier */
  modelFactoryId: string;
  /** Approximate physical dimensions in millimeters */
  dimensions: ComponentDimensions;
  /** Default 3D scale in scene units */
  defaultScale: Vector3D;
  /** Default 3D position in scene units */
  defaultPosition?: Vector3D;
  /** Default rotation in degrees */
  defaultRotation?: Vector3D;
  /** Default CAD material color hex */
  defaultColor: string;
  /** Structured pin & terminal list */
  pins: ComponentPinDefinition[];
  /** Electrical parameters */
  electrical?: ElectricalCharacteristics;
  /** Simulation capabilities & caveats */
  simulation: ComponentSimulationCapabilities;
  /** Verified datasheet or official documentation URL */
  datasheetUrl?: string;
  /** UI badge label (e.g. '5V Logic', '830 Tie', 'Wi-Fi BLE') */
  badge: string;
  /** Lucide icon or custom SVG identifier */
  iconName: string;
  /** Search keywords and aliases */
  tags: string[];
  /** Breadboard connectivity parameters if this is a breadboard */
  breadboardConfig?: BreadboardConnectivityDefinition;
  /** Wire characteristics if this is a wire or cable */
  wireConfig?: WireCharacteristicsDefinition;
  /** Resistor configuration */
  resistorConfig?: ResistorCharacteristics;
  /** Capacitor configuration */
  capacitorConfig?: CapacitorCharacteristics;
  /** Diode/LED configuration */
  diodeConfig?: DiodeCharacteristics;
  /** Transistor configuration */
  transistorConfig?: TransistorCharacteristics;
  /** Switch configuration */
  switchConfig?: SwitchCharacteristics;
  /** Integrated circuit configuration */
  icConfig?: ICCharacteristics;
  /** Environmental and measurement sensor configuration */
  sensorConfig?: SensorCharacteristics;
}
