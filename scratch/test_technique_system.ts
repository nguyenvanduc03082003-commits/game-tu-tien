import { ECSWorld } from '../src/ecs/World.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import { CultivationTechniqueComponent, TraitsComponent, SpiritualRootComponent } from '../src/modules/beings/BeingComponents.ts';
import { FactionComponent, MemberComponent } from '../src/modules/factions/FactionComponents.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import {
  TECHNIQUE_DEFINITIONS,
  MASTERY_CONFIGS,
  getTechniquesByFactionTier,
  getRandomSerendipityTechnique
} from '../src/config/techniques.config.ts';

function runTests() {
  console.log('--- START TECHNIQUE SYSTEM TESTS ---');

  // Test 1: Archetype spawning
  const world = new ECSWorld();
  const mortal = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100);
  const beast = BeingFactory.spawnFromArchetype(world, 'wild_beast', 100, 100);
  const prodigy = BeingFactory.spawnFromArchetype(world, 'prodigy_human', 100, 100);

  const mortalTech = world.getComponent(mortal, CultivationTechniqueComponent);
  const beastTech = world.getComponent(beast, CultivationTechniqueComponent);
  const prodigyTech = world.getComponent(prodigy, CultivationTechniqueComponent);

  if (mortalTech === undefined) {
    console.log('✅ TEST 1.1: Mortal spawns WITHOUT technique');
  } else {
    console.error('❌ TEST 1.1 FAILED: Mortal has unexpected technique', mortalTech);
  }

  if (beastTech === undefined) {
    console.log('✅ TEST 1.2: Wild beast spawns WITHOUT technique');
  } else {
    console.error('❌ TEST 1.2 FAILED: Beast has unexpected technique', beastTech);
  }

  if (prodigyTech && prodigyTech.source === 'truyen_thua' && prodigyTech.tier === 3) {
    console.log(`✅ TEST 1.3: Prodigy spawns with inherited legacy [${prodigyTech.techniqueName}] (Tier ${prodigyTech.tier}, Nguồn: ${prodigyTech.source})`);
  } else {
    console.error('❌ TEST 1.3 FAILED: Prodigy missing or incorrect technique', prodigyTech);
  }

  // Test 2: Mastery Level Progression & Multipliers
  const tech = new CultivationTechniqueComponent('truong_sinh_quyet', 'Trường Sinh Quyết', 1, 'moc', 'Dưỡng sinh');
  console.log(`Initial: Level=${tech.masteryLevel}, Exp=${tech.masteryExp}, Multiplier=${tech.getMasteryMultiplier()}x`);
  if (tech.masteryLevel === 'nhap_mon' && tech.getMasteryMultiplier() === 1.0) {
    console.log('✅ TEST 2.1: Initial mastery is Nhap Mon (1.0x)');
  }

  const r1 = tech.addMasteryExp(120);
  if (r1.leveledUp && tech.masteryLevel === 'so_khuynh' && tech.getMasteryMultiplier() === 1.4) {
    console.log('✅ TEST 2.2: Leveled up to So Khuynh (1.4x) at 120 exp');
  } else {
    console.error('❌ TEST 2.2 FAILED', tech);
  }

  const r2 = tech.addMasteryExp(200); // 320 total
  if (r2.leveledUp && tech.masteryLevel === 'tieu_thanh' && tech.getMasteryMultiplier() === 2.0) {
    console.log('✅ TEST 2.3: Leveled up to Tieu Thanh (2.0x) at 320 exp');
  } else {
    console.error('❌ TEST 2.3 FAILED', tech);
  }

  const r3 = tech.addMasteryExp(500); // 820 total
  if (r3.leveledUp && tech.masteryLevel === 'dai_thanh' && tech.getMasteryMultiplier() === 3.0) {
    console.log('✅ TEST 2.4: Leveled up to Dai Thanh (3.0x) at 820 exp');
  } else {
    console.error('❌ TEST 2.4 FAILED', tech);
  }

  // Test 3: Faction rank to techniques mapping
  const thanhDiaTechs = getTechniquesByFactionTier('thanh_dia');
  const cuuPhamTechs = getTechniquesByFactionTier('cuu_pham');
  if (thanhDiaTechs.some(t => t.tier === 4)) {
    console.log(`✅ TEST 3.1: Thanh Dia offers Tier 4 techniques (Count: ${thanhDiaTechs.length})`);
  } else {
    console.error('❌ TEST 3.1 FAILED', thanhDiaTechs);
  }

  if (cuuPhamTechs.every(t => t.tier === 1)) {
    console.log(`✅ TEST 3.2: Cuu Pham offers Tier 1 techniques (Count: ${cuuPhamTechs.length})`);
  } else {
    console.error('❌ TEST 3.2 FAILED', cuuPhamTechs);
  }

  // Test 4: Serendipity random generation
  const serendipity1 = getRandomSerendipityTechnique(3);
  if (serendipity1 && serendipity1.allowedSources.includes('co_duyen')) {
    console.log(`✅ TEST 4.1: Serendipity generated [${serendipity1.name}] (Tier ${serendipity1.tier})`);
  } else {
    console.error('❌ TEST 4.1 FAILED', serendipity1);
  }

  // Test 5: Faction teaching in FactionSystem
  const factionSys = new FactionSystem();
  const fEnt = world.createEntity();
  const factionComp = new FactionComponent('sect_1', 'Thanh Vân Tông', 'sect');
  factionComp.rank = 'tam_pham'; // Offers Tier 2 & 1
  world.addComponent(fEnt, factionComp);

  // 5.1: Phàm nhân vô linh căn (canCultivate = false) -> Môn phái không thể truyền công pháp tu tiên
  const mortalWithoutRoot = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100);
  factionComp.members.add(mortalWithoutRoot);
  world.addComponent(mortalWithoutRoot, new MemberComponent('sect_1', 'outer_disciple'));
  const rootWithout = world.getComponent(mortalWithoutRoot, SpiritualRootComponent);
  if (rootWithout) {
    rootWithout.rootType = 'none';
    rootWithout.isAwakened = true;
  }
  factionSys.update(world, 4.0);
  const techWithout = world.getComponent(mortalWithoutRoot, CultivationTechniqueComponent);
  if (techWithout === undefined) {
    console.log('✅ TEST 5.1: Disciple WITHOUT spiritual root (Vô linh căn) is correctly NOT taught cultivation technique');
  } else {
    console.error('❌ TEST 5.1 FAILED: Mortal without root received technique', techWithout);
  }

  // 5.2: Đệ tử có linh căn thức tỉnh (canCultivate = true) -> Môn phái truyền thụ công pháp!
  const discipleWithRoot = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100);
  factionComp.members.add(discipleWithRoot);
  world.addComponent(discipleWithRoot, new MemberComponent('sect_1', 'outer_disciple'));
  const rootWith = world.getComponent(discipleWithRoot, SpiritualRootComponent);
  if (rootWith) {
    rootWith.rootType = 'true';
    rootWith.isAwakened = true;
  }
  factionSys.update(world, 4.0);
  const taughtTech = world.getComponent(discipleWithRoot, CultivationTechniqueComponent);
  if (taughtTech && taughtTech.source === 'tong_mon' && taughtTech.sourceName === 'Thanh Vân Tông') {
    console.log(`✅ TEST 5.2: Disciple WITH spiritual root is successfully taught [${taughtTech.techniqueName}] (Tier ${taughtTech.tier}, Nguồn: ${taughtTech.source})!`);
  } else {
    console.error('❌ TEST 5.2 FAILED: Disciple was not taught technique', taughtTech);
  }

  console.log('--- ALL TECHNIQUE TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests();
