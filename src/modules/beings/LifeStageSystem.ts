import { ECSWorld } from '../../ecs/World.ts';
import { System } from '../../ecs/System.ts';
import { LifespanComponent, ChildcareComponent, HealthComponent } from './BeingComponents.ts';
import { ADULT_AGE } from '../appearance/Appearance.ts';
export class LifeStageSystem implements System {
  name='LifeStageSystem'; enabled=true; priority=23;
  update(world:ECSWorld):void {
    for(const id of world.query([LifespanComponent,ChildcareComponent])) {
      if(world.getComponent(id,HealthComponent)?.isDead) continue;
      world.getComponent(id,ChildcareComponent)!.isChild=world.getComponent(id,LifespanComponent)!.currentAge<ADULT_AGE;
    }
  }
}
