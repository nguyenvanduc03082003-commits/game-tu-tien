import {
  AnimalLifeStage,
  AnimalSpeciesDefinition,
} from '../../config/animals/animal.types.ts';
import { AssetManager } from './AssetManager.ts';

export type AssetUrlStatus = 'pending' | 'loaded' | 'failed';

/**
 * Quản lý nạp và bộ nhớ đệm hình ảnh (sprite) động vật:
 * - Nạp on-demand khi loài/giai đoạn xuất hiện trên màn hình, không spam 120 request lúc vào game.
 * - Lấy đường dẫn trực tiếp từ spec.spriteDirectory.
 * - Quy ước key: animal_<speciesId>_<stage>.
 * - Fallback: child/elder -> adult -> procedural (undefined).
 * - Lưu trạng thái URL (pending/failed) để tránh spam request 404 mỗi khung hình.
 */
export class AnimalAssetManager {
  private static instance: AnimalAssetManager;
  private assetManager: AssetManager;
  private urlStatus: Map<string, AssetUrlStatus> = new Map();

  private constructor(assetManager?: AssetManager) {
    this.assetManager = assetManager ?? AssetManager.getInstance();
  }

  public static getInstance(): AnimalAssetManager {
    if (!AnimalAssetManager.instance) {
      AnimalAssetManager.instance = new AnimalAssetManager();
    }
    return AnimalAssetManager.instance;
  }

  /**
   * Reset bộ nhớ đệm phục vụ kiểm thử đơn vị
   */
  public static resetForTests(customAssetManager?: AssetManager): AnimalAssetManager {
    AnimalAssetManager.instance = new AnimalAssetManager(customAssetManager);
    return AnimalAssetManager.instance;
  }

  public getUrlStatus(url: string): AssetUrlStatus | undefined {
    return this.urlStatus.get(url);
  }

  /**
   * Chuẩn hóa URL ảnh theo thư mục sprite và giai đoạn tuổi
   */
  public resolveStageUrl(spriteDirectory: string, stage: AnimalLifeStage): string {
    const cleanDir = spriteDirectory.replace(/\/+$/, '');
    return `${cleanDir}/${stage}.png`;
  }

  /**
   * Lấy key lưu trong AssetManager theo quy ước animal_<speciesId>_<stage>
   */
  public getStageKey(speciesId: string, stage: AnimalLifeStage): string {
    return `animal_${speciesId}_${stage}`;
  }

  /**
   * Lấy sprite cho loài và giai đoạn tuổi:
   * 1. Nếu ảnh giai đoạn tương ứng đã nạp thành công -> trả về texture.
   * 2. Nếu là child/elder mà ảnh riêng không có nhưng ảnh adult đã nạp -> trả về texture adult.
   * 3. Nếu chưa nạp, kích hoạt nạp không đồng bộ mà không chặn render loop, trả về undefined.
   */
  public getAnimalSprite(
    spec: AnimalSpeciesDefinition,
    lifeStage: AnimalLifeStage
  ): HTMLImageElement | undefined {
    const stageKey = this.getStageKey(spec.id, lifeStage);

    // 1. Kiểm tra texture của chính giai đoạn đó
    if (this.assetManager.hasTexture(stageKey)) {
      return this.assetManager.getTexture(stageKey);
    }

    const adultKey = this.getStageKey(spec.id, 'adult');
    const isFallbackStage = lifeStage !== 'adult';

    // 2. Nếu là con non / già lão và ảnh riêng đã thất bại, nhưng ảnh adult có sẵn -> dùng adult
    const stageUrl = this.resolveStageUrl(spec.spriteDirectory, lifeStage);
    const stageStatus = this.urlStatus.get(stageUrl);

    if (isFallbackStage && stageStatus === 'failed') {
      if (this.assetManager.hasTexture(adultKey)) {
        return this.assetManager.getTexture(adultKey);
      }
      const adultUrl = this.resolveStageUrl(spec.spriteDirectory, 'adult');
      const adultStatus = this.urlStatus.get(adultUrl);
      if (!adultStatus) {
        this.triggerLoad(adultKey, adultUrl);
      }
      return undefined;
    }

    // 3. Nếu chưa từng thử nạp stageUrl -> kích hoạt nạp
    if (!stageStatus) {
      this.triggerLoad(stageKey, stageUrl, () => {
        // Callback khi stageUrl tải thất bại: nếu là child/elder thì thử tiếp adult
        if (isFallbackStage) {
          const adultUrl = this.resolveStageUrl(spec.spriteDirectory, 'adult');
          if (!this.urlStatus.has(adultUrl)) {
            this.triggerLoad(adultKey, adultUrl);
          }
        }
      });
    }

    return undefined;
  }

  /**
   * Kích hoạt nạp texture không đồng bộ và ghi nhận trạng thái pending/loaded/failed
   */
  private triggerLoad(key: string, url: string, onFailure?: () => void): void {
    if (this.urlStatus.get(url) === 'pending' || this.urlStatus.get(url) === 'loaded') {
      return;
    }

    this.urlStatus.set(url, 'pending');

    this.assetManager
      .loadTexture(key, url)
      .then(() => {
        this.urlStatus.set(url, 'loaded');
      })
      .catch(() => {
        this.urlStatus.set(url, 'failed');
        if (onFailure) {
          onFailure();
        }
      });
  }
}
