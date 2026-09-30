import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { WorldMap } from '../src/modules/world/WorldMap.ts';
import { QiGrid } from '../src/modules/energy/QiGrid.ts';
import { SpatialGrid } from '../src/core/SpatialGrid.ts';
import { TerrainType } from '../src/config/terrains.config.ts';
import {
  FACTION_PROGRESSION_CONFIG,
  BUILDING_DEFINITIONS,
  FactionType
} from '../src/config/factions.config.ts';
import {
  FactionComponent,
  MemberComponent,
  BuildingComponent,
  FoundingIntentComponent,
  SettlementComponent,
  ResidenceComponent
} from '../src/modules/factions/FactionComponents.ts';
import { FactionFactory } from '../src/modules/factions/FactionFactory.ts';
import { FactionSystem } from '../src/modules/factions/FactionSystem.ts';
import { DiplomacySystem } from '../src/modules/factions/DiplomacySystem.ts';
import { CommunityTaskBoard } from '../src/modules/ai/community/CommunityTaskBoard.ts';
import { BeingFactory } from '../src/modules/beings/BeingFactory.ts';
import {
  PositionComponent,
  HealthComponent,
  NameComponent,
  RaceComponent,
  RealmComponent,
  SpiritualRootComponent,
  CultivationTechniqueComponent,
  MortalNeedsComponent,
  HungerComponent
} from '../src/modules/beings/BeingComponents.ts';
import { SocialRelationshipComponent } from '../src/modules/social/SocialComponents.ts';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS faction-pacing:', name);
}

function createPlainWorld(width: number = 32, height: number = 32): {
  world: ECSWorld;
  map: WorldMap;
  qiGrid: QiGrid;
  spatialGrid: SpatialGrid;
  factionSystem: FactionSystem;
  taskBoard: CommunityTaskBoard;
} {
  const world = new ECSWorld();
  const map = new WorldMap(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map.getTile(x, y);
      if (tile) {
        tile.terrain = TerrainType.PLAIN;
        tile.elevation = 0;
      }
    }
  }
  const qiGrid = new QiGrid(width, height);
  const spatialGrid = new SpatialGrid(32);
  const diplomacy = new DiplomacySystem();
  const factionSystem = new FactionSystem(map, qiGrid, diplomacy);
  factionSystem.spatialGrid = spatialGrid;
  const taskBoard = CommunityTaskBoard.getInstance();
  taskBoard.clear();
  FactionFactory.reset();

  return { world, map, qiGrid, spatialGrid, factionSystem, taskBoard };
}

test('Step 3: Hamlet founding requires strictly 10 founders, does not slice down to 8, and aborts if candidate count drops to 9', () => {
  const { world, factionSystem, taskBoard } = createPlainWorld(40, 40);

  // 1. Tạo 9 phàm nhân tự do -> không đủ 10 người -> KHÔNG được tạo ý định lập thôn
  const mortals: number[] = [];
  for (let i = 0; i < 9; i++) {
    const id = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100 + (i % 3) * 16, 100 + Math.floor(i / 3) * 16);
    mortals.push(id);
    const needs = world.getComponent(id, MortalNeedsComponent);
    if (needs) {
      needs.thirst = 100;
    }
    const hunger = world.getComponent(id, HungerComponent);
    if (hunger) {
      hunger.current = 100;
    }
  }

  // Kết nối thiện cảm
  for (let i = 0; i < mortals.length; i++) {
    for (let j = i + 1; j < mortals.length; j++) {
      const a = mortals[i];
      const b = mortals[j];
      const relA = world.getComponent(a, SocialRelationshipComponent);
      const relB = world.getComponent(b, SocialRelationshipComponent);
      relA?.setRelationship(b, 'Đồng Hương', 'acquaintance', 25, 10);
      relB?.setRelationship(a, 'Đồng Hương', 'acquaintance', 25, 10);
    }
  }

  factionSystem.runAutonomousFoundingScan(world, 1.0);
  assert.equal(world.query([FoundingIntentComponent]).length, 0, '9 người không được phát sinh ý định lập thôn');

  // 2. Thêm người thứ 10 -> đủ 10 người -> phải phát sinh ý định và giữ nguyên cả 10 người (không bị cắt 8)
  const tenth = BeingFactory.spawnFromArchetype(world, 'mortal_human', 116, 116);
  mortals.push(tenth);
  for (let i = 0; i < 9; i++) {
    const a = mortals[i];
    const relA = world.getComponent(a, SocialRelationshipComponent);
    const relB = world.getComponent(tenth, SocialRelationshipComponent);
    relA?.setRelationship(tenth, 'Đồng Hương', 'acquaintance', 25, 10);
    relB?.setRelationship(a, 'Đồng Hương', 'acquaintance', 25, 10);
  }

  factionSystem.runAutonomousFoundingScan(world, 1.0);
  const intents = world.query([FoundingIntentComponent]);
  assert.equal(intents.length, 1, '10 người phải phát sinh đúng 1 ý định lập thôn');
  const founderId = intents[0];
  const intent = world.getComponent(founderId, FoundingIntentComponent)!;
  assert.equal(intent.intentType, 'hamlet');
  assert.equal(
    intent.participantIds.size,
    10,
    'Số người tham gia ý định lập thôn phải đúng bằng 10, không bị cắt bớt xuống 8'
  );

  // 3. Nếu ngay trước khi task hoàn thành, 1 người trong nhóm tử nạn (hoặc rời đi) làm số người còn 9:
  const victim = mortals.find(id => id !== founderId)!;
  const vHp = world.getComponent(victim, HealthComponent)!;
  vHp.current = 0;
  vHp.isDead = true;

  // Gọi completeTask thử nghiệm với nhóm đã bị hụt
  if (intent.taskId) {
    taskBoard.completeTask(world, founderId, intent.taskId);
    // Task phải bị hủy an toàn do không còn đủ tối thiểu 10 người
    assert.equal(world.query([FactionComponent]).length, 0, 'Không được thành lập thôn khi nhóm hụt xuống 9 người');
  }
});

