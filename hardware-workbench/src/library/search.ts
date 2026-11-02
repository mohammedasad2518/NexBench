import type { HardwareComponentDefinition, HardwareCategory, HardwareSubcategory } from './types';
import { componentRegistry } from './registry';

export interface ComponentSearchFilter {
  query?: string;
  category?: HardwareCategory | 'all';
  subcategory?: HardwareSubcategory | 'all';
  boardFamily?: string;
  tag?: string;
}

/**
 * Multi-attribute search across all registered hardware components.
 */
export function searchComponents(filter: ComponentSearchFilter): HardwareComponentDefinition[] {
  let items = componentRegistry.getAll();

  // 1. Filter by category
  if (filter.category && filter.category !== 'all') {
    items = items.filter((item) => item.category === filter.category);
  }

  // 2. Filter by subcategory
  if (filter.subcategory && filter.subcategory !== 'all') {
    items = items.filter((item) => item.subcategory === filter.subcategory);
  }

  // 3. Filter by board family
  if (filter.boardFamily) {
    const familyLower = filter.boardFamily.toLowerCase();
    items = items.filter((item) => item.boardFamily?.toLowerCase() === familyLower);
  }

  // 4. Filter by tag
  if (filter.tag) {
    const tagLower = filter.tag.toLowerCase();
    items = items.filter((item) => item.tags.some((t) => t.toLowerCase() === tagLower));
  }

  // 5. Text search query (fuzzy multi-term search)
  if (filter.query && filter.query.trim().length > 0) {
    const terms = filter.query.toLowerCase().trim().split(/\s+/);
    items = items.filter((item) => {
      const name = item.name.toLowerCase();
      const desc = item.description.toLowerCase();
      const type = item.type.toLowerCase();
      const subcat = item.subcategory.toLowerCase();
      const mfr = (item.manufacturer || '').toLowerCase();
      const family = (item.boardFamily || '').toLowerCase();
      const badge = (item.badge || '').toLowerCase();
      const tags = item.tags.join(' ').toLowerCase();

      return terms.every((term) => 
        name.includes(term) ||
        desc.includes(term) ||
        type.includes(term) ||
        subcat.includes(term) ||
        mfr.includes(term) ||
        family.includes(term) ||
        badge.includes(term) ||
        tags.includes(term)
      );
    });
  }

  return items;
}

/**
 * Get category item count map
 */
export function getCategoryCounts(): Record<HardwareCategory | 'all', number> {
  const all = componentRegistry.getAll();
  const counts: Record<string, number> = { all: all.length };

  for (const item of all) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  return counts as Record<HardwareCategory | 'all', number>;
}
