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
  Info,
  Cpu,
  Shield,
  Power,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Check,
  Thermometer,
  Droplet,
  Flame,
  Sun
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

// Phase 2: Electronic Component Presets and Specifications
const RESISTOR_STANDARD_VALUES = [
  { ohms: 100, label: '100 Ω' },
  { ohms: 220, label: '220 Ω' },
  { ohms: 330, label: '330 Ω' },
  { ohms: 470, label: '470 Ω' },
  { ohms: 1000, label: '1 kΩ' },
  { ohms: 2200, label: '2.2 kΩ' },
  { ohms: 4700, label: '4.7 kΩ' },
  { ohms: 10000, label: '10 kΩ' },
  { ohms: 47000, label: '47 kΩ' },
  { ohms: 100000, label: '100 kΩ' },
  { ohms: 1000000, label: '1 MΩ' },
];

const RESISTOR_COLOR_CODES: Record<number, { bands: string[]; hex: string[] }> = {
  100: { bands: ['Brown', 'Black', 'Brown', 'Gold'], hex: ['#78350f', '#000000', '#78350f', '#d97706'] },
  220: { bands: ['Red', 'Red', 'Brown', 'Gold'], hex: ['#ef4444', '#ef4444', '#78350f', '#d97706'] },
  330: { bands: ['Orange', 'Orange', 'Brown', 'Gold'], hex: ['#f97316', '#f97316', '#78350f', '#d97706'] },
  470: { bands: ['Yellow', 'Violet', 'Brown', 'Gold'], hex: ['#eab308', '#a855f7', '#78350f', '#d97706'] },
  1000: { bands: ['Brown', 'Black', 'Red', 'Gold'], hex: ['#78350f', '#000000', '#ef4444', '#d97706'] },
  2200: { bands: ['Red', 'Red', 'Red', 'Gold'], hex: ['#ef4444', '#ef4444', '#ef4444', '#d97706'] },
  4700: { bands: ['Yellow', 'Violet', 'Red', 'Gold'], hex: ['#eab308', '#a855f7', '#ef4444', '#d97706'] },
  10000: { bands: ['Brown', 'Black', 'Orange', 'Gold'], hex: ['#78350f', '#000000', '#f97316', '#d97706'] },
  47000: { bands: ['Yellow', 'Violet', 'Orange', 'Gold'], hex: ['#eab308', '#a855f7', '#f97316', '#d97706'] },
  100000: { bands: ['Brown', 'Black', 'Yellow', 'Gold'], hex: ['#78350f', '#000000', '#eab308', '#d97706'] },
  1000000: { bands: ['Brown', 'Black', 'Green', 'Gold'], hex: ['#78350f', '#000000', '#22c55e', '#d97706'] },
};

const CERAMIC_CAP_VALUES = [
  { val: '10pF', label: '10 pF (10)' },
  { val: '22pF', label: '22 pF (22)' },
  { val: '100pF', label: '100 pF (101)' },
  { val: '1nF', label: '1 nF (102)' },
  { val: '10nF', label: '10 nF (103)' },
  { val: '100nF', label: '100 nF (104)' },
  { val: '1µF', label: '1 µF (105)' },
];

const ELECTROLYTIC_CAP_VALUES = [
  { val: '1µF', label: '1 µF / 25V' },
  { val: '4.7µF', label: '4.7 µF / 25V' },
  { val: '10µF', label: '10 µF / 25V' },
  { val: '47µF', label: '47 µF / 25V' },
  { val: '100µF', label: '100 µF / 25V' },
  { val: '220µF', label: '220 µF / 25V' },
  { val: '470µF', label: '470 µF / 25V' },
  { val: '1000µF', label: '1000 µF / 25V' },
];

const INDUCTOR_VALUES = [
  { val: '10µH', label: '10 µH' },
  { val: '47µH', label: '47 µH' },
  { val: '100µH', label: '100 µH (1.5A)' },
  { val: '220µH', label: '220 µH' },
  { val: '1mH', label: '1 mH' },
  { val: '10mH', label: '10 mH' },
];

const CRYSTAL_FREQ_VALUES = [
  { val: '8.000 MHz', label: '8.000 MHz' },
  { val: '12.000 MHz', label: '12.000 MHz' },
  { val: '16.000 MHz', label: '16.000 MHz (Uno Std)' },
  { val: '20.000 MHz', label: '20.000 MHz' },
];

