# 3D Hardware Workbench & Robot Prototyping Studio
## Comprehensive User & Developer Operating Manual (Release v5.0)

---

## 1. Executive Summary & Architecture Overview

The **3D Hardware Workbench** is an interactive, browser-based robotics prototyping studio, physics simulation platform, and virtual Arduino microcontroller runtime environment. Engineered with modern web standards (React 19, TypeScript 5.8, Three.js 0.182, Vite 8.3, and Rapier 0.14 physics), the application enables engineers, students, and hobbyists to design, wire, program, and simulate autonomous mobile robots entirely in 3D without physical hardware.

### Key Architectural Pillars
- **Zero-Code Execution Security:** The Arduino runtime uses a deterministic AST (Abstract Syntax Tree) lexer, parser, and tree-walking interpreter. It executes Arduino C++ sketch syntax with zero arbitrary code execution (`eval` and `new Function` are completely absent).
- **Sub-Millisecond Physics & Kinematics:** Sub-stepped differential-drive kinematics, forward kinematics joint compounding, multi-ray conical obstacle raycasting, optical disc encoder interrupts, and discrete PID control algorithms run deterministically at 60 FPS.
- **Hardware-in-the-Loop Simulation:** Virtual pin states (`SimulatedPin`) bridge directly to 3D mechanical components, electrical terminals, and real-time visual feedback (rotating shafts, sweeping servos, glowing LED dies, illuminated IR indicators, and dynamic sonar cones).
- **Persistent Engineering Workflows:** Projects, wiring harnesses, mechanical attachments, calibration profiles, and code sketches persist locally in browser storage, export to standardized JSON, and restore with schema validation and sanitization.

---

## 2. Quick Start & Setup Guide

### System Prerequisites
- Modern Web Browser: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with WebGL 2.0 support.
- Node.js: Version 18.0 or higher (for local development and test execution).

### Installation & Launching Locally
```bash
# Clone or navigate to the project directory
cd "C:\Users\MOHD ASAD ALI\OneDrive\Desktop\rea\hardware-workbench"

# Install project dependencies
npm install

# Start the interactive development server
npm run dev

# Build the production bundle
npm run build

# Run the complete automated test suite (740 assertions)
npx tsx tests/test_phase10_reliability.ts
```

Open `http://localhost:5173/` in your browser to enter the studio.

---

## 3. Application Navigation & Workspace Layout (BenchTwin-Inspired Architecture)

The Hardware Workbench interface is designed with a desktop-grade engineering CAD layout, dividing workflows cleanly between project exploration, 3D spatial staging, circuit inspection, and code diagnostics.

### 3.1 Welcome & Landing Page (BenchTwin-Inspired Cinematic Architecture)
Upon opening the application, users are greeted by a commercial-grade engineering welcome portal:
- **Top Announcement Strip:** Pale cyan alert banner highlighting the latest releases and documentation, dismissible with persistent `localStorage` status.
- **Compact Sticky Navigation Bar:** Dark translucent backdrop with frosted glass blur upon scrolling, custom Hardware Workbench brand logo, in-page navigation anchors (`Projects`, `Features`, `Workflow`), theme switcher, and prominent teal `Start Building` CTA.
- **Cinematic 3D Hero Section:** 
  - **Left Editorial Column:** Oversized bold headline (*"Build it. Wire it. Bring it to life."*), concise technical mission statement, primary teal `Start Building` button, and outlined `Explore Projects` button.
  - **Right 3D Electronics Assembly Scene (`HeroScene3D`):** Dedicated WebGL Three.js canvas featuring a dark perspective grid, circular pedestal, cream tie-point breadboard with power rails, Arduino Uno R3 with ATmega328P DIP IC, crystal oscillator, USB/DC jacks, HC-SR04 ultrasonic sensor with dual mesh transducers, 9g micro servo with oscillating horn, blinking/pulsing LEDs with dynamic point lighting, and 5 Catmull-Rom tube jumper wires, complete with smooth mouse parallax and idle camera drift.
  - **Bottom Capabilities Strip:** 6 compact technical cards highlighting *3D Electronics Assembly*, *Interactive Pin Wiring*, *Arduino AST Interpreter*, *Differential Kinematics*, *Closed-Loop Sensing*, and *Full Project Persistence*.
- **Section 2 — Light Project Discovery ("Start with a project"):**
  - Crisp, high-contrast light section (`#f8fafc`) with editorial title and description.
  - Functional category filter pills (*All*, *Robotics*, *Electronics*, *Sensors*).
  - Left Featured 3D Project Preview card with badge, specifications, and instant `Launch in Workbench` launcher.
  - Right structured interactive project list with part counts, board specs, and category tags.
