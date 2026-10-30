import * as THREE from 'three';
import type { Component3D, Vector3D } from '../types/workbench';

// ============================================================================
// Phase 6: Differential-Drive Kinematics & Closed-Loop Autonomous Navigation
// ============================================================================

export interface RobotPose {
  x: number;          // World X position (Three.js units)
  y: number;          // World Y position (elevated chassis, e.g. 0.5)
  z: number;          // World Z position (Three.js units)
  headingDeg: number; // Yaw heading in degrees (0° = forward along +Z, +90° = right along +X)
}

export interface KinematicsConfig {
  trackWidthUnits: number;    // Distance between left and right wheels (4.0 units)
  wheelRadiusUnits: number;   // Outer radius of drive wheel (0.9 units)
  maxLinearSpeedUnits: number;// Maximum cruising speed at 255 PWM (~2.0 units/s = 40 cm/s)
  unitsToCm: number;          // Coordinate scale factor (20 cm per Three.js unit)
  robotRadiusUnits: number;   // Bounding radius of the robot chassis (~2.2 units)
}

export const DEFAULT_KINEMATICS_CONFIG: KinematicsConfig = {
  trackWidthUnits: 4.0,       // Wheel left at X=-2.0 to Wheel right at X=2.0
  wheelRadiusUnits: 0.9,      // Cylinder radius 1.0 * scale 0.9
  maxLinearSpeedUnits: 2.0,   // ~40 cm/s max speed, calibrated for clear visual navigation
  unitsToCm: 20.0,            // 1 unit = 20 cm
  robotRadiusUnits: 1.6,      // Bounding radius of the robot chassis (~1.6 units)
};

export const INITIAL_ROBOT_POSE: RobotPose = {
  x: 0,
  y: 0.5,
  z: 0,
  headingDeg: 0,
};

export interface RobotKinematicState {
  pose: RobotPose;
  linearVelocity: number;     // units/s along current heading (positive = forward)
  angularVelocityDeg: number; // deg/s yaw rate (positive = turning right, negative = turning left)
  leftWheelSpeed: number;     // units/s
  rightWheelSpeed: number;    // units/s
  leftWheelPwm: number;       // 0 to 255
  rightWheelPwm: number;      // 0 to 255
  leftDirection: 1 | -1;      // 1 = forward, -1 = reverse
  rightDirection: 1 | -1;     // 1 = forward, -1 = reverse
  isMoving: boolean;
}

export interface RelativeComponentOffset {
  componentId: string;
  type: string;
  offset: Vector3D;
  baseRotation: Vector3D;
}

/**
 * Calculates wheel linear speeds from PWM (0-255) and direction signals.
 */
export function computeWheelSpeeds(
  leftPwm: number,
  rightPwm: number,
  leftDir: 1 | -1 = 1,
  rightDir: 1 | -1 = 1,
  config: KinematicsConfig = DEFAULT_KINEMATICS_CONFIG
): { leftWheelSpeed: number; rightWheelSpeed: number } {
  const leftClamped = Math.max(0, Math.min(255, leftPwm));
  const rightClamped = Math.max(0, Math.min(255, rightPwm));

  const leftRatio = leftClamped / 255.0;
  const rightRatio = rightClamped / 255.0;

  return {
    leftWheelSpeed: leftDir * leftRatio * config.maxLinearSpeedUnits,
    rightWheelSpeed: rightDir * rightRatio * config.maxLinearSpeedUnits,
  };
}

/**
 * Computes forward linear velocity (v) and angular yaw rate (omega in deg/s)
 * from left and right wheel speeds using standard differential drive kinematics:
 *   v = (v_L + v_R) / 2
 *   omega = (v_L - v_R) / W  (where W is track width)
 */