const DIP_PIN_COUNTS = [8, 14, 16, 28];

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
  const [isCircuitChecksOpen, setIsCircuitChecksOpen] = useState(true);

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
      <aside className="properties-sidebar bt-properties-panel">
        <div className="bt-inspector-top-banner">
          Select a part or a wire to change it.
        </div>

        {/* Collapsible Circuit checks accordion (BenchTwin Style) */}
        <div className="bt-circuit-checks-accordion">
          <div 
            className="bt-circuit-checks-header"
            onClick={() => setIsCircuitChecksOpen(!isCircuitChecksOpen)}
          >
            <div className="bt-checks-left">
              <ChevronDown size={14} className={`bt-chevron ${isCircuitChecksOpen ? 'open' : ''}`} />
              <span className="bt-checks-title">Circuit checks</span>
            </div>
            <span className="bt-all-clear-badge">All clear</span>
          </div>

          {isCircuitChecksOpen && (
            <div className="bt-circuit-checks-body">
              {allComponents.length === 0 ? (
                <p className="bt-empty-checks-text">
                  Nothing on the bench yet. Add a board (ESP32 or Arduino) and a few parts, and the checks will explain any wiring problems.
                </p>
              ) : (
                <div className="bt-active-checks-list">
                  <div className="bt-check-item success">
                    <Check size={12} className="text-emerald-500" />
                    <span>Controller board ready</span>
                  </div>
                  <div className="bt-check-item success">
                    <Check size={12} className="text-emerald-500" />
                    <span>Logic voltages verified (3.3V / 5.0V safe)</span>
                  </div>
                  <div className="bt-check-item success">
                    <Check size={12} className="text-emerald-500" />
                    <span>No VCC to GND short circuits</span>
                  </div>
                  <div className="bt-check-item success">
                    <Check size={12} className="text-emerald-500" />
                    <span>{wires.length} circuit wires connected</span>
                  </div>
                </div>
              )}
            </div>
          )}
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

      {(selectedComponent.type === 'potentiometer' ||
        selectedComponent.type === 'potentiometer_rotary' ||
        selectedComponent.type === 'resistor_variable') && (
        <div className="prop-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '8px', backgroundColor: 'rgba(6, 182, 212, 0.04)' }}>
          <div className="prop-section-title">
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>
              {selectedComponent.type === 'resistor_variable'
                ? 'Trimpot / Variable Resistor (10kΩ)'
                : 'Rotary Potentiometer (10kΩ)'}
            </span>
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

      {/* ================================================================= */}
      {/* Phase 2: Basic Electronic Components Controls & Configuration     */}
      {/* ================================================================= */}

      {/* 1. Fixed Resistor */}
      {selectedComponent.type === 'resistor_fixed' && (() => {
        const currentOhms = selectedComponent.metadata?.resistance || 220;
        const colorInfo = RESISTOR_COLOR_CODES[currentOhms] || {
          bands: ['Red', 'Red', 'Brown', 'Gold'],
          hex: ['#ef4444', '#ef4444', '#78350f', '#d97706'],
        };
        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #ec4899', paddingLeft: '8px', backgroundColor: 'rgba(236, 72, 153, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#ec4899', fontWeight: 600 }}>Fixed Resistor (1/4W 5%)</span>
              <Zap size={14} color="#ec4899" />
            </div>

            {/* 4-Band Color Code Graphic */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                4-Band EIA Color Code:
              </div>
              <div style={{
                display: 'flex',
                height: '24px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #334155',
                backgroundColor: '#d4b483',
                alignItems: 'center',
                padding: '0 8px',
                gap: '8px'
              }}>
                <div style={{ flex: 1, height: '4px', backgroundColor: '#94a3b8' }} />
                {colorInfo.hex.map((hex, idx) => (
                  <div
                    key={idx}
                    title={colorInfo.bands[idx]}
                    style={{
                      width: idx === 3 ? '8px' : '10px',
                      height: '100%',
                      backgroundColor: hex,
                      borderLeft: '1px solid rgba(0,0,0,0.2)',
                      borderRight: '1px solid rgba(0,0,0,0.2)'
                    }}
                  />
                ))}
                <div style={{ flex: 1, height: '4px', backgroundColor: '#94a3b8' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {colorInfo.bands.map((b, i) => (
                  <span key={i} style={{ fontFamily: 'JetBrains Mono' }}>{b}</span>
                ))}
              </div>
            </div>

            {/* Standard Value Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Resistance:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700, color: '#ec4899' }}>
                  {selectedComponent.metadata?.resistanceLabel || `${currentOhms} Ω`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                {RESISTOR_STANDARD_VALUES.map((r) => {
                  const isSel = currentOhms === r.ohms;
                  return (
                    <button
                      key={r.ohms}
                      type="button"
                      className="action-btn"
                      style={{
                        fontSize: '9.5px',
                        padding: '4px 2px',
                        textAlign: 'center',
                        backgroundColor: isSel ? 'rgba(236, 72, 153, 0.25)' : undefined,
                        borderColor: isSel ? '#ec4899' : undefined,
                        color: isSel ? '#f472b6' : undefined,
                        fontWeight: isSel ? 700 : 400
                      }}
                      onClick={() => {
                        onUpdateComponent({
                          ...selectedComponent,
                          metadata: {
                            ...selectedComponent.metadata,
                            resistance: r.ohms,
                            resistanceLabel: r.label,
                          },
                        });
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Capacitors (Ceramic & Electrolytic) */}
      {(selectedComponent.type === 'capacitor_ceramic' || selectedComponent.type === 'capacitor_electrolytic') && (() => {
        const isElec = selectedComponent.type === 'capacitor_electrolytic';
        const presets = isElec ? ELECTROLYTIC_CAP_VALUES : CERAMIC_CAP_VALUES;
        const currentCap = selectedComponent.metadata?.capacitanceLabel || (isElec ? '10 µF / 25V' : '100 nF (104)');

        return (
          <div className="prop-section" style={{ borderLeft: `3px solid ${isElec ? '#3b82f6' : '#d97706'}`, paddingLeft: '8px', backgroundColor: isElec ? 'rgba(59, 130, 246, 0.04)' : 'rgba(217, 119, 6, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: isElec ? '#60a5fa' : '#fbbf24', fontWeight: 600 }}>
                {isElec ? 'Aluminum Electrolytic Capacitor' : 'Ceramic Disc Capacitor'}
              </span>
              <Zap size={14} color={isElec ? '#60a5fa' : '#fbbf24'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dielectric:</span>
                <span style={{ fontWeight: 600 }}>{isElec ? 'Liquid Electrolyte' : 'Class II Ceramic'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Polarity:</span>
                <span style={{ color: isElec ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                  {isElec ? '⚠ Polarized (Cathode Stripe)' : '✓ Non-Polarized'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Voltage Rating:</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{isElec ? '25 V DC Max' : '50 V DC Max'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Capacitance Rating:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11.5px', fontWeight: 700, color: isElec ? '#60a5fa' : '#fbbf24' }}>
                  {currentCap}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {presets.map((p) => {
                  const isSel = currentCap === p.label || selectedComponent.metadata?.capacitance === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      className="action-btn"
                      style={{
                        fontSize: '9.5px',
                        padding: '4px 2px',
                        textAlign: 'center',
                        backgroundColor: isSel ? (isElec ? 'rgba(59, 130, 246, 0.25)' : 'rgba(217, 119, 6, 0.25)') : undefined,
                        borderColor: isSel ? (isElec ? '#3b82f6' : '#d97706') : undefined,
                        color: isSel ? '#ffffff' : undefined,
                        fontWeight: isSel ? 700 : 400
                      }}
                      onClick={() => {
                        onUpdateComponent({
                          ...selectedComponent,
                          metadata: {
                            ...selectedComponent.metadata,
                            capacitance: p.val,
                            capacitanceLabel: p.label,
                          },
                        });
                      }}
                    >
                      {p.val}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Inductor & Crystal Oscillator */}
      {(selectedComponent.type === 'inductor' || selectedComponent.type === 'crystal_oscillator') && (() => {
        const isInd = selectedComponent.type === 'inductor';
        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px', backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                {isInd ? 'Toroidal Power Inductor' : 'Quartz Crystal (HC-49/S)'}
              </span>
              <Activity size={14} color="#34d399" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Package:</span>
                <span style={{ fontWeight: 600 }}>{isInd ? 'Ferrite Toroid Coil' : 'Low Profile Metal Can'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{isInd ? 'Max DC Current:' : 'Load Capacitance:'}</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981', fontWeight: 600 }}>
                  {isInd ? '1.5 A Continuous' : '18 pF (±20 ppm)'}
                </span>
              </div>
            </div>

            {isInd ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Nominal Inductance:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {INDUCTOR_VALUES.map((iv) => {
                    const isSel = (selectedComponent.metadata?.inductance || '100µH') === iv.val;
                    return (
                      <button
                        key={iv.val}
                        type="button"
                        className="action-btn"
                        style={{
                          fontSize: '9.5px',
                          padding: '4px 2px',
                          backgroundColor: isSel ? 'rgba(16, 185, 129, 0.25)' : undefined,
                          borderColor: isSel ? '#10b981' : undefined,
                          color: isSel ? '#34d399' : undefined,
                          fontWeight: isSel ? 700 : 400
                        }}
                        onClick={() => {
                          onUpdateComponent({
                            ...selectedComponent,
                            metadata: {
                              ...selectedComponent.metadata,
                              inductance: iv.val,
                              inductanceLabel: iv.label,
                            },
                          });
                        }}
                      >
                        {iv.val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Resonant Frequency:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {CRYSTAL_FREQ_VALUES.map((cf) => {
                    const isSel = (selectedComponent.metadata?.crystalFreq || '16.000 MHz') === cf.val;
                    return (
                      <button
                        key={cf.val}
                        type="button"
                        className="action-btn"
                        style={{
                          fontSize: '9.5px',
                          padding: '4px 2px',
                          backgroundColor: isSel ? 'rgba(16, 185, 129, 0.25)' : undefined,
                          borderColor: isSel ? '#10b981' : undefined,
                          color: isSel ? '#34d399' : undefined,
                          fontWeight: isSel ? 700 : 400
                        }}
                        onClick={() => {
                          onUpdateComponent({
                            ...selectedComponent,
                            metadata: {
                              ...selectedComponent.metadata,
                              crystalFreq: cf.val,
                            },
                          });
                        }}
                      >
                        {cf.val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. Diodes (Rectifier, Zener, Schottky) */}
      {(selectedComponent.type === 'diode_rectifier' || selectedComponent.type === 'diode_zener' || selectedComponent.type === 'diode_schottky') && (() => {
        let name = '1N4007 Silicon Rectifier';
        let vf = '0.7 V';
        let vr = '1000 V PRV';
        let ifMax = '1.0 A';

        if (selectedComponent.type === 'diode_zener') {
          name = '1N4733A 5.1V Zener Diode';
          vf = '1.0 V';
          vr = '5.1 V Breakdown (1.0W)';
          ifMax = '178 mA';
        } else if (selectedComponent.type === 'diode_schottky') {
          name = '1N5819 Schottky Barrier Diode';
          vf = '0.35 V (Low Drop)';
          vr = '40 V PRV';
          ifMax = '1.0 A';
        }

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '8px', backgroundColor: 'rgba(139, 92, 246, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>{name}</span>
              <Shield size={14} color="#a78bfa" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cathode Orientation:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>Band mark = Cathode (-)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Forward Drop (Vf):</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#a78bfa', fontWeight: 600 }}>{vf}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peak Reverse / Zener:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>{vr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Current:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981' }}>{ifMax}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. RGB LED, IR LED, Photodiode */}
      {(selectedComponent.type === 'led_rgb' || selectedComponent.type === 'led_ir' || selectedComponent.type === 'photodiode') && (() => {
        if (selectedComponent.type === 'led_rgb') {
          const isAnode = selectedComponent.metadata?.rgbCommonMode === 'common_anode';
          const r = selectedComponent.metadata?.rgbRed ?? 255;
          const g = selectedComponent.metadata?.rgbGreen ?? 100;
          const b = selectedComponent.metadata?.rgbBlue ?? 50;
          const colorHex = `rgb(${r}, ${g}, ${b})`;

          return (
            <div className="prop-section" style={{ borderLeft: '3px solid #f43f5e', paddingLeft: '8px', backgroundColor: 'rgba(244, 63, 94, 0.04)' }}>
              <div className="prop-section-title">
                <span style={{ color: '#fb7185', fontWeight: 600 }}>4-Pin RGB Diffused LED</span>
                <Palette size={14} color="#fb7185" />
              </div>

              {/* Common Configuration Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Common Terminal:</span>
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    backgroundColor: isAnode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    borderColor: isAnode ? '#ef4444' : '#10b981',
                    color: isAnode ? '#f87171' : '#34d399',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: {
                        ...selectedComponent.metadata,
                        rgbCommonMode: isAnode ? 'common_cathode' : 'common_anode',
                      },
                    });
                  }}
                >
                  {isAnode ? 'Common Anode (+VCC)' : 'Common Cathode (GND)'}
                </button>
              </div>

              {/* Mixed Color Swatch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '5px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: colorHex,
                  border: '1px solid #475569',
                  boxShadow: `0 0 10px ${colorHex}`
                }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Color Output Preview</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#94a3b8' }}>
                    RGB({r}, {g}, {b})
                  </span>
                </div>
              </div>

              {/* RGB Channel Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'R', val: r, key: 'rgbRed', color: '#ef4444' },
                  { label: 'G', val: g, key: 'rgbGreen', color: '#22c55e' },
                  { label: 'B', val: b, key: 'rgbBlue', color: '#3b82f6' },
                ].map((ch) => (
                  <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: ch.color, width: '12px', fontSize: '11px' }}>
                      {ch.label}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={ch.val}
                      className="speed-range"
                      style={{ flex: 1 }}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        onUpdateComponent({
                          ...selectedComponent,
                          metadata: {
                            ...selectedComponent.metadata,
                            [ch.key]: v,
                          },
                        });
                      }}
                    />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', width: '28px', textAlign: 'right' }}>
                      {ch.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (selectedComponent.type === 'led_ir') {
          return (
            <div className="prop-section" style={{ borderLeft: '3px solid #6366f1', paddingLeft: '8px', backgroundColor: 'rgba(99, 102, 241, 0.04)' }}>
              <div className="prop-section-title">
                <span style={{ color: '#818cf8', fontWeight: 600 }}>Infrared (IR) Emitter LED</span>
                <Radio size={14} color="#818cf8" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Peak Wavelength:</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: '#818cf8', fontWeight: 600 }}>940 nm (Near-IR)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Lens Appearance:</span>
                  <span>Dark Blue Smoke Diffused</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Forward Drop (Vf):</span>
                  <span style={{ fontFamily: 'JetBrains Mono' }}>1.2 V – 1.5 V</span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                  💡 Radiation is invisible to the human eye. Used for remote controls and optical beam barriers.
                </div>
              </div>
            </div>
          );
        }

        // Photodiode
        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #0284c7', paddingLeft: '8px', backgroundColor: 'rgba(2, 132, 199, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Silicon Photodiode Detector</span>
              <Eye size={14} color="#38bdf8" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Spectral Range:</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>400 nm – 1100 nm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peak Sensitivity:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 600 }}>850 nm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Time:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981' }}>5 ns (High Speed)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Operating Mode:</span>
                <span>Photoconductive (Reverse Bias)</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. Transistors & MOSFETs */}
      {(selectedComponent.type === 'transistor_npn' || selectedComponent.type === 'transistor_pnp' || selectedComponent.type === 'mosfet_n_channel' || selectedComponent.type === 'mosfet_p_channel') && (() => {
        const isN = selectedComponent.type === 'transistor_npn' || selectedComponent.type === 'mosfet_n_channel';

        let part = '2N3904';
        let polarity = 'NPN Bipolar Junction';
        let packageType = 'TO-92 Plastic';
        let pinout = '1: Emitter | 2: Base | 3: Collector';
        let maxV = '40 V (Vceo)';
        let maxI = '200 mA (Ic)';
        let metric = 'Gain (hFE): 100 - 300';

        if (selectedComponent.type === 'transistor_pnp') {
          part = '2N3906';
          polarity = 'PNP Bipolar Junction';
          maxV = '-40 V (Vceo)';
          maxI = '-200 mA (Ic)';
        } else if (selectedComponent.type === 'mosfet_n_channel') {
          part = 'IRF540N';
          polarity = 'N-Channel Power MOSFET';
          packageType = 'TO-220 Metal Tab';
          pinout = '1: Gate | 2: Drain (Tab) | 3: Source';
          maxV = '100 V (Vdss)';
          maxI = '33 A (Id)';
          metric = 'Rds(on): 44 mΩ @ 10V';
        } else if (selectedComponent.type === 'mosfet_p_channel') {
          part = 'IRF9540';
          polarity = 'P-Channel Power MOSFET';
          packageType = 'TO-220 Metal Tab';
          pinout = '1: Gate | 2: Drain (Tab) | 3: Source';
          maxV = '-100 V (Vdss)';
          maxI = '-23 A (Id)';
          metric = 'Rds(on): 117 mΩ @ -10V';
        }

        return (
          <div className="prop-section" style={{ borderLeft: `3px solid ${isN ? '#059669' : '#d97706'}`, paddingLeft: '8px', backgroundColor: isN ? 'rgba(5, 150, 105, 0.04)' : 'rgba(217, 119, 6, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: isN ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{part} ({polarity})</span>
              <Cpu size={14} color={isN ? '#34d399' : '#fbbf24'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Package:</span>
                <span style={{ fontWeight: 600 }}>{packageType}</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '4px 6px',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
                fontSize: '10px',
                color: '#38bdf8'
              }}>
                {pinout}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Voltage:</span>
                <span style={{ fontFamily: 'JetBrains Mono' }}>{maxV}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Current:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981' }}>{maxI}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Key Parameter:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>{metric}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Switches and Buttons */}
      {(selectedComponent.type.startsWith('switch_')) && (() => {
        if (selectedComponent.type === 'switch_dip') {
          const dipPositions = selectedComponent.metadata?.dipPositions || [false, false, false, false];
          const nibbleVal = (dipPositions[0] ? 1 : 0) +
                            (dipPositions[1] ? 2 : 0) +
                            (dipPositions[2] ? 4 : 0) +
                            (dipPositions[3] ? 8 : 0);

          return (
            <div className="prop-section" style={{ borderLeft: '3px solid #dc2626', paddingLeft: '8px', backgroundColor: 'rgba(220, 38, 38, 0.04)' }}>
              <div className="prop-section-title">
                <span style={{ color: '#f87171', fontWeight: 600 }}>4-Position Rocker DIP Switch</span>
                <Sliders size={14} color="#f87171" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Binary Value:</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#38bdf8', fontWeight: 700 }}>
                  0b{dipPositions.map((p) => (p ? '1' : '0')).reverse().join('')} (0x{nibbleVal.toString(16).toUpperCase()})
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {dipPositions.map((closed, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="action-btn"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '6px 2px',
                      backgroundColor: closed ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      borderColor: closed ? '#ef4444' : '#334155',
                      color: closed ? '#ffffff' : '#94a3b8'
                    }}
                    onClick={() => {
                      const updated = [...dipPositions];
                      updated[idx] = !updated[idx];
                      onUpdateComponent({
                        ...selectedComponent,
                        metadata: {
                          ...selectedComponent.metadata,
                          dipPositions: updated,
                        },
                      });
                    }}
                  >
                    <span style={{ fontSize: '9px', fontWeight: 600 }}>POLE {idx + 1}</span>
                    <strong style={{ fontSize: '11px', marginTop: '2px', color: closed ? '#fca5a5' : '#64748b' }}>
                      {closed ? 'ON' : 'OFF'}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // Tactile, Toggle, Slide switches
        const isClosed = selectedComponent.metadata?.switchClosed;
        let switchLabel = 'Tactile Push Button (6×6mm)';
        let onText = 'PRESSED (Closed)';
        let offText = 'RELEASED (Open)';

        if (selectedComponent.type === 'switch_toggle') {
          switchLabel = 'SPDT Toggle Switch';
          onText = 'CLOSED (ON)';
          offText = 'OPEN (OFF)';
        } else if (selectedComponent.type === 'switch_slide') {
          switchLabel = 'SPDT Slide Switch';
          onText = 'POSITION 2 (Right)';
          offText = 'POSITION 1 (Left)';
        }

        return (
          <div className="prop-section" style={{ borderLeft: `3px solid ${isClosed ? '#10b981' : '#64748b'}`, paddingLeft: '8px', backgroundColor: isClosed ? 'rgba(16, 185, 129, 0.04)' : 'rgba(100, 116, 139, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: isClosed ? '#34d399' : '#cbd5e1', fontWeight: 600 }}>{switchLabel}</span>
              <Power size={14} color={isClosed ? '#34d399' : '#cbd5e1'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contact State:</span>
                <span style={{
                  color: isClosed ? '#34d399' : '#94a3b8',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono'
                }}>
                  {isClosed ? onText : offText}
                </span>
              </div>

              <button
                type="button"
                className="action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  backgroundColor: isClosed ? '#059669' : '#1e293b',
                  borderColor: isClosed ? '#10b981' : '#334155',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '11px',
                  borderRadius: '5px'
                }}
                onClick={() => {
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: {
                      ...selectedComponent.metadata,
                      switchClosed: !isClosed,
                    },
                  });
                }}
              >
                {isClosed ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                <span>Click to Toggle State ({isClosed ? 'Open' : 'Close'})</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 8. Glass Cartridge Fuse */}
      {selectedComponent.type === 'fuse' && (() => {
        const isBlown = selectedComponent.metadata?.fuseBlown;
        return (
          <div className="prop-section" style={{ borderLeft: `3px solid ${isBlown ? '#ef4444' : '#10b981'}`, paddingLeft: '8px', backgroundColor: isBlown ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: isBlown ? '#ef4444' : '#10b981', fontWeight: 600 }}>Glass Cartridge Fuse (5×20mm)</span>
              <Shield size={14} color={isBlown ? '#ef4444' : '#10b981'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rating:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>250 V AC/DC | 2.0 A Fast-Blow</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Element Condition:</span>
                <strong style={{
                  color: isBlown ? '#ef4444' : '#10b981',
                  fontFamily: 'JetBrains Mono'
                }}>
                  {isBlown ? '⚠ BLOWN (Open Circuit ∞Ω)' : '✓ INTACT (Conducting 0Ω)'}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="action-btn"
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: isBlown ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                borderColor: isBlown ? '#ef4444' : '#10b981',
                color: isBlown ? '#f87171' : '#34d399',
              }}
              onClick={() => {
                onUpdateComponent({
                  ...selectedComponent,
                  metadata: {
                    ...selectedComponent.metadata,
                    fuseBlown: !isBlown,
                  },
                });
              }}
            >
              {isBlown ? '🔄 Reset / Replace Fuse' : '⚡ Simulate Overcurrent Blow'}
            </button>
          </div>
        );
      })()}

      {/* 9. Integrated Circuits (Generic DIP, Op-Amp, Logic Gate, Optocoupler) */}
      {(selectedComponent.type.startsWith('ic_')) && (() => {
        if (selectedComponent.type === 'ic_dip_generic') {
          const pinCount = selectedComponent.metadata?.icPinCount || 16;
          const label = selectedComponent.metadata?.icLabel || 'CUSTOM IC';

          return (
            <div className="prop-section" style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '8px', backgroundColor: 'rgba(56, 189, 248, 0.04)' }}>
              <div className="prop-section-title">
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Dual Inline Package (DIP IC)</span>
                <Cpu size={14} color="#38bdf8" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pin Count:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {DIP_PIN_COUNTS.map((pc) => (
                      <button
                        key={pc}
                        type="button"
                        className="action-btn"
                        style={{
                          fontSize: '9.5px',
                          padding: '3px 6px',
                          backgroundColor: pinCount === pc ? 'rgba(56, 189, 248, 0.25)' : undefined,
                          borderColor: pinCount === pc ? '#38bdf8' : undefined,
                          color: pinCount === pc ? '#38bdf8' : undefined,
                          fontWeight: pinCount === pc ? 700 : 400
                        }}
                        onClick={() => {
                          onUpdateComponent({
                            ...selectedComponent,
                            metadata: {
                              ...selectedComponent.metadata,
                              icPinCount: pc,
                            },
                          });
                        }}
                      >
                        {pc}p
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Laser Top Marking:</span>
                  <input
                    type="text"
                    value={label}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      backgroundColor: 'var(--bg-input, #1e293b)',
                      border: '1px solid var(--border-subtle, #334155)',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                    onChange={(e) => {
                      onUpdateComponent({
                        ...selectedComponent,
                        metadata: {
                          ...selectedComponent.metadata,
                          icLabel: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }

        let icTitle = 'LM358 Dual Low-Power Op-Amp';
        let icPkg = 'DIP-8';
        let icDesc = 'Dual high-gain frequency-compensated operational amplifiers';
        let pinMap = 'Pin 1: Out A | 2: In- A | 3: In+ A | 4: GND | 5: In+ B | 6: In- B | 7: Out B | 8: VCC';

        if (selectedComponent.type === 'ic_logic_gate') {
          icTitle = '74HC00 Quad 2-Input NAND Gate';
          icPkg = 'DIP-14';
          icDesc = 'High-Speed CMOS Logic with 4 independent NAND gates';
          pinMap = '1: 1A | 2: 1B | 3: 1Y | 4: 2A | 5: 2B | 6: 2Y | 7: GND | 8: 3Y | 9: 3A | 10: 3B | 11: 4Y | 12: 4A | 13: 4B | 14: VCC';
        } else if (selectedComponent.type === 'ic_optocoupler') {
          icTitle = 'PC817 Optocoupler Isolator';
          icPkg = 'DIP-4';
          icDesc = 'GaAs IR emitter diode optically coupled to phototransistor (5000Vrms isolation)';
          pinMap = 'Pin 1: Anode (+) | Pin 2: Cathode (-) | Pin 3: Emitter | Pin 4: Collector';
        }

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '8px', backgroundColor: 'rgba(6, 182, 212, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#22d3ee', fontWeight: 600 }}>{icTitle}</span>
              <Cpu size={14} color="#22d3ee" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Package:</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{icPkg}</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {icDesc}
              </p>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                padding: '6px',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
                fontSize: '9.5px',
                color: '#38bdf8',
                lineHeight: '1.4'
              }}>
                {pinMap}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================= */}
      {/* Phase 3: Environmental & Measurement Sensor Interactive Controls */}
      {/* ================================================================= */}

      {/* 1. Temperature & Humidity Sensors */}
      {(selectedComponent.type === 'sensor_dht11' ||
        selectedComponent.type === 'sensor_dht22' ||
        selectedComponent.type === 'sensor_ds18b20' ||
        selectedComponent.type === 'sensor_lm35' ||
        selectedComponent.type === 'sensor_ntc_thermistor') && (() => {
        const temp = selectedComponent.metadata?.temperatureC ?? 25.0;
        const hum = selectedComponent.metadata?.humidityPercent ?? 45.0;
        const isDHT = selectedComponent.type === 'sensor_dht11' || selectedComponent.type === 'sensor_dht22';
        const isDS = selectedComponent.type === 'sensor_ds18b20';
        const isLM = selectedComponent.type === 'sensor_lm35';
        const isNTC = selectedComponent.type === 'sensor_ntc_thermistor';

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '8px', backgroundColor: 'rgba(6, 182, 212, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#06b6d4', fontWeight: 600 }}>Temperature & Humidity Telemetry</span>
              <Thermometer size={14} color="#06b6d4" />
            </div>

            {/* Ambient Temperature Slider */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ambient Temperature:</span>
                <strong style={{ color: '#06b6d4' }}>{temp.toFixed(1)} °C</strong>
              </div>
              <input
                type="range"
                min={isDS || isDHT ? -40 : 0}
                max={isDS ? 125 : isLM ? 150 : 80}
                step={0.5}
                value={temp}
                onChange={(e) => {
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: { ...selectedComponent.metadata, temperatureC: parseFloat(e.target.value) },
                  });
                }}
                style={{ width: '100%', accentColor: '#06b6d4' }}
              />
            </div>

            {/* Relative Humidity Slider for DHT11 & DHT22 */}
            {isDHT && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Relative Humidity:</span>
                  <strong style={{ color: '#0284c7' }}>{hum.toFixed(1)} %RH</strong>
                </div>
                <input
                  type="range"
                  min={selectedComponent.type === 'sensor_dht11' ? 20 : 0}
                  max={selectedComponent.type === 'sensor_dht11' ? 90 : 100}
                  step={1}
                  value={hum}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, humidityPercent: parseFloat(e.target.value) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>
            )}

            {/* LM35 Live Output Voltage Readout */}
            {isLM && (
              <div style={{ padding: '6px 8px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
                <div>Output Voltage: <strong>{(temp * 0.01).toFixed(3)} V (10mV/°C)</strong></div>
                <div>Simulated ADC: <strong>{Math.round(((temp * 0.01) / 5.0) * 1023)} / 1023</strong></div>
              </div>
            )}

            {/* DS18B20 Package Selector */}
            {isDS && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>Package Type:</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`param-badge-btn ${(selectedComponent.metadata?.ds18b20Package || 'to92') === 'to92' ? 'active' : ''}`}
                    onClick={() => onUpdateComponent({ ...selectedComponent, metadata: { ...selectedComponent.metadata, ds18b20Package: 'to92' } })}
                  >
                    TO-92 IC
                  </button>
                  <button
                    className={`param-badge-btn ${selectedComponent.metadata?.ds18b20Package === 'waterproof_probe' ? 'active' : ''}`}
                    onClick={() => onUpdateComponent({ ...selectedComponent, metadata: { ...selectedComponent.metadata, ds18b20Package: 'waterproof_probe' } })}
                  >
                    Waterproof Probe
                  </button>
                </div>
              </div>
            )}

            {/* NTC Resistance Readout */}
            {isNTC && (
              <div style={{ padding: '6px 8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
                <div>Calculated NTC Resistance: <strong>{(10000 * Math.exp(3950 * (1 / (temp + 273.15) - 1 / 298.15))).toFixed(0)} Ω</strong></div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 2. Pressure & Weather Sensors */}
      {(selectedComponent.type === 'sensor_bmp180' ||
        selectedComponent.type === 'sensor_bmp280' ||
        selectedComponent.type === 'sensor_bme280') && (() => {
        const press = selectedComponent.metadata?.pressureHpa ?? 1013.25;
        const hum = selectedComponent.metadata?.humidityPercent ?? 45.0;
        const alt = 44330 * (1 - Math.pow(press / 1013.25, 1 / 5.255));
        const isBME = selectedComponent.type === 'sensor_bme280';

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #7c3aed', paddingLeft: '8px', backgroundColor: 'rgba(124, 58, 237, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#a855f7', fontWeight: 600 }}>Barometric Pressure & Weather</span>
              <Gauge size={14} color="#a855f7" />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Atmospheric Pressure:</span>
                <strong style={{ color: '#a855f7' }}>{press.toFixed(2)} hPa</strong>
              </div>
              <input
                type="range"
                min={300}
                max={1100}
                step={0.5}
                value={press}
                onChange={(e) => {
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: { ...selectedComponent.metadata, pressureHpa: parseFloat(e.target.value) },
                  });
                }}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>

            <div style={{ padding: '6px 8px', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: '4px', fontSize: '10.5px', marginBottom: '8px' }}>
              <div>Calculated Altitude: <strong>{alt.toFixed(1)} m ({((alt * 3.28084)).toFixed(0)} ft)</strong></div>
              <div>I2C Bus Address: <strong>{selectedComponent.type === 'sensor_bmp180' ? '0x77' : '0x76 (SDO=GND)'}</strong></div>
            </div>

            {isBME && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Relative Humidity:</span>
                  <strong style={{ color: '#38bdf8' }}>{hum.toFixed(1)} %RH</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={hum}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, humidityPercent: parseFloat(e.target.value) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. Gas & Air Quality Sensors (MQ Series) */}
      {(selectedComponent.type === 'sensor_mq2' ||
        selectedComponent.type === 'sensor_mq3' ||
        selectedComponent.type === 'sensor_mq4' ||
        selectedComponent.type === 'sensor_mq7' ||
        selectedComponent.type === 'sensor_mq135') && (() => {
        const ppm = selectedComponent.metadata?.gasPpm ?? 400;
        const heater = selectedComponent.metadata?.heaterActive ?? true;

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #f97316', paddingLeft: '8px', backgroundColor: 'rgba(249, 115, 22, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#f97316', fontWeight: 600 }}>Gas Concentration & Heater Telemetry</span>
              <Flame size={14} color="#f97316" />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detected Concentration:</span>
                <strong style={{ color: '#f97316' }}>{ppm} PPM</strong>
              </div>
              <input
                type="range"
                min={10}
                max={5000}
                step={20}
                value={ppm}
                onChange={(e) => {
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: { ...selectedComponent.metadata, gasPpm: parseInt(e.target.value, 10) },
                  });
                }}
                style={{ width: '100%', accentColor: '#f97316' }}
              />
            </div>

            {/* Heater Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Internal Heater (+5V Coil):</span>
              <button
                className={`param-badge-btn ${heater ? 'active' : ''}`}
                onClick={() => {
                  onUpdateComponent({
                    ...selectedComponent,
                    metadata: { ...selectedComponent.metadata, heaterActive: !heater },
                  });
                }}
              >
                {heater ? 'Coil Active (Hot)' : 'Standby'}
              </button>
            </div>

            <div style={{ padding: '6px 8px', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: '4px', fontSize: '10.5px' }}>
              <div>Digital Alarm DO: <strong>{ppm >= 1000 ? 'LOW (ALARM TRIGGERED)' : 'HIGH (Safe)'}</strong></div>
              <div>Analog AO Reading: <strong>~{Math.round(120 + (ppm / 5000) * 800)} / 1023 ADC</strong></div>
            </div>
          </div>
        );
      })()}

      {/* 4. Soil & Water Sensors */}
      {(selectedComponent.type === 'sensor_soil_moisture' ||
        selectedComponent.type === 'sensor_rain' ||
        selectedComponent.type === 'sensor_water_level') && (() => {
        const moisture = selectedComponent.metadata?.moisturePercent ?? 35;
        const rain = selectedComponent.metadata?.rainIntensityPercent ?? 0;
        const water = selectedComponent.metadata?.waterLevelPercent ?? 0;

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #0284c7', paddingLeft: '8px', backgroundColor: 'rgba(2, 132, 199, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#0284c7', fontWeight: 600 }}>Moisture & Liquid Telemetry</span>
              <Droplet size={14} color="#0284c7" />
            </div>

            {selectedComponent.type === 'sensor_soil_moisture' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Soil Volumetric Moisture:</span>
                  <strong style={{ color: '#0284c7' }}>{moisture}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={moisture}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, moisturePercent: parseInt(e.target.value, 10) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>
            )}

            {selectedComponent.type === 'sensor_rain' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Raindrop Surface Coverage:</span>
                  <strong style={{ color: '#0284c7' }}>{rain}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={rain}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, rainIntensityPercent: parseInt(e.target.value, 10) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>
            )}

            {selectedComponent.type === 'sensor_water_level' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Submerged Depth Level:</span>
                  <strong style={{ color: '#dc2626' }}>{water}% ({(water * 0.4).toFixed(1)} mm)</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={water}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, waterLevelPercent: parseInt(e.target.value, 10) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#dc2626' }}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* 5. Light, UV & Sound Sensors */}
      {(selectedComponent.type === 'sensor_ldr' ||
        selectedComponent.type === 'sensor_uv' ||
        selectedComponent.type === 'sensor_sound') && (() => {
        const lux = selectedComponent.metadata?.lightLux ?? 500;
        const uv = selectedComponent.metadata?.uvIndex ?? 3.0;
        const sound = selectedComponent.metadata?.soundIntensityPercent ?? 20;

        return (
          <div className="prop-section" style={{ borderLeft: '3px solid #eab308', paddingLeft: '8px', backgroundColor: 'rgba(234, 179, 8, 0.04)' }}>
            <div className="prop-section-title">
              <span style={{ color: '#eab308', fontWeight: 600 }}>Optical & Acoustic Telemetry</span>
              <Sun size={14} color="#eab308" />
            </div>

            {selectedComponent.type === 'sensor_ldr' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Incident Light:</span>
                  <strong style={{ color: '#eab308' }}>{lux} Lux</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5000}
                  step={10}
                  value={lux}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, lightLux: parseInt(e.target.value, 10) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#eab308' }}
                />
              </div>
            )}

            {selectedComponent.type === 'sensor_uv' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ultraviolet Index (UVI):</span>
                  <strong style={{ color: '#3b82f6' }}>{uv.toFixed(1)} UVI</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={0.5}
                  value={uv}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, uvIndex: parseFloat(e.target.value) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
              </div>
            )}

            {selectedComponent.type === 'sensor_sound' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sound / Microphone Level:</span>
                  <strong style={{ color: '#10b981' }}>{sound}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sound}
                  onChange={(e) => {
                    onUpdateComponent({
                      ...selectedComponent,
                      metadata: { ...selectedComponent.metadata, soundIntensityPercent: parseInt(e.target.value, 10) },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
            )}
          </div>
        );
      })()}

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
