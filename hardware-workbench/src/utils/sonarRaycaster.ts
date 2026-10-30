import * as THREE from 'three';
import type { Component3D, MechanicalAttachment } from '../types/workbench';

export const SONAR_UNITS_TO_CM = 20; // 1 Three.js world unit = 20 cm
export const SONAR_MAX_DISTANCE_CM = 400; // HC-SR04 maximum distance (400 cm / 20 units)
export const SONAR_MIN_DISTANCE_CM = 2;   // HC-SR04 minimum blind zone (2 cm / 0.1 units)
export const SONAR_SAFE_THRESHOLD_CM = 25; // Standard obstacle braking threshold (25 cm)

// Module-level shared Raycaster to eliminate per-frame GC allocations
const sharedRaycaster = new THREE.Raycaster();

export interface RaycastSonarResult {
  distanceCm: number;
  hitPoint: THREE.Vector3 | null;
  hitNormal: THREE.Vector3 | null;
  hitComponentId: string | null;
  hitComponentName: string | null;
  hasHit: boolean;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
}

/**
 * Finds all component IDs that are mechanically or structurally part of the robot assembly,
 * ensuring the ultrasonic sensor never falsely detects its own chassis, wheels, or board.
 */
export function getRobotAssemblyComponentIds(
  sonarCompId: string,
  components: Component3D[],
  attachments: MechanicalAttachment[]
): Set<string> {
  const robotIds = new Set<string>();
  robotIds.add(sonarCompId);

  // Add all components that are part of the standard robot platform
  for (const c of components) {
    if (
      c.type === 'chassis' ||
      c.type === 'arduino' ||
      c.type === 'dc_motor' ||
      c.type === 'wheel' ||
      c.type === 'servo' ||
      c.type === 'led' ||
      c.type === 'ultrasonic' ||
      c.type === 'line_sensor' ||
      c.type === 'potentiometer'
    ) {
      robotIds.add(c.id);
    }
  }

  // Also traverse any explicit mechanical attachments connected to the robot
  let changed = true;
  while (changed) {
    changed = false;
    for (const att of attachments) {
      if (robotIds.has(att.parentComponentId) && !robotIds.has(att.childComponentId)) {
        robotIds.add(att.childComponentId);
        changed = true;
      }
      if (robotIds.has(att.childComponentId) && !robotIds.has(att.parentComponentId)) {
        robotIds.add(att.parentComponentId);
        changed = true;
      }
    }
  }

  return robotIds;
}

/**
 * Performs real-time multi-ray ultrasonic detection from the transducer face
 * into the 3D scene, testing against movable obstacles and world objects.
 */
export function detectObstacleDistance(
  sonarComp: Component3D,
  meshesMap: Map<string, THREE.Group>,
  components: Component3D[],
  attachments: MechanicalAttachment[]
): RaycastSonarResult {
  const sonarMesh = meshesMap.get(sonarComp.id);
  const defaultOrigin = new THREE.Vector3(sonarComp.position.x, sonarComp.position.y + 0.22, sonarComp.position.z + 0.21);
  const defaultDirection = new THREE.Vector3(0, 0, 1);

  if (!sonarMesh) {
    const fallbackCm = typeof sonarComp.metadata?.distanceCm === 'number' ? sonarComp.metadata.distanceCm : 45;
    return {
      distanceCm: fallbackCm,
      hitPoint: null,
      hitNormal: null,
      hitComponentId: null,
      hitComponentName: null,
      hasHit: false,
      origin: defaultOrigin,
      direction: defaultDirection,
    };
  }

  // 1. Compute World Origin and Forward Direction (+Z in local transducer space)
  sonarMesh.updateMatrixWorld(true);
  const localTransducerOffset = new THREE.Vector3(0, 0.22, 0.21);
  const origin = localTransducerOffset.clone().applyMatrix4(sonarMesh.matrixWorld);

  const worldQuat = new THREE.Quaternion();
  sonarMesh.getWorldQuaternion(worldQuat);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuat).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQuat).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(worldQuat).normalize();

  // 2. Identify candidate obstacle meshes (exclude the robot's own body)
  const robotComponentIds = getRobotAssemblyComponentIds(sonarComp.id, components, attachments);
  const candidateMeshObjects: THREE.Object3D[] = [];
  const meshToComponentMap = new Map<THREE.Object3D, Component3D>();

  for (const comp of components) {
    if (robotComponentIds.has(comp.id)) continue;
    if (comp.visible === false) continue;

    const group = meshesMap.get(comp.id);
    if (!group) continue;

    group.updateMatrixWorld(true);

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.visible) {
        candidateMeshObjects.push(child);
        meshToComponentMap.set(child, comp);
      }
    });
  }

  if (candidateMeshObjects.length === 0) {
    return {
      distanceCm: SONAR_MAX_DISTANCE_CM,
      hitPoint: null,
      hitNormal: null,
      hitComponentId: null,
      hitComponentName: null,
      hasHit: false,
      origin,
      direction: forward,
    };
  }

  // 3. Multi-ray footprint (Center ray + 4 peripheral rays within ~12° cone)
  const SPREAD_ANGLE_RAD = THREE.MathUtils.degToRad(5.5);
  const sinSpread = Math.sin(SPREAD_ANGLE_RAD);
  const cosSpread = Math.cos(SPREAD_ANGLE_RAD);

  const rayDirections: THREE.Vector3[] = [
    forward.clone(), // Center direct
    forward.clone().multiplyScalar(cosSpread).add(right.clone().multiplyScalar(sinSpread)).normalize(),  // Right spread
    forward.clone().multiplyScalar(cosSpread).sub(right.clone().multiplyScalar(sinSpread)).normalize(),  // Left spread
    forward.clone().multiplyScalar(cosSpread).add(up.clone().multiplyScalar(sinSpread)).normalize(),     // Up spread
    forward.clone().multiplyScalar(cosSpread).sub(up.clone().multiplyScalar(sinSpread)).normalize(),     // Down spread
  ];

  const maxWorldDistance = SONAR_MAX_DISTANCE_CM / SONAR_UNITS_TO_CM; // 20 units
  sharedRaycaster.near = 0.05;
  sharedRaycaster.far = maxWorldDistance;

  let nearestDistanceWorld = Infinity;
  let nearestHitPoint: THREE.Vector3 | null = null;
  let nearestHitNormal: THREE.Vector3 | null = null;
  let nearestHitComponent: Component3D | null = null;

  for (const dir of rayDirections) {
    sharedRaycaster.set(origin, dir);
    const intersects = sharedRaycaster.intersectObjects(candidateMeshObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.distance < nearestDistanceWorld) {
        nearestDistanceWorld = hit.distance;
        nearestHitPoint = hit.point.clone();
        nearestHitNormal = hit.face ? hit.face.normal.clone() : null;
        nearestHitComponent = meshToComponentMap.get(hit.object) || null;
      }
    }
  }

  if (nearestDistanceWorld < Infinity && nearestDistanceWorld <= maxWorldDistance) {
    const rawCm = nearestDistanceWorld * SONAR_UNITS_TO_CM;
    const distanceCm = Math.max(SONAR_MIN_DISTANCE_CM, Math.min(SONAR_MAX_DISTANCE_CM, Math.round(rawCm)));

    return {
      distanceCm,
      hitPoint: nearestHitPoint,
      hitNormal: nearestHitNormal,
      hitComponentId: nearestHitComponent?.id || null,
      hitComponentName: nearestHitComponent?.name || 'Obstacle',
      hasHit: true,
      origin,
      direction: forward,
    };
  }

  return {
    distanceCm: SONAR_MAX_DISTANCE_CM,
    hitPoint: null,
    hitNormal: null,
    hitComponentId: null,
    hitComponentName: null,
    hasHit: false,
    origin,
    direction: forward,
  };
}

