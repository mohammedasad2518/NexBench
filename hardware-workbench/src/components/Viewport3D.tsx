import { useEffect, useRef, useState } from 'react';
import { Link, Check } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { 
  Component3D, 
  ComponentType,
  TransformMode, 
  WireConnection, 
  ActiveTerminalRef,
  TerminalDefinition,
  MechanicalAttachment,
  MountPoint,
  SimulatedPin,
  RuntimeStatus
} from '../types/workbench';
import { createComponentMesh } from '../utils/threeMeshFactory';
import { 
  getComponentTerminals, 
  findTerminal, 
  getTerminalCategoryColor, 
  validateTerminalConnection 
} from '../utils/terminalDefinitions';
import { 
  getComponentMountPoints, 
  findMountPoint, 
  canAttach,
  updateChildWorldFromParent 
} from '../utils/assemblyDefinitions';
import { physicsWorld } from '../utils/physicsEngine';
import { 
  evaluateCircuitState, 
  applyHardwareState, 
  type EvaluatedCircuit 
} from '../utils/hardwareBridge';
import { 
  detectObstacleDistance, 
  updateSonarBeamVisual 
} from '../utils/sonarRaycaster';
import {
  type RobotPose,
  INITIAL_ROBOT_POSE,
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  resolveObstacleCollision,
  calculateRobotRelativeOffsets,
  applyAlignedChildTransform,
  type RelativeComponentOffset,
  updateWheelEncoders,
  createInitialWheelEncoderState,
  type WheelEncoderState,
} from '../utils/robotKinematics';
import {
  createFloorTrackTexture,
  DEFAULT_TRACK_CONFIG,
  sampleFloorSurface,
} from '../utils/floorTrack';
import type {
  TrackType,
  TrackConfig,
} from '../utils/floorTrack';
import { RadarDisplay, type RadarScanPoint } from './RadarDisplay';

interface Viewport3DProps {
  components: Component3D[];
  selectedId: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponentTransform: (id: string, pos: { x: number; y: number; z: number }, rot: { x: number; y: number; z: number }, scale: { x: number; y: number; z: number }) => void;
  transformMode: TransformMode;
  snapTranslate: boolean;
  snapRotate: boolean;
  gridVisible: boolean;
  setGridVisible?: (val: boolean) => void;
  onDeleteSelected: () => void;
  setTransformMode: (mode: TransformMode) => void;
  onDropComponent?: (type: ComponentType) => void;
  // Phase 2A Wiring Props
  wires: WireConnection[];
  selectedWireId: string | null;
  onSelectWire: (id: string | null) => void;
  isWiringMode: boolean;
  activeSourceTerminal: ActiveTerminalRef | null;
  onConnectTerminals: (source: ActiveTerminalRef, target: ActiveTerminalRef) => void;
  setActiveSourceTerminal: (ref: ActiveTerminalRef | null) => void;
  // Phase 3 Physics & Assembly Props
  attachments: MechanicalAttachment[];
  isAssemblyMode: boolean;
  activeMountCandidateId: string | null;
  onAttachComponent: (childId: string, parentId: string, parentMountId: string) => void;
  isSimulating: boolean;
  isSimulationPaused: boolean;
  // Phase 4B Hardware Bridge Props
  simulatedPins?: Record<number, SimulatedPin>;
  runtimeStatus?: RuntimeStatus;
  // Phase 5B Real-time Ultrasonic Raycasting Props
  onRaycastDistanceUpdate?: (sensorId: string, distanceCm: number, obstacleName: string | null) => void;
  // Phase 7 Virtual Interrupt Trigger
  onTriggerVirtualInterrupt?: (pin: number) => void;
  // Phase 8A Floor Track & IR Reflectance Line Sensors
  trackType?: TrackType;
  onTrackTypeChange?: (track: TrackType) => void;
  onLineSensorUpdate?: (sensorPositions: Map<string, { x: number; y: number; z: number }>) => void;
  // Phase 9B Servo-Mounted Ultrasonic Radar
  activeServoAngle?: number;
  // Redesign Camera Presets
  cameraPresetTrigger?: { view: 'perspective' | 'top' | 'front' | 'side' | 'reset'; timestamp: number } | null;
}

interface HoveredTerminalInfo {
  componentName: string;
  terminal: TerminalDefinition;
  x: number;
  y: number;
  validation?: { valid: boolean; message?: string };
}

interface HoveredMountInfo {
  componentName: string;
  componentId: string;
  mountPoint: MountPoint;
  x: number;
  y: number;
  allowed: boolean;
  reason?: string;
}