- **Section 3 — Dark Product Features Storytelling:**
  - Deep charcoal technical backdrop (`#080c13`) with editorial typography.
  - Substantial Workbench Application Preview showcase with live simulation HUD and code dock.
  - 6-card feature grid detailing 3D component placement, virtual pin-to-pin wiring, Arduino C++ interpreter, live sensor & motor simulation, ultrasonic radar & TCRT5000 IR sensing, and project persistence.
- **Section 4 — 6-Step Workflow Strip:** Horizontal step cards (*Build*, *Wire*, *Code*, *Simulate*, *Design*, *Test*) with interactive hover transitions.
- **Section 5 — Final Launch CTA & Technical Engineering Footer:** Launch invitation card, quick links, system status, and complete keyboard shortcuts reference table.

### 3.2 Main Workbench Panel Organization
The main workbench employs a compact, multi-panel layout inspired by modern electronics CAD platforms:

1. **Top 2-Tier CAD Toolbar:**
   - **Primary Bar (44px):** Home navigation button, Hardware Workbench logo, inline project title editor, dirty state indicator (`• Unsaved`), simulation status pill (`IDLE`, `RUNNING`, `PAUSED`, `ERROR`), simulation control buttons (Run [F5], Pause/Stop, Reset Scene), project management (New, Open, Save, Export, Import), layout toggles (Left, Bottom, Right, Reset Layout), and theme switch.
   - **Secondary Viewport Strip (36px):** Transform gizmo buttons (Translate [W], Rotate [E], Scale [R]), Snapping toggle (0.5m grid / 15° rotation), Track surface selector, and Camera view angle presets (Perspective, Top [Y], Front [Z], Side [X], Reset View).

2. **Left Engineering Sidebar:**
   - **Component Catalog Tab:** Search bar and category chips (`All`, `Controllers`, `Motors`, `Sensors`, `Passive`, `Chassis`) to browse and add components to the scene.
   - **Scene Hierarchy Tab:** Interactive scene tree displaying parent-child mechanical attachments (e.g. wheels attached to chassis mounts), component selection, and visibility toggle eyes.
   - **Starter Templates Tab:** Fast in-workspace template switching.
   - **Collapse Rail (36px):** Click the collapse chevron or rail to minimize the sidebar and maximize 3D canvas real estate.

3. **Center 3D Viewport:**
   - Interactive Three.js scene canvas with OrbitControls.
   - Real-time telemetry HUD overlay in the top right.
   - Viewport camera angle controls and transform gizmo axes.
   - Helpful empty-state guidance card when starting from a blank scene.

4. **Right Inspector Panel:**
   - Numerical transform inputs (Position X/Y/Z, Rotation X/Y/Z).
   - Electrical terminal connection tables with target pins and wire colors.
   - Mechanical attachment attributes and parent joints.
   - Live telemetry monitors for motor speeds, ultrasonic distances, encoder ticks, and line sensor states.
   - Collapsible 36px rail with expand toggle.

5. **Bottom Engineering Dock:**
   - Resizable dock with draggable split-bar (160px to 600px).
   - **Arduino Code Editor Tab:** C++ syntax editor with 12 built-in sketch presets, compilation status, and sketch run controls.
   - **Serial Monitor Tab:** High-speed streaming console with autoscroll and baud rate selection.
   - **Live Circuit Diagnostics Tab:** Live electrical validation via `evaluateCircuitState`, reporting closed-circuit continuity, wire counts, and pin connections for motors, ultrasonic sensors, line sensors, servos, and LEDs without fabricated data.
   - **Virtual Pin Matrix Tab:** Grid view of Arduino Uno digital and analog pins with live voltage levels and PWM duty cycles.
   - Dock collapse/expand button to instantly drop the dock out of the way.

6. **Workspace Layout System:**
   - Remembers panel visibility states (`isLeftCollapsed`, `isRightCollapsed`, `isBottomCollapsed`) and dock height across browser reloads via `localStorage` under `hw_workbench_layout`.
   - "Reset Layout" action in the toolbar instantly restores default engineering proportions.

---

## 4. Viewport Navigation & Canvas Controls

The central 3D canvas represents the robot testing arena and workshop surface.

