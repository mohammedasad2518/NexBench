import * as THREE from 'three';
import type { 
  Component3D, 
  ComponentType, 
  MountPoint, 
  MechanicalAttachment, 
  Vector3D 
} from '../types/workbench';

export const COMPONENT_MOUNT_POINTS: Record<ComponentType, MountPoint[]> = {
  chassis: [
    {
      id: 'mount_motor_left',
      name: 'Left Motor Bay',
      position: { x: -1.4, y: -0.05, z: 0.5 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['dc_motor'],
      defaultJointType: 'fixed',
      description: 'Mounting bracket for Left Drive Gearmotor',
    },
    {
      id: 'mount_motor_right',
      name: 'Right Motor Bay',
      position: { x: 1.4, y: -0.05, z: 0.5 },
      rotation: { x: 0, y: 180, z: 0 },
      compatibleTypes: ['dc_motor'],
      defaultJointType: 'fixed',
      description: 'Mounting bracket for Right Drive Gearmotor',
    },
    {
      id: 'mount_servo_front',
      name: 'Front Actuator Bay',
      position: { x: 0, y: 0.45, z: 1.1 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['servo'],
      defaultJointType: 'fixed',
      description: 'Front steering/pan-tilt servo mount',
    },
    {
      id: 'mount_board_center',
      name: 'Controller Deck',
      position: { x: 0, y: 0.15, z: -0.2 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['arduino'],
      defaultJointType: 'fixed',
      description: 'Platform standoff holes for Microcontroller board',
    },
    {
      id: 'mount_line_sensor_left',
      name: 'Left Under-Chassis Sensor Bay',
      position: { x: -0.45, y: -0.15, z: 1.25 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['line_sensor'],
      defaultJointType: 'fixed',
      description: 'Mounting bracket for Left Track IR Reflectance Sensor',
    },
    {
      id: 'mount_line_sensor_right',
      name: 'Right Under-Chassis Sensor Bay',
      position: { x: 0.45, y: -0.15, z: 1.25 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['line_sensor'],
      defaultJointType: 'fixed',
      description: 'Mounting bracket for Right Track IR Reflectance Sensor',
    },
  ],

  dc_motor: [
    {
      id: 'mount_chassis',
      name: 'Chassis Mounting Face',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis'],
      defaultJointType: 'fixed',
      description: 'Flange for chassis bracket attachment',
    },
    {
      id: 'mount_shaft',
      name: 'Drive Axle Shaft',
      position: { x: 0.6, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['wheel'],
      defaultJointType: 'revolute',
      description: 'Output drive shaft for wheel attachment (Revolute)',
    },
  ],

  wheel: [
    {
      id: 'mount_hub',
      name: 'Axle Hub Socket',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['dc_motor'],
      defaultJointType: 'revolute',
      description: 'Center hub collar for drive motor shaft',
    },
  ],

  servo: [
    {
      id: 'mount_base',
      name: 'Mounting Ears',
      position: { x: 0, y: -0.45, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis'],
      defaultJointType: 'fixed',
      description: 'Side flanges for structural chassis mounting',
    },
    {
      id: 'mount_horn',
      name: 'Servo Horn Output',
      position: { x: 0.12, y: 0.72, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['ultrasonic'],
      defaultJointType: 'revolute',
      description: 'Rotating horn spline for pan/tilt sensor attachment',
    },
  ],

  ultrasonic: [
    {
      id: 'mount_base',
      name: 'Sensor Mounting Base',
      position: { x: 0, y: -0.1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['servo', 'chassis'],
      defaultJointType: 'fixed',
      description: 'Base bracket for attaching to servo horn or chassis',
    },
  ],

  arduino: [
    {
      id: 'mount_standoff',
      name: 'PCB Standoffs',
      position: { x: 0, y: -0.05, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis'],
      defaultJointType: 'fixed',
      description: 'Corner mounting holes for chassis standoffs',
    },
  ],

  led: [
    {
      id: 'mount_lead_base',
      name: 'Lead Mount Base',
      position: { x: 0, y: -0.3, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis', 'arduino'],
      defaultJointType: 'fixed',
      description: 'Lead mount base',
    },
  ],

  potentiometer: [
    {
      id: 'mount_pot_base',
      name: 'Threaded Bushing Mount',
      position: { x: 0, y: -0.25, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis', 'arduino'],
      defaultJointType: 'fixed',
      description: 'Panel mounting threaded bushing and anti-rotation lug',
    },
  ],

  line_sensor: [
    {
      id: 'mount_base',
      name: 'Sensor Undercarriage Bracket',
      position: { x: 0, y: 0.1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      compatibleTypes: ['chassis'],
      defaultJointType: 'fixed',
      description: 'Mounting base for chassis undercarriage sensor bay',
    },
  ],

  obstacle_box: [],
  obstacle_wall: [],
};

export function getComponentMountPoints(comp: Component3D): MountPoint[] {
  return COMPONENT_MOUNT_POINTS[comp.type] || [];
}

export function findMountPoint(comp: Component3D, mountId: string): MountPoint | undefined {
  const mountPoints = getComponentMountPoints(comp);
  return mountPoints.find((m) => m.id === mountId);
}

/**
 * Checks whether candidateChild can be mounted onto candidateParent.
 * Enforces type compatibility, prevents self-mounting, and detects circular chains.
 */
export function canAttach(
  child: Component3D,
  parent: Component3D,
  parentMount: MountPoint,
  existingAttachments: MechanicalAttachment[]
): { allowed: boolean; reason?: string } {
  if (child.id === parent.id) {
    return { allowed: false, reason: 'Cannot attach a component to itself.' };
  }

  // Check type compatibility
  if (!parentMount.compatibleTypes.includes(child.type)) {
    return { 
      allowed: false, 
      reason: `Mount point "${parentMount.name}" only accepts [${parentMount.compatibleTypes.join(', ')}], not ${child.type}.` 
    };
  }

  // Prevent circular parent-child dependency
  if (detectCycle(child.id, parent.id, existingAttachments)) {
    return { 
      allowed: false, 
      reason: 'Circular attachment detected: cannot attach an ancestor component to its descendant.' 
    };
  }

  // Check if mount point is already occupied
  const isOccupied = existingAttachments.some(
    (a) => a.parentComponentId === parent.id && a.parentMountId === parentMount.id
  );
  if (isOccupied) {
    return { allowed: false, reason: `Mount point "${parentMount.name}" already has a component attached.` };
  }

  return { allowed: true };
}

/**
 * Traverses upwards through parent attachments starting from startParentId.
 * Returns true if candidateChildId is encountered, indicating a cycle.
 */
export function detectCycle(
  candidateChildId: string,
  startParentId: string,
  attachments: MechanicalAttachment[]
): boolean {
  let currentParentId: string | undefined = startParentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (currentParentId === candidateChildId) return true;
    if (visited.has(currentParentId)) break;
    visited.add(currentParentId);

    const att: MechanicalAttachment | undefined = attachments.find(
      (a) => a.childComponentId === currentParentId
    );
    currentParentId = att ? att.parentComponentId : undefined;
  }

  return false;
}

/**
 * Computes the relative local position and rotation offset of child relative to parent
 */
export function calculateAttachmentTransforms(
  parent: Component3D,
  parentMount: MountPoint,
  _child: Component3D,
  childMount: MountPoint
): {
  childWorldPosition: Vector3D;
  childWorldRotation: Vector3D;
  relativePosition: Vector3D;
  relativeRotation: Vector3D;
} {
  // Parent world matrix
  const parentPos = new THREE.Vector3(parent.position.x, parent.position.y, parent.position.z);
  const parentRot = new THREE.Euler(
    THREE.MathUtils.degToRad(parent.rotation.x),
    THREE.MathUtils.degToRad(parent.rotation.y),
    THREE.MathUtils.degToRad(parent.rotation.z)
  );
  const parentMatrix = new THREE.Matrix4().makeRotationFromEuler(parentRot).setPosition(parentPos);

  // Mount point local transform relative to parent
  const mountLocalPos = new THREE.Vector3(parentMount.position.x, parentMount.position.y, parentMount.position.z);
  const mountLocalRot = new THREE.Euler(
    THREE.MathUtils.degToRad(parentMount.rotation.x),
    THREE.MathUtils.degToRad(parentMount.rotation.y),
    THREE.MathUtils.degToRad(parentMount.rotation.z)
  );
  const mountMatrix = new THREE.Matrix4().makeRotationFromEuler(mountLocalRot).setPosition(mountLocalPos);

  // Child mount local offset in child space
  const childMountPos = new THREE.Vector3(childMount.position.x, childMount.position.y, childMount.position.z);
  const childMountRot = new THREE.Euler(
    THREE.MathUtils.degToRad(childMount.rotation.x),
    THREE.MathUtils.degToRad(childMount.rotation.y),
    THREE.MathUtils.degToRad(childMount.rotation.z)
  );
  const childMountMatrix = new THREE.Matrix4().makeRotationFromEuler(childMountRot).setPosition(childMountPos);
  const childMountInv = childMountMatrix.clone().invert();

  // Combined world matrix for child: parentMatrix * mountMatrix * childMountInv
  const childWorldMatrix = parentMatrix.clone().multiply(mountMatrix).multiply(childMountInv);

  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  childWorldMatrix.decompose(worldPos, worldQuat, worldScale);

  const worldEuler = new THREE.Euler().setFromQuaternion(worldQuat);

  // Relative transform in parent space: parentMatrixInv * childWorldMatrix
  const parentInv = parentMatrix.clone().invert();
  const relMatrix = parentInv.multiply(childWorldMatrix);

  const relPos = new THREE.Vector3();
  const relQuat = new THREE.Quaternion();
  const relScale = new THREE.Vector3();
  relMatrix.decompose(relPos, relQuat, relScale);
  const relEuler = new THREE.Euler().setFromQuaternion(relQuat);

  return {
    childWorldPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
    childWorldRotation: {
      x: THREE.MathUtils.radToDeg(worldEuler.x),
      y: THREE.MathUtils.radToDeg(worldEuler.y),
      z: THREE.MathUtils.radToDeg(worldEuler.z),
    },
    relativePosition: { x: relPos.x, y: relPos.y, z: relPos.z },
    relativeRotation: {
      x: THREE.MathUtils.radToDeg(relEuler.x),
      y: THREE.MathUtils.radToDeg(relEuler.y),
      z: THREE.MathUtils.radToDeg(relEuler.z),
    },
  };
}

/**
 * Computes child world transform when parent moves
 */
export function updateChildWorldFromParent(
  parentPos: Vector3D,
  parentRot: Vector3D,
  relativePos: Vector3D,
  relativeRot: Vector3D
): { position: Vector3D; rotation: Vector3D } {
  const pPos = new THREE.Vector3(parentPos.x, parentPos.y, parentPos.z);
  const pEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(parentRot.x),
    THREE.MathUtils.degToRad(parentRot.y),
    THREE.MathUtils.degToRad(parentRot.z)
  );
  const pMatrix = new THREE.Matrix4().makeRotationFromEuler(pEuler).setPosition(pPos);

  const rPos = new THREE.Vector3(relativePos.x, relativePos.y, relativePos.z);
  const rEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(relativeRot.x),
    THREE.MathUtils.degToRad(relativeRot.y),
    THREE.MathUtils.degToRad(relativeRot.z)
  );
  const rMatrix = new THREE.Matrix4().makeRotationFromEuler(rEuler).setPosition(rPos);

  const cWorldMatrix = pMatrix.multiply(rMatrix);

  const outPos = new THREE.Vector3();
  const outQuat = new THREE.Quaternion();
  const outScale = new THREE.Vector3();
  cWorldMatrix.decompose(outPos, outQuat, outScale);

  const outEuler = new THREE.Euler().setFromQuaternion(outQuat);

  return {
    position: { x: outPos.x, y: outPos.y, z: outPos.z },
    rotation: {
      x: THREE.MathUtils.radToDeg(outEuler.x),
      y: THREE.MathUtils.radToDeg(outEuler.y),
      z: THREE.MathUtils.radToDeg(outEuler.z),
    },
  };
}
