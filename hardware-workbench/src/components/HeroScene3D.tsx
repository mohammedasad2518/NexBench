import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroScene3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background to blend with dark hero

    // Camera Setup
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(3.8, 3.2, 5.2);
    camera.lookAt(0, 0.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Group for entire assembly (for subtle parallax / sway)
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Perspective Technical Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    worldGroup.add(gridHelper);

    // Subtle dark radial pedestal beneath components
    const pedestalGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0c121d,
      roughness: 0.8,
      metalness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.05;
    pedestal.receiveShadow = true;
    worldGroup.add(pedestal);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Cyan / Teal Rim Light (gives signature BenchTwin technical aesthetic)
    const cyanRim = new THREE.DirectionalLight(0x0ea5e9, 2.8);
    cyanRim.position.set(-6, 4, -4);
    scene.add(cyanRim);

    // Emerald fill light
    const emeraldFill = new THREE.PointLight(0x10b981, 1.5, 6);
    emeraldFill.position.set(0, 1.2, 1.5);
    scene.add(emeraldFill);

    // 3. Materials
    const breadboardWhite = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.05,
    });
    const pcbGreen = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.35,
      metalness: 0.25,
    });
    const chipBlack = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3,
    });
    const metalSilver = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.25,
      metalness: 0.85,
    });
    const copperGold = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8,
    });

    // 4. White Breadboard Base
    const bbGroup = new THREE.Group();
    bbGroup.position.set(0.6, 0.1, -0.2);

    const bbBodyGeo = new THREE.BoxGeometry(3.6, 0.22, 2.0);
    const bbBody = new THREE.Mesh(bbBodyGeo, breadboardWhite);
    bbBody.castShadow = true;
    bbBody.receiveShadow = true;
    bbGroup.add(bbBody);

    // Breadboard center divider groove
    const grooveGeo = new THREE.BoxGeometry(3.4, 0.04, 0.12);
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const groove = new THREE.Mesh(grooveGeo, grooveMat);
    groove.position.set(0, 0.11, 0);
    bbGroup.add(groove);

    // Breadboard Power Rails (Red and Blue stripes)
    const redStripeGeo = new THREE.BoxGeometry(3.4, 0.01, 0.04);
    const redStripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const redStripeTop = new THREE.Mesh(redStripeGeo, redStripeMat);
    redStripeTop.position.set(0, 0.115, -0.85);
    bbGroup.add(redStripeTop);

    const blueStripeGeo = new THREE.BoxGeometry(3.4, 0.01, 0.04);
    const blueStripeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const blueStripeTop = new THREE.Mesh(blueStripeGeo, blueStripeMat);
    blueStripeTop.position.set(0, 0.115, -0.76);
    bbGroup.add(blueStripeTop);

    const redStripeBot = new THREE.Mesh(redStripeGeo, redStripeMat);
    redStripeBot.position.set(0, 0.115, 0.76);
    bbGroup.add(redStripeBot);

    const blueStripeBot = new THREE.Mesh(blueStripeGeo, blueStripeMat);
    blueStripeBot.position.set(0, 0.115, 0.85);
    bbGroup.add(blueStripeBot);

    // Tie-point contact dots (represented via grid holes)
    const holeGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    for (let x = -1.5; x <= 1.5; x += 0.25) {
      for (const z of [-0.65, -0.45, -0.25, 0.25, 0.45, 0.65]) {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(x, 0.115, z);
        bbGroup.add(hole);
      }
    }
    worldGroup.add(bbGroup);

    // 5. Arduino Uno Microcontroller (adjacent to breadboard)
    const unoGroup = new THREE.Group();
    unoGroup.position.set(-1.6, 0.12, 0.2);
    unoGroup.rotation.y = 0.15;

    // Uno PCB
    const unoPcbGeo = new THREE.BoxGeometry(2.3, 0.1, 1.7);
    const unoPcb = new THREE.Mesh(unoPcbGeo, pcbGreen);
    unoPcb.castShadow = true;
    unoPcb.receiveShadow = true;
    unoGroup.add(unoPcb);

    // ATmega328P DIP IC
    const icGeo = new THREE.BoxGeometry(1.1, 0.12, 0.35);
    const icMesh = new THREE.Mesh(icGeo, chipBlack);
    icMesh.position.set(0.15, 0.08, 0.1);
    icMesh.castShadow = true;
    unoGroup.add(icMesh);

    // IC metal pins
    for (let px = -0.45; px <= 0.45; px += 0.15) {
      const pinG = new THREE.BoxGeometry(0.04, 0.08, 0.45);
      const pinM = new THREE.Mesh(pinG, metalSilver);
      pinM.position.set(0.15 + px, 0.04, 0.1);
      unoGroup.add(pinM);
    }

    // USB Type-B Port
    const usbGeo = new THREE.BoxGeometry(0.55, 0.36, 0.48);
    const usb = new THREE.Mesh(usbGeo, metalSilver);
    usb.position.set(-1.0, 0.2, -0.42);
    usb.castShadow = true;
    unoGroup.add(usb);

    // Barrel Power Jack
    const jackGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.55, 16);
    jackGeo.rotateZ(Math.PI / 2);
    const jack = new THREE.Mesh(jackGeo, chipBlack);
    jack.position.set(-1.0, 0.18, 0.45);
    jack.castShadow = true;
    unoGroup.add(jack);

    // Female Headers
    const headerGeo = new THREE.BoxGeometry(1.6, 0.24, 0.12);
    const hTop = new THREE.Mesh(headerGeo, chipBlack);
    hTop.position.set(0.2, 0.14, -0.74);
    unoGroup.add(hTop);

    const hBot = new THREE.Mesh(headerGeo, chipBlack);
    hBot.position.set(0.2, 0.14, 0.74);
    unoGroup.add(hBot);

    // Crystal Oscillator
    const crystalGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
    crystalGeo.rotateZ(Math.PI / 2);
    const crystal = new THREE.Mesh(crystalGeo, metalSilver);
    crystal.position.set(-0.35, 0.1, -0.2);
    unoGroup.add(crystal);

    // Reset Button
    const rstBaseGeo = new THREE.BoxGeometry(0.18, 0.1, 0.18);
    const rstBase = new THREE.Mesh(rstBaseGeo, metalSilver);
    rstBase.position.set(-0.85, 0.1, -0.65);
    unoGroup.add(rstBase);
    const rstBtnGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12);
    const rstBtn = new THREE.Mesh(rstBtnGeo, new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    rstBtn.position.set(-0.85, 0.16, -0.65);
    unoGroup.add(rstBtn);

    worldGroup.add(unoGroup);

    // 6. Ultrasonic Sensor (HC-SR04) plugged on breadboard
    const sonarGroup = new THREE.Group();
    sonarGroup.position.set(1.4, 0.45, -0.3);
    sonarGroup.rotation.y = -0.25;

    // Blue PCB
    const sonarPcbGeo = new THREE.BoxGeometry(0.08, 0.7, 1.4);
    const sonarPcbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const sonarPcb = new THREE.Mesh(sonarPcbGeo, sonarPcbMat);
    sonarPcb.castShadow = true;
    sonarGroup.add(sonarPcb);

    // Transducer Cans
    const barrelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.35, 24);
    barrelGeo.rotateZ(Math.PI / 2);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
    
    const canLeft = new THREE.Mesh(barrelGeo, canMat);
    canLeft.position.set(0.2, 0.08, -0.38);
    canLeft.castShadow = true;
    sonarGroup.add(canLeft);

    const canRight = new THREE.Mesh(barrelGeo, canMat);
    canRight.position.set(0.2, 0.08, 0.38);
    canRight.castShadow = true;
    sonarGroup.add(canRight);

    // Transducer wire meshes
    const meshGeo = new THREE.CircleGeometry(0.24, 16);
    meshGeo.rotateY(Math.PI / 2);
    const meshMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });
    const meshL = new THREE.Mesh(meshGeo, meshMat);
    meshL.position.set(0.38, 0.08, -0.38);
    sonarGroup.add(meshL);
    const meshR = new THREE.Mesh(meshGeo, meshMat);
    meshR.position.set(0.38, 0.08, 0.38);
    sonarGroup.add(meshR);

    // Sonar pins going into breadboard
    for (const pz of [-0.15, -0.05, 0.05, 0.15]) {
      const pinG = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
      const pinM = new THREE.Mesh(pinG, copperGold);
      pinM.position.set(0, -0.42, pz);
      sonarGroup.add(pinM);
    }
    worldGroup.add(sonarGroup);

    // 7. Micro Servo with animated horn
    const servoGroup = new THREE.Group();
    servoGroup.position.set(-0.2, 0.35, 1.2);
    servoGroup.rotation.y = 0.4;

    const servoBodyGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
    const servoBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const servoBody = new THREE.Mesh(servoBodyGeo, servoBodyMat);
    servoBody.castShadow = true;
    servoGroup.add(servoBody);

    const servoTowerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.22, 16);
    const servoTower = new THREE.Mesh(servoTowerGeo, servoBodyMat);
    servoTower.position.set(0.1, 0.42, 0);
    servoGroup.add(servoTower);

    const hornGeo = new THREE.BoxGeometry(0.65, 0.05, 0.14);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0.1, 0.54, 0);
    horn.castShadow = true;
    servoGroup.add(horn);

    worldGroup.add(servoGroup);

    // 8. Glowing LEDs on Breadboard
    const createLed = (color: number, x: number, z: number, isPulsing = false) => {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(x, 0.28, z);

      const domeGeo = new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const cylGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16);
      cylGeo.translate(0, -0.09, 0);

      const ledMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: isPulsing ? 0.9 : 0.4,
        roughness: 0.15,
        transparent: true,
        opacity: 0.9,
      });

      const dome = new THREE.Mesh(domeGeo, ledMat);
      const cyl = new THREE.Mesh(cylGeo, ledMat);
      ledGroup.add(dome);
      ledGroup.add(cyl);

      if (isPulsing) {
        const pLight = new THREE.PointLight(color, 1.8, 2.5);
        pLight.position.set(0, 0.1, 0);
        ledGroup.add(pLight);
      }

      // Metal lead legs
      const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8);
      const leg1 = new THREE.Mesh(legGeo, metalSilver);
      leg1.position.set(-0.04, -0.24, 0);
      ledGroup.add(leg1);
      const leg2 = new THREE.Mesh(legGeo, metalSilver);
      leg2.position.set(0.04, -0.24, 0);
      ledGroup.add(leg2);

      worldGroup.add(ledGroup);
      return { ledGroup, ledMat };
    };

    const ledCyan = createLed(0x06b6d4, 0.2, -0.45, true);
    createLed(0x10b981, 0.55, -0.45, false);
    createLed(0xf59e0b, 0.9, -0.45, false);

    // 9. Curved Jumper Wires connecting Arduino to Breadboard
    const createJumperWire = (
      start: THREE.Vector3,
      mid: THREE.Vector3,
      end: THREE.Vector3,
      color: number
    ) => {
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.022, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.1,
      });
      const wireMesh = new THREE.Mesh(tubeGeo, tubeMat);
      wireMesh.castShadow = true;
      worldGroup.add(wireMesh);
    };

    // Jumper 1: Red power wire (+5V)
    createJumperWire(
      new THREE.Vector3(-1.3, 0.35, 0.9),
      new THREE.Vector3(-0.3, 1.1, 0.3),
      new THREE.Vector3(0.5, 0.24, 0.56),
      0xef4444
    );

    // Jumper 2: Black ground wire (GND)
    createJumperWire(
      new THREE.Vector3(-1.1, 0.35, 0.9),
      new THREE.Vector3(-0.1, 1.25, 0.65),
      new THREE.Vector3(0.75, 0.24, 0.65),
      0x0f172a
    );

    // Jumper 3: Cyan signal wire (Pin 9 -> Servo)
    createJumperWire(
      new THREE.Vector3(-1.2, 0.35, -0.5),
      new THREE.Vector3(-0.8, 1.0, 0.4),
      new THREE.Vector3(-0.25, 0.32, 1.1),
      0x06b6d4
    );

    // Jumper 4: Yellow PWM wire (Pin 5 -> LED)
    createJumperWire(
      new THREE.Vector3(-1.0, 0.35, -0.5),
      new THREE.Vector3(-0.4, 0.95, -0.8),
      new THREE.Vector3(0.2, 0.24, -0.45),
      0xf59e0b
    );

    // Jumper 5: Emerald trigger wire (Pin 11 -> Ultrasonic)
    createJumperWire(
      new THREE.Vector3(-0.8, 0.35, -0.5),
      new THREE.Vector3(0.3, 1.2, -0.9),
      new THREE.Vector3(1.4, 0.24, -0.35),
      0x10b981
    );

    // 10. Mouse Interaction & Subtle Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 3.8;
    let targetCameraY = 3.2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Subtle camera parallax based on mouse
        targetCameraX = 3.8 + mouseX * 0.45;
        targetCameraY = 3.2 + mouseY * 0.35;
        camera.position.x += (targetCameraX - camera.position.x) * 0.04;
        camera.position.y += (targetCameraY - camera.position.y) * 0.04;
        camera.lookAt(0, 0.25, 0);

        // Gentle idle assembly drift
        worldGroup.rotation.y = Math.sin(elapsedTime * 0.35) * 0.04;

        // Subtle servo horn oscillation
        horn.rotation.y = Math.sin(elapsedTime * 1.8) * 0.65;

        // Pulsing cyan LED
        const pulse = (Math.sin(elapsedTime * 3.5) + 1.0) * 0.5;
        ledCyan.ledMat.emissiveIntensity = 0.4 + pulse * 1.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="hero-3d-viewport-container" 
      aria-label="Interactive 3D Virtual Electronics Workbench"
    />
  );
};
