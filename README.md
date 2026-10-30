# 3D Hardware Workbench & REA Project Archive

> **Saved State:** All phases from REA reverse-engineering through **Phase 4B (Virtual Arduino Pins to 3D Hardware)** have been verified and archived. You can resume development directly from this folder at any time.

---

## 📂 Archive Structure

```
Desktop/rea/
├── hardware-workbench/           # The active 3D Hardware Playground web app (React + Vite + TypeScript + Three.js + Rapier)
│   ├── src/                      # Complete application source code
│   │   ├── components/           # UI & 3D Viewport components (Viewport3D, CodeEditorPanel, PropertiesPanel, etc.)
│   │   ├── utils/                # Hardware bridge, Arduino runtime, Rapier physics, Three.js meshes
│   │   └── types/                # Strict TypeScript data models (workbench.ts)
│   ├── dist/                     # Optimized production build bundle
│   ├── node_modules/             # Pre-installed dependencies (ready to run immediately!)
│   └── package.json              # Project scripts and dependency declarations
├── constructa_investigation/     # Reverse-engineered bundles, assets, and scripts from Constructa
├── inspection_scripts/           # Python & Node.js reverse-engineering tools & bundle scanners
├── recordings_and_artifacts/     # Test recordings (.webp videos) and verification screenshots
├── REA_CONFIG/                   # Reverse Engineer Anything (REA) skill docs and MCP instructions
└── README.md                     # This master guide and resumption instructions
```

---

## 🚀 How to Run and Resume Immediately

The project is completely self-contained with all dependencies installed.

### 1. Launch the 3D Workbench
Open a terminal (PowerShell or Command Prompt) and run:

```powershell
cd "hardware-workbench"
npm run dev
```

Then open your browser to:
👉 **http://localhost:5173/**

### 2. Verify Production Build
```powershell
npm run build
```
*(Transpiles and validates all 1,950+ modules via TypeScript and Vite with zero errors).*

---

## 🛠️ Summary of Completed Phases

### 🔍 REA Investigation & Reverse-Engineering
- Connected to public Constructa targets (https://constructa-page.atumx.in/ and https://constructa.atumx.in/).
- Extracted and analyzed client bundles (ArticulatedSession, BlocksPanel, rapier, Esp32Panel, etc.).
- Identified the core architecture: React + Vite + Three.js + Rapier physics + Blockly + client-side interpreted robotics runtime.
- Preserved all disassembled bundles in constructa_investigation/.

### 📦 Phase 1: 3D Hardware Playground Foundation
- Layout with component catalog (left), 3D viewport (center), and inspector (right).
- Three.js scene with custom ground grid, lighting, orbit camera controls, and gizmo transformations (Move, Rotate, Scale).
- Catalog of modular robotic parts: Chassis, BO Gear Motor, Rubber Drive Wheel, Servo Motor, Arduino Uno MCU, Ultrasonic Sensor, Status LED.
- Full project JSON serialization (import and export).

### ⚡ Phase 2A: Interactive 3D Electrical Wiring
- Selectable electrical terminal sockets mapped to 3D component coordinates with categories (Power, Ground, Digital, Analog).
- Click-to-wire interaction mode with live draft curve preview.
- Dynamic 3D Bezier curve cables with ferrule terminal boots.
- Real-time drag synchronization (moving components updates connected wire curves).

### ⚙️ Phase 3: Mechanical Assembly & Rapier Physics
- Integration with @dimforge/rapier3d-compat.
- Rigid body colliders for chassis, motors, wheels, and sensors.
- Mechanical snap-mounting system with compatible mount points.
- Physics-driven motorized joints (revolute drive joints for wheels, fixed joints for chassis attachments).
- Real-time physics simulation stepping with reset and state snapshots.

### 💻 Phase 4A: Arduino Code Editor & Sandboxed AST Interpreter
- Dockable bottom Code panel with preset sketch selector, font controls, and collapse/expand.
- Safe client-side Lexer, Parser, and AST Interpreter for Arduino C++ syntax without eval or new Function.
- Simulated 20-pin Arduino Uno pin monitor (Pins D0-D13, A0-A5) with real-time digital and PWM updates.
- Built-in functions: pinMode(), digitalWrite(), digitalRead(), analogWrite(), analogRead(), delay(), millis(), Serial.print(), Serial.println(), map(), and constrain().

### 🔌 Phase 4B: Connect Virtual Arduino Pins to 3D Hardware
- **Hardware Bridge (src/utils/hardwareBridge.ts)**: Evaluates complete electrical circuits from the Arduino through wires to components.
- **3D LED Behavior**:
  - digitalWrite(pin, HIGH) illuminates LED with custom emissive material + dynamic Three.js PointLight.
  - digitalWrite(pin, LOW) turns it off.
  - analogWrite(pin, pwm) smoothly modulates brightness from 0 to 255.
  - Polarity checking: alerts user if Anode/Cathode are reversed or disconnected.
- **DC Motor & Wheel Drive**:
  - Linear PWM-to-angular speed mapping.
  - Controls the Rapier revolute joint motor driving the wheel.
  - Zero output immediately brakes and stops the driven joint.
- **Lifecycle & Circuit Fault Handling**:
  - Removing a wire or stopping the code immediately cuts power to connected hardware.
  - Live Virtual Hardware Status badges in the Component Inspector show connection state, active pin, driven speed, and circuit errors.

---

## 🗺️ Key Source Files Reference

- `hardware-workbench/src/utils/hardwareBridge.ts`: Deterministic circuit evaluator & 3D material/joint actuator bridge
- `hardware-workbench/src/utils/arduinoRuntime.ts`: AST interpreter, virtual pin states, and preset sketches
- `hardware-workbench/src/utils/physicsEngine.ts`: Rapier physics world manager & revolute joint motor controllers
- `hardware-workbench/src/utils/threeMeshFactory.ts`: Procedural 3D Three.js hardware meshes and dynamic lights
- `hardware-workbench/src/utils/terminalDefinitions.ts`: Electrical terminal definitions, pin numbers, and rules
- `hardware-workbench/src/utils/assemblyDefinitions.ts`: Mechanical mounting points and joint attachment rules
- `hardware-workbench/src/components/Viewport3D.tsx`: 3D WebGL canvas, gizmos, wire rendering, and render loop
- `hardware-workbench/src/components/CodeEditorPanel.tsx`: Code editor, serial monitor, and virtual pin monitor UI
- `hardware-workbench/src/components/PropertiesPanel.tsx`: Inspector with live Virtual Hardware Status cards

---

## 🎯 Next Steps / Suggested Phase 5 Tasks

When resuming work, here are the logical next enhancements:
1. **Ultrasonic Sensor Simulation**:
   - Implement pulseIn(echoPin, HIGH) or sonar.ping_cm() by raycasting from the ultrasonic sensor in the 3D scene to detect obstacles.
2. **Servo Motor Angular Control**:
   - Support Servo.h (servo.attach(pin) and servo.write(angle)) to rotate the 3D servo arm and mounted ultrasonic head.
3. **H-Bridge Dual-Pin Motor Driver**:
   - Add motor driver IC modules (e.g., L298N) to support bidirectional forward/reverse motor control via dual pins.
4. **Block-Based Visual Coding**:
   - Add an optional visual block editor (Blockly/Scratch-style) mirroring the blocks uncovered during the Constructa investigation.
