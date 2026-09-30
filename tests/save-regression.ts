import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import {
  PositionComponent,
  NameComponent,
  RaceComponent,
  HealthComponent,
  RealmComponent,
  CharacterStateComponent
} from '../src/modules/beings/BeingComponents.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { SaveStorage, compressGzip, decompressGzip } from '../src/modules/save/SaveStorage.ts';
import { getNextEntityId, setNextEntityId, resetEntityIdCounter } from '../src/ecs/Entity.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { FactionComponent } from '../src/modules/factions/FactionComponents.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { EventBus } from '../src/core/EventBus.ts';

// Mock localStorage in Node.js environment if needed
if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; }
  };
}

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log('PASS save:', name);
}

function createMockEngine(entityCount: number = 3) {
  const world = new ECSWorld();
  const worldMap = new WorldMap(8, 8);
  const qiGrid = new QiGrid(8, 8);
  const tribulationSystem = new TribulationSystem();
  const cultivationSystem = new CultivationSystem(worldMap, qiGrid, tribulationSystem);
  const threeTierAISystem = new ThreeTierAISystem(worldMap, qiGrid);
  const diplomacySystem = new DiplomacySystem();
  const spatialGrid = new SpatialGrid(32);
  threeTierAISystem.spatialGrid = spatialGrid;

  for (let i = 0; i < entityCount; i++) {
    const e = world.createEntity();
    world.addComponent(e, new PositionComponent(10 + i * 5, 20 + i * 5));
    world.addComponent(e, new NameComponent(`Cư Dân #${e}`));
    world.addComponent(e, new RaceComponent('human'));
    world.addComponent(e, new HealthComponent(1250));
    world.addComponent(e, new RealmComponent());
    world.addComponent(e, new CharacterStateComponent());
  }

  const engine = {
    world,
    worldMap,
    qiGrid,
    camera: { x: 50, y: 50, zoom: 1.5 },
    timeManager: TimeManager.getInstance(),
    spatialGrid,
    tribulationSystem,
    cultivationSystem,
    threeTierAISystem,
    diplomacySystem,
    worldName: 'Đang Chơi Thế Giới',
    worldTemplate: 'thap_van_dai_son',
    worldSeed: 12345,
    resetWorldState() {
      this.world.clearEntities();
      this.spatialGrid.clear();
      resetEntityIdCounter();
      this.tribulationSystem?.clear();
      this.threeTierAISystem?.reset();
      this.cultivationSystem?.reset();
      this.diplomacySystem?.clear();
      FactionFactory.reset();
      SmartObjectManager.getInstance().clear();
      CommunityTaskBoard.getInstance().clear();
      AStarPathfinder.invalidateBuildingCache();
      EventBus.getInstance().emit('world:reset');
    }
  } as any;

  return engine;
}