test('Step 3: Village progression enforces 30 residents threshold and declines when population drops below 10', () => {
  const { world, factionSystem } = createPlainWorld(40, 40);

  // 1. Tạo một Hamlet với người sáng lập
  const founder = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100, 100);
  const hamletRes = FactionFactory.createFaction(world, {
    type: 'hamlet',
    founderEntityId: founder
  });
  const hamlet = hamletRes.comp;
  FactionFactory.assignMemberToFaction(world, founder, hamlet.factionId, 'village_head');
  const sRes = FactionFactory.createSettlement(world, {
    ownerFactionId: hamlet.factionId,
    centerX: 100,
    centerY: 100,
    settlementType: 'hamlet'
  });
  const sid = sRes.settlementId;
  hamlet.settlementIds = [sid];
  hamlet.capitalSettlementId = sid;
  FactionFactory.assignResidence(world, founder, sid, hamlet.factionId);

  // Thêm công trình: 1 campfire, 4 hut, 1 well, 2 farm
  FactionFactory.spawnBuilding(world, 'campfire', hamlet.factionId, 100, 100, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', hamlet.factionId, 104, 100, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', hamlet.factionId, 108, 100, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', hamlet.factionId, 112, 100, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'thatched_hut', hamlet.factionId, 116, 100, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'village_well', hamlet.factionId, 100, 104, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'mortal_farm', hamlet.factionId, 100, 108, sid, { instant: true });
  FactionFactory.spawnBuilding(world, 'mortal_farm', hamlet.factionId, 100, 112, sid, { instant: true });

  hamlet.foodStock = 120; // Đủ lương thực
  hamlet.stability = 80;
  hamlet.stageStableDays = 95;

  // Thêm 28 cư dân nữa (tổng 29 dân)
  const residents: number[] = [founder];
  for (let i = 0; i < 28; i++) {
    const id = BeingFactory.spawnFromArchetype(world, 'mortal_human', 100 + (i % 5) * 4, 100 + Math.floor(i / 5) * 4);
    residents.push(id);
    FactionFactory.assignMemberToFaction(world, id, hamlet.factionId, 'villager');
    FactionFactory.assignResidence(world, id, sid, hamlet.factionId);
  }
  assert.equal(hamlet.members.size, 29);

  // Đánh giá thăng cấp: 29 dân -> CHƯA ĐỦ LÊN LÀNG (cần 30)
  factionSystem.evaluateAllProgressions(world, 1);
  assert.equal(hamlet.type, 'hamlet', '29 dân chưa được thăng cấp lên Làng');

  // Thêm cư dân thứ 30
  const thirtieth = BeingFactory.spawnFromArchetype(world, 'mortal_human', 120, 120);
  residents.push(thirtieth);
  FactionFactory.assignMemberToFaction(world, thirtieth, hamlet.factionId, 'villager');
  FactionFactory.assignResidence(world, thirtieth, sid, hamlet.factionId);
  assert.equal(hamlet.members.size, 30);

  // Đánh giá thăng cấp: 30 dân -> ĐỦ LÊN LÀNG
  factionSystem.evaluateAllProgressions(world, 1);
  assert.equal(hamlet.type, 'village', '30 dân đủ điều kiện phải thăng cấp lên Làng');

  // Kiểm tra suy thoái khi dân số rớt dưới 10
  // Giết 21 dân để còn 9 dân (< declineMinResidents = 10)
  for (let i = 0; i < 21; i++) {
    const id = residents[residents.length - 1 - i];
    const hp = world.getComponent(id, HealthComponent)!;
    hp.current = 0;
    hp.isDead = true;
  }

  // Chạy đánh giá qua thời gian ân hạn 90 ngày
  factionSystem.evaluateAllProgressions(world, 1); // bắt đầu decline
  assert.equal(hamlet.type, 'village', 'Đang trong thời gian ân hạn 90 ngày, chưa giáng cấp ngay');

  factionSystem.evaluateAllProgressions(world, 95); // hết thời gian ân hạn
  assert.equal(hamlet.type, 'hamlet', 'Dưới 10 dân sau thời gian ân hạn phải suy thoái trở lại thành Thôn Xóm');
});