### Camera Orbit Controls
| Action | Mouse Control | Touch / Trackpad | Description |
|---|---|---|---|
| **Rotate View** | Left Click + Drag | One-Finger Drag | Tumbler orbit around the scene center point |
| **Pan View** | Right Click + Drag | Two-Finger Drag | Translates camera laterally across the arena |
| **Zoom View** | Mouse Scroll Wheel | Pinch In / Out | Smooth dolly zoom toward or away from cursor |
| **Selection** | Left Click Object | Tap Object | Selects 3D component and opens its Inspector card |
| **Deselect** | Click Empty Canvas | Tap Floor Plane | Clears active component selection |

### Camera Presets & Gizmo Controls
- **Camera View Presets:** Top toolbar buttons provide instant orthogonal and perspective vantage points:
  - `Perspective`: Standard angled 3D camera vantage point.
  - `Top (Y)`: Overhead plan view, ideal for checking line sensor alignment and track navigation.
  - `Front (Z)`: Frontal elevation view, ideal for bumper and obstacle clearance inspection.
  - `Side (X)`: Profile view, ideal for wheel ground contact and sensor height verification.
  - `Reset View`: Returns camera to default isometric framing.
- **Translate (`W`):** Displays red (X), green (Y), and blue (Z) translation arrows. Click and drag an arrow to reposition components.
- **Rotate (`E`):** Displays spherical rotation rings to orient parts about principal axes in $15^\circ$ increments when snapping is active.
- **Scale (`R`):** Displays box scale handles to resize custom components or obstacle dimensions.
- **Snap Toggle:** Enables or disables grid-aligned snapping ($0.5\,\text{unit}$ translation, $15^\circ$ rotation).
- **Track Surface Selector:** Changes the floor environment between:
  1. `Oval Loop` — Closed competition circuit with straightaways and continuous curves.
  2. `Straight Track` — Precision straight-line sprint for encoder odometry calibration.
  3. `Wavy Track` — High-frequency sinusoidal curves to stress-test PID derivative damping.
  4. `Plain Floor` — Clean uniform workshop floor for free-roaming obstacle avoidance.

---

## 4. Hardware Component Catalog