export const Viewport3D = ({
  components,
  selectedId,
  onSelectComponent,
  onUpdateComponentTransform,
  transformMode,
  snapTranslate,
  snapRotate,
  gridVisible,
  setGridVisible,
  onDeleteSelected,
  setTransformMode,
  onDropComponent,
  wires,
  selectedWireId,
  onSelectWire,
  isWiringMode,
  activeSourceTerminal,
  onConnectTerminals,
  setActiveSourceTerminal,
  attachments,
  isAssemblyMode,
  activeMountCandidateId,
  onAttachComponent,
  isSimulating,
  isSimulationPaused,
  simulatedPins,
  runtimeStatus,
  onRaycastDistanceUpdate,
  onTriggerVirtualInterrupt,
  trackType,
  onTrackTypeChange,
  onLineSensorUpdate,
  activeServoAngle = 90,
  cameraPresetTrigger,
}: Viewport3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const wiresGroupRef = useRef<THREE.Group | null>(null);
  const terminalHitboxesRef = useRef<THREE.Mesh[]>([]);
  const mountHitboxesRef = useRef<THREE.Mesh[]>([]);
  const isDraggingGizmo = useRef<boolean>(false);
  const pointerDownCoord = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewCubeRot, setViewCubeRot] = useState({ yaw: 35, pitch: -25 });
  const [currentTime, setCurrentTime] = useState<string>('10:33');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Phase 9B: Virtual Servo angle & Radar Sweep History refs
  const activeServoAngleRef = useRef<number>(activeServoAngle);
  activeServoAngleRef.current = activeServoAngle;
  const [radarHistory, setRadarHistory] = useState<RadarScanPoint[]>([]);
  const radarHistoryRef = useRef<RadarScanPoint[]>([]);
  const lastRadarRecordTimeRef = useRef<number>(0);

  // Phase 8A: Track configuration & Line Sensor refs
  const [internalTrackType, setInternalTrackType] = useState<TrackType>(trackType || 'oval');
  void onTrackTypeChange;
  void setInternalTrackType;
  const currentTrackType = trackType || internalTrackType;
  const floorTrackConfigRef = useRef<TrackConfig>({ ...DEFAULT_TRACK_CONFIG, type: currentTrackType });
  const trackMeshRef = useRef<THREE.Mesh | null>(null);
  const lineSensorWorldPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const onLineSensorUpdateRef = useRef(onLineSensorUpdate);
  onLineSensorUpdateRef.current = onLineSensorUpdate;

  useEffect(() => {
    floorTrackConfigRef.current.type = currentTrackType;
    if (trackMeshRef.current) {
      if (currentTrackType === 'none') {
        trackMeshRef.current.visible = false;
      } else {
        trackMeshRef.current.visible = true;
        const newTex = createFloorTrackTexture(currentTrackType, DEFAULT_TRACK_CONFIG.planeSizeUnits);
        if (trackMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
          if (trackMeshRef.current.material.map) {
            trackMeshRef.current.material.map.dispose();
          }
          trackMeshRef.current.material.map = newTex;
          trackMeshRef.current.material.needsUpdate = true;
        }
      }
    }
  }, [currentTrackType]);

  // Camera preset handler
  useEffect(() => {
    if (!cameraPresetTrigger || !cameraRef.current || !orbitRef.current) return;
    const cam = cameraRef.current;
    const orbit = orbitRef.current;
    switch (cameraPresetTrigger.view) {
      case 'perspective':
        cam.position.set(5.5, 5.5, 6.5);
        orbit.target.set(0, 0.5, 0);
        break;
      case 'top':
        cam.position.set(0, 14, 0.001);
        orbit.target.set(0, 0, 0);
        break;
      case 'front':
        cam.position.set(0, 1.5, 8);
        orbit.target.set(0, 0.5, 0);
        break;
      case 'side':
        cam.position.set(8, 1.5, 0);
        orbit.target.set(0, 0.5, 0);
        break;
      case 'reset':
        cam.position.set(6, 6, 8);
        orbit.target.set(0, 0.5, 0);
        break;
    }
    orbit.update();
  }, [cameraPresetTrigger]);

  // Phase 5B: Up-to-date refs for animation loop raycasting
  const componentsRef = useRef(components);
  componentsRef.current = components;
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const onRaycastDistanceUpdateRef = useRef(onRaycastDistanceUpdate);
  onRaycastDistanceUpdateRef.current = onRaycastDistanceUpdate;
  const onTriggerVirtualInterruptRef = useRef(onTriggerVirtualInterrupt);
  onTriggerVirtualInterruptRef.current = onTriggerVirtualInterrupt;

  // Phase 4B, 6 & 7: Circuit state, Robot Kinematics & Encoders refs
  const evaluatedCircuitRef = useRef<EvaluatedCircuit | null>(null);
  const robotPoseRef = useRef<RobotPose>({ ...INITIAL_ROBOT_POSE });
  const robotOffsetsRef = useRef<Map<string, RelativeComponentOffset>>(new Map());
  const encoderStateRef = useRef<WheelEncoderState>(createInitialWheelEncoderState());
  const lastKinematicsTimeRef = useRef<number>(performance.now());
  const latestSonarDistanceRef = useRef<number>(52);
  const lastTelemetryUpdateRef = useRef<number>(0);

  const [telemetry, setTelemetry] = useState({
    x: INITIAL_ROBOT_POSE.x,
    z: INITIAL_ROBOT_POSE.z,
    headingDeg: INITIAL_ROBOT_POSE.headingDeg,
    speedCmS: 0,
    sonarDistanceCm: 52,
    isMoving: false,
    hasCollided: false,
    leftTicks: 0,
    rightTicks: 0,
    odometryDistanceCm: 0,
    leftLineDO: 0 as 0 | 1,
    rightLineDO: 0 as 0 | 1,
    leftLineAO: 920,
    rightLineAO: 920,
  });

  useEffect(() => {
    robotOffsetsRef.current = calculateRobotRelativeOffsets(components, 'chassis_01');
  }, [components]);

  const handleResetRobotPose = () => {
    robotPoseRef.current = { ...INITIAL_ROBOT_POSE };
    encoderStateRef.current = createInitialWheelEncoderState();
    radarHistoryRef.current = [];
    setRadarHistory([]);
    const meshesMap = meshesMapRef.current;
    const chassisMesh = meshesMap.get('chassis_01');
    if (chassisMesh) {
      chassisMesh.position.set(INITIAL_ROBOT_POSE.x, INITIAL_ROBOT_POSE.y, INITIAL_ROBOT_POSE.z);
      chassisMesh.rotation.set(0, 0, 0);
    }
    robotOffsetsRef.current.forEach((relOffset) => {
      const childMesh = meshesMap.get(relOffset.componentId);
      if (childMesh) {
        applyAlignedChildTransform(childMesh, relOffset, INITIAL_ROBOT_POSE);
      }
    });
    updateAllWireMeshes();
    setTelemetry({
      x: INITIAL_ROBOT_POSE.x,
      z: INITIAL_ROBOT_POSE.z,
      headingDeg: INITIAL_ROBOT_POSE.headingDeg,
      speedCmS: 0,
      sonarDistanceCm: Math.round(latestSonarDistanceRef.current),
      isMoving: false,
      hasCollided: false,
      leftTicks: 0,
      rightTicks: 0,
      odometryDistanceCm: 0,
      leftLineDO: 0,
      rightLineDO: 0,
      leftLineAO: 920,
      rightLineAO: 920,
    });
  };

  // Live draft wire preview mesh
  const draftWireMeshRef = useRef<THREE.Mesh | null>(null);
  const mouseWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // HTML Tooltip overlay states
  const [hoveredTerminal, setHoveredTerminal] = useState<HoveredTerminalInfo | null>(null);
  const [hoveredMount, setHoveredMount] = useState<HoveredMountInfo | null>(null);

  // Helper to calculate 3D Wire Bezier Curve between two terminal points
  const calculateWireCurve = (p1: THREE.Vector3, p2: THREE.Vector3) => {
    const dist = p1.distanceTo(p2);
    const archHeight = Math.max(0.4, Math.min(1.8, dist * 0.35));
    const mid1 = p1.clone().add(new THREE.Vector3(0, archHeight, 0));
    const mid2 = p2.clone().add(new THREE.Vector3(0, archHeight, 0));
    return new THREE.CubicBezierCurve3(p1, mid1, mid2, p2);
  };

  // Helper to re-render all 3D wire tube meshes
  const updateAllWireMeshes = () => {
    const wiresGroup = wiresGroupRef.current;
    if (!wiresGroup) return;

    while (wiresGroup.children.length > 0) {
      const child = wiresGroup.children[0];
      wiresGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    const meshesMap = meshesMapRef.current;

    wires.forEach((wire) => {
      const fromMesh = meshesMap.get(wire.fromComponentId);
      const toMesh = meshesMap.get(wire.toComponentId);
      if (!fromMesh || !toMesh) return;

      const fromComp = components.find((c) => c.id === wire.fromComponentId);
      const toComp = components.find((c) => c.id === wire.toComponentId);
      if (!fromComp || !toComp) return;

      const fromTerm = findTerminal(fromComp, wire.fromTerminalId);
      const toTerm = findTerminal(toComp, wire.toTerminalId);
      if (!fromTerm || !toTerm) return;

      const p1 = fromMesh.localToWorld(
        new THREE.Vector3(fromTerm.position.x, fromTerm.position.y, fromTerm.position.z)
      );
      const p2 = toMesh.localToWorld(
        new THREE.Vector3(toTerm.position.x, toTerm.position.y, toTerm.position.z)
      );

      const curve = calculateWireCurve(p1, p2);
      const isSelected = wire.id === selectedWireId;
      const wireRadius = isSelected ? 0.045 : 0.03;
      const tubeGeo = new THREE.TubeGeometry(curve, 32, wireRadius, 8, false);

      const wireColor = isSelected ? '#38bdf8' : wire.color;
      const wireMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(wireColor),
        roughness: 0.35,
        metalness: 0.2,
        emissive: isSelected ? new THREE.Color(0x0284c7) : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.6 : 0,
      });

      const tubeMesh = new THREE.Mesh(tubeGeo, wireMat);
      tubeMesh.castShadow = true;
      tubeMesh.userData = { isWire: true, wireId: wire.id };
      wiresGroup.add(tubeMesh);

      // Terminal end ferrule boots
      const bootGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.08, 12);
      const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      
      const boot1 = new THREE.Mesh(bootGeo, bootMat);
      boot1.position.copy(p1);
      wiresGroup.add(boot1);

      const boot2 = new THREE.Mesh(bootGeo, bootMat);
      boot2.position.copy(p2);
      wiresGroup.add(boot2);
    });
  };

  // 1. Initialize Three.js Scene, Camera, Lights, and Controls
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent scene to inherit theme background
    sceneRef.current = scene;

    // Wires group
    const wiresGroup = new THREE.Group();
    wiresGroup.name = 'workbench_wires';
    scene.add(wiresGroup);
    wiresGroupRef.current = wiresGroup;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(7, 6, 8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    orbit.minDistance = 2;
    orbit.maxDistance = 50;

    orbit.addEventListener('change', () => {
      const yaw = Math.round(Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI));
      const pitch = Math.round(Math.atan2(-camera.position.y, Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z)) * (180 / Math.PI));
      setViewCubeRot({ yaw, pitch });
    });
    orbit.target.set(0, 0, 0);
    orbitRef.current = orbit;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Phase 8A: High-Contrast Floor Track Surface Plane
    const trackTex = createFloorTrackTexture(currentTrackType, DEFAULT_TRACK_CONFIG.planeSizeUnits);
    const trackGeo = new THREE.PlaneGeometry(DEFAULT_TRACK_CONFIG.planeSizeUnits, DEFAULT_TRACK_CONFIG.planeSizeUnits);
    const trackMat = new THREE.MeshStandardMaterial({
      map: trackTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.receiveShadow = true;
    trackMesh.position.y = 0.002;
    trackMesh.visible = currentTrackType !== 'none';
    scene.add(trackMesh);
    trackMeshRef.current = trackMesh;

    // BenchTwin Millimeter Precision Floor Mat
    const matCanvas = document.createElement('canvas');
    matCanvas.width = 1024;
    matCanvas.height = 1024;
    const mctx = matCanvas.getContext('2d');
    if (mctx) {
      mctx.fillStyle = '#cbd5e1';
      mctx.fillRect(0, 0, 1024, 1024);
      mctx.fillStyle = '#e2e8f0';
      mctx.fillRect(6, 6, 1012, 1012);

      // Fine millimeter subdivisions (every 16px)
      mctx.strokeStyle = 'rgba(203, 213, 225, 0.75)';
      mctx.lineWidth = 1;
      for (let x = 6; x <= 1018; x += 16) {
        mctx.beginPath();
        mctx.moveTo(x, 6);
        mctx.lineTo(x, 1018);
        mctx.stroke();
      }
      for (let y = 6; y <= 1018; y += 16) {
        mctx.beginPath();
        mctx.moveTo(6, y);
        mctx.lineTo(1018, y);
        mctx.stroke();
      }

      // Major grid lines (every 80px)
      mctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      mctx.lineWidth = 1.5;
      for (let x = 6; x <= 1018; x += 80) {
        mctx.beginPath();
        mctx.moveTo(x, 6);
        mctx.lineTo(x, 1018);
        mctx.stroke();
      }
      for (let y = 6; y <= 1018; y += 80) {
        mctx.beginPath();
        mctx.moveTo(6, y);
        mctx.lineTo(1018, y);
        mctx.stroke();
      }

      // Watermark text at bottom right
      mctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      mctx.font = '600 16px Inter, sans-serif';
      mctx.textAlign = 'right';
      mctx.fillText('NEXBENCH · MILLIMETERS', 1000, 1004);
    }

    const matTexture = new THREE.CanvasTexture(matCanvas);
    matTexture.wrapS = THREE.ClampToEdgeWrapping;
    matTexture.wrapT = THREE.ClampToEdgeWrapping;

    const groundGeo = new THREE.PlaneGeometry(36, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      map: matTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.005;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0xcfd8dc);
    gridHelper.position.y = 0.001;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(-14, 0.01, -14);
    scene.add(axesHelper);

    // TransformControls (Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    scene.add(transformControls.getHelper());
    transformRef.current = transformControls;

    // Disable OrbitControls while dragging the gizmo
    transformControls.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
      isDraggingGizmo.current = Boolean(event.value);
    });

    // Handle Transform Object Change (Synchronization back to React & Attached Children Follow)
    transformControls.addEventListener('objectChange', () => {
      const obj = transformControls.object;
      if (obj && obj.userData.componentId) {
        const id = obj.userData.componentId;
        const pos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        const rot = {
          x: THREE.MathUtils.radToDeg(obj.rotation.x),
          y: THREE.MathUtils.radToDeg(obj.rotation.y),
          z: THREE.MathUtils.radToDeg(obj.rotation.z),
        };
        const scale = { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z };
        onUpdateComponentTransform(id, pos, rot, scale);

        // Update all attached children in real time during drag
        const childAttachments = attachments.filter((a) => a.parentComponentId === id);
        childAttachments.forEach((att) => {
          const childMesh = meshesMapRef.current.get(att.childComponentId);
          if (childMesh) {
            const newChildTransform = updateChildWorldFromParent(
              pos,
              rot,
              att.relativePosition,
              att.relativeRotation
            );
            childMesh.position.set(newChildTransform.position.x, newChildTransform.position.y, newChildTransform.position.z);
            childMesh.rotation.set(
              THREE.MathUtils.degToRad(newChildTransform.rotation.x),
              THREE.MathUtils.degToRad(newChildTransform.rotation.y),
              THREE.MathUtils.degToRad(newChildTransform.rotation.z)
            );
            onUpdateComponentTransform(
              att.childComponentId,
              newChildTransform.position,
              newChildTransform.rotation,
              { x: childMesh.scale.x, y: childMesh.scale.y, z: childMesh.scale.z }
            );
          }
        });

        // Instant update of connected wire tubes while dragging
        updateAllWireMeshes();
      }
    });

    // Animation & Physics Simulation Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentComps = componentsRef.current;
      const currentAttachments = attachmentsRef.current;
      const meshesMap = meshesMapRef.current;

      // Phase 3 & 4B: Rapier Physics Step
      if (isSimulating && !isSimulationPaused) {
        const simResult = physicsWorld.step();
        if (simResult.transforms.size > 0) {
          simResult.transforms.forEach((trans, compId) => {
            // When robot is running autonomous sketch, kinematics controls robot pose
            if (
              runtimeStatus === 'running' &&
              (compId === 'chassis_01' ||
                compId.startsWith('motor_') ||
                compId.startsWith('wheel_') ||
                compId.startsWith('line_sensor_') ||
                compId === 'arduino_01' ||
                compId === 'servo_head' ||
                compId === 'ultrasonic_eye' ||
                compId === 'status_led')
            ) {
              return;
            }
            const mesh = meshesMapRef.current.get(compId);
            if (mesh) {
              mesh.position.set(trans.position.x, trans.position.y, trans.position.z);
              mesh.rotation.set(
                THREE.MathUtils.degToRad(trans.rotation.x),
                THREE.MathUtils.degToRad(trans.rotation.y),
                THREE.MathUtils.degToRad(trans.rotation.z)
              );
            }
          });
          // Keep wires synchronized with physics bodies
          updateAllWireMeshes();
        }
      }

      // Phase 6 & Phase 8: Differential-Drive Autonomous Kinematics & Locomotion
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastKinematicsTimeRef.current) / 1000));
      lastKinematicsTimeRef.current = now;

        let leftWheelSpeed = 0;
        let rightWheelSpeed = 0;
        let linearVelocity = 0;
        let angularVelocityDeg = 0;
        let isCollided = false;

        if (evaluatedCircuitRef.current && runtimeStatus === 'running' && !isSimulationPaused) {
          const leftMotor = evaluatedCircuitRef.current.motors.get('motor_left');
          const rightMotor = evaluatedCircuitRef.current.motors.get('motor_right');

          const leftTargetSpeed = (leftMotor && leftMotor.isCircuitComplete) ? leftMotor.targetSpeed : 0;
          const rightTargetSpeed = (rightMotor && rightMotor.isCircuitComplete) ? rightMotor.targetSpeed : 0;

          const leftPwm = (leftTargetSpeed / 20.0) * 255.0;
          const rightPwm = (rightTargetSpeed / 20.0) * 255.0;

          const speeds = computeWheelSpeeds(leftPwm, rightPwm);
          leftWheelSpeed = speeds.leftWheelSpeed;
          rightWheelSpeed = speeds.rightWheelSpeed;

          const diffKin = computeDifferentialKinematics(leftWheelSpeed, rightWheelSpeed);
          linearVelocity = diffKin.linearVelocity;
          angularVelocityDeg = diffKin.angularVelocityDeg;

          const isMoving = Math.abs(linearVelocity) > 0.001 || Math.abs(angularVelocityDeg) > 0.001;

          if (isMoving) {
            const proposedPose = integrateRobotPose(
              robotPoseRef.current,
              linearVelocity,
              angularVelocityDeg,
              dt
            );

            const solidObstacles = currentComps.filter(
              (c) => c.type === 'obstacle_box' || c.type === 'obstacle_wall'
            );
            const collisionResult = resolveObstacleCollision(
              proposedPose,
              robotPoseRef.current,
              solidObstacles
            );
            isCollided = collisionResult.hasCollided;
            robotPoseRef.current = collisionResult.safePose;

            // Update Root Chassis Mesh in world space
            const chassisMesh = meshesMapRef.current.get('chassis_01');
            if (chassisMesh) {
              chassisMesh.position.set(
                robotPoseRef.current.x,
                robotPoseRef.current.y,
                robotPoseRef.current.z
              );
              chassisMesh.rotation.set(
                0,
                THREE.MathUtils.degToRad(robotPoseRef.current.headingDeg),
                0
              );
            }

            // Move and align all attached robot components (motors, wheels, arduino, sensor, led)
            const offsets = robotOffsetsRef.current;
            offsets.forEach((relOffset) => {
              const childMesh = meshesMapRef.current.get(relOffset.componentId);
              if (childMesh) {
                applyAlignedChildTransform(childMesh, relOffset, robotPoseRef.current);
                // Rotate wheel around its axle
                if (relOffset.type === 'wheel') {
                  const isLeftWheel = relOffset.componentId.includes('left');
                  const spd = isLeftWheel ? leftWheelSpeed : rightWheelSpeed;
                  childMesh.rotateX(spd * dt * 8.0);
                }
              }
            });

            // Phase 7: Update virtual wheel encoders & dispatch interrupt pulses on D2 & D3
            const encResult = updateWheelEncoders(
              encoderStateRef.current,
              leftWheelSpeed,
              rightWheelSpeed,
              dt
            );
            encoderStateRef.current = encResult.nextState;

            if (encResult.leftPulseTriggered && onTriggerVirtualInterruptRef.current) {
              for (let i = 0; i < encResult.newLeftTicks; i++) {
                onTriggerVirtualInterruptRef.current(2); // Pin 2 = INT0 (Left Encoder)
              }
            }
            if (encResult.rightPulseTriggered && onTriggerVirtualInterruptRef.current) {
              for (let i = 0; i < encResult.newRightTicks; i++) {
                onTriggerVirtualInterruptRef.current(3); // Pin 3 = INT1 (Right Encoder)
              }
            }

            // Keep wires synchronized with moved terminal ports
            updateAllWireMeshes();
          }
        }

      // Phase 8A: Sample line sensors on the floor surface at 60 FPS
      let leftLineDO: 0 | 1 = 0;
      let rightLineDO: 0 | 1 = 0;
      let leftLineAO = 920;
      let rightLineAO = 920;
      let hasLineSensor = false;

      currentComps.forEach((comp) => {
        if (comp.type === 'line_sensor') {
          hasLineSensor = true;
          const sMesh = meshesMap.get(comp.id);
          if (!sMesh) return;

          const tempPos = new THREE.Vector3();
          sMesh.getWorldPosition(tempPos);
          lineSensorWorldPositionsRef.current.set(comp.id, {
            x: tempPos.x,
            y: tempPos.y,
            z: tempPos.z,
          });

          const sample = sampleFloorSurface(tempPos.x, tempPos.z, floorTrackConfigRef.current);

          // Dynamic sensor topside red LED indicator
          const ledMat = sMesh.userData.lineSensorLedMat as THREE.MeshStandardMaterial | undefined;
          if (ledMat) {
            ledMat.emissiveIntensity = sample.digitalValue === 1 ? 2.0 : 0.0;
          }

          if (comp.id.includes('left') || comp.name.toLowerCase().includes('left')) {
            leftLineDO = sample.digitalValue;
            leftLineAO = sample.analogValue;
          } else if (comp.id.includes('right') || comp.name.toLowerCase().includes('right')) {
            rightLineDO = sample.digitalValue;
            rightLineAO = sample.analogValue;
          }
        }
      });

      if (hasLineSensor && onLineSensorUpdateRef.current) {
        onLineSensorUpdateRef.current(lineSensorWorldPositionsRef.current);
      }

      // Throttled UI Telemetry updates (every 100ms / 10 FPS)
      const telemetryNow = performance.now();
      if (telemetryNow - lastTelemetryUpdateRef.current > 100) {
        lastTelemetryUpdateRef.current = telemetryNow;
        setRadarHistory([...radarHistoryRef.current]);
        setTelemetry({
          x: Number(robotPoseRef.current.x.toFixed(2)),
          z: Number(robotPoseRef.current.z.toFixed(2)),
          headingDeg: Number(robotPoseRef.current.headingDeg.toFixed(1)),
          speedCmS: Number((linearVelocity * 20.0).toFixed(1)),
          sonarDistanceCm: Math.round(latestSonarDistanceRef.current),
          isMoving: Math.abs(linearVelocity) > 0.01 || Math.abs(angularVelocityDeg) > 0.01,
          hasCollided: isCollided,
          leftTicks: encoderStateRef.current.leftTicks,
          rightTicks: encoderStateRef.current.rightTicks,
          odometryDistanceCm: Number(encoderStateRef.current.averageDistanceCm.toFixed(1)),
          leftLineDO,
          rightLineDO,
          leftLineAO,
          rightLineAO,
        });
      }

      // Phase 9B: Servo Actuation & Ultrasonic Sensor Mounting Rotation
      const currentServoAngle = activeServoAngleRef.current ?? 90;
      const servoAngleDeltaDeg = currentServoAngle - 90; // 0 at center (90°), -45 at 45° right, +45 at 135° left
      const servoAngleDeltaRad = THREE.MathUtils.degToRad(servoAngleDeltaDeg);

      const servoMesh = meshesMap.get('servo_head');
      if (servoMesh) {
        const horn = servoMesh.getObjectByName('servo_horn');
        if (horn) {
          horn.rotation.y = servoAngleDeltaRad;
        }
      }

      const ultrasonicMesh = meshesMap.get('ultrasonic_eye');
      if (ultrasonicMesh) {
        // Rotate ultrasonic sensor around yaw axis: robot heading + servo angle delta
        ultrasonicMesh.rotation.y = THREE.MathUtils.degToRad(robotPoseRef.current.headingDeg + servoAngleDeltaDeg);
      }

      // Phase 5B: Real-time ultrasonic sensor raycasting & visual detection cone
      currentComps.forEach((comp) => {
        if (comp.type === 'ultrasonic') {
          const sensorMesh = meshesMap.get(comp.id);
          if (!sensorMesh) return;

          const isAuto = comp.metadata?.autoDistanceEnabled !== false;
          const showBeam = comp.metadata?.showRayBeam !== false;

          let distanceCm = typeof comp.metadata?.distanceCm === 'number' ? comp.metadata.distanceCm : 45;
          let obstacleName: string | null = null;
          let hasHit = false;

          if (isAuto) {
            const result = detectObstacleDistance(
              comp,
              meshesMap,
              currentComps,
              currentAttachments
            );
            distanceCm = result.distanceCm;
            obstacleName = result.hitComponentName;
            hasHit = result.hasHit;
            latestSonarDistanceRef.current = distanceCm;

            // Record scan history point for radar sweep display
            const nowMs = performance.now();
            if (nowMs - lastRadarRecordTimeRef.current > 35) {
              lastRadarRecordTimeRef.current = nowMs;
              radarHistoryRef.current = [
                ...radarHistoryRef.current.slice(-25),
                {
                  angle: Math.round(currentServoAngle),
                  distanceCm: Math.round(distanceCm),
                  timestamp: nowMs,
                  hasHit,
                },
              ];
            }

            if (onRaycastDistanceUpdateRef.current) {
              onRaycastDistanceUpdateRef.current(comp.id, distanceCm, obstacleName);
            }
          }

          // Update or hide the visual detection cone / beam attached to the sensor
          updateSonarBeamVisual(sensorMesh, distanceCm, showBeam, hasHit);
        }
      });

      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      transformControls.dispose();
      orbit.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isSimulating, isSimulationPaused, attachments]);

  // Sync Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = gridVisible;
    }
  }, [gridVisible]);

  // Sync TransformControls Mode & Snapping
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
    tc.setMode(transformMode);
    tc.setTranslationSnap(snapTranslate ? 0.5 : null);
    tc.setRotationSnap(snapRotate ? Math.PI / 12 : null);

    // Disable transform gizmo during wiring, assembly, or physics simulation
    if (isWiringMode || isAssemblyMode || isSimulating) {
      tc.detach();
    } else if (selectedId && meshesMapRef.current.has(selectedId)) {
      tc.attach(meshesMapRef.current.get(selectedId)!);
    }
  }, [transformMode, snapTranslate, snapRotate, isWiringMode, isAssemblyMode, isSimulating, selectedId]);

  // Keyboard shortcuts for transforms and deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'w' || e.key === 'W') setTransformMode('translate');
      if (e.key === 'e' || e.key === 'E') setTransformMode('rotate');
      if (e.key === 'r' || e.key === 'R') setTransformMode('scale');
      if (e.key === 'Delete' || e.key === 'Backspace') onDeleteSelected();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTransformMode, onDeleteSelected]);

  // Sync Component 3D Meshes, Terminals & Mount Points with React State
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const map = meshesMapRef.current;
    const termHitboxes: THREE.Mesh[] = [];
    const mountHitboxes: THREE.Mesh[] = [];

    const currentIds = new Set(components.map((c) => c.id));

    // 1. Remove deleted component meshes
    map.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        if (transformRef.current?.object === mesh) {
          transformRef.current.detach();
        }
        scene.remove(mesh);
        map.delete(id);
      }
    });

    // Candidate component for assembly mode
    const candidateComp = activeMountCandidateId 
      ? components.find((c) => c.id === activeMountCandidateId) 
      : null;

    // 2. Add or update meshes & attach terminal and mount markers
    components.forEach((comp) => {
      let group = map.get(comp.id);
      const needsRecreate = !group || group.userData.color !== comp.color;

      if (needsRecreate) {
        if (group) {
          if (transformRef.current?.object === group) {
            transformRef.current.detach();
          }
          scene.remove(group);
        }
        group = createComponentMesh(comp);
        group.userData.color = comp.color;

        // Build and attach 3D Interactive Terminal Sockets
        const terminals = getComponentTerminals(comp);
        const terminalsGroup = new THREE.Group();
        terminalsGroup.name = 'terminals_group';

        terminals.forEach((term) => {
          const categoryColor = getTerminalCategoryColor(term.category);

          const socketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16);
          const socketMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(categoryColor),
            roughness: 0.3,
            metalness: 0.7,
            emissive: new THREE.Color(categoryColor),
            emissiveIntensity: 0.25,
          });
          const socketMesh = new THREE.Mesh(socketGeo, socketMat);
          socketMesh.position.set(term.position.x, term.position.y, term.position.z);
          terminalsGroup.add(socketMesh);

          const hitGeo = new THREE.SphereGeometry(0.16, 12, 12);
          const hitMat = new THREE.MeshBasicMaterial({ visible: false });
          const hitMesh = new THREE.Mesh(hitGeo, hitMat);
          hitMesh.position.set(term.position.x, term.position.y, term.position.z);
          hitMesh.userData = {
            isTerminal: true,
            componentId: comp.id,
            terminalId: term.id,
            category: term.category,
            terminalName: term.name,
            componentName: comp.name,
          };
          terminalsGroup.add(hitMesh);
        });
        group.add(terminalsGroup);

        // Build and attach 3D Mechanical Mount Points
        const mountPoints = getComponentMountPoints(comp);
        const mountsGroup = new THREE.Group();
        mountsGroup.name = 'mounts_group';

        mountPoints.forEach((mp) => {
          // Visible docking pad ring
          const padGeo = new THREE.TorusGeometry(0.14, 0.03, 12, 24);
          padGeo.rotateX(Math.PI / 2);
          const padMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.4,
            metalness: 0.8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.3,
          });
          const padMesh = new THREE.Mesh(padGeo, padMat);
          padMesh.position.set(mp.position.x, mp.position.y, mp.position.z);
          mountsGroup.add(padMesh);

          // Raycasting hitbox for mounting
          const hitGeo = new THREE.SphereGeometry(0.22, 12, 12);
          const hitMat = new THREE.MeshBasicMaterial({ visible: false });
          const hitMesh = new THREE.Mesh(hitGeo, hitMat);
          hitMesh.position.set(mp.position.x, mp.position.y, mp.position.z);
          hitMesh.userData = {
            isMountPoint: true,
            componentId: comp.id,
            mountId: mp.id,
            mountName: mp.name,
            componentName: comp.name,
          };
          mountsGroup.add(hitMesh);
        });
        group.add(mountsGroup);

        scene.add(group);
        map.set(comp.id, group);
      }

      // Update positions
      if (group) {
        group.position.set(comp.position.x, comp.position.y, comp.position.z);
        group.rotation.set(
          THREE.MathUtils.degToRad(comp.rotation.x),
          THREE.MathUtils.degToRad(comp.rotation.y),
          THREE.MathUtils.degToRad(comp.rotation.z)
        );
        group.scale.set(comp.scale.x, comp.scale.y, comp.scale.z);
        group.visible = comp.visible;

        // Collect terminal hitboxes
        const termGrp = group.getObjectByName('terminals_group');
        if (termGrp) {
          termGrp.children.forEach((child) => {
            if (child.userData?.isTerminal) {
              termHitboxes.push(child as THREE.Mesh);
            }
          });
        }

        // Collect mount hitboxes & toggle highlight in assembly mode
        const mountGrp = group.getObjectByName('mounts_group');
        if (mountGrp) {
          mountGrp.visible = isAssemblyMode || comp.type === 'chassis';
          mountGrp.children.forEach((child) => {
            if (child.userData?.isMountPoint) {
              // Highlight if compatible with candidate component
              if (isAssemblyMode && candidateComp) {
                const mp = findMountPoint(comp, child.userData.mountId);
                const isCompMatch = mp ? mp.compatibleTypes.includes(candidateComp.type) : false;
                child.visible = isCompMatch;
              }
              mountHitboxes.push(child as THREE.Mesh);
            }
          });
        }
      }
    });

    terminalHitboxesRef.current = termHitboxes;
    mountHitboxesRef.current = mountHitboxes;

    // Attach TransformControls if applicable
    if (!isWiringMode && !isAssemblyMode && !isSimulating && selectedId && map.has(selectedId)) {
      const selectedMesh = map.get(selectedId)!;
      if (transformRef.current?.object !== selectedMesh) {
        transformRef.current?.attach(selectedMesh);
      }
    } else {
      transformRef.current?.detach();
    }

    updateAllWireMeshes();
  }, [components, selectedId, isWiringMode, isAssemblyMode, activeMountCandidateId, isSimulating, wires, selectedWireId, attachments]);

  // Update wire meshes on wire changes
  useEffect(() => {
    updateAllWireMeshes();
  }, [wires, selectedWireId]);

  // Dynamic Draft Wire Rendering
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (isWiringMode && activeSourceTerminal) {
      const srcMesh = meshesMapRef.current.get(activeSourceTerminal.componentId);
      const srcComp = components.find((c) => c.id === activeSourceTerminal.componentId);
      const srcTerm = srcComp ? findTerminal(srcComp, activeSourceTerminal.terminalId) : null;

      if (srcMesh && srcTerm) {
        const startPoint = srcMesh.localToWorld(
          new THREE.Vector3(srcTerm.position.x, srcTerm.position.y, srcTerm.position.z)
        );
        const endPoint = mouseWorldPosRef.current.clone();

        if (startPoint.distanceTo(endPoint) > 0.05) {
          const curve = calculateWireCurve(startPoint, endPoint);
          const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.035, 8, false);

          if (!draftWireMeshRef.current) {
            const mat = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 0.8,
              roughness: 0.2,
            });
            const draftMesh = new THREE.Mesh(tubeGeo, mat);
            scene.add(draftMesh);
            draftWireMeshRef.current = draftMesh;
          } else {
            draftWireMeshRef.current.geometry.dispose();
            draftWireMeshRef.current.geometry = tubeGeo;
            draftWireMeshRef.current.visible = true;
          }
        }
      }
    } else {
      if (draftWireMeshRef.current) {
        draftWireMeshRef.current.visible = false;
      }
    }
  }, [isWiringMode, activeSourceTerminal, components]);

  // Phase 4B: Connect Virtual Arduino Pins to 3D Hardware
  useEffect(() => {
    const evaluated = evaluateCircuitState(
      components,
      wires,
      attachments,
      simulatedPins || {},
      runtimeStatus || 'stopped'
    );
    evaluatedCircuitRef.current = evaluated;
    applyHardwareState(evaluated, meshesMapRef.current, isSimulating);

    return () => {
      if (runtimeStatus !== 'running') {
        meshesMapRef.current.forEach((group) => {
          if (group.userData.ledMaterial) {
            group.userData.ledMaterial.emissiveIntensity = 0.0;
          }
          if (group.userData.ledLight) {
            group.userData.ledLight.intensity = 0.0;
          }
        });
      }
    };
  }, [components, wires, attachments, simulatedPins, runtimeStatus, isSimulating]);

  // Mouse Pointer & Raycasting Interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownCoord.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Ground plane intersection
      const groundIntersects = raycaster.intersectObjects(
        scene.children.filter((c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.PlaneGeometry)
      );
      if (groundIntersects.length > 0) {
        mouseWorldPosRef.current.copy(groundIntersects[0].point).add(new THREE.Vector3(0, 0.4, 0));
      }

      // 1. Check Mount Point Hover (in Assembly Mode)
      if (isAssemblyMode) {
        const mountIntersects = raycaster.intersectObjects(mountHitboxesRef.current, false);
        if (mountIntersects.length > 0) {
          container.style.cursor = 'pointer';
          const hit = mountIntersects[0].object;
          const compId = hit.userData.componentId;
          const mountId = hit.userData.mountId;

          const parentComp = components.find((c) => c.id === compId);
          const childComp = activeMountCandidateId 
            ? components.find((c) => c.id === activeMountCandidateId) 
            : null;
          const mp = parentComp ? findMountPoint(parentComp, mountId) : null;

          if (parentComp && mp) {
            let allowed = true;
            let reason: string | undefined;

            if (childComp) {
              const check = canAttach(childComp, parentComp, mp, attachments);
              allowed = check.allowed;
              reason = check.reason;
            }

            setHoveredMount({
              componentName: parentComp.name,
              componentId: parentComp.id,
              mountPoint: mp,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              allowed,
              reason,
            });
            setHoveredTerminal(null);
            return;
          }
        }
        setHoveredMount(null);
      }

      // 2. Check Terminal Hover
      const terminalIntersects = raycaster.intersectObjects(terminalHitboxesRef.current, false);
      if (terminalIntersects.length > 0) {
        container.style.cursor = 'crosshair';
        const hit = terminalIntersects[0].object;
        const compId = hit.userData.componentId;
        const termId = hit.userData.terminalId;

        const comp = components.find((c) => c.id === compId);
        const term = comp ? findTerminal(comp, termId) : null;

        if (comp && term) {
          let validation: { valid: boolean; message?: string } | undefined;
          if (activeSourceTerminal) {
            const srcComp = components.find((c) => c.id === activeSourceTerminal.componentId);
            const srcTerm = srcComp ? findTerminal(srcComp, activeSourceTerminal.terminalId) : null;
            if (srcComp && srcTerm) {
              const res = validateTerminalConnection(
                { comp: srcComp, term: srcTerm },
                { comp, term },
                wires
              );
              validation = { valid: res.valid, message: res.message };
            }
          }

          setHoveredTerminal({
            componentName: comp.name,
            terminal: term,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            validation,
          });

          hit.getWorldPosition(mouseWorldPosRef.current);
          return;
        }
      }

      // 3. Check Wire Hover
      if (wiresGroupRef.current && !isWiringMode && !isAssemblyMode) {
        const wireIntersects = raycaster.intersectObjects(wiresGroupRef.current.children, false);
        if (wireIntersects.length > 0) {
          container.style.cursor = 'pointer';
          setHoveredTerminal(null);
          setHoveredMount(null);
          return;
        }
      }

      container.style.cursor = isWiringMode ? 'crosshair' : (isAssemblyMode ? 'cell' : 'default');
      setHoveredTerminal(null);
      setHoveredMount(null);
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - pointerDownCoord.current.x);
      const dy = Math.abs(e.clientY - pointerDownCoord.current.y);
      if (dx > 4 || dy > 4 || isDraggingGizmo.current) return;

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!camera || !scene) return;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // 1. Raycast Mount Points in Assembly Mode
      if (isAssemblyMode && activeMountCandidateId) {
        const mountIntersects = raycaster.intersectObjects(mountHitboxesRef.current, false);
        if (mountIntersects.length > 0) {
          const hit = mountIntersects[0].object;
          const parentCompId = hit.userData.componentId;
          const parentMountId = hit.userData.mountId;
          onAttachComponent(activeMountCandidateId, parentCompId, parentMountId);
          return;
        }
      }

      // 2. Raycast Terminal Hitboxes
      const terminalIntersects = raycaster.intersectObjects(terminalHitboxesRef.current, false);
      if (terminalIntersects.length > 0) {
        const hit = terminalIntersects[0].object;
        const compId = hit.userData.componentId;
        const termId = hit.userData.terminalId;

        if (activeSourceTerminal) {
          const destRef: ActiveTerminalRef = { componentId: compId, terminalId: termId };
          onConnectTerminals(activeSourceTerminal, destRef);
          return;
        } else {
          setActiveSourceTerminal({ componentId: compId, terminalId: termId });
          return;
        }
      }

      // 3. Raycast 3D Wires
      if (wiresGroupRef.current && !isWiringMode && !isAssemblyMode) {
        const wireIntersects = raycaster.intersectObjects(wiresGroupRef.current.children, false);
        if (wireIntersects.length > 0) {
          const hitObj = wireIntersects[0].object;
          if (hitObj.userData?.wireId) {
            onSelectComponent(null);
            onSelectWire(hitObj.userData.wireId);
            return;
          }
        }
      }

      // 4. Raycast Component Meshes
      if (!isWiringMode && !isAssemblyMode) {
        const componentGroups = Array.from(meshesMapRef.current.values());
        const intersects = raycaster.intersectObjects(componentGroups, true);

        if (intersects.length > 0) {
          let target: THREE.Object3D | null = intersects[0].object;
          while (target && !target.userData?.componentId && target.parent) {
            target = target.parent;
          }

          if (target && target.userData?.componentId) {
            onSelectWire(null);
            onSelectComponent(target.userData.componentId);
            return;
          }
        }

        onSelectComponent(null);
        onSelectWire(null);
      } else if (isWiringMode) {
        if (activeSourceTerminal) {
          setActiveSourceTerminal(null);
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    components, 
    wires, 
    isWiringMode, 
    isAssemblyMode,
    activeMountCandidateId,
    activeSourceTerminal, 
    onConnectTerminals, 
    setActiveSourceTerminal, 
    onAttachComponent,
    onSelectComponent, 
    onSelectWire, 
    attachments
  ]);

  // Camera Presets
  const setCameraView = (view: 'perspective' | 'top' | 'front' | 'side' | 'iso' | 'fit') => {
    const camera = cameraRef.current;
    const orbit = orbitRef.current;
    if (!camera || !orbit) return;

    orbit.target.set(0, 0, 0);
    switch (view) {
      case 'perspective':
        camera.position.set(7, 6, 8);
        break;
      case 'top':
        camera.position.set(0, 14, 0.01);
        break;
      case 'front':
        camera.position.set(0, 2, 12);
        break;
      case 'side':
        camera.position.set(12, 2, 0);
        break;
      case 'iso':
        camera.position.set(10, 8, 10);
        break;
      case 'fit':
        camera.position.set(8, 7, 9);
        break;
    }
    orbit.update();
  };

  const handleZoom = (factor: number) => {
    const camera = cameraRef.current;
    const orbit = orbitRef.current;
    if (!camera || !orbit) return;
    camera.position.multiplyScalar(factor);
    orbit.update();
  };

  const selectedCompName = components.find((c) => c.id === selectedId)?.name;

  return (
    <div 
      className="viewport-container" 
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain') as ComponentType;
        if (type && onDropComponent) {
          onDropComponent(type);
        }
      }}
    >
      {/* Top Left Bench Twin Bar */}
      <div className="bt-viewport-top-left">
        <div className="bt-hud-pill">
          <Link size={12} className="bt-pill-icon" />
          <span>3D bench</span>
        </div>
        <div className="bt-hud-pill">
          <span className="bt-pill-label">Browser</span>
          <span className="bt-pill-counter">{components.length} items &gt;</span>
        </div>
      </div>

      {/* Top Right Bench Twin ViewCube */}
      <div className="bt-viewcube-widget">
        <div 
          className="bt-viewcube-box"
          style={{
            transform: `rotateX(${viewCubeRot.pitch}deg) rotateY(${viewCubeRot.yaw}deg)`,
          }}
        >
          <div className="bt-cube-face bt-face-top" onClick={() => setCameraView('top')}>TOP</div>
          <div className="bt-cube-face bt-face-front" onClick={() => setCameraView('front')}>FRONT</div>
          <div className="bt-cube-face bt-face-right" onClick={() => setCameraView('side')}>RIGHT</div>
          <div className="bt-cube-face bt-face-back" onClick={() => setCameraView('side')}>BACK</div>
          <div className="bt-cube-face bt-face-left" onClick={() => setCameraView('side')}>LEFT</div>
          <div className="bt-cube-face bt-face-bottom" onClick={() => setCameraView('top')}>BOTTOM</div>
        </div>
        <div className="bt-viewcube-axes">
          <span className="axis-dot axis-x" onClick={() => setCameraView('side')}>X</span>
          <span className="axis-dot axis-y" onClick={() => setCameraView('top')}>Y</span>
          <span className="axis-dot axis-z" onClick={() => setCameraView('front')}>Z</span>
        </div>
      </div>

      {/* Floating 3D Terminal Tooltip */}
      {hoveredTerminal && (
        <div 
          className="terminal-3d-tooltip"
          style={{ 
            left: `${hoveredTerminal.x + 12}px`, 
            top: `${hoveredTerminal.y - 12}px` 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              className="tooltip-category-badge"
              style={{ backgroundColor: getTerminalCategoryColor(hoveredTerminal.terminal.category) }}
            >
              {hoveredTerminal.terminal.category}
            </span>
            <strong>{hoveredTerminal.terminal.name}</strong>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {hoveredTerminal.componentName}
          </div>
          {hoveredTerminal.terminal.description && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {hoveredTerminal.terminal.description}
            </div>
          )}
          {hoveredTerminal.validation && (
            <div 
              style={{ 
                fontSize: '10px', 
                fontWeight: 600, 
                color: hoveredTerminal.validation.valid ? '#10b981' : '#ef4444',
                marginTop: '4px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '2px'
              }}
            >
              {hoveredTerminal.validation.valid ? '✓ Click to Connect' : `✕ ${hoveredTerminal.validation.message}`}
            </div>
          )}
        </div>
      )}

      {/* Floating 3D Mount Point Tooltip */}
      {hoveredMount && (
        <div 
          className="terminal-3d-tooltip"
          style={{ 
            left: `${hoveredMount.x + 12}px`, 
            top: `${hoveredMount.y - 12}px`,
            borderColor: hoveredMount.allowed ? '#38bdf8' : '#ef4444' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              className="tooltip-category-badge"
              style={{ backgroundColor: hoveredMount.allowed ? '#0284c7' : '#ef4444' }}
            >
              {hoveredMount.mountPoint.defaultJointType} joint
            </span>
            <strong>{hoveredMount.mountPoint.name}</strong>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {hoveredMount.componentName}
          </div>
          {hoveredMount.mountPoint.description && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {hoveredMount.mountPoint.description}
            </div>
          )}
          <div 
            style={{ 
              fontSize: '10px', 
              fontWeight: 600, 
              color: hoveredMount.allowed ? '#38bdf8' : '#ef4444',
              marginTop: '4px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '2px'
            }}
          >
            {hoveredMount.allowed ? '✓ Click to Mount' : `✕ ${hoveredMount.reason}`}
          </div>
        </div>
      )}

      {/* Phase 6: Real-Time Differential-Drive Telemetry & Reset HUD */}
      <div 
        className="telemetry-hud"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#f8fafc',
          fontSize: '11px',
          fontFamily: 'monospace',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 10,
          minWidth: '200px',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
          <span style={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🤖 Robot Telemetry
          </span>
          <button
            onClick={handleResetRobotPose}
            title="Reset Robot Pose to Origin"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            ↺ Reset Pose
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
          <div>X: <strong style={{ color: '#e2e8f0' }}>{telemetry.x.toFixed(2)}</strong></div>
          <div>Z: <strong style={{ color: '#e2e8f0' }}>{telemetry.z.toFixed(2)}</strong></div>
          <div>Yaw: <strong style={{ color: '#e2e8f0' }}>{telemetry.headingDeg.toFixed(1)}°</strong></div>
          <div>Speed: <strong style={{ color: telemetry.isMoving ? '#34d399' : '#94a3b8' }}>{telemetry.speedCmS} cm/s</strong></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
          <div>Ticks L: <strong style={{ color: '#a78bfa' }}>{telemetry.leftTicks}</strong></div>
          <div>Ticks R: <strong style={{ color: '#a78bfa' }}>{telemetry.rightTicks}</strong></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Odom Dist:</span>
          <strong style={{ color: '#a78bfa' }}>
            {telemetry.odometryDistanceCm.toFixed(1)} cm
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
          <span>Sonar Dist:</span>
          <strong style={{ color: telemetry.sonarDistanceCm <= 25 ? '#ef4444' : '#38bdf8' }}>
            {telemetry.sonarDistanceCm} cm {telemetry.sonarDistanceCm <= 25 ? '⚠️ BRAKE' : ''}
          </strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
          <div>Line L: <strong style={{ color: telemetry.leftLineDO === 1 ? '#ef4444' : '#34d399' }}>{telemetry.leftLineDO === 1 ? '● BLK' : '○ WHT'}</strong> <span style={{ fontSize: '9px', color: '#94a3b8' }}>({telemetry.leftLineAO})</span></div>
          <div>Line R: <strong style={{ color: telemetry.rightLineDO === 1 ? '#ef4444' : '#34d399' }}>{telemetry.rightLineDO === 1 ? '● BLK' : '○ WHT'}</strong> <span style={{ fontSize: '9px', color: '#94a3b8' }}>({telemetry.rightLineAO})</span></div>
        </div>
        {telemetry.hasCollided && (
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '10px', textAlign: 'center' }}>
            ⛔ COLLISION BLOCKED
          </div>
        )}
      </div>

      {/* Phase 9B: Live Ultrasonic Radar Display Widget */}
      <RadarDisplay
        currentAngle={activeServoAngle ?? 90}
        currentDistanceCm={telemetry.sonarDistanceCm}
        scanHistory={radarHistory}
      />

      {/* Empty State Guidance */}
      {components.length === 0 && (
        <div className="viewport-empty-guidance">
          <div className="empty-guidance-card">
            <h4 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '14px', fontWeight: 600 }}>Workspace Empty</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.5' }}>
              Add electronic or mechanical components from the <strong>Catalog</strong> on the left, or load a <strong>Starter Template</strong> to begin 3D simulation.
            </p>
          </div>
        </div>
      )}

      {/* Floating Camera Controls Bar (BenchTwin Pill) */}
      <div className="bt-floating-camera-bar">
        <button className="bt-cam-pill-btn" onClick={() => setCameraView('iso')} title="Isometric View">
          <span>⬡ Iso</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => setCameraView('top')} title="Top View">
          <span>⬜ Top</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => setCameraView('front')} title="Front View">
          <span>⬜ Front</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => setCameraView('side')} title="Right View">
          <span>⬜ Right</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => setCameraView('fit')} title="Fit to View">
          <span>⛶ Fit</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => setGridVisible?.(!gridVisible)} title="Toggle Grid Mat">
          <span>Mat</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => handleZoom(1.2)} title="Zoom Out">
          <span>−</span>
        </button>
        <button className="bt-cam-pill-btn" onClick={() => handleZoom(0.8)} title="Zoom In">
          <span>+</span>
        </button>
      </div>

      {/* BenchTwin Bottom Status Bar */}
      <div className="bt-bottom-status-bar">
        <span className="bt-status-cell">Units <strong>mm</strong></span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell">Snap <strong>{snapTranslate ? '1' : '0'}</strong></span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell">Turn <strong>{snapRotate ? '15°' : 'Free'}</strong></span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell">X - Y -</span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell">Parts <strong>{components.length}</strong></span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell text-selection">{selectedCompName || 'Nothing selected'}</span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell">{currentTime}</span>
        <span className="bt-status-sep">|</span>
        <span className="bt-status-cell status-ok">
          <Check size={13} />
          <span>No problems</span>
        </span>
      </div>
    </div>
  );
};