export function computeDifferentialKinematics(
  leftWheelSpeed: number,
  rightWheelSpeed: number,
  config: KinematicsConfig = DEFAULT_KINEMATICS_CONFIG
): { linearVelocity: number; angularVelocityDeg: number } {
  const v = (leftWheelSpeed + rightWheelSpeed) / 2.0;
  const omegaRad = (leftWheelSpeed - rightWheelSpeed) / config.trackWidthUnits;
  const omegaDeg = (omegaRad * 180.0) / Math.PI;

  return {
    linearVelocity: v,
    angularVelocityDeg: omegaDeg,
  };
}

/**
 * Integrates the robot pose over a time delta dt (seconds) using 2nd-order Runge-Kutta / midpoint heading.
 * Forward direction at heading 0° is +Z in Three.js coordinates.
 */
export function integrateRobotPose(
  currentPose: RobotPose,
  linearVelocity: number,
  angularVelocityDeg: number,
  dtSeconds: number,
  maxSubstep: number = 0.05
): RobotPose {
  // If stationary, return exact copy
  if (Math.abs(linearVelocity) < 1e-5 && Math.abs(angularVelocityDeg) < 1e-5) {
    return { ...currentPose };
  }

  // Numerical sub-stepping ensures numerical stability for both per-frame delta (16ms) and multi-step intervals
  let remaining = Math.max(0, dtSeconds);
  let pose = { ...currentPose };

  while (remaining > 1e-6) {
    const dt = Math.min(remaining, maxSubstep);
    remaining -= dt;

    const deltaThetaDeg = angularVelocityDeg * dt;
    const midThetaDeg = pose.headingDeg + deltaThetaDeg * 0.5;
    const midThetaRad = (midThetaDeg * Math.PI) / 180.0;

    // With heading 0° pointing along +Z, right pointing along +X:
    // dx = v * sin(theta) * dt
    // dz = v * cos(theta) * dt
    const dx = linearVelocity * Math.sin(midThetaRad) * dt;
    const dz = linearVelocity * Math.cos(midThetaRad) * dt;

    let newHeadingDeg = pose.headingDeg + deltaThetaDeg;
    // Normalize heading to [-180, 180] degrees
    while (newHeadingDeg > 180) newHeadingDeg -= 360;
    while (newHeadingDeg < -180) newHeadingDeg += 360;

    pose = {
      x: pose.x + dx,
      y: pose.y, // Maintain ground clearance elevation
      z: pose.z + dz,
      headingDeg: newHeadingDeg,
    };
  }

  return pose;
}

/**
 * Evaluates whether a proposed robot position collides with any solid obstacle in the scene.
 * If a collision occurs, clamps the translation to prevent passing through the obstacle.
 */
export function resolveObstacleCollision(
  proposedPose: RobotPose,
  previousPose: RobotPose,
  obstacles: Component3D[],
  config: KinematicsConfig = DEFAULT_KINEMATICS_CONFIG
): { safePose: RobotPose; hasCollided: boolean; hitObstacleName: string | null } {
  // Robot collision boundary: approximate as cylinder/circle around chassis center
  const robotRadius = config.robotRadiusUnits || 1.8;

  for (const obs of obstacles) {
    if (!obs.visible) continue;

    // Obstacle dimensions based on component type
    let obsHalfWidth = 1.0;  // X half-extent
    let obsHalfDepth = 1.0;  // Z half-extent

    if (obs.type === 'obstacle_box') {
      obsHalfWidth = 1.1; // Box geometry 2.2 x 2.2 x 2.2
      obsHalfDepth = 1.1;
    } else if (obs.type === 'obstacle_wall') {
      obsHalfWidth = 3.0; // Wall geometry 6.0 x 2.4 x 0.8
      obsHalfDepth = 0.5;
    }

    // AABB check with margin
    const minX = obs.position.x - (obsHalfWidth + robotRadius);
    const maxX = obs.position.x + (obsHalfWidth + robotRadius);
    const minZ = obs.position.z - (obsHalfDepth + robotRadius);
    const maxZ = obs.position.z + (obsHalfDepth + robotRadius);

    if (
      proposedPose.x >= minX &&
      proposedPose.x <= maxX &&
      proposedPose.z >= minZ &&
      proposedPose.z <= maxZ
    ) {
      // Collision detected! Clamp position back to safe boundary along the motion vector
      return {
        safePose: {
          x: previousPose.x,
          y: previousPose.y,
          z: previousPose.z,
          headingDeg: proposedPose.headingDeg, // allow rotating even when blocked
        },
        hasCollided: true,
        hitObstacleName: obs.name,
      };
    }
  }

  return {
    safePose: proposedPose,
    hasCollided: false,
    hitObstacleName: null,
  };
}

