import { useMemo, useState, useEffect } from 'react';
import { 
  Trash2, 
  Copy, 
  Box, 
  Layers,
  Palette,
  Zap,
  Cable,
  ArrowRight,
  Wrench,
  Unlink,
  RotateCw,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Sliders,
  Target,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  Info
} from 'lucide-react';
import { componentRegistry } from '../library/registry';
import type { 
  Component3D, 
  WireConnection, 
  MechanicalAttachment,
  SimulatedPin,
  RuntimeStatus
} from '../types/workbench';
import { getComponentTerminals, getTerminalCategoryColor } from '../utils/terminalDefinitions';
import { findMountPoint } from '../utils/assemblyDefinitions';
import { evaluateCircuitState } from '../utils/hardwareBridge';

interface PropertiesPanelProps {
  selectedComponent: Component3D | null;
  onUpdateComponent: (updated: Component3D) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  allComponents: Component3D[];
  onSelectComponent: (id: string | null) => void;
  // Wires
  wires: WireConnection[];
  selectedWireId: string | null;
  onSelectWire: (id: string | null) => void;
  onDeleteWire: (id: string) => void;
  onUpdateWire: (updated: WireConnection) => void;
  onStartWireFromTerminal: (componentId: string, terminalId: string) => void;
  // Attachments
  attachments: MechanicalAttachment[];
  onRemoveAttachment: (attachmentId: string) => void;
  onUpdateAttachment: (updated: MechanicalAttachment) => void;
  onStartAssemblyForComponent: (componentId: string) => void;
  // Phase 4B Hardware Bridge Props
  simulatedPins?: Record<number, SimulatedPin>;
  runtimeStatus?: RuntimeStatus;
  // Beginner-friendly Auto-connect workflow
  onAutoConnectUltrasonic?: (sensorId: string) => {
    success: boolean;
    message: string;
    addedWires: WireConnection[];
    alreadyConnectedCount: number;
    missingDetails?: string[];
  };
  onAutoConnectLineSensor?: (sensorId: string) => {
    success: boolean;
    message: string;
    addedWires: WireConnection[];
    alreadyConnectedCount: number;
    missingDetails?: string[];
  };
  // Redesign Layout Props
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COLOR_SWATCHES = [
  '#334155', // Slate
  '#eab308', // Amber/Yellow
  '#1e293b', // Dark Tire
  '#2563eb', // Blue Servo
  '#059669', // Emerald Arduino
  '#ef4444', // Red LED
  '#0284c7', // Sky Sonar
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#f8fafc', // White
];

const WIRE_COLOR_SWATCHES = [
  '#ef4444', // Red (Power)
  '#1e293b', // Black (Ground)
  '#3b82f6', // Blue (Digital)
  '#10b981', // Green (Signal)
  '#eab308', // Yellow
  '#06b6d4', // Cyan (Analog)
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#f8fafc', // White
];

export const PropertiesPanel = ({
  selectedComponent,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent,
  allComponents,
  onSelectComponent,
  wires,
  selectedWireId,
  onSelectWire,
  onDeleteWire,
  onUpdateWire,
  onStartWireFromTerminal,
  attachments,
  onRemoveAttachment,
  onUpdateAttachment,
  onStartAssemblyForComponent,
  simulatedPins,
  runtimeStatus,
  onAutoConnectUltrasonic,
  onAutoConnectLineSensor,
  isCollapsed = false,
  onToggleCollapse,
}: PropertiesPanelProps) => {
  const [autoConnectStatus, setAutoConnectStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    setAutoConnectStatus(null);
  }, [selectedComponent?.id]);

  // Phase 4B: Live Hardware Circuit Evaluation (Unconditional top-level hook)
  const circuitState = useMemo(() => {
    return evaluateCircuitState(
      allComponents,
      wires,
      attachments,
      simulatedPins || {},
      runtimeStatus || 'stopped'
    );
  }, [allComponents, wires, attachments, simulatedPins, runtimeStatus]);

  const selectedWire = wires.find((w) => w.id === selectedWireId) || null;

  if (isCollapsed) {
    return (
      <aside className="right-inspector-collapsed">
        <button
          className="inspector-expand-btn"
          onClick={onToggleCollapse}
          title="Expand Properties Inspector"
          id="btn-expand-right-panel"
        >
          <PanelRightOpen size={16} />
        </button>
      </aside>
    );
  }