The studio features 11 virtual hardware and structural components across 5 functional categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT CATALOG                               │
├──────────────┬──────────────────┬──────────────┬───────────────────────┤
│ Type ID      │ Component Name   │ Category     │ Default Scale / Color │
├──────────────┼──────────────────┼──────────────┼───────────────────────┤
│ chassis      │ 2WD Robot Base   │ structural   │ (1, 1, 1)  #334155    │
│ arduino      │ Arduino Uno R3   │ controller   │ (1, 1, 1)  #059669    │
│ dc_motor     │ DC Drive Motor   │ actuator     │ (1, 1, 1)  #eab308    │
│ wheel        │ Drive Wheel      │ actuator     │ (0.9, 0.9) #1e293b    │
│ servo        │ Micro Servo 9g   │ actuator     │ (1, 1, 1)  #0284c7    │
│ ultrasonic   │ Sonar (HC-SR04)  │ sensor       │ (1, 1, 1)  #0284c7    │
│ line_sensor  │ IR Sensor TCRT   │ sensor       │ (1, 1, 1)  #10b981    │
│ potentiometer│ 10k Rotary Pot   │ sensor       │ (1, 1, 1)  #6366f1    │
│ led          │ 5mm Status LED   │ output       │ (1, 1, 1)  #ef4444    │
│ obstacle_box │ Cardboard Box    │ structural   │ (1, 1, 1)  #d97706    │
│ obstacle_wall│ Plywood Wall     │ structural   │ (2, 1, 0.4)#b45309    │
└──────────────┴──────────────────┴──────────────┴───────────────────────┘
```

---

## 5. Electrical Wiring System & Terminal Definitions

Connections in the Hardware Workbench follow strict electrical terminal definitions:

### Component Terminal Specifications
1. **Arduino Uno R3:**
   - Digital Pins: `D0` to `D13` (Pins with `~` indicate hardware PWM capability: `D3`, `D5`, `D6`, `D9`, `D10`, `D11`). Pins `D2` and `D3` support hardware external interrupts `INT0` and `INT1`.
   - Analog Inputs: `A0`, `A1`, `A2`, `A3`, `A4`, `A5` ($0\text{V} - 5\text{V}$, $0 - 1023$ ADC).
   - Power & Ground: `5V`, `3.3V`, `VIN`, `GND_1`, `GND_2`.
2. **DC Gearmotor:**
   - `TERM_POS` — Positive motor terminal / H-bridge driver control pin.
   - `TERM_NEG` — Negative return terminal (must connect to Ground).
3. **Micro Servo 9g:**
   - `VCC` — Power $+5\text{V}$ (Red wire).
   - `GND` — Ground return (Brown wire).
   - `SIGNAL` — $50\,\text{Hz}$ PWM control pulse (Orange wire, default `D9`).
4. **Ultrasonic Sensor (HC-SR04):**
   - `VCC` — Power $+5\text{V}$.
   - `GND` — Ground return.
   - `TRIG` — $10\,\mu\text{s}$ TTL trigger pulse (default `D11`).
   - `ECHO` — Return pulse-width output ($58\,\mu\text{s}/\text{cm}$, default `D12`).
5. **Dual IR Line Reflectance Sensors (TCRT5000):**
   - `VCC` — Power $+5\text{V}$.
   - `GND` — Ground return.
   - `DO` — Digital threshold output ($1 = \text{Black line}, 0 = \text{White surface}$, default `D4` left, `D7` right).
   - `AO` — Analog surface reflectance ADC voltage ($100 - 950$, default `A1` left, `A2` right).
6. **Status LED (5mm):**
   - `ANODE` — Long positive lead (connect to digital output pin).
   - `CATHODE` — Flat edge ground lead (connect to Ground).

### Point-and-Click Wiring Workflow
1. Hover over any component to reveal its glowing connection terminals.
2. Click the source terminal (e.g. Arduino `D5`). A flexible bezier preview wire appears anchored to your cursor.
3. Click the destination terminal (e.g. Left Motor `TERM_POS`). The wire snaps into place with realistic gravitational droop and color-coded insulation.
4. To remove a wire, click on the wire in the 3D scene or click the delete button in the Component Inspector card.
5. **Auto-Connect Assistance:** In the Properties Panel for complex 4-wire sensors (HC-SR04 and TCRT5000), click the **Auto-Connect** button to automatically wire Power, Ground, Signal, and Trigger lines to their standard Arduino headers without manual routing.

---

## 6. Mechanical Mounting & Kinematic Hierarchy

The assembly engine enforces realistic physical relationships between connected parts:

### Joint Types
- **Fixed Joint:** Locks the child component solidly to the parent component with a defined position and rotation offset (e.g., Arduino standoffs on the chassis deck, motor housings in the chassis bays).
- **Revolute Joint:** Allows free or driven continuous rotation around a primary axle shaft (e.g., motor drive axle to wheel hub, servo body to rotating ultrasonic horn).

### Compound Forward Kinematics
When a chassis translates or rotates:
$$\mathbf{P}_{\text{world}} = \mathbf{P}_{\text{chassis}} + \mathbf{R}_{\text{chassis}} \cdot \mathbf{P}_{\text{relative}}$$
$$\theta_{\text{sensor, world}} = \theta_{\text{robot, heading}} + (\theta_{\text{servo}} - 90^\circ)$$

This mathematical compounding ensures that when a servo turns $45^\circ$ while the robot is facing $30^\circ$, the mounted ultrasonic sensor accurately casts rays into the 3D world at $+75^\circ$ compound azimuth!

---

## 7. Safe Arduino Virtual AST Runtime

The AST interpreter supports an authentic subset of the standard Arduino C/C++ language:

### Supported Standard Functions
```cpp
// Digital & Analog I/O
void pinMode(uint8_t pin, uint8_t mode); // INPUT, OUTPUT, INPUT_PULLUP
void digitalWrite(uint8_t pin, uint8_t val); // HIGH (1), LOW (0)
int digitalRead(uint8_t pin);
void analogWrite(uint8_t pin, int val); // 0 to 255 PWM
int analogRead(uint8_t pin); // 0 to 1023 ADC

// Timing & Pulses
void delay(unsigned long ms);
void delayMicroseconds(unsigned int us);
unsigned long millis(void);
unsigned long micros(void);
unsigned long pulseIn(uint8_t pin, uint8_t state, unsigned long timeout);

// Math & Utility
long map(long x, long in_min, long in_max, long out_min, long out_max);
long constrain(long x, long a, long b);
int min(int a, int b);
int max(int a, int b);
int abs(int x);

// External Hardware Interrupts
void attachInterrupt(uint8_t interruptNum, void (*userFunc)(void), int mode); // RISING, FALLING, CHANGE
void detachInterrupt(uint8_t interruptNum);
void interrupts(void);
void noInterrupts(void);

// Serial Communication
Serial.begin(long baud);
Serial.print(val);
Serial.println(val);

