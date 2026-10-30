import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { 
  Component3D, 
  MechanicalAttachment, 
  Vector3D 
} from '../types/workbench';
import { findMountPoint } from './assemblyDefinitions';

let isRapierInitialized = false;

export async function ensureRapierInitialized() {
  if (!isRapierInitialized) {
    await RAPIER.init();
    isRapierInitialized = true;
  }
  return RAPIER;
}

export interface PhysicsStepResult {
  transforms: Map<string, { position: Vector3D; rotation: Vector3D }>;
}

export class PhysicsWorldManager {
  private world: RAPIER.World | null = null;
  private bodies: Map<string, RAPIER.RigidBody> = new Map();
  private joints: Map<string, RAPIER.ImpulseJoint> = new Map();

  async init(
    components: Component3D[],
    attachments: MechanicalAttachment[] = []
  ): Promise<boolean> {
    await ensureRapierInitialized();

    // 1. Clean up existing world
    this.cleanup();

    // 2. Create new Physics World with standard earth gravity (-9.81 m/s^2)
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    this.world = new RAPIER.World(gravity);

    // 3. Ground Collider at y = 0
    const groundDesc = RAPIER.ColliderDesc.cuboid(40.0, 0.1, 40.0)
      .setTranslation(0.0, -0.1, 0.0)
      .setFriction(0.8)
      .setRestitution(0.1);
    this.world.createCollider(groundDesc);

    // 4. Create RigidBodies & Colliders for Components
    for (const comp of components) {
      if (!comp.visible) continue;

      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(comp.rotation.x),
          THREE.MathUtils.degToRad(comp.rotation.y),
          THREE.MathUtils.degToRad(comp.rotation.z)
        )
      );

      // Create Dynamic RigidBody
      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(comp.position.x, comp.position.y, comp.position.z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinearDamping(0.3)
        .setAngularDamping(0.3);

      const body = this.world.createRigidBody(bodyDesc);
      body.userData = { componentId: comp.id, type: comp.type };

      // Collider based on component geometry dimensions
      const colliderDesc = this.createColliderForComponent(comp);
      if (colliderDesc) {
        this.world.createCollider(colliderDesc, body);
      }

      this.bodies.set(comp.id, body);
    }

    // 5. Create Physics Joints for Mechanical Attachments
    for (const att of attachments) {
      const parentBody = this.bodies.get(att.parentComponentId);
      const childBody = this.bodies.get(att.childComponentId);
      if (!parentBody || !childBody) continue;

      const parentComp = components.find((c) => c.id === att.parentComponentId);
      const childComp = components.find((c) => c.id === att.childComponentId);
      if (!parentComp || !childComp) continue;

      const parentMount = findMountPoint(parentComp, att.parentMountId);
      const childMount = findMountPoint(childComp, att.childMountId);
      if (!parentMount || !childMount) continue;

      const anchor1 = new RAPIER.Vector3(parentMount.position.x, parentMount.position.y, parentMount.position.z);
      const anchor2 = new RAPIER.Vector3(childMount.position.x, childMount.position.y, childMount.position.z);

      if (att.jointType === 'revolute') {
        // Revolute joint around X axis (drive axle)
        const axis = new RAPIER.Vector3(1.0, 0.0, 0.0);
        const jointData = RAPIER.JointData.revolute(anchor1, anchor2, axis);
        const joint = this.world.createImpulseJoint(jointData, parentBody, childBody, true) as RAPIER.RevoluteImpulseJoint;

        // Apply motor velocity if configured
        if (typeof att.motorSpeed === 'number' && att.motorSpeed !== 0) {
          joint.setMotorMaxForce(att.motorMaxForce || 8.0);
          joint.configureMotorVelocity(att.motorSpeed, 1.0);
        }

        this.joints.set(att.id, joint);
      } else {
        // Fixed rigid joint
        const rot1 = { x: 0, y: 0, z: 0, w: 1 };
        const rot2 = { x: 0, y: 0, z: 0, w: 1 };
        const jointData = RAPIER.JointData.fixed(anchor1, rot1, anchor2, rot2);
        const joint = this.world.createImpulseJoint(jointData, parentBody, childBody, true);
        this.joints.set(att.id, joint);
      }
    }

    return true;
  }

  private createColliderForComponent(comp: Component3D): RAPIER.ColliderDesc | null {
    switch (comp.type) {
      case 'chassis':
        // Half-extents: 4.0 x 0.18 x 2.8 => (2.0, 0.09, 1.4)
        return RAPIER.ColliderDesc.cuboid(2.0, 0.09, 1.4)
          .setMass(comp.mass || 1.8)
          .setFriction(0.6)
          .setRestitution(0.1);

      case 'dc_motor':
        // Half-extents: 1.2 x 0.7 x 0.6 => (0.6, 0.35, 0.3)
        return RAPIER.ColliderDesc.cuboid(0.6, 0.35, 0.3)
          .setMass(comp.mass || 0.4)
          .setFriction(0.5);

      case 'wheel':
        // Wheel cylinder with high ground traction friction
        return RAPIER.ColliderDesc.cylinder(0.22, 1.0)
          .setRotation({ 
            x: 0, 
            y: 0, 
            z: Math.SQRT1_2, 
            w: Math.SQRT1_2 
          }) // Rotate 90 deg along Z axis to align cylinder with wheel rolling axis
          .setMass(comp.mass || 0.3)
          .setFriction(1.2) // High rubber grip
          .setRestitution(0.2);

      case 'servo':
        return RAPIER.ColliderDesc.cuboid(0.3, 0.45, 0.18)
          .setMass(comp.mass || 0.12)
          .setFriction(0.4);

      case 'arduino':
        return RAPIER.ColliderDesc.cuboid(1.2, 0.04, 0.9)
          .setMass(comp.mass || 0.15)
          .setFriction(0.4);

      case 'ultrasonic':
        return RAPIER.ColliderDesc.cuboid(0.8, 0.2, 0.45)
          .setMass(comp.mass || 0.08)
          .setFriction(0.4);

      case 'led':
        return RAPIER.ColliderDesc.cuboid(0.14, 0.25, 0.14)
          .setMass(comp.mass || 0.02)
          .setFriction(0.3);

      default:
        return RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1.0);
    }
  }

  setMotorSpeed(attachmentId: string, speed: number, maxForce: number = 8.0) {
    const joint = this.joints.get(attachmentId);
    if (joint && 'configureMotorVelocity' in joint) {
      const revJoint = joint as RAPIER.RevoluteImpulseJoint;
      revJoint.setMotorMaxForce(maxForce);
      revJoint.configureMotorVelocity(speed, 1.0);
    }
  }

  step(): PhysicsStepResult {
    if (!this.world) {
      return { transforms: new Map() };
    }

    // Step physics world forward
    this.world.step();

    const transforms = new Map<string, { position: Vector3D; rotation: Vector3D }>();

    this.bodies.forEach((body, compId) => {
      const translation = body.translation();
      const rotation = body.rotation();

      const q = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
      const euler = new THREE.Euler().setFromQuaternion(q);

      transforms.set(compId, {
        position: {
          x: translation.x,
          y: translation.y,
          z: translation.z,
        },
        rotation: {
          x: THREE.MathUtils.radToDeg(euler.x),
          y: THREE.MathUtils.radToDeg(euler.y),
          z: THREE.MathUtils.radToDeg(euler.z),
        },
      });
    });

    return { transforms };
  }

  cleanup() {
    if (this.world) {
      this.joints.clear();
      this.bodies.clear();
      this.world.free();
      this.world = null;
    }
  }
}

export const physicsWorld = new PhysicsWorldManager();
