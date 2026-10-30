import type { 
  Component3D, 
  SceneConfig, 
  WireConnection, 
  MechanicalAttachment 
} from '../types/workbench';
import { detectCycle } from './assemblyDefinitions';

export function serializeScene(
  components: Component3D[],
  wires: WireConnection[] = [],
  attachments: MechanicalAttachment[] = [],
  settings: {
    gridVisible: boolean;
    axesVisible: boolean;
    snapTranslate: boolean;
    snapRotate: boolean;
    snapTranslateStep: number;
    snapRotateStep: number;
  },
  name: string = 'Untitled Robot Project',
  sketchCode?: string,
  trackType?: string,
  servoAngle?: number,
  calibration?: any,
  projectId?: string
): SceneConfig {
  return {
    version: '5.0-workbench-phase9c-persistence',
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings,
    components,
    wires,
    attachments,
    sketchCode,
    trackType,
    servoAngle,
    calibration,
    projectId,
  };
}

export function downloadSceneAsJson(scene: SceneConfig) {
  const jsonStr = JSON.stringify(scene, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = scene.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.href = url;
  a.download = `${safeName}-${Date.now().toString(36)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseSceneJson(rawJson: string): SceneConfig {
  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.components)) {
    throw new Error('Invalid scene JSON format: missing components array.');
  }

  const validComponents: Component3D[] = parsed.components.map((c: any) => ({
    id: c.id || `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: c.name || 'Component',
    type: c.type || 'chassis',
    category: c.category || 'structural',
    position: {
      x: Number(c.position?.x) || 0,
      y: Number(c.position?.y) || 0,
      z: Number(c.position?.z) || 0,
    },
    rotation: {
      x: Number(c.rotation?.x) || 0,
      y: Number(c.rotation?.y) || 0,
      z: Number(c.rotation?.z) || 0,
    },
    scale: {
      x: Number(c.scale?.x) || 1,
      y: Number(c.scale?.y) || 1,
      z: Number(c.scale?.z) || 1,
    },
    color: c.color || '#3b82f6',
    visible: c.visible ?? true,
    locked: !!c.locked,
    mass: typeof c.mass === 'number' ? c.mass : undefined,
    parentAttachmentId: c.parentAttachmentId || undefined,
    metadata: c.metadata || {},
  }));

  const componentIdSet = new Set(validComponents.map((c) => c.id));

  // Sanitize wires
  const validWires: WireConnection[] = [];
  const connectionKeySet = new Set<string>();

  if (Array.isArray(parsed.wires)) {
    for (const w of parsed.wires) {
      if (
        w &&
        typeof w.fromComponentId === 'string' &&
        typeof w.fromTerminalId === 'string' &&
        typeof w.toComponentId === 'string' &&
        typeof w.toTerminalId === 'string' &&
        componentIdSet.has(w.fromComponentId) &&
        componentIdSet.has(w.toComponentId)
      ) {
        const endA = `${w.fromComponentId}:${w.fromTerminalId}`;
        const endB = `${w.toComponentId}:${w.toTerminalId}`;
        const key = endA < endB ? `${endA}->${endB}` : `${endB}->${endA}`;

        if (!connectionKeySet.has(key)) {
          connectionKeySet.add(key);
          validWires.push({
            id: w.id || `wire_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            fromComponentId: w.fromComponentId,
            fromTerminalId: w.fromTerminalId,
            toComponentId: w.toComponentId,
            toTerminalId: w.toTerminalId,
            color: w.color || '#3b82f6',
            name: w.name || undefined,
          });
        }
      }
    }
  }

  // Sanitize mechanical attachments (Requirement 9 & 10)
  const validAttachments: MechanicalAttachment[] = [];
  const attachmentChildSet = new Set<string>();

  if (Array.isArray(parsed.attachments)) {
    for (const a of parsed.attachments) {
      if (
        a &&
        typeof a.parentComponentId === 'string' &&
        typeof a.parentMountId === 'string' &&
        typeof a.childComponentId === 'string' &&
        typeof a.childMountId === 'string' &&
        componentIdSet.has(a.parentComponentId) &&
        componentIdSet.has(a.childComponentId) &&
        a.parentComponentId !== a.childComponentId &&
        !attachmentChildSet.has(a.childComponentId) &&
        !detectCycle(a.childComponentId, a.parentComponentId, validAttachments)
      ) {
        attachmentChildSet.add(a.childComponentId);
        validAttachments.push({
          id: a.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          parentComponentId: a.parentComponentId,
          parentMountId: a.parentMountId,
          childComponentId: a.childComponentId,
          childMountId: a.childMountId,
          jointType: a.jointType === 'revolute' ? 'revolute' : 'fixed',
          motorSpeed: typeof a.motorSpeed === 'number' ? a.motorSpeed : 0,
          motorMaxForce: typeof a.motorMaxForce === 'number' ? a.motorMaxForce : 8.0,
          relativePosition: {
            x: Number(a.relativePosition?.x) || 0,
            y: Number(a.relativePosition?.y) || 0,
            z: Number(a.relativePosition?.z) || 0,
          },
          relativeRotation: {
            x: Number(a.relativeRotation?.x) || 0,
            y: Number(a.relativeRotation?.y) || 0,
            z: Number(a.relativeRotation?.z) || 0,
          },
        });
      }
    }
  }

  return {
    version: parsed.version || '3.0-workbench-physics-assembly',
    name: parsed.name || 'Imported Robot Project',
    createdAt: parsed.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      gridVisible: parsed.settings?.gridVisible ?? true,
      axesVisible: parsed.settings?.axesVisible ?? true,
      snapTranslate: parsed.settings?.snapTranslate ?? true,
      snapRotate: parsed.settings?.snapRotate ?? true,
      snapTranslateStep: parsed.settings?.snapTranslateStep ?? 0.5,
      snapRotateStep: parsed.settings?.snapRotateStep ?? 15,
    },
    components: validComponents,
    wires: validWires,
    attachments: validAttachments,
    sketchCode: typeof parsed.sketchCode === 'string' ? parsed.sketchCode : undefined,
    // Phase 9C: Restore persistence fields
    projectId: typeof parsed.projectId === 'string' ? parsed.projectId : undefined,
    calibration: parsed.calibration || undefined,
    trackType: typeof parsed.trackType === 'string' ? parsed.trackType : undefined,
    servoAngle: typeof parsed.servoAngle === 'number' ? parsed.servoAngle : undefined,
    selectedPresetIndex: typeof parsed.selectedPresetIndex === 'number' ? parsed.selectedPresetIndex : undefined,
  };
}
