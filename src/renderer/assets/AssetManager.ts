import { AppearanceRegistry, AppearanceManifest } from '../../modules/appearance/Appearance.ts';
import { ANIMATION_CONFIGS } from '../../config/animations.config.ts';
import { WEAPON_DEFINITIONS } from '../../config/weapons.config.ts';
import { TOOL_DEFINITIONS } from '../../config/tools.config.ts';
import { ARMOR_DEFINITIONS } from '../../modules/combat/CombatComponents.ts';

export const BUILTIN_ASSET_PATHS: Record<string, string> = {
  // Bản đồ địa hình (Map Terrains)
  terrain_plain: 'assets/sprites/map/terrain_plain.png',
  terrain_hill: 'assets/sprites/map/terrain_hill.png',
  terrain_mountain: 'assets/sprites/map/terrain_mountain.png',
  terrain_dense_forest: 'assets/sprites/map/terrain_dense_forest.png',
  terrain_plateau: 'assets/sprites/map/terrain_plateau.png',
  terrain_swamp: 'assets/sprites/map/terrain_swamp.png',
  terrain_river: 'assets/sprites/map/terrain_river.png',
  terrain_lake: 'assets/sprites/map/terrain_lake.png',
  terrain_ocean: 'assets/sprites/map/terrain_ocean.png',

  // Công trình (Buildings)
  building_campfire: 'assets/sprites/buildings/campfire.png',
  building_village_well: 'assets/sprites/buildings/village_well.png',
  building_thatched_hut: 'assets/sprites/buildings/thatched_hut.png',
  building_mortal_farm: 'assets/sprites/buildings/mortal_farm.png',
  building_meditation_cave: 'assets/sprites/buildings/meditation_cave.png',
  building_sect_hall: 'assets/sprites/buildings/sect_hall.png',
  building_alchemy_chamber: 'assets/sprites/buildings/alchemy_chamber.png',
  building_scripture_pavilion: 'assets/sprites/buildings/scripture_pavilion.png',
  building_defense_array: 'assets/sprites/buildings/defense_array.png',
  building_herb_garden: 'assets/sprites/buildings/herb_garden.png',

  // Cây cối & Thảo dược (Flora)
  plant_oak_tree: 'assets/sprites/flora/oak_tree.png',
  plant_pine_tree: 'assets/sprites/flora/pine_tree.png',
  plant_bamboo: 'assets/sprites/flora/bamboo.png',
  plant_berry_bush: 'assets/sprites/flora/berry_bush.png',
  plant_tu_linh_diep: 'assets/sprites/flora/tu_linh_diep.png',
  plant_ngung_huyet_thao: 'assets/sprites/flora/ngung_huyet_thao.png',
  plant_tay_tuy_chi: 'assets/sprites/flora/tay_tuy_chi.png',
  plant_cuu_diep_chi_lan: 'assets/sprites/flora/cuu_diep_chi_lan.png',
};

export class AssetManager {
  private static instance: AssetManager;
  private textures: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Tự động quét và nạp trước tất cả assets đã được cấu hình
   * Nếu file chưa tồn tại (chưa vẽ), game vẫn hoạt động bình thường nhờ procedural fallback
   */
  public async preloadConfiguredAssets(): Promise<void> {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;

    const promises: Promise<HTMLImageElement | void>[] = [];

    // 1. Tải hoạt ảnh nhân vật từ ANIMATION_CONFIGS
    for (const [key, cfg] of Object.entries(ANIMATION_CONFIGS)) {
      if (cfg.texturePath) {
        promises.push(
          this.loadTexture(key, cfg.texturePath).catch(() => {
            // Chưa có file ảnh, tiếp tục dùng procedural fallback
          })
        );
      }
    }

    // 2. Tải texture bản đồ, công trình, cây thảo dược
    for (const [key, path] of Object.entries(BUILTIN_ASSET_PATHS)) {
      promises.push(
        this.loadTexture(key, path).catch(() => {
          // Chưa có file ảnh, tiếp tục dùng procedural fallback
        })
      );
    }

    // Curated RPG gear icons used by the divine equipment catalog.
    const itemIconPaths = [
      ...Object.values(WEAPON_DEFINITIONS),
      ...Object.values(TOOL_DEFINITIONS),
      ...Object.values(ARMOR_DEFINITIONS)
    ].map(item => item.iconPath).filter((path): path is string => Boolean(path));
    for (const path of itemIconPaths) {
      promises.push(this.loadTexture(path, path).catch(() => undefined));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Tải ảnh texture không đồng bộ
   * @param key Tên định danh (vd: 'human_base')
   * @param url Đường dẫn file ảnh
   */
  public async loadTexture(key: string, url: string): Promise<HTMLImageElement> {
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.textures.set(key, img);
        this.loadingPromises.delete(key);
        resolve(img);
      };
      img.onerror = (err) => {
        this.loadingPromises.delete(key);
        reject(err);
      };
      img.src = url;
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  public async loadAppearanceCatalog(): Promise<void> {
    try {
      const response = await fetch('appearance-manifest.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Không tải được danh mục ngoại hình');
      const catalog = await response.json() as AppearanceManifest;
      AppearanceRegistry.instance.install(catalog);
      for (const message of catalog.diagnostics) console.warn(message);
      const paths = new Set<string>();
      for (const a of catalog.appearances) for (const stage of Object.values(a.stages)) {
        paths.add(stage.body); if(stage.casual) paths.add(stage.casual);
      }
      for (const e of catalog.equipment) for (const stage of Object.values(e.stages)) {
        paths.add(stage.front); if(stage.back) paths.add(stage.back);
      }
      const pending = [...paths];
      // Bound concurrent decoding, and share each atlas between all residents.
      await Promise.all(Array.from({length: Math.min(8,pending.length)}, async()=>{
        while(pending.length) {const url=pending.pop()!;try {await this.loadTexture(url,url);} catch {AppearanceRegistry.instance.diagnostics.push('Không đọc được ảnh: '+url);}}
      }));
      for(const [id,a] of AppearanceRegistry.instance.appearances) {
        if(Object.values(a.stages).some(s=>!this.hasTexture(s.body)||(s.casual&&!this.hasTexture(s.casual)))) AppearanceRegistry.instance.appearances.delete(id);
      }
      for(const [id,e] of AppearanceRegistry.instance.equipment) {
        if(Object.values(e.stages).some(s=>!this.hasTexture(s.front)||(s.back&&!this.hasTexture(s.back)))) AppearanceRegistry.instance.equipment.delete(id);
      }
    } catch(error) {console.warn('Dùng ngoại hình mặc định:',error);}
  }

  public getTexture(key: string): HTMLImageElement | undefined {
    return this.textures.get(key);
  }

  public hasTexture(key: string): boolean {
    return this.textures.has(key);
  }
}
