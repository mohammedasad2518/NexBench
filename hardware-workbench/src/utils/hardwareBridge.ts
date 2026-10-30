import * as THREE from 'three';
import type { 
  Component3D, 
  WireConnection, 
  MechanicalAttachment, 
  SimulatedPin, 
  RuntimeStatus 
} from '../types/workbench';
import { physicsWorld } from './physicsEngine';
import { 
  sampleFloorSurface, 
  DEFAULT_TRACK_CONFIG 
} from './floorTrack';
import type { 
  TrackConfig, 
  FloorSampleResult 
} from './floorTrack';

// ============================================================================
// Phase 4B: Hardware Bridge & Deterministic Circuit Resolver
// ============================================================================

export interface LedCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  pinNumber: number | null;
  intensity: number; // 0.0 to 1.0 (supports digital HIGH/LOW and analogWrite PWM)
  warning?: string;
}

export interface MotorCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  pinNumber: number | null;
  targetSpeed: number; // rad/s
  attachmentId: string | null;
  warning?: string;
}

export interface UltrasonicCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  vccConnected: boolean;
  gndConnected: boolean;
  trigPin: number | null;
  echoPin: number | null;
  distanceCm: number;
  pulseDurationUs: number;
  detectedObstacleName?: string | null;
  isAutoDistance?: boolean;
  warning?: string;
}

export interface PotentiometerCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  vccConnected: boolean;
  gndConnected: boolean;
  wiperPin: number | null; // e.g. 14 for A0
  potValue: number; // 0 - 1023
  voltage: number; // 0.00 - 5.00 V
  warning?: string;
}

export interface LineSensorCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  vccConnected: boolean;
  gndConnected: boolean;
  doPin: number | null; // e.g. 4 for Left, 7 for Right
  aoPin: number | null; // e.g. 15 for A1, 16 for A2
  surfaceSample: FloorSampleResult;
  reflectance: number; // 0.0 to 1.0
  digitalOutput: 0 | 1; // 1 = Black line detected, 0 = White surface
  analogOutput: number; // 0 - 1023 ADC
  threshold: number; // default ~500
  worldPosition: { x: number; y: number; z: number };
  warning?: string;
}

export interface ServoCircuitState {
  componentId: string;
  isCircuitComplete: boolean;
  vccConnected: boolean;
  gndConnected: boolean;
  signalPin: number | null;
  currentAngle: number; // 0 to 180 degrees
  targetAngle?: number; // 0 to 180 degrees
  isAttached: boolean;
  warning?: string;
}

export interface EvaluatedCircuit {
  leds: Map<string, LedCircuitState>;
  motors: Map<string, MotorCircuitState>;
  ultrasonics: Map<string, UltrasonicCircuitState>;
  potentiometers: Map<string, PotentiometerCircuitState>;
  lineSensors: Map<string, LineSensorCircuitState>;
  servos: Map<string, ServoCircuitState>;
}

export const MAX_MOTOR_SPEED_RAD_S = 20.0; // ~190 RPM (standard DC gearmotor drive speed)

/**
 * Resolves an Arduino terminal ID to a virtual pin number (e.g. 'D13' -> 13, 'A0' -> 14)
 */
export function resolveTerminalPinNumber(terminalId: string): number | null {
  const norm = terminalId.trim().toUpperCase();
  if (norm.startsWith('D')) {
    const num = parseInt(norm.slice(1), 10);
    return isNaN(num) ? null : num;
  }
  if (norm.startsWith('A')) {
    const num = parseInt(norm.slice(1), 10);
    return isNaN(num) ? null : 14 + num;
  }
  return null;
}

/**
 * Checks if a terminal ID represents an electrical ground reference
 */
export function isGroundTerminal(terminalId: string): boolean {
  const norm = terminalId.trim().toUpperCase();
  return norm.includes('GND') || norm === 'CATHODE' || norm === 'TERM_NEG';
}

/**
 * Checks if a terminal ID represents a power reference (+5V, 3.3V, VIN)
 */
export function isPowerTerminal(terminalId: string): boolean {
  const norm = terminalId.trim().toUpperCase();
  return norm === '5V' || norm === '3V3' || norm === '3.3V' || norm === 'VIN' || norm === 'VCC';
}

/**
 * Evaluates the deterministic electrical circuit connections between
 * the virtual Arduino board and peripheral 3D components using the wire graph.
 */
