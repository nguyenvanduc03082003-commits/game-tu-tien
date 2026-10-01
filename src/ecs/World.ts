import { Entity, createEntityId, getNextEntityId, setNextEntityId } from './Entity.ts';
import { Component, ComponentConstructor } from './Component.ts';
import { System } from './System.ts';
import { TimeManager, TimeState, calendarDaysAtTick } from '../core/TimeManager.ts';

/**
 * ECSWorld - Bộ điều phối trung tâm của mô hình Entity Component System
 */
export class ECSWorld {
  public worldSeed: number = 8888;
  public birthOrdinal: number = 0;
  public timeState?: TimeState;
  private simulatedTicks: number = 0;
  private hasExplicitSimulatedTicks: boolean = false;
  private entities: Set<Entity> = new Set();
  // Map<ComponentType, Map<EntityId, ComponentInstance>>
  private componentStores: Map<ComponentConstructor, Map<Entity, Component>> = new Map();
  private systems: System[] = [];

  public getCurrentTick(): number {
    return this.hasExplicitSimulatedTicks
      ? this.simulatedTicks
      : TimeManager.getInstance().getTotalTicks();
  }

  public setCurrentTick(tick: number): void {
    this.hasExplicitSimulatedTicks = true;
    this.simulatedTicks = Math.max(0, Math.floor(tick));
  }

  public calendarDaysAtTick(tick?: number): number {
    const t = tick !== undefined ? tick : this.getCurrentTick();
    if (this.timeState) {
      return calendarDaysAtTick(this.timeState, t);
    }
    return TimeManager.getInstance().getCalendarDaysAtTick(t);
  }

  public calendarDayFloorAtTick(tick?: number): number {
    return Math.floor(this.calendarDaysAtTick(tick));
  }

  public createEntity(): Entity {
    const entity = createEntityId();
    this.entities.add(entity);
    return entity;
  }

  public createEntityWithId(entity: Entity): Entity {
    this.entities.add(entity);
    // BUG-08 fix: Đẩy global counter lên để tránh xung đột ID khi load save
    if (entity >= getNextEntityId()) {
      setNextEntityId(entity + 1);
    }
    return entity;
  }

  public destroyEntity(entity: Entity): void {
    if (!this.entities.has(entity)) return;

    // Xóa entity khỏi tất cả component stores
    for (const store of this.componentStores.values()) {
      store.delete(entity);
    }
    this.entities.delete(entity);
  }

  public addComponent<T extends Component>(entity: Entity, component: T): T {
    // BUG-17 fix: Kiểm tra entity tồn tại trước khi thêm component
    if (!this.entities.has(entity)) {
      console.warn(`[ECS] Cannot add component to non-existent entity ${entity}`);
      return component;
    }
    const ctor = component.constructor as ComponentConstructor<T>;
    let store = this.componentStores.get(ctor);
    if (!store) {
      store = new Map<Entity, Component>();
      this.componentStores.set(ctor, store);
    }
    store.set(entity, component);
    return component;
  }

  public getComponent<T extends Component>(entity: Entity, ctor: ComponentConstructor<T>): T | undefined {
    const store = this.componentStores.get(ctor);
    // The constructor key fixes the component type; storage itself is heterogeneous.
    return store?.get(entity) as T | undefined;
  }

  public hasComponent<T extends Component>(entity: Entity, ctor: ComponentConstructor<T>): boolean {
    const store = this.componentStores.get(ctor);
    return store ? store.has(entity) : false;
  }

  public removeComponent<T extends Component>(entity: Entity, ctor: ComponentConstructor<T>): void {
    const store = this.componentStores.get(ctor);
    if (store) {
      store.delete(entity);
    }
  }

  /**
   * Truy vấn tất cả các Entity sở hữu đầy đủ danh sách các Component yêu cầu
   */
  public query(componentTypes: ComponentConstructor[]): Entity[] {
    if (componentTypes.length === 0) return Array.from(this.entities);

    // Lấy store nhỏ nhất để duyệt tối ưu
    let smallestStore: Map<Entity, Component> | null = null;
    let minSize = Infinity;

    for (const ctor of componentTypes) {
      const store = this.componentStores.get(ctor);
      if (!store || store.size === 0) return []; // Không có entity nào thỏa mãn
      if (store.size < minSize) {
        minSize = store.size;
        smallestStore = store;
      }
    }

    if (!smallestStore) return [];

    const results: Entity[] = [];
    for (const entity of smallestStore.keys()) {
      let matches = true;
      for (const ctor of componentTypes) {
        const store = this.componentStores.get(ctor);
        if (!store || !store.has(entity)) {
          matches = false;
          break;
        }
      }
      if (matches) {
        results.push(entity);
      }
    }

    return results;
  }

  public addSystem(system: System): void {
    this.systems.push(system);
    // Sắp xếp theo thứ tự priority tăng dần (priority thấp chạy trước)
    this.systems.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    if (system.init) {
      system.init(this);
    }
  }

  public getSystem<T extends System>(name: string): T | undefined {
    return this.systems.find(s => s.name === name) as T | undefined;
  }

  public update(dt: number): void {
    if (dt > 0) {
      this.simulatedTicks += Math.max(1, Math.round(dt * 20));
    }
    const currentSystems = [...this.systems];
    for (const system of currentSystems) {
      if (system.enabled) {
        system.update(this, dt);
      }
    }
  }

  public getEntityCount(): number {
    return this.entities.size;
  }

  public clearEntities(): void {
    this.entities.clear();
    for (const store of this.componentStores.values()) {
      store.clear();
    }
    this.birthOrdinal = 0;
    this.simulatedTicks = 0;
    this.timeState = undefined;
  }

  /**
   * Thay thế toàn bộ thực thể và linh kiện hiện tại bằng dữ liệu từ một ECSWorld khác.
   * Giữ nguyên các System đang chạy trong thế giới hiện tại.
   */
  public replaceEntitiesFrom(other: ECSWorld): void {
    this.clearEntities();
    this.worldSeed = other.worldSeed;
    this.birthOrdinal = other.birthOrdinal;
    this.simulatedTicks = other.simulatedTicks;
    this.timeState = other.timeState;
    this.entities = new Set(other.entities);
    this.componentStores = new Map();
    for (const [ctor, store] of other.componentStores.entries()) {
      this.componentStores.set(ctor, new Map(store));
    }
  }

  public clearSystems(): void {
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy();
      }
    }
    this.systems = [];
  }

  public clear(): void {
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy();
      }
    }
    this.entities.clear();
    this.componentStores.clear();
    this.systems = [];
    this.birthOrdinal = 0;
    this.simulatedTicks = 0;
    this.timeState = undefined;
  }
}
