import { ReproductionSystem, ChildcareSystem } from '../src/modules/beings/ReproductionSystem.ts';
import { LifeStageSystem } from '../src/modules/beings/LifeStageSystem.ts';
import { AnimationSystem } from '../src/renderer/systems/AnimationSystem.ts';
import { ThreeTierAISystem } from '../src/modules/ai/systems/ThreeTierAISystem.ts';
import { QiSystem } from '../src/modules/energy/QiSystem.ts';
import { WeatherSystem } from '../src/modules/weather/WeatherSystem.ts';
import { DisasterSystem } from '../src/modules/weather/DisasterSystem.ts';
import { PlantGrowthSystem } from '../src/modules/flora/PlantGrowthSystem.ts';
import { NeedsSystem } from '../src/modules/ai/NeedsSystem.ts';
import { TribulationSystem } from '../src/modules/cultivation/TribulationSystem.ts';
import { CultivationSystem } from '../src/modules/cultivation/CultivationSystem.ts';
import { SpiritualRootSystem } from '../src/modules/cultivation/SpiritualRootSystem.ts';
import { ProjectileSystem } from '../src/modules/combat/ProjectileSystem.ts';
import { CombatSystem } from '../src/modules/combat/CombatSystem.ts';
import { AlchemySystem } from '../src/modules/alchemy/AlchemySystem.ts';
import { BuildingSystem } from '../src/modules/factions/BuildingSystem.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { SocialInteractionSystem } from '../src/modules/social/SocialInteractionSystem.ts';
import { CorpseAndGraveSystem } from '../src/modules/beings/CorpseAndGraveSystem.ts';
import { DerivedStatsSystem } from '../src/modules/traits/DerivedStatsService.ts';
import { MentalStateSystem } from '../src/modules/talent/MentalStateSystem.ts';
import { GrowthSystem } from '../src/modules/talent/GrowthSystem.ts';
import { ProfessionSystem } from '../src/modules/professions/ProfessionSystem.ts';
import { AnimalLifecycleSystem } from '../src/modules/animals/AnimalLifecycleSystem.ts';
import { AnimalAISystem } from '../src/modules/animals/AnimalAISystem.ts';
import { AnimalMovementSystem } from '../src/modules/animals/AnimalMovement.ts';
import { AnimalCarcassSystem } from '../src/modules/animals/AnimalCarcassSystem.ts';
import { AnimalReproductionSystem } from '../src/modules/animals/AnimalReproductionSystem.ts';
import { performance } from 'node:perf_hooks';
import { writeSocialBaseline, socialBaselineOutputPath } from './social-baseline-output.ts';
import { ECSWorld } from '../src/ecs/World.ts';
import { TimeManager } from '../src/core/TimeManager.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { resetEntityIdCounter } from '../src/ecs/Entity.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { SeededRNG } from '../src/core/SeededRNG.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { PlantFactory } from '../src/modules/flora/PlantFactory.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { SmartObjectManager } from '../src/modules/ai/smartobjects/SmartObjectManager.ts';
import { AStarPathfinder } from '../src/modules/ai/pathfinding/AStar.ts';
import { PositionComponent, HealthComponent, HungerComponent, MortalNeedsComponent, CorpseComponent, CharacterHistoryComponent } from '../src/modules/beings/BeingComponents.ts';
import { FactionComponent, BuildingComponent, InsideBuildingComponent } from '../src/modules/factions/FactionComponents.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';
import { isActiveBondBetween } from '../src/modules/social/RelationshipRules.ts';
import { setSocialTelemetryEnabled, readSocialTelemetry } from '../src/modules/social/SocialSimulationTelemetry.ts';
import { AIStrategicBrainComponent } from '../src/modules/ai/brain/AIComponents.ts';
const output=socialBaselineOutputPath('docs/so_lieu/QUAN_HE_XA_HOI_G6_WORLD_AFTER_2026-10-01.json');
const runs:any[]=[];
function run(seed:number, archetypes:string[], days:number, telemetry=true, benchmark=false) { SeededRNG.withSeed(seed,()=>{
  if(process.argv.includes('--days')) {days=Number(process.argv[process.argv.indexOf('--days')+1]);if(!Number.isSafeInteger(days)||days<1)throw new RangeError('--days must be a positive integer');}
  EventBus.getInstance().clear(); resetEntityIdCounter(); FactionFactory.reset(); CommunityTaskBoard.getInstance().clear(); SmartObjectManager.getInstance().clear(); AStarPathfinder.invalidateBuildingCache();
  const engine:any={world:new ECSWorld(),worldMap:new WorldMap(64,64),qiGrid:new QiGrid(64,64),spatialGrid:new SpatialGrid(64)};
  const world=engine.world as ECSWorld, map=engine.worldMap as WorldMap; world.worldSeed=seed;
  const time=TimeManager.getInstance(); time.loadState({totalTicks:0,speed:1,calendarEpochDays:0,calendarEpochTick:0,oldTicksPerDay:400});
  for(let y=0;y<64;y++) for(let x=0;x<64;x++) {const t=map.getTile(x,y)!;t.terrain=x===10?TerrainType.RIVER:TerrainType.PLAIN;t.elevation=.3;}
  const ids=archetypes.map((a,i)=>BeingFactory.spawnFromArchetype(world,a,380+i%10*18,400+Math.floor(i/10)*18));
  for(let i=0;i<80;i++) PlantFactory.spawnPlant(world,i%2?'berry_bush':'wild_fruit_tree',250+i%10*38,250+Math.floor(i/10)*38,'mature');
  // Constructor and registration statements copied from current Engine; ECS sorts by priority.
    engine.qiSystem = new QiSystem(engine.qiGrid, engine.worldMap);
    engine.weatherSystem = new WeatherSystem(engine.worldMap);
    engine.disasterSystem = new DisasterSystem(engine.worldMap);
    engine.tribulationSystem = new TribulationSystem();
    engine.cultivationSystem = new CultivationSystem(engine.worldMap, engine.qiGrid, engine.tribulationSystem);
    engine.spiritualRootSystem = new SpiritualRootSystem();
    engine.needsSystem = new NeedsSystem(engine.worldMap);
    engine.threeTierAISystem = new ThreeTierAISystem(engine.worldMap, engine.qiGrid);
    engine.threeTierAISystem.spatialGrid = engine.spatialGrid;
    engine.animalLifecycleSystem = new AnimalLifecycleSystem();
    engine.animalAISystem = new AnimalAISystem(engine.worldMap);
    engine.animalAISystem.spatialGrid = engine.spatialGrid;
    engine.animalMovementSystem = new AnimalMovementSystem(engine.worldMap, engine.spatialGrid);
    engine.animalCarcassSystem = new AnimalCarcassSystem();
    engine.animalReproductionSystem = new AnimalReproductionSystem(engine.worldMap);
    engine.plantGrowthSystem = new PlantGrowthSystem(engine.worldMap, engine.qiGrid);
    engine.projectileSystem = new ProjectileSystem();
    engine.diplomacySystem = new DiplomacySystem();
    engine.diplomacySystem.spatialGrid = engine.spatialGrid;
    engine.combatSystem = new CombatSystem(engine.worldMap, engine.diplomacySystem);
    engine.combatSystem.spatialGrid = engine.spatialGrid;
    engine.alchemySystem = new AlchemySystem();
    engine.buildingSystem = new BuildingSystem(engine.diplomacySystem);
    engine.factionSystem = new FactionSystem(engine.worldMap, engine.qiGrid, engine.diplomacySystem);
    engine.factionSystem.spatialGrid = engine.spatialGrid;
    engine.socialInteractionSystem = new SocialInteractionSystem();
    engine.socialInteractionSystem.spatialGrid = engine.spatialGrid;
    engine.corpseAndGraveSystem = new CorpseAndGraveSystem(engine.worldMap);
    engine.derivedStatsSystem = new DerivedStatsSystem();
    engine.mentalStateSystem = new MentalStateSystem();
    engine.growthSystem = new GrowthSystem(engine.world);
    engine.professionSystem = new ProfessionSystem(() => engine.worldMap);


    engine.world.addSystem(engine.qiSystem);
    engine.world.addSystem(engine.weatherSystem);
    engine.world.addSystem(engine.disasterSystem);
    engine.world.addSystem(engine.tribulationSystem);
    engine.world.addSystem(engine.derivedStatsSystem);
    engine.world.addSystem(engine.mentalStateSystem);
    engine.world.addSystem(engine.threeTierAISystem);
    engine.world.addSystem(engine.needsSystem);
    engine.world.addSystem(engine.animalLifecycleSystem);
    engine.world.addSystem(engine.animalAISystem);
    engine.world.addSystem(engine.animalMovementSystem);
    engine.world.addSystem(new LifeStageSystem());
    engine.world.addSystem(new ChildcareSystem());
    engine.world.addSystem(new ReproductionSystem());
    engine.world.addSystem(engine.spiritualRootSystem);
    engine.world.addSystem(engine.cultivationSystem);
    engine.world.addSystem(engine.plantGrowthSystem);
    engine.world.addSystem(engine.projectileSystem);
    engine.world.addSystem(engine.combatSystem);
    engine.world.addSystem(engine.animalCarcassSystem);
    engine.world.addSystem(engine.animalReproductionSystem);
    engine.world.addSystem(engine.alchemySystem);
    engine.world.addSystem(engine.buildingSystem);
    engine.world.addSystem(engine.factionSystem);
    engine.world.addSystem(engine.diplomacySystem);
    engine.world.addSystem(engine.socialInteractionSystem);
    engine.world.addSystem(engine.corpseAndGraveSystem);
    engine.world.addSystem(engine.growthSystem);
    engine.world.addSystem(engine.professionSystem);
    engine.world.addSystem(new AnimationSystem());
  const systems=(world as any).systems as any[];
  const timings:Record<string,number>={};
  for(const system of systems) { const update=system.update.bind(system);system.update=(w:ECSWorld,dt:number)=>{const start=performance.now();update(w,dt);timings[system.name]=(timings[system.name]??0)+performance.now()-start;}; }
  setSocialTelemetryEnabled(world,telemetry);
  const snapshots:any[]=[], tickMs:number[]=[], goalSeconds:Record<string,number>={};
  const deaths:any[]=[], seenDeaths=new Set<number>(), cohortSecondsByArchetype:Record<string,number>={};
  let firstFriend:number|null=null, firstBond:number|null=null, residentSeconds=0;
  const sync=()=>engine.spatialGrid.rebuild(world.query([PositionComponent]).filter(id=>!world.hasComponent(id,InsideBuildingComponent)).map(id=>({id,...world.getComponent(id,PositionComponent)!})));
  const start=performance.now();
  for(let tick=1;tick<=days*400;tick++) {
    time.stepSingleTick(); const t=performance.now();sync();world.update(.05);sync();if(benchmark&&tick>400)tickMs.push(performance.now()-t);
    for(let i=0;i<ids.length;i++) {const id=ids[i],hp=world.getComponent(id,HealthComponent);if(!hp||hp.isDead||hp.current<=0) {if(!seenDeaths.has(id)){seenDeaths.add(id);deaths.push({id,archetype:archetypes[i],day:tick/400,reason:world.getComponent(id,CorpseComponent)?.deathReason??'unavailable',deathHistory:world.getComponent(id,CharacterHistoryComponent)?.records.find(r=>r.type==='death'),hp:hp?.current,hunger:world.getComponent(id,HungerComponent)?.current,thirst:world.getComponent(id,MortalNeedsComponent)?.thirst});}continue;}residentSeconds+=.05;cohortSecondsByArchetype[archetypes[i]]=(cohortSecondsByArchetype[archetypes[i]]??0)+.05;const goal=world.getComponent(id,AIStrategicBrainComponent)?.currentGoal??'missing';goalSeconds[goal]=(goalSeconds[goal]??0)+.05;}
    for(const death of deaths)if(death.reason==='unavailable'){const corpse=world.getComponent(death.id,CorpseComponent);if(corpse)death.reason=corpse.deathReason;}
    if(tick%400!==0)continue;
    const living=ids.filter(id=>{const hp=world.getComponent(id,HealthComponent);return hp&&!hp.isDead&&hp.current>0;});
    let friends=0,isolated=0; const bonds=new Set<string>(), mutualFriends=new Set<string>();
    for(const id of living) {const rel=world.getComponent(id,SocialRelationshipComponent); const records=[...(rel?.relationships.values()??[])]; if(!records.some(r=>r.interactionsCount>0))isolated++;
      for(const r of records) { if(r.relationType==='friend') {friends++;if(world.getComponent(r.targetEntityId,SocialRelationshipComponent)?.getRelationship(id)?.relationType==='friend')mutualFriends.add([id,r.targetEntityId].sort((a,b)=>a-b).join(':'));} if(isActiveBondBetween(world,id,r.targetEntityId,r.relationType))bonds.add([id,r.targetEntityId].sort((a,b)=>a-b).join(':')); }
    }
    const day=tick/400;if(friends&&firstFriend===null)firstFriend=day;if(bonds.size&&firstBond===null)firstBond=day;
    if(day%30===0||day===days) { snapshots.push({day,living:living.length,isolatedLiving:isolated,directedFriends:friends,mutualFriendPairs:mutualFriends.size,activeBondPairs:bonds.size,factions:world.query([FactionComponent]).length,buildings:world.query([BuildingComponent]).length}); console.log(JSON.stringify({progress:true,seed,archetype:archetypes[0],startingResidents:ids.length,...snapshots.at(-1)})); }
  }
  tickMs.sort((a,b)=>a-b);const percentile=(p:number)=>tickMs[Math.min(tickMs.length-1,Math.floor(tickMs.length*p))]??null;
  const record={seed,archetypes:archetypes.reduce((acc:any,a)=>(acc[a]=(acc[a]??0)+1,acc),{}),days,telemetry,benchmark,startingResidents:ids.length,firstFriendDay:firstFriend,firstBondDay:firstBond,residentSimulationSeconds:residentSeconds,cohortSecondsByArchetype,deaths,livingByArchetype:archetypes.reduce((acc:any,a,i)=>(acc[a]=(acc[a]??0)+(seenDeaths.has(ids[i])?0:1),acc),{}),residentSimulationSecondsByGoal:goalSeconds,snapshots,counters:readSocialTelemetry(world).counters,systems:systems.map(s=>({name:s.name,priority:s.priority})),executionMs:performance.now()-start,systemUpdateMs:timings,tickTiming:benchmark?{warmupTicks:400,samples:tickMs.length,mean:tickMs.reduce((a,b)=>a+b,0)/tickMs.length,p50:percentile(.5),p95:percentile(.95),p99:percentile(.99)}:null,memory:process.memoryUsage()};
  runs.push(record);console.log(JSON.stringify({seed,archetypes:record.archetypes,days,telemetry,final:snapshots.at(-1),firstFriend,firstBond,executionMs:record.executionMs}));
  for(const system of systems)system.destroy?.(); EventBus.getInstance().clear();
});}
const perf=process.argv.includes('--performance');
const selectedSeed=process.argv.includes('--seed')?Number(process.argv[process.argv.indexOf('--seed')+1]):null;
const selectedArchetype=process.argv.includes('--archetype')?process.argv[process.argv.indexOf('--archetype')+1]:null;
if(perf) for(const count of [30,100,300])for(const telemetry of [false,true])for(let replicate=0;replicate<3;replicate++)run(1100+replicate,Array(count).fill('mortal_human'),4,telemetry,true);
else {for(const a of ['mortal_human','yao_common','mortal_demon'])for(const seed of [11,22,33])if((selectedSeed===null||seed===selectedSeed)&&(!selectedArchetype||a===selectedArchetype))run(seed,Array(30).fill(a),360);for(const seed of [11,22,33])if((selectedSeed===null||seed===selectedSeed)&&(!selectedArchetype||selectedArchetype==='mixed'))run(seed,Array.from({length:90},(_,i)=>['mortal_human','yao_common','mortal_demon'][i%3]),180);}
writeSocialBaseline(output,{schemaVersion:1,scope:'Headless Engine system graph, registration/constructors copied; controlled plain map and food. No rendering, input, Engine event handlers, initial fauna or browser scheduling. All systems present; animal systems have no initial animals.',tickPerDay:400,secondsPerDayAt1x:20,map:{width:64,height:64,elevation:.3,riverColumn:10,matureFoodPlants:80},runs});