export function evaluateCircuitState(
  components: Component3D[],
  wires: WireConnection[],
  attachments: MechanicalAttachment[],
  simulatedPins: Record<number, SimulatedPin>,
  runtimeStatus: RuntimeStatus,
  sonarDistanceOverrides?: Map<string, number>,
  sonarObstacleNames?: Map<string, string>,
  floorTrackConfig: TrackConfig = DEFAULT_TRACK_CONFIG,
  lineSensorWorldPositions?: Map<string, { x: number; y: number; z: number }>,
  servoAngleOverrides?: Map<string, number>
): EvaluatedCircuit {
  const leds = new Map<string, LedCircuitState>();
  const motors = new Map<string, MotorCircuitState>();
  const ultrasonics = new Map<string, UltrasonicCircuitState>();
  const potentiometers = new Map<string, PotentiometerCircuitState>();
  const lineSensors = new Map<string, LineSensorCircuitState>();
  const servos = new Map<string, ServoCircuitState>();

  // 1. Locate Controller Board (Arduino)
  const arduinoComp = components.find((c) => c.type === 'arduino' && c.visible);
  if (!arduinoComp) {
    return { leds, motors, ultrasonics, potentiometers, lineSensors, servos };
  }

  // 2. Evaluate LED Circuits
  const ledComponents = components.filter((c) => c.type === 'led' && c.visible);
  for (const led of ledComponents) {
    // Find wires attached to this LED
    const ledWires = wires.filter(
      (w) => w.fromComponentId === led.id || w.toComponentId === led.id
    );

    let anodeConnectedPin: number | null = null;
    let cathodeGrounded = false;
    let reversedPolarity = false;

    for (const wire of ledWires) {
      // Determine which end is on the LED and which is on the other component
      const isFromLed = wire.fromComponentId === led.id;
      const ledTerm = isFromLed ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromLed ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromLed ? wire.toTerminalId : wire.fromTerminalId;

      // Check if other component is the Arduino
      if (otherCompId === arduinoComp.id) {
        if (ledTerm === 'ANODE') {
          // Anode connected to a digital/PWM pin
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) {
            anodeConnectedPin = pin;
          } else if (isGroundTerminal(otherTerm)) {
            reversedPolarity = true;
          }
        } else if (ledTerm === 'CATHODE') {
          // Cathode connected to Ground
          if (isGroundTerminal(otherTerm)) {
            cathodeGrounded = true;
          } else if (resolveTerminalPinNumber(otherTerm) !== null) {
            reversedPolarity = true;
          }
        }
      }
    }

    if (reversedPolarity) {
      leds.set(led.id, {
        componentId: led.id,
        isCircuitComplete: false,
        pinNumber: anodeConnectedPin,
        intensity: 0,
        warning: 'Reverse polarity detected: Anode (+) must connect to digital pin and Cathode (-) to Ground.',
      });
      continue;
    }

    // Both Anode to Pin and Cathode to Ground must be present
    const isCircuitComplete = anodeConnectedPin !== null && cathodeGrounded;
    let intensity = 0.0;

    if (isCircuitComplete && runtimeStatus === 'running' && anodeConnectedPin !== null) {
      const pinState = simulatedPins[anodeConnectedPin];
      if (pinState && pinState.mode === 'OUTPUT') {
        if (pinState.pwmValue > 0) {
          // Scaled PWM brightness (0.0 to 1.0)
          intensity = Math.max(0.0, Math.min(1.0, pinState.pwmValue / 255.0));
        } else if (pinState.digitalValue === 1) {
          intensity = 1.0;
        }
      }
    }

    leds.set(led.id, {
      componentId: led.id,
      isCircuitComplete,
      pinNumber: anodeConnectedPin,
      intensity,
      warning: !isCircuitComplete && ledWires.length > 0 
        ? 'Incomplete circuit: LED requires both Anode (+) to a digital pin and Cathode (-) to Ground.' 
        : undefined,
    });
  }

  // 3. Evaluate DC Motor Circuits
  const motorComponents = components.filter((c) => c.type === 'dc_motor' && c.visible);
  for (const motor of motorComponents) {
    const motorWires = wires.filter(
      (w) => w.fromComponentId === motor.id || w.toComponentId === motor.id
    );

    let positivePin: number | null = null;
    let negativeGrounded = false;

    for (const wire of motorWires) {
      const isFromMotor = wire.fromComponentId === motor.id;
      const motorTerm = isFromMotor ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromMotor ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromMotor ? wire.toTerminalId : wire.fromTerminalId;

      if (otherCompId === arduinoComp.id) {
        if (motorTerm === 'TERM_POS') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) {
            positivePin = pin;
          }
        } else if (motorTerm === 'TERM_NEG') {
          if (isGroundTerminal(otherTerm)) {
            negativeGrounded = true;
          }
        }
      }
    }

    // Find the revolute attachment associated with this motor (e.g. driving a wheel)
    const motorAttachment = attachments.find(
      (a) => a.parentComponentId === motor.id && a.jointType === 'revolute'
    );

    const isCircuitComplete = positivePin !== null && negativeGrounded;
    let targetSpeed = 0.0;

    if (isCircuitComplete && runtimeStatus === 'running' && positivePin !== null) {
      const pinState = simulatedPins[positivePin];
      if (pinState && pinState.mode === 'OUTPUT') {
        if (pinState.pwmValue > 0) {
          // Linear mapping: PWM 0-255 -> 0 to MAX_MOTOR_SPEED_RAD_S
          targetSpeed = (pinState.pwmValue / 255.0) * MAX_MOTOR_SPEED_RAD_S;
        } else if (pinState.digitalValue === 1) {
          targetSpeed = MAX_MOTOR_SPEED_RAD_S;
        }
      }
    }

    motors.set(motor.id, {
      componentId: motor.id,
      isCircuitComplete,
      pinNumber: positivePin,
      targetSpeed,
      attachmentId: motorAttachment ? motorAttachment.id : null,
      warning: !isCircuitComplete && motorWires.length > 0
        ? 'Incomplete circuit: Motor requires Terminal (+) wired to a control pin and Terminal (-) to Ground.'
        : undefined,
    });
  }

  // 4. Evaluate Ultrasonic Sensors
  const ultrasonicComponents = components.filter((c) => c.type === 'ultrasonic' && c.visible);
  for (const sonar of ultrasonicComponents) {
    const sonarWires = wires.filter(
      (w) => w.fromComponentId === sonar.id || w.toComponentId === sonar.id
    );

    let vccConnected = false;
    let gndConnected = false;
    let trigPin: number | null = null;
    let echoPin: number | null = null;

    for (const wire of sonarWires) {
      const isFromSonar = wire.fromComponentId === sonar.id;
      const sonarTerm = isFromSonar ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromSonar ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromSonar ? wire.toTerminalId : wire.fromTerminalId;

      if (otherCompId === arduinoComp.id) {
        if (sonarTerm === 'VCC' && isPowerTerminal(otherTerm)) {
          vccConnected = true;
        } else if (sonarTerm === 'GND' && isGroundTerminal(otherTerm)) {
          gndConnected = true;
        } else if (sonarTerm === 'TRIG') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) trigPin = pin;
        } else if (sonarTerm === 'ECHO') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) echoPin = pin;
        }
      }
    }

    const isCircuitComplete = vccConnected && gndConnected && trigPin !== null && echoPin !== null;
    const isAutoDistance = sonar.metadata?.autoDistanceEnabled !== false;
    const override = sonarDistanceOverrides?.get(sonar.id);
    const rawDist = (isAutoDistance && typeof override === 'number')
      ? override
      : typeof sonar.metadata?.distanceCm === 'number'
        ? sonar.metadata.distanceCm
        : 45;
    const distanceCm = Math.max(2, Math.min(400, Math.round(rawDist)));
    const pulseDurationUs = Math.round(distanceCm * 58.2);
    const detectedObstacleName = sonarObstacleNames?.get(sonar.id) || sonar.metadata?.detectedObstacleName;

    let warning: string | undefined;
    if (!isCircuitComplete && sonarWires.length > 0) {
      const missing: string[] = [];
      if (!vccConnected) missing.push('VCC to 5V');
      if (!gndConnected) missing.push('GND to Ground');
      if (trigPin === null) missing.push('TRIG to Digital Pin');
      if (echoPin === null) missing.push('ECHO to Digital Pin');
      warning = `Incomplete circuit: Wire ${missing.join(', ')}.`;
    }

    ultrasonics.set(sonar.id, {
      componentId: sonar.id,
      isCircuitComplete,
      vccConnected,
      gndConnected,
      trigPin,
      echoPin,
      distanceCm,
      pulseDurationUs,
      detectedObstacleName,
      isAutoDistance,
      warning,
    });
  }

  // 5. Evaluate Potentiometers (Analog voltage divider)
  const potComponents = components.filter((c) => c.type === 'potentiometer' && c.visible);
  for (const pot of potComponents) {
    const potWires = wires.filter(
      (w) => w.fromComponentId === pot.id || w.toComponentId === pot.id
    );

    let vccConnected = false;
    let gndConnected = false;
    let wiperPin: number | null = null;

    for (const wire of potWires) {
      const isFromPot = wire.fromComponentId === pot.id;
      const potTerm = isFromPot ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromPot ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromPot ? wire.toTerminalId : wire.fromTerminalId;

      if (otherCompId === arduinoComp.id) {
        if (potTerm === 'VCC' && isPowerTerminal(otherTerm)) {
          vccConnected = true;
        } else if (potTerm === 'GND' && isGroundTerminal(otherTerm)) {
          gndConnected = true;
        } else if (potTerm === 'WIPER') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) wiperPin = pin;
        }
      }
    }

    const isCircuitComplete = vccConnected && gndConnected && wiperPin !== null;
    const rawVal = typeof pot.metadata?.potValue === 'number' ? pot.metadata.potValue : 512;
    const potValue = Math.max(0, Math.min(1023, Math.round(rawVal)));
    const voltage = parseFloat(((potValue / 1023.0) * 5.0).toFixed(2));

    // When wiper pin is wired and powered, feed the value directly into the simulated analog pin
    if (isCircuitComplete && wiperPin !== null && simulatedPins[wiperPin]) {
      simulatedPins[wiperPin].analogValue = potValue;
      simulatedPins[wiperPin].digitalValue = potValue > 511 ? 1 : 0;
    }

    let warning: string | undefined;
    if (!isCircuitComplete && potWires.length > 0) {
      const missing: string[] = [];
      if (!vccConnected) missing.push('VCC to 5V');
      if (!gndConnected) missing.push('GND to Ground');
      if (wiperPin === null) missing.push('WIPER to Analog Pin (A0-A5)');
      warning = `Incomplete circuit: Wire ${missing.join(', ')}.`;
    }

    potentiometers.set(pot.id, {
      componentId: pot.id,
      isCircuitComplete,
      vccConnected,
      gndConnected,
      wiperPin,
      potValue,
      voltage,
      warning,
    });
  }

  // 6. Evaluate IR Line Tracking Sensors (TCRT5000)
  const lineSensorComponents = components.filter((c) => c.type === 'line_sensor' && c.visible);
  for (const sensor of lineSensorComponents) {
    const sensorWires = wires.filter(
      (w) => w.fromComponentId === sensor.id || w.toComponentId === sensor.id
    );

    let vccConnected = false;
    let gndConnected = false;
    let doPin: number | null = null;
    let aoPin: number | null = null;

    for (const wire of sensorWires) {
      const isFromSensor = wire.fromComponentId === sensor.id;
      const sensorTerm = isFromSensor ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromSensor ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromSensor ? wire.toTerminalId : wire.fromTerminalId;

      if (otherCompId === arduinoComp.id) {
        if (sensorTerm === 'VCC' && isPowerTerminal(otherTerm)) {
          vccConnected = true;
        } else if (sensorTerm === 'GND' && isGroundTerminal(otherTerm)) {
          gndConnected = true;
        } else if (sensorTerm === 'DO') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) doPin = pin;
        } else if (sensorTerm === 'AO') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) aoPin = pin;
        }
      }
    }

    const isCircuitComplete = vccConnected && gndConnected && (doPin !== null || aoPin !== null);

    // Determine world coordinates for surface sampling
    const worldPos = lineSensorWorldPositions?.get(sensor.id) || {
      x: sensor.position.x,
      y: sensor.position.y,
      z: sensor.position.z,
    };

    const threshold = typeof sensor.metadata?.lineSensorThreshold === 'number'
      ? sensor.metadata.lineSensorThreshold
      : 500;
    const invert = sensor.metadata?.lineSensorInvert === true;

    // Deterministic floor surface sampling
    const surfaceSample = sampleFloorSurface(worldPos.x, worldPos.z, floorTrackConfig);

    let digitalOutput: 0 | 1 = surfaceSample.digitalValue;
    let analogOutput = surfaceSample.analogValue;
    if (invert) {
      digitalOutput = (digitalOutput === 1 ? 0 : 1) as 0 | 1;
    }

    // Expose readings to Arduino runtime pins if circuit is complete
    if (isCircuitComplete) {
      if (doPin !== null && simulatedPins[doPin]) {
        simulatedPins[doPin].digitalValue = digitalOutput;
      }
      if (aoPin !== null && simulatedPins[aoPin]) {
        simulatedPins[aoPin].analogValue = analogOutput;
        simulatedPins[aoPin].digitalValue = digitalOutput;
      }
    }

    let warning: string | undefined;
    if (!isCircuitComplete && sensorWires.length > 0) {
      const missing: string[] = [];
      if (!vccConnected) missing.push('VCC to 5V');
      if (!gndConnected) missing.push('GND to Ground');
      if (doPin === null && aoPin === null) missing.push('DO to Digital Pin or AO to Analog Pin');
      warning = `Incomplete circuit: Wire ${missing.join(', ')}.`;
    }

    lineSensors.set(sensor.id, {
      componentId: sensor.id,
      isCircuitComplete,
      vccConnected,
      gndConnected,
      doPin,
      aoPin,
      surfaceSample,
      reflectance: surfaceSample.reflectance,
      digitalOutput,
      analogOutput,
      threshold,
      worldPosition: worldPos,
      warning,
    });
  }

  // 6. Evaluate Servo Actuators (Micro Servo 9g: VCC, GND, SIGNAL)
  const servoComponents = components.filter((c) => c.type === 'servo' && c.visible);
  for (const s of servoComponents) {
    const sWires = wires.filter(
      (w) => w.fromComponentId === s.id || w.toComponentId === s.id
    );

    let vccConnected = false;
    let gndConnected = false;
    let signalPin: number | null = null;

    for (const wire of sWires) {
      const isFromServo = wire.fromComponentId === s.id;
      const servoTerm = isFromServo ? wire.fromTerminalId : wire.toTerminalId;
      const otherCompId = isFromServo ? wire.toComponentId : wire.fromComponentId;
      const otherTerm = isFromServo ? wire.toTerminalId : wire.fromTerminalId;

      if (otherCompId === arduinoComp.id) {
        if (servoTerm === 'VCC' && isPowerTerminal(otherTerm)) {
          vccConnected = true;
        } else if (servoTerm === 'GND' && isGroundTerminal(otherTerm)) {
          gndConnected = true;
        } else if (servoTerm === 'SIGNAL') {
          const pin = resolveTerminalPinNumber(otherTerm);
          if (pin !== null) signalPin = pin;
        }
      }
    }

    const isCircuitComplete = vccConnected && gndConnected && signalPin !== null;
    let warning: string | undefined;
    if (!isCircuitComplete && sWires.length > 0) {
      const missing: string[] = [];
      if (!vccConnected) missing.push('VCC to 5V');
      if (!gndConnected) missing.push('GND to Ground');
      if (signalPin === null) missing.push('SIGNAL to Digital Pin (e.g. D9)');
      warning = `Incomplete circuit: Wire ${missing.join(', ')}.`;
    }

    const currentAngle = servoAngleOverrides?.get(s.id) ?? (typeof s.metadata?.servoAngle === 'number' ? s.metadata.servoAngle : 90);

    servos.set(s.id, {
      componentId: s.id,
      isCircuitComplete,
      vccConnected,
      gndConnected,
      signalPin,
      currentAngle,
      targetAngle: currentAngle,
      isAttached: isCircuitComplete,
      warning,
    });
  }

  return { leds, motors, ultrasonics, potentiometers, lineSensors, servos };
}

