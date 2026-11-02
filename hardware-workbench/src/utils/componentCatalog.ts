import type { ComponentCatalogItem, ComponentType } from '../types/workbench';
import { componentRegistry } from '../library/registry';

// Dynamic catalog generated from the comprehensive Hardware Component Registry
export const COMPONENT_CATALOG: ComponentCatalogItem[] = componentRegistry.toLegacyCatalog();

export const getCatalogItem = (type: ComponentType | string): ComponentCatalogItem | undefined => {
  const def = componentRegistry.get(type);
  if (def) {
    return componentRegistry.toCatalogItem(def);
  }
  return COMPONENT_CATALOG.find((item) => item.type === type);
};
