import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 1 3D Model Generation: Connectors & Accessories
// ============================================================================

export function buildAccessoryMesh(
  component: Component3D,
  _baseMaterial: THREE.Material,
  darkMaterial: THREE.Material,
  metalMaterial: THREE.Material,
  _whiteMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = component.id;

  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });

  switch (component.type) {
    // 1. Male Pin Header (1x40 Breakaway)
    case 'header_male_40': {
      // Black plastic spacer bar
      const barGeo = new THREE.BoxGeometry(2.0, 0.12, 0.12);
      const bar = new THREE.Mesh(barGeo, plasticMat);
      bar.position.set(0, 0.06, 0);
      group.add(bar);

      // Gold square pins protruding through bar
      const pinCount = 16;
      const pinGeo = new THREE.BoxGeometry(0.035, 0.45, 0.035);
      for (let i = 0; i < pinCount; i++) {
        const pin = new THREE.Mesh(pinGeo, goldPinMat);
        pin.position.set(-0.9 + i * 0.12, 0.1, 0);
        group.add(pin);
      }
      break;
    }

    // 2. Female Pin Header (1x40 Socket Strip)
    case 'header_female_40': {
      // Tall black plastic socket body
      const bodyGeo = new THREE.BoxGeometry(2.0, 0.4, 0.12);
      const body = new THREE.Mesh(bodyGeo, plasticMat);
      body.position.set(0, 0.2, 0);
      group.add(body);

      // Solder pin tails below
      const tailGeo = new THREE.BoxGeometry(0.025, 0.15, 0.025);
      for (let i = 0; i < 16; i++) {
        const tail = new THREE.Mesh(tailGeo, goldPinMat);
        tail.position.set(-0.9 + i * 0.12, -0.05, 0);
        group.add(tail);
      }
      break;
    }

    // 3. 2-Pin Screw Terminal Block (5.08mm)
    case 'terminal_block_2p': {
      // Green industrial thermoplastic housing
      const greenHousingMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
      const housingGeo = new THREE.BoxGeometry(0.8, 0.7, 0.65);
      const housing = new THREE.Mesh(housingGeo, greenHousingMat);
      housing.position.set(0, 0.35, 0);
      housing.castShadow = true;
      group.add(housing);

      // Two slotted silver screws on top
      const screwGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
      const s1 = new THREE.Mesh(screwGeo, metalMaterial);
      s1.position.set(-0.2, 0.72, 0);
      group.add(s1);
      const s2 = new THREE.Mesh(screwGeo, metalMaterial);
      s2.position.set(0.2, 0.72, 0);
      group.add(s2);

      // Two wire entry tunnels in front
      const tunnelMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const tGeo = new THREE.BoxGeometry(0.16, 0.2, 0.1);
      const t1 = new THREE.Mesh(tGeo, tunnelMat);
      t1.position.set(-0.2, 0.35, 0.3);
      group.add(t1);
      const t2 = new THREE.Mesh(tGeo, tunnelMat);
      t2.position.set(0.2, 0.35, 0.3);
      group.add(t2);
      break;
    }

    // 4. JST-XH Polarized Shrouded Header (2-Pin)
    case 'connector_jst_xh': {
      // White nylon keyed shroud
      const shroudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const shroudGeo = new THREE.BoxGeometry(0.5, 0.45, 0.4);
      const shroud = new THREE.Mesh(shroudGeo, shroudMat);
      shroud.position.set(0, 0.22, 0);
      group.add(shroud);

      // Two inner pins
      const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
      const p1 = new THREE.Mesh(pinGeo, metalMaterial);
      p1.position.set(-0.1, 0.25, 0);
      group.add(p1);
      const p2 = new THREE.Mesh(pinGeo, metalMaterial);
      p2.position.set(0.1, 0.25, 0);
      group.add(p2);
      break;
    }

    // 5. DC Barrel Jack (2.1mm x 5.5mm)
    case 'dc_barrel_jack': {
      // Black cylindrical outer bushing
      const bodyGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.6, 20);
      bodyGeo.rotateZ(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, plasticMat);
      body.position.set(0, 0.25, 0);
      group.add(body);

      // Inner metal barrel sleeve
      const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 16);
      sleeveGeo.rotateZ(Math.PI / 2);
      const sleeve = new THREE.Mesh(sleeveGeo, metalMaterial);
      sleeve.position.set(0.2, 0.25, 0);
      group.add(sleeve);

      // Center positive pin
      const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12);
      pinGeo.rotateZ(Math.PI / 2);
      const pin = new THREE.Mesh(pinGeo, metalMaterial);
      pin.position.set(0.2, 0.25, 0);
      group.add(pin);
      break;
    }

    // 6. Breadboard Power Supply Module (MB102)
    case 'breadboard_psu_module': {
      // Black rectangular circuit board that arches over breadboard rails
      const pcbGeo = new THREE.BoxGeometry(1.6, 0.08, 1.8);
      const pcb = new THREE.Mesh(pcbGeo, plasticMat);
      pcb.position.set(0, 0.2, 0);
      group.add(pcb);

      // DC Barrel Jack input on left
      const dcJack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 16), darkMaterial);
      dcJack.rotateZ(Math.PI / 2);
      dcJack.position.set(-0.65, 0.32, -0.4);
      group.add(dcJack);

      // USB-A port in front
      const usb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.35), metalMaterial);
      usb.position.set(-0.6, 0.3, 0.35);
      group.add(usb);

      // Push button power switch (Self-locking blue/yellow toggle)
      const swMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), swMat);
      sw.position.set(-0.1, 0.32, -0.4);
      group.add(sw);

      // Green Power LED
      const ledMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.5 });
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), ledMat);
      led.position.set(0.2, 0.25, -0.4);
      group.add(led);

      // Output pins extending downward to plug into breadboard power rails
      const pinTailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
      [
        [0.55, 0.05, -0.55],
        [0.55, 0.05, -0.4],
        [0.55, 0.05, 0.4],
        [0.55, 0.05, 0.55],
      ].forEach(([px, py, pz]) => {
        const pTail = new THREE.Mesh(pinTailGeo, goldPinMat);
        pTail.position.set(px, py, pz);
        group.add(pTail);
      });
      break;
    }
  }

  return group;
}
