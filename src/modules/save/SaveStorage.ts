import { SaveData, SaveMetadata } from './SaveTypes.ts';

const DB_NAME = 'tu_tien_game_db';
const DB_VERSION = 1;
const STORE_NAME = 'save_slots';
const SAVE_PREFIX = 'tu_tien_save_';

interface StoredSaveRecord {
  id: string;
  metadata: SaveMetadata;
  payload: Uint8Array | string;
  compressed: boolean;
  timestamp: number;
}

/**
 * Nén chuỗi UTF-8 thành mảng byte gzip sử dụng CompressionStream
 */
export async function compressGzip(input: string): Promise<Uint8Array> {
  const rawBytes = new TextEncoder().encode(input);
  if (typeof CompressionStream === 'undefined') {
    return rawBytes;
  }
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(rawBytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  let totalLength = 0;
  for (const chunk of chunks) totalLength += chunk.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Giải nén mảng byte gzip hoặc chuỗi UTF-8 sử dụng DecompressionStream
 */
export async function decompressGzip(data: Uint8Array | ArrayBuffer | string): Promise<string> {
  if (typeof data === 'string') return data;
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes as any);
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    let totalLength = 0;
    for (const chunk of chunks) totalLength += chunk.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(result);
  }

  return new TextDecoder().decode(bytes);
}

/**
 * Lớp điều phối lưu trữ bản lưu đa tầng (IndexedDB + Nén gzip + Fallback memStore/localStorage)
 */