/**
 * Synchronizes 3D WebGL scene materials and Rapier physics joints
 * with the latest evaluated circuit state.
 */
export function applyHardwareState(
  evaluatedCircuit: EvaluatedCircuit,
  meshesMap: Map<string, THREE.Group>,
  isSimulatingPhysics: boolean
) {
  // 1. Update 3D LEDs (Emissive material & dynamic PointLight)
  evaluatedCircuit.leds.forEach((ledState, compId) => {
    const group = meshesMap.get(compId);
    if (!group) return;

    const ledMat = group.userData.ledMaterial as THREE.MeshStandardMaterial | undefined;
    const pointLight = group.userData.ledLight as THREE.PointLight | undefined;

    if (ledMat) {
      // Interpolate emissive intensity: off (0.0) to full brightness (1.8)
      ledMat.emissiveIntensity = ledState.intensity * 1.8;
    }

    if (pointLight) {
      pointLight.intensity = ledState.intensity * 2.5;
    }
  });

  // 2. Update DC Motors (Rapier physics motorized joint velocity)
  evaluatedCircuit.motors.forEach((motorState) => {
    if (motorState.attachmentId) {
      // Directly configure Rapier revolute joint motor velocity
      if (isSimulatingPhysics) {
        physicsWorld.setMotorSpeed(motorState.attachmentId, motorState.targetSpeed, 8.0);
      }
    }
  });

  // 3. Update Line Sensor detection indicator LEDs (bright red when DO is HIGH / over black line)
  evaluatedCircuit.lineSensors.forEach((lineState, compId) => {
    const group = meshesMap.get(compId);
    if (!group) return;

    const ledMat = group.userData.lineSensorLedMat as THREE.MeshStandardMaterial | undefined;
    if (ledMat) {
      ledMat.emissiveIntensity = (lineState.isCircuitComplete && lineState.digitalOutput === 1) ? 2.0 : 0.0;
    }
  });
}
