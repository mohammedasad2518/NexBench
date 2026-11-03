import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  Component3D, 
  ComponentType, 
  TransformMode, 
  WireConnection, 
  ActiveTerminalRef,
  MechanicalAttachment,
  Vector3D,
  SimulatedPin,
  RuntimeStatus,
  ConsoleMessage,
  ArduinoProgramStats
} from './types/workbench';
import { getCatalogItem } from './utils/componentCatalog';
import { 
  findTerminal, 
  validateTerminalConnection, 
  getDefaultWireColor 
} from './utils/terminalDefinitions';
import { 
  findMountPoint,
  getComponentMountPoints,
  canAttach,
  calculateAttachmentTransforms,
  updateChildWorldFromParent 
} from './utils/assemblyDefinitions';
import { physicsWorld } from './utils/physicsEngine';
import { serializeScene, downloadSceneAsJson, parseSceneJson } from './utils/sceneSerializer';
import { SafeArduinoRuntime, createDefaultUnoPins, SKETCH_PRESETS } from './utils/arduinoRuntime';
import { evaluateCircuitState } from './utils/hardwareBridge';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { LandingPage } from './components/LandingPage';
import { Viewport3D } from './components/Viewport3D';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { autoConnectUltrasonicSensor, autoConnectSingleLineSensor } from './utils/sensorAutoConnect';
import { DEFAULT_TRACK_CONFIG } from './utils/floorTrack';
import type { TrackType } from './utils/floorTrack';
import { ProjectModal } from './components/ProjectModal';
import {
  saveProject,
  loadProject,
  saveAutosave,
  assembleProjectConfig,
  validateProjectJson,
  createDefaultCalibration,
  generateProjectId,
  getProjectIndex,
  type CalibrationProfile,
  type ProjectConfig,
} from './utils/projectPersistence';

