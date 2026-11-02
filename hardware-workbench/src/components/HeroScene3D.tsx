import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HeroScene3DProps {
  activeStep?: number;
  isPaused?: boolean;
}

export const HeroScene3D: React.FC<HeroScene3DProps> = ({ 
  activeStep = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasTimelineRef = useRef<HTMLCanvasElement>(null);
  const [typedCode, setTypedCode] = useState('');

  // Target camera poses for the 6 steps
  const cameraPoses = [
    { pos: new THREE.Vector3(3.8, 3.2, 5.2), target: new THREE.Vector3(0, 0.2, 0) },        // 0: Build (Wide bench)
    { pos: new THREE.Vector3(1.6, 2.2, 3.0), target: new THREE.Vector3(0.4, 0.3, 0.2) },     // 1: Wire (Zoom on breadboard pins)
    { pos: new THREE.Vector3(-1.2, 2.5, 3.4), target: new THREE.Vector3(-0.8, 0.4, 0) },    // 2: Code (Focus on Uno)
    { pos: new THREE.Vector3(1.2, 2.6, 3.8), target: new THREE.Vector3(0.3, 0.5, 0.2) },     // 3: Simulate (Servo radar & LEDs)
    { pos: new THREE.Vector3(0.2, 2.8, 4.0), target: new THREE.Vector3(0, 0.4, 0.4) },       // 4: Design (CAD mounts)
    { pos: new THREE.Vector3(4.5, 3.8, 7.2), target: new THREE.Vector3(0, 0.5, -2.0) },      // 5: Test Bench (Robot field)
  ];

  const currentPose = cameraPoses[activeStep] || cameraPoses[0];

  // Code typing effect when activeStep === 2 (Code)
  useEffect(() => {
    if (activeStep !== 2) {
      setTypedCode('');
      return;
    }

    const fullCode = `// Traffic radar: the lights run on a timer
// while a sensor on a servo finds the car.
#include <Servo.h>
#include <Adafruit_SSD1306.h>
const int RED = 11, YELLOW = 12, GREEN = 13;
const int TRIG = 7, ECHO = 8, BUZZER = 5;
Servo radar;                     // pin 9
Adafruit_SSD1306 oled(128, 64);  // I2C

void loop() {
  // sweep 20° to 160° and back every 5 s
  int a = 90 + 70 * sin(millis() / 795.8);
  radar.write(a);
  plotRadar(a, distance);
}`;

    let charIdx = 0;
    setTypedCode('');
    const timer = setInterval(() => {
      charIdx += 3;
      if (charIdx >= fullCode.length) {
        setTypedCode(fullCode);
        clearInterval(timer);
      } else {
        setTypedCode(fullCode.slice(0, charIdx));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [activeStep]);

  // Live Pin Timeline Waveform Canvas when activeStep === 3 (Simulate)
  useEffect(() => {
    if (activeStep !== 3) return;

    let animId: number;
    const canvas = canvasTimelineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let start = performance.now();

    const drawWaveforms = () => {
      animId = requestAnimationFrame(drawWaveforms);
      const elapsed = (performance.now() - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Dark background with faint grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 20);
        ctx.stroke();
      }

      // Signal traces
      const channels = [
        { name: 'D11', color: '#ef4444', yBase: 26, type: 'pulse', period: 4.0, duty: 0.4 },
        { name: 'D12', color: '#f59e0b', yBase: 54, type: 'pulse', period: 3.0, duty: 0.5 },
        { name: 'D13', color: '#10b981', yBase: 82, type: 'pulse', period: 2.0, duty: 0.6 },
        { name: 'D9',  color: '#06b6d4', yBase: 112, type: 'sine',  period: 5.0, duty: 0.5 },
        { name: 'D5',  color: '#38bdf8', yBase: 142, type: 'train', period: 1.0, duty: 0.3 },
      ];

      channels.forEach((ch) => {
        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(ch.name, 8, ch.yBase + 4);

        // Waveform path
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xStart = 40;
        const xLen = w - 48;

        for (let i = 0; i <= xLen; i += 2) {
          const t = elapsed - (xLen - i) * 0.03;
          let val = 0;

          if (ch.type === 'pulse') {
            const phase = ((t % ch.period) + ch.period) % ch.period;
            val = phase < ch.period * ch.duty ? 1 : 0;
          } else if (ch.type === 'sine') {
            val = (Math.sin(t * (Math.PI * 2 / ch.period)) + 1) * 0.5;
          } else if (ch.type === 'train') {
            const phase = ((t % ch.period) + ch.period) % ch.period;
            val = phase < 0.3 ? (Math.sin(t * 30) > 0 ? 1 : 0) : 0;
          }

          const y = ch.yBase - val * 12;
          if (i === 0) ctx.moveTo(xStart + i, y);
          else ctx.lineTo(xStart + i, y);
        }
        ctx.stroke();
      });

      // Bottom time axis
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('-8 s', 40, h - 6);
      ctx.fillText('-6 s', 40 + (w - 48) * 0.25, h - 6);
      ctx.fillText('-4 s', 40 + (w - 48) * 0.50, h - 6);
      ctx.fillText('-2 s', 40 + (w - 48) * 0.75, h - 6);
      ctx.fillText('now', w - 24, h - 6);
    };

    drawWaveforms();
    return () => cancelAnimationFrame(animId);
  }, [activeStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera Setup
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.copy(currentPose.pos);
    camera.lookAt(currentPose.target);

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

    // OrbitControls for interactive mouse turning
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(currentPose.target);
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // prevent going under floor
    controls.minDistance = 2.0;
    controls.maxDistance = 14.0;

    // Group for entire assembly
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 1. Perspective Technical Grid with Coordinates (numbered axes like BenchTwin)
    const gridHelper = new THREE.GridHelper(18, 36, 0x14b8a6, 0x1e293b);
    gridHelper.position.y = -0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.38;
    worldGroup.add(gridHelper);

    // Numbered Axis Canvas Texture on ground plane
    const axisCanvas = document.createElement('canvas');
    axisCanvas.width = 1024;
    axisCanvas.height = 1024;
    const axisCtx = axisCanvas.getContext('2d');
    if (axisCtx) {
      axisCtx.fillStyle = '#00000000';
      axisCtx.clearRect(0, 0, 1024, 1024);
      axisCtx.fillStyle = 'rgba(20, 184, 166, 0.45)';
      axisCtx.font = '22px monospace';
      axisCtx.textAlign = 'center';
      
      const numbers = [15, 20, 25, 30, 35, 40, 45];
      numbers.forEach((num, i) => {
        const pos = 220 + i * 85;
        axisCtx.fillText(String(num), pos, 512 + 25);
        axisCtx.fillText(String(num), 512 + 25, pos);
      });
    }
    const axisTexture = new THREE.CanvasTexture(axisCanvas);
    const axisPlaneGeo = new THREE.PlaneGeometry(16, 16);
    axisPlaneGeo.rotateX(-Math.PI / 2);
    const axisPlaneMat = new THREE.MeshBasicMaterial({
      map: axisTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const axisPlane = new THREE.Mesh(axisPlaneGeo, axisPlaneMat);
    axisPlane.position.y = 0.005;
    worldGroup.add(axisPlane);

    // Subtle dark radial pedestal beneath components
    const pedestalGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.08, 48);
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
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Cyan / Teal Rim Light
    const cyanRim = new THREE.DirectionalLight(0x14b8a6, 2.8);
    cyanRim.position.set(-6, 4, -4);
    scene.add(cyanRim);

    // Emerald fill light
    const emeraldFill = new THREE.PointLight(0x10b981, 1.8, 6);
    emeraldFill.position.set(0, 1.2, 1.5);
    scene.add(emeraldFill);

    // 3. Materials
    const breadboardWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45, metalness: 0.05 });
    const pcbTeal = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.35, metalness: 0.25 });
    const chipBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.3 });
    const metalSilver = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.85 });
    const bracketOrange = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.1 });

    // 4. White Breadboard Base
    const bbGroup = new THREE.Group();
    bbGroup.position.set(0.6, 0.1, 0.2);

    const bbBodyGeo = new THREE.BoxGeometry(3.6, 0.22, 2.0);
    const bbBody = new THREE.Mesh(bbBodyGeo, breadboardWhite);
    bbBody.castShadow = true;
    bbBody.receiveShadow = true;
    bbGroup.add(bbBody);

    // Center divider groove
    const grooveGeo = new THREE.BoxGeometry(3.4, 0.04, 0.12);
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const groove = new THREE.Mesh(grooveGeo, grooveMat);
    groove.position.set(0, 0.11, 0);
    bbGroup.add(groove);

    // Red and Blue Power Rails
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

    // Tie-point contact dots
    const holeGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    for (let x = -1.5; x <= 1.5; x += 0.25) {
      for (const z of [-0.65, -0.45, -0.25, 0.25, 0.45, 0.65]) {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(x, 0.115, z);
        bbGroup.add(hole);
      }
    }
    worldGroup.add(bbGroup);

    // 5. Arduino Uno Microcontroller (Teal PCB like BenchTwin)
    const unoGroup = new THREE.Group();
    unoGroup.position.set(-1.6, 0.12, 0.2);
    unoGroup.rotation.y = 0.15;

    const unoPcbGeo = new THREE.BoxGeometry(2.3, 0.1, 1.7);
    const unoPcb = new THREE.Mesh(unoPcbGeo, pcbTeal);
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

    // Headers
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

    worldGroup.add(unoGroup);

    // 6. Pan-Tilt 3D Bracket Tower with Micro Servo and Ultrasonic Sensor (BenchTwin Style)
    const panTiltTower = new THREE.Group();
    panTiltTower.position.set(0.2, 0.1, -1.6);

    // Orange 3D Printed Pedestal Base
    const towerBaseGeo = new THREE.BoxGeometry(1.1, 0.16, 1.1);
    const towerBase = new THREE.Mesh(towerBaseGeo, bracketOrange);
    towerBase.position.y = 0.08;
    panTiltTower.add(towerBase);

    // Base Servo Motor (horizontal pan)
    const baseServoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
    const baseServo = new THREE.Mesh(baseServoGeo, chipBlack);
    baseServo.position.set(0, 0.45, 0);
    panTiltTower.add(baseServo);

    // Rotating Pan Bracket
    const panBracketGroup = new THREE.Group();
    panBracketGroup.position.set(0, 0.8, 0);
    panTiltTower.add(panBracketGroup);

    const panArmGeo = new THREE.BoxGeometry(0.85, 0.8, 0.55);
    const panArm = new THREE.Mesh(panArmGeo, bracketOrange);
    panArm.position.y = 0.4;
    panBracketGroup.add(panArm);

    // Ultrasonic Sensor mounted on Pan Head
    const sonarGroup = new THREE.Group();
    sonarGroup.position.set(0, 0.95, 0.28);

    // Blue PCB
    const sonarPcbGeo = new THREE.BoxGeometry(1.4, 0.7, 0.08);
    const sonarPcbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const sonarPcb = new THREE.Mesh(sonarPcbGeo, sonarPcbMat);
    sonarGroup.add(sonarPcb);

    // Dual Silver Transducer Cans
    const barrelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.32, 24);
    barrelGeo.rotateX(Math.PI / 2);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
    
    const canLeft = new THREE.Mesh(barrelGeo, canMat);
    canLeft.position.set(-0.38, 0.08, 0.18);
    sonarGroup.add(canLeft);

    const canRight = new THREE.Mesh(barrelGeo, canMat);
    canRight.position.set(0.38, 0.08, 0.18);
    sonarGroup.add(canRight);

    // Sonar Wave Rings (animated when simulate is active)
    const waveRingGeo = new THREE.RingGeometry(0.2, 0.28, 24);
    const waveRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const waveRings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(waveRingGeo, waveRingMat.clone());
      ring.position.set(0, 0.08, 0.5 + r * 0.4);
      ring.scale.set(1 + r * 0.5, 1 + r * 0.5, 1);
      sonarGroup.add(ring);
      waveRings.push(ring);
    }

    panBracketGroup.add(sonarGroup);
    worldGroup.add(panTiltTower);

    // 7. 0.96" OLED Display Screen on 3D Stand (Showing Live Radar Screen)
    const oledGroup = new THREE.Group();
    oledGroup.position.set(2.5, 0.1, -1.2);
    oledGroup.rotation.y = -0.4;

    // Orange 3D Stand
    const oledStandGeo = new THREE.BoxGeometry(0.9, 0.9, 0.6);
    const oledStand = new THREE.Mesh(oledStandGeo, bracketOrange);
    oledStand.position.set(0, 0.45, 0);
    oledGroup.add(oledStand);

    // OLED Screen Canvas Texture
    const oledCanvas = document.createElement('canvas');
    oledCanvas.width = 256;
    oledCanvas.height = 128;
    const oledCtx = oledCanvas.getContext('2d');
    const oledTexture = new THREE.CanvasTexture(oledCanvas);

    const oledScreenGeo = new THREE.PlaneGeometry(0.75, 0.55);
    const oledScreenMat = new THREE.MeshBasicMaterial({ map: oledTexture });
    const oledScreen = new THREE.Mesh(oledScreenGeo, oledScreenMat);
    oledScreen.position.set(0, 0.5, 0.31);
    oledGroup.add(oledScreen);

    worldGroup.add(oledGroup);

    // 8. LEDs on Breadboard (Red, Yellow, Green)
    const createLed = (color: number, x: number, z: number) => {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(x, 0.28, z);

      const domeGeo = new THREE.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const cylGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16);
      cylGeo.translate(0, -0.08, 0);

      const ledMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });

      ledGroup.add(new THREE.Mesh(domeGeo, ledMat));
      ledGroup.add(new THREE.Mesh(cylGeo, ledMat));

      const pLight = new THREE.PointLight(color, 1.2, 2.0);
      pLight.position.set(0, 0.1, 0);
      ledGroup.add(pLight);

      worldGroup.add(ledGroup);
      return { ledGroup, ledMat, pLight };
    };

    const ledRed = createLed(0xef4444, 0.1, 0.35);
    const ledYellow = createLed(0xf59e0b, 0.45, 0.35);
    const ledGreen = createLed(0x10b981, 0.8, 0.35);

    // Potentiometer Cylinder on Breadboard
    const potGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-0.4, 0.25, 0.35);
    worldGroup.add(pot);

    // 9. Curved Jumper Wires connecting Arduino, Breadboard, Servo, OLED
    const createJumperWire = (start: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3, color: number) => {
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.02, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
      const wireMesh = new THREE.Mesh(tubeGeo, tubeMat);
      wireMesh.castShadow = true;
      worldGroup.add(wireMesh);
    };

    // Jumper 1: Red +5V power rail
    createJumperWire(new THREE.Vector3(-1.3, 0.35, 0.9), new THREE.Vector3(-0.3, 1.1, 0.3), new THREE.Vector3(0.5, 0.24, 0.85), 0xef4444);
    // Jumper 2: Black GND rail
    createJumperWire(new THREE.Vector3(-1.1, 0.35, 0.9), new THREE.Vector3(-0.1, 1.25, 0.65), new THREE.Vector3(0.75, 0.24, 0.95), 0x0f172a);
    // Jumper 3: Signal to Servo Tower
    createJumperWire(new THREE.Vector3(-1.2, 0.35, -0.5), new THREE.Vector3(-0.5, 1.3, -0.8), new THREE.Vector3(0.1, 0.5, -1.4), 0x06b6d4);
    // Jumper 4: Wire to OLED
    createJumperWire(new THREE.Vector3(-1.0, 0.35, -0.5), new THREE.Vector3(0.8, 1.4, -0.9), new THREE.Vector3(2.3, 0.5, -1.1), 0xf59e0b);
    // Jumper 5: LED wires on breadboard
    createJumperWire(new THREE.Vector3(-0.8, 0.35, -0.5), new THREE.Vector3(-0.2, 0.9, 0.1), new THREE.Vector3(0.1, 0.24, 0.15), 0x10b981);
    createJumperWire(new THREE.Vector3(-0.6, 0.35, -0.5), new THREE.Vector3(0.0, 0.85, 0.1), new THREE.Vector3(0.45, 0.24, 0.15), 0xf59e0b);
    createJumperWire(new THREE.Vector3(-0.4, 0.35, -0.5), new THREE.Vector3(0.2, 0.8, 0.1), new THREE.Vector3(0.8, 0.24, 0.15), 0xef4444);

    // 10. 2WD Mobile Robot Car in Background (Competition Arena Field)
    const robotCar = new THREE.Group();
    robotCar.position.set(0, 0.2, -4.8);

    const carChassisGeo = new THREE.BoxGeometry(2.2, 0.2, 1.4);
    const carChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const carChassis = new THREE.Mesh(carChassisGeo, carChassisMat);
    robotCar.add(carChassis);

    // Left and Right Yellow Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const wL = new THREE.Mesh(wheelGeo, wheelMat);
    wL.position.set(-1.2, 0, 0);
    robotCar.add(wL);

    const wR = new THREE.Mesh(wheelGeo, wheelMat);
    wR.position.set(1.2, 0, 0);
    robotCar.add(wR);

    // Front sensor pod
    const podGeo = new THREE.BoxGeometry(0.8, 0.3, 0.4);
    const pod = new THREE.Mesh(podGeo, bracketOrange);
    pod.position.set(0, 0.2, 0.7);
    robotCar.add(pod);

    worldGroup.add(robotCar);

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
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation towards currentPose
      const targetPos = currentPose.pos;
      const targetLook = currentPose.target;

      camera.position.lerp(targetPos, 0.045);
      controls.target.lerp(targetLook, 0.045);
      controls.update();

      // Oscillate servo pan bracket
      const panAngle = Math.sin(elapsedTime * 1.8) * 0.75;
      panBracketGroup.rotation.y = panAngle;

      // Pulse sonar wave rings when active
      waveRings.forEach((ring, idx) => {
        const ringTime = (elapsedTime * 2.2 + idx * 0.33) % 1.0;
        ring.scale.set(0.6 + ringTime * 1.8, 0.6 + ringTime * 1.8, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - ringTime) * 0.8;
      });

      // Update OLED Canvas Texture
      if (oledCtx) {
        oledCtx.fillStyle = '#051923';
        oledCtx.fillRect(0, 0, 256, 128);

        // Header text
        oledCtx.fillStyle = '#38bdf8';
        oledCtx.font = '14px monospace';
        oledCtx.fillText('STOP', 16, 24);
        oledCtx.fillText('0.35s', 180, 24);
        oledCtx.fillStyle = '#64748b';
        oledCtx.font = '10px monospace';
        oledCtx.fillText('CAR: 41CM', 16, 40);
        oledCtx.fillText('105°', 190, 40);

        // Radar arc and sweeping ray
        oledCtx.strokeStyle = '#0284c7';
        oledCtx.lineWidth = 1.5;
        oledCtx.beginPath();
        oledCtx.arc(128, 110, 65, Math.PI, 0);
        oledCtx.stroke();

        const sweepAngle = Math.PI - ((panAngle + 0.75) / 1.5) * Math.PI;
        oledCtx.strokeStyle = '#38bdf8';
        oledCtx.lineWidth = 2;
        oledCtx.beginPath();
        oledCtx.moveTo(128, 110);
        oledCtx.lineTo(128 + Math.cos(sweepAngle) * 65, 110 - Math.sin(sweepAngle) * 65);
        oledCtx.stroke();

        oledTexture.needsUpdate = true;
      }

      // Blink LEDs in sequence
      const ledCycle = Math.floor(elapsedTime * 2.5) % 3;
      ledRed.ledMat.emissiveIntensity = ledCycle === 0 ? 1.6 : 0.2;
      ledRed.pLight.intensity = ledCycle === 0 ? 2.0 : 0.1;

      ledYellow.ledMat.emissiveIntensity = ledCycle === 1 ? 1.6 : 0.2;
      ledYellow.pLight.intensity = ledCycle === 1 ? 2.0 : 0.1;

      ledGreen.ledMat.emissiveIntensity = ledCycle === 2 ? 1.6 : 0.2;
      ledGreen.pLight.intensity = ledCycle === 2 ? 2.0 : 0.1;

      // Animate background robot slightly on step 5 (Test Bench)
      if (activeStep === 5) {
        robotCar.position.x = Math.sin(elapsedTime * 1.5) * 1.8;
        wL.rotation.x = elapsedTime * 4.0;
        wR.rotation.x = elapsedTime * 4.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeStep]);

  return (
    <div className="hero-3d-wrapper">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        className="hero-3d-viewport-container" 
        aria-label="Interactive 3D Virtual Electronics Workbench"
      />

      {/* Bench Turn Tooltip (matching BenchTwin video top-right) */}
      <div className="bench-drag-tooltip">
        <span className="drag-icon">↻</span>
        <span>Drag to turn the bench. Click a part to look closer.</span>
      </div>

      {/* Overlay Card for Step 2: Code (traffic_radar.ino) */}
      {activeStep === 2 && (
        <div className="hero-code-overlay-card">
          <div className="code-overlay-header">
            <span className="code-overlay-filename">traffic_radar.ino</span>
          </div>
          <pre className="code-overlay-body">
            <code>
              {typedCode}
              <span className="typing-cursor">|</span>
            </code>
          </pre>
        </div>
      )}

      {/* Overlay Card for Step 3: Simulate (Pin timeline) */}
      {activeStep === 3 && (
        <div className="hero-timeline-overlay-card">
          <div className="timeline-overlay-header">
            <span className="timeline-title">Pin timeline</span>
            <span className="timeline-live-tag">
              <span className="live-dot-green" />
              <span>Live</span>
            </span>
          </div>
          <canvas 
            ref={canvasTimelineRef} 
            width={340} 
            height={160} 
            className="timeline-canvas" 
          />
        </div>
      )}
    </div>
  );
};
