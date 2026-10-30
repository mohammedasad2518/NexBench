import * as THREE from 'three';

// ============================================================================
// Phase 8A: Virtual Floor Track & IR Reflectance Sampling System
// ============================================================================

export type TrackType = 'oval' | 'straight' | 'wavy' | 'none';

export interface TrackConfig {
  type: TrackType;
  lineWidthUnits: number; // Width of black track line in Three.js units (default 0.7 = 14 cm)
  planeSizeUnits: number; // Size of ground plane (e.g. 40 x 40 units)
  whiteReflectance: number; // Pure white floor reflection (default 0.95 -> ~970 ADC)
  blackReflectance: number; // Black tape absorption (default 0.10 -> ~100 ADC)
}

export const DEFAULT_TRACK_CONFIG: TrackConfig = {
  type: 'oval',
  lineWidthUnits: 0.75, // ~15 cm competition line width
  planeSizeUnits: 40,
  whiteReflectance: 0.95,
  blackReflectance: 0.10,
};

export interface FloorSampleResult {
  isOverBlackLine: boolean;
  reflectance: number;       // 0.0 (pitch black) to 1.0 (pure white)
  distanceToLineCenter: number; // Shortest distance to track centerline (units)
  digitalValue: 0 | 1;       // TCRT5000 DO: 1 = Black Line, 0 = White Floor
  analogValue: number;       // TCRT5000 AO: 0 - 1023 (e.g. ~120 on black, ~950 on white)
}

/**
 * Calculates shortest Euclidean distance from world (x, z) to the centerline of the selected track.
 */
export function calculateDistanceToTrackCenterline(
  x: number,
  z: number,
  trackType: TrackType = 'oval'
): number {
  if (trackType === 'none') {
    return 999.0;
  }

  // 1. Straight Test Track (line along Z axis at X = 0)
  if (trackType === 'straight') {
    return Math.abs(x);
  }

  // 2. Wavy S-Curve Track: x(z) = 2.4 * sin(0.35 * z)
  if (trackType === 'wavy') {
    // Approximate shortest distance to the sine curve
    const expectedX = 2.4 * Math.sin(0.35 * z);
    return Math.abs(x - expectedX);
  }

  // 3. Oval Closed Loop Course:
  // - Left straightaway:  X = 0.0, Z between -5.0 and +5.0 (Passes directly through start pose 0, 0)
  // - Right straightaway: X = 5.0, Z between -5.0 and +5.0
  // - Top semicircle cap: Center (2.5, 5.0), radius R = 2.5, Z >= 5.0
  // - Bottom semicircle cap: Center (2.5, -5.0), radius R = 2.5, Z <= -5.0
  if (trackType === 'oval') {
    const straightHalfLength = 5.0;
    const curveRadius = 2.5;
    const centerX = 2.5;

    if (z >= straightHalfLength) {
      // Top circular cap: center (centerX, straightHalfLength)
      const distFromCenter = Math.hypot(x - centerX, z - straightHalfLength);
      return Math.abs(distFromCenter - curveRadius);
    } else if (z <= -straightHalfLength) {
      // Bottom circular cap: center (centerX, -straightHalfLength)
      const distFromCenter = Math.hypot(x - centerX, z + straightHalfLength);
      return Math.abs(distFromCenter - curveRadius);
    } else {
      // Straight segments: distance to nearest vertical line at X = 0 or X = 5.0
      const distToLeft = Math.abs(x);
      const distToRight = Math.abs(x - 5.0);
      return Math.min(distToLeft, distToRight);
    }
  }

  return 999.0;
}

/**
 * Samples the floor surface reflectance and TCRT5000 sensor output at world coordinate (x, z).
 * Deterministic mathematical calculation with 0ms latency and 0 GPU readback overhead.
 */
