export type ComponentCategory = 'structural' | 'actuator' | 'controller' | 'output' | 'sensor';

export type ComponentType = 
  | 'chassis' 
  | 'dc_motor' 
  | 'wheel' 
  | 'servo' 
  | 'arduino' 
  | 'led'
  | 'ultrasonic'
  | 'potentiometer'
  | 'line_sensor'
  | 'obstacle_box'
  | 'obstacle_wall';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Component3D {
  id: string;
  name: string;
  type: ComponentType;
  category: ComponentCategory;
  position: Vector3D;
  rotation: Vector3D; // In degrees
  scale: Vector3D;
  color: string;
  visible: boolean;
  locked?: boolean;
  mass?: number; // In kilograms (for physics simulation)
  parentAttachmentId?: string; // If attached to a parent component
  metadata?: {
    voltage?: string;
    description?: string;
    spec?: string;
    distanceCm?: number; // Simulated ultrasonic distance (2 - 400 cm)
    autoDistanceEnabled?: boolean; // Phase 5B: Real-time 3D raycasting detection
    showRayBeam?: boolean; // Phase 5B: Toggleable visual ultrasonic cone
    detectedObstacleName?: string | null; // Phase 5B: Name of the detected obstacle object
    potValue?: number;   // Simulated potentiometer analog reading (0 - 1023)
    lineSensorThreshold?: number; // Phase 8A: TCRT5000 ADC threshold (default ~500)
    lineSensorInvert?: boolean; // Phase 8A: Invert DO logic
    lineSensorReadingDO?: number; // Phase 8A: Real-time digital output (0 or 1)
    lineSensorReadingAO?: number; // Phase 8A: Real-time analog output (0 - 1023)
    lineSensorReflectance?: number; // Phase 8A: Real-time floor reflectance (0.0 - 1.0)
    servoAngle?: number; // Phase 9B: Servo angle in degrees (0 - 180)
  };
}

export interface ComponentCatalogItem {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  description: string;
  defaultColor: string;
  defaultScale: Vector3D;
  iconName: string;
  badge: string;
}

export type TransformMode = 'translate' | 'rotate' | 'scale';

export type TerminalCategory = 'power' | 'ground' | 'digital' | 'analog' | 'signal';

export interface TerminalDefinition {
  id: string; // e.g. '5V', 'GND', 'D13', 'ANODE'
  name: string; // Display label
  category: TerminalCategory;
  position: Vector3D; // Local offset in component coordinate space
  description?: string;
  voltage?: string;
}

export interface WireConnection {
  id: string;
  fromComponentId: string;
  fromTerminalId: string;
  toComponentId: string;
  toTerminalId: string;
  color: string;
  name?: string;
}

export interface ActiveTerminalRef {
  componentId: string;
  terminalId: string;
}

// ========================================================
// Phase 3: Mechanical Mounting & Attachment Types
// ========================================================

export type JointType = 'fixed' | 'revolute';

export interface MountPoint {
  id: string;
  name: string;
  position: Vector3D; // Local offset on component
  rotation: Vector3D; // Local orientation in degrees
  compatibleTypes: ComponentType[];
  defaultJointType: JointType;
  description?: string;
}

export interface MechanicalAttachment {
  id: string;
  parentComponentId: string;
  parentMountId: string;
  childComponentId: string;
  childMountId: string;
  jointType: JointType;
  motorSpeed?: number; // Angular speed in rad/s for revolute joints
  motorMaxForce?: number; // Max torque/force
  relativePosition: Vector3D;
  relativeRotation: Vector3D;
}

export interface ActiveMountRef {
  componentId: string;
  mountId: string;
}

// ========================================================
// Phase 4A: Arduino Code Editor & Virtual Runtime Types
// ========================================================

export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';

export interface SimulatedPin {
  pin: number;
  name: string; // 'D0'..'D13', 'A0'..'A5'
  mode: PinMode;
  digitalValue: 0 | 1;
  analogValue: number; // 0 - 1023
  pwmValue: number; // 0 - 255
  isPwm: boolean;
  lastUpdated: number;
}

export type RuntimeStatus = 'stopped' | 'running' | 'paused' | 'error';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'serial' | 'pin';
  text: string;
  timestamp: string;
  lineNumber?: number;
}

export interface ArduinoProgramStats {
  cyclesCount: number;
  elapsedMs: number;
  lastLoopDurationMs: number;
}

export interface SceneConfig {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    gridVisible: boolean;
    axesVisible: boolean;
    snapTranslate: boolean;
    snapRotate: boolean;
    snapTranslateStep: number;
    snapRotateStep: number;
  };
  components: Component3D[];
  wires?: WireConnection[];
  attachments?: MechanicalAttachment[];
  sketchCode?: string;
  // Phase 9C: Persistence fields
  projectId?: string;
  calibration?: any;
  trackType?: string;
  servoAngle?: number;
  selectedPresetIndex?: number;
}
