import { autoConnectUltrasonicSensor } from '../../../../../OneDrive/Desktop/rea/hardware-workbench/src/utils/sensorAutoConnect';
import { evaluateCircuitState } from '../../../../../OneDrive/Desktop/rea/hardware-workbench/src/utils/hardwareBridge';
import { SafeArduinoRuntime, SKETCH_PRESETS } from '../../../../../OneDrive/Desktop/rea/hardware-workbench/src/utils/arduinoRuntime';
import type { Component3D, WireConnection } from '../../../../../OneDrive/Desktop/rea/hardware-workbench/src/types/workbench';

console.log('================================================================');
console.log('Hardware Workbench — Phase 5A Automated Test Suite');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------
// Test 1: Auto-connect from an un-wired ultrasonic sensor
// ----------------------------------------------------------------------
console.log('--- TEST 1: Auto-connect Demo Sensor from Un-wired State ---');

const mockArduino: Component3D = {
  id: 'arduino_01',
  name: 'Controller Board',
  type: 'arduino',
  category: 'controller',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  visible: true,
};

const mockSonar: Component3D = {
  id: 'ultrasonic_eye',
  name: 'Sonar Eyes',
  type: 'ultrasonic',
  category: 'sensor',
  position: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  visible: true,
  metadata: { distanceCm: 45 },
};

const components: Component3D[] = [mockArduino, mockSonar];
let currentWires: WireConnection[] = [];

const result1 = autoConnectUltrasonicSensor(mockSonar.id, components, currentWires);
assert(result1.success === true, 'Auto-connect returns success = true');
assert(result1.addedWires.length === 4, 'Auto-connect returns exactly 4 added wires', `got ${result1.addedWires.length}`);

// Check exact terminals
const vccWire = result1.addedWires.find(w => w.toTerminalId === 'VCC' || w.fromTerminalId === 'VCC');
const gndWire = result1.addedWires.find(w => w.toTerminalId === 'GND' || w.fromTerminalId === 'GND');
const trigWire = result1.addedWires.find(w => w.toTerminalId === 'TRIG' || w.fromTerminalId === 'TRIG');
const echoWire = result1.addedWires.find(w => w.toTerminalId === 'ECHO' || w.fromTerminalId === 'ECHO');

assert(!!vccWire && (vccWire.fromTerminalId === '5V' || vccWire.toTerminalId === '5V'), 'VCC connected to Arduino 5V');
assert(!!gndWire && (gndWire.fromTerminalId === 'GND_1' || gndWire.toTerminalId === 'GND_1'), 'GND connected to Arduino GND_1');
assert(!!trigWire && (trigWire.fromTerminalId === 'D11' || trigWire.toTerminalId === 'D11'), 'TRIG connected to Arduino D11');
assert(!!echoWire && (echoWire.fromTerminalId === 'D12' || echoWire.toTerminalId === 'D12'), 'ECHO connected to Arduino D12');

// ----------------------------------------------------------------------
// Test 2: Duplicate Wire Prevention
// ----------------------------------------------------------------------
console.log('\n--- TEST 2: Duplicate Wire Prevention ---');
currentWires = [...result1.addedWires];

const result2 = autoConnectUltrasonicSensor(mockSonar.id, components, currentWires);
assert(result2.success === true, 'Duplicate check returns success = true');
assert(result2.addedWires.length === 0, '0 duplicate wires created when already connected', `got ${result2.addedWires.length}`);
assert(result2.message.includes('0 duplicate wires created'), 'Message reports 0 duplicate wires created', result2.message);

// ----------------------------------------------------------------------
// Test 3: Partial Connection Repair
// ----------------------------------------------------------------------
console.log('\n--- TEST 3: Partial Connection Repair ---');
// Remove VCC wire
currentWires = currentWires.filter(w => w.toTerminalId !== 'VCC' && w.fromTerminalId !== 'VCC');
assert(currentWires.length === 3, 'Wires count reduced to 3 after disconnecting VCC');

const result3 = autoConnectUltrasonicSensor(mockSonar.id, components, currentWires);
assert(result3.success === true, 'Repair returns success = true');
assert(result3.addedWires.length === 1, 'Only 1 missing wire added on repair', `got ${result3.addedWires.length}`);
assert(result3.addedWires[0].toTerminalId === 'VCC' || result3.addedWires[0].fromTerminalId === 'VCC', 'Added wire connects VCC to 5V');
assert(result3.message.includes('Auto-connected 1 missing wire'), 'Status message specifies 1 missing wire repaired', result3.message);

// ----------------------------------------------------------------------
// Test 4: Missing Board Error Handling
// ----------------------------------------------------------------------
console.log('\n--- TEST 4: Missing Board Error Handling ---');
const componentsWithoutArduino = [mockSonar];
const result4 = autoConnectUltrasonicSensor(mockSonar.id, componentsWithoutArduino, []);
assert(result4.success === false, 'Returns success = false when Arduino is missing');
assert(result4.message.includes('Virtual Arduino board not found'), 'Clear missing board explanation provided', result4.message);

// ----------------------------------------------------------------------
// Test 5: Circuit State Evaluation (hardwareBridge)
// ----------------------------------------------------------------------
console.log('\n--- TEST 5: Hardware Bridge Circuit Evaluation ---');
currentWires = [...result1.addedWires];
const circuitComplete = evaluateCircuitState(components, currentWires, [], {}, 'stopped');
const sonarState = circuitComplete.ultrasonics.get(mockSonar.id);