/**
 * Calculates initial rigid offsets of all robot assembly components relative to the chassis.
 * When the chassis moves or turns, these relative offsets maintain exact assembly alignment.
 */
export function calculateRobotRelativeOffsets(
  components: Component3D[],
  chassisId: string = 'chassis_01'
): Map<string, RelativeComponentOffset> {
  const offsets = new Map<string, RelativeComponentOffset>();
  const chassis = components.find((c) => c.id === chassisId);
  if (!chassis) return offsets;

  const chassisPos = chassis.position;
  const chassisRot = chassis.rotation;

  // Euler rotation of chassis at reference time (typically 0,0,0)
  const chassisEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(chassisRot.x),
    THREE.MathUtils.degToRad(chassisRot.y),
    THREE.MathUtils.degToRad(chassisRot.z)
  );
  const chassisQuatInv = new THREE.Quaternion().setFromEuler(chassisEuler).invert();

  for (const comp of components) {
    if (comp.id === chassisId) continue;

    // Filter to components that are part of the robot assembly
    const isRobotComponent = [
      'arduino',
      'dc_motor',
      'wheel',
      'servo',
      'ultrasonic',
      'led',
      'potentiometer',
      'line_sensor',
    ].includes(comp.type);

    if (!isRobotComponent) continue;

    // Compute relative vector in chassis local space
    const worldDelta = new THREE.Vector3(
      comp.position.x - chassisPos.x,
      comp.position.y - chassisPos.y,
      comp.position.z - chassisPos.z
    );
    worldDelta.applyQuaternion(chassisQuatInv);

    offsets.set(comp.id, {
      componentId: comp.id,
      type: comp.type,
      offset: { x: worldDelta.x, y: worldDelta.y, z: worldDelta.z },
      baseRotation: { ...comp.rotation },
    });
  }

  return offsets;
}

/**
 * Given the current chassis world pose and cached relative component offsets,
 * transforms a child component mesh to its exact aligned world position and orientation.
 */
export function applyAlignedChildTransform(
  childMesh: THREE.Group,
  relativeOffset: RelativeComponentOffset,
  chassisPose: RobotPose
): void {
  const headingRad = THREE.MathUtils.degToRad(chassisPose.headingDeg);
  const chassisQuat = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    headingRad
  );

  // Rotate local offset by chassis heading
  const offsetVec = new THREE.Vector3(
    relativeOffset.offset.x,
    relativeOffset.offset.y,
    relativeOffset.offset.z
  );
  offsetVec.applyQuaternion(chassisQuat);

  // World position = chassis position + rotated offset
  childMesh.position.set(
    chassisPose.x + offsetVec.x,
    chassisPose.y + offsetVec.y,
    chassisPose.z + offsetVec.z
  );

  // World rotation = base component rotation + chassis yaw
  const childEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(relativeOffset.baseRotation.x),
    THREE.MathUtils.degToRad(relativeOffset.baseRotation.y + chassisPose.headingDeg),
    THREE.MathUtils.degToRad(relativeOffset.baseRotation.z)
  );
  childMesh.rotation.copy(childEuler);
}

// ============================================================================
// Phase 7: Virtual Wheel Encoders & Odometry Calculation
// ============================================================================

