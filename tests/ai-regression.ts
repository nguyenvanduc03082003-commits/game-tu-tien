import assert from 'node:assert/strict';
import './dialogue-regression.ts';
import './activity-overlay-regression.ts';
import './faction-pacing-regression.ts';
import './construction-pipeline-regression.ts';
import './responsive-hud-regression.ts';
import './construction-lifecycle-audit-regression.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { PositionComponent, HealthComponent, MortalNeedsComponent, CharacterStateComponent, NameComponent, DailyScheduleComponent, HungerComponent } from '../src/modules/beings/BeingComponents.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent, AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { StrategicGoalEvaluator } from '../src/modules/ai/brain/goals/StrategicGoal.ts';
import { residentPreferences } from '../src/modules/ai/brain/ResidentPreferences.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { WeatherType } from '../src/config/weather.config.ts';
const map = new WorldMap(32,32);
function fixture() {
 const world = new ECSWorld(); const id = world.createEntity();
 for (const component of [new PositionComponent(40,40), new HealthComponent(100), new MortalNeedsComponent(90,90,10), new CharacterStateComponent(), new NameComponent('An'), new SocialRelationshipComponent()]) world.addComponent(id,component);
 const planner = world.addComponent(id,new AIPlannerComponent());
 const bt = world.addComponent(id,new AIBehaviorTreeComponent());
 const needs = world.getComponent(id,MortalNeedsComponent)!;
 planner.planStatus='executing'; planner.currentPlanGoal='LABOUR_WORK';
 return {world,id,planner,bt,needs};
}
let passed=0;
function test(name:string, fn:()=>void) { fn(); passed++; console.log('PASS',name); }
test('cooking consumes one ingredient per completed action at different tick sizes',()=>{
 for(const dt of [0.05,0.25,1]) {
  const f=fixture(); f.needs.rawFoodCount=5;
  f.planner.steps=[{type:'PERFORM_WORK',description:'cook',duration:2,customData:{workType:'cook'}}];
  for(let t=0;t<4;t+=dt) BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,dt);
  assert.equal(f.needs.rawFoodCount,4); assert.equal(f.needs.cookedMealCount,2);
 }
});
test('failed plans cannot produce resources while waiting to replan',()=>{
 const f=fixture(); f.planner.steps=[{type:'PERFORM_WORK',description:'farm',duration:1,customData:{workType:'farm'}}];
 f.planner.failCurrentPlan('blocked'); const before=f.needs.rawFoodCount;
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1); assert.equal(f.needs.rawFoodCount,before);
});
test('solitary recreation recovers mood',()=>{
 const f=fixture(); f.planner.currentPlanGoal='SOCIAL_RECREATE'; f.planner.steps=[{type:'IDLE_WAIT',description:'rest',duration:3}];
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1); assert.ok(f.needs.recreation>10);
});
test('social interaction improves both relationships once and fails when partner leaves',()=>{
 const f=fixture(); const other=f.world.createEntity();
 f.world.addComponent(other,new PositionComponent(45,40)); f.world.addComponent(other,new HealthComponent(100)); f.world.addComponent(other,new SocialRelationshipComponent());
 f.planner.currentPlanGoal='SOCIAL_RECREATE'; f.planner.steps=[{type:'IDLE_WAIT',description:'chat',duration:1,customData:{socialWith:other}}];
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1);
 assert.equal(f.world.getComponent(other,SocialRelationshipComponent)!.getRelationship(f.id)!.affinity,1);
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1);
 assert.equal(f.world.getComponent(other,SocialRelationshipComponent)!.getRelationship(f.id)!.affinity,1);
 f.planner.currentStepIndex=0; f.planner.planStatus='executing'; f.world.getComponent(other,PositionComponent)!.x=400;
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1); assert.equal(f.planner.planStatus,'failed');
});
test('travel timeout fails rather than granting remote work',()=>{
 const f=fixture(); f.planner.steps=[{type:'MOVE_TO',description:'travel',targetPos:{x:400,y:400}},{type:'PERFORM_WORK',description:'farm'}]; f.planner.stepElapsedTimer=13;
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,0.05); assert.equal(f.planner.planStatus,'failed'); assert.equal(f.planner.currentStepIndex,0);
});
test('preferences are stable and diverse',()=>{
 const world = new ECSWorld(); const id = world.createEntity();
 assert.deepEqual(residentPreferences(id,world),residentPreferences(id,world));
 const values=Array.from({length:100},()=>residentPreferences(world.createEntity(),world).sociability);
 assert.ok(values.some(v=>v<0.2)&&values.some(v=>v>0.8));
});
test('urgent thirst interrupts routine behavior',()=>{
 const f=fixture(); const brain=new AIStrategicBrainComponent('LABOUR_WORK'); f.needs.thirst=5;
 f.world.addComponent(f.id,new DailyScheduleComponent('farmer',0));
 f.world.addComponent(f.id,new HungerComponent());
 StrategicGoalEvaluator.evaluate(f.world,f.id,brain,map,new QiGrid(32,32),WeatherType.CLEAR,0.4);
 assert.equal(brain.currentGoal,'SURVIVE_VITAL');
});

test('raw meals restore hunger and cannot consume absent food',()=>{
 const f=fixture(); const hunger=f.world.addComponent(f.id,new HungerComponent()); hunger.current=10;
 f.needs.rawFoodCount=1; f.planner.steps=[{type:'INTERACT_BUILDING',description:'eat',customData:{action:'eat_raw'}}];
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,0.05);
 assert.equal(hunger.current,45); assert.equal(f.needs.rawFoodCount,0);
 f.planner.currentStepIndex=0; f.planner.planStatus='executing';
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,0.05);
 assert.equal(f.planner.planStatus,'failed'); assert.equal(hunger.current,45);
});
test('foraging grants supplies once without producing cooked meals',()=>{
 const f=fixture(); f.planner.steps=[{type:'PERFORM_WORK',description:'forage',duration:1,customData:{workType:'forage'}}];
 const before=f.needs.rawFoodCount;
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1);
 BehaviorTreeExecutor.tick(f.world,f.id,f.bt,f.planner,map,1);
 assert.equal(f.needs.rawFoodCount,before+2); assert.equal(f.needs.cookedMealCount,0);
});

console.log(`${passed} AI regression tests passed`);

import './appearance-regression.ts';
import './entity-label-regression.ts';
import './faction-settlement-regression.ts';
import './save-regression.ts';
import './talent-potential-regression.ts';
import './trait-catalog-regression.ts';
import './trait-runtime-regression.ts';
import './talent-save-regression.ts';
import './talent-generation-regression.ts';
import './mental-growth-regression.ts';
import './pill-usage-regression.ts';
import './world-chronicle-regression.ts';
import './time-pacing-regression.ts';