export class SaveStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  public static memStore: Map<string, { metadata: SaveMetadata; data: SaveData; payload?: Uint8Array | string }> = new Map();

  private static getDB(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB không khả dụng'));
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            this.dbPromise = null;
            reject(req.error);
          };
        } catch (e) {
          this.dbPromise = null;
          reject(e);
        }
      });
    }
    return this.dbPromise;
  }

  public static resetDB(): void {
    this.dbPromise = null;
  }

  /**
   * Lưu trữ bản lưu: Nén gzip và ghi vào IndexedDB.
   * Chỉ đưa vào memStore sau khi một nơi lưu trữ bền vững (IndexedDB hoặc localStorage) đã ghi thành công.
   * Dọn dẹp khóa cũ trong localStorage khi IndexedDB ghi thành công.
   */
  public static async putSlot(slotId: string, metadata: SaveMetadata, data: SaveData): Promise<void> {
    const jsonStr = JSON.stringify(data);
    let payload: Uint8Array | string = jsonStr;
    let isCompressed = false;

    // 1. Nén gzip giảm 85-95% dung lượng
    if (typeof CompressionStream !== 'undefined') {
      try {
        payload = await compressGzip(jsonStr);
        isCompressed = true;
      } catch (err) {
        console.warn('Không thể nén gzip, dùng chuỗi thô:', err);
        payload = jsonStr;
      }
    }

    // 2. Ghi vào IndexedDB (Chờ transaction.oncomplete để đảm bảo dữ liệu bền vững)
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredSaveRecord = {
          id: slotId,
          metadata,
          payload,
          compressed: isCompressed,
          timestamp: metadata.timestamp
        };
        const req = store.put(record);
        req.onerror = () => reject(req.error ?? new Error('Lỗi yêu cầu ghi IndexedDB'));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Lỗi giao dịch IndexedDB'));
        tx.onabort = () => reject(tx.error ?? new Error('Giao dịch IndexedDB bị hủy bỏ'));
      });

      // Nếu đã lưu an toàn vào IndexedDB, dọn dẹp bản lưu cồng kềnh trong localStorage để tránh đầy quota
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(SAVE_PREFIX + slotId);
        } catch (_) {}
      }

      // Chỉ đưa bản mới vào memStore sau khi IndexedDB đã ghi thành công
      this.memStore.set(slotId, { metadata, data, payload });
    } catch (e) {
      // Fallback: Môi trường không có IndexedDB (như Node.js tests) hoặc IndexedDB lỗi, lưu vào localStorage nếu có
      let savedToFallback = false;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(SAVE_PREFIX + slotId, typeof payload === 'string' ? payload : jsonStr);
          savedToFallback = true;
          this.memStore.set(slotId, { metadata, data, payload });
        } catch (lsErr: any) {
          throw new Error(`Lưu trữ thất bại: IndexedDB lỗi (${(e as any)?.message || e}) và localStorage cũng lỗi (${lsErr?.message || lsErr})`);
        }
      }

      if (!savedToFallback) {
        throw new Error(`Lưu trữ thất bại: IndexedDB lỗi (${(e as any)?.message || e}) và không có bộ lưu trữ fallback khả dụng`);
      }
    }
  }

  /**
   * Lấy dữ liệu bản lưu: Hòa giải giữa IndexedDB và localStorage fallback theo timestamp mới nhất.
   * Nếu fallback mới hơn bản cũ trong IndexedDB (do lần ghi trước bị rơi sang fallback), ưu tiên bản fallback.
   */
  public static async getSlot(slotId: string): Promise<SaveData | null> {
    // 1. Kiểm tra memStore
    const mem = this.memStore.get(slotId);
    if (mem && mem.data) {
      return mem.data;
    }

    let idbData: SaveData | null = null;
    let idbMeta: SaveMetadata | null = null;
    let idbTimestamp = -1;

    // 2. Thử lấy từ IndexedDB
    try {
      const db = await this.getDB();
      const record = await new Promise<StoredSaveRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(slotId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (record && record.payload) {
        let jsonStr: string;
        if (record.compressed && record.payload instanceof Uint8Array) {
          jsonStr = await decompressGzip(record.payload);
        } else if (record.payload instanceof Uint8Array) {
          jsonStr = new TextDecoder().decode(record.payload);
        } else {
          jsonStr = record.payload;
        }
        idbData = JSON.parse(jsonStr);
        idbMeta = record.metadata;
        idbTimestamp = record.metadata?.timestamp ?? record.timestamp ?? 0;
      }
    } catch (e) {
      // IndexedDB không khả dụng hoặc lỗi
    }

    // 3. Thử lấy từ localStorage fallback
    let fallbackData: SaveData | null = null;
    let fallbackTimestamp = -1;
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SAVE_PREFIX + slotId);
      if (raw) {
        try {
          fallbackData = JSON.parse(raw);
          if (fallbackData && fallbackData.metadata) {
            fallbackTimestamp = fallbackData.metadata.timestamp ?? 0;
          }
        } catch (e) {
          console.error(`Lỗi phân tích cú pháp bản lưu fallback [${slotId}]:`, e);
        }
      }
    }

    // 4. So sánh và hòa giải dữ liệu
    if (idbData && fallbackData) {
      if (fallbackTimestamp >= idbTimestamp) {
        // Bản fallback mới hơn hoặc bằng: dùng fallback và đồng bộ lại sang IndexedDB nếu được
        this.memStore.set(slotId, { metadata: fallbackData.metadata, data: fallbackData });
        this.putSlot(slotId, fallbackData.metadata, fallbackData).catch(() => {});
        return fallbackData;
      } else {
        // Bản IndexedDB mới hơn: dọn dẹp fallback cũ
        try {
          localStorage.removeItem(SAVE_PREFIX + slotId);
        } catch (_) {}
        this.memStore.set(slotId, { metadata: idbMeta || idbData.metadata, data: idbData });
        return idbData;
      }
    } else if (fallbackData) {
      // Chỉ có fallback (bản lưu cũ hoặc bản lưu sau khi IndexedDB lỗi)
      this.memStore.set(slotId, { metadata: fallbackData.metadata, data: fallbackData });
      this.putSlot(slotId, fallbackData.metadata, fallbackData).catch(() => {});
      return fallbackData;
    } else if (idbData) {
      // Chỉ có IndexedDB
      this.memStore.set(slotId, { metadata: idbMeta || idbData.metadata, data: idbData });
      return idbData;
    }

    return null;
  }

  /**
   * Lấy danh sách metadata của toàn bộ các bản lưu có trong IndexedDB
   */
  public static async getAllMetadataFromIndexedDB(strict = false): Promise<SaveMetadata[]> {
    if (typeof indexedDB === 'undefined') return [];
    try {
      const db = await this.getDB();
      return await new Promise<SaveMetadata[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const records: StoredSaveRecord[] = req.result || [];
          const list: SaveMetadata[] = [];
          for (const r of records) {
            if (r && r.metadata && typeof r.metadata === 'object' && r.metadata.id) {
              list.push(r.metadata);
            }
          }
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      if (strict) throw error;
      return [];
    }
  }

  /**
   * Lấy danh sách metadata của toàn bộ các bản lưu fallback có trong localStorage
   */
  public static getAllMetadataFromLocalStorage(strict = false): SaveMetadata[] {
    const list: SaveMetadata[] = [];
    if (typeof localStorage === 'undefined') return list;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SAVE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              if (data && data.metadata && data.metadata.id) {
                list.push(data.metadata);
              }
            } catch (_) {}
          }
        }
      }
    } catch (error) {
      if (strict) throw error;
    }
    return list;
  }

  /**
   * Xóa bản lưu khỏi toàn bộ các tầng lưu trữ (IndexedDB, memStore, localStorage).
   * Ném ngoại lệ nếu backend bền vững gặp sự cố để tránh xóa nhầm danh mục.
   */
  public static async deleteSlot(slotId: string): Promise<void> {
    let idbError: any = null;

    // 1. Xóa khỏi IndexedDB nếu IndexedDB khả dụng
    if (typeof indexedDB !== 'undefined') {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(slotId);
          req.onerror = () => reject(req.error ?? new Error('Lỗi yêu cầu xóa IndexedDB'));
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new Error('Lỗi giao dịch xóa IndexedDB'));
          tx.onabort = () => reject(tx.error ?? new Error('Giao dịch xóa IndexedDB bị hủy bỏ'));
        });
      } catch (e) {
        idbError = e;
      }
    }

    if (idbError) {
      throw new Error(`Xóa bản lưu thất bại: IndexedDB gặp sự cố (${idbError.message || idbError})`);
    }

    // 2. Xóa khỏi localStorage fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SAVE_PREFIX + slotId);
      } catch (error: any) {
        throw new Error(`Xóa bản lưu thất bại: localStorage gặp sự cố (${error?.message || error})`);
      }
    }

    // 3. Chỉ dọn dẹp memStore khi đã xóa thành công khỏi backend bền vững
    this.memStore.delete(slotId);
  }

  /**
   * Lấy dữ liệu đồng bộ từ memStore hoặc localStorage nếu cần thiết
   */
  public static getSyncSlot(slotId: string): SaveData | null {
    const mem = this.memStore.get(slotId);
    if (mem && mem.data) return mem.data;

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SAVE_PREFIX + slotId);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {}
      }
    }
    return null;
  }
}
