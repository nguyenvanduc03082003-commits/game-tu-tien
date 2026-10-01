import assert from 'node:assert/strict';
import { socialFixture } from './social-fixture.ts';
import { evaluateSocialFamiliarity, readSocialFamiliarity, clearSocialFamiliarity } from '../src/modules/social/SocialFamiliarityService.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { performConversation } from '../src/modules/social/SocialConversationService.ts';
import { createCommunityConversationScan, performCommunityConversations } from '../src/modules/social/CommunityConversationService.ts';
import { setSocialTelemetryEnabled, readSocialTelemetry } from '../src/modules/social/SocialSimulationTelemetry.ts';
import { evaluateSocialMeetingTarget } from '../src/modules/social/SocialDecisionService.ts';
import { HealthComponent, PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { SaveManager } from '../src/modules/save/SaveManager.ts';
import { validateSocialSave } from '../src/modules/social/SocialSaveCodec.ts';
import { handleBondBetrayal } from '../src/modules/social/RelationshipService.ts';
import { endBondsForDeath } from '../src/modules/social/SocialDeathService.ts';
import { recordSocialPlan } from '../src/modules/social/SocialPlanTelemetry.ts';
import { AIPlannerComponent, AIBehaviorTreeComponent } from '../src/modules/ai/brain/AIComponents.ts';
import { BehaviorTreeExecutor } from '../src/modules/ai/brain/behavior/BehaviorTree.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { InsideBuildingComponent } from '../src/modules/factions/FactionComponents.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { renderSocialRelationshipDetails } from '../src/ui/SocialRelationshipInspector.ts';
let passed = 0;
function test(name: string, run: () => void) { run(); passed++; console.log(`PASS G6 ${name}`); }
const progress = { schemaVersion: 1 as const, neutralCount: 2, lastQualifiedDay: 1, lastQualifiedTick: 400 };
test('neutral 1/2/3 rewards once, duplicate tick and fractional cap', () => {
  let p; for (let i = 0; i < 3; i++) { const r = evaluateSocialFamiliarity(p, 'neutral', 10, 10, 50, { day: i, tick: i * 400 }); assert.equal(r.trustDelta, i === 2 ? 1 : 0); p = r.next; }
  assert.equal(p!.neutralCount, 0);
  assert.equal(evaluateSocialFamiliarity(p, 'neutral', 10, 10, 51, { day: 2, tick: 800 }).result, 'duplicate');
  const capped = evaluateSocialFamiliarity(progress, 'neutral', 10, 10, 59.5, { day: 2, tick: 800 });
  assert.equal(capped.trustDelta, .5); assert.equal(capped.next, undefined);
});
test('affinity, outcome, clock and exact expiry boundaries', () => {
  for (const [a, b, t, outcome] of [[9,10,50,'neutral'],[10,9,50,'neutral'],[10,10,60,'neutral'],[10,10,50,'warm'],[10,10,50,'awkward']] as const)
    assert.equal(evaluateSocialFamiliarity(progress, outcome, a, b, t, {day:2,tick:800}).result, 'reset');
  assert.equal(evaluateSocialFamiliarity(progress,'neutral',10,10,50,{day:10.99,tick:4396}).trustDelta,1);
  assert.equal(evaluateSocialFamiliarity(progress,'neutral',10,10,50,{day:11,tick:4400}).next!.neutralCount,1);
  assert.equal(evaluateSocialFamiliarity(progress,'neutral',10,10,50,{day:NaN,tick:800}).result,'reset');
});
test('reader is readonly, deep snapshot, expiry and death', () => {
  const f = socialFixture(), a=f.resident(), b=f.resident(); f.pair(a,b,10,50); f.world.setCurrentTick(400);
  const record=f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!; record.familiarity={...progress};
  readSocialFamiliarity(f.world,a,b)!.neutralCount=0; assert.equal(record.familiarity.neutralCount,2);
  f.world.setCurrentTick(4400); assert.equal(readSocialFamiliarity(f.world,a,b),null); assert.equal(record.familiarity.neutralCount,2);
  f.world.setCurrentTick(400); f.world.getComponent(b,HealthComponent)!.isDead=true; assert.equal(readSocialFamiliarity(f.world,a,b),null);
  clearSocialFamiliarity(f.world,a,b); assert.equal(record.familiarity,undefined);
});
test('actual neutral commits, skipped no mutation and cooldown 399/400', () => {
  const f=socialFixture(), a=f.resident(), b=f.resident(); f.pair(a,b,10,50);
  for (const tick of [0,400,800]) { f.world.setCurrentTick(tick); assert.equal(performConversation(f.world,a,b,'casual').status,'completed'); }
  const record=f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!; assert.equal(record.trust,51);
  const snapshot=JSON.stringify(record); f.world.setCurrentTick(1199); assert.equal(performConversation(f.world,a,b).status,'skipped'); assert.equal(JSON.stringify(record),snapshot);
  f.world.setCurrentTick(1200); assert.equal(performConversation(f.world,a,b).status,'completed');
});
test('community exact distance, unique overlap and fixed RNG', () => {
  const f=socialFixture(), a=f.resident(100,100), b=f.resident(155,100), c=f.resident(155.001,100);
  setSocialTelemetryEnabled(f.world,true); const scan=createCommunityConversationScan(); const rng=Math.random; Math.random=()=>.5;
  try { performCommunityConversations(f.world,[a,b,c],scan); performCommunityConversations(f.world,[a,b,c],scan); } finally { Math.random=rng; }
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.interactionsCount,1);
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(c),null);
  assert.equal(readSocialTelemetry(f.world).counters['community_scan:duplicate_near_pairs:'],2);
});
test('community rejects distant and cooling pairs without consuming RNG',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(1000,100); const random=Math.random;
  Math.random=()=>{throw new Error('Filter consumed RNG');};
  try { performCommunityConversations(f.world,[a,b],createCommunityConversationScan()); } finally {Math.random=random;}
  f.world.getComponent(b,PositionComponent)!.x=110; performConversation(f.world,a,b);
  Math.random=()=>{throw new Error('Cooldown filter consumed RNG');};
  try {performCommunityConversations(f.world,[a,b],createCommunityConversationScan());} finally {Math.random=random;}
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.interactionsCount,1);
});
test('optimized community equals legacy ordered all pairs for stable fixture', () => {
  const run=(optimized:boolean)=>{ const f=socialFixture(); const ids=[f.resident(100,100),f.resident(110,100),f.resident(155,100),f.resident(400,100)];
    let rngCalls=0;const random=Math.random;Math.random=()=>{rngCalls++;return .5;};
    try {
    if(optimized) performCommunityConversations(f.world,ids,createCommunityConversationScan()); else for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) performConversation(f.world,ids[i],ids[j],'community');
    return {rngCalls,records:ids.map(id=>[...f.world.getComponent(id,SocialRelationshipComponent)!.relationships].map(([target,r])=>({target:ids.indexOf(target),affinity:r.affinity,trust:r.trust,respect:r.respect,interactions:r.interactionsCount,day:r.lastInteractionDay,tick:r.lastInteractionTick,type:r.relationType})))};
    } finally {Math.random=random;} };
  assert.deepEqual(run(true),run(false));
});
test('meeting target dead, moving radius and waiting distance',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(155,100);
  assert.equal(evaluateSocialMeetingTarget(f.world,a,b,true).status,'eligible');
  f.world.getComponent(b,PositionComponent)!.x=155.001; assert.equal(evaluateSocialMeetingTarget(f.world,a,b,true).status,'rejected');
  f.world.getComponent(b,HealthComponent)!.isDead=true; assert.notEqual(evaluateSocialMeetingTarget(f.world,a,b,false).status,'eligible');
});
test('save count two roundtrip, third reward and atomic invalid save',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(); f.pair(a,b,10,50);
  for(const tick of [0,400]) { f.world.setCurrentTick(tick); performConversation(f.world,a,b); }
  TimeManager.getInstance().loadState({totalTicks:400,speed:1,calendarEpochDays:0,calendarEpochTick:0,oldTicksPerDay:400});
  const data=SaveManager.serializeWorld(f.engine); SaveManager.validateSaveData(data);
  SaveManager.deserializeWorld(f.engine,JSON.parse(JSON.stringify(data)));
  assert.equal(readSocialFamiliarity(f.world,a,b)!.neutralCount,2);
  const bad:any=JSON.parse(JSON.stringify(data)); const component=bad.entities.find((e:any)=>e.id===a).components;
  const social=Object.values(component).find((v:any)=>v?.relationships) as any;
  const records=Array.isArray(social.relationships)?social.relationships:Object.values(social.relationships);
  const entry=records[0]; const record=Array.isArray(entry)?entry[1]:entry; record.familiarity.neutralCount=3;
  assert.throws(()=>SaveManager.deserializeWorld(f.engine,bad)); assert.equal(readSocialFamiliarity(f.world,a,b)!.neutralCount,2);
  f.world.setCurrentTick(800); performConversation(f.world,a,b); assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.trust,51);
});
test('save rejects malformed progress and future clocks, allows missing field',()=>{
  for(const patch of [{schemaVersion:2},{neutralCount:-1},{neutralCount:3},{neutralCount:1.5},{lastQualifiedDay:NaN},{lastQualifiedDay:3},{lastQualifiedTick:801},{lastQualifiedTick:-1}]) {
    const f=socialFixture(),a=f.resident(),b=f.resident();f.pair(a,b,10,50);
    const record=f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!;
    assert.throws(()=>validateSocialSave(a,{social:{relationships:[{...record,familiarity:{...progress,...patch}}]}},{day:2,tick:800}));
  }
  const f=socialFixture(),a=f.resident(),b=f.resident();f.pair(a,b,10,80);
  validateSocialSave(a,{social:{relationships:[f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)]}},{day:0,tick:0});
  assert.equal(evaluateSocialFamiliarity(progress,'neutral',10,10,80,{day:2,tick:800}).trustDelta,0);
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.trust,80);
});
test('real betrayal and death clear both directions of ordinary progress',()=>{
  for(const mode of ['betrayal','death']) {const f=socialFixture(),a=f.resident(),b=f.resident();f.pair(a,b,10,50);
    for(const [owner,target] of [[a,b],[b,a]])f.world.getComponent(owner,SocialRelationshipComponent)!.getRelationship(target)!.familiarity={...progress};
    if(mode==='betrayal') {handleBondBetrayal(f.world,a,b,0);assert.ok(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.familiarity);handleBondBetrayal(f.world,a,b,1);}
    else {f.world.getComponent(a,HealthComponent)!.isDead=true;endBondsForDeath(f.world,a);}
    for(const [owner,target] of [[a,b],[b,a]])assert.equal(f.world.getComponent(owner,SocialRelationshipComponent)!.getRelationship(target)!.familiarity,undefined);
  }
});
test('plan revision stays in bounded samples, not aggregate keys',()=>{
  const f=socialFixture(),a=f.resident();setSocialTelemetryEnabled(f.world,true);const p=f.world.getComponent(a,AIPlannerComponent)!;
  p.currentPlanGoal='SOCIAL_RECREATE';for(let i=0;i<300;i++){p.planRevision=i;recordSocialPlan(f.world,a,p,'started');}
  const data=readSocialTelemetry(f.world);assert.equal(data.samples.length,200);assert.equal(Object.keys(data.counters).length,1);assert.equal(data.counters['social_plan:started:rest'],300);assert.equal(data.samples[0].planRevision,299);
});
test('UI renders progress, expiry and cap without RNG or gameplay mutation',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident();f.pair(a,b,10,50);f.world.setCurrentTick(400);
  const record=f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!;record.familiarity={...progress};
  const before=JSON.stringify(record);const random=Math.random;Math.random=()=>{throw new Error('UI consumed RNG');};
  try { const html=renderSocialRelationshipDetails(f.world,a,record,true,true,String).detailsHtml;assert.ok(html.includes('2/3'));assert.equal(JSON.stringify(record),before);
    f.world.setCurrentTick(4400);assert.ok(renderSocialRelationshipDetails(f.world,a,record,true,true,String).detailsHtml.includes('hết hiệu lực'));assert.equal(JSON.stringify(record),before);
    record.trust=80;assert.ok(renderSocialRelationshipDetails(f.world,a,record,true,true,String).detailsHtml.includes('Nguồn khác vẫn có thể tăng thêm'));
  } finally {Math.random=random;}
});
test('BehaviorTree fails stale social movement, clears destination and logs reason',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(120,100);setSocialTelemetryEnabled(f.world,true);
  const p=f.world.getComponent(a,AIPlannerComponent)!,bt=f.world.addComponent(a,new AIBehaviorTreeComponent());
  p.currentPlanGoal='SOCIAL_RECREATE';p.planStatus='executing';p.steps=[{type:'MOVE_TO',description:'meet',targetPos:{x:120,y:100}},{type:'IDLE_WAIT',description:'chat',customData:{socialWith:b}}];
  f.world.getComponent(a,PositionComponent)!.targetX=120;f.world.getComponent(a,PositionComponent)!.targetY=100;
  f.world.getComponent(b,HealthComponent)!.isDead=true;BehaviorTreeExecutor.beginTick();AStarPathfinder.resetTickBudget();
  BehaviorTreeExecutor.tick(f.world,a,bt,p,f.worldMap,.05);
  assert.equal(p.planStatus,'failed');assert.equal(f.world.getComponent(a,PositionComponent)!.targetX,undefined);
  assert.equal(readSocialTelemetry(f.world).counters['social_plan:failed:participant_unavailable'],1);
});
test('community includes indoor members absent from Engine grid, excludes outsiders',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(),outside=f.resident();
  f.world.addComponent(b,new InsideBuildingComponent(999));f.engine.spatialGrid.clear();
  performCommunityConversations(f.world,[a,b],createCommunityConversationScan());
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.interactionsCount,1);
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(outside),null);
});
test('commit rechecks death after synchronous callback, no stale rewards',()=>{
  const f=socialFixture(),a=f.resident(),b=f.resident(),c=f.resident();
  const off=EventBus.getInstance().on('social:speech',()=>{f.world.getComponent(c,HealthComponent)!.isDead=true;});
  try {performCommunityConversations(f.world,[a,b,c],createCommunityConversationScan());} finally {off();}
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.interactionsCount,1);
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(c),null);
});
test('warm and neutral outcomes handle progress separately across contexts',()=>{
  const f=socialFixture(),a=f.resident(100,100,1),b=f.resident();f.pair(a,b,20,50);f.world.setCurrentTick(400);
  for(const [owner,target] of [[a,b],[b,a]])f.world.getComponent(owner,SocialRelationshipComponent)!.getRelationship(target)!.familiarity={...progress,lastQualifiedDay:0,lastQualifiedTick:0};
  const result=performConversation(f.world,a,b,'community');assert.equal(result.status,'completed');
  if(result.status!=='completed')throw new Error('Expected commit');assert.equal(result.evaluation.a.outcome,'warm');assert.equal(result.evaluation.b.outcome,'neutral');
  assert.equal(f.world.getComponent(a,SocialRelationshipComponent)!.getRelationship(b)!.familiarity,undefined);
  assert.equal(f.world.getComponent(b,SocialRelationshipComponent)!.getRelationship(a)!.trust,51);
});
console.log(`PASS ${passed} G6 regression groups`);