export interface WheelEncoderConfig {
  slotsPerRevolution: number; // Standard 20-slot optical disk
  wheelRadiusUnits: number;   // 0.9 units (18.0 cm)
  unitsToCm: number;          // 20.0 cm/unit
}

export const DEFAULT_ENCODER_CONFIG: WheelEncoderConfig = {
  slotsPerRevolution: 20,
  wheelRadiusUnits: 0.9,
  unitsToCm: 20.0,
};

export interface WheelEncoderState {
  leftAngleRad: number;       // Cumulative left wheel angle in radians
  rightAngleRad: number;      // Cumulative right wheel angle in radians
  leftTicks: number;          // Integer pulses accumulated on Pin D2 (INT0)
  rightTicks: number;         // Integer pulses accumulated on Pin D3 (INT1)
  leftDistanceCm: number;     // Left wheel ground distance in cm
  rightDistanceCm: number;    // Right wheel ground distance in cm
  averageDistanceCm: number;  // Robot dead-reckoning odometry distance in cm
}

export function createInitialWheelEncoderState(): WheelEncoderState {
  return {
    leftAngleRad: 0,
    rightAngleRad: 0,
    leftTicks: 0,
    rightTicks: 0,
    leftDistanceCm: 0,
    rightDistanceCm: 0,
    averageDistanceCm: 0,
  };
}

/**
 * Updates wheel optical encoder state based on simulated wheel speeds and elapsed time dt.
 * Emits tick pulses whenever accumulated wheel rotation crosses a slot boundary (2π / 20).
 * Calculates forward/reverse travel distance and dead-reckoning odometry.
 */
export function updateWheelEncoders(
  prevState: WheelEncoderState,
  leftWheelSpeedUnits: number,
  rightWheelSpeedUnits: number,
  dtSeconds: number,
  config: WheelEncoderConfig = DEFAULT_ENCODER_CONFIG
): {
  nextState: WheelEncoderState;
  leftPulseTriggered: boolean;
  rightPulseTriggered: boolean;
  newLeftTicks: number;
  newRightTicks: number;
} {
  const slotAngleRad = (2.0 * Math.PI) / config.slotsPerRevolution;
  const distPerTickCm = (2.0 * Math.PI * config.wheelRadiusUnits * config.unitsToCm) / config.slotsPerRevolution;

  // Angular displacement in radians = (|speed| * dt) / radius
  const dThetaLeft = (Math.abs(leftWheelSpeedUnits) * dtSeconds) / config.wheelRadiusUnits;
  const dThetaRight = (Math.abs(rightWheelSpeedUnits) * dtSeconds) / config.wheelRadiusUnits;

  const nextLeftAngle = prevState.leftAngleRad + dThetaLeft;
  const nextRightAngle = prevState.rightAngleRad + dThetaRight;

  const nextLeftTicks = Math.floor(nextLeftAngle / slotAngleRad);
  const nextRightTicks = Math.floor(nextRightAngle / slotAngleRad);

  const newLeftTicks = nextLeftTicks - prevState.leftTicks;
  const newRightTicks = nextRightTicks - prevState.rightTicks;

  const leftPulseTriggered = newLeftTicks > 0;
  const rightPulseTriggered = newRightTicks > 0;

  const leftDistanceCm = nextLeftTicks * distPerTickCm;
  const rightDistanceCm = nextRightTicks * distPerTickCm;
  const averageDistanceCm = (leftDistanceCm + rightDistanceCm) / 2.0;

  return {
    nextState: {
      leftAngleRad: nextLeftAngle,
      rightAngleRad: nextRightAngle,
      leftTicks: nextLeftTicks,
      rightTicks: nextRightTicks,
      leftDistanceCm,
      rightDistanceCm,
      averageDistanceCm,
    },
    leftPulseTriggered,
    rightPulseTriggered,
    newLeftTicks,
    newRightTicks,
  };
}
