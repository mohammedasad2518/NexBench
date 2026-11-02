import { useState } from 'react';
import { Plus } from 'lucide-react';
import { searchComponents } from '../library/search';
import { ComponentThumbnail } from './ComponentThumbnail';
import type { ComponentType } from '../types/workbench';
import type { HardwareCategory } from '../library/types';

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType) => void;
}

const CATEGORY_TABS: { id: HardwareCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'development_boards', label: 'Dev Boards' },
  { id: 'prototyping', label: 'Breadboards' },
  { id: 'wires_cables', label: 'Wires' },
  { id: 'connectors_accessories', label: 'Connectors' },
  { id: 'actuator', label: 'Motors' },
  { id: 'sensor', label: 'Sensors' },
  { id: 'structural', label: 'Structure' },
  { id: 'output', label: 'Outputs' },
];

export const ComponentLibrary = ({ onAddComponent }: ComponentLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HardwareCategory | 'all'>('all');

  const filteredItems = searchComponents({
    query: searchQuery,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

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
          <div key={item.id} className="catalog-card">
            <div className="card-left">
              <div className="card-icon-box" style={{ background: '#0b1120', padding: 2 }}>
                <ComponentThumbnail type={item.type} color={item.defaultColor} size={30} />
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
              id={`btn-add-${item.id}`}
            >
              <Plus size={16} />
            </button>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="empty-search-state">
            No matching components found.
          </div>
        )}
      </div>
    </aside>
  );
};
