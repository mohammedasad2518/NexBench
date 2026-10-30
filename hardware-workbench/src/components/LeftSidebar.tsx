import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Zap, 
  CircleDot, 
  Cpu, 
  Microchip, 
  Lightbulb, 
  Radio,
  Sliders,
  SlidersHorizontal,
  Box,
  Shield,
  Eye,
  EyeOff,
  GitBranch,
  FolderOpen,
  Play,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Trash2,
  Wrench
} from 'lucide-react';
import { COMPONENT_CATALOG } from '../utils/componentCatalog';
import type { ComponentCategory, ComponentType, Component3D, MechanicalAttachment, WireConnection } from '../types/workbench';
import { EXAMPLE_PROJECT_TEMPLATES, type ExampleProjectTemplate } from '../utils/exampleProjects';
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

const CATEGORY_TABS: { id: ComponentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'structural', label: 'Structure' },
  { id: 'actuator', label: 'Motors' },
  { id: 'controller', label: 'Boards' },
  { id: 'output', label: 'Outputs' },
  { id: 'sensor', label: 'Sensors' },
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
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');

  // Filter Catalog
  const filteredCatalog = COMPONENT_CATALOG.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderCatalogIcon = (name: string) => {
    switch (name) {
      case 'Layers': return <Layers size={15} />;
      case 'Zap': return <Zap size={15} />;
      case 'CircleDot': return <CircleDot size={15} />;
      case 'Cpu': return <Cpu size={15} />;
      case 'Microchip': return <Microchip size={15} />;
      case 'Lightbulb': return <Lightbulb size={15} />;
      case 'Radio': return <Radio size={15} />;
      case 'Sliders': return <Sliders size={15} />;
      case 'Box': return <Box size={15} />;
      case 'Shield': return <Shield size={15} />;
      default: return <SlidersHorizontal size={15} />;
    }
  };

  // Build Hierarchy Tree
  // Identify parent-child attachments
  const childToParentMap = new Map<string, { parentId: string; mountId: string }>();
  const parentToChildrenMap = new Map<string, string[]>();

  attachments.forEach((att) => {
    childToParentMap.set(att.childComponentId, { parentId: att.parentComponentId, mountId: att.parentMountId });
    const currentChildren = parentToChildrenMap.get(att.parentComponentId) || [];
    currentChildren.push(att.childComponentId);
    parentToChildrenMap.set(att.parentComponentId, currentChildren);
  });

  // Root components are those that are not children of any attachment
  const rootComponents = components.filter((c) => !childToParentMap.has(c.id));

  if (isCollapsed) {
    return (
      <aside className="left-sidebar-collapsed">
        <button 
          className="sidebar-expand-btn" 
          onClick={onToggleCollapse} 
          title="Expand Left Sidebar (Components & Hierarchy)"
          id="btn-expand-left-sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
        <div className="collapsed-tab-icons">
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
            <span>Templates</span>
          </button>
        </div>

        <button 
          className="sidebar-collapse-toggle-btn"
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
              placeholder="Search components (Uno, Motor, Sonar)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-catalog-search"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="category-filter-chips">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`filter-chip ${selectedCategory === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Catalog Cards List */}
          <div className="catalog-list">
            {filteredCatalog.map((item) => (
              <div key={item.type} className="catalog-card-engineering">
                <div className="card-left">
                  <div className="card-icon-box" style={{ color: item.defaultColor }}>
                    {renderCatalogIcon(item.iconName)}
                  </div>
                  <div className="card-info">
                    <div className="card-name">{item.name}</div>
                    <div className="card-desc">{item.description}</div>
                  </div>
                </div>
                <button
                  className="card-add-btn"
                  onClick={() => onAddComponent(item.type)}
                  title={`Add ${item.name} to 3D scene`}
                  id={`btn-add-${item.type}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            ))}

            {filteredCatalog.length === 0 && (
              <div className="empty-search-state">
                No matching components found for "{searchQuery}".
              </div>
            )}
          </div>

          {/* Catalog Footer Helper */}
          <div className="sidebar-footer-hint">
            💡 Click <strong>+</strong> to spawn component at CAD origin.
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

          <div className="hierarchy-tree-container">
            {components.length === 0 ? (
              <div className="empty-search-state">
                No components in scene. Add parts from Catalog.
              </div>
            ) : (
              <div className="tree-list">
                {rootComponents.map((root) => {
                  const children = parentToChildrenMap.get(root.id) || [];
                  const isSelected = selectedId === root.id;

                  return (
                    <div key={root.id} className="tree-node-group">
                      {/* Root Item */}
                      <div 
                        className={`tree-node-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => onSelectComponent(root.id)}
                      >
                        <div className="tree-node-left">
                          <span className="tree-type-pill" style={{ backgroundColor: `${root.color}25`, color: root.color, borderColor: `${root.color}50` }}>
                            {root.type}
                          </span>
                          <span className="tree-node-label" title={root.name}>
                            {root.name}
                          </span>
                        </div>

                        <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                          {onToggleVisibility && (
                            <button
                              className="node-action-btn"
                              onClick={() => onToggleVisibility(root.id)}
                              title={root.visible !== false ? 'Hide component' : 'Show component'}
                            >
                              {root.visible !== false ? <Eye size={13} /> : <EyeOff size={13} style={{ color: '#ef4444' }} />}
                            </button>
                          )}
                          {onDeleteComponent && (
                            <button
                              className="node-action-btn delete-hover"
                              onClick={() => onDeleteComponent(root.id)}
                              title="Delete component"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attached Children */}
                      {children.length > 0 && (
                        <div className="tree-children-container">
                          {children.map((childId) => {
                            const childComp = components.find((c) => c.id === childId);
                            if (!childComp) return null;
                            const isChildSelected = selectedId === childComp.id;
                            const jointInfo = childToParentMap.get(childId);

                            return (
                              <div
                                key={childComp.id}
                                className={`tree-node-row child-node ${isChildSelected ? 'selected' : ''}`}
                                onClick={() => onSelectComponent(childComp.id)}
                              >
                                <div className="tree-node-left">
                                  <span className="tree-branch-line">└─</span>
                                  <span className="tree-type-pill" style={{ backgroundColor: `${childComp.color}25`, color: childComp.color, borderColor: `${childComp.color}50` }}>
                                    {childComp.type}
                                  </span>
                                  <span className="tree-node-label" title={childComp.name}>
                                    {childComp.name}
                                  </span>
                                </div>

                                <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                                  {jointInfo && (
                                    <span className="joint-tag" title={`Mounted to ${jointInfo.mountId}`}>
                                      <Wrench size={10} />
                                    </span>
                                  )}
                                  {onToggleVisibility && (
                                    <button
                                      className="node-action-btn"
                                      onClick={() => onToggleVisibility(childComp.id)}
                                      title={childComp.visible !== false ? 'Hide component' : 'Show component'}
                                    >
                                      {childComp.visible !== false ? <Eye size={13} /> : <EyeOff size={13} style={{ color: '#ef4444' }} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-footer-hint">
            Select an element to inspect transforms and terminal connections.
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: STARTER TEMPLATES */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <div className="sidebar-tab-content">
          <div className="sidebar-templates-list">
            {EXAMPLE_PROJECT_TEMPLATES.map((tmpl: ExampleProjectTemplate) => (
              <div key={tmpl.id} className="sidebar-template-card">
                <div className="template-card-top">
                  <span className="template-badge" style={{ backgroundColor: `${tmpl.badgeColor}20`, color: tmpl.badgeColor, borderColor: `${tmpl.badgeColor}40` }}>
                    {tmpl.thumbnailBadge}
                  </span>
                  <span className="template-meta-text">
                    {tmpl.config.components.length} parts
                  </span>
                </div>
                <div className="sidebar-template-name">{tmpl.title}</div>
                <div className="sidebar-template-desc">{tmpl.description}</div>

                <button
                  className="sidebar-template-load-btn"
                  onClick={() => onLoadTemplate(tmpl.config)}
                  id={`sidebar-launch-${tmpl.id}`}
                  style={{ borderColor: tmpl.badgeColor }}
                >
                  <Play size={12} fill={tmpl.badgeColor} style={{ color: tmpl.badgeColor }} />
                  <span>Load Project Template</span>
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-footer-hint">
            ⚠️ Loading a template replaces the active unsaved workspace.
          </div>
        </div>
      )}
    </aside>
  );
};
