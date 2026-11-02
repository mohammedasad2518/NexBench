import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Layers, 
  Zap, 
  Cpu, 
  Lightbulb, 
  Radio, 
  Box, 
  Eye, 
  EyeOff, 
  GitBranch, 
  FolderOpen, 
  Play, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Search, 
  Trash2, 
  X,
  Grid,
  Cable,
  Plug
} from 'lucide-react';
import { searchComponents, getCategoryCounts } from '../library/search';
import { getCategoryMetadata } from '../library/categories';
import type { HardwareCategory, HardwareSubcategory, HardwareComponentDefinition } from '../library/types';
import { ComponentThumbnail } from './ComponentThumbnail';
import type { ComponentType, Component3D, MechanicalAttachment, WireConnection } from '../types/workbench';
import { EXAMPLE_PROJECT_TEMPLATES } from '../utils/exampleProjects';
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

type SidebarTab = 'components' | 'hierarchy' | 'templates';

const CATEGORY_TABS: { id: HardwareCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'development_boards', label: 'Dev Boards', icon: Cpu },
  { id: 'basic_electronics', label: 'Electronics', icon: Zap },
  { id: 'prototyping', label: 'Breadboards', icon: Grid },
  { id: 'wires_cables', label: 'Wires', icon: Cable },
  { id: 'connectors_accessories', label: 'Connectors', icon: Plug },
  { id: 'actuator', label: 'Motors', icon: Box },
  { id: 'sensor', label: 'Sensors', icon: Radio },
  { id: 'structural', label: 'Structure', icon: Layers },
  { id: 'output', label: 'Outputs', icon: Lightbulb },
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
  const [activeTab, setActiveTab] = useState<SidebarTab>('components');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HardwareCategory | 'all'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<HardwareSubcategory | 'all'>('all');

  // Category counts
  const categoryCounts = useMemo(() => getCategoryCounts(), []);

  // Available subcategories for current category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const meta = getCategoryMetadata(selectedCategory);
    return meta?.subcategories || [];
  }, [selectedCategory]);

  // Filtered components using search engine
  const filteredComponents: HardwareComponentDefinition[] = useMemo(() => {
    return searchComponents({
      query: searchQuery,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      subcategory: selectedSubcategory === 'all' ? undefined : selectedSubcategory,
    });
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  const renderSimBadge = (level: string) => {
    switch (level) {
      case 'full':
        return <span className="sim-badge full" title="Fully executable in Arduino AST compiler and physics">⚡ AST Simulated</span>;
      case 'pin_mapping':
        return <span className="sim-badge pin" title="Verified pins and wiring telemetry mapped">📌 Pin Graph</span>;
      case 'basic':
        return <span className="sim-badge basic" title="Passive continuity and circuit node sharing">🔌 Continuity</span>;
      default:
        return <span className="sim-badge visual" title="3D CAD geometry and placement representation">📐 3D CAD</span>;
    }
  };

  // Build Hierarchy Tree
  const childToParentMap = new Map<string, { parentId: string; mountId: string }>();
  const parentToChildrenMap = new Map<string, string[]>();

  attachments.forEach((att) => {
    childToParentMap.set(att.childComponentId, {
      parentId: att.parentComponentId,
      mountId: att.parentMountId,
    });
    const children = parentToChildrenMap.get(att.parentComponentId) || [];
    children.push(att.childComponentId);
    parentToChildrenMap.set(att.parentComponentId, children);
  });

  const rootComponents = components.filter((c) => !childToParentMap.has(c.id));

  // Render collapsible compact bar when minimized
  if (isCollapsed) {
    return (
      <aside className="component-sidebar left-sidebar-collapsed">
        <button 
          className="collapsed-toggle-btn"
          onClick={onToggleCollapse}
          title="Expand Left Sidebar (Catalog & Scene)"
          id="btn-expand-left-sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
        <div className="collapsed-icon-strip">
          <button 
            className={`collapsed-icon-btn ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => { onToggleCollapse(); setActiveTab('components'); }}
            title="Component Catalog"
          >
            <Layers size={16} />
          </button>
          <button 
            className={`collapsed-icon-btn ${activeTab === 'hierarchy' ? 'active' : ''}`}
            onClick={() => { onToggleCollapse(); setActiveTab('hierarchy'); }}
            title="Scene Hierarchy"
          >
            <GitBranch size={16} />
          </button>
          <button 
            className={`collapsed-icon-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => { onToggleCollapse(); setActiveTab('templates'); }}
            title="Starter Templates"
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="component-sidebar left-sidebar-engineering">
      {/* Sidebar Top Header with Navigation Tabs & Collapse */}
      <div className="left-sidebar-header">
        <div className="sidebar-tab-pills">
          <button
            className={`sidebar-pill-btn ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
            id="tab-components-catalog"
          >
            <Layers size={13} />
            <span>Catalog</span>
          </button>
          <button
            className={`sidebar-pill-btn ${activeTab === 'hierarchy' ? 'active' : ''}`}
            onClick={() => setActiveTab('hierarchy')}
            id="tab-scene-hierarchy"
          >
            <GitBranch size={13} />
            <span>Tree</span>
            <span className="count-pill">{components.length}</span>
          </button>
          <button
            className={`sidebar-pill-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
            id="tab-starter-templates"
          >
            <FolderOpen size={13} />
            <span>Presets</span>
          </button>
        </div>
        <button
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          title="Collapse Sidebar"
          id="btn-collapse-left-sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: COMPONENT CATALOG */}
      {/* ============================================================ */}
      {activeTab === 'components' && (
        <div className="sidebar-tab-content">
          {/* Search Input Bar */}
          <div className="sidebar-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search (Uno, ESP32, Breadboard, Jumper)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-catalog-search"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="category-filter-chips">
            {CATEGORY_TABS.map((tab) => {
              const count = categoryCounts[tab.id as keyof typeof categoryCounts] ?? 0;
              return (
                <button
                  key={tab.id}
                  className={`filter-chip ${selectedCategory === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setSelectedSubcategory('all');
                  }}
                  title={tab.label}
                >
                  <span>{tab.label}</span>
                  <span className="count-tag" style={{ marginLeft: 4, opacity: 0.7, fontSize: '9px' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subcategory Filter Row (if active category has subcategories) */}
          {availableSubcategories.length > 0 && (
            <div className="subcategory-filter-row">
              <button
                className={`subcat-chip ${selectedSubcategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedSubcategory('all')}
              >
                All {getCategoryMetadata(selectedCategory as HardwareCategory)?.label}
              </button>
              {availableSubcategories.map((subcat) => (
                <button
                  key={subcat}
                  className={`subcat-chip ${selectedSubcategory === subcat ? 'active' : ''}`}
                  onClick={() => setSelectedSubcategory(subcat)}
                >
                  {subcat}
                </button>
              ))}
            </div>
          )}

          {/* Results Summary Strip */}
          <div className="catalog-stats-strip">
            <span>Showing {filteredComponents.length} component{filteredComponents.length === 1 ? '' : 's'}</span>
            <span>{categoryCounts.all} total registered</span>
          </div>

          {/* Catalog Cards List */}
          <div className="catalog-list">
            {filteredComponents.map((item) => (
              <div 
                key={item.id} 
                className="catalog-card-engineering"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.type);
                }}
              >
                <div className="card-left">
                  <div className="card-icon-box" style={{ background: '#090e1a', padding: 2 }}>
                    <ComponentThumbnail type={item.type} color={item.defaultColor} size={34} />
                  </div>
                  <div className="card-info">
                    <div className="card-name">{item.name}</div>
                    <div className="card-desc">{item.description}</div>
                    <div className="card-badges-row">
                      <span className="spec-badge">{item.badge}</span>
                      {renderSimBadge(item.simulation.level)}
                    </div>
                  </div>
                </div>
                <button
                  className="card-add-btn"
                  onClick={() => onAddComponent(item.type)}
                  title={`Place ${item.name} in 3D scene`}
                  id={`btn-add-${item.id}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            ))}

            {filteredComponents.length === 0 && (
              <div className="empty-search-state">
                <p>No components found matching "{searchQuery}".</p>
                <button 
                  className="filter-chip active"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  }}
                >
                  Clear search & filters
                </button>
              </div>
            )}
          </div>

          {/* Catalog Footer Helper */}
          <div className="sidebar-footer-hint">
            💡 Click <strong>+</strong> or drag onto the 3D grid to place parts.
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SCENE HIERARCHY TREE */}
      {/* ============================================================ */}
      {activeTab === 'hierarchy' && (
        <div className="sidebar-tab-content">
          <div className="hierarchy-stats-bar">
            <span><strong>{components.length}</strong> Components</span>
            <span>•</span>
            <span><strong>{attachments.length}</strong> Joints</span>
            <span>•</span>
            <span><strong>{wires.length}</strong> Wires</span>
          </div>

          <div className="hierarchy-tree-list">
            {rootComponents.length === 0 ? (
              <div className="empty-tree-state">
                <Box size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <p>Scene is empty.</p>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Add components from the Catalog to begin.</p>
              </div>
            ) : (
              rootComponents.map((comp) => renderComponentNode(comp, 0))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: STARTER TEMPLATES */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <div className="sidebar-tab-content">
          <div className="templates-intro-bar">
            <span>Pre-assembled blueprints ready for simulation:</span>
          </div>
          <div className="templates-list">
            {EXAMPLE_PROJECT_TEMPLATES.map((tmpl) => (
              <div key={tmpl.id} className="template-card">
                <div className="template-card-header">
                  <div className="template-title">{tmpl.title}</div>
                  <span className="template-badge">{tmpl.thumbnailBadge}</span>
                </div>
                <div className="template-desc">{tmpl.description}</div>
                <div className="template-meta">
                  <span>{tmpl.config.components.length} Parts</span>
                  <span>•</span>
                  <span>{(tmpl.config.wires || []).length} Wires</span>
                </div>
                <button
                  className="btn-load-template"
                  onClick={() => onLoadTemplate(tmpl.config)}
                  id={`btn-load-template-${tmpl.id}`}
                >
                  <Play size={13} />
                  <span>Load Blueprint</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );

  function renderComponentNode(comp: Component3D, depth: number): React.ReactNode {
    const isSelected = selectedId === comp.id;
    const childrenIds = parentToChildrenMap.get(comp.id) || [];
    const children = components.filter((c) => childrenIds.includes(c.id));

    return (
      <div key={comp.id} className="tree-node-wrapper" style={{ marginLeft: depth * 12 }}>
        <div 
          className={`tree-node-item ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelectComponent(comp.id)}
        >
          <div className="node-item-left">
            <span className="node-type-dot" style={{ backgroundColor: comp.color }} />
            <span className="node-name" title={comp.name}>{comp.name}</span>
          </div>

          <div className="node-item-actions" onClick={(e) => e.stopPropagation()}>
            {onToggleVisibility && (
              <button 
                className="node-action-btn"
                onClick={() => onToggleVisibility(comp.id)}
                title={comp.visible ? "Hide Component" : "Show Component"}
              >
                {comp.visible ? <Eye size={12} /> : <EyeOff size={12} style={{ color: '#ef4444' }} />}
              </button>
            )}
            {onDeleteComponent && (
              <button 
                className="node-action-btn delete"
                onClick={() => onDeleteComponent(comp.id)}
                title="Delete Component"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {children.map((child) => renderComponentNode(child, depth + 1))}
      </div>
    );
  }
};
