export type EventCallback<T = any> = (data: T) => void;

/**
 * EventBus - Hệ thống truyền thông điệp bất đồng bộ tách rời giữa các hệ thống
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Trả về hàm hủy đăng ký
    return () => {
      this.off(event, callback);
    };
  }

  public off<T = any>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Lỗi khi xử lý sự kiện [${event}]:`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
