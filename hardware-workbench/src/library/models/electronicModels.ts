import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 2: Electronic Component Three.js 3D Models Factory
// ============================================================================

const RESISTOR_COLOR_CODES: Record<number, { bands: number[]; multiplier: number }> = {
  100: { bands: [1, 0], multiplier: 1 },       // Brown, Black, Brown, Gold
  220: { bands: [2, 2], multiplier: 1 },       // Red, Red, Brown, Gold
  330: { bands: [3, 3], multiplier: 1 },       // Orange, Orange, Brown, Gold
  470: { bands: [4, 7], multiplier: 1 },       // Yellow, Violet, Brown, Gold
  1000: { bands: [1, 0], multiplier: 2 },      // Brown, Black, Red, Gold
  2200: { bands: [2, 2], multiplier: 2 },      // Red, Red, Red, Gold
  4700: { bands: [4, 7], multiplier: 2 },      // Yellow, Violet, Red, Gold
  10000: { bands: [1, 0], multiplier: 3 },     // Brown, Black, Orange, Gold
  47000: { bands: [4, 7], multiplier: 3 },     // Yellow, Violet, Orange, Gold
  100000: { bands: [1, 0], multiplier: 4 },    // Brown, Black, Yellow, Gold
  1000000: { bands: [1, 0], multiplier: 5 },   // Brown, Black, Green, Gold
};

const DIGIT_COLORS: number[] = [
  0x000000, // 0 Black
  0x78350f, // 1 Brown
  0xef4444, // 2 Red
  0xf97316, // 3 Orange
  0xeab308, // 4 Yellow
  0x22c55e, // 5 Green
  0x3b82f6, // 6 Blue
  0xa855f7, // 7 Violet
  0x64748b, // 8 Gray
  0xffffff, // 9 White
];

const GOLD_TOLERANCE = 0xd97706; // 5% Gold band

/**
 * Builds high-fidelity 3D meshes for all Phase 2 electronic components
 */
