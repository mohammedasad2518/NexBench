import type { Component3D, WireConnection } from '../types/workbench';
import { getComponentTerminals } from './terminalDefinitions';

export interface AutoConnectResult {
  success: boolean;
  message: string;
  addedWires: WireConnection[];
  alreadyConnectedCount: number;
  missingDetails?: string[];
}

/**
 * Auto-connects an HC-SR04 ultrasonic sensor to the virtual Arduino board in the scene.
 * Connects:
 *   - VCC  <-> 5V
 *   - GND  <-> GND (GND_1)
 *   - TRIG <-> D11
 *   - ECHO <-> D12
 *
 * Prevents duplicate wires if pairs are already connected.
 * Returns detailed explanation if Arduino or terminals are missing.
 */
export function autoConnectUltrasonicSensor(
  sensorId: string,
  components: Component3D[],
  currentWires: WireConnection[]
): AutoConnectResult {
  // 1. Locate the sensor
  const sensor = components.find((c) => c.id === sensorId);
  if (!sensor) {
    return {
      success: false,
      message: 'Cannot auto-connect: Ultrasonic sensor component was not found in the scene.',
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  if (sensor.type !== 'ultrasonic') {
    return {
      success: false,
      message: `Cannot auto-connect: Selected component "${sensor.name}" (${sensor.type}) is not an ultrasonic sensor.`,
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  // 2. Locate the virtual Arduino board
  const arduino = components.find((c) => c.type === 'arduino' && c.visible !== false);
  if (!arduino) {
    return {
      success: false,
      message: 'Cannot auto-connect: Virtual Arduino board not found in the workspace. Please add an Arduino Uno board from the Component Library.',
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  // 3. Inspect terminals on both components
  const sensorTerminals = getComponentTerminals(sensor);
  const arduinoTerminals = getComponentTerminals(arduino);

  const missingRequirements: string[] = [];

  const sVcc = sensorTerminals.find((t) => t.id === 'VCC');
  const sGnd = sensorTerminals.find((t) => t.id === 'GND');
  const sTrig = sensorTerminals.find((t) => t.id === 'TRIG');
  const sEcho = sensorTerminals.find((t) => t.id === 'ECHO');

  if (!sVcc) missingRequirements.push('Sensor terminal VCC');
  if (!sGnd) missingRequirements.push('Sensor terminal GND');
  if (!sTrig) missingRequirements.push('Sensor terminal TRIG');
  if (!sEcho) missingRequirements.push('Sensor terminal ECHO');

  const a5V = arduinoTerminals.find((t) => t.id === '5V' || t.name === '5V');
  const aGnd =
    arduinoTerminals.find((t) => t.id === 'GND_1') ||
    arduinoTerminals.find((t) => t.id === 'GND') ||
    arduinoTerminals.find((t) => t.name === 'GND');
  const aD11 = arduinoTerminals.find((t) => t.id === 'D11' || t.name.startsWith('D11'));
  const aD12 = arduinoTerminals.find((t) => t.id === 'D12' || t.name.startsWith('D12'));

  if (!a5V) missingRequirements.push("Arduino board terminal '5V'");
  if (!aGnd) missingRequirements.push("Arduino board terminal 'GND'");
  if (!aD11) missingRequirements.push("Arduino board terminal 'D11'");
  if (!aD12) missingRequirements.push("Arduino board terminal 'D12'");

  if (missingRequirements.length > 0) {
    return {
      success: false,
      message: `Cannot auto-connect: Missing required terminal(s): ${missingRequirements.join(', ')}.`,
      addedWires: [],
      alreadyConnectedCount: 0,
      missingDetails: missingRequirements,
    };
  }

  // 4. Required connections specification
  const requiredConnections = [
    {
      sensorTermId: sVcc!.id,
      arduinoTermId: a5V!.id,
      label: 'VCC ↔ 5V',
      color: '#ef4444', // Red (Power)
    },
    {
      sensorTermId: sGnd!.id,
      arduinoTermId: aGnd!.id,
      label: 'GND ↔ GND',
      color: '#1e293b', // Black / Dark Slate (Ground)
    },
    {
      sensorTermId: sTrig!.id,
      arduinoTermId: aD11!.id,
      label: 'TRIG ↔ D11',
      color: '#3b82f6', // Blue (Digital Trigger)
    },
    {
      sensorTermId: sEcho!.id,
      arduinoTermId: aD12!.id,
      label: 'ECHO ↔ D12',
      color: '#06b6d4', // Cyan (Digital Echo Pulse)
    },
  ];

  // 5. Check existing wires to prevent duplicate wires (bidirectional check)
  const isTerminalPairConnected = (sTermId: string, aTermId: string) => {
    return currentWires.some(
      (w) =>
        (w.fromComponentId === sensor.id &&
          w.fromTerminalId === sTermId &&
          w.toComponentId === arduino.id &&
          w.toTerminalId === aTermId) ||
        (w.fromComponentId === arduino.id &&
          w.fromTerminalId === aTermId &&
          w.toComponentId === sensor.id &&
          w.toTerminalId === sTermId)
    );
  };

  const newWires: WireConnection[] = [];
  const existingPairLabels: string[] = [];
  const newPairLabels: string[] = [];

  for (const conn of requiredConnections) {
    if (isTerminalPairConnected(conn.sensorTermId, conn.arduinoTermId)) {
      existingPairLabels.push(conn.label);
    } else {
      const wireId = `wire_auto_${sensor.id}_${conn.sensorTermId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      newWires.push({
        id: wireId,
        fromComponentId: arduino.id,
        fromTerminalId: conn.arduinoTermId,
        toComponentId: sensor.id,
        toTerminalId: conn.sensorTermId,
        color: conn.color,
      });
      newPairLabels.push(conn.label);
    }
  }

  if (newWires.length === 0) {
    return {
      success: true,
      message: `Demo sensor is already fully connected to Arduino (${existingPairLabels.join(', ')}). 0 duplicate wires created.`,
      addedWires: [],
      alreadyConnectedCount: existingPairLabels.length,
    };
  }

  const message =
    existingPairLabels.length > 0
      ? `Auto-connected ${newWires.length} missing wire(s): ${newPairLabels.join(', ')} (already connected: ${existingPairLabels.join(', ')}). Duplicate wires prevented.`
      : `Auto-connected all 4 sensor wires: ${newPairLabels.join(', ')} to ${arduino.name}.`;

  return {
    success: true,
    message,
    addedWires: newWires,
    alreadyConnectedCount: existingPairLabels.length,
  };
}

/**
 * Auto-connects a specific IR line sensor to the virtual Arduino board.
 * If sensor has 'left' in id or name, connects DO to D4 and AO to A1.
 * If sensor has 'right' in id or name, connects DO to D7 and AO to A2.
 */
export function autoConnectSingleLineSensor(
  sensorId: string,
  components: Component3D[],
  currentWires: WireConnection[]
): AutoConnectResult {
  const sensor = components.find((c) => c.id === sensorId);
  if (!sensor) {
    return {
      success: false,
      message: 'Cannot auto-connect: Line sensor component was not found in the scene.',
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  if (sensor.type !== 'line_sensor') {
    return {
      success: false,
      message: `Cannot auto-connect: Selected component "${sensor.name}" (${sensor.type}) is not an IR line sensor.`,
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  const arduino = components.find((c) => c.type === 'arduino' && c.visible !== false);
  if (!arduino) {
    return {
      success: false,
      message: 'Cannot auto-connect: Virtual Arduino board not found in the workspace.',
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  const isLeft = sensor.id.toLowerCase().includes('left') || sensor.name.toLowerCase().includes('left');
  const doPinName = isLeft ? 'D4' : 'D7';
  const aoPinName = isLeft ? 'A1' : 'A2';
  const gndPinName = isLeft ? 'GND_1' : 'GND_2';

  const arduinoTerminals = getComponentTerminals(arduino);
  const a5V = arduinoTerminals.find((t) => t.id === '5V' || t.name === '5V');
  const aGnd = arduinoTerminals.find((t) => t.id === gndPinName) ||
    arduinoTerminals.find((t) => t.id === 'GND_1') ||
    arduinoTerminals.find((t) => t.id === 'GND');
  const aDO = arduinoTerminals.find((t) => t.id === doPinName);
  const aAO = arduinoTerminals.find((t) => t.id === aoPinName);

  const missing: string[] = [];
  if (!a5V) missing.push("Arduino '5V'");
  if (!aGnd) missing.push(`Arduino '${gndPinName}'`);
  if (!aDO) missing.push(`Arduino '${doPinName}'`);
  if (!aAO) missing.push(`Arduino '${aoPinName}'`);

  if (missing.length > 0) {
    return {
      success: false,
      message: `Cannot auto-connect: Missing Arduino terminal(s): ${missing.join(', ')}.`,
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  const requiredConnections = [
    { sensorTermId: 'VCC', arduinoTermId: a5V!.id, color: '#ef4444', label: `VCC <-> ${a5V!.id}` },
    { sensorTermId: 'GND', arduinoTermId: aGnd!.id, color: '#1e293b', label: `GND <-> ${aGnd!.id}` },
    { sensorTermId: 'DO', arduinoTermId: aDO!.id, color: '#3b82f6', label: `DO <-> ${aDO!.id}` },
    { sensorTermId: 'AO', arduinoTermId: aAO!.id, color: '#06b6d4', label: `AO <-> ${aAO!.id}` },
  ];

  const isTerminalPairConnected = (sTermId: string, aTermId: string) => {
    return currentWires.some(
      (w) =>
        (w.fromComponentId === arduino.id &&
          w.fromTerminalId === aTermId &&
          w.toComponentId === sensor.id &&
          w.toTerminalId === sTermId) ||
        (w.fromComponentId === sensor.id &&
          w.fromTerminalId === sTermId &&
          w.toComponentId === arduino.id &&
          w.toTerminalId === aTermId)
    );
  };

  const newWires: WireConnection[] = [];
  const existingPairLabels: string[] = [];
  const newPairLabels: string[] = [];

  for (const conn of requiredConnections) {
    if (isTerminalPairConnected(conn.sensorTermId, conn.arduinoTermId)) {
      existingPairLabels.push(conn.label);
    } else {
      const wireId = `wire_auto_${sensor.id}_${conn.sensorTermId.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      newWires.push({
        id: wireId,
        fromComponentId: arduino.id,
        fromTerminalId: conn.arduinoTermId,
        toComponentId: sensor.id,
        toTerminalId: conn.sensorTermId,
        color: conn.color,
      });
      newPairLabels.push(conn.label);
    }
  }

  if (newWires.length === 0) {
    return {
      success: true,
      message: `${sensor.name} is already fully connected to Arduino (${existingPairLabels.join(', ')}). 0 duplicate wires created.`,
      addedWires: [],
      alreadyConnectedCount: existingPairLabels.length,
    };
  }

  return {
    success: true,
    message: `Auto-connected ${newWires.length} wire(s) for ${sensor.name}: ${newPairLabels.join(', ')}.`,
    addedWires: newWires,
    alreadyConnectedCount: existingPairLabels.length,
  };
}

/**
 * Auto-connects both left and right IR line sensors in the scene.
 */
export function autoConnectAllLineSensors(
  components: Component3D[],
  currentWires: WireConnection[]
): AutoConnectResult {
  const lineSensors = components.filter((c) => c.type === 'line_sensor' && c.visible !== false);
  if (lineSensors.length === 0) {
    return {
      success: false,
      message: 'No IR line sensors found in workspace. Add a TCRT5000 sensor from the Component Library.',
      addedWires: [],
      alreadyConnectedCount: 0,
    };
  }

  let totalAdded: WireConnection[] = [];
  let totalAlready = 0;
  const messages: string[] = [];

  let accumulatedWires = [...currentWires];
  for (const sensor of lineSensors) {
    const res = autoConnectSingleLineSensor(sensor.id, components, accumulatedWires);
    if (res.success) {
      totalAdded.push(...res.addedWires);
      totalAlready += res.alreadyConnectedCount;
      accumulatedWires = [...accumulatedWires, ...res.addedWires];
      messages.push(`${sensor.name}: ${res.addedWires.length} added`);
    } else {
      messages.push(`${sensor.name}: ${res.message}`);
    }
  }

  return {
    success: totalAdded.length > 0 || totalAlready > 0,
    message: `Line sensors setup: ${totalAdded.length} wire(s) connected (${messages.join('; ')}).`,
    addedWires: totalAdded,
    alreadyConnectedCount: totalAlready,
  };
}
