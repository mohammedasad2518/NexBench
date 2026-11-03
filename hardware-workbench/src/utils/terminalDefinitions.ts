import type { Component3D, ComponentType, TerminalDefinition, TerminalCategory, WireConnection } from '../types/workbench';
import { ARDUINO_UNO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP8266_NODEMCU_PINS, ESP32_DEVKIT_PINS, ESP32_CAM_PINS, RASPBERRY_PI_PICO_PINS, RASPBERRY_PI_4_PINS, STM32_BLUE_PILL_PINS } from '../library/definitions/boards';
import { BREADBOARD_FULL_DEFINITION, BREADBOARD_HALF_DEFINITION, BREADBOARD_MINI_DEFINITION, PERFBOARD_PINS, STRIPBOARD_PINS, PCB_PROTOTYPE_PINS } from '../library/definitions/breadboards';
import { WIRE_M2M_PINS } from '../library/definitions/wires';
import { HEADER_MALE_PINS, HEADER_FEMALE_PINS, TERMINAL_BLOCK_PINS, CONNECTOR_JST_PINS, DC_BARREL_JACK_PINS, BREADBOARD_PSU_PINS } from '../library/definitions/accessories';
import { 
  FIXED_RESISTOR_PINS, 
  TRIMPOT_PINS, 
  ROTARY_POTENTIOMETER_PINS, 
  CERAMIC_CAPACITOR_PINS, 
  ELECTROLYTIC_CAPACITOR_PINS, 
  INDUCTOR_PINS, 
  CRYSTAL_OSCILLATOR_PINS, 
  FUSE_PINS 
} from '../library/definitions/passives';
import { 
  DIODE_PINS, 
  STANDARD_LED_PINS, 
  RGB_LED_PINS, 
  PHOTODIODE_PINS 
} from '../library/definitions/diodesLeds';
import { 
  TO92_BJT_PINS, 
  TO220_MOSFET_PINS, 
  OPAMP_LM358_PINS, 
  LOGIC_7400_PINS, 
  OPTOCOUPLER_PC817_PINS, 
  IC_DIP_GENERIC_PINS 
} from '../library/definitions/semiconductors';
import { 
  TACTILE_SWITCH_PINS, 
  TOGGLE_SWITCH_PINS, 
  SLIDE_SWITCH_PINS, 
  DIP_SWITCH_PINS 
} from '../library/definitions/switches';
import {
  DHT11_PINS,
  DHT22_PINS,
  DS18B20_PINS,
  LM35_PINS,
  NTC_THERMISTOR_PINS
} from '../library/definitions/temperatureSensors';
import {
  BMP180_PINS,
  BMP280_PINS,
  BME280_PINS
} from '../library/definitions/environmentalSensors';
import {
  MQ_MODULE_PINS
} from '../library/definitions/gasSensors';
import {
  SOIL_MOISTURE_PINS,
  RAIN_SENSOR_PINS,
  WATER_LEVEL_PINS
} from '../library/definitions/soilWaterSensors';
import {
  LDR_PINS,
  UV_SENSOR_PINS,
  SOUND_SENSOR_PINS
} from '../library/definitions/opticalSoundSensors';

