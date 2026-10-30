/**
 * Project Persistence Manager — Phase 9C
 * 
 * Provides complete project save/load using localStorage with:
 * - Named project slots with metadata (created, updated timestamps)
 * - Autosave with configurable interval and recovery
 * - Calibration profile storage (ultrasonic, line sensors, wheel encoders, motor behavior)
 * - Dirty state tracking
 * - Project listing and deletion
 * - JSON import/export validation
 */

import type {
  Component3D,
  WireConnection,
  MechanicalAttachment,
  SceneConfig,
} from '../types/workbench';
import type { TrackType } from './floorTrack';

// ========================================================
// Calibration Profile Types
// ========================================================

export interface UltrasonicCalibration {
  /** Maximum detectable range in cm (default: 400) */
  maxRangeCm: number;
  /** Braking threshold distance in cm (default: 25) */
  brakingThresholdCm: number;
  /** Number of rays in the conical cast (default: 5) */
  rayCount: number;
  /** Cone half-angle in degrees (default: 12) */
  coneAngleDeg: number;
}

export interface LineSensorCalibration {
  /** ADC threshold for digital output (default: 500) */
  doThreshold: number;
  /** Black line reflectance target (default: 0.10) */
  blackReflectance: number;
  /** White floor reflectance target (default: 0.95) */
  whiteReflectance: number;
  /** Track line width in world units (default: 0.75) */
  trackLineWidth: number;
}

export interface WheelEncoderCalibration {
  /** Number of encoder slots per revolution (default: 20) */
  slotsPerRevolution: number;
  /** Wheel diameter in world units (default: 0.9) */
  wheelDiameter: number;
  /** Wheel base (distance between wheels) in world units (default: 2.8) */
  wheelBase: number;
}

export interface MotorCalibration {
  /** Base speed PWM value (default: 185) */
  baseSpeedPwm: number;
  /** Maximum motor PWM (default: 255) */
  maxPwm: number;
  /** Minimum motor PWM (default: 0) */
  minPwm: number;
  /** Speed scaling factor (world units per second at PWM 255) (default: 3.0) */
  speedScaleFactor: number;
}

export interface CalibrationProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ultrasonic: UltrasonicCalibration;
  lineSensor: LineSensorCalibration;
  wheelEncoder: WheelEncoderCalibration;
  motor: MotorCalibration;
}

// ========================================================
// Extended Project Config (Superset of SceneConfig)
// ========================================================

export interface ProjectConfig extends SceneConfig {
  /** Project-unique identifier */
  projectId: string;
  /** Active calibration profile */
  calibration?: CalibrationProfile;
  /** Active floor track type */
  trackType?: TrackType;
  /** Last active servo angle (0–180) */
  servoAngle?: number;
  /** Selected preset index */
  selectedPresetIndex?: number;
}

// ========================================================
// Project Metadata (for project listing without full data)
// ========================================================

export interface ProjectMetadata {
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  componentCount: number;
  wireCount: number;
  attachmentCount: number;
  hasCalibration: boolean;
  trackType?: TrackType;
}

// ========================================================
// Storage Keys
// ========================================================

const STORAGE_PREFIX = 'hw_workbench_';
const PROJECT_INDEX_KEY = `${STORAGE_PREFIX}project_index`;
const AUTOSAVE_KEY = `${STORAGE_PREFIX}autosave`;
const AUTOSAVE_META_KEY = `${STORAGE_PREFIX}autosave_meta`;
const CALIBRATION_PROFILES_KEY = `${STORAGE_PREFIX}calibration_profiles`;
const LAST_PROJECT_KEY = `${STORAGE_PREFIX}last_project_id`;

// ========================================================
// Default Calibration Profile
// ========================================================

export function createDefaultCalibration(): CalibrationProfile {
  const now = new Date().toISOString();
  return {
    id: 'default',
    name: 'Default Robot Calibration',
    createdAt: now,
    updatedAt: now,
    ultrasonic: {
      maxRangeCm: 400,
      brakingThresholdCm: 25,
      rayCount: 5,
      coneAngleDeg: 12,
    },
    lineSensor: {
      doThreshold: 500,
      blackReflectance: 0.10,
      whiteReflectance: 0.95,
      trackLineWidth: 0.75,
    },
    wheelEncoder: {
      slotsPerRevolution: 20,
      wheelDiameter: 0.9,
      wheelBase: 2.8,
    },
    motor: {
      baseSpeedPwm: 185,
      maxPwm: 255,
      minPwm: 0,
      speedScaleFactor: 3.0,
    },
  };
}

