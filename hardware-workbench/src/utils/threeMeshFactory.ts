import * as THREE from 'three';
import type { Component3D } from '../types/workbench';

export function createComponentMesh(component: Component3D): THREE.Group {
  const group = new THREE.Group();
  group.name = component.id;
  group.userData = { componentId: component.id, type: component.type };

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(component.color),
    roughness: 0.4,
    metalness: 0.2,
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.7,
    metalness: 0.1,
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.3,
    metalness: 0.8,
  });

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.05,
  });

  switch (component.type) {
    case 'chassis': {
      // Main platform base
      const plateGeo = new THREE.BoxGeometry(4.0, 0.18, 2.8);
      const plateMesh = new THREE.Mesh(plateGeo, baseMaterial);
      plateMesh.castShadow = true;
      plateMesh.receiveShadow = true;
      group.add(plateMesh);

      // Mounting hole markers
      const holeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const holePositions = [
        [-1.6, 0.01, -1.1],
        [1.6, 0.01, -1.1],
        [-1.6, 0.01, 1.1],
        [1.6, 0.01, 1.1],
        [0, 0.01, -0.9],
        [0, 0.01, 0.9],
      ];
      holePositions.forEach(([hx, hy, hz]) => {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(hx, hy, hz);
        group.add(hole);
      });
      break;
    }

    case 'dc_motor': {
      // Yellow gearbox rectangular enclosure
      const boxGeo = new THREE.BoxGeometry(1.2, 0.7, 0.6);
      const box = new THREE.Mesh(boxGeo, baseMaterial);
      box.castShadow = true;
      group.add(box);

      // Metal DC cylindrical motor can
      const canGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.9, 24);
      const can = new THREE.Mesh(canGeo, metalMaterial);
      can.rotation.z = Math.PI / 2;
      can.position.set(-0.8, 0, 0);
      can.castShadow = true;
      group.add(can);

      // Axle drive shafts
      const shaftGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16);
      const shaft = new THREE.Mesh(shaftGeo, whiteMaterial);
      shaft.position.set(0.3, 0, 0);
      shaft.castShadow = true;
      group.add(shaft);

      // Solder tab terminals at rear
      const lugGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
      const lug1 = new THREE.Mesh(lugGeo, metalMaterial);
      lug1.position.set(-1.25, 0, 0.18);
      group.add(lug1);
      const lug2 = new THREE.Mesh(lugGeo, metalMaterial);
      lug2.position.set(-1.25, 0, -0.18);
      group.add(lug2);
      break;
    }

    case 'wheel': {
      // Outer tire cylinder
      const tireGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.45, 32);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, darkMaterial);
      tire.castShadow = true;
      tire.receiveShadow = true;
      group.add(tire);

      // Inner bright hub / rim
      const rimGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.48, 24);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, baseMaterial);
      group.add(rim);

      // Center axle hub
      const axleGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.52, 16);
      axleGeo.rotateZ(Math.PI / 2);
      const axle = new THREE.Mesh(axleGeo, whiteMaterial);
      group.add(axle);

      // Optical slotted encoder disk on inner wheel hub face (Phase 7)
      const discGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 20);
      discGeo.rotateZ(Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.8 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(-0.24, 0, 0);
      group.add(disc);

      // Optical sensor pickup bracket (LM393 photo-interrupter mock)
      const sensorBoxGeo = new THREE.BoxGeometry(0.16, 0.22, 0.16);
      const sensorMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
      const sensorBox = new THREE.Mesh(sensorBoxGeo, sensorMat);
      sensorBox.position.set(-0.24, 0.45, 0);
      group.add(sensorBox);
      break;
    }

    case 'servo': {
      // Blue micro servo body
      const bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
      const body = new THREE.Mesh(bodyGeo, baseMaterial);
      body.castShadow = true;
      group.add(body);

      // Top gear tower
      const towerGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 20);
      const tower = new THREE.Mesh(towerGeo, baseMaterial);
      tower.position.set(0.12, 0.55, 0);
      group.add(tower);

      // White servo horn (arm)
      const hornGeo = new THREE.BoxGeometry(0.65, 0.06, 0.18);
      const horn = new THREE.Mesh(hornGeo, whiteMaterial);
      horn.name = 'servo_horn';
      horn.userData = { isServoHorn: true };
      horn.position.set(0.12, 0.72, 0);
      horn.castShadow = true;
      group.add(horn);

      // Mounting side flanges
      const flangeGeo = new THREE.BoxGeometry(0.85, 0.06, 0.35);
      const flange = new THREE.Mesh(flangeGeo, baseMaterial);
      flange.position.set(0, 0.15, 0);
      group.add(flange);

      // 3-wire ribbon cable lead at bottom
      const wireMatBrown = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const wireMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
      const wireMatOrange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.8 });
      const wireLeadGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
      
      const wBrown = new THREE.Mesh(wireLeadGeo, wireMatBrown);
      wBrown.position.set(-0.12, -0.45, -0.15);
      group.add(wBrown);

      const wRed = new THREE.Mesh(wireLeadGeo, wireMatRed);
      wRed.position.set(0.0, -0.45, -0.15);
      group.add(wRed);

      const wOrange = new THREE.Mesh(wireLeadGeo, wireMatOrange);
      wOrange.position.set(0.12, -0.45, -0.15);
      group.add(wOrange);
      break;
    }

    case 'arduino': {
      // PCB Board (Emerald green / Arduino blue-green)
      const pcbGeo = new THREE.BoxGeometry(2.4, 0.08, 1.8);
      const pcb = new THREE.Mesh(pcbGeo, baseMaterial);
      pcb.castShadow = true;
      pcb.receiveShadow = true;
      group.add(pcb);

      // Microcontroller chip (IC)
      const chipGeo = new THREE.BoxGeometry(0.8, 0.08, 0.8);
      const chipMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(0.1, 0.06, 0.1);
      group.add(chip);

      // USB Port connector
      const usbGeo = new THREE.BoxGeometry(0.5, 0.3, 0.45);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.05, 0.16, -0.45);
      group.add(usb);

      // Female Pin Header strips
      const headerGeo = new THREE.BoxGeometry(1.8, 0.22, 0.14);
      const headerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
      const headerTop = new THREE.Mesh(headerGeo, headerMat);
      headerTop.position.set(0.15, 0.12, -0.78);
      group.add(headerTop);

      const headerBottom = new THREE.Mesh(headerGeo, headerMat);
      headerBottom.position.set(0.15, 0.12, 0.78);
      group.add(headerBottom);
      break;
    }

    case 'led': {
      // Diffused translucent dome
      const domeGeo = new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const ledMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(component.color),
        emissive: new THREE.Color(component.color),
        emissiveIntensity: 0.0, // starts off until powered by circuit
        roughness: 0.2,
      });
      const dome = new THREE.Mesh(domeGeo, ledMat);
      dome.position.set(0, 0.35, 0);
      group.add(dome);

      // Cylindrical lower lens
      const cylGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.35, 24);
      const cyl = new THREE.Mesh(cylGeo, ledMat);
      cyl.position.set(0, 0.18, 0);
      group.add(cyl);

      // Metal base rim
      const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.06, 24);
      const rim = new THREE.Mesh(rimGeo, ledMat);
      rim.position.set(0, 0.01, 0);
      group.add(rim);

      // Dynamic local point light for realistic environmental illumination
      const pointLight = new THREE.PointLight(new THREE.Color(component.color), 0.0, 3.5);
      pointLight.position.set(0, 0.4, 0);
      group.add(pointLight);

      // Store references in group userData for real-time hardware runtime updates
      group.userData.ledMaterial = ledMat;
      group.userData.ledLight = pointLight;
      group.userData.ledColor = component.color;

      // Cathode & Anode pin leads
      const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
      const lead1 = new THREE.Mesh(leadGeo, metalMaterial);
      lead1.position.set(-0.08, -0.25, 0);
      group.add(lead1);

      const lead2 = new THREE.Mesh(leadGeo, metalMaterial);
      lead2.position.set(0.08, -0.28, 0);
      group.add(lead2);
      break;
    }

    case 'ultrasonic': {
      // PCB Board base
      const pcbGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9);
      const pcb = new THREE.Mesh(pcbGeo, baseMaterial);
      pcb.castShadow = true;
      group.add(pcb);

      // Two metal transducer cylinders
      const transGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 24);
      transGeo.rotateX(Math.PI / 2);

      const emitter = new THREE.Mesh(transGeo, metalMaterial);
      emitter.position.set(-0.45, 0.22, 0);
      group.add(emitter);

      const receiver = new THREE.Mesh(transGeo, metalMaterial);
      receiver.position.set(0.45, 0.22, 0);
      group.add(receiver);

      // Transducer front grills
      const grillGeo = new THREE.CircleGeometry(0.28, 16);
      const grillMat = new THREE.MeshBasicMaterial({ color: 0x374151 });
      const grill1 = new THREE.Mesh(grillGeo, grillMat);
      grill1.position.set(-0.45, 0.22, 0.21);
      group.add(grill1);

      const grill2 = new THREE.Mesh(grillGeo, grillMat);
      grill2.position.set(0.45, 0.22, 0.21);
      group.add(grill2);

      // 4-pin right-angle header connector at rear
      const hdrBaseGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
      const hdrBase = new THREE.Mesh(hdrBaseGeo, darkMaterial);
      hdrBase.position.set(0, -0.1, -0.35);
      group.add(hdrBase);

      const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
      pinGeo.rotateX(Math.PI / 2);
      [-0.3, -0.1, 0.1, 0.3].forEach((px) => {
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, -0.1, -0.42);
        group.add(pin);
      });
      break;
    }

    case 'potentiometer': {
      // Cylindrical pot body (metallic / anodized blue housing)
      const bodyGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 24);
      const body = new THREE.Mesh(bodyGeo, baseMaterial);
      body.castShadow = true;
      group.add(body);

      // Threaded metal collar / bushing
      const collarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16);
      const collar = new THREE.Mesh(collarGeo, metalMaterial);
      collar.position.set(0, 0.18, 0);
      group.add(collar);

      // Hex mounting nut
      const nutGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 6);
      const nut = new THREE.Mesh(nutGeo, metalMaterial);
      nut.position.set(0, 0.14, 0);
      group.add(nut);

      // Rotating fluted knob / shaft
      const shaftGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
      const knobMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
      const shaft = new THREE.Mesh(shaftGeo, knobMat);
      shaft.position.set(0, 0.38, 0);
      group.add(shaft);

      // White indicator line / notch on knob
      const notchGeo = new THREE.BoxGeometry(0.03, 0.1, 0.14);
      const notchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(0, 0.45, 0.06);
      group.add(notch);

      // 3 Solder lug terminals at bottom/front (VCC, WIPER, GND)
      const lugGeo = new THREE.BoxGeometry(0.06, 0.22, 0.02);
      [-0.22, 0.0, 0.22].forEach((lx) => {
        const lug = new THREE.Mesh(lugGeo, metalMaterial);
        lug.position.set(lx, -0.22, 0.15);
        group.add(lug);
      });
      break;
    }

    case 'obstacle_box': {
      // Cardboard cargo box (spans from ground to above robot eyes)
      const boxGeo = new THREE.BoxGeometry(1.5, 2.2, 1.2);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(component.color || '#d97706'),
        roughness: 0.8,
        metalness: 0.05,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.castShadow = true;
      box.receiveShadow = true;
      box.userData = { isObstacle: true };
      group.add(box);

      // Packing tape strip
      const tapeGeo = new THREE.BoxGeometry(0.22, 2.21, 1.21);
      const tapeMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.4,
      });
      const tape = new THREE.Mesh(tapeGeo, tapeMat);
      group.add(tape);

      // Shipping label on front face
      const labelGeo = new THREE.BoxGeometry(0.4, 0.3, 0.01);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0.2, 0.2, 0.605);
      group.add(label);

      group.userData.isObstacle = true;
      break;
    }

    case 'obstacle_wall': {
      // Barrier slab
      const wallGeo = new THREE.BoxGeometry(3.2, 2.4, 0.35);
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(component.color || '#64748b'),
        roughness: 0.6,
        metalness: 0.15,
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData = { isObstacle: true };
      group.add(wall);

      // Support feet
      const footGeo = new THREE.BoxGeometry(0.35, 0.16, 0.9);
      const footMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const foot1 = new THREE.Mesh(footGeo, footMat);
      foot1.position.set(-1.1, -1.12, 0);
      foot1.castShadow = true;
      group.add(foot1);

      const foot2 = new THREE.Mesh(footGeo, footMat);
      foot2.position.set(1.1, -1.12, 0);
      foot2.castShadow = true;
      group.add(foot2);

      // Top hazard / caution bar
      const hazardGeo = new THREE.BoxGeometry(3.22, 0.22, 0.37);
      const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
      const hazard = new THREE.Mesh(hazardGeo, hazardMat);
      hazard.position.set(0, 1.1, 0);
      group.add(hazard);

      group.userData.isObstacle = true;
      break;
    }

    case 'line_sensor': {
      // TCRT5000 IR Reflectance Sensor Module
      // 1. Blue PCB Board Base
      const pcbGeo = new THREE.BoxGeometry(0.38, 0.05, 0.65);
      const pcbMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(component.color || '#1d4ed8'),
        roughness: 0.35,
        metalness: 0.1,
      });
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      pcb.receiveShadow = true;
      group.add(pcb);

      // 2. Underside Optical Sensor Casing (pointing downward toward floor)
      const opticsGeo = new THREE.BoxGeometry(0.24, 0.12, 0.22);
      const opticsMat = darkMaterial;
      const optics = new THREE.Mesh(opticsGeo, opticsMat);
      optics.position.set(0, -0.08, 0.12);
      optics.castShadow = true;
      group.add(optics);

      // IR Emitter LED (Clear / Bluish bulb)
      const emitterGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12);
      const emitterMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });
      const emitter = new THREE.Mesh(emitterGeo, emitterMat);
      emitter.position.set(-0.06, -0.14, 0.12);
      group.add(emitter);

      // IR Phototransistor Receiver (Black tinted bulb)
      const receiverGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12);
      const receiverMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.2,
      });
      const receiver = new THREE.Mesh(receiverGeo, receiverMat);
      receiver.position.set(0.06, -0.14, 0.12);
      group.add(receiver);

      // Central optical barrier to prevent direct cross-talk
      const baffleGeo = new THREE.BoxGeometry(0.015, 0.08, 0.18);
      const baffleMat = darkMaterial;
      const baffle = new THREE.Mesh(baffleGeo, baffleMat);
      baffle.position.set(0, -0.13, 0.12);
      group.add(baffle);

      // 3. Topside Electronics & Calibration Trimmer
      const potBodyGeo = new THREE.BoxGeometry(0.11, 0.07, 0.11);
      const potBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
      const potBody = new THREE.Mesh(potBodyGeo, potBodyMat);
      potBody.position.set(0, 0.06, -0.05);
      group.add(potBody);

      const screwGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8);
      const screw = new THREE.Mesh(screwGeo, metalMaterial);
      screw.position.set(0, 0.10, -0.05);
      group.add(screw);

      // Green Power Indicator LED
      const pwrLedGeo = new THREE.BoxGeometry(0.03, 0.02, 0.04);
      const pwrLedMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.8,
      });
      const pwrLed = new THREE.Mesh(pwrLedGeo, pwrLedMat);
      pwrLed.position.set(-0.1, 0.035, -0.05);
      group.add(pwrLed);

      // Red Digital Output (DO) Detection LED (Dynamic on line detection)
      const outLedGeo = new THREE.BoxGeometry(0.03, 0.02, 0.04);
      const outLedMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.0,
      });
      const outLed = new THREE.Mesh(outLedGeo, outLedMat);
      outLed.position.set(0.1, 0.035, -0.05);
      group.add(outLed);

      // 4. Rear 4-Pin Connection Header (VCC, GND, DO, AO)
      const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8);
      const pinX = [-0.15, -0.05, 0.05, 0.15];
      pinX.forEach((px) => {
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.rotation.x = Math.PI / 2;
        pin.position.set(px, 0.05, -0.28);
        group.add(pin);
      });

      // Save dynamic indicator material for runtime updates
      group.userData.lineSensorLedMat = outLedMat;
      break;
    }
  }

  // Apply initial transforms
  group.position.set(component.position.x, component.position.y, component.position.z);
  group.rotation.set(
    THREE.MathUtils.degToRad(component.rotation.x),
    THREE.MathUtils.degToRad(component.rotation.y),
    THREE.MathUtils.degToRad(component.rotation.z)
  );
  group.scale.set(component.scale.x, component.scale.y, component.scale.z);

  return group;
}