  // 1. Selected Wire Inspector View
  if (selectedWire) {
    const fromComp = allComponents.find((c) => c.id === selectedWire.fromComponentId);
    const toComp = allComponents.find((c) => c.id === selectedWire.toComponentId);

    return (
      <aside className="properties-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Wire Inspector</div>
          <button
            className="action-btn"
            style={{ color: '#ef4444' }}
            onClick={() => onDeleteWire(selectedWire.id)}
            title="Delete this wire"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>

        <div className="prop-section">
          <div className="prop-section-title">
            <span>Connection Endpoints</span>
            <Cable size={14} />
          </div>

          <div className="wire-endpoints-card">
            <div className="endpoint-node">
              <span className="endpoint-comp">{fromComp?.name || 'Component A'}</span>
              <span className="endpoint-pin">Pin: {selectedWire.fromTerminalId}</span>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            <div className="endpoint-node">
              <span className="endpoint-comp">{toComp?.name || 'Component B'}</span>
              <span className="endpoint-pin">Pin: {selectedWire.toTerminalId}</span>
            </div>
          </div>
        </div>

        {/* Wire Color Customizer */}
        <div className="prop-section">
          <div className="prop-section-title">
            <span>Wire Sheath Color</span>
            <Palette size={14} />
          </div>
          <div className="color-swatches-grid">
            {WIRE_COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                className={`color-swatch-btn ${selectedWire.color === hex ? 'active' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => onUpdateWire({ ...selectedWire, color: hex })}
                title={hex}
              />
            ))}
          </div>
        </div>

        {/* Scene Wires Hierarchy */}
        <div className="prop-section" style={{ flex: 1 }}>
          <div className="prop-section-title">
            <span>All Wires ({wires.length})</span>
            <Zap size={14} />
          </div>
          <div className="scene-objects-list">
            {wires.map((wire) => {
              const src = allComponents.find((c) => c.id === wire.fromComponentId);
              const dst = allComponents.find((c) => c.id === wire.toComponentId);
              const isCurrent = wire.id === selectedWire.id;

              return (
                <div
                  key={wire.id}
                  className={`scene-object-item ${isCurrent ? 'selected' : ''}`}
                  onClick={() => onSelectWire(wire.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: wire.color,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }} />
                    <span style={{ fontSize: '11px' }}>
                      {src?.name || 'Part'}:{wire.fromTerminalId} ↔ {dst?.name || 'Part'}:{wire.toTerminalId}
                    </span>
                  </div>
                  <button
                    className="item-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWire(wire.id);
                    }}
                    title="Delete Wire"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  // 2. No Component Selected View
  if (!selectedComponent) {
    return (
      <aside className="properties-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Inspector & Scene</div>
        </div>

        <div className="empty-selection-placeholder">
          <Box size={36} style={{ opacity: 0.3 }} />
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>
            No Component Selected
          </div>
          <p style={{ fontSize: '11px', lineHeight: '1.4', maxWidth: '220px' }}>
            Click an object or wire in the 3D canvas or select one from the hierarchy below to inspect.
          </p>
        </div>

        {/* Scene Objects Hierarchy */}
        <div className="prop-section">
          <div className="prop-section-title">
            <span>Components ({allComponents.length})</span>
            <Layers size={14} />
          </div>

          <div className="scene-objects-list">
            {allComponents.map((comp) => (
              <div
                key={comp.id}
                className="scene-object-item"
                onClick={() => {
                  onSelectWire(null);
                  onSelectComponent(comp.id);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: comp.color 
                  }} />
                  <span>{comp.name}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {comp.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mechanical Attachments Hierarchy */}
        {attachments.length > 0 && (
          <div className="prop-section">
            <div className="prop-section-title">
              <span>Mechanical Joints ({attachments.length})</span>
              <Wrench size={14} />
            </div>
            <div className="scene-objects-list">
              {attachments.map((att) => {
                const parent = allComponents.find((c) => c.id === att.parentComponentId);
                const child = allComponents.find((c) => c.id === att.childComponentId);

                return (
                  <div
                    key={att.id}
                    className="scene-object-item"
                    onClick={() => {
                      onSelectWire(null);
                      onSelectComponent(att.childComponentId);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`joint-badge-mini ${att.jointType}`}>
                        {att.jointType === 'revolute' ? 'REV' : 'FIX'}
                      </span>
                      <span style={{ fontSize: '11px' }}>
                        {parent?.name || 'Parent'} ⬌ {child?.name || 'Child'}
                      </span>
                    </div>
                    <button
                      className="item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAttachment(att.id);
                      }}
                      title="Detach / Remove Joint"
                    >
                      <Unlink size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scene Wires List */}
        {wires.length > 0 && (
          <div className="prop-section" style={{ flex: 1 }}>
            <div className="prop-section-title">
              <span>Wires & Connections ({wires.length})</span>
              <Cable size={14} />
            </div>
            <div className="scene-objects-list">
              {wires.map((wire) => {
                const src = allComponents.find((c) => c.id === wire.fromComponentId);
                const dst = allComponents.find((c) => c.id === wire.toComponentId);

                return (
                  <div
                    key={wire.id}
                    className="scene-object-item"
                    onClick={() => {
                      onSelectComponent(null);
                      onSelectWire(wire.id);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: wire.color 
                      }} />
                      <span style={{ fontSize: '11px' }}>
                        {src?.name || 'Part'}:{wire.fromTerminalId} ↔ {dst?.name || 'Part'}:{wire.toTerminalId}
                      </span>
                    </div>
                    <button
                      className="item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWire(wire.id);
                      }}
                      title="Delete Wire"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    );
  }

  // 3. Selected Component View
  const terminals = getComponentTerminals(selectedComponent);
  const connectedWires = wires.filter(
    (w) => w.fromComponentId === selectedComponent.id || w.toComponentId === selectedComponent.id
  );

  // Check parent attachment
  const parentAttachment = attachments.find((a) => a.childComponentId === selectedComponent.id);
  const parentComp = parentAttachment 
    ? allComponents.find((c) => c.id === parentAttachment.parentComponentId) 
    : null;
  const parentMount = parentComp && parentAttachment 
    ? findMountPoint(parentComp, parentAttachment.parentMountId) 
    : null;

  // Check child attachments
  const childAttachments = attachments.filter((a) => a.parentComponentId === selectedComponent.id);

  const ledState = selectedComponent ? circuitState.leds.get(selectedComponent.id) : undefined;
  const motorState = selectedComponent ? circuitState.motors.get(selectedComponent.id) : undefined;
  const ultrasonicState = selectedComponent ? circuitState.ultrasonics.get(selectedComponent.id) : undefined;
  const potState = selectedComponent ? circuitState.potentiometers.get(selectedComponent.id) : undefined;
  const lineSensorState = selectedComponent ? circuitState.lineSensors?.get(selectedComponent.id) : undefined;

  return (
    <aside className="properties-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">Component Inspector</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {onToggleCollapse && (
            <button
              className="sidebar-collapse-toggle-btn"
              onClick={onToggleCollapse}
              title="Collapse Inspector"
              id="btn-collapse-right-panel"
            >
              <PanelRightClose size={15} />
            </button>
          )}
          <button
            className="action-btn"
            onClick={() => onDuplicateComponent(selectedComponent.id)}
            title="Duplicate Component"
          >
            <Copy size={13} />
          </button>
          <button
            className="action-btn"
            style={{ color: '#ef4444' }}
            onClick={() => onDeleteComponent(selectedComponent.id)}
            title="Delete Component"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Component Name & Identity */}
      <div className="prop-section">
        <div className="prop-field" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ margin: 0 }}>Active Component</label>
            <button
              onClick={() => onSelectComponent(null)}
              style={{ fontSize: '10px', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              title="Return to full scene hierarchy"
            >
              Scene Overview
            </button>
          </div>
          <select
            className="prop-input"
            value={selectedComponent.id}
            onChange={(e) => onSelectComponent(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {allComponents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div className="prop-field">
          <label>Rename</label>
          <input
            type="text"
            className="prop-input"
            value={selectedComponent.name}
            onChange={(e) => onUpdateComponent({ ...selectedComponent, name: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <span className="badge" style={{ textTransform: 'capitalize' }}>
            {selectedComponent.type.replace('_', ' ')}
          </span>
          <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
            {selectedComponent.category}
          </span>
        </div>
      </div>

      {/* Engineering Specifications & Component Metadata */}
      {(() => {
        const def = componentRegistry.get(selectedComponent.type);
        if (!def) return null;
        return (
          <div className="prop-section" style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px' }}>
            <div className="prop-section-title" style={{ color: '#38bdf8' }}>
              <span>Specifications & Metadata</span>
              <Info size={14} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#cbd5e1' }}>
              {def.manufacturer && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Manufacturer:</span>
                  <span style={{ fontWeight: 500 }}>{def.manufacturer}</span>
                </div>
              )}
              {def.boardFamily && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Family:</span>
                  <span style={{ fontWeight: 500 }}>{def.boardFamily}</span>
                </div>
              )}
              {def.dimensions && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Size (W×D×H):</span>
                  <span>{def.dimensions.widthMm} × {def.dimensions.depthMm} × {def.dimensions.heightMm} mm</span>
                </div>
              )}
              {def.electrical?.logicLevel && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Logic Level:</span>
                  <span style={{ color: def.electrical.logicLevel.includes('5.0V') ? '#ef4444' : '#38bdf8', fontWeight: 600 }}>
                    {def.electrical.logicLevel}
                  </span>
                </div>
              )}
              {def.electrical?.operatingVoltage && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Voltage:</span>
                  <span>{def.electrical.operatingVoltage}</span>
                </div>
              )}
              {def.electrical?.clockSpeedMhz && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Clock:</span>
                  <span>{def.electrical.clockSpeedMhz} MHz</span>
                </div>
              )}
              {def.electrical?.supportedInterfaces && def.electrical.supportedInterfaces.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Interfaces:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {def.electrical.supportedInterfaces.map((iface) => (
                      <span key={iface} className="spec-badge" style={{ fontSize: '8.5px' }}>{iface}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Simulation:</span>
                <span style={{ 
                  color: def.simulation.level === 'full' ? '#34d399' : def.simulation.level === 'pin_mapping' ? '#38bdf8' : '#fbbf24',
                  fontWeight: 600,
                  fontSize: '10px'
                }}>
                  {def.simulation.level === 'full' ? '⚡ Full AST Simulation' : def.simulation.level === 'pin_mapping' ? '📌 Pin Telemetry' : '🔌 Basic Connectivity'}
                </span>
              </div>
              {def.datasheetUrl && (
                <div style={{ marginTop: '4px' }}>
                  <a
                    href={def.datasheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    <span>View Official Datasheet</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Phase 4B: Virtual Hardware & Simulated Circuit Status */}
      {selectedComponent.type === 'led' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#10b981', fontWeight: 600 }}>Virtual Hardware Status</span>
            <Zap size={14} color="#10b981" />
          </div>

          {ledState?.isCircuitComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Control Pin:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                  Pin D{ledState.pinNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Illumination:</span>
                <strong style={{ 
                  color: ledState.intensity > 0 ? '#34d399' : 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono'
                }}>
                  {runtimeStatus === 'running'
                    ? ledState.intensity > 0 
                      ? `ILLUMINATED (${Math.round(ledState.intensity * 100)}%)` 
                      : 'OFF (LOW)'
                    : 'OFF (Runtime Stopped)'}
                </strong>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: ledState?.warning ? '#f59e0b' : 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              {ledState?.warning && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{ledState?.warning || 'Incomplete circuit: Wire Anode (+) to an Arduino digital pin and Cathode (-) to Ground.'}</span>
            </div>
          )}
        </div>
      )}

      {selectedComponent.type === 'dc_motor' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #eab308', paddingLeft: '8px', backgroundColor: 'rgba(234, 179, 8, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#eab308', fontWeight: 600 }}>Virtual Hardware Status</span>
            <Gauge size={14} color="#eab308" />
          </div>

          {motorState?.isCircuitComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Control Pin:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                  Pin D{motorState.pinNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Driven Speed:</span>
                <strong style={{ 
                  color: motorState.targetSpeed > 0 ? '#eab308' : 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono' 
                }}>
                  {runtimeStatus === 'running' 
                    ? `${motorState.targetSpeed.toFixed(1)} rad/s` 
                    : '0.0 rad/s (Stopped)'}
                </strong>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: motorState?.warning ? '#f59e0b' : 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              {motorState?.warning && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{motorState?.warning || 'Incomplete circuit: Wire Terminal (+) to a control pin (e.g. D5/D6) and Terminal (-) to Ground.'}</span>
            </div>
          )}
        </div>
      )}

      {selectedComponent.type === 'arduino' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '8px', backgroundColor: 'rgba(6, 182, 212, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>Virtual Arduino MCU</span>
            <Activity size={14} color="#06b6d4" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Runtime State:</span>
              <span style={{ 
                color: runtimeStatus === 'running' ? '#10b981' : runtimeStatus === 'error' ? '#ef4444' : 'var(--text-muted)', 
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {runtimeStatus || 'stopped'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Outputs:</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-main)' }}>
                {Object.values(simulatedPins || {}).filter(p => p.mode === 'OUTPUT').map(p => p.name).join(', ') || 'None (All Input)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedComponent.type === 'ultrasonic' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #0284c7', paddingLeft: '8px', backgroundColor: 'rgba(2, 132, 199, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#0284c7', fontWeight: 600 }}>Virtual Sonar Sensor (HC-SR04)</span>
            <Radio size={14} color="#0284c7" />
          </div>

          {/* Circuit Connection Status */}
          {ultrasonicState?.isCircuitComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit Status:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Connected (4-Wire)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Pins:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                  TRIG: D{ultrasonicState.trigPin} | ECHO: D{ultrasonicState.echoPin}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Simulated Echo Pulse:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#0284c7', fontWeight: 600 }}>
                  ~{ultrasonicState.pulseDurationUs} μs ({ultrasonicState.distanceCm} cm)
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: ultrasonicState?.warning ? '#f59e0b' : 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '10px' }}>
              {ultrasonicState?.warning && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{ultrasonicState?.warning || 'Incomplete circuit: Connect VCC (5V), GND, TRIG (e.g. D11), and ECHO (e.g. D12).'}</span>
            </div>
          )}

          {/* Beginner-friendly Auto-connect Action */}
          <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              id="auto-connect-sensor-btn"
              className="action-btn auto-connect-sensor-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #0369a1',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11.5px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
              onClick={() => {
                if (onAutoConnectUltrasonic) {
                  const res = onAutoConnectUltrasonic(selectedComponent.id);
                  setAutoConnectStatus({
                    type: res.success ? (res.addedWires.length > 0 ? 'success' : 'info') : 'error',
                    message: res.message,
                  });
                }
              }}
              title="Automatically connect VCC to 5V, GND to GND, TRIG to D11, and ECHO to D12 on the virtual Arduino board"
            >
              <Zap size={14} fill="#ffffff" />
              <span>Auto-connect Demo Sensor</span>
            </button>

            {/* Explanation or status feedback */}
            {autoConnectStatus ? (
              <div
                id="auto-connect-status-message"
                style={{
                  fontSize: '10.5px',
                  lineHeight: '1.4',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  backgroundColor:
                    autoConnectStatus.type === 'error'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : autoConnectStatus.type === 'success'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(2, 132, 199, 0.12)',
                  color:
                    autoConnectStatus.type === 'error'
                      ? '#ef4444'
                      : autoConnectStatus.type === 'success'
                        ? '#10b981'
                        : '#0284c7',
                  border: `1px solid ${
                    autoConnectStatus.type === 'error'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : autoConnectStatus.type === 'success'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(2, 132, 199, 0.3)'
                  }`,
                }}
              >
                {autoConnectStatus.type === 'error' ? (
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : autoConnectStatus.type === 'success' ? (
                  <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <Radio size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <span>{autoConnectStatus.message}</span>
              </div>
            ) : (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                ⚡ Auto-wires VCC → 5V, GND → GND, TRIG → D11, ECHO → D12 on the virtual Arduino board.
              </span>
            )}
          </div>

          {/* Phase 5B: Real-time 3D Raycasting & Visual Beam Mode Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', backgroundColor: 'rgba(2, 132, 199, 0.08)', borderRadius: '6px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={13} color="#0284c7" />
                Detection Mode:
              </span>
              <button
                type="button"
                className="action-btn"
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  fontWeight: 600,
                  backgroundColor: selectedComponent.metadata?.autoDistanceEnabled !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                  color: selectedComponent.metadata?.autoDistanceEnabled !== false ? '#10b981' : '#94a3b8',
                  borderColor: selectedComponent.metadata?.autoDistanceEnabled !== false ? '#10b981' : 'var(--border-subtle)',
                }}
                onClick={() => {
                  const currentAuto = selectedComponent.metadata?.autoDistanceEnabled !== false;
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      autoDistanceEnabled: !currentAuto,
                    },
                  });
                }}
              >
                {selectedComponent.metadata?.autoDistanceEnabled !== false ? '⚡ Real-Time 3D Raycasting' : '🔧 Manual Slider'}
              </button>
            </div>

            {/* Target Obstacle Readout */}
            {selectedComponent.metadata?.autoDistanceEnabled !== false && (
              <div style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: (selectedComponent.metadata?.distanceCm ?? 45) <= 25 ? '#ef4444' : '#38bdf8'
              }}>
                <Radio size={12} />
                <span>
                  Target: <strong>{selectedComponent.metadata?.detectedObstacleName || 'Open Space (Clear)'}</strong>
                </span>
              </div>
            )}

            {/* Detection Beam Cone Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} />
                3D Visual Sonar Cone:
              </span>
              <button
                type="button"
                className="action-btn"
                style={{
                  fontSize: '9px',
                  padding: '2px 8px',
                  backgroundColor: selectedComponent.metadata?.showRayBeam !== false ? 'rgba(2, 132, 199, 0.25)' : undefined,
                  borderColor: selectedComponent.metadata?.showRayBeam !== false ? '#0284c7' : undefined,
                }}
                onClick={() => {
                  const currentBeam = selectedComponent.metadata?.showRayBeam !== false;
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      showRayBeam: !currentBeam,
                    },
                  });
                }}
              >
                {selectedComponent.metadata?.showRayBeam !== false ? '👁️ Cone Visible' : 'Cone Hidden'}
              </button>
            </div>
          </div>

          {/* Simulated Obstacle Distance (Auto or Manual) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedComponent.metadata?.autoDistanceEnabled !== false ? 'Live 3D Raycast Distance:' : 'Manual Distance (2 - 400 cm):'}
              </span>
              <span style={{ 
                fontFamily: 'JetBrains Mono', 
                fontSize: '13px', 
                fontWeight: 700, 
                color: (selectedComponent.metadata?.distanceCm ?? 45) <= 25 ? '#ef4444' : '#0284c7' 
              }}>
                {selectedComponent.metadata?.distanceCm ?? 45} cm
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="range"
                min="2"
                max="400"
                step="1"
                className="speed-range"
                value={selectedComponent.metadata?.distanceCm ?? 45}
                onChange={(e) => {
                  const val = Math.max(2, Math.min(400, parseInt(e.target.value, 10) || 2));
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      distanceCm: val,
                      autoDistanceEnabled: false, // Switching slider automatically switches to manual mode
                    },
                  });
                }}
              />
              <input
                type="number"
                min="2"
                max="400"
                style={{
                  width: '56px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  backgroundColor: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: '4px',
                  color: 'var(--text-main, #f8fafc)'
                }}
                value={selectedComponent.metadata?.distanceCm ?? 45}
                onChange={(e) => {
                  const val = Math.max(2, Math.min(400, parseInt(e.target.value, 10) || 2));
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      distanceCm: val,
                      autoDistanceEnabled: false,
                    },
                  });
                }}
              />
            </div>

            {selectedComponent.metadata?.autoDistanceEnabled !== false && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ⚡ Auto-measuring from 3D objects in front of the sensor face. Move obstacle or switch to Manual to drag slider.
              </span>
            )}

            {/* Quick preset distance buttons (active for manual override or testing) */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[
                { label: 'Brake (10cm)', val: 10 },
                { label: 'Close (20cm)', val: 20 },
                { label: 'Med (50cm)', val: 50 },
                { label: 'Clear (120cm)', val: 120 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className="action-btn"
                  style={{
                    fontSize: '9px',
                    padding: '2px 4px',
                    flex: 1,
                    textAlign: 'center',
                    backgroundColor: (selectedComponent.metadata?.distanceCm ?? 45) === p.val ? 'rgba(2, 132, 199, 0.25)' : undefined,
                    borderColor: (selectedComponent.metadata?.distanceCm ?? 45) === p.val ? '#0284c7' : undefined,
                  }}
                  onClick={() => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: {
                        ...selectedComponent.metadata,
                        distanceCm: p.val,
                        autoDistanceEnabled: false, // Clicking preset switches to manual mode
                      },
                    });
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedComponent.type === 'potentiometer' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '8px', backgroundColor: 'rgba(6, 182, 212, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>Rotary Potentiometer (10kΩ)</span>
            <Sliders size={14} color="#06b6d4" />
          </div>

          {/* Circuit Connection Status */}
          {potState?.isCircuitComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Connected (Wiper to A{potState.wiperPin !== null ? potState.wiperPin - 14 : '?'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Analog Pin / Voltage:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                  Pin A{potState.wiperPin !== null ? potState.wiperPin - 14 : '?'} ({potState.voltage.toFixed(2)}V)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>ADC Raw Value:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#06b6d4', fontWeight: 600 }}>
                  {potState.potValue} / 1023 ({Math.round((potState.potValue / 1023) * 100)}%)
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: potState?.warning ? '#f59e0b' : 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '10px' }}>
              {potState?.warning && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{potState?.warning || 'Incomplete circuit: Wire VCC to 5V, GND to Ground, and Wiper to Analog Pin (A0-A5).'}</span>
            </div>
          )}

          {/* Interactive Potentiometer Knob Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                Analog Position (Wiper 0 - 1023):
              </span>
              <span style={{ 
                fontFamily: 'JetBrains Mono', 
                fontSize: '13px', 
                fontWeight: 700, 
                color: '#06b6d4' 
              }}>
                {selectedComponent.metadata?.potValue ?? 512} ({((((selectedComponent.metadata?.potValue ?? 512) / 1023) * 5.0)).toFixed(2)}V)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="1023"
                step="1"
                className="speed-range"
                value={selectedComponent.metadata?.potValue ?? 512}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(1023, parseInt(e.target.value, 10) || 0));
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      potValue: val,
                    },
                  });
                }}
              />
              <input
                type="number"
                min="0"
                max="1023"
                style={{
                  width: '56px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  backgroundColor: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: '4px',
                  color: 'var(--text-main, #f8fafc)'
                }}
                value={selectedComponent.metadata?.potValue ?? 512}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(1023, parseInt(e.target.value, 10) || 0));
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      potValue: val,
                    },
                  });
                }}
              />
            </div>

            {/* Quick preset positions */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[
                { label: '0% (0V)', val: 0 },
                { label: '25% (1.25V)', val: 256 },
                { label: '50% (2.5V)', val: 512 },
                { label: '75% (3.75V)', val: 768 },
                { label: '100% (5V)', val: 1023 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className="action-btn"
                  style={{
                    fontSize: '9px',
                    padding: '2px 4px',
                    flex: 1,
                    textAlign: 'center',
                    backgroundColor: (selectedComponent.metadata?.potValue ?? 512) === p.val ? 'rgba(6, 182, 212, 0.25)' : undefined,
                    borderColor: (selectedComponent.metadata?.potValue ?? 512) === p.val ? '#06b6d4' : undefined,
                  }}
                  onClick={() => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: {
                        ...selectedComponent.metadata,
                        potValue: p.val,
                      },
                    });
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase 8A: Virtual IR Line-Tracking Sensor Properties */}
      {selectedComponent.type === 'line_sensor' && (
        <div className="prop-section" style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '8px', backgroundColor: 'rgba(56, 189, 248, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>IR Reflectance Sensor (TCRT5000)</span>
            <Activity size={14} color="#38bdf8" />
          </div>

          {/* Circuit Connection Status */}
          {lineSensorState?.isCircuitComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Circuit Status:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Connected (4-Wire)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pins:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                  DO: D{lineSensorState.doPin ?? '?'} | AO: A{lineSensorState.aoPin !== null && lineSensorState.aoPin !== undefined ? lineSensorState.aoPin - 14 : '?'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Detected Surface:</span>
                <strong style={{ color: lineSensorState.digitalOutput === 1 ? '#ef4444' : '#34d399', fontFamily: 'JetBrains Mono' }}>
                  {lineSensorState.digitalOutput === 1 ? '● BLACK LINE (Low Reflectance)' : '○ WHITE FLOOR (High Reflectance)'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Analog ADC / Voltage:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 600 }}>
                  {lineSensorState.analogOutput} / 1023 (~{((lineSensorState.analogOutput / 1023) * 5.0).toFixed(2)}V)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Surface Reflectance:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-main)', fontWeight: 600 }}>
                  {Math.round(lineSensorState.reflectance * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: lineSensorState?.warning ? '#f59e0b' : 'var(--text-muted)', lineHeight: '1.4', display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '10px' }}>
              {lineSensorState?.warning && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <span>{lineSensorState?.warning || 'Incomplete circuit: Connect VCC (5V), GND, DO (Digital Out e.g. D4/D7), and AO (Analog Out e.g. A1/A2).'}</span>
            </div>
          )}

          {/* Auto-connect Action */}
          <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              id="auto-connect-line-sensor-btn"
              className="action-btn auto-connect-line-sensor-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: '1px solid #0369a1',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11.5px',
                width: '100%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
              onClick={() => {
                if (onAutoConnectLineSensor) {
                  const res = onAutoConnectLineSensor(selectedComponent.id);
                  setAutoConnectStatus({
                    type: res.success ? (res.addedWires.length > 0 ? 'success' : 'info') : 'error',
                    message: res.message,
                  });
                }
              }}
              title="Automatically connect VCC to 5V, GND to GND, and DO / AO to the appropriate Arduino pins"
            >
              <Zap size={14} fill="#ffffff" />
              <span>Auto-connect Line Sensor</span>
            </button>

            {/* Status feedback */}
            {autoConnectStatus && (
              <div
                style={{
                  fontSize: '10.5px',
                  lineHeight: '1.4',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  backgroundColor:
                    autoConnectStatus.type === 'success'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : autoConnectStatus.type === 'info'
                      ? 'rgba(6, 182, 212, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    autoConnectStatus.type === 'success'
                      ? '#10b981'
                      : autoConnectStatus.type === 'info'
                      ? '#06b6d4'
                      : '#ef4444'
                  }`,
                  color:
                    autoConnectStatus.type === 'success'
                      ? '#34d399'
                      : autoConnectStatus.type === 'info'
                      ? '#38bdf8'
                      : '#f87171',
                }}
              >
                {autoConnectStatus.type === 'success' && <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
                {autoConnectStatus.type === 'error' && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
                {autoConnectStatus.type === 'info' && <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <span>{autoConnectStatus.message}</span>
              </div>
            )}
          </div>

          {/* Configurable Threshold & Calibration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                DO Detection Threshold:
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                {selectedComponent.metadata?.lineSensorThreshold ?? 500} / 1023
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="900"
              step="10"
              className="speed-range"
              value={selectedComponent.metadata?.lineSensorThreshold ?? 500}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 500;
                onUpdateComponent({
                  ...selectedComponent,
                  metadata: {
                    ...selectedComponent.metadata,
                    lineSensorThreshold: val,
                  },
                });
              }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Trimpot sensitivity adjustment. Analog values above threshold produce DO = HIGH (black line detected).
            </span>
          </div>
        </div>
      )}

      {/* Phase 5B: 3D Obstacle Target Properties */}
      {(selectedComponent.type === 'obstacle_box' || selectedComponent.type === 'obstacle_wall') && (
        <div className="prop-section" style={{ borderLeft: '3px solid #d97706', paddingLeft: '8px', backgroundColor: 'rgba(217, 119, 6, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#d97706', fontWeight: 600 }}>
              {selectedComponent.type === 'obstacle_box' ? 'Cardboard Obstacle Box' : 'Obstacle Barrier Wall'}
            </span>
            <Box size={14} color="#d97706" />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0 }}>
              Movable physical obstacle in the 3D scene. The ultrasonic sensor will raycast directly against this object and measure its distance in real time.
            </p>
            <div style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.25)', 
              padding: '6px 8px', 
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono',
              fontSize: '11px',
              color: 'var(--text-main)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Center Pos:</span>
              <span style={{ color: '#f59e0b' }}>
                [{selectedComponent.position.x.toFixed(1)}, {selectedComponent.position.y.toFixed(1)}, {selectedComponent.position.z.toFixed(1)}]
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              💡 <strong>Interaction Tip:</strong> Use Translate Mode [W] to move this obstacle in front of the robot (local +Z). The ultrasonic sensor will automatically detect it and brake the motors when closer than 25 cm.
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Mechanical Assembly & Joints Section */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Mechanical Mounting & Joint</span>
          <Wrench size={14} />
        </div>

        {parentAttachment ? (
          <div className="attachment-card">
            <div className="attachment-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`joint-badge ${parentAttachment.jointType}`}>
                  {parentAttachment.jointType === 'revolute' ? 'Revolute Joint' : 'Fixed Joint'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>
                  Mounted to {parentComp?.name || 'Parent'}
                </span>
              </div>
              <button
                className="detach-btn"
                onClick={() => onRemoveAttachment(parentAttachment.id)}
                title="Detach component (removes joint without deleting part)"
              >
                <Unlink size={11} />
                <span>Detach</span>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Mount: <strong>{parentMount?.name || parentAttachment.parentMountId}</strong>
            </div>

            {/* Revolute Joint Motor Speed Configuration */}
            {parentAttachment.jointType === 'revolute' && (
              <div className="motor-control-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-cyan)' }}>
                    <Gauge size={13} />
                    <span>Motor Target Speed:</span>
                  </div>
                  <strong style={{ fontSize: '12px', color: 'var(--text-main)', fontFamily: 'JetBrains Mono' }}>
                    {parentAttachment.motorSpeed || 0} rad/s
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="1"
                    className="speed-range"
                    value={parentAttachment.motorSpeed || 0}
                    onChange={(e) =>
                      onUpdateAttachment({
                        ...parentAttachment,
                        motorSpeed: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <button
                    className="action-btn"
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() =>
                      onUpdateAttachment({
                        ...parentAttachment,
                        motorSpeed: parentAttachment.motorSpeed ? 0 : 15,
                      })
                    }
                    title="Toggle Motor On/Off"
                  >
                    <RotateCw size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              This component is currently free-floating. Attach it to a chassis or motor mount point.
            </p>
            <button
              className="attach-start-btn"
              onClick={() => onStartAssemblyForComponent(selectedComponent.id)}
            >
              <Wrench size={12} />
              <span>Attach to Parent Component...</span>
            </button>
          </div>
        )}

        {/* Attached Children */}
        {childAttachments.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Mounted Sub-assemblies ({childAttachments.length}):
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
              {childAttachments.map((ca) => {
                const childPart = allComponents.find((c) => c.id === ca.childComponentId);
                return (
                  <div key={ca.id} className="child-attachment-row">
                    <span style={{ fontSize: '11px' }}>
                      {childPart?.name || 'Attached Part'} ({ca.jointType})
                    </span>
                    <button
                      className="detach-mini-btn"
                      onClick={() => onRemoveAttachment(ca.id)}
                      title="Detach"
                    >
                      <Unlink size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Electrical Terminals & Pins Section */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Electrical Terminals ({terminals.length})</span>
          <Zap size={14} />
        </div>

        {terminals.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 0' }}>
            This structural part has no electrical terminals.
          </div>
        ) : (
          <div className="terminals-list">
            {terminals.map((term) => {
              const activeWires = connectedWires.filter(
                (w) =>
                  (w.fromComponentId === selectedComponent.id && w.fromTerminalId === term.id) ||
                  (w.toComponentId === selectedComponent.id && w.toTerminalId === term.id)
              );

              return (
                <div key={term.id} className="terminal-item-row">
                  <div className="terminal-info">
                    <span 
                      className="terminal-category-tag" 
                      style={{ backgroundColor: getTerminalCategoryColor(term.category) }}
                    >
                      {term.category}
                    </span>
                    <strong className="terminal-pin-name">{term.name}</strong>
                    {term.description && (
                      <span className="terminal-desc">{term.description}</span>
                    )}
                  </div>

                  <div className="terminal-actions">
                    {activeWires.length > 0 ? (
                      <span 
                        className="terminal-connected-tag"
                        onClick={() => onSelectWire(activeWires[0].id)}
                        title="Click to inspect connected wire"
                      >
                        {activeWires.length} wire{activeWires.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <button
                        className="wire-from-btn"
                        onClick={() => onStartWireFromTerminal(selectedComponent.id, term.id)}
                        title={`Start wire from pin ${term.name}`}
                      >
                        <Zap size={10} />
                        <span>Wire</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Position (X, Y, Z) */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Position (World Units)</span>
        </div>
        <div className="coord-group">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="coord-item">
              <span className={`coord-label axis-${axis}`}>{axis.toUpperCase()}</span>
              <input
                type="number"
                step="0.1"
                className="coord-input"
                value={Number(selectedComponent.position[axis].toFixed(2))}
                onChange={(e) =>
                  onUpdateComponent({
                    ...selectedComponent,
                    position: {
                      ...selectedComponent.position,
                      [axis]: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation (X, Y, Z Degrees) */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Rotation (Degrees)</span>
        </div>
        <div className="coord-group">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="coord-item">
              <span className={`coord-label axis-${axis}`}>{axis.toUpperCase()}</span>
              <input
                type="number"
                step="5"
                className="coord-input"
                value={Math.round(selectedComponent.rotation[axis])}
                onChange={(e) =>
                  onUpdateComponent({
                    ...selectedComponent,
                    rotation: {
                      ...selectedComponent.rotation,
                      [axis]: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scale (X, Y, Z) */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Scale</span>
        </div>
        <div className="coord-group">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis} className="coord-item">
              <span className={`coord-label axis-${axis}`}>{axis.toUpperCase()}</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                className="coord-input"
                value={Number(selectedComponent.scale[axis].toFixed(2))}
                onChange={(e) =>
                  onUpdateComponent({
                    ...selectedComponent,
                    scale: {
                      ...selectedComponent.scale,
                      [axis]: Math.max(0.1, parseFloat(e.target.value) || 1),
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Color Customizer */}
      <div className="prop-section">
        <div className="prop-section-title">
          <span>Color & Material</span>
          <Palette size={14} />
        </div>
        <div className="color-swatches-grid">
          {COLOR_SWATCHES.map((hex) => (
            <button
              key={hex}
              className={`color-swatch-btn ${selectedComponent.color === hex ? 'active' : ''}`}
              style={{ backgroundColor: hex }}
              onClick={() => onUpdateComponent({ ...selectedComponent, color: hex })}
              title={hex}
            />
          ))}
        </div>
      </div>

      {/* Scene Hierarchy List */}
      <div className="prop-section" style={{ flex: 1 }}>
        <div className="prop-section-title">
          <span>Scene Hierarchy ({allComponents.length})</span>
          <Layers size={14} />
        </div>

        <div className="scene-objects-list">
          {allComponents.map((comp) => (
            <div
              key={comp.id}
              className={`scene-object-item ${comp.id === selectedComponent.id ? 'selected' : ''}`}
              onClick={() => {
                onSelectWire(null);
                onSelectComponent(comp.id);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: comp.color 
                }} />
                <span>{comp.name}</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {comp.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