export function buildElectronicMesh(
  component: Component3D,
  _baseMaterial: THREE.MeshStandardMaterial,
  darkMaterial: THREE.MeshStandardMaterial,
  metalMaterial: THREE.MeshStandardMaterial,
  whiteMaterial: THREE.MeshStandardMaterial
): THREE.Group {
  const group = new THREE.Group();

  switch (component.type) {
    // ------------------------------------------------------------------------
    // 1. Fixed Resistor (Axial 1/4W with Color Bands)
    // ------------------------------------------------------------------------
    case 'resistor_fixed': {
      const resistance = component.metadata?.resistance || 220;
      const code = RESISTOR_COLOR_CODES[resistance] || { bands: [2, 2], multiplier: 1 };

      // Resistor beige body
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.6 });
      const bodyGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.set(0, 0.08, 0);
      group.add(body);

      // Rounded end caps
      const capGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const capLeft = new THREE.Mesh(capGeo, bodyMat);
      capLeft.position.set(-0.11, 0.08, 0);
      group.add(capLeft);
      const capRight = new THREE.Mesh(capGeo, bodyMat);
      capRight.position.set(0.11, 0.08, 0);
      group.add(capRight);

      // Color bands
      const bandPositions = [-0.07, -0.02, 0.03, 0.08];
      const bandColors = [
        DIGIT_COLORS[code.bands[0]],
        DIGIT_COLORS[code.bands[1]],
        DIGIT_COLORS[code.multiplier],
        GOLD_TOLERANCE,
      ];

      bandPositions.forEach((posX, idx) => {
        const bandMat = new THREE.MeshBasicMaterial({ color: bandColors[idx] });
        const bandGeo = new THREE.CylinderGeometry(0.047, 0.047, 0.02, 16);
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.z = Math.PI / 2;
        band.position.set(posX, 0.08, 0);
        group.add(band);
      });

      // Axial metal wire leads
      const leadGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8);
      const leadLeft = new THREE.Mesh(leadGeo, metalMaterial);
      leadLeft.rotation.z = Math.PI / 2;
      leadLeft.position.set(-0.21, 0.08, 0);
      group.add(leadLeft);

      const leadRight = new THREE.Mesh(leadGeo, metalMaterial);
      leadRight.rotation.z = Math.PI / 2;
      leadRight.position.set(0.21, 0.08, 0);
      group.add(leadRight);
      break;
    }

    // ------------------------------------------------------------------------
    // 2. Variable Resistor / Trimpot
    // ------------------------------------------------------------------------
    case 'resistor_variable': {
      // Blue cermet cube body
      const potBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
      const potBodyGeo = new THREE.BoxGeometry(0.2, 0.16, 0.12);
      const potBody = new THREE.Mesh(potBodyGeo, potBodyMat);
      potBody.position.set(0, 0.12, 0);
      group.add(potBody);

      // Top brass adjustment screw disc
      const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
      const screwMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(0, 0.21, 0);
      group.add(screw);

      // Screw slot indentation
      const slotGeo = new THREE.BoxGeometry(0.06, 0.015, 0.012);
      const slot = new THREE.Mesh(slotGeo, darkMaterial);
      slot.position.set(0, 0.22, 0);
      group.add(slot);

      // 3 pins underneath
      const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8);
      [-0.06, 0, 0.06].forEach((px, i) => {
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, 0.02, i === 1 ? 0.03 : -0.03);
        group.add(pin);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 3. Rotary Potentiometer
    // ------------------------------------------------------------------------
    case 'potentiometer_rotary': {
      // Cylindrical metal case
      const caseGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 20);
      const potCase = new THREE.Mesh(caseGeo, metalMaterial);
      potCase.position.set(0, 0.09, 0);
      group.add(potCase);

      // Threaded mounting bushing
      const bushGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16);
      const bush = new THREE.Mesh(bushGeo, metalMaterial);
      bush.position.set(0, 0.18, 0);
      group.add(bush);

      // Rotating shaft
      const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 16);
      const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(0, 0.28, 0);

      // Rotate shaft based on wiper percent if configured
      const wiperRatio = (component.metadata?.wiperPercent ?? 50) / 100;
      shaft.rotation.y = (wiperRatio - 0.5) * Math.PI * 1.5;
      group.add(shaft);

      // Pointer notch on top of shaft
      const notchGeo = new THREE.BoxGeometry(0.012, 0.03, 0.04);
      const notch = new THREE.Mesh(notchGeo, darkMaterial);
      notch.position.set(0, 0.35, 0.02);
      group.add(notch);

      // 3 Terminal lugs at the base
      [-0.1, 0, 0.1].forEach((px) => {
        const lugGeo = new THREE.BoxGeometry(0.02, 0.08, 0.06);
        const lug = new THREE.Mesh(lugGeo, metalMaterial);
        lug.position.set(px, 0.04, -0.15);
        group.add(lug);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 4. Ceramic Capacitor (Non-Polarized Disc)
    // ------------------------------------------------------------------------
    case 'capacitor_ceramic': {
      // Orange/tan circular disc body
      const discMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.7 });
      const discGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.025, 20);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(0, 0.14, 0);
      group.add(disc);

      // Printed value code text indicator (small dark dot)
      const markGeo = new THREE.BoxGeometry(0.05, 0.02, 0.005);
      const mark = new THREE.Mesh(markGeo, darkMaterial);
      mark.position.set(0, 0.14, 0.015);
      group.add(mark);

      // Two downward parallel leads
      const leadGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8);
      [-0.03, 0.03].forEach((px) => {
        const lead = new THREE.Mesh(leadGeo, metalMaterial);
        lead.position.set(px, 0.04, 0);
        group.add(lead);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 5. Electrolytic Capacitor (Polarized Cylinder with Vent and Stripe)
    // ------------------------------------------------------------------------
    case 'capacitor_electrolytic': {
      // Cylindrical aluminum body with blue vinyl sleeve
      const canMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
      const canGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.22, 20);
      const can = new THREE.Mesh(canGeo, canMat);
      can.position.set(0, 0.15, 0);
      group.add(can);

      // Silver aluminum top disc
      const topGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.01, 20);
      const top = new THREE.Mesh(topGeo, metalMaterial);
      top.position.set(0, 0.26, 0);
      group.add(top);

      // Top pressure relief vent cross score
      const ventGeo = new THREE.BoxGeometry(0.08, 0.005, 0.012);
      const vent1 = new THREE.Mesh(ventGeo, darkMaterial);
      vent1.position.set(0, 0.266, 0);
      group.add(vent1);
      const vent2 = new THREE.Mesh(ventGeo, darkMaterial);
      vent2.rotation.y = Math.PI / 2;
      vent2.position.set(0, 0.266, 0);
      group.add(vent2);

      // Negative polarity vertical stripe with '-' markings
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 });
      const stripeGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.21, 8, 1, false, 0, Math.PI / 3);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.15, 0);
      group.add(stripe);

      // Two downward leads (longer positive anode, shorter negative cathode)
      const leadPosGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8);
      const leadPos = new THREE.Mesh(leadPosGeo, metalMaterial);
      leadPos.position.set(-0.035, 0.01, 0);
      group.add(leadPos);

      const leadNegGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.10, 8);
      const leadNeg = new THREE.Mesh(leadNegGeo, metalMaterial);
      leadNeg.position.set(0.035, 0.03, 0);
      group.add(leadNeg);
      break;
    }

    // ------------------------------------------------------------------------
    // 6. Inductor (Ferrite Toroid with Copper Winding)
    // ------------------------------------------------------------------------
    case 'inductor': {
      // Toroidal magnetic ring core
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const coreGeo = new THREE.TorusGeometry(0.08, 0.035, 12, 24);
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.x = Math.PI / 2;
      core.position.set(0, 0.12, 0);
      group.add(core);

      // Enameled copper wire coil turns
      const wireMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const coilGeo = new THREE.TorusGeometry(0.042, 0.01, 8, 16);
        const coil = new THREE.Mesh(coilGeo, wireMat);
        coil.position.set(Math.cos(a) * 0.08, 0.12, Math.sin(a) * 0.08);
        coil.rotation.y = a + Math.PI / 2;
        group.add(coil);
      }

      // Two terminal leads extending outward
      const leadGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.18, 8);
      const leadA = new THREE.Mesh(leadGeo, wireMat);
      leadA.rotation.z = Math.PI / 2;
      leadA.position.set(-0.16, 0.08, 0);
      group.add(leadA);

      const leadB = new THREE.Mesh(leadGeo, wireMat);
      leadB.rotation.z = Math.PI / 2;
      leadB.position.set(0.16, 0.08, 0);
      group.add(leadB);
      break;
    }

    // ------------------------------------------------------------------------
    // 7. Crystal Oscillator (HC-49/S Metal Can)
    // ------------------------------------------------------------------------
    case 'crystal_oscillator': {
      // Rounded oval metal canister
      const canMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
      const canGeo = new THREE.BoxGeometry(0.16, 0.08, 0.06);
      const can = new THREE.Mesh(canGeo, canMat);
      can.position.set(0, 0.12, 0);
      group.add(can);

      // Cylindrical rounded ends
      const endGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12);
      const end1 = new THREE.Mesh(endGeo, canMat);
      end1.position.set(-0.08, 0.12, 0);
      group.add(end1);
      const end2 = new THREE.Mesh(endGeo, canMat);
      end2.position.set(0.08, 0.12, 0);
      group.add(end2);

      // Top frequency stamp line
      const stampGeo = new THREE.BoxGeometry(0.08, 0.005, 0.015);
      const stamp = new THREE.Mesh(stampGeo, darkMaterial);
      stamp.position.set(0, 0.163, 0);
      group.add(stamp);

      // Two downward pins
      const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8);
      [-0.04, 0.04].forEach((px) => {
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, 0.02, 0);
        group.add(pin);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 8. Diodes (Rectifier, Zener, Schottky)
    // ------------------------------------------------------------------------
    case 'diode_rectifier':
    case 'diode_zener':
    case 'diode_schottky': {
      const isZener = component.type === 'diode_zener';
      const isSchottky = component.type === 'diode_schottky';

      // Body material
      const bodyMat = isZener
        ? new THREE.MeshStandardMaterial({ color: 0xdc2626, transparent: true, opacity: 0.75, roughness: 0.2 })
        : darkMaterial;

      const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 16);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.set(0, 0.08, 0);
      group.add(body);

      // Cathode ring band (silver for rectifier/schottky, dark for glass zener)
      const bandColor = isZener ? 0x0f172a : isSchottky ? 0xeab308 : 0xd1d5db;
      const bandMat = new THREE.MeshBasicMaterial({ color: bandColor });
      const bandGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.025, 16);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.set(0.06, 0.08, 0); // Positioned near cathode terminal
      group.add(band);

      // Axial metal leads
      const leadGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8);
      const leadA = new THREE.Mesh(leadGeo, metalMaterial);
      leadA.rotation.z = Math.PI / 2;
      leadA.position.set(-0.18, 0.08, 0);
      group.add(leadA);

      const leadK = new THREE.Mesh(leadGeo, metalMaterial);
      leadK.rotation.z = Math.PI / 2;
      leadK.position.set(0.18, 0.08, 0);
      group.add(leadK);
      break;
    }

    // ------------------------------------------------------------------------
    // 9. LEDs (Red, Green, Blue, Yellow, White, Infrared, RGB)
    // ------------------------------------------------------------------------
    case 'led_red':
    case 'led_green':
    case 'led_blue':
    case 'led_yellow':
    case 'led_white':
    case 'led_ir':
    case 'led_rgb': {
      const isRgb = component.type === 'led_rgb';
      const isIr = component.type === 'led_ir';

      let ledColor = 0xef4444; // Default red
      if (component.type === 'led_green') ledColor = 0x22c55e;
      else if (component.type === 'led_blue') ledColor = 0x3b82f6;
      else if (component.type === 'led_yellow') ledColor = 0xeab308;
      else if (component.type === 'led_white') ledColor = 0xf8fafc;
      else if (isIr) ledColor = 0x312e81; // Deep dark infrared smoke
      else if (isRgb) ledColor = 0xf1f5f9; // Frosted white lens

      // LED Dome (Cylinder + Hemisphere)
      const domeMat = new THREE.MeshStandardMaterial({
        color: ledColor,
        emissive: isIr ? 0x000000 : ledColor,
        emissiveIntensity: 0.3,
        roughness: 0.15,
        transparent: true,
        opacity: isIr ? 0.9 : 0.85,
      });

      // Flanged base collar with flat cathode notch
      const collarGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16);
      const collar = new THREE.Mesh(collarGeo, domeMat);
      collar.position.set(0, 0.09, 0);
      group.add(collar);

      // Cylinder lower dome body
      const lowerGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.1, 16);
      const lower = new THREE.Mesh(lowerGeo, domeMat);
      lower.position.set(0, 0.15, 0);
      group.add(lower);

      // Upper dome hemisphere
      const domeGeo = new THREE.SphereGeometry(0.065, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(0, 0.2, 0);
      group.add(dome);

      // Dynamic light emission for simulation runtime
      group.userData.ledMaterial = domeMat;
      if (!isIr) {
        const pointLight = new THREE.PointLight(ledColor, 0, 1.2);
        pointLight.position.set(0, 0.22, 0);
        group.add(pointLight);
        group.userData.ledLight = pointLight;
      }

      // Internal metal leadframe (Anvil and Post die)
      const anvilGeo = new THREE.BoxGeometry(0.03, 0.04, 0.01);
      const anvil = new THREE.Mesh(anvilGeo, metalMaterial);
      anvil.position.set(0.015, 0.16, 0);
      group.add(anvil);

      if (isRgb) {
        // 4 leads underneath RGB LED
        const rgbLeadGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8);
        [-0.045, -0.015, 0.015, 0.045].forEach((px) => {
          const pin = new THREE.Mesh(rgbLeadGeo, metalMaterial);
          pin.position.set(px, 0.03, 0);
          group.add(pin);
        });
      } else {
        // 2 leads (longer anode, shorter cathode)
        const leadAnodeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.14, 8);
        const leadAnode = new THREE.Mesh(leadAnodeGeo, metalMaterial);
        leadAnode.position.set(-0.025, 0.01, 0);
        group.add(leadAnode);

        const leadCathodeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.10, 8);
        const leadCathode = new THREE.Mesh(leadCathodeGeo, metalMaterial);
        leadCathode.position.set(0.025, 0.03, 0);
        group.add(leadCathode);
      }
      break;
    }

    // ------------------------------------------------------------------------
    // 10. Photodiode (Water-Clear Dome with Silicon Chip)
    // ------------------------------------------------------------------------
    case 'photodiode': {
      const clearDomeMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        roughness: 0.1,
        transparent: true,
        opacity: 0.65,
      });

      const collarGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16);
      const collar = new THREE.Mesh(collarGeo, clearDomeMat);
      collar.position.set(0, 0.09, 0);
      group.add(collar);

      const domeGeo = new THREE.SphereGeometry(0.065, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, clearDomeMat);
      dome.position.set(0, 0.15, 0);
      group.add(dome);

      // Dark square silicon sensor chip
      const chipMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const chipGeo = new THREE.BoxGeometry(0.04, 0.015, 0.04);
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(0, 0.14, 0);
      group.add(chip);

      // 2 downward leads
      const leadGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8);
      [-0.025, 0.025].forEach((px) => {
        const lead = new THREE.Mesh(leadGeo, metalMaterial);
        lead.position.set(px, 0.02, 0);
        group.add(lead);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 11. BJT Transistors (TO-92 Package: NPN, PNP)
    // ------------------------------------------------------------------------
    case 'transistor_npn':
    case 'transistor_pnp': {
      // D-shaped TO-92 body (half-cylinder)
      const to92Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16, 1, false, -Math.PI / 2, Math.PI);
      const to92 = new THREE.Mesh(to92Geo, darkMaterial);
      to92.position.set(0, 0.15, 0);
      group.add(to92);

      // Flat front face
      const frontGeo = new THREE.BoxGeometry(0.12, 0.14, 0.01);
      const front = new THREE.Mesh(frontGeo, darkMaterial);
      front.position.set(0, 0.15, 0);
      group.add(front);

      // Stamped model text line (e.g. "2N3904")
      const textGeo = new THREE.BoxGeometry(0.08, 0.015, 0.005);
      const textMesh = new THREE.Mesh(textGeo, whiteMaterial);
      textMesh.position.set(0, 0.16, 0.008);
      group.add(textMesh);

      // 3 leads extending downward (Emitter, Base, Collector)
      const leadGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.14, 8);
      [-0.04, 0, 0.04].forEach((px) => {
        const lead = new THREE.Mesh(leadGeo, metalMaterial);
        lead.position.set(px, 0.01, 0);
        group.add(lead);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 12. Power MOSFETs (TO-220 Package with Metal Heatsink Tab)
    // ------------------------------------------------------------------------
    case 'mosfet_n_channel':
    case 'mosfet_p_channel': {
      // Black plastic molding body
      const to220BodyGeo = new THREE.BoxGeometry(0.16, 0.14, 0.065);
      const to220Body = new THREE.Mesh(to220BodyGeo, darkMaterial);
      to220Body.position.set(0, 0.15, 0.01);
      group.add(to220Body);

      // Metal heatsink tab on back
      const tabGeo = new THREE.BoxGeometry(0.16, 0.24, 0.02);
      const tab = new THREE.Mesh(tabGeo, metalMaterial);
      tab.position.set(0, 0.20, -0.025);
      group.add(tab);

      // Mounting screw hole in tab
      const holeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.025, 12);
      const hole = new THREE.Mesh(holeGeo, darkMaterial);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(0, 0.26, -0.025);
      group.add(hole);

      // 3 heavy power leads (Gate, Drain, Source)
      const leadGeo = new THREE.BoxGeometry(0.012, 0.14, 0.01);
      [-0.05, 0, 0.05].forEach((px) => {
        const lead = new THREE.Mesh(leadGeo, metalMaterial);
        lead.position.set(px, 0.01, 0);
        group.add(lead);
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 13. Switches (Tactile, Toggle, Slide, DIP)
    // ------------------------------------------------------------------------
    case 'switch_tactile': {
      // 6x6mm Square body
      const swBodyGeo = new THREE.BoxGeometry(0.14, 0.07, 0.14);
      const swBody = new THREE.Mesh(swBodyGeo, darkMaterial);
      swBody.position.set(0, 0.09, 0);
      group.add(swBody);

      // Metallic top retaining cover plate
      const plateGeo = new THREE.BoxGeometry(0.142, 0.01, 0.142);
      const plate = new THREE.Mesh(plateGeo, metalMaterial);
      plate.position.set(0, 0.125, 0);
      group.add(plate);

      // Round center button plunger
      const btnMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const isPressed = component.metadata?.switchClosed;
      const btnGeo = new THREE.CylinderGeometry(0.045, 0.045, isPressed ? 0.03 : 0.06, 16);
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(0, isPressed ? 0.135 : 0.155, 0);
      group.add(btn);

      // 4 gull-wing/through-hole pins
      const pinGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.08, 8);
      [
        [-0.08, -0.05],
        [0.08, -0.05],
        [-0.08, 0.05],
        [0.08, 0.05],
      ].forEach(([px, pz]) => {
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, 0.02, pz);
        group.add(pin);
      });
      break;
    }

    case 'switch_toggle': {
      // Blue body box
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 });
      const boxGeo = new THREE.BoxGeometry(0.14, 0.12, 0.16);
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(0, 0.10, 0);
      group.add(box);

      // Metal threaded collar
      const collarGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
      const collar = new THREE.Mesh(collarGeo, metalMaterial);
      collar.position.set(0, 0.18, 0);
      group.add(collar);

      // Bat toggle lever
      const batGeo = new THREE.CylinderGeometry(0.025, 0.018, 0.18, 12);
      const bat = new THREE.Mesh(batGeo, metalMaterial);
      const isFlipped = component.metadata?.switchClosed;
      bat.rotation.z = isFlipped ? 0.35 : -0.35;
      bat.position.set(isFlipped ? 0.03 : -0.03, 0.28, 0);
      group.add(bat);

      // 3 solder terminals underneath
      [-0.05, 0, 0.05].forEach((px) => {
        const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8);
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, 0.01, 0);
        group.add(pin);
      });
      break;
    }

    case 'switch_slide': {
      // Silver metal frame body
      const slideBodyGeo = new THREE.BoxGeometry(0.16, 0.07, 0.09);
      const slideBody = new THREE.Mesh(slideBodyGeo, metalMaterial);
      slideBody.position.set(0, 0.09, 0);
      group.add(slideBody);

      // Sliding black knob actuator
      const isRight = component.metadata?.switchClosed;
      const knobGeo = new THREE.BoxGeometry(0.03, 0.05, 0.04);
      const knob = new THREE.Mesh(knobGeo, darkMaterial);
      knob.position.set(isRight ? 0.04 : -0.04, 0.14, 0);
      group.add(knob);

      // 3 pins underneath
      [-0.05, 0, 0.05].forEach((px) => {
        const pinGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.08, 8);
        const pin = new THREE.Mesh(pinGeo, metalMaterial);
        pin.position.set(px, 0.02, 0);
        group.add(pin);
      });
      break;
    }

    case 'switch_dip': {
      // Red 4-position DIP switch body
      const dipBodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
      const dipBodyGeo = new THREE.BoxGeometry(0.24, 0.08, 0.18);
      const dipBody = new THREE.Mesh(dipBodyGeo, dipBodyMat);
      dipBody.position.set(0, 0.09, 0);
      group.add(dipBody);

      // 4 white rocker levers
      const rockerMat = whiteMaterial;
      const dipStates = component.metadata?.dipPositions || [false, false, false, false];
      [-0.075, -0.025, 0.025, 0.075].forEach((px, i) => {
        const rockerGeo = new THREE.BoxGeometry(0.03, 0.025, 0.04);
        const rocker = new THREE.Mesh(rockerGeo, rockerMat);
        const isOn = dipStates[i];
        rocker.position.set(px, 0.13, isOn ? 0.03 : -0.03);
        group.add(rocker);
      });

      // 8 pins underneath (dual row)
      [-0.075, -0.025, 0.025, 0.075].forEach((px) => {
        [-0.06, 0.06].forEach((pz) => {
          const pinGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.08, 8);
          const pin = new THREE.Mesh(pinGeo, metalMaterial);
          pin.position.set(px, 0.02, pz);
          group.add(pin);
        });
      });
      break;
    }

    // ------------------------------------------------------------------------
    // 14. Protection Component: Glass Cartridge Fuse
    // ------------------------------------------------------------------------
    case 'fuse': {
      // Transparent glass cylinder tube
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
      });
      const glassGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 16);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.rotation.z = Math.PI / 2;
      glass.position.set(0, 0.08, 0);
      group.add(glass);

      // Silver metal ferrule end caps
      const ferruleGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.05, 16);
      const capA = new THREE.Mesh(ferruleGeo, metalMaterial);
      capA.rotation.z = Math.PI / 2;
      capA.position.set(-0.11, 0.08, 0);
      group.add(capA);

      const capB = new THREE.Mesh(ferruleGeo, metalMaterial);
      capB.rotation.z = Math.PI / 2;
      capB.position.set(0.11, 0.08, 0);
      group.add(capB);

      // Internal fuse wire (straight wire if intact; broken/dark mark if blown)
      const isBlown = component.metadata?.fuseBlown;
      if (!isBlown) {
        const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.18, 8);
        const wire = new THREE.Mesh(wireGeo, metalMaterial);
        wire.rotation.z = Math.PI / 2;
        wire.position.set(0, 0.08, 0);
        group.add(wire);
      } else {
        // Blown fuse: melted broken stubs and dark scorch mark
        const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8);
        const stub1 = new THREE.Mesh(wireGeo, darkMaterial);
        stub1.rotation.z = Math.PI / 2;
        stub1.position.set(-0.06, 0.08, 0);
        group.add(stub1);

        const stub2 = new THREE.Mesh(wireGeo, darkMaterial);
        stub2.rotation.z = Math.PI / 2;
        stub2.position.set(0.06, 0.08, 0);
        group.add(stub2);

        // Dark scorch blob
        const scorchGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const scorch = new THREE.Mesh(scorchGeo, darkMaterial);
        scorch.position.set(0, 0.08, 0);
        group.add(scorch);
      }
      break;
    }

    // ------------------------------------------------------------------------
    // 15. Integrated Circuits (Generic DIP, OpAmp, Logic Gate, Optocoupler)
    // ------------------------------------------------------------------------
    case 'ic_dip_generic':
    case 'ic_opamp':
    case 'ic_logic_gate':
    case 'ic_optocoupler': {
      let pinCount = 8;
      let label = 'IC';

      if (component.type === 'ic_opamp') {
        pinCount = 8;
        label = 'LM358';
      } else if (component.type === 'ic_logic_gate') {
        pinCount = 14;
        label = '74HC00';
      } else if (component.type === 'ic_optocoupler') {
        pinCount = 4;
        label = 'PC817';
      } else {
        // Generic DIP IC
        pinCount = component.metadata?.icPinCount || 16;
        label = `DIP-${pinCount}`;
      }

      const half = pinCount / 2;
      const xPitch = 0.065;
      const bodyWidth = Math.max(0.18, half * xPitch + 0.06);

      // Black epoxy rectangular IC body with beveled top edges
      const icBodyGeo = new THREE.BoxGeometry(bodyWidth, 0.08, 0.18);
      const icBody = new THREE.Mesh(icBodyGeo, darkMaterial);
      icBody.position.set(0, 0.09, 0);
      group.add(icBody);

      // Pin-1 semicircular notch on the left end
      const notchGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.082, 12, 1, false, 0, Math.PI);
      const notch = new THREE.Mesh(notchGeo, darkMaterial);
      notch.rotation.y = Math.PI / 2;
      notch.position.set(-bodyWidth / 2, 0.09, 0);
      group.add(notch);

      // Pin-1 index dot indentation
      const dotGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 12);
      const dot = new THREE.Mesh(dotGeo, metalMaterial);
      dot.position.set(-bodyWidth / 2 + 0.035, 0.132, -0.05);
      group.add(dot);

      // Stamped IC label
      const textGeo = new THREE.BoxGeometry(Math.min(bodyWidth * 0.6, 0.15), 0.005, 0.035);
      const textMesh = new THREE.Mesh(textGeo, whiteMaterial);
      textMesh.name = `ic_label_${label}`;
      textMesh.position.set(0.01, 0.132, 0);
      group.add(textMesh);

      // Dual row of metal legs
      const xStart = -((half - 1) * xPitch) / 2;
      for (let i = 0; i < half; i++) {
        const px = xStart + i * xPitch;
        // Front pin leg (Side 1)
        const pin1Geo = new THREE.BoxGeometry(0.01, 0.08, 0.02);
        const pin1 = new THREE.Mesh(pin1Geo, metalMaterial);
        pin1.position.set(px, 0.04, -0.095);
        group.add(pin1);

        // Rear pin leg (Side 2)
        const pin2Geo = new THREE.BoxGeometry(0.01, 0.08, 0.02);
        const pin2 = new THREE.Mesh(pin2Geo, metalMaterial);
        pin2.position.set(px, 0.04, 0.095);
        group.add(pin2);
      }
      break;
    }

    default:
      break;
  }

  return group;
}