export const COMPONENT_TERMINALS: Record<ComponentType, TerminalDefinition[]> = {
  // Phase 1 Development Boards
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

  // Phase 1 Development Boards
  arduino_mega: ARDUINO_MEGA_PINS,
  arduino_nano: ARDUINO_NANO_PINS,
  arduino_leonardo: ARDUINO_UNO_PINS,
  esp8266_nodemcu: ESP8266_NODEMCU_PINS,
  esp32_devkit: ESP32_DEVKIT_PINS,
  esp32_cam: ESP32_CAM_PINS,
  raspberry_pi_pico: RASPBERRY_PI_PICO_PINS,
  raspberry_pi_pico_w: RASPBERRY_PI_PICO_PINS,
  raspberry_pi_4: RASPBERRY_PI_4_PINS,
  stm32_blue_pill: STM32_BLUE_PILL_PINS,

  // Phase 1 Breadboards and Prototyping
  breadboard_full: BREADBOARD_FULL_DEFINITION.pins,
  breadboard_half: BREADBOARD_HALF_DEFINITION.pins,
  breadboard_mini: BREADBOARD_MINI_DEFINITION.pins,
  perfboard: PERFBOARD_PINS,
  stripboard: STRIPBOARD_PINS,
  pcb_prototype: PCB_PROTOTYPE_PINS,

  // Phase 1 Wires and Cables
  wire_m2m: WIRE_M2M_PINS,
  wire_m2f: WIRE_M2M_PINS,
  wire_f2f: WIRE_M2M_PINS,
  wire_solid_core: WIRE_M2M_PINS,
  wire_multicolor: WIRE_M2M_PINS,
  cable_ribbon: WIRE_M2M_PINS,
  cable_usb_ab: WIRE_M2M_PINS,
  cable_micro_usb: WIRE_M2M_PINS,
  cable_usb_c: WIRE_M2M_PINS,
  wire_alligator: WIRE_M2M_PINS,

  // Phase 1 Connectors and Accessories
  header_male_40: HEADER_MALE_PINS,
  header_female_40: HEADER_FEMALE_PINS,
  terminal_block_2p: TERMINAL_BLOCK_PINS,
  connector_jst_xh: CONNECTOR_JST_PINS,
  dc_barrel_jack: DC_BARREL_JACK_PINS,
  breadboard_psu_module: BREADBOARD_PSU_PINS,

  // Phase 2 Basic Electronic Components
  // A. Resistors
  resistor_fixed: FIXED_RESISTOR_PINS,
  resistor_variable: TRIMPOT_PINS,
  potentiometer_rotary: ROTARY_POTENTIOMETER_PINS,

  // B. Capacitors
  capacitor_ceramic: CERAMIC_CAPACITOR_PINS,
  capacitor_electrolytic: ELECTROLYTIC_CAPACITOR_PINS,

  // C. Inductors and Crystals
  inductor: INDUCTOR_PINS,
  crystal_oscillator: CRYSTAL_OSCILLATOR_PINS,

  // D. Diodes
  diode_rectifier: DIODE_PINS,
  diode_zener: DIODE_PINS,
  diode_schottky: DIODE_PINS,

  // E. LEDs
  led_red: STANDARD_LED_PINS,
  led_green: STANDARD_LED_PINS,
  led_blue: STANDARD_LED_PINS,
  led_yellow: STANDARD_LED_PINS,
  led_white: STANDARD_LED_PINS,
  led_rgb: RGB_LED_PINS,
  led_ir: STANDARD_LED_PINS,

  // F. Optical
  photodiode: PHOTODIODE_PINS,

  // G. Transistors & MOSFETs
  transistor_npn: TO92_BJT_PINS,
  transistor_pnp: TO92_BJT_PINS,
  mosfet_n_channel: TO220_MOSFET_PINS,
  mosfet_p_channel: TO220_MOSFET_PINS,

  // H. Switches
  switch_tactile: TACTILE_SWITCH_PINS,
  switch_toggle: TOGGLE_SWITCH_PINS,
  switch_slide: SLIDE_SWITCH_PINS,
  switch_dip: DIP_SWITCH_PINS,

  // I. Protection
  fuse: FUSE_PINS,

  // J. Integrated Circuits
  ic_dip_generic: IC_DIP_GENERIC_PINS,
  ic_opamp: OPAMP_LM358_PINS,
  ic_logic_gate: LOGIC_7400_PINS,
  ic_optocoupler: OPTOCOUPLER_PC817_PINS,

  // Phase 3: Environmental & Measurement Sensors
  // 1. Temperature & Humidity
  sensor_dht11: DHT11_PINS,
  sensor_dht22: DHT22_PINS,
  sensor_ds18b20: DS18B20_PINS,
  sensor_lm35: LM35_PINS,
  sensor_ntc_thermistor: NTC_THERMISTOR_PINS,

  // 2. Pressure & Weather
  sensor_bmp180: BMP180_PINS,
  sensor_bmp280: BMP280_PINS,
  sensor_bme280: BME280_PINS,

  // 3. Gas & Air Quality
  sensor_mq2: MQ_MODULE_PINS,
  sensor_mq3: MQ_MODULE_PINS,
  sensor_mq4: MQ_MODULE_PINS,
  sensor_mq7: MQ_MODULE_PINS,
  sensor_mq135: MQ_MODULE_PINS,

  // 4. Soil & Water
  sensor_soil_moisture: SOIL_MOISTURE_PINS,
  sensor_rain: RAIN_SENSOR_PINS,
  sensor_water_level: WATER_LEVEL_PINS,

  // 5. Light, UV & Sound
  sensor_ldr: LDR_PINS,
  sensor_uv: UV_SENSOR_PINS,
  sensor_sound: SOUND_SENSOR_PINS,

  // Non-electrical mechanical components have no terminals
  chassis: [],
  wheel: [],
  obstacle_box: [],
  obstacle_wall: [],
};

export function getComponentTerminals(compOrType: Component3D | ComponentType): TerminalDefinition[] {
  const type = typeof compOrType === 'string' ? compOrType : compOrType?.type;
  return COMPONENT_TERMINALS[type] || [];
}

export function findTerminal(compOrType: Component3D | ComponentType, terminalId: string): TerminalDefinition | undefined {
  const terminals = getComponentTerminals(compOrType);
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
