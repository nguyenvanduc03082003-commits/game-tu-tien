import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { AppearanceRegistry,AppearanceComponent,lifeStage } from '../src/modules/appearance/Appearance.ts';
import { LifespanComponent,ChildcareComponent,SpiritualRootComponent,TraitsComponent,NameComponent,HealthComponent,HungerComponent,CharacterStateComponent,AnimationComponent } from '../src/modules/beings/BeingComponents.ts';
import { EquipmentComponent } from '../src/modules/combat/CombatComponents.ts';
import { InventoryComponent } from '../src/modules/alchemy/InventoryComponent.ts';
import { LifeStageSystem } from '../src/modules/beings/LifeStageSystem.ts';
import { SpiritualRootSystem } from '../src/modules/cultivation/SpiritualRootSystem.ts';
import { FamilyComponent } from '../src/modules/beings/FamilyComponent.ts';
import { ReproductionSystem } from '../src/modules/beings/ReproductionSystem.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { equipArmor } from '../src/modules/appearance/EquipmentAppearance.ts';
import { appearanceLayers,renderLayeredCharacter } from '../src/renderer/systems/LayeredCharacterRenderer.ts';
import { AssetManager } from '../src/renderer/assets/AssetManager.ts';
import { AnimationSystem } from '../src/renderer/systems/AnimationSystem.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
const stages=Object.fromEntries(['child','adult','elder'].map(s=>[s,{body:`${s}/body`,casual:`${s}/casual`}]));
const a={id:'human/human/a',raceId:'human',speciesId:'human',bodyProfile:'humanoid_standard',frameSize:64,weight:1,stages};
const gear={itemId:'linen_robe',bodyProfile:'humanoid_standard',frameSize:64,stages:Object.fromEntries(['child','adult','elder'].map(s=>[s,{front:`${s}/armor`,back:`${s}/back` }]))};
const registry=AppearanceRegistry.instance;
const install=()=>registry.install({version:1,appearances:[a,{...a,id:'human/human/b'}],equipment:[gear],diagnostics:[]} as any);
install();
let passed=0;function test(name:string,fn:()=>void){fn();passed++;console.log('PASS appearance:',name);}
test('all archetypes spawn age 15–30 with empty equipment and pills',()=>{
 const world=new ECSWorld();
 for(const type of ['mortal_human','yao_common','mortal_demon'])for(let i=0;i<30;i++){
  const id=BeingFactory.spawnFromArchetype(world,type,40,40);const age=world.getComponent(id,LifespanComponent)!.currentAge;
  assert.ok(age>=15&&age<=30);assert.deepEqual(Object.values(world.getComponent(id,EquipmentComponent)!),[null,null,null,null,null]);
  assert.equal(world.getComponent(id,InventoryComponent)!.pills.size,0);assert.ok(world.getComponent(id,AppearanceComponent));
 }
});
test('weighted selection and species isolation use explicit stable IDs',()=>{
 assert.equal(registry.choose('human','human',()=>0).appearanceId,a.id);
 assert.equal(registry.choose('human','human',()=>0.99).appearanceId,'human/human/b');
 assert.equal(registry.choose('beast','tiger',()=>0).appearanceId,'builtin/beast/tiger');
});
test('newborn retains appearance and traits across awakening, adulthood and old age',()=>{
 const world=new ECSWorld();const p=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);const q=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);
 const child=BeingFactory.createNewborn(world,p,q)!;assert.notEqual(child,null);
 const life=world.getComponent(child,LifespanComponent)!;const appearance=world.getComponent(child,AppearanceComponent)!.appearanceId;const traits=JSON.stringify(world.getComponent(child,TraitsComponent));
 assert.equal(life.currentAge,0);assert.equal(world.getComponent(child,ChildcareComponent)!.guardianEntityId,p);
 assert.equal(world.getComponent(child,SocialRelationshipComponent)!.getRelationship(q)!.relationType,'kin_parent');
 life.currentAge=12;new SpiritualRootSystem().update(world,1);assert.equal(world.getComponent(child,ChildcareComponent)!.isChild,true);
 life.currentAge=15;new LifeStageSystem().update(world);assert.equal(world.getComponent(child,ChildcareComponent)!.isChild,false);
 assert.equal(lifeStage(14,100),'child');assert.equal(lifeStage(15,100),'adult');assert.equal(lifeStage(90,100),'elder');assert.equal(lifeStage(90,200),'adult');
 assert.equal(world.getComponent(child,AppearanceComponent)!.appearanceId,appearance);assert.equal(JSON.stringify(world.getComponent(child,TraitsComponent)),traits);
});
test('clothing replaces casual and follows shared pose on all directions and stages',()=>{
 const world=new ECSWorld();const id=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);
 assert.equal(equipArmor(world,id,'linen_robe'),null);
 const state=world.getComponent(id,CharacterStateComponent)!;state.state='walk';const anim=world.getComponent(id,AnimationComponent)!;
 for(const [index,direction] of ['down','left','right','up'].entries())for(const [age,stage]of [[0,'child'],[20,'adult'],[1000,'elder']] as const){
  state.direction=direction as any;world.getComponent(id,LifespanComponent)!.currentAge=age;new AnimationSystem().update(world,0.15);
  const layers=appearanceLayers(world,id)!;assert.deepEqual(layers.paths,[`${stage}/back`,`${stage}/body`,`${stage}/armor`]);assert.equal(layers.row,index+4);assert.equal(layers.column,anim.frameIndex);
 }
 assert.equal(equipArmor(world,id,null),null);assert.ok(appearanceLayers(world,id)!.paths.some(p=>p.endsWith('casual')));
 assert.ok(equipArmor(world,id,'black_iron_armor'));assert.equal(world.getComponent(id,EquipmentComponent)!.bodyArmor,null);
});
test('renderer draws every layer at the identical source frame and destination anchor',()=>{
 const world=new ECSWorld();const id=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);equipArmor(world,id,'linen_robe');
 const layers=appearanceLayers(world,id)!;const assets=AssetManager.getInstance();
 for(const path of layers.paths)(assets as any).textures.set(path,{src:path});
 const calls:any[]=[];const ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...args:any[]){calls.push(args);}};
 assert.equal(renderLayeredCharacter(ctx as any,world,id,50,50,32),true);assert.equal(calls.length,3);
 assert.deepEqual(calls[0].slice(1),calls[1].slice(1));assert.deepEqual(calls[1].slice(1),calls[2].slice(1));
});
test('natural births obey cooldown, parent relationship and population accounting',()=>{
 const world=new ECSWorld();const p=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);const q=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);
 for(const [id,sex] of [[p,'female'],[q,'male']]as const){const f=world.getComponent(id,FamilyComponent)!;f.sex=sex;f.birthCooldown=0;world.getComponent(id,LifespanComponent)!.currentAge=25;world.getComponent(id,HungerComponent)!.current=90;}
 world.getComponent(p,SocialRelationshipComponent)!.setRelationship(q,'Q','dao_companion',80);world.getComponent(q,SocialRelationshipComponent)!.setRelationship(p,'P','dao_companion',80);
 const system=new ReproductionSystem(()=>0);system.update(world,5);assert.equal(world.query([FamilyComponent]).length,3);
 system.update(world,5);assert.equal(world.query([FamilyComponent]).length,3);
 assert.ok(world.getComponent(p,FamilyComponent)!.birthCooldown>0);
});
test('save round trip preserves appearance, equipment, family and missing catalog IDs',()=>{
 const world=new ECSWorld();const id=BeingFactory.spawnFromArchetype(world,'mortal_human',40,40);equipArmor(world,id,'linen_robe');
 const engine={world,worldMap:new WorldMap(8,8),qiGrid:new QiGrid(8,8),camera:{x:0,y:0,zoom:1},timeManager:TimeManager.getInstance(),spatialGrid:new SpatialGrid(32),worldName:'test',worldTemplate:'test',worldSeed:42} as any;
 const first=SaveManager.serializeWorld(engine);const original=first.entities[0].components.appearance;
 registry.install({version:1,appearances:[],equipment:[],diagnostics:[]});
 SaveManager.deserializeWorld(engine,JSON.parse(JSON.stringify(first)));
 const second=SaveManager.serializeWorld(engine);assert.deepEqual(second.entities[0].components.appearance,original);assert.equal(second.entities[0].components.equip.bodyArmorId,'linen_robe');assert.deepEqual(second.entities[0].components.family,first.entities[0].components.family);
 install();const legacy=JSON.parse(JSON.stringify(first));delete legacy.entities[0].components.appearance;delete legacy.entities[0].components.family;
 SaveManager.deserializeWorld(engine,legacy);const migrated=world.getComponent(id,AppearanceComponent)!.appearanceId;
 SaveManager.deserializeWorld(engine,SaveManager.serializeWorld(engine));assert.equal(world.getComponent(id,AppearanceComponent)!.appearanceId,migrated);
});
console.log(`${passed} appearance regression tests passed`);
