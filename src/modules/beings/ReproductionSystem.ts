import { isActiveBondBetween } from '../social/RelationshipRules.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { System } from '../../ecs/System.ts';
import { PositionComponent, HealthComponent, LifespanComponent, RaceComponent, ChildcareComponent, HungerComponent, MortalNeedsComponent, NameComponent } from './BeingComponents.ts';
import { FamilyComponent, REPRODUCTION_CONFIG as config } from './FamilyComponent.ts';
import { AppearanceComponent } from '../appearance/Appearance.ts';
import { SocialRelationshipComponent } from '../social/SocialComponents.ts';
import { BeingFactory } from './BeingFactory.ts';
import { CombatStatsComponent } from '../combat/CombatComponents.ts';
import { EventBus } from '../../core/EventBus.ts';
import { TimeManager } from '../../core/TimeManager.ts';
export class ReproductionSystem implements System {
  name='ReproductionSystem'; enabled=true; priority=35; private timer=0;
  constructor(private random:()=>number=Math.random) {}
  update(world:ECSWorld,dt:number):void {
    const deltaDays = dt * (TimeManager.TICKS_PER_SECOND / TimeManager.TICKS_PER_DAY);
    const beings=world.query([FamilyComponent,HealthComponent,PositionComponent,LifespanComponent,RaceComponent]);
    let living=0;
    for(const id of beings) {
      if(world.getComponent(id,HealthComponent)!.isDead) continue;
      living++;
      const family=world.getComponent(id,FamilyComponent)!;
      family.birthCooldown=Math.max(0,family.birthCooldown - deltaDays);
    }
    this.timer+=dt;if(this.timer<config.checkIntervalSeconds)return;this.timer=0;
    if(!config.enabled||living>=config.populationLimit)return;
    let births=0;
    const eligible=(id:number)=>{
      const hp=world.getComponent(id,HealthComponent);const life=world.getComponent(id,LifespanComponent);const family=world.getComponent(id,FamilyComponent);
      return !!hp&&!hp.isDead&&hp.current>=hp.max*0.7&&!!life&&life.currentAge>=config.minAge&&life.currentAge<life.maxLifespan*config.maxLifespanRatio&&!!family&&family.birthCooldown===0&&(world.getComponent(id,HungerComponent)?.current??0)>50&&world.getComponent(id,CombatStatsComponent)?.targetEntityId==null;
    };
    for(const id of beings) {
      const family=world.getComponent(id,FamilyComponent)!;
      if(family.sex!=='female'||!eligible(id)) continue;
      const pos=world.getComponent(id,PositionComponent)!;
      const race=world.getComponent(id,RaceComponent)!.raceId;
      const species=world.getComponent(id,AppearanceComponent)?.speciesId;
      const relatives=world.getComponent(id,SocialRelationshipComponent);
      // People need a mutual companion bond; beasts select a nearby partner of the same species.
      const candidates=race==='beast'?beings:[...(relatives?.relationships.values()??[])].filter(r=>r.relationType==='dao_companion').map(r=>r.targetEntityId);
      for(const partner of candidates) {
        const other=world.getComponent(partner,FamilyComponent);
        if(partner===id||!other||other.sex!=='male'||!eligible(partner))continue;
        if(world.getComponent(partner,RaceComponent)?.raceId!==race||world.getComponent(partner,AppearanceComponent)?.speciesId!==species)continue;
        if(family.parentIds.includes(partner)||other.parentIds.includes(id)||family.parentIds.some(p=>other.parentIds.includes(p)))continue;
        if(race!=='beast'&&!isActiveBondBetween(world,id,partner,'dao_companion'))continue;
        const p=world.getComponent(partner,PositionComponent);if(!p||Math.hypot(p.x-pos.x,p.y-pos.y)>48)continue;
        if(this.random()>=config.chancePerCheck)break;
        const child=BeingFactory.createNewborn(world,id,partner);
        if(child===null)break;
        family.birthCooldown=other.birthCooldown=config.cooldownSeconds;
        EventBus.getInstance().emit('world:log',{type:'birth',message:`👶 ${world.getComponent(id,NameComponent)?.name} đón một sinh linh mới.`});
        births++;living++;break;
      }
      if(births>=config.maxBirthsPerCheck||living>=config.populationLimit)break;
    }
  }
}
export class ChildcareSystem implements System {
  name='ChildcareSystem';enabled=true;priority=21;private timer=0;
  update(world:ECSWorld,dt:number):void {
    this.timer+=dt;if(this.timer<1)return;this.timer=0;
    for(const id of world.query([ChildcareComponent,FamilyComponent,HealthComponent,PositionComponent,HungerComponent])) {
      const child=world.getComponent(id,ChildcareComponent)!;
      if(!child.isChild||world.getComponent(id,HealthComponent)!.isDead)continue;
      const live=(p:number)=>{const hp=world.getComponent(p,HealthComponent);return hp&&!hp.isDead;};
      if(child.guardianEntityId===null||!live(child.guardianEntityId)) child.guardianEntityId=world.getComponent(id,FamilyComponent)!.parentIds.find(live)??null;
      if(child.guardianEntityId===null)continue;
      const guardian=child.guardianEntityId;const p=world.getComponent(guardian,PositionComponent);const pos=world.getComponent(id,PositionComponent)!;
      if(!p||Math.hypot(p.x-pos.x,p.y-pos.y)>48)continue;
      const hunger=world.getComponent(id,HungerComponent)!;const needs=world.getComponent(guardian,MortalNeedsComponent);
      if(hunger.current<55&&needs) {
        if(needs.cookedMealCount>=1){needs.cookedMealCount--;hunger.current=Math.min(100,hunger.current+60);}
        else if(needs.rawFoodCount>=1){needs.rawFoodCount--;hunger.current=Math.min(100,hunger.current+35);}
      }
    }
  }
}