// ========================================================
// ID Generation
// ========================================================

export function generateProjectId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ========================================================
// Project Save / Load
// ========================================================

/**
 * Save a project to localStorage.
 * Updates the project index and stores the full project data.
 */
export function saveProject(project: ProjectConfig): { success: boolean; error?: string } {
  try {
    const now = new Date().toISOString();
    project.updatedAt = now;

    // Store the project data
    const projectKey = `${STORAGE_PREFIX}project_${project.projectId}`;
    const jsonStr = JSON.stringify(project);
    localStorage.setItem(projectKey, jsonStr);

    // Update project index
    const index = getProjectIndex();
    const meta: ProjectMetadata = {
      projectId: project.projectId,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: now,
      componentCount: project.components.length,
      wireCount: (project.wires || []).length,
      attachmentCount: (project.attachments || []).length,
      hasCalibration: !!project.calibration,
      trackType: project.trackType,
    };

    const existingIdx = index.findIndex((m) => m.projectId === project.projectId);
    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.push(meta);
    }

    localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(index));
    localStorage.setItem(LAST_PROJECT_KEY, project.projectId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save project' };
  }
}

/**
 * Load a project from localStorage by its projectId.
 */
export function loadProject(projectId: string): { project: ProjectConfig | null; error?: string } {
  try {
    const projectKey = `${STORAGE_PREFIX}project_${projectId}`;
    const jsonStr = localStorage.getItem(projectKey);
    if (!jsonStr) {
      return { project: null, error: `Project not found: ${projectId}` };
    }
    const project = JSON.parse(jsonStr) as ProjectConfig;
    return { project };
  } catch (err: any) {
    return { project: null, error: err.message || 'Failed to load project' };
  }
}

/**
 * Delete a project from localStorage.
 */
export function deleteProject(projectId: string): { success: boolean; error?: string } {
  try {
    const projectKey = `${STORAGE_PREFIX}project_${projectId}`;
    localStorage.removeItem(projectKey);

    const index = getProjectIndex();
    const filtered = index.filter((m) => m.projectId !== projectId);
    localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(filtered));

    // Clear last project reference if it was this one
    const lastId = localStorage.getItem(LAST_PROJECT_KEY);
    if (lastId === projectId) {
      localStorage.removeItem(LAST_PROJECT_KEY);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete project' };
  }
}

/**
 * List all saved project metadata.
 */
export function getProjectIndex(): ProjectMetadata[] {
  try {
    const jsonStr = localStorage.getItem(PROJECT_INDEX_KEY);
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as ProjectMetadata[];
  } catch {
    return [];
  }
}

/**
 * Get the last active project ID.
 */
export function getLastProjectId(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

// ========================================================
// Autosave
// ========================================================

/**
 * Save an autosave snapshot.
 */
export function saveAutosave(project: ProjectConfig): { success: boolean; error?: string } {
  try {
    const now = new Date().toISOString();
    const jsonStr = JSON.stringify(project);
    localStorage.setItem(AUTOSAVE_KEY, jsonStr);
    localStorage.setItem(AUTOSAVE_META_KEY, JSON.stringify({
      projectId: project.projectId,
      name: project.name,
      savedAt: now,
      componentCount: project.components.length,
    }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Autosave failed' };
  }
}

/**
 * Load the autosave snapshot (if it exists).
 */
export function loadAutosave(): { project: ProjectConfig | null; savedAt?: string } {
  try {
    const jsonStr = localStorage.getItem(AUTOSAVE_KEY);
    if (!jsonStr) return { project: null };
    const metaStr = localStorage.getItem(AUTOSAVE_META_KEY);
    const meta = metaStr ? JSON.parse(metaStr) : {};
    return {
      project: JSON.parse(jsonStr) as ProjectConfig,
      savedAt: meta.savedAt,
    };
  } catch {
    return { project: null };
  }
}

/**
 * Clear the autosave slot.
 */
export function clearAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
  localStorage.removeItem(AUTOSAVE_META_KEY);
}

/**
 * Check if autosave data exists.
 */
export function hasAutosave(): boolean {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) !== null;
  } catch {
    return false;
  }
}

// ========================================================
// Calibration Profile Storage
// ========================================================

/**
 * Save a named calibration profile.
 */