test('Step 3: Kingdom progression enforces 90 total residents and Sect founding requires 50 members without truncation', () => {
  const { world, factionSystem } = createPlainWorld(50, 50);

  // 1. Kiểm tra Sect founding: cần 1 founder + 49 followers = 50 thành viên
  const founder = BeingFactory.spawnFromArchetype(world, 'mortal_human', 150, 150);
  const fRealm = world.getComponent(founder, RealmComponent)!;
  fRealm.stageIndex = 2; // Trúc Cơ
  fRealm.combatPower = 350;
  const fTech = new CultivationTechniqueComponent('tech_1', 'Thái Sơ Quyết', 2, 'kim', 'Bản môn công pháp', 'tong_mon', 'Thái Sơ Môn', 'nhap_mon', 0);
  world.addComponent(founder, fTech);

  const followers: number[] = [];
  for (let i = 0; i < 48; i++) {
    const id = BeingFactory.spawnFromArchetype(world, 'mortal_human', 150 + (i % 6) * 4, 150 + Math.floor(i / 6) * 4);
    followers.push(id);
    world.addComponent(id, new ResidenceComponent('home_settlement', 'home_faction'));
    const relF = world.getComponent(founder, SocialRelationshipComponent);
    const relO = world.getComponent(id, SocialRelationshipComponent);
    relF?.setRelationship(id, 'Môn Đồ', 'acquaintance', 30, 10);
    relO?.setRelationship(founder, 'Sư Phụ', 'mentor', 50, 20);
  }

  const getSectIntents = () =>
    world
      .query([FoundingIntentComponent])
      .map(id => world.getComponent(id, FoundingIntentComponent)!)
      .filter(it => it.intentType === 'sect');

  // 48 followers + 1 founder = 49 người -> CHƯA ĐỦ (cần 49 followers)
  factionSystem.runAutonomousFoundingScan(world, 1.0);
  assert.equal(getSectIntents().length, 0, '49 người chưa đủ để khai tông lập phái');

  // Thêm follower thứ 49 (tổng cộng 50 người)
  const fortyNinth = BeingFactory.spawnFromArchetype(world, 'mortal_human', 160, 160);
  followers.push(fortyNinth);
  world.addComponent(fortyNinth, new ResidenceComponent('home_settlement', 'home_faction'));
  const relF = world.getComponent(founder, SocialRelationshipComponent);
  const relO = world.getComponent(fortyNinth, SocialRelationshipComponent);
  relF?.setRelationship(fortyNinth, 'Môn Đồ', 'acquaintance', 30, 10);
  relO?.setRelationship(founder, 'Sư Phụ', 'mentor', 50, 20);

  // Có linh khí cao tại vị trí
  const qTile = factionSystem.qiGrid?.getTile(Math.floor(150 / 16), Math.floor(150 / 16));
  if (qTile) {
    qTile.density = 40;
  }

  factionSystem.runAutonomousFoundingScan(world, 1.0);
  const sectIntents = getSectIntents();
  assert.equal(sectIntents.length, 1, '50 người phải phát sinh đúng 1 ý định khai tông lập phái');
  const sectIntent = sectIntents[0];
  assert.equal(
    sectIntent.participantIds.size,
    50,
    'Toàn bộ 50 người phải được đưa vào danh sách tham gia sáng lập, tuyệt đối không bị slice xuống 6'
  );
});

console.log(`${passed} faction-pacing regression tests passed`);
