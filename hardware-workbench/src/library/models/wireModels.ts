import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 1 3D Model Generation: Wires & Physical Cables
// ============================================================================

export function buildWireMesh(
  component: Component3D,
  _baseMaterial: THREE.Material,
  _darkMaterial: THREE.Material,
  metalMaterial: THREE.Material,
  _whiteMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = component.id;

  const wireMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(component.color || '#ef4444'),
    roughness: 0.5,
  });

  const dupontBootMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });

  switch (component.type) {
    // 1. Male-to-Male Jumper Wire
    case 'wire_m2m': {
      // Curved insulated wire arc
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.8, 0.05, 0),
        new THREE.Vector3(-0.4, 0.45, 0.2),
        new THREE.Vector3(0.4, 0.45, -0.2),
        new THREE.Vector3(0.8, 0.05, 0),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.035, 12, false);
      const tube = new THREE.Mesh(tubeGeo, wireMat);
      tube.castShadow = true;
      group.add(tube);

      // Square DuPont plastic boot sleeves on ends
      const bootGeo = new THREE.BoxGeometry(0.12, 0.12, 0.28);
      const boot1 = new THREE.Mesh(bootGeo, dupontBootMat);
      boot1.position.set(-0.8, 0.06, 0);
      group.add(boot1);

      const boot2 = new THREE.Mesh(bootGeo, dupontBootMat);
      boot2.position.set(0.8, 0.06, 0);
      group.add(boot2);

      // Male metal pins protruding from boots
      const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8);
      const pin1 = new THREE.Mesh(pinGeo, goldPinMat);
      pin1.position.set(-0.8, 0.06, 0.2);
      pin1.rotateX(Math.PI / 2);
      group.add(pin1);

      const pin2 = new THREE.Mesh(pinGeo, goldPinMat);
      pin2.position.set(0.8, 0.06, 0.2);
      pin2.rotateX(Math.PI / 2);
      group.add(pin2);
      break;
    }

    // 2. Male-to-Female Jumper Wire
    case 'wire_m2f': {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.8, 0.05, 0),
        new THREE.Vector3(-0.3, 0.4, -0.15),
        new THREE.Vector3(0.3, 0.4, 0.15),
        new THREE.Vector3(0.8, 0.05, 0),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.035, 12, false);
      const tube = new THREE.Mesh(tubeGeo, wireMat);
      group.add(tube);

      // Male boot and pin
      const boot1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.28), dupontBootMat);
      boot1.position.set(-0.8, 0.06, 0);
      group.add(boot1);

      const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 8), goldPinMat);
      pin1.position.set(-0.8, 0.06, 0.2);
      pin1.rotateX(Math.PI / 2);
      group.add(pin1);

      // Female socket boot
      const boot2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.32), dupontBootMat);
      boot2.position.set(0.8, 0.06, 0);
      group.add(boot2);
      break;
    }

    // 3. Female-to-Female Jumper Wire
    case 'wire_f2f': {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.8, 0.05, 0),
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0.8, 0.05, 0),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.035, 12, false);
      const tube = new THREE.Mesh(tubeGeo, wireMat);
      group.add(tube);

      // Dual female boots
      const boot1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.32), dupontBootMat);
      boot1.position.set(-0.8, 0.06, 0);
      group.add(boot1);

      const boot2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.32), dupontBootMat);
      boot2.position.set(0.8, 0.06, 0);
      group.add(boot2);
      break;
    }

    // 4. Single Solid-Core Wire
    case 'wire_solid_core': {
      // Angular bent solid wire (flush breadboard hookup wire style)
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.6, 0, 0),
        new THREE.Vector3(-0.55, 0.1, 0),
        new THREE.Vector3(0.55, 0.1, 0),
        new THREE.Vector3(0.6, 0, 0),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.022, 10, false);
      const tube = new THREE.Mesh(tubeGeo, wireMat);
      group.add(tube);

      // Stripped shiny copper ends
      const end1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), goldPinMat);
      end1.position.set(-0.6, -0.05, 0);
      group.add(end1);
      const end2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), goldPinMat);
      end2.position.set(0.6, -0.05, 0);
      group.add(end2);
      break;
    }

    // 5. Multicolor Jumper Wire Ribbon (10-wire rainbow)
    case 'wire_multicolor': {
      const rainbowColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xd946ef, 0x64748b, 0xf8fafc];
      for (let i = 0; i < 10; i++) {
        const z = -0.3 + i * 0.065;
        const cMat = new THREE.MeshStandardMaterial({ color: rainbowColors[i], roughness: 0.5 });
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.8, 0.05, z),
          new THREE.Vector3(0, 0.35, z),
          new THREE.Vector3(0.8, 0.05, z),
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 8, false), cMat);
        group.add(tube);
      }
      break;
    }

    // 6. Flat IDC Ribbon Cable (16-Pin)
    case 'cable_ribbon': {
      // Flat gray ribbon
      const ribbonGeo = new THREE.BoxGeometry(1.6, 0.02, 0.5);
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0, 0.06, 0);
      group.add(ribbon);

      // Red polarity stripe on edge 1
      const stripeGeo = new THREE.BoxGeometry(1.6, 0.025, 0.04);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.065, -0.23);
      group.add(stripe);

      // 2x8 IDC Socket headers on ends
      const idcGeo = new THREE.BoxGeometry(0.18, 0.18, 0.6);
      const idc1 = new THREE.Mesh(idcGeo, dupontBootMat);
      idc1.position.set(-0.85, 0.08, 0);
      group.add(idc1);
      const idc2 = new THREE.Mesh(idcGeo, dupontBootMat);
      idc2.position.set(0.85, 0.08, 0);
      group.add(idc2);
      break;
    }

    // 7. USB-A to USB-B Cable
    case 'cable_usb_ab': {
      // Blue translucent cable jacket
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.0, 0.08, 0),
        new THREE.Vector3(-0.5, 0.3, 0.3),
        new THREE.Vector3(0.5, 0.3, -0.3),
        new THREE.Vector3(1.0, 0.08, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.06, 12, false), cableMat);
      group.add(tube);

      // USB-A Plug at End 1
      const usbAGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
      const usba = new THREE.Mesh(usbAGeo, metalMaterial);
      usba.position.set(-1.05, 0.08, 0);
      group.add(usba);

      // USB-B Square Plug at End 2 (for Arduino Uno / Mega)
      const usbBGeo = new THREE.BoxGeometry(0.35, 0.25, 0.28);
      const usbb = new THREE.Mesh(usbBGeo, metalMaterial);
      usbb.position.set(1.05, 0.08, 0);
      group.add(usbb);
      break;
    }

    // 8. Micro-USB Cable
    case 'cable_micro_usb': {
      const blackCableMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.9, 0.06, 0),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0.9, 0.06, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.045, 10, false), blackCableMat);
      group.add(tube);

      // USB-A host
      const usba = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.24), metalMaterial);
      usba.position.set(-0.95, 0.06, 0);
      group.add(usba);

      // Slim Micro-USB plug
      const micro = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.16), metalMaterial);
      micro.position.set(0.95, 0.06, 0);
      group.add(micro);
      break;
    }

    // 9. USB-C Cable
    case 'cable_usb_c': {
      const whiteCableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.9, 0.06, 0),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0.9, 0.06, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.05, 12, false), whiteCableMat);
      group.add(tube);

      // Oval USB-C reversible metal plugs
      const cPlug1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.18), metalMaterial);
      cPlug1.position.set(-0.95, 0.06, 0);
      group.add(cPlug1);
      const cPlug2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.18), metalMaterial);
      cPlug2.position.set(0.95, 0.06, 0);
      group.add(cPlug2);
      break;
    }

    // 10. Alligator Clip Wire
    case 'wire_alligator': {
      // Flexible insulated wire
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.9, 0.08, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.9, 0.08, 0),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.04, 10, false), wireMat);
      group.add(tube);

      // Alligator clip metallic jaws + colored PVC boot at each end
      [-0.95, 0.95].forEach((xPos, idx) => {
        // PVC insulated flexible boot
        const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.3, 12), wireMat);
        boot.rotateZ(idx === 0 ? Math.PI / 2 : -Math.PI / 2);
        boot.position.set(xPos, 0.08, 0);
        group.add(boot);

        // Toothed steel jaws
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), metalMaterial);
        jaw.position.set(xPos + (idx === 0 ? -0.2 : 0.2), 0.08, 0);
        group.add(jaw);
      });
      break;
    }
  }

  return group;
}