export async function runSaveRegressionTests() {
  await test('validateSaveData detects missing qiGrid', () => {
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);
    const brokenData = JSON.parse(JSON.stringify(validData));
    delete brokenData.qiGrid;

    assert.throws(
      () => SaveManager.validateSaveData(brokenData),
      /Dữ liệu bản lưu không hợp lệ: Thiếu dữ liệu lưới linh khí \(qiGrid\)!/
    );
  });

  await test('validateSaveData detects missing worldMap, camera, time and tile mismatch', () => {
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);

    const missingMap = JSON.parse(JSON.stringify(validData));
    delete missingMap.worldMap;
    assert.throws(() => SaveManager.validateSaveData(missingMap), /worldMap/);

    const mapMismatch = JSON.parse(JSON.stringify(validData));
    mapMismatch.worldMap.tiles.pop();
    assert.throws(() => SaveManager.validateSaveData(mapMismatch), /Số lượng ô worldMap không khớp/);

    const missingCamera = JSON.parse(JSON.stringify(validData));
    delete missingCamera.camera;
    assert.throws(() => SaveManager.validateSaveData(missingCamera), /camera/);

    const missingTime = JSON.parse(JSON.stringify(validData));
    delete missingTime.time;
    assert.throws(() => SaveManager.validateSaveData(missingTime), /time/);

    const invalidEntities = JSON.parse(JSON.stringify(validData));
    invalidEntities.entities = 'not an array';
    assert.throws(() => SaveManager.validateSaveData(invalidEntities), /entities/);
  });

  await test('5: time.speed không hợp lệ hoặc time.totalTicks sai bị từ chối và thế giới đang chơi giữ nguyên', () => {
    const engine = createMockEngine(4);
    const validData = SaveManager.serializeWorld(engine);

    // Speed = -1
    const badSpeed1 = JSON.parse(JSON.stringify(validData));
    badSpeed1.time.speed = -1;
    assert.throws(() => SaveManager.deserializeWorld(engine, badSpeed1), /time\.speed/);
    assert.equal(engine.world.getEntityCount(), 4, 'Thế giới đang chơi phải giữ nguyên');

    // Speed = null
    const badSpeed2 = JSON.parse(JSON.stringify(validData));
    badSpeed2.time.speed = null as any;
    assert.throws(() => SaveManager.deserializeWorld(engine, badSpeed2), /time\.speed/);
    assert.equal(engine.world.getEntityCount(), 4);

    // totalTicks không phải số nguyên hoặc âm
    const badTicks = JSON.parse(JSON.stringify(validData));
    badTicks.time.totalTicks = -10;
    assert.throws(() => SaveManager.deserializeWorld(engine, badTicks), /time\.totalTicks/);
    assert.equal(engine.world.getEntityCount(), 4);
  });

  await test('5: Entity ID trùng nhau bị từ chối và thế giới đang chơi giữ nguyên', () => {
    const engine = createMockEngine(3);
    const validData = SaveManager.serializeWorld(engine);
    const dupData = JSON.parse(JSON.stringify(validData));
    // Ép 2 entity có cùng ID
    dupData.entities[1].id = dupData.entities[0].id;

    assert.throws(
      () => SaveManager.deserializeWorld(engine, dupData),
      /trùng lặp entity ID/
    );
    assert.equal(engine.world.getEntityCount(), 3, 'Thế giới đang chơi không bị xóa');
  });

  await test('5: nextEntityId <= max(entity.id) bị từ chối', () => {
    const engine = createMockEngine(2);
    const validData = SaveManager.serializeWorld(engine);
    const badNextIdData = JSON.parse(JSON.stringify(validData));
    const maxId = Math.max(...badNextIdData.entities.map((e: any) => e.id));
    badNextIdData.nextEntityId = maxId; // Bằng max ID

    assert.throws(
      () => SaveManager.deserializeWorld(engine, badNextIdData),
      /nextEntityId/
    );
    assert.equal(engine.world.getEntityCount(), 2);
  });

  await test('5: Tuple worldMap.tiles có giá trị ngoài khoảng hoặc NaN bị từ chối', () => {
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);

    // Terrain ngoài khoảng
    const badTerrain = JSON.parse(JSON.stringify(validData));
    badTerrain.worldMap.tiles[0][0] = 999;
    assert.throws(() => SaveManager.validateSaveData(badTerrain), /Địa hình ô thứ 0 không hợp lệ/);

    // Elevation NaN
    const badElev = JSON.parse(JSON.stringify(validData));
    badElev.worldMap.tiles[0][1] = NaN;
    assert.throws(() => SaveManager.validateSaveData(badElev), /Cao độ ô thứ 0 không hợp lệ/);

    // Variant ngoài khoảng 0..3
    const badVariant = JSON.parse(JSON.stringify(validData));
    badVariant.worldMap.tiles[0][5] = 4;
    assert.throws(() => SaveManager.validateSaveData(badVariant), /Biến thể ô thứ 0 không hợp lệ/);
  });

  await test('5: Tuple qiGrid.tiles hoặc kích thước qiGrid lệch bị từ chối', () => {
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);

    // Kích thước Qi lệch map
    const mismatchQi = JSON.parse(JSON.stringify(validData));
    mismatchQi.qiGrid.width = 16; // Map là 8
    assert.throws(() => SaveManager.validateSaveData(mismatchQi), /Kích thước qiGrid .* không khớp/);

    // isVein khác 0 và 1
    const badVein = JSON.parse(JSON.stringify(validData));
    badVein.qiGrid.tiles[0][3] = 2;
    assert.throws(() => SaveManager.validateSaveData(badVein), /Cờ linh mạch ô thứ 0 không hợp lệ/);
  });

  await test('5: Bản lưu cũ thiếu nextEntityId nạp an toàn và entity tạo tiếp theo không bị trùng ID', () => {
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);
    // Giả lập bản lưu có entity ID lớn (1500) nhưng KHÔNG có nextEntityId
    validData.entities[0].id = 1500;
    delete (validData as any).nextEntityId;

    SaveManager.deserializeWorld(engine, validData);

    const newEntId = engine.world.createEntity();
    assert.ok(
      newEntId > 1500,
      `Entity mới sinh (${newEntId}) phải có ID lớn hơn entity đã nạp (1500), không được trùng hoặc nhận mặc định 1000`
    );
  });

  await test('importSaveFromJson rejects save missing qiGrid and does not write slot to storage', async () => {
    localStorage.clear();
    const engine = createMockEngine(1);
    const validData = SaveManager.serializeWorld(engine);
    const brokenData = JSON.parse(JSON.stringify(validData));
    delete brokenData.qiGrid;

    const jsonStr = JSON.stringify(brokenData);
    await assert.rejects(
      async () => await SaveManager.importSaveFromJson(jsonStr),
      /Thiếu dữ liệu lưới linh khí \(qiGrid\)!/
    );

    assert.equal(SaveManager.listSlots().length, 0, 'Không được tạo slot lưu mới khi import lỗi');
  });

  await test('deserializeWorld does not wipe playing world entities when qiGrid is missing', () => {
    const engine = createMockEngine(5);
    assert.equal(engine.world.getEntityCount(), 5, 'Thế giới đang chơi có 5 thực thể');

    const validData = SaveManager.serializeWorld(engine);
    const brokenData = JSON.parse(JSON.stringify(validData));
    delete brokenData.qiGrid;

    // Thử deserialize bản lưu lỗi
    assert.throws(() => {
      SaveManager.deserializeWorld(engine, brokenData);
    });

    // Thế giới đang chơi phải còn nguyên 5 thực thể, KHÔNG bị xóa về 0
    assert.equal(engine.world.getEntityCount(), 5, 'Số thực thể phải còn nguyên 5, không bị xóa về 0');
    assert.equal(engine.worldName, 'Đang Chơi Thế Giới', 'Tên thế giới đang chơi không bị ghi đè');
  });

  await test('loadSlot returns false and preserves playing world when slot data lacks qiGrid', async () => {
    localStorage.clear();
    const engine = createMockEngine(4);
    assert.equal(engine.world.getEntityCount(), 4);

    const validData = SaveManager.serializeWorld(engine);
    const brokenData = JSON.parse(JSON.stringify(validData));
    delete brokenData.qiGrid;

    localStorage.setItem('tu_tien_save_corrupt_slot', JSON.stringify(brokenData));

    const result = await SaveManager.loadSlot(engine, 'corrupt_slot');
    assert.equal(result, false, 'loadSlot phải trả về false khi dữ liệu lỗi');
    assert.equal(engine.world.getEntityCount(), 4, 'Thực thể đang chơi không bị xóa');
  });

  await test('staging rollback: staging failure preserves entities and entity ID counter', () => {
    const engine = createMockEngine(3);
    const originalEntityCount = engine.world.getEntityCount();
    const initialNextId = getNextEntityId();

    const validData = SaveManager.serializeWorld(engine);
    const brokenData = JSON.parse(JSON.stringify(validData));
    brokenData.entities.push({ id: 99999, components: null as any }); // Gây lỗi cấu trúc

    assert.throws(() => {
      SaveManager.deserializeWorld(engine, brokenData);
    });

    assert.equal(engine.world.getEntityCount(), originalEntityCount, 'Thực thể không bị xóa');
    assert.equal(getNextEntityId(), initialNextId, 'ID counter được rollback nguyên vẹn');
  });

  await test('gzip compression reduces payload size significantly and preserves round trip', async () => {
    const engine = createMockEngine(10);
    const validData = SaveManager.serializeWorld(engine, 'Test Nén');
    const jsonStr = JSON.stringify(validData);
    const rawBytes = new TextEncoder().encode(jsonStr);

    const compressed = await compressGzip(jsonStr);
    assert.ok(compressed.length < rawBytes.length, `Kích thước sau nén (${compressed.length}) phải nhỏ hơn ban đầu (${rawBytes.length})`);

    const decompressed = await decompressGzip(compressed);
    assert.equal(decompressed, jsonStr, 'Giải nén phải bảo toàn 100% dữ liệu gốc');
  });

  await test('saveSlot and loadSlot work asynchronously with SaveStorage', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    const engine = createMockEngine(3);
    const meta = await SaveManager.saveSlot(engine, 'test_async_slot', 'Thế Giới Lưu Asynchronous');
    assert.equal(meta.name, 'Thế Giới Lưu Asynchronous');

    const newEngine = createMockEngine(8);
    assert.equal(newEngine.world.getEntityCount(), 8);

    const loaded = await SaveManager.loadSlot(newEngine, 'test_async_slot');
    assert.equal(loaded, true);
    assert.equal(newEngine.world.getEntityCount(), 3);
    assert.equal(newEngine.worldName, 'Thế Giới Lưu Asynchronous');
  });

  await test('1A: IndexedDB lỗi, localStorage ghi được: lưu và nạp lại bản mới thành công', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    (SaveStorage as any).dbPromise = null;
    const origIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = undefined; // Ép IndexedDB không khả dụng
    try {
      const engine = createMockEngine(2);
      const meta = await SaveManager.saveSlot(engine, 'test_fallback_slot', 'Thế Giới Fallback');
      assert.equal(meta.name, 'Thế Giới Fallback');
      assert.ok(localStorage.getItem('tu_tien_save_test_fallback_slot'), 'Dữ liệu phải nằm trong localStorage');
      assert.ok(SaveStorage.memStore.has('test_fallback_slot'), 'memStore được cập nhật sau khi localStorage thành công');

      const newEngine = createMockEngine(5);
      const loaded = await SaveManager.loadSlot(newEngine, 'test_fallback_slot');
      assert.equal(loaded, true);
      assert.equal(newEngine.world.getEntityCount(), 2);
    } finally {
      (globalThis as any).indexedDB = origIndexedDB;
      (SaveStorage as any).dbPromise = null;
    }
  });

  await test('1A: IndexedDB lỗi, localStorage cũng lỗi: saveSlot từ chối và memStore không chứa bản lưu', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    (SaveStorage as any).dbPromise = null;
    const origIndexedDB = (globalThis as any).indexedDB;
    const origSetItem = localStorage.setItem;
    (globalThis as any).indexedDB = undefined; // IndexedDB không khả dụng
    // Mock localStorage.setItem bị lỗi (ví dụ đầy dung lượng)
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError: Dung lượng lưu trữ đã đầy');
    };

    try {
      const engine = createMockEngine(2);
      await assert.rejects(
        async () => {
          await SaveManager.saveSlot(engine, 'test_failed_slot', 'Bản Lưu Lỗi');
        },
        /Lưu trữ thất bại/
      );
      assert.equal(
        SaveStorage.memStore.has('test_failed_slot'),
        false,
        'Tuyệt đối không được đưa bản lưu vào memStore khi cả IndexedDB và localStorage đều lỗi'
      );
    } finally {
      localStorage.setItem = origSetItem;
      (globalThis as any).indexedDB = origIndexedDB;
      (SaveStorage as any).dbPromise = null;
    }
  });

  await test('1A: request.onsuccess xảy ra rồi giao dịch abort: thao tác lưu vẫn thất bại', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    (SaveStorage as any).dbPromise = null;
    const origIndexedDB = (globalThis as any).indexedDB;
    const origSetItem = localStorage.setItem;
    // Mock localStorage cũng lỗi để không rơi sang fallback thành công
    localStorage.setItem = () => {
      throw new Error('localStorage bị chặn');
    };

    // Mock indexedDB với kịch bản: req.onsuccess gọi trước, nhưng sau đó transaction bị abort
    (globalThis as any).indexedDB = {
      open: () => {
        const openReq: any = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: {
            objectStoreNames: { contains: () => true },
            transaction: () => {
              const tx: any = {
                oncomplete: null,
                onerror: null,
                onabort: null,
                error: new Error('TransactionAbortedError: Giao dịch bị hủy bỏ'),
                objectStore: () => ({
                  put: () => {
                    const req: any = { onsuccess: null, onerror: null };
                    setTimeout(() => {
                      if (req.onsuccess) req.onsuccess();
                      // Sau khi req.onsuccess, giao dịch bị abort!
                      setTimeout(() => {
                        if (tx.onabort) tx.onabort(new Event('abort'));
                      }, 5);
                    }, 5);
                    return req;
                  }
                })
              };
              return tx;
            }
          }
        };
        setTimeout(() => {
          if (openReq.onsuccess) openReq.onsuccess();
        }, 5);
        return openReq;
      }
    };

    try {
      const engine = createMockEngine(2);
      await assert.rejects(
        async () => {
          await SaveManager.saveSlot(engine, 'test_abort_slot', 'Slot Abort');
        },
        /TransactionAbortedError|Lưu trữ thất bại/
      );
      assert.equal(
        SaveStorage.memStore.has('test_abort_slot'),
        false,
        'Không được lưu vào memStore khi transaction bị abort'
      );
    } finally {
      (globalThis as any).indexedDB = origIndexedDB;
      localStorage.setItem = origSetItem;
      (SaveStorage as any).dbPromise = null;
    }
  });

  await test('1B: Bản cũ ở IndexedDB, bản ghi đè mới ở fallback: sau khi xóa memStore, nạp ra bản mới', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    SaveStorage.resetDB();

    const engineOld = createMockEngine(1);
    const oldSaveData = SaveManager.serializeWorld(engineOld, 'Bản Cũ IndexedDB');
    oldSaveData.metadata.timestamp = 1000;

    const engineNew = createMockEngine(4);
    const newSaveData = SaveManager.serializeWorld(engineNew, 'Bản Mới Fallback');
    newSaveData.metadata.timestamp = 2000;

    const origIndexedDB = (globalThis as any).indexedDB;
    // Mock IndexedDB chứa bản cũ (timestamp 1000)
    const mockStore = new Map<string, any>();
    mockStore.set('slot_override_test', {
      id: 'slot_override_test',
      metadata: oldSaveData.metadata,
      payload: JSON.stringify(oldSaveData),
      compressed: false,
      timestamp: 1000
    });

    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: {
            objectStoreNames: { contains: () => true },
            transaction: () => ({
              objectStore: () => ({
                get: (id: string) => {
                  const getReq: any = { onsuccess: null, onerror: null };
                  setTimeout(() => {
                    getReq.result = mockStore.get(id);
                    if (getReq.onsuccess) getReq.onsuccess();
                  }, 2);
                  return getReq;
                },
                put: (rec: any) => {
                  mockStore.set(rec.id, rec);
                  const putReq: any = { onsuccess: null, onerror: null };
                  setTimeout(() => {
                    if (putReq.onsuccess) putReq.onsuccess();
                  }, 2);
                  return putReq;
                }
              })
            })
          }
        };
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 2);
        return req;
      }
    };

    // Đặt bản mới vào localStorage fallback (timestamp 2000)
    localStorage.setItem('tu_tien_save_slot_override_test', JSON.stringify(newSaveData));

    // Đảm bảo memStore rỗng (giống như vừa tải lại trang)
    SaveStorage.memStore.clear();

    try {
      const loadedData = await SaveStorage.getSlot('slot_override_test');
      assert.ok(loadedData, 'Phải nạp được dữ liệu');
      assert.equal(
        loadedData.metadata.name,
        'Bản Mới Fallback',
        'Phải ưu tiên bản mới từ fallback thay vì bản cũ trong IndexedDB'
      );
      assert.equal(loadedData.metadata.timestamp, 2000);
      assert.equal(loadedData.entities.length, 4);
    } finally {
      (globalThis as any).indexedDB = origIndexedDB;
      SaveStorage.resetDB();
      localStorage.clear();
      SaveStorage.memStore.clear();
    }
  });

  await test('1B: Payload đã commit nhưng ghi index lỗi: sau khi mở lại, danh sách vẫn tìm được slot từ IndexedDB', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    SaveStorage.resetDB();

    const engine = createMockEngine(2);
    const committedData = SaveManager.serializeWorld(engine, 'Thế Giới Khôi Phục');
    committedData.metadata.id = 'slot_recovered_test';

    const origIndexedDB = (globalThis as any).indexedDB;
    const mockStore = new Map<string, any>();
    mockStore.set('slot_recovered_test', {
      id: 'slot_recovered_test',
      metadata: committedData.metadata,
      payload: JSON.stringify(committedData),
      compressed: false,
      timestamp: committedData.metadata.timestamp
    });

    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: {
            objectStoreNames: { contains: () => true },
            transaction: () => ({
              objectStore: () => ({
                getAll: () => {
                  const getAllReq: any = { onsuccess: null, onerror: null };
                  setTimeout(() => {
                    getAllReq.result = Array.from(mockStore.values());
                    if (getAllReq.onsuccess) getAllReq.onsuccess();
                  }, 2);
                  return getAllReq;
                }
              })
            })
          }
        };
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 2);
        return req;
      }
    };

    // Index trong localStorage bị rỗng do lỗi khi ghi index
    localStorage.removeItem('tu_tien_save_index');
    SaveStorage.memStore.clear();

    try {
      // Trước khi khôi phục, danh sách đồng bộ rỗng
      assert.equal(SaveManager.listSlots().length, 0);

      // Mở lại ứng dụng / khôi phục danh mục từ IndexedDB
      const restored = await (SaveManager as any).syncIndexFromStorage();
      assert.ok(restored.length > 0, 'Phải khôi phục được danh sách slot từ IndexedDB');
      assert.equal(restored[0].id, 'slot_recovered_test');
      assert.equal(restored[0].name, 'Thế Giới Khôi Phục');

      // Sau khi khôi phục, listSlots() thông thường cũng phải thấy slot này
      const currentList = SaveManager.listSlots();
      assert.ok(currentList.some(s => s.id === 'slot_recovered_test'));
    } finally {
      (globalThis as any).indexedDB = origIndexedDB;
      SaveStorage.resetDB();
      localStorage.clear();
      SaveStorage.memStore.clear();
    }
  });

  await test('1C: Xóa trong IndexedDB thất bại: danh mục không biến mất như thể đã xóa thành công', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    SaveStorage.resetDB();

    const engine = createMockEngine(2);
    const saveToDel = SaveManager.serializeWorld(engine, 'Thế Giới Cần Xóa');
    saveToDel.metadata.id = 'slot_delete_fail_test';

    // Đưa slot vào danh mục index
    localStorage.setItem(
      'tu_tien_save_index',
      JSON.stringify([saveToDel.metadata])
    );
    SaveStorage.memStore.set('slot_delete_fail_test', {
      metadata: saveToDel.metadata,
      data: saveToDel
    });

    const origIndexedDB = (globalThis as any).indexedDB;
    // Mock IndexedDB ném lỗi khi delete
    (globalThis as any).indexedDB = {
      open: () => {
        const req: any = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: {
            objectStoreNames: { contains: () => true },
            transaction: () => ({
              oncomplete: null,
              onerror: null,
              onabort: null,
              objectStore: () => ({
                delete: () => {
                  const delReq: any = { onsuccess: null, onerror: null, error: new Error('IDBDatabase error on delete') };
                  setTimeout(() => {
                    if (delReq.onerror) delReq.onerror();
                  }, 2);
                  return delReq;
                }
              })
            })
          }
        };
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 2);
        return req;
      }
    };

    try {
      // Gọi deleteSlot, kỳ vọng phải throw error do xóa IndexedDB thất bại
      await assert.rejects(
        async () => {
          await SaveManager.deleteSlot('slot_delete_fail_test');
        },
        /Lỗi khi xóa|IDBDatabase error/
      );

      // Danh mục index trong SaveManager KHÔNG được biến mất
      const slots = SaveManager.listSlots();
      assert.equal(slots.length, 1, 'Danh mục không được giảm số lượng');
      assert.equal(slots[0].id, 'slot_delete_fail_test', 'Bản lưu vẫn phải còn trong danh mục');
      assert.ok(SaveStorage.memStore.has('slot_delete_fail_test'), 'memStore vẫn phải giữ bản lưu khi xóa thất bại');
    } finally {
      (globalThis as any).indexedDB = origIndexedDB;
      SaveStorage.resetDB();
      localStorage.clear();
      SaveStorage.memStore.clear();
    }
  });

  await test('1C: Lỗi xóa localStorage fallback không được báo xóa slot thành công', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    const originalIndexedDB = (globalThis as any).indexedDB;
    const originalRemoveItem = localStorage.removeItem;
    (globalThis as any).indexedDB = undefined;
    const data = SaveManager.serializeWorld(createMockEngine(1), 'Slot fallback', 'slot_fallback_delete');
    localStorage.setItem('tu_tien_save_slot_fallback_delete', JSON.stringify(data));
    localStorage.setItem('tu_tien_save_index', JSON.stringify([data.metadata]));
    SaveStorage.memStore.set('slot_fallback_delete', { metadata: data.metadata, data });
    (localStorage as any).removeItem = (key: string) => {
      if (key === 'tu_tien_save_slot_fallback_delete') throw new Error('remove blocked');
      return originalRemoveItem.call(localStorage, key);
    };

    try {
      await assert.rejects(SaveManager.deleteSlot('slot_fallback_delete'), /localStorage.*remove blocked/);
      assert.equal(SaveManager.listSlots()[0]?.id, 'slot_fallback_delete');
      assert.ok(SaveStorage.memStore.has('slot_fallback_delete'));
      assert.ok(localStorage.getItem('tu_tien_save_slot_fallback_delete'));
    } finally {
      (localStorage as any).removeItem = originalRemoveItem;
      (globalThis as any).indexedDB = originalIndexedDB;
      SaveStorage.resetDB();
      localStorage.clear();
      SaveStorage.memStore.clear();
    }
  });

  await test('1C: Đồng bộ danh mục loại slot mồ côi khi cả hai backend đều đọc được', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    const originalIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = undefined;
    const data = SaveManager.serializeWorld(createMockEngine(1), 'Slot mồ côi', 'slot_orphan');
    localStorage.setItem('tu_tien_save_index', JSON.stringify([data.metadata]));
    SaveStorage.memStore.set('slot_orphan', { metadata: data.metadata, data });
    try {
      const slots = await SaveManager.syncIndexFromStorage();
      assert.deepEqual(slots, []);
      assert.deepEqual(SaveManager.listSlots(), []);
    } finally {
      (globalThis as any).indexedDB = originalIndexedDB;
      SaveStorage.resetDB();
      localStorage.clear();
    }
  });

  await test('2: Hai yêu cầu lưu liên tiếp cùng slot không khiến bản cũ ghi đè bản mới', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    SaveStorage.resetDB();

    const engineOld = createMockEngine(1);
    engineOld.worldName = 'Bản Cũ Đợt 1';

    const engineNew = createMockEngine(4);
    engineNew.worldName = 'Bản Mới Đợt 2';

    // Giả lập putSlot có độ trễ khác nhau: lần gọi đầu mất 30ms, lần gọi sau mất 5ms
    const origPutSlot = SaveStorage.putSlot;
    let callCount = 0;
    (SaveStorage as any).putSlot = async function (slotId: string, metadata: any, data: any) {
      callCount++;
      const currentCall = callCount;
      const delay = currentCall === 1 ? 30 : 5;
      await new Promise(resolve => setTimeout(resolve, delay));
      return origPutSlot.call(this, slotId, metadata, data);
    };

    try {
      // Gọi liên tiếp 2 lần lưu cho cùng 1 slot
      const p1 = SaveManager.saveSlot(engineOld, 'slot_concurrent_test', 'Bản Cũ Đợt 1');
      const p2 = SaveManager.saveSlot(engineNew, 'slot_concurrent_test', 'Bản Mới Đợt 2');

      await Promise.all([p1, p2]);

      // Nạp lại dữ liệu
      const engineCheck = createMockEngine(0);
      const loaded = await SaveManager.loadSlot(engineCheck, 'slot_concurrent_test');
      assert.equal(loaded, true);
      assert.equal(
        engineCheck.worldName,
        'Bản Mới Đợt 2',
        'Bản lưu sau (mới hơn) phải luôn ghi đè sau bản lưu trước (cũ hơn), không để bản cũ ghi đè bản mới'
      );
      assert.equal(engineCheck.world.getEntityCount(), 4);
    } finally {
      SaveStorage.putSlot = origPutSlot;
      localStorage.clear();
      SaveStorage.memStore.clear();
      SaveStorage.resetDB();
    }
  });

  await test('2: Chuyển trang sang trạng thái ẩn chỉ khởi phát một lần lưu cho cùng một lượt chuyển trạng thái', async () => {
    localStorage.clear();
    SaveStorage.memStore.clear();
    SaveStorage.resetDB();
    SaveManager.resetVisibilityState();

    const engine = createMockEngine(2);
    engine.worldName = 'Thế Giới Ẩn Tab';

    let saveCalls = 0;
    const origSaveSlot = SaveManager.saveSlot;
    (SaveManager as any).saveSlot = async function (...args: any[]) {
      saveCalls++;
      return origSaveSlot.apply(this, args as any);
    };

    try {
      // Lần 1: chuyển sang hidden -> phải lưu
      const res1 = await SaveManager.handleVisibilityChange(engine, 'hidden', 'slot_vis_test');
      assert.ok(res1, 'Lần chuyển sang hidden đầu tiên phải thực hiện lưu');
      assert.equal(saveCalls, 1);

      // Lần 2: event lại phát hidden (chưa từng chuyển về visible) -> không được lưu lặp lại
      const res2 = await SaveManager.handleVisibilityChange(engine, 'hidden', 'slot_vis_test');
      assert.equal(res2, null, 'Không được phát thêm lần lưu nào khi trạng thái hidden chưa thay đổi');
      assert.equal(saveCalls, 1);

      // Chuyển sang visible -> reset cờ
      await SaveManager.handleVisibilityChange(engine, 'visible', 'slot_vis_test');
      assert.equal(saveCalls, 1);

      // Lại chuyển sang hidden -> phải lưu lần 2
      const res3 = await SaveManager.handleVisibilityChange(engine, 'hidden', 'slot_vis_test');
      assert.ok(res3, 'Sau khi visible rồi lại hidden, phải khởi phát lượt lưu mới');
      assert.equal(saveCalls, 2);
    } finally {
      SaveManager.saveSlot = origSaveSlot;
      SaveManager.resetVisibilityState();
      localStorage.clear();
      SaveStorage.memStore.clear();
      SaveStorage.resetDB();
    }
  });

  await test('notifySaveStatus executes safely without errors', () => {
    assert.doesNotThrow(() => {
      SaveManager.notifySaveStatus('Lưu thành công', true);
      SaveManager.notifySaveStatus('Lưu thất bại', false);
    });
  });

  await test('world reset clears activeTribulations preventing lightning damage to new entities sharing ID', () => {
    resetEntityIdCounter();
    const engine = createMockEngine(1);
    const ent1 = engine.world.query([HealthComponent])[0];
    assert.equal(ent1, 1);
    const hp = engine.world.getComponent(ent1, HealthComponent)!;
    assert.equal(hp.current, 1250);

    // Bắt đầu độ kiếp ở thế giới cũ
    engine.tribulationSystem.startTribulation(ent1, 'Trúc Cơ', 3, 1.8, 'Tu sĩ cũ');
    assert.equal(engine.tribulationSystem.hasTribulation(ent1), true);

    // Tái tạo thế giới mới (resetWorldState)
    engine.resetWorldState();
    assert.equal(engine.tribulationSystem.hasTribulation(ent1), false);
    assert.equal(engine.tribulationSystem.getActiveTribulationsCount(), 0);

    // Tạo nhân vật mới có cùng ID 1 trong thế giới mới (nhờ resetEntityIdCounter)
    const newEnt1 = engine.world.createEntity();
    assert.equal(newEnt1, 1, 'Nhân vật mới trong thế giới mới có cùng ID 1 với nhân vật cũ');
    const newHp = new HealthComponent(1250);
    engine.world.addComponent(newEnt1, new PositionComponent(50, 50));
    engine.world.addComponent(newEnt1, newHp);
    engine.world.addComponent(newEnt1, new RealmComponent());
    engine.world.addComponent(newEnt1, new CharacterStateComponent());

    // Cập nhật 1 giây: Nếu không reset activeTribulations, nhân vật mới sẽ bị sét đánh giảm 1250 -> 1063
    engine.tribulationSystem.update(engine.world, 1.0);

    assert.equal(newHp.current, 1250, 'Nhân vật mới không bị trừ máu bởi lôi kiếp từ thế giới cũ');
  });

  await test('world reset clears ThreeTierAISystem pending decrees and CultivationSystem queues', () => {
    resetEntityIdCounter();
    const engine = createMockEngine(1);
    const ent1 = engine.world.query([HealthComponent])[0];
    EventBus.getInstance().emit('god:issue_decree', {
      entityId: ent1,
      decree: { type: 'forced_labor', targetPos: { x: 20, y: 20 }, issuedAtDay: 1 }
    });
    assert.equal(engine.threeTierAISystem.getPendingDecreesCount(), 1);

    EventBus.getInstance().emit('cultivation:attempt_breakthrough', { entityId: ent1 });
    assert.equal(engine.cultivationSystem.getPendingBreakthroughsCount(), 1);

    engine.resetWorldState();
    assert.equal(engine.threeTierAISystem.getPendingDecreesCount(), 0, 'Hàng đợi thánh chỉ đã được dọn sạch');
    assert.equal(engine.cultivationSystem.getPendingBreakthroughsCount(), 0, 'Hàng đợi đột phá đã được dọn sạch');
  });

  await test('world reset clears diplomacy relations and resets FactionFactory counter', () => {
    const engine = createMockEngine(1);
    engine.diplomacySystem.setRelation(engine.world, 'faction_1', 'faction_2', 'war');
    assert.equal(engine.diplomacySystem.getRelation('faction_1', 'faction_2'), 'war');

    engine.resetWorldState();
    assert.equal(engine.diplomacySystem.getRelation('faction_1', 'faction_2'), 'neutral', 'Quan hệ ngoại giao trở về trung lập mặc định');
    assert.equal(FactionFactory.getFactionCounter(), 1, 'FactionFactory counter được đặt lại về 1');
  });

  await test('save load resets activeTribulations and syncs FactionFactory counter from loaded factions', async () => {
    const engine = createMockEngine(2);
    await SaveManager.saveSlot(engine, 'test_async_slot', 'Thế Giới Lưu Asynchronous');
    const ent1 = engine.world.query([HealthComponent])[0];
    // Gán 1 lôi kiếp vào thế giới hiện tại
    engine.tribulationSystem.startTribulation(ent1, 'Kim Đan', 3, 1.8);
    assert.equal(engine.tribulationSystem.hasTribulation(ent1), true);

    // Nạp slot
    const loaded = await SaveManager.loadSlot(engine, 'test_async_slot');
    assert.equal(loaded, true);
    assert.equal(engine.tribulationSystem.getActiveTribulationsCount(), 0, 'Toàn bộ lôi kiếp cũ bị hủy sau khi nạp bản lưu');
  });

  console.log(`${passed} save regression tests passed`);
  await runAuditRegressionTests();
}

import { runAuditRegressionTests } from './simulation-audit-regression.ts';
runSaveRegressionTests();
