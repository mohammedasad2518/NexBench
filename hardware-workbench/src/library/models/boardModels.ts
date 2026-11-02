import * as THREE from 'three';
import type { Component3D } from '../../types/workbench';

// ============================================================================
// Phase 1 3D Model Generation: 11 Distinct Development Board Meshes
// ============================================================================

export function buildBoardMesh(
  component: Component3D,
  _baseMaterial: THREE.Material,
  darkMaterial: THREE.Material,
  metalMaterial: THREE.Material,
  whiteMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = component.id;

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.8,
  });

  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.4,
  });

  const chipMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.7,
    metalness: 0.1,
  });

  const headerMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });

  switch (component.type) {
    // 1. Arduino Uno
    case 'arduino': {
      // Emerald / Arduino teal-green PCB
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(2.4, 0.08, 1.8);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // Microcontroller chip (DIP-28 ATmega328P)
      const icGeo = new THREE.BoxGeometry(1.0, 0.1, 0.35);
      const ic = new THREE.Mesh(icGeo, chipMaterial);
      ic.position.set(0.1, 0.08, 0.2);
      group.add(ic);

      // USB Type-B Port connector
      const usbGeo = new THREE.BoxGeometry(0.55, 0.35, 0.45);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.05, 0.18, -0.45);
      group.add(usb);

      // DC Barrel Jack (Black cylinder with metal inner barrel)
      const dcGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 16);
      dcGeo.rotateZ(Math.PI / 2);
      const dc = new THREE.Mesh(dcGeo, darkMaterial);
      dc.position.set(-1.05, 0.16, 0.45);
      group.add(dc);

      // Header strips (Top Digital D0-D13, Bottom Power & Analog A0-A5)
      const headerGeo = new THREE.BoxGeometry(1.8, 0.22, 0.14);
      const headerTop = new THREE.Mesh(headerGeo, headerMaterial);
      headerTop.position.set(0.15, 0.12, -0.78);
      group.add(headerTop);

      const headerBottom = new THREE.Mesh(headerGeo, headerMaterial);
      headerBottom.position.set(0.15, 0.12, 0.78);
      group.add(headerBottom);

      // 16MHz Crystal Oscillator (oval metal can)
      const xtalGeo = new THREE.BoxGeometry(0.25, 0.1, 0.14);
      const xtal = new THREE.Mesh(xtalGeo, metalMaterial);
      xtal.position.set(-0.35, 0.08, -0.3);
      group.add(xtal);

      // Reset Push Button (Red button on silver collar)
      const btnBaseGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
      const btnBase = new THREE.Mesh(btnBaseGeo, metalMaterial);
      btnBase.position.set(-0.95, 0.08, -0.75);
      group.add(btnBase);
      const btnCapGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12);
      const btnCap = new THREE.Mesh(btnCapGeo, redMaterial);
      btnCap.position.set(-0.95, 0.16, -0.75);
      group.add(btnCap);

      // 4 Mounting holes
      const holeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
      const holeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      [
        [-0.9, 0, 0.75],
        [0.9, 0, 0.75],
        [-0.9, 0, -0.75],
        [0.9, 0, -0.65],
      ].forEach(([hx, hy, hz]) => {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(hx, hy, hz);
        group.add(hole);
      });
      break;
    }

    // 2. Arduino Mega 2560 (Extended length with dense digital block)
    case 'arduino_mega': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(3.6, 0.08, 1.8);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // ATmega2560 QFP-100 Large square IC rotated 45 degrees
      const qfpGeo = new THREE.BoxGeometry(0.65, 0.09, 0.65);
      const qfp = new THREE.Mesh(qfpGeo, chipMaterial);
      qfp.rotation.y = Math.PI / 4;
      qfp.position.set(-0.2, 0.08, 0.1);
      group.add(qfp);

      // USB and DC Jack
      const usbGeo = new THREE.BoxGeometry(0.55, 0.35, 0.45);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.6, 0.18, -0.45);
      group.add(usb);

      const dcGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 16);
      dcGeo.rotateZ(Math.PI / 2);
      const dc = new THREE.Mesh(dcGeo, darkMaterial);
      dc.position.set(-1.6, 0.16, 0.45);
      group.add(dc);

      // Side header strips
      const headerSideGeo = new THREE.BoxGeometry(2.0, 0.22, 0.14);
      const hTop = new THREE.Mesh(headerSideGeo, headerMaterial);
      hTop.position.set(-0.2, 0.12, -0.78);
      group.add(hTop);

      const hBot = new THREE.Mesh(headerSideGeo, headerMaterial);
      hBot.position.set(-0.2, 0.12, 0.78);
      group.add(hBot);

      // Mega Dual-Row Extended Rear Header Block (D14-D53)
      const megaRearHeaderGeo = new THREE.BoxGeometry(1.2, 0.22, 0.32);
      const megaRear = new THREE.Mesh(megaRearHeaderGeo, headerMaterial);
      megaRear.position.set(1.1, 0.12, 0.0);
      group.add(megaRear);
      break;
    }

    // 3. Arduino Nano (Compact DIP with Mini-USB)
    case 'arduino_nano': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const pcbGeo = new THREE.BoxGeometry(1.6, 0.08, 0.7);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // TQFP-32 Square IC
      const qfpGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
      const qfp = new THREE.Mesh(qfpGeo, chipMaterial);
      qfp.rotation.y = Math.PI / 4;
      qfp.position.set(0.1, 0.07, 0);
      group.add(qfp);

      // Mini-USB socket
      const usbGeo = new THREE.BoxGeometry(0.35, 0.2, 0.3);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-0.72, 0.12, 0);
      group.add(usb);

      // Dual 15-pin header strips on sides
      const nanoHeaderGeo = new THREE.BoxGeometry(1.4, 0.2, 0.1);
      const nh1 = new THREE.Mesh(nanoHeaderGeo, headerMaterial);
      nh1.position.set(0, 0.11, -0.3);
      group.add(nh1);

      const nh2 = new THREE.Mesh(nanoHeaderGeo, headerMaterial);
      nh2.position.set(0, 0.11, 0.3);
      group.add(nh2);

      // Center Reset Button
      const rstGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
      const rst = new THREE.Mesh(rstGeo, whiteMaterial);
      rst.position.set(-0.35, 0.08, 0);
      group.add(rst);
      break;
    }

    // 4. Arduino Leonardo (Micro-USB and ATmega32u4)
    case 'arduino_leonardo': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(2.4, 0.08, 1.8);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // ATmega32u4 Square QFP IC
      const chipGeo = new THREE.BoxGeometry(0.55, 0.08, 0.55);
      const chip = new THREE.Mesh(chipGeo, chipMaterial);
      chip.rotation.y = Math.PI / 4;
      chip.position.set(0.15, 0.07, 0.1);
      group.add(chip);

      // Micro-USB connector
      const usbGeo = new THREE.BoxGeometry(0.35, 0.16, 0.3);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.1, 0.12, -0.45);
      group.add(usb);

      // DC Barrel Jack
      const dcGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 16);
      dcGeo.rotateZ(Math.PI / 2);
      const dc = new THREE.Mesh(dcGeo, darkMaterial);
      dc.position.set(-1.05, 0.16, 0.45);
      group.add(dc);

      // Side headers
      const headerGeo = new THREE.BoxGeometry(1.8, 0.22, 0.14);
      const headerTop = new THREE.Mesh(headerGeo, headerMaterial);
      headerTop.position.set(0.15, 0.12, -0.78);
      group.add(headerTop);

      const headerBottom = new THREE.Mesh(headerGeo, headerMaterial);
      headerBottom.position.set(0.15, 0.12, 0.78);
      group.add(headerBottom);
      break;
    }

    // 5. ESP8266 NodeMCU V2 (Metal RF can shield & serpentine antenna)
    case 'esp8266_nodemcu': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const pcbGeo = new THREE.BoxGeometry(2.0, 0.08, 1.1);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // Silver metal RF shielding can (ESP-12E module)
      const canGeo = new THREE.BoxGeometry(0.85, 0.12, 0.65);
      const can = new THREE.Mesh(canGeo, metalMaterial);
      can.position.set(0.15, 0.09, 0);
      group.add(can);

      // Serpentine PCB copper antenna trace at end
      const antGeo = new THREE.BoxGeometry(0.35, 0.06, 0.6);
      const ant = new THREE.Mesh(antGeo, goldMaterial);
      ant.position.set(0.78, 0.06, 0);
      group.add(ant);

      // Micro-USB connector
      const usbGeo = new THREE.BoxGeometry(0.3, 0.14, 0.25);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-0.95, 0.1, 0);
      group.add(usb);

      // 2x15 Headers on sides
      const headerGeo = new THREE.BoxGeometry(1.8, 0.2, 0.1);
      const hLeft = new THREE.Mesh(headerGeo, headerMaterial);
      hLeft.position.set(0, 0.11, -0.48);
      group.add(hLeft);

      const hRight = new THREE.Mesh(headerGeo, headerMaterial);
      hRight.position.set(0, 0.11, 0.48);
      group.add(hRight);

      // FLASH & RST miniature buttons
      const btn1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), metalMaterial);
      btn1.position.set(-0.7, 0.07, -0.3);
      group.add(btn1);
      const btn2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), metalMaterial);
      btn2.position.set(-0.7, 0.07, 0.3);
      group.add(btn2);
      break;
    }

    // 6. ESP32 DevKit V1 (ESP-WROOM-32 metal shield & copper antenna)
    case 'esp32_devkit': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
      const pcbGeo = new THREE.BoxGeometry(2.1, 0.08, 1.15);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // ESP-WROOM-32 Metal RF can
      const canGeo = new THREE.BoxGeometry(0.9, 0.14, 0.75);
      const can = new THREE.Mesh(canGeo, metalMaterial);
      can.position.set(0.2, 0.1, 0);
      group.add(can);

      // Distinct serpentine meandered inverted-F antenna
      const antGeo = new THREE.BoxGeometry(0.35, 0.06, 0.7);
      const ant = new THREE.Mesh(antGeo, goldMaterial);
      ant.position.set(0.85, 0.06, 0);
      group.add(ant);

      // Micro-USB Port
      const usbGeo = new THREE.BoxGeometry(0.3, 0.14, 0.25);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.0, 0.1, 0);
      group.add(usb);

      // Dual header rows
      const headerGeo = new THREE.BoxGeometry(1.9, 0.2, 0.1);
      const hLeft = new THREE.Mesh(headerGeo, headerMaterial);
      hLeft.position.set(0, 0.11, -0.5);
      group.add(hLeft);

      const hRight = new THREE.Mesh(headerGeo, headerMaterial);
      hRight.position.set(0, 0.11, 0.5);
      group.add(hRight);

      // EN and BOOT tactile buttons
      const btnMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), btnMat);
      b1.position.set(-0.75, 0.08, -0.35);
      group.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), btnMat);
      b2.position.set(-0.75, 0.08, 0.35);
      group.add(b2);
      break;
    }

    // 7. ESP32-CAM (with OV2640 Camera Lens module)
    case 'esp32_cam': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const pcbGeo = new THREE.BoxGeometry(1.5, 0.08, 1.0);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // OV2640 Camera Sensor Module (Gold rim + black camera barrel + lens)
      const camBaseGeo = new THREE.BoxGeometry(0.45, 0.15, 0.45);
      const camBase = new THREE.Mesh(camBaseGeo, darkMaterial);
      camBase.position.set(0.15, 0.12, 0);
      group.add(camBase);

      const lensGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.15, 20);
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0.15, 0.22, 0);
      group.add(lens);

      // Bright Flash LED
      const flashGeo = new THREE.BoxGeometry(0.15, 0.08, 0.15);
      const flashMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.2 });
      const flash = new THREE.Mesh(flashGeo, flashMat);
      flash.position.set(-0.25, 0.08, 0);
      group.add(flash);

      // MicroSD card metal socket
      const sdGeo = new THREE.BoxGeometry(0.65, 0.08, 0.6);
      const sd = new THREE.Mesh(sdGeo, metalMaterial);
      sd.position.set(0.15, -0.06, 0);
      group.add(sd);

      // Dual side headers
      const headerGeo = new THREE.BoxGeometry(1.3, 0.2, 0.1);
      const h1 = new THREE.Mesh(headerGeo, headerMaterial);
      h1.position.set(0, 0.11, -0.44);
      group.add(h1);
      const h2 = new THREE.Mesh(headerGeo, headerMaterial);
      h2.position.set(0, 0.11, 0.44);
      group.add(h2);
      break;
    }

    // 8. Raspberry Pi Pico (Iconic Green PCB with RP2040 chip)
    case 'raspberry_pi_pico': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(2.1, 0.07, 0.85);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // RP2040 Microcontroller QFN-56
      const rpGeo = new THREE.BoxGeometry(0.35, 0.06, 0.35);
      const rp = new THREE.Mesh(rpGeo, chipMaterial);
      rp.position.set(0.1, 0.06, 0);
      group.add(rp);

      // Micro-USB connector
      const usbGeo = new THREE.BoxGeometry(0.3, 0.14, 0.25);
      const usb = new THREE.Mesh(usbGeo, metalMaterial);
      usb.position.set(-1.0, 0.1, 0);
      group.add(usb);

      // BOOTSEL White Button
      const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
      const btn = new THREE.Mesh(btnGeo, whiteMaterial);
      btn.position.set(-0.4, 0.07, -0.15);
      group.add(btn);

      // Dual 20-pin castellated edges / headers
      const picoHGeo = new THREE.BoxGeometry(1.9, 0.18, 0.08);
      const h1 = new THREE.Mesh(picoHGeo, headerMaterial);
      h1.position.set(0, 0.1, -0.38);
      group.add(h1);

      const h2 = new THREE.Mesh(picoHGeo, headerMaterial);
      h2.position.set(0, 0.1, 0.38);
      group.add(h2);
      break;
    }

    // 9. Raspberry Pi Pico W (Silver Wi-Fi shielding can)
    case 'raspberry_pi_pico_w': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(2.1, 0.07, 0.85);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // RP2040 chip
      const rp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.35), chipMaterial);
      rp.position.set(0.1, 0.06, 0);
      group.add(rp);

      // Silver CYW43439 Wi-Fi metal shielding can with etched antenna
      const canGeo = new THREE.BoxGeometry(0.5, 0.1, 0.4);
      const can = new THREE.Mesh(canGeo, metalMaterial);
      can.position.set(0.7, 0.08, 0);
      group.add(can);

      // Micro-USB connector
      const usb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.25), metalMaterial);
      usb.position.set(-1.0, 0.1, 0);
      group.add(usb);

      // BOOTSEL button
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), whiteMaterial);
      btn.position.set(-0.4, 0.07, -0.15);
      group.add(btn);

      // Side headers
      const picoHGeo = new THREE.BoxGeometry(1.9, 0.18, 0.08);
      const h1 = new THREE.Mesh(picoHGeo, headerMaterial);
      h1.position.set(0, 0.1, -0.38);
      group.add(h1);
      const h2 = new THREE.Mesh(picoHGeo, headerMaterial);
      h2.position.set(0, 0.1, 0.38);
      group.add(h2);
      break;
    }

    // 10. Raspberry Pi 4 Model B (SBC with Ethernet, 4 USB, 2 HDMI, 40-pin GPIO)
    case 'raspberry_pi_4': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(3.2, 0.08, 2.2);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // Broadcom BCM2711 SoC (Silver heatspreader top)
      const bcmGeo = new THREE.BoxGeometry(0.65, 0.08, 0.65);
      const bcmMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
      const bcm = new THREE.Mesh(bcmGeo, bcmMat);
      bcm.position.set(-0.1, 0.08, -0.2);
      group.add(bcm);

      // Metal RJ45 Gigabit Ethernet Jack (at right edge)
      const ethGeo = new THREE.BoxGeometry(0.7, 0.45, 0.55);
      const eth = new THREE.Mesh(ethGeo, metalMaterial);
      eth.position.set(1.4, 0.25, 0.6);
      group.add(eth);

      // 2x Blue USB 3.0 stacked ports
      const usb3Mat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const usb3Geo = new THREE.BoxGeometry(0.7, 0.45, 0.5);
      const usb3 = new THREE.Mesh(usb3Geo, metalMaterial);
      usb3.position.set(1.4, 0.25, -0.05);
      group.add(usb3);
      // Blue plastic insert
      const insert3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), usb3Mat);
      insert3.position.set(1.72, 0.25, -0.05);
      group.add(insert3);

      // 2x Black USB 2.0 stacked ports
      const usb2Geo = new THREE.BoxGeometry(0.7, 0.45, 0.5);
      const usb2 = new THREE.Mesh(usb2Geo, metalMaterial);
      usb2.position.set(1.4, 0.25, -0.65);
      group.add(usb2);

      // Dual Micro-HDMI ports at bottom edge
      const hdmi1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.25), metalMaterial);
      hdmi1.position.set(-0.3, 0.1, 1.05);
      group.add(hdmi1);
      const hdmi2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.25), metalMaterial);
      hdmi2.position.set(0.3, 0.1, 1.05);
      group.add(hdmi2);

      // USB-C Power Jack
      const usbc = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.28), metalMaterial);
      usbc.position.set(-1.1, 0.1, 1.05);
      group.add(usbc);

      // 40-Pin GPIO Header (2x20 header block)
      const rpi40Geo = new THREE.BoxGeometry(2.0, 0.22, 0.22);
      const rpi40 = new THREE.Mesh(rpi40Geo, headerMaterial);
      rpi40.position.set(-0.35, 0.14, -0.95);
      group.add(rpi40);
      break;
    }

    // 11. STM32 Blue Pill (STM32F103C8T6 with dual yellow BOOT jumpers & crystals)
    case 'stm32_blue_pill': {
      const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
      const pcbGeo = new THREE.BoxGeometry(2.0, 0.08, 0.85);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      pcb.castShadow = true;
      group.add(pcb);

      // STM32F103C8T6 LQFP-48 Square IC
      const stmGeo = new THREE.BoxGeometry(0.4, 0.07, 0.4);
      const stm = new THREE.Mesh(stmGeo, chipMaterial);
      stm.rotation.y = Math.PI / 4;
      stm.position.set(0.05, 0.07, 0);
      group.add(stm);

      // Micro-USB connector
      const usb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.25), metalMaterial);
      usb.position.set(-0.95, 0.1, 0);
      group.add(usb);

      // Dual yellow plastic BOOT0 / BOOT1 jumper blocks
      const yellowJumperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const j1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.18), yellowJumperMat);
      j1.position.set(-0.55, 0.1, -0.15);
      group.add(j1);
      const j2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.18), yellowJumperMat);
      j2.position.set(-0.55, 0.1, 0.15);
      group.add(j2);

      // Cylindrical crystals (8MHz main + 32.768kHz RTC)
      const xtal1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12), metalMaterial);
      xtal1.rotateZ(Math.PI / 2);
      xtal1.position.set(-0.25, 0.08, -0.2);
      group.add(xtal1);

      // Dual 20-pin headers on long edges
      const hGeo = new THREE.BoxGeometry(1.8, 0.2, 0.08);
      const h1 = new THREE.Mesh(hGeo, headerMaterial);
      h1.position.set(0, 0.11, -0.38);
      group.add(h1);
      const h2 = new THREE.Mesh(hGeo, headerMaterial);
      h2.position.set(0, 0.11, 0.38);
      group.add(h2);

      // Red Reset Button
      const rst = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), redMaterial);
      rst.position.set(-0.75, 0.08, 0);
      group.add(rst);
      break;
    }
  }

  return group;
}
