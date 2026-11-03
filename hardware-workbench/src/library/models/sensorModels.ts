import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 3: Environmental & Measurement Sensors Three.js 3D Procedural Models
// ============================================================================

export function buildSensorMesh(
  component: Component3D,
  _baseMaterial: THREE.MeshStandardMaterial,
  darkMaterial: THREE.MeshStandardMaterial,
  metalMaterial: THREE.MeshStandardMaterial,
  whiteMaterial: THREE.MeshStandardMaterial
): THREE.Group {
  const group = new THREE.Group();

  // Reusable materials
  const pcbBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.1 });
  const pcbPurpleMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.35, metalness: 0.1 });
  const pcbDeepRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.1 });
  const pcbBlackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
  const sensorMetalLidMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
  const meshCapMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.85, wireframe: false });
  const heaterGlowMat = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff2200, emissiveIntensity: 0.8 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, metalness: 0.8 });
  const ledGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.5 });
  const ledRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.5 });
  const trimpotBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
  const brassScrewMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.7 });

  const compType = component.type;

  switch (compType) {
    // ------------------------------------------------------------------------
    // 1. Temperature & Humidity Sensors
    // ------------------------------------------------------------------------
    case 'sensor_dht11': {
      // DHT11: Characteristic blue slotted rectangular housing (15.5mm x 12mm x 5.5mm)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
      const bodyGeo = new THREE.BoxGeometry(0.32, 0.4, 0.12);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.05;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Louvers / Grill slots on front face
      const grillMat = darkMaterial;
      for (let i = 0; i < 4; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.015), grillMat);
        slot.position.set(0, 0.14 - i * 0.06, 0.06);
        group.add(slot);
      }

      // "DHT11" label plate on top
      const labelMat = whiteMaterial;
      const labelPlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.005), labelMat);
      labelPlate.position.set(0, -0.1, 0.062);
      group.add(labelPlate);

      // 4 leads at bottom (2.54mm pitch)
      const leadX = [-0.15, -0.05, 0.05, 0.15];
      for (const lx of leadX) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(lx, -0.22, 0);
        group.add(pin);
      }
      break;
    }

    case 'sensor_dht22': {
      // DHT22: Precision white slotted housing (taller: 15mm x 20mm x 7.7mm)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const bodyGeo = new THREE.BoxGeometry(0.34, 0.46, 0.14);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.06;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Horizontal slotted grid
      const slotMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.6 });
      for (let i = 0; i < 5; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.015), slotMat);
        slot.position.set(0, 0.18 - i * 0.06, 0.07);
        group.add(slot);
      }

      // 4 tinned leads
      const leadX = [-0.15, -0.05, 0.05, 0.15];
      for (const lx of leadX) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 8), metalMaterial);
        pin.position.set(lx, -0.26, 0);
        group.add(pin);
      }
      break;
    }

    case 'sensor_ds18b20': {
      const isProbe = component.metadata?.ds18b20Package === 'waterproof_probe';
      if (isProbe) {
        // Stainless steel cylindrical waterproof tube (diameter 6mm, length 30mm)
        const tubeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16);
        const tubeMesh = new THREE.Mesh(tubeGeo, sensorMetalLidMat);
        tubeMesh.position.y = 0.1;
        group.add(tubeMesh);

        // Black heatshrink strain relief
        const shrinkGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.12, 16);
        const shrinkMesh = new THREE.Mesh(shrinkGeo, darkMaterial);
        shrinkMesh.position.y = -0.12;
        group.add(shrinkMesh);

        // 3 wire leads (GND, DQ, VDD)
        const colors = [0x1e293b, 0xeab308, 0xef4444];
        [-0.04, 0, 0.04].forEach((x, idx) => {
          const wireMat = new THREE.MeshStandardMaterial({ color: colors[idx], roughness: 0.5 });
          const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 8), wireMat);
          wire.position.set(x, -0.22, 0);
          group.add(wire);
        });
      } else {
        // Standard TO-92 black epoxy package
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16, 1, false, 0, Math.PI);
        const bodyMesh = new THREE.Mesh(bodyGeo, darkMaterial);
        bodyMesh.position.y = 0.02;
        bodyMesh.rotation.y = Math.PI / 2;
        group.add(bodyMesh);

        const flatGeo = new THREE.BoxGeometry(0.16, 0.14, 0.02);
        const flatMesh = new THREE.Mesh(flatGeo, darkMaterial);
        flatMesh.position.set(0, 0.02, 0.01);
        group.add(flatMesh);

        // 3 pins (GND, DQ, VDD)
        [-0.1, 0, 0.1].forEach((x) => {
          const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), metalMaterial);
          pin.position.set(x, -0.16, 0);
          group.add(pin);
        });
      }
      break;
    }

    case 'sensor_lm35': {
      // TO-92 plastic transistor-style package with silver markings
      const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 16, 1, false, 0, Math.PI);
      const bodyMesh = new THREE.Mesh(bodyGeo, darkMaterial);
      bodyMesh.position.y = 0.02;
      bodyMesh.rotation.y = Math.PI / 2;
      group.add(bodyMesh);

      const flatGeo = new THREE.BoxGeometry(0.16, 0.14, 0.02);
      const flatMesh = new THREE.Mesh(flatGeo, darkMaterial);
      flatMesh.position.set(0, 0.02, 0.01);
      group.add(flatMesh);

      // LM35 text laser plate
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.004), whiteMaterial);
      mark.position.set(0, 0.02, 0.02);
      group.add(mark);

      // 3 pins (VS, VOUT, GND)
      [-0.1, 0, 0.1].forEach((x) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), metalMaterial);
        pin.position.set(x, -0.16, 0);
        group.add(pin);
      });
      break;
    }

    case 'sensor_ntc_thermistor': {
      // Dark green epoxy-coated disc/bead
      const beadMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 });
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), beadMat);
      bead.scale.set(1, 1.2, 0.7);
      bead.position.y = 0.06;
      group.add(bead);

      // 2 leads extending downward
      [-0.08, 0.08].forEach((x) => {
        const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), copperMat);
        lead.position.set(x, -0.14, 0);
        group.add(lead);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 2. Pressure & Weather Sensors (BMP / BME Series)
    // ------------------------------------------------------------------------
    case 'sensor_bmp180': {
      // Blue breakout PCB (14mm x 12mm x 1.6mm)
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.03), pcbBlueMat);
      group.add(pcb);

      // BMP180 metallic sensor module with vent hole
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.04), sensorMetalLidMat);
      lid.position.set(0, 0.04, 0.025);
      group.add(lid);

      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.045, 8), darkMaterial);
      vent.rotation.x = Math.PI / 2;
      vent.position.set(0.02, 0.04, 0.025);
      group.add(vent);

      // 4 gold-plated header pins at bottom
      const pinX = [-0.15, -0.05, 0.05, 0.15];
      for (const px of pinX) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8), goldMat);
        pin.position.set(px, -0.15, 0);
        group.add(pin);
      }
      break;
    }

    case 'sensor_bmp280':
    case 'sensor_bme280': {
      // Purple breakout PCB (15mm x 12mm x 1.6mm)
      const pcbMat = compType === 'sensor_bme280' ? pcbPurpleMat : new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.35 });
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.03), pcbMat);
      group.add(pcb);

      // Bosch metal lid (LGA package)
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), sensorMetalLidMat);
      lid.position.set(0, 0.05, 0.022);
      group.add(lid);

      // Small vent hole
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.035, 8), darkMaterial);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(-0.02, 0.05, 0.022);
      group.add(hole);

      // 6 header pin pads along bottom
      const pinX = [-0.25, -0.15, -0.05, 0.05, 0.15, 0.25];
      for (const px of pinX) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.035, 8), goldMat);
        pad.rotation.x = Math.PI / 2;
        pad.position.set(px, -0.12, 0);
        group.add(pad);

        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 8), metalMaterial);
        pin.position.set(px, -0.16, 0);
        group.add(pin);
      }
      break;
    }

    // ------------------------------------------------------------------------
    // 3. Gas & Air Quality Sensors (MQ Series)
    // ------------------------------------------------------------------------
    case 'sensor_mq2':
    case 'sensor_mq3':
    case 'sensor_mq4':
    case 'sensor_mq7':
    case 'sensor_mq135': {
      // Blue base carrier PCB (32mm x 22mm x 1.6mm)
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.04), pcbBlueMat);
      group.add(pcb);

      // Circular stainless steel mesh sensor dome (diameter ~18mm, height 12mm)
      const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24), sensorMetalLidMat);
      domeBase.rotation.x = Math.PI / 2;
      domeBase.position.set(0, 0.08, 0.05);
      group.add(domeBase);

      const domeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 24), meshCapMat);
      domeCap.rotation.x = Math.PI / 2;
      domeCap.position.set(0, 0.08, 0.14);
      group.add(domeCap);

      // Internal heater coil (glows red/orange if active)
      const isHeaterActive = component.metadata?.heaterActive ?? true;
      const heaterCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.1, 12),
        isHeaterActive ? heaterGlowMat : darkMaterial
      );
      heaterCore.rotation.x = Math.PI / 2;
      heaterCore.position.set(0, 0.08, 0.14);
      group.add(heaterCore);

      // Onboard LM393 IC
      const ic = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.03), darkMaterial);
      ic.position.set(-0.14, -0.12, 0.03);
      group.add(ic);

      // Blue potentiometer with brass tuning screw
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), trimpotBlueMat);
      pot.position.set(0.12, -0.12, 0.045);
      group.add(pot);

      const potScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), brassScrewMat);
      potScrew.rotation.x = Math.PI / 2;
      potScrew.position.set(0.12, -0.12, 0.088);
      group.add(potScrew);

      // LEDs: Power (Green), Digital Alarm (Red)
      const ledPwr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), ledGreenMat);
      ledPwr.position.set(-0.06, -0.22, 0.025);
      group.add(ledPwr);

      const ledAlarm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), ledRedMat);
      ledAlarm.position.set(0.06, -0.22, 0.025);
      group.add(ledAlarm);

      // 4 header pins at bottom (VCC, GND, DO, AO)
      const mqPins = [-0.15, -0.05, 0.05, 0.15];
      for (const px of mqPins) {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.32, 0);
        group.add(pin);
      }
      break;
    }

    // ------------------------------------------------------------------------
    // 4. Soil & Water Sensors
    // ------------------------------------------------------------------------
    case 'sensor_soil_moisture': {
      // 2-Prong soil fork PCB: top head with circuitry, two long immersion tines
      const headPcb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.03), pcbBlueMat);
      headPcb.position.y = 0.18;
      group.add(headPcb);

      // 2 immersion prongs with gold-plated pads
      [-0.1, 0.1].forEach((px) => {
        const prong = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.025), pcbBlueMat);
        prong.position.set(px, -0.15, 0);
        group.add(prong);

        // Gold conductive surface trace
        const goldTrace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.005), goldMat);
        goldTrace.position.set(px, -0.15, 0.014);
        group.add(goldTrace);
      });

      // Comparator chip and sensitivity pot on head
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), trimpotBlueMat);
      pot.position.set(0, 0.22, 0.04);
      group.add(pot);

      // 4 pins at bottom of head
      [-0.15, -0.05, 0.05, 0.15].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.35, 0);
        group.add(pin);
      });
      break;
    }

    case 'sensor_rain': {
      // Serpentine raindrop sensing board (50mm x 40mm)
      const rainBoard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.03), pcbBlueMat);
      rainBoard.position.y = 0.08;
      group.add(rainBoard);

      // Interdigitated nickel serpentine tracks
      for (let i = -4; i <= 4; i++) {
        const track = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.016, 0.005), sensorMetalLidMat);
        track.position.set(0, 0.08 + i * 0.04, 0.016);
        group.add(track);
      }

      // Companion LM393 module pins
      [-0.15, -0.05, 0.05, 0.15].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.3, 0);
        group.add(pin);
      });
      break;
    }

    case 'sensor_water_level': {
      // Submersible red immersion board with parallel copper traces
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.025), pcbDeepRedMat);
      group.add(board);

      // Parallel copper immersion lines (10 vertical lines)
      for (let i = -4; i <= 4; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.004), copperMat);
        line.position.set(i * 0.028, 0.02, 0.014);
        group.add(line);
      }

      // Top header with 3 pins (SIG, VCC, GND)
      [-0.1, 0, 0.1].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.35, 0);
        group.add(pin);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 5. Light, UV & Sound Sensors
    // ------------------------------------------------------------------------
    case 'sensor_ldr': {
      // 5mm CdS photoresistor disc
      const discMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16), discMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.y = 0.06;
      group.add(disc);

      // Serpentine cadmium sulfide track on front
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x431407, roughness: 0.6 });
      for (let i = -2; i <= 2; i++) {
        const sline = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.005), trackMat);
        sline.position.set(0, 0.06 + i * 0.02, 0.017);
        group.add(sline);
      }

      // 2 leads
      [-0.08, 0.08].forEach((x) => {
        const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), copperMat);
        lead.position.set(x, -0.12, 0);
        group.add(lead);
      });
      break;
    }

    case 'sensor_uv': {
      // Blue PCB with GUVA-S12SD photodiode window
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.03), pcbBlueMat);
      group.add(pcb);

      // GaN photodiode package (black with clear optical window)
      const ic = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), darkMaterial);
      ic.position.set(0, 0.04, 0.02);
      group.add(ic);

      const glassWindow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.7, roughness: 0.1 })
      );
      glassWindow.rotation.x = Math.PI / 2;
      glassWindow.position.set(0, 0.04, 0.036);
      group.add(glassWindow);

      // 3 pins (VCC, GND, OUT)
      [-0.1, 0, 0.1].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.15, 0);
        group.add(pin);
      });
      break;
    }

    case 'sensor_sound': {
      // Black PCB with silver electret microphone can
      const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.03), pcbBlackMat);
      group.add(pcb);

      // Cylindrical electret microphone capsule
      const micCan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 20), sensorMetalLidMat);
      micCan.rotation.x = Math.PI / 2;
      micCan.position.set(-0.12, 0.02, 0.08);
      group.add(micCan);

      // Black acoustic felt aperture
      const felt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), darkMaterial);
      felt.rotation.x = Math.PI / 2;
      felt.position.set(-0.12, 0.02, 0.155);
      group.add(felt);

      // Blue tuning potentiometer
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), trimpotBlueMat);
      pot.position.set(0.1, 0.04, 0.04);
      group.add(pot);

      // 4 pins (VCC, GND, DO, AO)
      [-0.15, -0.05, 0.05, 0.15].forEach((px) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 8), metalMaterial);
        pin.position.set(px, -0.25, 0);
        group.add(pin);
      });
      break;
    }

    default: {
      // Fallback generic sensor block
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), pcbBlueMat);
      box.castShadow = true;
      group.add(box);
      break;
    }
  }

  return group;
}