/**
 * Creates or updates a visual 3D ultrasonic beam cone attached to the sensor mesh.
 */
export function updateSonarBeamVisual(
  sonarMesh: THREE.Group,
  distanceCm: number,
  isVisible: boolean,
  hasObstacle: boolean
): void {
  let beamGroup = sonarMesh.getObjectByName('sonar_beam_visual_group') as THREE.Group | undefined;

  if (!isVisible) {
    if (beamGroup) beamGroup.visible = false;
    return;
  }

  const worldDist = Math.max(0.2, Math.min(SONAR_MAX_DISTANCE_CM / SONAR_UNITS_TO_CM, distanceCm / SONAR_UNITS_TO_CM));
  const halfAngleRad = THREE.MathUtils.degToRad(7.5); // 15° total field of view
  const radius = Math.max(0.1, worldDist * Math.tan(halfAngleRad));

  const isWarning = hasObstacle && distanceCm <= SONAR_SAFE_THRESHOLD_CM;
  const coneColor = isWarning ? 0xef4444 : 0x0284c7; // Red when close obstacle, Cyan blue when clear
  const coneOpacity = isWarning ? 0.35 : 0.20;

  if (beamGroup && beamGroup.visible && beamGroup.userData.lastDistCm === distanceCm && beamGroup.userData.lastColor === coneColor) {
    return;
  }

  if (!beamGroup) {
    beamGroup = new THREE.Group();
    beamGroup.name = 'sonar_beam_visual_group';
    beamGroup.userData = { lastDistCm: distanceCm, lastColor: coneColor };

    // 1. Semi-transparent conical beam volume
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
    const coneGeo = new THREE.CylinderGeometry(0.1, radius, worldDist, 24, 1, true);
    // Orient cylinder so its top is at origin and extends in +Z
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, worldDist / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: coneColor,
      transparent: true,
      opacity: coneOpacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.name = 'sonar_cone_mesh';
    beamGroup.add(coneMesh);

    // 2. Wireframe perimeter outline at the detection wavefront
    const ringGeo = new THREE.RingGeometry(Math.max(0.01, radius - 0.04), radius, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: coneColor,
      transparent: true,
      opacity: isWarning ? 0.9 : 0.6,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = 'sonar_ring_mesh';
    ringMesh.position.set(0, 0, worldDist);
    beamGroup.add(ringMesh);

    // Position group at the ultrasonic transducer face in local coordinates
    beamGroup.position.set(0, 0.22, 0.21);
    sonarMesh.add(beamGroup);
  } else {
    beamGroup.visible = true;
    beamGroup.userData.lastDistCm = distanceCm;
    beamGroup.userData.lastColor = coneColor;

    const coneMesh = beamGroup.getObjectByName('sonar_cone_mesh') as THREE.Mesh | undefined;
    if (coneMesh) {
      coneMesh.geometry.dispose();
      const newGeo = new THREE.CylinderGeometry(0.1, radius, worldDist, 24, 1, true);
      newGeo.rotateX(Math.PI / 2);
      newGeo.translate(0, 0, worldDist / 2);
      coneMesh.geometry = newGeo;

      const mat = coneMesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(coneColor);
      mat.opacity = coneOpacity;
    }

    const ringMesh = beamGroup.getObjectByName('sonar_ring_mesh') as THREE.Mesh | undefined;
    if (ringMesh) {
      ringMesh.geometry.dispose();
      ringMesh.geometry = new THREE.RingGeometry(Math.max(0.01, radius - 0.04), radius, 24);
      ringMesh.position.set(0, 0, worldDist);

      const mat = ringMesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(coneColor);
      mat.opacity = isWarning ? 0.9 : 0.6;
    }
  }
}
