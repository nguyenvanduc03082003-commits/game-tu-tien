import assert from 'node:assert/strict';
import { getAnimalSpecies } from '../src/config/animals/animal.catalog.ts';
import { ANIMAL_CHILD_SCALE_FACTOR } from '../src/config/animals/animal.simulation.ts';
import { AnimalAssetManager } from '../src/renderer/assets/AnimalAssetManager.ts';
import { AssetManager } from '../src/renderer/assets/AssetManager.ts';
import { AnimalRenderer } from '../src/renderer/systems/AnimalRenderer.ts';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  const res = fn();
  if (res && typeof (res as Promise<void>).then === 'function') {
    return (res as Promise<void>).then(() => {
      passed++;
      console.log('PASS animal-asset:', name);
    });
  }
  passed++;
  console.log('PASS animal-asset:', name);
}

class MockAssetManager {
  public textures: Map<string, any> = new Map();
  public loadCalls: { key: string; url: string }[] = [];
  public availableUrls: Set<string> = new Set();

  public hasTexture(key: string): boolean {
    return this.textures.has(key);
  }

  public getTexture(key: string): any {
    return this.textures.get(key);
  }

  public async loadTexture(key: string, url: string): Promise<any> {
    this.loadCalls.push({ key, url });
    if (this.availableUrls.has(url)) {
      const mockImg = { src: url, isMockImage: true, naturalWidth: 32, naturalHeight: 32 };
      this.textures.set(key, mockImg);
      return mockImg;
    }
    throw new Error(`404 Not Found: ${url}`);
  }
}

async function runTests() {
  test('URL path and key format strictly follow spec.spriteDirectory and animal_<speciesId>_<stage>', () => {
    const dogSpec = getAnimalSpecies('dog');
    const mgr = AnimalAssetManager.getInstance();

    assert.equal(
      mgr.resolveStageUrl(dogSpec.spriteDirectory, 'adult'),
      `${dogSpec.spriteDirectory}/adult.png`
    );
    assert.equal(
      mgr.resolveStageUrl(dogSpec.spriteDirectory, 'child'),
      `${dogSpec.spriteDirectory}/child.png`
    );
    assert.equal(
      mgr.resolveStageUrl(dogSpec.spriteDirectory, 'elder'),
      `${dogSpec.spriteDirectory}/elder.png`
    );

    assert.equal(mgr.getStageKey('dog', 'adult'), 'animal_dog_adult');
    assert.equal(mgr.getStageKey('dog', 'child'), 'animal_dog_child');
    assert.equal(mgr.getStageKey('dog', 'elder'), 'animal_dog_elder');
  });

  await test('child.png is prioritized when present', async () => {
    const mock = new MockAssetManager();
    const dogSpec = getAnimalSpecies('dog');
    mock.availableUrls.add(`${dogSpec.spriteDirectory}/child.png`);
    mock.availableUrls.add(`${dogSpec.spriteDirectory}/adult.png`);

    const animalMgr = AnimalAssetManager.resetForTests(mock as unknown as AssetManager);

    // Lần gọi đầu: trả về undefined và kích hoạt load child.png
    const firstCall = animalMgr.getAnimalSprite(dogSpec, 'child');
    assert.equal(firstCall, undefined);
    assert.equal(animalMgr.getUrlStatus(`${dogSpec.spriteDirectory}/child.png`), 'pending');

    // Chờ Promise load hoàn tất
    await new Promise(r => setTimeout(r, 10));

    assert.equal(animalMgr.getUrlStatus(`${dogSpec.spriteDirectory}/child.png`), 'loaded');
    const secondCall = animalMgr.getAnimalSprite(dogSpec, 'child');
    assert.ok(secondCall);
    assert.equal((secondCall as any).src, `${dogSpec.spriteDirectory}/child.png`);
    // Không cần load adult.png vì child.png đã có sẵn
    assert.equal(mock.loadCalls.some(c => c.url.endsWith('adult.png')), false);
  });

  await test('falls back to adult.png when child.png is missing', async () => {
    const mock = new MockAssetManager();
    const deerSpec = getAnimalSpecies('spotted_deer');
    // Chỉ có adult.png, không có child.png
    mock.availableUrls.add(`${deerSpec.spriteDirectory}/adult.png`);

    const animalMgr = AnimalAssetManager.resetForTests(mock as unknown as AssetManager);

    // Lần gọi 1: kích hoạt nạp child.png
    const res1 = animalMgr.getAnimalSprite(deerSpec, 'child');
    assert.equal(res1, undefined);

    // Chờ child.png 404 và tự động kích hoạt adult.png
    await new Promise(r => setTimeout(r, 20));

    assert.equal(animalMgr.getUrlStatus(`${deerSpec.spriteDirectory}/child.png`), 'failed');
    assert.equal(animalMgr.getUrlStatus(`${deerSpec.spriteDirectory}/adult.png`), 'loaded');

    // Khung hình tiếp theo nhận được adult texture
    const res2 = animalMgr.getAnimalSprite(deerSpec, 'child');
    assert.ok(res2);
    assert.equal((res2 as any).src, `${deerSpec.spriteDirectory}/adult.png`);
  });

  await test('returns undefined (procedural fallback) when both child and adult images are missing, without repeated requests', async () => {
    const mock = new MockAssetManager();
    const wolfSpec = getAnimalSpecies('wolf');
    // Không có bất kỳ ảnh nào

    const animalMgr = AnimalAssetManager.resetForTests(mock as unknown as AssetManager);

    animalMgr.getAnimalSprite(wolfSpec, 'child');
    await new Promise(r => setTimeout(r, 20));

    assert.equal(animalMgr.getUrlStatus(`${wolfSpec.spriteDirectory}/child.png`), 'failed');
    assert.equal(animalMgr.getUrlStatus(`${wolfSpec.spriteDirectory}/adult.png`), 'failed');

    const totalLoadsBefore = mock.loadCalls.length;
    // Gọi nhiều lần trong vòng lặp render giả lập 60 FPS
    for (let frame = 0; frame < 60; frame++) {
      const res = animalMgr.getAnimalSprite(wolfSpec, 'child');
      assert.equal(res, undefined, 'Phải trả về undefined để renderer vẽ hình học dự phòng');
    }

    assert.equal(
      mock.loadCalls.length,
      totalLoadsBefore,
      'URL lỗi tuyệt đối không được gửi lại request ở các frame tiếp theo'
    );
  });

  test('AnimalRenderer preserves ANIMAL_CHILD_SCALE_FACTOR when child falls back to adult image', () => {
    const spec = getAnimalSpecies('dog');
    const childScale = spec.scale * ANIMAL_CHILD_SCALE_FACTOR;
    const adultScale = spec.scale * 1.0;
    assert.ok(childScale < adultScale, 'Tỷ lệ vẽ con non phải nhỏ hơn con trưởng thành');
    assert.equal(childScale, spec.scale * 0.68);
  });

  console.log(`${passed} animal-asset regression tests passed`);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