export function sampleFloorSurface(
  x: number,
  z: number,
  config: TrackConfig = DEFAULT_TRACK_CONFIG
): FloorSampleResult {
  const dist = calculateDistanceToTrackCenterline(x, z, config.type);
  const halfWidth = config.lineWidthUnits / 2.0;

  // Sharp transition with smooth edge falloff (anti-aliasing over 0.05 units / 1 cm edge)
  let normalizedContrast = 0; // 0 = white, 1 = black
  if (dist <= halfWidth) {
    normalizedContrast = 1.0;
  } else if (dist <= halfWidth + 0.08) {
    // Linear edge transition
    normalizedContrast = 1.0 - (dist - halfWidth) / 0.08;
  } else {
    normalizedContrast = 0.0;
  }

  // Reflectance: white floor reflects IR (high), black line absorbs IR (low)
  const reflectance = config.whiteReflectance - normalizedContrast * (config.whiteReflectance - config.blackReflectance);

  // Digital Output (DO): 1 = Black line detected, 0 = White floor
  const isOverBlackLine = dist <= halfWidth;
  const digitalValue: 0 | 1 = isOverBlackLine ? 1 : 0;

  // Analog Output (AO): 0 - 1023
  const analogValue = Math.round(reflectance * 1023);

  return {
    isOverBlackLine,
    reflectance,
    distanceToLineCenter: dist,
    digitalValue,
    analogValue,
  };
}

/**
 * Procedurally draws the track pattern onto an off-screen HTML5 Canvas for Three.js ground texturing.
 */
export function generateTrackCanvas(
  trackType: TrackType = 'oval',
  canvasSize: number = 2048,
  planeSizeUnits: number = 40,
  lineWidthUnits: number = 0.75
): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return {
      width: canvasSize,
      height: canvasSize,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // High contrast white ground plane
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Subtle floor grid lines for depth perception
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  const gridStep = canvasSize / planeSizeUnits;
  for (let i = 0; i <= canvasSize; i += gridStep) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvasSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvasSize, i);
    ctx.stroke();
  }

  if (trackType === 'none') return canvas;

  // Coordinate transformation: World Units -> Canvas Pixels
  // Canvas origin (canvasSize/2, canvasSize/2) corresponds to World (0, 0)
  const scale = canvasSize / planeSizeUnits;
  const toPxX = (worldX: number) => canvasSize / 2 + worldX * scale;
  const toPxZ = (worldZ: number) => canvasSize / 2 + worldZ * scale;
  const lineWidthPx = lineWidthUnits * scale;

  ctx.strokeStyle = '#0f172a'; // Deep matte black line
  ctx.lineWidth = lineWidthPx;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (trackType === 'straight') {
    ctx.beginPath();
    ctx.moveTo(toPxX(0), toPxZ(-18));
    ctx.lineTo(toPxX(0), toPxZ(18));
    ctx.stroke();

    // Start/Finish Checkered bar
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(toPxX(-1.5), toPxZ(0) - 8, 3.0 * scale, 16);
  } else if (trackType === 'wavy') {
    ctx.beginPath();
    for (let wz = -16; wz <= 16; wz += 0.2) {
      const wx = 2.4 * Math.sin(0.35 * wz);
      if (wz === -16) ctx.moveTo(toPxX(wx), toPxZ(wz));
      else ctx.lineTo(toPxX(wx), toPxZ(wz));
    }
    ctx.stroke();
  } else if (trackType === 'oval') {
    const straightHalf = 5.0;
    const curveR = 2.5;
    const centerX = 2.5;

    ctx.beginPath();
    // 1. Left straightaway (Z from -5 to +5 at X = 0, directly under start pose 0, 0)
    ctx.moveTo(toPxX(0), toPxZ(-straightHalf));
    ctx.lineTo(toPxX(0), toPxZ(straightHalf));

    // 2. Top semicircle cap (center 2.5, 5.0) from X = 0 around to X = 5.0
    ctx.arc(toPxX(centerX), toPxZ(straightHalf), curveR * scale, Math.PI, 0, false);

    // 3. Right straightaway (Z from +5 to -5 at X = 5.0)
    ctx.lineTo(toPxX(5.0), toPxZ(-straightHalf));

    // 4. Bottom semicircle cap (center 2.5, -5.0) from X = 5.0 around to X = 0
    ctx.arc(toPxX(centerX), toPxZ(-straightHalf), curveR * scale, 0, Math.PI, false);

    ctx.closePath();
    ctx.stroke();

    // Start / Finish Checkered line across left straightaway at Z = 0
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(toPxX(-0.7), toPxZ(0) - 6, 1.4 * scale, 12);
  }

  return canvas;
}

/**
 * Creates a Three.js CanvasTexture for the ground plane.
 */
export function createFloorTrackTexture(
  trackType: TrackType = 'oval',
  planeSizeUnits: number = 40
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    const tex = new THREE.CanvasTexture({ width: 64, height: 64 } as any);
    return tex;
  }
  const canvas = generateTrackCanvas(trackType, 2048, planeSizeUnits);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
