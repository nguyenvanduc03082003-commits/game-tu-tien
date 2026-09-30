export type LifeStage = 'child' | 'adult' | 'elder';
export const LIFE_STAGES: LifeStage[] = ['child','adult','elder'];
export const ADULT_AGE = 15;
export function lifeStage(age: number, lifespan: number): LifeStage {
  return age < ADULT_AGE ? 'child' : age >= lifespan * 0.9 ? 'elder' : 'adult';
}
export class AppearanceComponent {
  constructor(public appearanceId: string, public speciesId: string, public bodyProfile: string) {}
}
export interface AppearanceDefinition {
  id: string; raceId: string; speciesId: string; bodyProfile: string; frameSize: number; weight: number;
  stages: Record<LifeStage, {body: string; casual?: string}>;
}
export interface EquipmentVisual {
  itemId: string; bodyProfile: string; frameSize: number;
  stages: Record<LifeStage,{front:string;back?:string}>;
}
export interface AppearanceManifest {
  version: number; appearances: AppearanceDefinition[]; equipment: EquipmentVisual[]; diagnostics: string[];
}
import { BEAST_SPECIES, inferYaoSpecies } from '../../config/yao/yao-species.config.ts';
export { BEAST_SPECIES };
export function inferSpecies(race: string, name: string): string {
  return inferYaoSpecies(race, name);
}
export class AppearanceRegistry {
  static readonly instance = new AppearanceRegistry();
  appearances = new Map<string,AppearanceDefinition>();
  equipment = new Map<string,EquipmentVisual>();
  diagnostics: string[] = [];
  install(manifest: AppearanceManifest): void {
    if(manifest.version!==1 || !Array.isArray(manifest.appearances)||!Array.isArray(manifest.equipment)) throw Error('Danh mục ngoại hình không hợp lệ');
    this.appearances.clear();this.equipment.clear();
    for(const a of manifest.appearances) this.appearances.set(a.id,a);
    for(const e of manifest.equipment) this.equipment.set(`${e.itemId}/${e.bodyProfile}`,e);
    this.diagnostics=manifest.diagnostics??[];
  }
  choose(race: string, species: string, random= Math.random): AppearanceComponent {
    const candidates=[...this.appearances.values()].filter(a=>a.raceId===race&&a.speciesId===species);
    let roll=random()*candidates.reduce((n,a)=>n+a.weight,0);
    for(const a of candidates) {roll-=a.weight;if(roll<0) return new AppearanceComponent(a.id,species,a.bodyProfile);}
    return new AppearanceComponent(`builtin/${race}/${species}`,species,race==='beast'?species:'humanoid_standard');
  }
  visual(itemId: string, appearance: AppearanceComponent): EquipmentVisual | undefined {
    return this.equipment.get(`${itemId}/${appearance.bodyProfile}`);
  }
}
