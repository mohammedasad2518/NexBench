import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X,
  Box, 
  Layers, 
  Square, 
  CheckCircle2
} from 'lucide-react';
import { searchComponents, getCategoryCounts } from '../library/search';
import type { HardwareCategory, HardwareComponentDefinition } from '../library/types';
import { ComponentThumbnail } from './ComponentThumbnail';
import type { ComponentType, Component3D, MechanicalAttachment, WireConnection } from '../types/workbench';
import type { ProjectConfig } from '../utils/projectPersistence';

interface LeftSidebarProps {
  onAddComponent: (type: ComponentType) => void;
  components: Component3D[];
  selectedId: string | null;
  onSelectComponent: (id: string | null) => void;
  onToggleVisibility?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  attachments: MechanicalAttachment[];
  wires: WireConnection[];
  onLoadTemplate: (config: ProjectConfig) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type MainTab = 'parts' | 'shapes' | 'tasks';

const CATEGORY_PILLS: { id: HardwareCategory | 'all'; label: string; countFallback: number }[] = [
  { id: 'all', label: 'All', countFallback: 93 },
  { id: 'structural', label: 'Robots', countFallback: 2 },
  { id: 'development_boards', label: 'Microcontrollers', countFallback: 9 },
  { id: 'environmental_sensors', label: 'Sensors', countFallback: 21 },
  { id: 'basic_electronics', label: 'Electronics', countFallback: 22 },
  { id: 'prototyping', label: 'Prototyping', countFallback: 6 },
  { id: 'wires_cables', label: 'Wires', countFallback: 5 },
  { id: 'connectors_accessories', label: 'Accessories', countFallback: 6 },
];

const STARTER_TASKS = [
  { id: 1, title: 'Add Controller Board (ESP32 or Arduino)', done: false },
  { id: 2, title: 'Place Breadboard on the bench', done: false },
  { id: 3, title: 'Wire 5V / 3.3V power rails', done: false },
  { id: 4, title: 'Connect Common Ground (GND)', done: false },
  { id: 5, title: 'Add LED with 220Ω resistor', done: false },
  { id: 6, title: 'Add Temperature / DHT sensor', done: false },
  { id: 7, title: 'Add Gas / Air Quality sensor', done: false },
  { id: 8, title: 'Configure Soil Moisture / Rain plate', done: false },
  { id: 9, title: 'Attach DC Drive Motors to Chassis', done: false },
  { id: 10, title: 'Run Arduino Simulation with green button', done: false },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddComponent,
  components,
  selectedId,
  onSelectComponent,
  onToggleVisibility,
  onDeleteComponent,
  attachments,
  wires,
  onLoadTemplate,
  isCollapsed,
  onToggleCollapse,
}) => {
  void selectedId;
  void onSelectComponent;
  void onToggleVisibility;
  void onDeleteComponent;
  void attachments;
  void onLoadTemplate;

  const [activeTab, setActiveTab] = useState<MainTab>('parts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HardwareCategory | 'all'>('all');
  const [simulatedOnly, setSimulatedOnly] = useState(false);
  const [tasks, setTasks] = useState(STARTER_TASKS);
  void setTasks;

  // Dynamic category counts
  const categoryCounts = useMemo(() => getCategoryCounts(), []);

  // Filtered components
  const filteredComponents: HardwareComponentDefinition[] = useMemo(() => {
    let list = searchComponents({
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    if (simulatedOnly) {
      list = list.filter((c) => c.simulation.level === 'full' || c.simulation.level === 'basic');
    }
    return list;
  }, [searchQuery, selectedCategory, simulatedOnly]);

  // Evaluate task completion dynamically based on bench components
  const completedTasksCount = useMemo(() => {
    let count = 0;
    const hasBoard = components.some((c) => c.category === 'development_boards' || c.type === 'arduino');
    const hasBreadboard = components.some((c) => c.type.startsWith('breadboard'));
    const hasPowerWire = wires.some((w) => w.fromTerminalId.includes('5V') || w.toTerminalId.includes('5V') || w.fromTerminalId.includes('VCC'));
    const hasGndWire = wires.some((w) => w.fromTerminalId.includes('GND') || w.toTerminalId.includes('GND'));
    const hasLed = components.some((c) => c.type.startsWith('led'));
    const hasTemp = components.some((c) => c.type.startsWith('sensor_dht') || c.type.startsWith('sensor_ds18') || c.type.startsWith('sensor_lm35'));
    const hasGas = components.some((c) => c.type.startsWith('sensor_mq'));
    const hasSoilOrRain = components.some((c) => c.type === 'sensor_soil_moisture' || c.type === 'sensor_rain' || c.type === 'sensor_water_level');
    const hasMotor = components.some((c) => c.type === 'dc_motor');

    if (hasBoard) count++;
    if (hasBreadboard) count++;
    if (hasPowerWire) count++;
    if (hasGndWire) count++;
    if (hasLed) count++;
    if (hasTemp) count++;
    if (hasGas) count++;
    if (hasSoilOrRain) count++;
    if (hasMotor) count++;
    return count;
  }, [components, wires]);

  if (isCollapsed) {
    return (
      <aside className="bt-sidebar-collapsed">
        <button 
          className="collapsed-icon-btn" 
          onClick={onToggleCollapse}
          title="Open Parts Library"
        >
          <Layers size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="bt-left-sidebar">
      {/* 1. TOP TABS: Parts, Shapes, Tasks */}
      <div className="bt-sidebar-top-tabs">
        <button
          className={`bt-subtab-btn ${activeTab === 'parts' ? 'active' : ''}`}
          onClick={() => setActiveTab('parts')}
        >
          Parts
        </button>
        <button
          className={`bt-subtab-btn ${activeTab === 'shapes' ? 'active' : ''}`}
          onClick={() => setActiveTab('shapes')}
        >
          Shapes
        </button>
        <button
          className={`bt-subtab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks {completedTasksCount}/{tasks.length}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PARTS CATALOG                                         */}
      {/* ============================================================ */}
      {activeTab === 'parts' && (
        <div className="bt-parts-pane">
          {/* Header Title & Subtitle */}
          <div className="bt-pane-header">
            <h2 className="bt-pane-title">PARTS</h2>
            <p className="bt-pane-subtitle">Drag onto the bench, or click to add.</p>
          </div>

          {/* Search Input Box */}
          <div className="bt-search-container">
            <Search size={14} className="bt-search-glass" />
            <input
              type="text"
              className="bt-search-field"
              placeholder="Search parts: button, LED"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-bt-search"
            />
            {searchQuery && (
              <button className="bt-search-clear" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Horizontal Scrolling) */}
          <div className="bt-category-pills-row">
            {CATEGORY_PILLS.map((pill) => {
              const count = pill.id === 'all' 
                ? (categoryCounts['all'] || 93) 
                : (categoryCounts[pill.id as keyof typeof categoryCounts] ?? pill.countFallback);
              const isActive = selectedCategory === pill.id;
              return (
                <button
                  key={pill.id}
                  className={`bt-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(pill.id)}
                >
                  <span>{pill.label}</span>
                  <span className="bt-pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Simulated Only Checkbox */}
          <div className="bt-simulated-only-row">
            <label className="bt-checkbox-label">
              <input
                type="checkbox"
                checked={simulatedOnly}
                onChange={(e) => setSimulatedOnly(e.target.checked)}
              />
              <span>Simulated only</span>
            </label>
          </div>

          {/* Parts Count Subheader */}
          <div className="bt-parts-count-header">
            <span>{filteredComponents.length} PARTS</span>
          </div>

          {/* Components Grid / List */}
          <div className="bt-parts-grid">
            {filteredComponents.map((def) => {
              // Derive price or spec text for BenchTwin card footer
              const priceOrSpec = def.electrical?.operatingVoltage?.split(' ')[0] 
                || (def.category === 'development_boards' ? '$8' : def.category === 'basic_electronics' ? '$0.10' : '$2.50');

              return (
                <div
                  key={def.id}
                  className="bt-part-card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', def.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddComponent(def.type)}
                  title={`${def.name} — Click or drag onto bench`}
                >
                  <div className="bt-card-thumbnail-box">
                    <ComponentThumbnail type={def.type} size={48} />
                  </div>
                  <div className="bt-card-content">
                    <div className="bt-card-title">{def.name}</div>
                    <div className="bt-card-subtitle">
                      {def.subcategory || 'Simulated starter parts'}
                    </div>
                    <div className="bt-card-footer">
                      <span className="bt-simulated-tag">SIMULATED</span>
                      <span className="bt-card-price">{priceOrSpec}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SHAPES                                                */}
      {/* ============================================================ */}
      {activeTab === 'shapes' && (
        <div className="bt-parts-pane">
          <div className="bt-pane-header">
            <h2 className="bt-pane-title">SHAPES</h2>
            <p className="bt-pane-subtitle">CAD solids, holes, and mechanical primitives.</p>
          </div>

          <div className="bt-parts-grid">
            <div 
              className="bt-part-card" 
              onClick={() => onAddComponent('obstacle_box')}
              title="Add 3D Solid Box"
            >
              <div className="bt-card-thumbnail-box">
                <Box size={38} className="text-slate-600" />
              </div>
              <div className="bt-card-content">
                <div className="bt-card-title">Solid Box</div>
                <div className="bt-card-subtitle">Parametric Box Mesh</div>
                <div className="bt-card-footer">
                  <span className="bt-simulated-tag">SOLID</span>
                  <span className="bt-card-price">CAD</span>
                </div>
              </div>
            </div>

            <div 
              className="bt-part-card" 
              onClick={() => onAddComponent('obstacle_wall')}
              title="Add Perimeter Wall"
            >
              <div className="bt-card-thumbnail-box">
                <Layers size={38} className="text-slate-600" />
              </div>
              <div className="bt-card-content">
                <div className="bt-card-title">Obstacle Wall</div>
                <div className="bt-card-subtitle">Boundary / Reflective Barrier</div>
                <div className="bt-card-footer">
                  <span className="bt-simulated-tag">SOLID</span>
                  <span className="bt-card-price">CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: TASKS                                                 */}
      {/* ============================================================ */}
      {activeTab === 'tasks' && (
        <div className="bt-parts-pane">
          <div className="bt-pane-header">
            <h2 className="bt-pane-title">PROJECT TASKS</h2>
            <p className="bt-pane-subtitle">Engineering checklist for building circuits.</p>
          </div>

          <div className="bt-tasks-list">
            {tasks.map((task, idx) => {
              const isChecked = idx < completedTasksCount;
              return (
                <div key={task.id} className={`bt-task-item ${isChecked ? 'completed' : ''}`}>
                  <div className="bt-task-checkbox">
                    {isChecked ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                  </div>
                  <span className="bt-task-title">{task.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