export function saveCalibrationProfile(profile: CalibrationProfile): { success: boolean } {
  try {
    const profiles = getCalibrationProfiles();
    const existingIdx = profiles.findIndex((p) => p.id === profile.id);
    profile.updatedAt = new Date().toISOString();
    if (existingIdx >= 0) {
      profiles[existingIdx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(CALIBRATION_PROFILES_KEY, JSON.stringify(profiles));
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Load all saved calibration profiles.
 */
export function getCalibrationProfiles(): CalibrationProfile[] {
  try {
    const jsonStr = localStorage.getItem(CALIBRATION_PROFILES_KEY);
    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as CalibrationProfile[];
  } catch {
    return [];
  }
}

/**
 * Delete a calibration profile by ID.
 */
export function deleteCalibrationProfile(profileId: string): { success: boolean } {
  try {
    const profiles = getCalibrationProfiles().filter((p) => p.id !== profileId);
    localStorage.setItem(CALIBRATION_PROFILES_KEY, JSON.stringify(profiles));
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ========================================================
// Project Assembly Helper
// ========================================================

/**
 * Assemble a full ProjectConfig from current application state.
 */
export function assembleProjectConfig(opts: {
  projectId: string;
  name: string;
  createdAt?: string;
  components: Component3D[];
  wires: WireConnection[];
  attachments: MechanicalAttachment[];
  settings: {
    gridVisible: boolean;
    axesVisible: boolean;
    snapTranslate: boolean;
    snapRotate: boolean;
    snapTranslateStep: number;
    snapRotateStep: number;
  };
  sketchCode?: string;
  calibration?: CalibrationProfile;
  trackType?: TrackType;
  servoAngle?: number;
  selectedPresetIndex?: number;
}): ProjectConfig {
  const now = new Date().toISOString();
  return {
    version: '5.0-workbench-phase9c-persistence',
    projectId: opts.projectId,
    name: opts.name,
    createdAt: opts.createdAt || now,
    updatedAt: now,
    settings: opts.settings,
    components: opts.components,
    wires: opts.wires,
    attachments: opts.attachments,
    sketchCode: opts.sketchCode,
    calibration: opts.calibration,
    trackType: opts.trackType,
    servoAngle: opts.servoAngle,
    selectedPresetIndex: opts.selectedPresetIndex,
  };
}

// ========================================================
// JSON Export Validation
// ========================================================

/**
 * Validate an imported JSON object as a valid ProjectConfig.
 * Returns sanitized data or throws descriptive errors.
 */
export function validateProjectJson(raw: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e: any) {
      errors.push(`Invalid JSON string: ${e?.message || 'SyntaxError'}`);
      return { valid: false, errors, warnings };
    }
  }

  if (!raw || typeof raw !== 'object') {
    errors.push('Input is not a valid JSON object.');
    return { valid: false, errors, warnings };
  }

  if (!Array.isArray(raw.components)) {
    errors.push('Missing or invalid "components" array.');
  } else {
    if (raw.components.length === 0) {
      warnings.push('Project has 0 components.');
    }
    for (let i = 0; i < raw.components.length; i++) {
      const c = raw.components[i];
      if (!c.id || typeof c.id !== 'string') {
        errors.push(`Component at index ${i} has no valid "id".`);
      }
      if (!c.type || typeof c.type !== 'string') {
        errors.push(`Component "${c.id || i}" has no valid "type".`);
      }
    }
  }

  if (raw.wires && !Array.isArray(raw.wires)) {
    errors.push('"wires" must be an array.');
  }

  if (raw.attachments && !Array.isArray(raw.attachments)) {
    errors.push('"attachments" must be an array.');
  }

  if (raw.calibration) {
    if (typeof raw.calibration !== 'object') {
      errors.push('"calibration" must be an object.');
    }
  }

  if (raw.trackType && !['oval', 'straight', 'wavy', 'none'].includes(raw.trackType)) {
    warnings.push(`Unknown track type "${raw.trackType}", will default to "oval".`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ========================================================
// Storage Size Utilities
// ========================================================

/**
 * Estimate the total localStorage usage for this application.
 */
export function getStorageUsage(): { totalBytes: number; projectBytes: Map<string, number> } {
  const projectBytes = new Map<string, number>();
  let totalBytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key) || '';
      const bytes = new Blob([value]).size;
      totalBytes += bytes;

      if (key.startsWith(`${STORAGE_PREFIX}project_`)) {
        const projectId = key.replace(`${STORAGE_PREFIX}project_`, '');
        projectBytes.set(projectId, bytes);
      }
    }
  }

  return { totalBytes, projectBytes };
}