// Servo Library (Servo.h)
#include <Servo.h>
Servo myServo;
myServo.attach(uint8_t pin);
myServo.write(int angle); // 0 to 180 degrees
int myServo.read();
bool myServo.attached();
myServo.detach();
```

---

## 8. Built-in Sketch Presets Overview

The Code Editor panel includes 12 production-grade Arduino sketch presets:

1. **Standard Blink (Pin 13):** Basic verification of virtual pin toggling and built-in LED blinking.
2. **Dual Motor Alternator (Pins 5 & 6):** Alternates PWM forward drive between left and right motors.
3. **Digital Button / Sensor Input (Pin 2 → Pin 13):** Demonstrates digital input edge detection.
4. **Analog Light Sensor Readout (A0):** Reads analog voltage and logs ADC values to the Serial Monitor.
5. **LED PWM Fader (Pin 13 ~ PWM):** Smoothly ramps brightness up and down using PWM duty cycles.
6. **Sonar Obstacle Avoidance (HC-SR04 → Motors):** Uses `pulseIn()` timing to stop motors when obstacles are $<25\,\text{cm}$ ahead.
7. **Closed-Loop Odometry & Distance Drive:** Uses optical wheel encoders on interrupt pins `D2` (INT0) and `D3` (INT1) to balance motor speeds and halt precisely after a target distance.
8. **Potentiometer Motor Throttle (A0 → Motors):** Maps analog rotary dial position to drive speed.
9. **IR Line-Sensor Monitor & Calibration:** Logs live digital and analog readings from dual TCRT5000 sensors.
10. **Autonomous Line Following Robot:** Classic differential line tracker with drift steering and lost-line recovery rotation.
11. **Closed-Loop PID Line Follower:** Production discrete PID controller with proportional tracking, anti-windup clamped integral accumulation, derivative rate damping, and curve memory.
12. **Servo-Mounted Ultrasonic Radar Scanner:** Sweeps servo between $45^\circ$ and $135^\circ$, collects multi-angle distance readings, calculates angular sector paths, and streams live polar radar sweeps to the Telemetry HUD.

---

## 9. Starter Demonstration Templates

Clicking **Open Project** in the header reveals the **Starter Templates** tab, offering 3 pre-built robot projects ready for immediate one-click simulation:

### 1. PID Line Follower Rover
- **Chassis & Hardware:** 2WD chassis, Arduino Uno R3, dual gearmotors, drive wheels, dual downward TCRT5000 IR reflectance sensors mounted at the front bumper.
- **Circuit Wiring:** Complete 10-wire harness (Motors to D5/D6, Sensors to 5V/GND/D4/D7/A1/A2).
- **Environment:** High-contrast Oval Loop competition track.
- **Control Sketch:** Preset 11 Discrete PID Controller ($K_p = 0.20, K_i = 0.003, K_d = 0.35$).
- **Behavior:** Smooth, high-speed line tracking with anti-windup damping and curve continuation.

### 2. Ultrasonic Polar Radar Rover
- **Chassis & Hardware:** 2WD chassis, Arduino Uno R3, dual gearmotors, drive wheels, Micro Servo 9g pan actuator mounted at front bay, HC-SR04 sonar sensor mounted directly to servo horn.
- **Circuit Wiring:** Complete 11-wire harness (Motors to D5/D6, Sonar to 5V/GND/D11/D12, Servo to 5V/GND/D9).
- **Environment:** Workshop arena with cardboard box obstacle at $45^\circ$ azimuth.
- **Control Sketch:** Preset 12 Servo Radar Scanner ($45^\circ - 135^\circ$ continuous sweep).
- **Behavior:** Live polar HUD sweep display; autonomous left/right obstacle avoidance routing.

### 3. Closed-Loop Interrupt Odometry Rover
- **Chassis & Hardware:** 2WD chassis, Arduino Uno R3, dual gearmotors, drive wheels with 20-slot optical encoder discs, green status indicator LED.
- **Circuit Wiring:** Complete 6-wire harness (Motors to D5/D6, Status LED to D13/GND).
- **Environment:** High-precision Straight Sprint track.
- **Control Sketch:** Preset 7 Closed-Loop Interrupt Odometry ($11\,\text{ticks} \approx 62\,\text{cm}$ target).
- **Behavior:** Hardware interrupts on pins D2/D3 calculate real-time differential wheel travel, actively trims PWM to maintain dead-straight heading, and illuminates Pin 13 upon target arrival.

---

## 10. Project Persistence, State Export/Import & Calibration

### Local Project Storage
- **Save Project (`Ctrl+S` or Header Save Button):** Saves the complete state—including 3D transforms, electrical wires, mechanical joints, active Arduino sketch, track surface, and calibration parameters—into designated slots in browser `localStorage`.
- **Saved Projects List:** Displays all saved projects with timestamps, part counts, wiring counts, track types, and calibration badges.
- **Autosave & Crash Recovery:** The studio automatically snapshots the project on changes. If the browser refreshes unexpectedly, the workbench alerts the user and offers 1-click session restoration.

### JSON State Export & Import
- **Export Scene / Project:** Generates a clean, portable `.json` file containing the full project definition.
- **Import Scene / Project:** Parses and validates imported JSON files. Built-in schema validation rejects malformed structures and automatically sanitizes cyclic attachment chains and disconnected wires.

### Calibration Profiles Studio
Tuning parameters can be adjusted via interactive sliders and saved as reusable profiles:
- **Ultrasonic Sonar:** Max detection range ($10 - 400\,\text{cm}$), danger braking threshold ($5 - 50\,\text{cm}$), conical ray count ($1 - 9$), beam cone angle ($5^\circ - 30^\circ$).
- **IR Line Sensors:** Digital output threshold ($100 - 900\,\text{ADC}$), black surface threshold reflectance, white surface threshold reflectance.
- **Wheel Encoders:** Optical disc slot count ($1 - 60\,\text{slots}$), wheel diameter ($20 - 150\,\text{mm}$), gear reduction ratio.
- **Kinematics & Motors:** Wheelbase track width ($50 - 300\,\text{mm}$), max linear velocity ($50 - 500\,\text{mm/s}$), base cruising PWM ($50 - 255$), motor deadband offset ($0 - 100\,\text{PWM}$).

---

## 11. Troubleshooting & Edge Cases

| Issue Observed | Root Cause | Solution |
|---|---|---|
| Motor does not rotate during simulation | Incomplete circuit or reversed polarity | Ensure `TERM_POS` connects to PWM pin (`D5`/`D6`) and `TERM_NEG` connects to Ground (`GND_1`/`GND_2`). |
| Ultrasonic reads $400\,\text{cm}$ constantly | Missing power wires or obstacle outside cone | Verify sensor `VCC` is on `5V` and `GND` is grounded. Ensure obstacle is in front ($+Z$) and within $12^\circ$ cone. |
| Robot spins in circles on line track | Inverted sensor logic or swapped motor pins | Check whether Left Sensor connects to Left Pin (`A1`/`D4`) and Left Motor is on `D5`. Check DO threshold in calibration. |
| Servo does not sweep in radar mode | Servo signal wire missing or disconnected | Verify servo signal pin is connected to `D9` and `#include <Servo.h>` is present in the sketch. |
| LocalStorage Quota Exceeded error | Browser storage capacity full | Delete unused project slots in the Project Modal or export older projects to JSON files. |
| Robot clips or falls through floor | Physics engine paused or collision mesh disabled | Toggle physics simulation on in the toolbar; ensure chassis height is above $Y = 0.0$. |