// Initial pre-assembled demonstration robot setup
const INITIAL_COMPONENTS: Component3D[] = [
  {
    id: 'chassis_01',
    name: 'Main Chassis',
    type: 'chassis',
    category: 'structural',
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#334155',
    visible: true,
  },
  {
    id: 'arduino_01',
    name: 'Controller Board',
    type: 'arduino',
    category: 'controller',
    position: { x: 0, y: 0.65, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
    visible: true,
  },
  {
    id: 'motor_left',
    name: 'Left Drive Motor',
    type: 'dc_motor',
    category: 'actuator',
    position: { x: -1.4, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#eab308',
    visible: true,
  },
  {
    id: 'wheel_left',
    name: 'Left Wheel',
    type: 'wheel',
    category: 'actuator',
    position: { x: -2.0, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#1e293b',
    visible: true,
  },
  {
    id: 'motor_right',
    name: 'Right Drive Motor',
    type: 'dc_motor',
    category: 'actuator',
    position: { x: 1.4, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#eab308',
    visible: true,
  },
  {
    id: 'wheel_right',
    name: 'Right Wheel',
    type: 'wheel',
    category: 'actuator',
    position: { x: 2.0, y: 0.45, z: 0.5 },
    rotation: { x: 0, y: 180, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#1e293b',
    visible: true,
  },
  {
    id: 'servo_head',
    name: 'Steering Servo',
    type: 'servo',
    category: 'actuator',
    position: { x: 0, y: 0.95, z: 1.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#2563eb',
    visible: true,
  },
  {
    id: 'ultrasonic_eye',
    name: 'Sonar Eyes',
    type: 'ultrasonic',
    category: 'sensor',
    position: { x: 0, y: 1.5, z: 1.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    color: '#0284c7',
    visible: true,
    metadata: {
      distanceCm: 68,
      autoDistanceEnabled: true,
      showRayBeam: true,
      detectedObstacleName: 'Cardboard Box Obstacle',
    },
  },
  {
    id: 'line_sensor_left',
    name: 'Left IR Line Sensor',
    type: 'line_sensor',
    category: 'sensor',
    position: { x: -0.45, y: 0.15, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    color: '#2563eb',
    visible: true,
    metadata: {
      description: 'Downward TCRT5000 IR reflectance sensor mounted on left chassis front',
      lineSensorThreshold: 500,
    },
  },
  {
    id: 'line_sensor_right',
    name: 'Right IR Line Sensor',
    type: 'line_sensor',
    category: 'sensor',
    position: { x: 0.45, y: 0.15, z: 1.25 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    color: '#2563eb',
    visible: true,
    metadata: {
      description: 'Downward TCRT5000 IR reflectance sensor mounted on right chassis front',
      lineSensorThreshold: 500,
    },
  },
  {
    id: 'status_led',
    name: 'Power LED',
    type: 'led',
    category: 'output',
    position: { x: 0.8, y: 0.72, z: -0.8 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.8, y: 0.8, z: 0.8 },
    color: '#ef4444',
    visible: true,
  },
  {
    id: 'obstacle_box_01',
    name: 'Cardboard Box Obstacle',
    type: 'obstacle_box',
    category: 'structural',
    position: { x: 7.0, y: 1.1, z: 0.0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#d97706',
    visible: true,
    metadata: {
      description: 'Movable 3D obstacle box for ultrasonic range detection testing',
    },
  },
];

// Initial mechanical attachments linking chassis -> motors -> wheels, board, servo
const INITIAL_ATTACHMENTS: MechanicalAttachment[] = [
  {
    id: 'att_motor_left',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_motor_left',
    childComponentId: 'motor_left',
    childMountId: 'mount_chassis',
    jointType: 'fixed',
    relativePosition: { x: -1.4, y: -0.05, z: 0.5 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_motor_right',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_motor_right',
    childComponentId: 'motor_right',
    childMountId: 'mount_chassis',
    jointType: 'fixed',
    relativePosition: { x: 1.4, y: -0.05, z: 0.5 },
    relativeRotation: { x: 0, y: 180, z: 0 },
  },
  {
    id: 'att_wheel_left',
    parentComponentId: 'motor_left',
    parentMountId: 'mount_shaft',
    childComponentId: 'wheel_left',
    childMountId: 'mount_hub',
    jointType: 'revolute',
    motorSpeed: 15,
    motorMaxForce: 8.0,
    relativePosition: { x: -0.6, y: 0, z: 0 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_wheel_right',
    parentComponentId: 'motor_right',
    parentMountId: 'mount_shaft',
    childComponentId: 'wheel_right',
    childMountId: 'mount_hub',
    jointType: 'revolute',
    motorSpeed: 15,
    motorMaxForce: 8.0,
    relativePosition: { x: 0.6, y: 0, z: 0 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_arduino',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_board_center',
    childComponentId: 'arduino_01',
    childMountId: 'mount_standoff',
    jointType: 'fixed',
    relativePosition: { x: 0, y: 0.15, z: -0.2 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_servo',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_servo_front',
    childComponentId: 'servo_head',
    childMountId: 'mount_base',
    jointType: 'fixed',
    relativePosition: { x: 0, y: 0.45, z: 1.1 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_line_sensor_left',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_line_sensor_left',
    childComponentId: 'line_sensor_left',
    childMountId: 'mount_base',
    jointType: 'fixed',
    relativePosition: { x: -0.45, y: -0.35, z: 1.25 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'att_line_sensor_right',
    parentComponentId: 'chassis_01',
    parentMountId: 'mount_line_sensor_right',
    childComponentId: 'line_sensor_right',
    childMountId: 'mount_base',
    jointType: 'fixed',
    relativePosition: { x: 0.45, y: -0.35, z: 1.25 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
  // Phase 9B: Ultrasonic Sensor mounted atop Micro Servo 9g horn (Revolute joint)
  {
    id: 'att_ultrasonic_servo',
    parentComponentId: 'servo_head',
    parentMountId: 'mount_horn',
    childComponentId: 'ultrasonic_eye',
    childMountId: 'mount_base',
    jointType: 'revolute',
    relativePosition: { x: 0, y: 0.55, z: 0 },
    relativeRotation: { x: 0, y: 0, z: 0 },
  },
];

// Initial pre-connected 3D wires
const INITIAL_WIRES: WireConnection[] = [
  {
    id: 'wire_sonar_vcc',
    fromComponentId: 'arduino_01',
    fromTerminalId: '5V',
    toComponentId: 'ultrasonic_eye',
    toTerminalId: 'VCC',
    color: '#ef4444',
  },
  {
    id: 'wire_sonar_gnd',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_1',
    toComponentId: 'ultrasonic_eye',
    toTerminalId: 'GND',
    color: '#1e293b',
  },
  {
    id: 'wire_sonar_trig',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D11',
    toComponentId: 'ultrasonic_eye',
    toTerminalId: 'TRIG',
    color: '#3b82f6',
  },
  {
    id: 'wire_sonar_echo',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D12',
    toComponentId: 'ultrasonic_eye',
    toTerminalId: 'ECHO',
    color: '#06b6d4',
  },
  {
    id: 'wire_led_anode',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D13',
    toComponentId: 'status_led',
    toTerminalId: 'ANODE',
    color: '#10b981',
  },
  {
    id: 'wire_led_cathode',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_2',
    toComponentId: 'status_led',
    toTerminalId: 'CATHODE',
    color: '#334155',
  },
  {
    id: 'wire_motor_l_pos',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D5',
    toComponentId: 'motor_left',
    toTerminalId: 'TERM_POS',
    color: '#eab308',
  },
  {
    id: 'wire_motor_l_neg',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_DIG',
    toComponentId: 'motor_left',
    toTerminalId: 'TERM_NEG',
    color: '#1e293b',
  },
  {
    id: 'wire_motor_r_pos',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D6',
    toComponentId: 'motor_right',
    toTerminalId: 'TERM_POS',
    color: '#eab308',
  },
  {
    id: 'wire_motor_r_neg',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_DIG',
    toComponentId: 'motor_right',
    toTerminalId: 'TERM_NEG',
    color: '#1e293b',
  },
  // Phase 8A: Left TCRT5000 IR Line Sensor (VCC, GND, DO -> D4, AO -> A1)
  {
    id: 'wire_ls_l_vcc',
    fromComponentId: 'arduino_01',
    fromTerminalId: '5V',
    toComponentId: 'line_sensor_left',
    toTerminalId: 'VCC',
    color: '#ef4444',
  },
  {
    id: 'wire_ls_l_gnd',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_1',
    toComponentId: 'line_sensor_left',
    toTerminalId: 'GND',
    color: '#1e293b',
  },
  {
    id: 'wire_ls_l_do',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D4',
    toComponentId: 'line_sensor_left',
    toTerminalId: 'DO',
    color: '#3b82f6',
  },
  {
    id: 'wire_ls_l_ao',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'A1',
    toComponentId: 'line_sensor_left',
    toTerminalId: 'AO',
    color: '#06b6d4',
  },
  // Phase 8A: Right TCRT5000 IR Line Sensor (VCC, GND, DO -> D7, AO -> A2)
  {
    id: 'wire_ls_r_vcc',
    fromComponentId: 'arduino_01',
    fromTerminalId: '5V',
    toComponentId: 'line_sensor_right',
    toTerminalId: 'VCC',
    color: '#ef4444',
  },
  {
    id: 'wire_ls_r_gnd',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_2',
    toComponentId: 'line_sensor_right',
    toTerminalId: 'GND',
    color: '#334155',
  },
  {
    id: 'wire_ls_r_do',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D7',
    toComponentId: 'line_sensor_right',
    toTerminalId: 'DO',
    color: '#3b82f6',
  },
  {
    id: 'wire_ls_r_ao',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'A2',
    toComponentId: 'line_sensor_right',
    toTerminalId: 'AO',
    color: '#06b6d4',
  },
  // Phase 9B: Micro Servo 9g Wiring (5V, GND, Signal -> D9)
  {
    id: 'wire_servo_vcc',
    fromComponentId: 'arduino_01',
    fromTerminalId: '5V',
    toComponentId: 'servo_head',
    toTerminalId: 'VCC',
    color: '#ef4444',
  },
  {
    id: 'wire_servo_gnd',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'GND_1',
    toComponentId: 'servo_head',
    toTerminalId: 'GND',
    color: '#1e293b',
  },
  {
    id: 'wire_servo_sig',
    fromComponentId: 'arduino_01',
    fromTerminalId: 'D9',
    toComponentId: 'servo_head',
    toTerminalId: 'SIGNAL',
    color: '#f97316',
  },
];

const LAYOUT_STORAGE_KEY = 'hw_workbench_layout';

interface WorkbenchLayout {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  bottomCollapsed: boolean;
  codePanelHeight: number;
}

function loadSavedLayout(): WorkbenchLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        leftCollapsed: Boolean(parsed.leftCollapsed),
        rightCollapsed: Boolean(parsed.rightCollapsed),
        bottomCollapsed: Boolean(parsed.bottomCollapsed),
        codePanelHeight: typeof parsed.codePanelHeight === 'number' ? parsed.codePanelHeight : 320,
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    leftCollapsed: false,
    rightCollapsed: false,
    bottomCollapsed: false,
    codePanelHeight: 320,
  };
}

export function App() {
  // Top-level Navigation View: 'landing' or 'workbench'
  const [currentView, setCurrentView] = useState<'landing' | 'workbench'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#workbench') {
      return 'workbench';
    }
    return 'landing';
  });

  // Workspace Layout Preferences (persisted in localStorage)
  const [layoutPrefs] = useState<WorkbenchLayout>(() => loadSavedLayout());
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(layoutPrefs.leftCollapsed);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(layoutPrefs.rightCollapsed);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState<boolean>(layoutPrefs.bottomCollapsed);
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<{ view: 'perspective' | 'top' | 'front' | 'side' | 'reset'; timestamp: number } | null>(null);

  const [components, setComponents] = useState<Component3D[]>(INITIAL_COMPONENTS);
  const [wires, setWires] = useState<WireConnection[]>(INITIAL_WIRES);
  const [attachments, setAttachments] = useState<MechanicalAttachment[]>(INITIAL_ATTACHMENTS);

  const [selectedId, setSelectedId] = useState<string | null>('chassis_01');
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [snapTranslate, setSnapTranslate] = useState<boolean>(true);
  const [snapRotate, setSnapRotate] = useState<boolean>(true);
  const [gridVisible, setGridVisible] = useState<boolean>(true);

  // Wiring Mode
  const [isWiringMode, setIsWiringMode] = useState<boolean>(false);
  const [activeSourceTerminal, setActiveSourceTerminal] = useState<ActiveTerminalRef | null>(null);

  // Assembly Mode
  const [isAssemblyMode, setIsAssemblyMode] = useState<boolean>(false);
  const [activeMountCandidateId, setActiveMountCandidateId] = useState<string | null>(null);

  // Physics Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSimulationPaused, setIsSimulationPaused] = useState<boolean>(false);
  const preSimTransformsRef = useRef<Map<string, { position: Vector3D; rotation: Vector3D }>>(new Map());

  // Phase 4A: Arduino Code Editor & Simulated Runtime State
  const [isCodePanelOpen, setIsCodePanelOpen] = useState<boolean>(!layoutPrefs.bottomCollapsed);
  const [codePanelHeight, setCodePanelHeight] = useState<number>(layoutPrefs.codePanelHeight);
  const [sketchCode, setSketchCode] = useState<string>(SKETCH_PRESETS[0].code);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>('stopped');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [simulatedPins, setSimulatedPins] = useState<Record<number, SimulatedPin>>(createDefaultUnoPins);
  const [runtimeStats, setRuntimeStats] = useState<ArduinoProgramStats>({
    cyclesCount: 0,
    elapsedMs: 0,
    lastLoopDurationMs: 0,
  });
  const runtimeRef = useRef<SafeArduinoRuntime | null>(null);

  // Maintain fresh references for real-time sensor queries inside the runtime
  const componentsRef = useRef(components);
  componentsRef.current = components;
  const wiresRef = useRef(wires);
  wiresRef.current = wires;
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const simulatedPinsRef = useRef(simulatedPins);
  simulatedPinsRef.current = simulatedPins;
  const runtimeStatusRef = useRef(runtimeStatus);
  runtimeStatusRef.current = runtimeStatus;

  // Phase 5B: Real-time ultrasonic obstacle raycasting refs & throttled UI updater
  const realTimeSonarDistancesRef = useRef<Map<string, number>>(new Map());
  const realTimeSonarObstaclesRef = useRef<Map<string, string>>(new Map());
  const lastUiUpdateRef = useRef<{ time: number; distanceCm: number; obstacleName: string | null }>({
    time: 0,
    distanceCm: -1,
    obstacleName: null,
  });

  const handleRaycastDistanceUpdate = useCallback((sensorId: string, distanceCm: number, obstacleName: string | null) => {
    // 1. Instantly update refs for 0ms latency in Arduino sketch loop
    realTimeSonarDistancesRef.current.set(sensorId, distanceCm);
    if (obstacleName) {
      realTimeSonarObstaclesRef.current.set(sensorId, obstacleName);
    } else {
      realTimeSonarObstaclesRef.current.delete(sensorId);
    }

    // 2. Throttle React state update to at most once per 120ms AND only when value changed
    const now = performance.now();
    const last = lastUiUpdateRef.current;
    if (now - last.time > 120 && (last.distanceCm !== distanceCm || last.obstacleName !== obstacleName)) {
      lastUiUpdateRef.current = { time: now, distanceCm, obstacleName };
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id === sensorId) {
            return {
              ...c,
              metadata: {
                ...c.metadata,
                distanceCm,
                detectedObstacleName: obstacleName,
              },
            };
          }
          return c;
        })
      );
    }
  }, []);

  // Phase 8A: Track configuration and Line Sensor world positions refs
  const [trackType, setTrackType] = useState<TrackType>('oval');
  const trackConfigRef = useRef({ ...DEFAULT_TRACK_CONFIG, type: trackType });
  trackConfigRef.current.type = trackType;
  const lineSensorPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());

  // Phase 9B: Servo angle state (0 to 180 deg, default 90)
  const [activeServoAngle, setActiveServoAngle] = useState<number>(90);
  const activeServoAngleRef = useRef<number>(90);
  activeServoAngleRef.current = activeServoAngle;

  // Phase 9C: Project Persistence, Autosave & Calibration State
  const [projectId, setProjectId] = useState<string>(() => generateProjectId());
  const [projectName, setProjectName] = useState<string>('Line Follower PID & Sonar Robot');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [activeCalibration, setActiveCalibration] = useState<CalibrationProfile>(() => createDefaultCalibration());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  // Sync calibration to track configuration
  useEffect(() => {
    trackConfigRef.current = {
      ...DEFAULT_TRACK_CONFIG,
      type: trackType,
      lineWidthUnits: activeCalibration.lineSensor.trackLineWidth,
      whiteReflectance: activeCalibration.lineSensor.whiteReflectance,
      blackReflectance: activeCalibration.lineSensor.blackReflectance,
    };
  }, [trackType, activeCalibration]);

  // Track dirty changes (after initial mount)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setIsDirty(true);
  }, [components, wires, attachments, sketchCode, trackType, activeCalibration]);

  // Persist panel layout preferences
  useEffect(() => {
    try {
      const layout: WorkbenchLayout = {
        leftCollapsed: isLeftCollapsed,
        rightCollapsed: isRightCollapsed,
        bottomCollapsed: isBottomCollapsed,
        codePanelHeight,
      };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      // storage unavailable
    }
  }, [isLeftCollapsed, isRightCollapsed, isBottomCollapsed, codePanelHeight]);

  const handleResetLayout = useCallback(() => {
    setIsLeftCollapsed(false);
    setIsRightCollapsed(false);
    setIsBottomCollapsed(false);
    setIsCodePanelOpen(true);
    setCodePanelHeight(320);
  }, []);

  const handleToggleComponentVisibility = useCallback((id: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: c.visible === false ? true : false } : c))
    );
    setIsDirty(true);
  }, []);

  // Periodic autosave (every 20s if dirty)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty) {
        const assembled = assembleProjectConfig({
          projectId,
          name: projectName,
          components,
          wires,
          attachments,
          settings: {
            gridVisible,
            axesVisible: true,
            snapTranslate,
            snapRotate,
            snapTranslateStep: 0.5,
            snapRotateStep: 15,
          },
          sketchCode,
          calibration: activeCalibration,
          trackType,
          servoAngle: activeServoAngle,
        });
        saveAutosave(assembled);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [isDirty, projectId, projectName, components, wires, attachments, gridVisible, snapTranslate, snapRotate, sketchCode, activeCalibration, trackType, activeServoAngle]);

  // Save on beforeunload if dirty
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty) {
        const assembled = assembleProjectConfig({
          projectId,
          name: projectName,
          components,
          wires,
          attachments,
          settings: {
            gridVisible,
            axesVisible: true,
            snapTranslate,
            snapRotate,
            snapTranslateStep: 0.5,
            snapRotateStep: 15,
          },
          sketchCode,
          calibration: activeCalibration,
          trackType,
          servoAngle: activeServoAngle,
        });
        saveAutosave(assembled);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, projectId, projectName, components, wires, attachments, gridVisible, snapTranslate, snapRotate, sketchCode, activeCalibration, trackType, activeServoAngle]);

  // Initialize sandboxed runtime engine
  useEffect(() => {
    const runtime = new SafeArduinoRuntime({
      onStatusChange: (status) => setRuntimeStatus(status),
      onConsoleMessage: (msg) => setConsoleMessages((prev) => [...prev.slice(-300), msg]),
      onPinChange: (pin) => {
        setSimulatedPins((prev) => ({ ...prev, [pin.pin]: pin }));
      },
      onStatsUpdate: (stats) => setRuntimeStats(stats),
      onServoChange: (servos) => {
        for (const s of servos.values()) {
          if (s.isAttached) {
            activeServoAngleRef.current = s.angle;
            setActiveServoAngle(s.angle);
            break;
          }
        }
      },
    });

    // Provide dynamic circuit resolver for virtual sensors (HC-SR04, potentiometer, IR line sensors & servo)
    runtime.setSensorResolver(() => {
      const servoAngles = new Map<string, number>();
      servoAngles.set('servo_head', activeServoAngleRef.current);
      return evaluateCircuitState(
        componentsRef.current,
        wiresRef.current,
        attachmentsRef.current,
        simulatedPinsRef.current,
        runtimeStatusRef.current,
        realTimeSonarDistancesRef.current,
        realTimeSonarObstaclesRef.current,
        trackConfigRef.current,
        lineSensorPositionsRef.current,
        servoAngles
      );
    });

    runtimeRef.current = runtime;

    return () => {
      runtime.stop();
    };
  }, []);

  const handleRunCode = async () => {
    if (runtimeRef.current) {
      await runtimeRef.current.run(sketchCode);
    }
  };

  const handleStopCode = () => {
    runtimeRef.current?.stop();
  };

  const handleResetRuntime = () => {
    runtimeRef.current?.reset();
    activeServoAngleRef.current = 90;
    setActiveServoAngle(90);
  };

  const handleClearConsole = () => {
    setConsoleMessages([]);
  };

  const handleSetVirtualInput = (pin: number, value: number) => {
    runtimeRef.current?.setVirtualInput(pin, value);
  };

  // Selected Component Lookup
  const selectedComponent = components.find((c) => c.id === selectedId) || null;

  // Hotkey toggle for wiring mode [C]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key.toLowerCase() === 'c') {
        setIsWiringMode((prev) => !prev);
        setIsAssemblyMode(false);
        setActiveSourceTerminal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper: Recursively update descendants when parent moves in edit mode
  const updateDescendants = (
    parentId: string,
    parentPos: Vector3D,
    parentRot: Vector3D,
    compList: Component3D[],
    attList: MechanicalAttachment[]
  ): Component3D[] => {
    let updated = [...compList];
    const directChildren = attList.filter((a) => a.parentComponentId === parentId);

    for (const att of directChildren) {
      const childWorld = updateChildWorldFromParent(
        parentPos,
        parentRot,
        att.relativePosition,
        att.relativeRotation
      );

      updated = updated.map((c) =>
        c.id === att.childComponentId
          ? { ...c, position: childWorld.position, rotation: childWorld.rotation }
          : c
      );

      // Recursive update for descendants (chassis -> motor -> wheel)
      updated = updateDescendants(
        att.childComponentId,
        childWorld.position,
        childWorld.rotation,
        updated,
        attList
      );
    }

    return updated;
  };

  // Add Component from Catalog
  const handleAddComponent = (type: ComponentType) => {
    const catalogItem = getCatalogItem(type);
    if (!catalogItem) return;

    const offset = (Math.random() - 0.5) * 2;
    const newComponent: Component3D = {
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${catalogItem.name} ${components.filter((c) => c.type === type).length + 1}`,
      type: catalogItem.type,
      category: catalogItem.category,
      position: { x: offset, y: 0.5, z: offset },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { ...catalogItem.defaultScale },
      color: catalogItem.defaultColor,
      visible: true,
    };

    setComponents((prev) => [...prev, newComponent]);
    setSelectedId(newComponent.id);
    setSelectedWireId(null);
  };

  // Update Component Properties
  const handleUpdateComponent = (updated: Component3D) => {
    setComponents((prev) => {
      let next = prev.map((c) => (c.id === updated.id ? updated : c));
      // Update attached children
      next = updateDescendants(
        updated.id,
        updated.position,
        updated.rotation,
        next,
        attachments
      );
      return next;
    });
  };

  // Direct Gizmo Transform Update (Synchronizes attached children)
  const handleUpdateComponentTransform = (
    id: string,
    pos: { x: number; y: number; z: number },
    rot: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number }
  ) => {
    setComponents((prev) => {
      let next = prev.map((c) =>
        c.id === id ? { ...c, position: pos, rotation: rot, scale: scale } : c
      );
      next = updateDescendants(id, pos, rot, next, attachments);
      return next;
    });
  };

  // Delete Component (Cascade removal of connected wires and attachments)
  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => w.fromComponentId !== id && w.toComponentId !== id));
    setAttachments((prev) => prev.filter((a) => a.parentComponentId !== id && a.childComponentId !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate Component
  const handleDuplicateComponent = (id: string) => {
    const original = components.find((c) => c.id === id);
    if (!original) return;

    const duplicate: Component3D = {
      ...original,
      id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${original.name} (Copy)`,
      position: {
        x: original.position.x + 0.5,
        y: original.position.y,
        z: original.position.z + 0.5,
      },
    };

    setComponents((prev) => [...prev, duplicate]);
    setSelectedId(duplicate.id);
    setSelectedWireId(null);
  };

  // Phase 3: Mechanical Attachment Handlers
  const handleAttachComponent = (
    childId: string,
    parentId: string,
    parentMountId: string
  ) => {
    const parentComp = components.find((c) => c.id === parentId);
    const childComp = components.find((c) => c.id === childId);
    if (!parentComp || !childComp) return;

    const parentMount = findMountPoint(parentComp, parentMountId);
    const childMounts = getComponentMountPoints(childComp);
    const childMount = childMounts[0];
    if (!parentMount || !childMount) return;

    const check = canAttach(childComp, parentComp, parentMount, attachments);
    if (!check.allowed) {
      alert(`Cannot attach: ${check.reason}`);
      return;
    }

    const { childWorldPosition, childWorldRotation, relativePosition, relativeRotation } =
      calculateAttachmentTransforms(parentComp, parentMount, childComp, childMount);

    // Snap child into place
    setComponents((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, position: childWorldPosition, rotation: childWorldRotation }
          : c
      )
    );

    const newAttachment: MechanicalAttachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      parentComponentId: parentId,
      parentMountId: parentMountId,
      childComponentId: childId,
      childMountId: childMount.id,
      jointType: parentMount.defaultJointType,
      motorSpeed: parentMount.defaultJointType === 'revolute' ? 15 : 0,
      motorMaxForce: 8.0,
      relativePosition,
      relativeRotation,
    };

    setAttachments((prev) => [...prev, newAttachment]);
    setIsAssemblyMode(false);
    setActiveMountCandidateId(null);
  };

  // Remove Attachment without deleting component
  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  // Update Attachment Joint parameters (e.g. motor speed)
  const handleUpdateAttachment = (updated: MechanicalAttachment) => {
    setAttachments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (isSimulating) {
      physicsWorld.setMotorSpeed(updated.id, updated.motorSpeed || 0, updated.motorMaxForce || 8.0);
    }
  };

  const handleStartAssemblyForComponent = (componentId: string) => {
    setActiveMountCandidateId(componentId);
    setIsAssemblyMode(true);
    setIsWiringMode(false);
  };

  // Phase 3: Rapier Physics Simulation Controls
  const handleStartSimulation = async () => {
    // Snapshot design state for reset
    const snapshot = new Map<string, { position: Vector3D; rotation: Vector3D }>();
    components.forEach((c) => {
      snapshot.set(c.id, {
        position: { ...c.position },
        rotation: { ...c.rotation },
      });
    });
    preSimTransformsRef.current = snapshot;

    await physicsWorld.init(components, attachments);
    setIsSimulating(true);
    setIsSimulationPaused(false);
    setSelectedId(null);
    setSelectedWireId(null);
  };

  const handlePauseSimulation = () => {
    setIsSimulationPaused((prev) => !prev);
  };

  const handleResetSimulation = () => {
    physicsWorld.cleanup();
    setIsSimulating(false);
    setIsSimulationPaused(false);

    // Restore design positions
    if (preSimTransformsRef.current.size > 0) {
      setComponents((prev) =>
        prev.map((c) => {
          const orig = preSimTransformsRef.current.get(c.id);
          return orig
            ? { ...c, position: { ...orig.position }, rotation: { ...orig.rotation } }
            : c;
        })
      );
    }
  };

  // Wiring Handlers
  const handleConnectTerminals = (source: ActiveTerminalRef, target: ActiveTerminalRef) => {
    const srcComp = components.find((c) => c.id === source.componentId);
    const dstComp = components.find((c) => c.id === target.componentId);
    if (!srcComp || !dstComp) return;

    const srcTerm = findTerminal(srcComp, source.terminalId);
    const dstTerm = findTerminal(dstComp, target.terminalId);
    if (!srcTerm || !dstTerm) return;

    const validation = validateTerminalConnection(
      { comp: srcComp, term: srcTerm },
      { comp: dstComp, term: dstTerm },
      wires
    );

    if (!validation.valid) {
      alert(`Wire Connection Rejected: ${validation.message}`);
      return;
    }

    const newWire: WireConnection = {
      id: `wire_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromComponentId: source.componentId,
      fromTerminalId: source.terminalId,
      toComponentId: target.componentId,
      toTerminalId: target.terminalId,
      color: getDefaultWireColor(srcTerm.category, dstTerm.category),
    };

    setWires((prev) => [...prev, newWire]);
    setActiveSourceTerminal(null);
    setSelectedWireId(newWire.id);
  };

  const handleDeleteWire = (wireId: string) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    if (selectedWireId === wireId) setSelectedWireId(null);
  };

  const handleUpdateWire = (updated: WireConnection) => {
    setWires((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleStartWireFromTerminal = (componentId: string, terminalId: string) => {
    setIsWiringMode(true);
    setIsAssemblyMode(false);
    setActiveSourceTerminal({ componentId, terminalId });
  };

  const handleAutoConnectUltrasonic = (sensorId: string) => {
    const result = autoConnectUltrasonicSensor(sensorId, components, wires);
    if (result.addedWires.length > 0) {
      setWires((prev) => [...prev, ...result.addedWires]);
    }
    return result;
  };

  const handleAutoConnectLineSensor = (sensorId: string) => {
    const result = autoConnectSingleLineSensor(sensorId, components, wires);
    if (result.addedWires.length > 0) {
      setWires((prev) => [...prev, ...result.addedWires]);
    }
    return result;
  };

  // Reset Scene
  const handleResetScene = () => {
    if (window.confirm('Clear all components, attachments, and wiring from the 3D workspace?')) {
      physicsWorld.cleanup();
      setIsSimulating(false);
      setComponents([]);
      setWires([]);
      setAttachments([]);
      setSelectedId(null);
      setSelectedWireId(null);
      setActiveSourceTerminal(null);
    }
  };

  // Phase 9C: Project Persistence Handlers
  const handleSaveProject = useCallback(() => {
    const assembled = assembleProjectConfig({
      projectId,
      name: projectName,
      components,
      wires,
      attachments,
      settings: {
        gridVisible,
        axesVisible: true,
        snapTranslate,
        snapRotate,
        snapTranslateStep: 0.5,
        snapRotateStep: 15,
      },
      sketchCode,
      calibration: activeCalibration,
      trackType,
      servoAngle: activeServoAngle,
    });
    const res = saveProject(assembled);
    if (res.success) {
      setIsDirty(false);
      setLastSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [projectId, projectName, components, wires, attachments, gridVisible, snapTranslate, snapRotate, sketchCode, activeCalibration, trackType, activeServoAngle]);

  const handleLoadProjectById = useCallback((id: string) => {
    const res = loadProject(id);
    if (!res.project) {
      alert(res.error || 'Failed to load project');
      return;
    }
    const p = res.project;
    physicsWorld.cleanup();
    runtimeRef.current?.reset();
    setIsSimulating(false);
    setComponents(p.components || []);
    setWires(p.wires || []);
    setAttachments(p.attachments || []);
    if (p.sketchCode) setSketchCode(p.sketchCode);
    if (p.trackType) setTrackType(p.trackType as TrackType);
    if (p.calibration) setActiveCalibration(p.calibration);
    if (typeof p.servoAngle === 'number') setActiveServoAngle(p.servoAngle);
    if (p.settings) {
      setGridVisible(p.settings.gridVisible);
      setSnapTranslate(p.settings.snapTranslate);
      setSnapRotate(p.settings.snapRotate);
    }
    setProjectId(p.projectId || id);
    setProjectName(p.name || 'Saved Project');
    setIsDirty(false);
    setLastSaveTime(new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSelectedId(p.components[0]?.id || null);
    setSelectedWireId(null);
  }, []);

  const handleNewProject = useCallback((name?: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Start a new project anyway?')) {
      return;
    }
    physicsWorld.cleanup();
    runtimeRef.current?.reset();
    setIsSimulating(false);
    setComponents(INITIAL_COMPONENTS);
    setWires(INITIAL_WIRES);
    setAttachments(INITIAL_ATTACHMENTS);
    setSketchCode(SKETCH_PRESETS[0].code);
    setSelectedId('chassis_01');
    setSelectedWireId(null);
    setProjectId(generateProjectId());
    setProjectName(name || 'New Robot Project');
    setIsDirty(false);
    setLastSaveTime(null);
  }, [isDirty]);

  const handleRestoreAutosave = useCallback((p: ProjectConfig) => {
    physicsWorld.cleanup();
    runtimeRef.current?.reset();
    setIsSimulating(false);
    setComponents(p.components || []);
    setWires(p.wires || []);
    setAttachments(p.attachments || []);
    if (p.sketchCode) setSketchCode(p.sketchCode);
    if (p.trackType) setTrackType(p.trackType as TrackType);
    if (p.calibration) setActiveCalibration(p.calibration);
    if (typeof p.servoAngle === 'number') setActiveServoAngle(p.servoAngle);
    if (p.settings) {
      setGridVisible(p.settings.gridVisible);
      setSnapTranslate(p.settings.snapTranslate);
      setSnapRotate(p.settings.snapRotate);
    }
    setProjectId(p.projectId || generateProjectId());
    setProjectName(p.name || 'Restored Autosave');
    setIsDirty(false);
    setSelectedId(p.components[0]?.id || null);
    setSelectedWireId(null);
  }, []);

  const handleLoadProjectFromConfig = useCallback((p: ProjectConfig) => {
    physicsWorld.cleanup();
    runtimeRef.current?.reset();
    setIsSimulating(false);
    setComponents(p.components || []);
    setWires(p.wires || []);
    setAttachments(p.attachments || []);
    if (p.sketchCode) setSketchCode(p.sketchCode);
    if (p.trackType) setTrackType(p.trackType as TrackType);
    if (p.calibration) setActiveCalibration(p.calibration);
    if (typeof p.servoAngle === 'number') setActiveServoAngle(p.servoAngle);
    if (p.settings) {
      setGridVisible(p.settings.gridVisible);
      setSnapTranslate(p.settings.snapTranslate);
      setSnapRotate(p.settings.snapRotate);
    }
    setProjectId(generateProjectId());
    setProjectName(p.name);
    setIsDirty(false);
    setLastSaveTime(null);
    setSelectedId(p.components[0]?.id || null);
    setSelectedWireId(null);
  }, []);

  // Export JSON (Includes components, wires, attachments, sketchCode, calibration, trackType, and servoAngle)
  const handleExport = () => {
    const scene = serializeScene(
      components,
      wires,
      attachments,
      {
        gridVisible,
        axesVisible: true,
        snapTranslate,
        snapRotate,
        snapTranslateStep: 0.5,
        snapRotateStep: 15,
      },
      projectName,
      sketchCode,
      trackType,
      activeServoAngle,
      activeCalibration,
      projectId
    );
    downloadSceneAsJson(scene);
  };

  // Import JSON with validation
  const handleImport = (jsonStr: string) => {
    try {
      const parsedJson = JSON.parse(jsonStr);
      const validation = validateProjectJson(parsedJson);
      if (!validation.valid) {
        alert(`Invalid project JSON:\n${validation.errors.join('\n')}`);
        return;
      }
      const scene = parseSceneJson(jsonStr);
      physicsWorld.cleanup();
      runtimeRef.current?.reset();
      setIsSimulating(false);
      setComponents(scene.components);
      setWires(scene.wires || []);
      setAttachments(scene.attachments || []);
      if (scene.sketchCode) {
        setSketchCode(scene.sketchCode);
      }
      if (scene.trackType) {
        setTrackType(scene.trackType as TrackType);
      }
      if (scene.calibration) {
        setActiveCalibration(scene.calibration);
      }
      if (typeof scene.servoAngle === 'number') {
        setActiveServoAngle(scene.servoAngle);
      }
      setSelectedId(scene.components[0]?.id || null);
      setSelectedWireId(null);
      setGridVisible(scene.settings.gridVisible);
      setSnapTranslate(scene.settings.snapTranslate);
      setSnapRotate(scene.settings.snapRotate);
      setProjectName(scene.name || 'Imported Robot Project');
      setProjectId(scene.projectId || generateProjectId());
      setIsDirty(false);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const activeSourceInfo = (() => {
    if (!activeSourceTerminal) return null;
    const c = components.find((comp) => comp.id === activeSourceTerminal.componentId);
    const t = c ? findTerminal(c, activeSourceTerminal.terminalId) : null;
    if (!c || !t) return null;
    return { compName: c.name, termName: t.name };
  })();

  // 1. Landing Welcome View (BenchTwin Inspired)
  if (currentView === 'landing') {
    return (
      <LandingPage
        onOpenWorkbench={() => {
          setCurrentView('workbench');
          if (typeof window !== 'undefined') window.location.hash = '#workbench';
        }}
        onLaunchTemplate={(config) => {
          handleLoadProjectFromConfig(config);
          setCurrentView('workbench');
          if (typeof window !== 'undefined') window.location.hash = '#workbench';
        }}
        savedProjectCount={getProjectIndex().length}
      />
    );
  }

  // 2. Main Workbench Workspace View
  return (
    <div className="workbench-root">
      {/* Top Application Header */}
      <Header
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        snapTranslate={snapTranslate}
        setSnapTranslate={setSnapTranslate}
        snapRotate={snapRotate}
        setSnapRotate={setSnapRotate}
        gridVisible={gridVisible}
        setGridVisible={setGridVisible}
        isWiringMode={isWiringMode}
        setIsWiringMode={(val) => {
          setIsWiringMode(val);
          if (val) setIsAssemblyMode(false);
          if (!val) setActiveSourceTerminal(null);
        }}
        isAssemblyMode={isAssemblyMode}
        setIsAssemblyMode={(val) => {
          setIsAssemblyMode(val);
          if (val) setIsWiringMode(false);
        }}
        isCodePanelOpen={isCodePanelOpen}
        setIsCodePanelOpen={setIsCodePanelOpen}
        runtimeStatus={runtimeStatus}
        isSimulating={isSimulating}
        isSimulationPaused={isSimulationPaused}
        onStartSimulation={handleStartSimulation}
        onPauseSimulation={handlePauseSimulation}
        onResetSimulation={handleResetSimulation}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleResetScene}
        onSaveProject={handleSaveProject}
        onLoadProject={() => setIsProjectModalOpen(true)}
        onNewProject={() => handleNewProject()}
        projectName={projectName}
        onRenameProject={(newName) => {
          setProjectName(newName);
          setIsDirty(true);
        }}
        isDirty={isDirty}
        lastSaveTime={lastSaveTime}
        componentCount={components.length}
        wireCount={wires.length}
        attachmentCount={attachments.length}
        selectedName={selectedComponent?.name || null}
        activeSourceInfo={activeSourceInfo}
        onCancelWiring={() => setActiveSourceTerminal(null)}
        onGoHome={() => {
          setCurrentView('landing');
          if (typeof window !== 'undefined') window.location.hash = '';
        }}
        isLeftCollapsed={isLeftCollapsed}
        onToggleLeft={() => setIsLeftCollapsed((prev) => !prev)}
        isRightCollapsed={isRightCollapsed}
        onToggleRight={() => setIsRightCollapsed((prev) => !prev)}
        isBottomCollapsed={isBottomCollapsed}
        onToggleBottom={() => {
          const next = !isBottomCollapsed;
          setIsBottomCollapsed(next);
          setIsCodePanelOpen(!next);
        }}
        onResetLayout={handleResetLayout}
        trackType={trackType}
        onTrackTypeChange={setTrackType}
        onCameraPreset={(view) => setCameraPresetTrigger({ view, timestamp: Date.now() })}
      />

      {/* Project & Calibration Management Modal (Phase 9C) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentProjectId={projectId}
        currentProjectName={projectName}
        onRenameProject={(newName) => {
          setProjectName(newName);
          setIsDirty(true);
        }}
        onLoadProjectById={handleLoadProjectById}
        onLoadProjectFromConfig={handleLoadProjectFromConfig}
        onNewProject={handleNewProject}
        onSaveCurrentProject={handleSaveProject}
        onRestoreAutosave={handleRestoreAutosave}
        activeCalibration={activeCalibration}
        onUpdateCalibration={(newCalib) => {
          setActiveCalibration(newCalib);
          setIsDirty(true);
        }}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="workbench-main">
        {/* Left: Component Catalog, Hierarchy Tree & Templates */}
        <LeftSidebar
          onAddComponent={handleAddComponent}
          components={components}
          selectedId={selectedId}
          onSelectComponent={(id) => {
            setSelectedId(id);
            if (id) setSelectedWireId(null);
          }}
          onToggleVisibility={handleToggleComponentVisibility}
          onDeleteComponent={handleDeleteComponent}
          attachments={attachments}
          wires={wires}
          onLoadTemplate={handleLoadProjectFromConfig}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed((prev) => !prev)}
        />

        {/* Center: 3D Viewport with Orbit, Transform, Wiring, Assembly & Physics */}
        <Viewport3D
          components={components}
          selectedId={selectedId}
          onSelectComponent={(id) => {
            setSelectedId(id);
            if (id) setSelectedWireId(null);
          }}
          onUpdateComponentTransform={handleUpdateComponentTransform}
          transformMode={transformMode}
          snapTranslate={snapTranslate}
          snapRotate={snapRotate}
          gridVisible={gridVisible}
          setGridVisible={setGridVisible}
          onDeleteSelected={() => {
            if (selectedId) handleDeleteComponent(selectedId);
            else if (selectedWireId) handleDeleteWire(selectedWireId);
          }}
          setTransformMode={setTransformMode}
          onDropComponent={handleAddComponent}
          wires={wires}
          selectedWireId={selectedWireId}
          onSelectWire={(wId) => {
            setSelectedWireId(wId);
            if (wId) setSelectedId(null);
          }}
          isWiringMode={isWiringMode}
          activeSourceTerminal={activeSourceTerminal}
          onConnectTerminals={handleConnectTerminals}
          setActiveSourceTerminal={setActiveSourceTerminal}
          attachments={attachments}
          isAssemblyMode={isAssemblyMode}
          activeMountCandidateId={activeMountCandidateId || selectedId}
          onAttachComponent={handleAttachComponent}
          isSimulating={isSimulating}
          isSimulationPaused={isSimulationPaused}
          simulatedPins={simulatedPins}
          runtimeStatus={runtimeStatus}
          onRaycastDistanceUpdate={handleRaycastDistanceUpdate}
          onTriggerVirtualInterrupt={(pin) => {
            runtimeRef.current?.triggerInterrupt(pin);
          }}
          trackType={trackType}
          onTrackTypeChange={setTrackType}
          onLineSensorUpdate={(posMap) => {
            lineSensorPositionsRef.current = posMap;
          }}
          activeServoAngle={activeServoAngle}
          cameraPresetTrigger={cameraPresetTrigger}
        />

        {/* Right: Properties, Joints & Terminals Inspector */}
        <PropertiesPanel
          selectedComponent={selectedComponent}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={handleDeleteComponent}
          onDuplicateComponent={handleDuplicateComponent}
          allComponents={components}
          onSelectComponent={(id) => {
            setSelectedId(id);
            if (id) setSelectedWireId(null);
          }}
          wires={wires}
          selectedWireId={selectedWireId}
          onSelectWire={(wId) => {
            setSelectedWireId(wId);
            if (wId) setSelectedId(null);
          }}
          onDeleteWire={handleDeleteWire}
          onUpdateWire={handleUpdateWire}
          onStartWireFromTerminal={handleStartWireFromTerminal}
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
          onUpdateAttachment={handleUpdateAttachment}
          onStartAssemblyForComponent={handleStartAssemblyForComponent}
          simulatedPins={simulatedPins}
          runtimeStatus={runtimeStatus}
          onAutoConnectUltrasonic={handleAutoConnectUltrasonic}
          onAutoConnectLineSensor={handleAutoConnectLineSensor}
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed((prev) => !prev)}
        />
      </div>

      {/* Bottom: Arduino Code Editor & Simulated Runtime Panel */}
      <CodeEditorPanel
        isOpen={!isBottomCollapsed && isCodePanelOpen}
        onClose={() => {
          setIsCodePanelOpen(false);
          setIsBottomCollapsed(true);
        }}
        code={sketchCode}
        onChangeCode={setSketchCode}
        runtimeStatus={runtimeStatus}
        onRunCode={handleRunCode}
        onStopCode={handleStopCode}
        onResetRuntime={handleResetRuntime}
        consoleMessages={consoleMessages}
        onClearConsole={handleClearConsole}
        simulatedPins={simulatedPins}
        onSetVirtualInput={handleSetVirtualInput}
        stats={runtimeStats}
        panelHeight={codePanelHeight}
        onResizeHeight={setCodePanelHeight}
        wires={wires}
        components={components}
      />
    </div>
  );
}

export default App;
