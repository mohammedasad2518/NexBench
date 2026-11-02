import type { HardwareComponentDefinition, HardwareCategory, HardwareSubcategory } from './types';
import type { ComponentCatalogItem, TerminalDefinition } from '../types/workbench';
import { DEVELOPMENT_BOARDS_DEFINITIONS } from './definitions/boards';
import { PROTOTYPING_DEFINITIONS } from './definitions/breadboards';
import { WIRES_DEFINITIONS } from './definitions/wires';
import { ACCESSORIES_DEFINITIONS } from './definitions/accessories';
import { PASSIVE_ELECTRONICS_DEFINITIONS } from './definitions/passives';
import { DIODES_LEDS_DEFINITIONS } from './definitions/diodesLeds';
import { SEMICONDUCTORS_DEFINITIONS } from './definitions/semiconductors';
import { SWITCHES_DEFINITIONS } from './definitions/switches';
import { LEGACY_DEFINITIONS } from './definitions/legacy';

// ============================================================================
// Phase 1 & 2 Component Registry: Singleton & Lookup Manager
// ============================================================================

class HardwareComponentRegistry {
  private components = new Map<string, HardwareComponentDefinition>();

  constructor() {
    this.registerAll([
      ...DEVELOPMENT_BOARDS_DEFINITIONS,
      ...PROTOTYPING_DEFINITIONS,
      ...WIRES_DEFINITIONS,
      ...ACCESSORIES_DEFINITIONS,
      ...PASSIVE_ELECTRONICS_DEFINITIONS,
      ...DIODES_LEDS_DEFINITIONS,
      ...SEMICONDUCTORS_DEFINITIONS,
      ...SWITCHES_DEFINITIONS,
      ...LEGACY_DEFINITIONS,
    ]);
  }

  /**
   * Register a component definition. Fails if duplicate ID exists.
   */
  public register(def: HardwareComponentDefinition): void {
    const validation = this.validate(def);
    if (!validation.valid) {
      throw new Error(`Invalid HardwareComponentDefinition [${def.id}]: ${validation.errors.join(', ')}`);
    }
    if (this.components.has(def.id) && this.components.get(def.id) !== def) {
      throw new Error(`Duplicate component registration for ID "${def.id}"`);
    }
    this.components.set(def.id, def);
    // Also index by type if different from ID
    if (def.type && def.type !== def.id && !this.components.has(def.type)) {
      this.components.set(def.type, def);
    }
  }

  /**
   * Register multiple component definitions
   */
  public registerAll(defs: HardwareComponentDefinition[]): void {
    for (const def of defs) {
      this.register(def);
    }
  }

  /**
   * Look up component by ID or type
   */
  public get(idOrType: string): HardwareComponentDefinition | undefined {
    return this.components.get(idOrType);
  }

  /**
   * Get all registered distinct component definitions
   */
  public getAll(): HardwareComponentDefinition[] {
    const seen = new Set<string>();
    const result: HardwareComponentDefinition[] = [];
    for (const def of this.components.values()) {
      if (!seen.has(def.id)) {
        seen.add(def.id);
        result.push(def);
      }
    }
    return result;
  }

  /**
   * Get components belonging to a specific category
   */
  public getByCategory(category: HardwareCategory): HardwareComponentDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  /**
   * Get components belonging to a specific subcategory
   */
  public getBySubcategory(subcategory: HardwareSubcategory | string): HardwareComponentDefinition[] {
    return this.getAll().filter((c) => c.subcategory === subcategory);
  }

  /**
   * Retrieve terminal definitions formatted for the wiring engine
   */
  public getTerminals(idOrType: string): TerminalDefinition[] {
    const def = this.get(idOrType);
    if (!def) return [];
    return def.pins.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      position: p.position,
      voltage: p.voltage,
      description: p.description,
    }));
  }

  /**
   * Validate a component definition against required schema rules
   */
  public validate(def: HardwareComponentDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!def.id || typeof def.id !== 'string') errors.push('Missing or invalid "id"');
    if (!def.type || typeof def.type !== 'string') errors.push('Missing or invalid "type"');
    if (!def.name || typeof def.name !== 'string') errors.push('Missing or invalid "name"');
    if (!def.category || typeof def.category !== 'string') errors.push('Missing or invalid "category"');
    if (!def.subcategory || typeof def.subcategory !== 'string') errors.push('Missing or invalid "subcategory"');
    if (!def.modelFactoryId || typeof def.modelFactoryId !== 'string') errors.push('Missing or invalid "modelFactoryId"');
    if (!def.dimensions || typeof def.dimensions.widthMm !== 'number') errors.push('Invalid dimensions');
    if (!def.defaultScale || typeof def.defaultScale.x !== 'number') errors.push('Invalid defaultScale');
    if (!Array.isArray(def.pins)) errors.push('"pins" must be an array');

    // Check pin uniqueness
    if (Array.isArray(def.pins)) {
      const pinIds = new Set<string>();
      for (const pin of def.pins) {
        if (!pin.id || typeof pin.id !== 'string') {
          errors.push(`Component "${def.id}" has a pin with missing ID`);
        } else if (pinIds.has(pin.id)) {
          errors.push(`Duplicate pin ID "${pin.id}" in component "${def.id}"`);
        } else {
          pinIds.add(pin.id);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to legacy ComponentCatalogItem for backward compatibility
   */
  public toCatalogItem(def: HardwareComponentDefinition): ComponentCatalogItem {
    return {
      type: def.type,
      name: def.name,
      category: def.category as any,
      description: def.description,
      defaultColor: def.defaultColor,
      defaultScale: def.defaultScale,
      iconName: def.iconName,
      badge: def.badge,
    };
  }

  /**
   * Convert entire registry to legacy catalog array
   */
  public toLegacyCatalog(): ComponentCatalogItem[] {
    return this.getAll().map((def) => this.toCatalogItem(def));
  }
}

/** Global singleton instance */
export const componentRegistry = new HardwareComponentRegistry();