---

## 12. Verification & Test Metrics

The Hardware Workbench test suite contains **11 automated test suites** covering unit, mathematical, AST runtime, kinematic, and persistence layers:

```
================================================================
Hardware Workbench Automated Regression Verification Summary
================================================================
1. test_17_scenarios.ts          :  17 /  17 PASS (100%)
2. test_phase5a.ts               :  33 /  33 PASS (100%)
3. test_phase5b.ts               :  28 /  28 PASS (100%)
4. test_phase6_kinematics.ts     :  37 /  37 PASS (100%)
5. test_phase6_closed_loop.ts    :  16 /  16 PASS (100%)
6. test_phase7_encoders.ts       :  52 /  52 PASS (100%)
7. test_phase8_line_sensor.ts    :  68 /  68 PASS (100%)
8. test_phase9_pid.ts            :  32 /  32 PASS (100%)
9. test_phase9b_radar.ts         :  56 /  56 PASS (100%)
10. test_phase9c_persistence.ts   :  82 /  82 PASS (100%)
11. test_phase10_reliability.ts   : 319 / 319 PASS (100%)
----------------------------------------------------------------
TOTAL ASSERTIONS PASSING         : 740 / 740 PASS (100%)
PRODUCTION BUNDLE BUILD STATUS   : 0 Errors (built in ~805ms)
================================================================
```

---
*Hardware Workbench v5.0 — Engineered for Reliable Virtual Robot Prototyping.*
