import { ECSWorld } from '../../ecs/World.ts';
import { AppearanceComponent, AppearanceRegistry, lifeStage } from '../../modules/appearance/Appearance.ts';
import { CharacterStateComponent, AnimationComponent, LifespanComponent } from '../../modules/beings/BeingComponents.ts';
import { EquipmentComponent } from '../../modules/combat/CombatComponents.ts';
import { AssetManager } from '../assets/AssetManager.ts';
export function appearanceLayers(world:ECSWorld,id:number): {paths:string[];frameSize:number;row:number;column:number}|null {
  const appearance=world.getComponent(id,AppearanceComponent);
  const life=world.getComponent(id,LifespanComponent);
  const state=world.getComponent(id,CharacterStateComponent);
  if(!appearance||!life||!state) return null;
  const definition=AppearanceRegistry.instance.appearances.get(appearance.appearanceId);
  if(!definition) return null;
  const stage=lifeStage(life.currentAge,life.maxLifespan);
  const base=definition.stages[stage];
  const armor=world.getComponent(id,EquipmentComponent)?.bodyArmor;
  const visual=armor?AppearanceRegistry.instance.visual(armor.id,appearance):undefined;
  const clothing=visual?.frameSize===definition.frameSize?visual.stages[stage]:undefined;
  const paths=[clothing?.back,base.body,clothing?.front??base.casual].filter((p):p is string=>!!p);
  const moving=state.state==='walk';
  const direction=['down','left','right','up'].indexOf(state.direction);
  return {paths,frameSize:definition.frameSize,row:(moving?4:0)+Math.max(0,direction),column:state.state==='dead'?0:(world.getComponent(id,AnimationComponent)?.frameIndex??0)%(moving?6:4)};
}
export function renderLayeredCharacter(ctx:CanvasRenderingContext2D,world:ECSWorld,id:number,x:number,y:number,size:number):boolean {
  const layers=appearanceLayers(world,id);
  const assets=AssetManager.getInstance();
  if(!layers||layers.paths.some(p=>!assets.hasTexture(p))) return false;
  const f=layers.frameSize;
  ctx.save();
  ctx.translate(Math.floor(x),Math.floor(y));
  if(world.getComponent(id,CharacterStateComponent)?.state==='dead') ctx.rotate(Math.PI/2);
  for(const p of layers.paths) ctx.drawImage(assets.getTexture(p)!,layers.column*f,layers.row*f,f,f,-size/2,-size*0.875,size,size);
  ctx.restore();
  return true;
}
