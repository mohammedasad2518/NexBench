import { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { COMPONENT_CATALOG } from '../utils/componentCatalog';
import type { ComponentCategory, ComponentType } from '../types/workbench';

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType) => void;
}

const CATEGORY_TABS: { id: ComponentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'structural', label: 'Structure' },
  { id: 'actuator', label: 'Motors' },
  { id: 'controller', label: 'Boards' },
  { id: 'output', label: 'Outputs' },
  { id: 'sensor', label: 'Sensors' },
];

export const ComponentLibrary = ({ onAddComponent }: ComponentLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');

  const filteredItems = COMPONENT_CATALOG.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Layers': return <Layers size={18} />;
      case 'Zap': return <Zap size={18} />;
      case 'CircleDot': return <CircleDot size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'Microchip': return <Microchip size={18} />;
      case 'Lightbulb': return <Lightbulb size={18} />;
      case 'Radio': return <Radio size={18} />;
      case 'Sliders': return <Sliders size={18} />;
      case 'Box': return <Box size={18} />;
      case 'Shield': return <Shield size={18} />;
      default: return <SlidersHorizontal size={18} />;
    }
  };

  return (
    <aside className="component-sidebar">
      {/* Header with Search */}
      <div className="sidebar-header">
        <div className="sidebar-title">Component Catalog</div>
        <input
          type="text"
          className="search-input"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
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
        {filteredItems.map((item) => (
          <div key={item.type} className="catalog-card">
            <div className="card-left">
              <div className="card-icon-box" style={{ color: item.defaultColor }}>
                {renderIcon(item.iconName)}
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
            >
              <Plus size={16} />
            </button>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No matching components found.
          </div>
        )}
      </div>

      {/* Instructions footer */}
      <div style={{ 
        padding: '12px 14px', 
        borderTop: '1px solid var(--border-color)', 
        fontSize: '11px', 
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-panel-header)'
      }}>
        💡 Click <strong>+</strong> to spawn a component into the 3D scene.
      </div>
    </aside>
  );
};
