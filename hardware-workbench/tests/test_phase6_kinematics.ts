import * as THREE from 'three';
import {
  computeWheelSpeeds,
  computeDifferentialKinematics,
  integrateRobotPose,
  resolveObstacleCollision,
  calculateRobotRelativeOffsets,
  applyAlignedChildTransform,
  DEFAULT_KINEMATICS_CONFIG,
  INITIAL_ROBOT_POSE,
  type RobotPose,
} from '../src/utils/robotKinematics';
import type { Component3D } from '../src/types/workbench';

console.log('================================================================');
console.log('Hardware Workbench — Phase 6 Milestone 1 Test Suite');
console.log('Differential-Drive Kinematics & Mathematical Validation');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       ${details}`);
    failedTests++;
  }
}

// 1. Zero motor output produces zero velocity
console.log('--- TEST 1: Zero Motor Output ---');
const zeroSpeeds = computeWheelSpeeds(0, 0);
assert(zeroSpeeds.leftWheelSpeed === 0 && zeroSpeeds.rightWheelSpeed === 0, 'Zero PWM produces 0 wheel speeds');
const zeroKinematics = computeDifferentialKinematics(zeroSpeeds.leftWheelSpeed, zeroSpeeds.rightWheelSpeed);
assert(zeroKinematics.linearVelocity === 0, 'Zero wheel speeds produce 0 linear velocity');
assert(zeroKinematics.angularVelocityDeg === 0, 'Zero wheel speeds produce 0 angular velocity');
const staticPose = integrateRobotPose(INITIAL_ROBOT_POSE, zeroKinematics.linearVelocity, zeroKinematics.angularVelocityDeg, 0.016);
assert(staticPose.x === 0 && staticPose.z === 0 && staticPose.headingDeg === 0, 'Stationary robot maintains exact initial pose');

// 2. Equal positive wheel speeds produce pure forward translation (+Z)
console.log('\n--- TEST 2: Pure Forward Motion ---');
const forwardSpeeds = computeWheelSpeeds(190, 190);
assert(forwardSpeeds.leftWheelSpeed > 0 && forwardSpeeds.leftWheelSpeed === forwardSpeeds.rightWheelSpeed, 'Equal PWM produces equal wheel speeds');
const forwardKinematics = computeDifferentialKinematics(forwardSpeeds.leftWheelSpeed, forwardSpeeds.rightWheelSpeed);
assert(forwardKinematics.linearVelocity > 1.4 && forwardKinematics.linearVelocity < 1.6, 'PWM 190 produces ~1.49 units/s linear velocity');
assert(Math.abs(forwardKinematics.angularVelocityDeg) < 1e-6, 'Equal wheel speeds produce 0 yaw rate');
const forwardPose = integrateRobotPose(INITIAL_ROBOT_POSE, forwardKinematics.linearVelocity, 0, 1.0); // 1.0 second
assert(forwardPose.z > 1.4 && forwardPose.z < 1.6, `Robot advanced forward along +Z (z = ${forwardPose.z.toFixed(2)})`);
assert(forwardPose.x === 0, 'Pure forward motion produces zero lateral X drift');
assert(forwardPose.headingDeg === 0, 'Pure forward motion maintains 0° heading');

// 3. Equal negative wheel speeds produce pure reverse motion (-Z)
console.log('\n--- TEST 3: Pure Reverse Motion ---');
const reverseSpeeds = computeWheelSpeeds(255, 255, -1, -1);
assert(reverseSpeeds.leftWheelSpeed < 0 && reverseSpeeds.rightWheelSpeed < 0, 'Negative directions produce negative wheel speeds');
const reverseKinematics = computeDifferentialKinematics(reverseSpeeds.leftWheelSpeed, reverseSpeeds.rightWheelSpeed);
assert(reverseKinematics.linearVelocity === -2.0, 'Full reverse produces -2.0 units/s');
const reversePose = integrateRobotPose(INITIAL_ROBOT_POSE, reverseKinematics.linearVelocity, 0, 1.0);
assert(reversePose.z === -2.0, 'Robot translated backwards along -Z (z = -2.0)');
assert(reversePose.x === 0, 'Reverse motion produces zero lateral drift');

// 4. Differential steering (unequal speeds) produces curved path
console.log('\n--- TEST 4: Differential Steering & Turning ---');
// Left wheel faster than right wheel -> turns to the right (positive yaw)
const turnRightSpeeds = computeWheelSpeeds(200, 100);
const turnRightKinematics = computeDifferentialKinematics(turnRightSpeeds.leftWheelSpeed, turnRightSpeeds.rightWheelSpeed);
assert(turnRightKinematics.linearVelocity > 0, 'Turn right has forward component');
assert(turnRightKinematics.angularVelocityDeg > 0, 'Left wheel faster produces positive (rightward) yaw rate');
const turnRightPose = integrateRobotPose(INITIAL_ROBOT_POSE, turnRightKinematics.linearVelocity, turnRightKinematics.angularVelocityDeg, 0.5);
assert(turnRightPose.headingDeg > 0, `Heading turned right (heading = ${turnRightPose.headingDeg.toFixed(1)}°)`);
assert(turnRightPose.x > 0, `Robot drifted rightward along +X (x = ${turnRightPose.x.toFixed(2)})`);
assert(turnRightPose.z > 0, `Robot advanced forward along +Z (z = ${turnRightPose.z.toFixed(2)})`);

// 5. Opposite wheel speeds produce in-place rotation
console.log('\n--- TEST 5: In-Place Pure Rotation ---');
// Left forward, Right reverse -> rotates clockwise (right) with zero linear translation
const spinSpeeds = computeWheelSpeeds(200, 200, 1, -1);
const spinKinematics = computeDifferentialKinematics(spinSpeeds.leftWheelSpeed, spinSpeeds.rightWheelSpeed);
assert(Math.abs(spinKinematics.linearVelocity) < 1e-6, 'Equal opposite wheel speeds produce exactly 0 linear velocity');
assert(spinKinematics.angularVelocityDeg > 0, `Clockwise spin produces positive yaw rate (${spinKinematics.angularVelocityDeg.toFixed(1)} deg/s)`);
const spinPose = integrateRobotPose(INITIAL_ROBOT_POSE, 0, spinKinematics.angularVelocityDeg, 1.0);
assert(spinPose.x === 0 && spinPose.z === 0, 'Robot center remained stationary at (0, 0) during in-place spin');
assert(spinPose.headingDeg > 30, `Heading turned significantly in 1s (heading = ${spinPose.headingDeg.toFixed(1)}°)`);

// 6. Assembly relative offsets and alignment
console.log('\n--- TEST 6: Assembly Relative Offset Maintenance ---');
const mockComponents: Component3D[] = [
  {
    id: 'chassis_01',
    name: 'Robot Chassis Base',
    type: 'chassis',
    category: 'structural',
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#059669',
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
];

const offsets = calculateRobotRelativeOffsets(mockComponents, 'chassis_01');
assert(offsets.has('ultrasonic_eye'), 'Offsets computed for ultrasonic sensor');
assert(offsets.has('wheel_left'), 'Offsets computed for left wheel');

const sonarOffset = offsets.get('ultrasonic_eye')!;
assert(Math.abs(sonarOffset.offset.z - 1.1) < 1e-4, 'Sonar offset relative to chassis is +1.1 in Z');
assert(Math.abs(sonarOffset.offset.y - 1.0) < 1e-4, 'Sonar offset relative to chassis is +1.0 in Y');

// Transform child mesh with moved chassis
const movedChassisPose: RobotPose = { x: 0, y: 0.5, z: 2.0, headingDeg: 0 };
const testSonarMesh = new THREE.Group();
applyAlignedChildTransform(testSonarMesh, sonarOffset, movedChassisPose);
assert(Math.abs(testSonarMesh.position.z - 3.1) < 1e-4, 'Sonar moved forward with chassis to Z=3.1 (2.0 + 1.1)');
assert(testSonarMesh.position.x === 0, 'Sonar maintained center X alignment');

// Rotated chassis
const rotatedChassisPose: RobotPose = { x: 0, y: 0.5, z: 0, headingDeg: 90 }; // turned 90° right (+X)
const rotatedSonarMesh = new THREE.Group();
applyAlignedChildTransform(rotatedSonarMesh, sonarOffset, rotatedChassisPose);
assert(Math.abs(rotatedSonarMesh.position.x - 1.1) < 1e-4, 'When chassis turns 90° right, sensor points and translates along +X (+1.1)');
assert(Math.abs(rotatedSonarMesh.position.z) < 1e-4, 'Sensor Z is 0 after 90° yaw rotation');
assert(rotatedSonarMesh.rotation.y === Math.PI / 2, 'Sensor mesh yaw matched chassis 90° heading');

// 7. Solid Obstacle Collision Clamping
console.log('\n--- TEST 7: Solid Obstacle Collision Clamping ---');
const mockObstacles: Component3D[] = [
  {
    id: 'obstacle_box_01',
    name: 'Cardboard Box Obstacle',
    type: 'obstacle_box',
    category: 'structural',
    position: { x: 0, y: 1.1, z: 4.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: '#d97706',
    visible: true,
  },
];

// Proposed pose outside obstacle (clear)
const safePoseAttempt: RobotPose = { x: 0, y: 0.5, z: 1.5, headingDeg: 0 };
const safeResult = resolveObstacleCollision(safePoseAttempt, INITIAL_ROBOT_POSE, mockObstacles);
assert(!safeResult.hasCollided, 'Clear position at Z=1.5 is allowed without collision');
assert(safeResult.safePose.z === 1.5, 'Safe pose maintains Z=1.5');

// Proposed pose intersecting obstacle (Z=4.0 with box at Z=4.5)
const collisionPoseAttempt: RobotPose = { x: 0, y: 0.5, z: 3.8, headingDeg: 0 };
const previousSafePose: RobotPose = { x: 0, y: 0.5, z: 1.5, headingDeg: 0 };
const collideResult = resolveObstacleCollision(collisionPoseAttempt, previousSafePose, mockObstacles);
assert(collideResult.hasCollided, 'Robot penetrating obstacle boundary triggers collision');
assert(collideResult.safePose.z === 1.5, 'Clamped robot pose back to previous safe position (Z=1.5)');
assert(collideResult.hitObstacleName === 'Cardboard Box Obstacle', 'Collision identifies hit obstacle name');

console.log('\n================================================================');
console.log(`Phase 6 Milestone 1 Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
