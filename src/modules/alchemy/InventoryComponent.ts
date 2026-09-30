import { Component } from '../../ecs/Component.ts';
import { PILL_DEFINITIONS, PillDefinition } from '../../config/pills.config.ts';

export class InventoryComponent implements Component {
  public pills: Map<string, number> = new Map();
  public maxPills: number = 20;

  constructor(initialPills?: Record<string, number>) {
    if (initialPills) {
      for (const [id, count] of Object.entries(initialPills)) {
        this.pills.set(id, count);
      }
    }
  }

  public addPill(pill: string | PillDefinition, count: number = 1): boolean {
    const id = typeof pill === 'string' ? pill : pill.id;
    const current = this.pills.get(id) || 0;
    this.pills.set(id, current + count);
    return true;
  }

  public hasPill(pillId: string): boolean {
    const count = this.pills.get(pillId) || 0;
    return count > 0;
  }

  public consumePill(pillId: string): PillDefinition | null {
    const count = this.pills.get(pillId) || 0;
    if (count <= 0) return null;

    if (count === 1) {
      this.pills.delete(pillId);
    } else {
      this.pills.set(pillId, count - 1);
    }

    return PILL_DEFINITIONS[pillId] || null;
  }

  public getPillsSummary(): { def: PillDefinition; count: number }[] {
    const list: { def: PillDefinition; count: number }[] = [];
    for (const [id, count] of this.pills.entries()) {
      const def = PILL_DEFINITIONS[id];
      if (def) {
        list.push({ def, count });
      }
    }
    return list;
  }
}