assert(sonarState !== undefined, 'Ultrasonic sensor evaluated in circuitState');
assert(sonarState?.isCircuitComplete === true, 'Circuit evaluated as complete (4-Wire)');
assert(sonarState?.trigPin === 11, 'TRIG pin resolved to 11');
assert(sonarState?.echoPin === 12, 'ECHO pin resolved to 12');
assert(sonarState?.pulseDurationUs === Math.round(45 * 58.2), 'Pulse duration matches 45cm * 58.2us', `${sonarState?.pulseDurationUs}`);

// ----------------------------------------------------------------------
// Test 6: Preset 6 Sonar Obstacle Avoidance Execution
// ----------------------------------------------------------------------
console.log('\n--- TEST 6: Preset 6 Sonar Obstacle Avoidance Execution ---');
const preset6 = SKETCH_PRESETS.find(p => p.id === 'ultrasonic_obstacle');
assert(preset6 !== undefined, 'Preset 6 exists in SKETCH_PRESETS');

if (preset6) {
  async function runPresetTests() {
    // A. Test at 120 cm (Clear Cruising)
    console.log('\nTesting Sonar Obstacle Avoidance at 120 cm (Path Clear)...');
    mockSonar.metadata = { distanceCm: 120 };

    const serialLogs120: string[] = [];
    const runtime120 = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: (msg) => {
        serialLogs120.push(msg.text);
      },
      onPinChange: () => {},
      onStatsUpdate: () => {},
    });

    runtime120.setSensorResolver(() => {
      const state = evaluateCircuitState(components, currentWires, [], {}, 'running');
      return {
        ultrasonics: state.ultrasonics,
        potentiometers: state.potentiometers,
      };
    });

    const runPromise120 = runtime120.run(preset6.code);
    
    // Allow setup + multiple loop ticks to run
    await new Promise(r => setTimeout(r, 600));
    runtime120.stop();
    await runPromise120;

    const joinedLogs120 = serialLogs120.join(' ');
    const hasInit120 = joinedLogs120.includes('Obstacle Avoidance Autopilot initialized');
    const hasDist120 = joinedLogs120.includes('Sonar Ping Distance:') && serialLogs120.some(l => l.includes('120'));
    const hasClear120 = joinedLogs120.includes('Path clear: Cruising forward (PWM 190)');

    assert(hasInit120, 'Serial logged initialization message');
    assert(hasDist120, 'Serial logged "Sonar Ping Distance: 120 cm"', `Logs: ${JSON.stringify(serialLogs120)}`);
    assert(hasClear120, 'Serial logged "Path clear: Cruising forward (PWM 190)."');

    const pins120 = runtime120.getPins();
    assert(pins120[5]?.pwmValue === 190, 'Motor Left (D5) set to PWM 190 at 120 cm', `got ${pins120[5]?.pwmValue}`);
    assert(pins120[6]?.pwmValue === 190, 'Motor Right (D6) set to PWM 190 at 120 cm', `got ${pins120[6]?.pwmValue}`);
    assert(pins120[13]?.digitalValue === 0, 'Status LED (D13) set to LOW (0) at 120 cm', `got ${pins120[13]?.digitalValue}`);

    // B. Test at 10 cm (Obstacle Detected / Emergency Brake)
    console.log('\nTesting Sonar Obstacle Avoidance at 10 cm (Obstacle Detected)...');
    mockSonar.metadata = { distanceCm: 10 };

    const serialLogs10: string[] = [];
    const runtime10 = new SafeArduinoRuntime({
      onStatusChange: () => {},
      onConsoleMessage: (msg) => {
        serialLogs10.push(msg.text);
      },
      onPinChange: () => {},
      onStatsUpdate: () => {},
    });

    runtime10.setSensorResolver(() => {
      const state = evaluateCircuitState(components, currentWires, [], {}, 'running');
      return {
        ultrasonics: state.ultrasonics,
        potentiometers: state.potentiometers,
      };
    });

    const runPromise10 = runtime10.run(preset6.code);
    await new Promise(r => setTimeout(r, 600));
    runtime10.stop();
    await runPromise10;

    const joinedLogs10 = serialLogs10.join(' ');
    const hasDist10 = joinedLogs10.includes('Sonar Ping Distance:') && serialLogs10.some(l => l.includes('10'));
    const hasBrake10 = joinedLogs10.includes('OBSTACLE DETECTED! Braking motors, Warning LED ON.');

    assert(hasDist10, 'Serial logged "Sonar Ping Distance: 10 cm"', `Logs: ${JSON.stringify(serialLogs10)}`);
    assert(hasBrake10, 'Serial logged ">>> OBSTACLE DETECTED! Braking motors, Warning LED ON."');

    const pins10 = runtime10.getPins();
    assert(pins10[5]?.pwmValue === 0, 'Motor Left (D5) set to PWM 0 (braked) at 10 cm', `got ${pins10[5]?.pwmValue}`);
    assert(pins10[6]?.pwmValue === 0, 'Motor Right (D6) set to PWM 0 (braked) at 10 cm', `got ${pins10[6]?.pwmValue}`);
    assert(pins10[13]?.digitalValue === 1, 'Status LED (D13) set to HIGH (1) at 10 cm', `got ${pins10[13]?.digitalValue}`);

    // Summary
    console.log('\n================================================================');
    console.log(`Phase 5A Test Results: ${passCount} Passed, ${failCount} Failed`);
    console.log('================================================================');
    process.exit(failCount > 0 ? 1 : 0);
  }

  runPresetTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}
