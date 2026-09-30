# Trạng thái triển khai hệ thống Đặc Điểm, Tiềm Năng, Ý Chí và Tâm Cảnh (V3)

> Cập nhật lần cuối: 25/09/2026
> Tài liệu đặc tả gốc: `docs/HUONG_DAN_TAI_CAU_TRUC_DAC_DIEM_VA_TIEM_NANG_V3.md`

---

## 1. Bảng tiến độ các gói công việc (A00 – A14)

| Mã gói | Tên gói | Trạng thái | Bằng chứng / Ghi chú |
|---|---|---|---|
| **A00** | Chụp hiện trạng và khóa phạm vi | `done` | Baseline `npm test` & `npm run build` pass (exit code 0). Đã kiểm kê toàn bộ consumer của Trait, Comprehension, SpiritualRoot. |
| **A01** | Schema, hàm điểm và DTO độc lập | `done` | `trait.types.ts`, `talent.config.ts`, `mental-growth.config.ts`, `TalentComponents.ts`, `PotentialCalculator.ts`, `tests/talent-potential-regression.ts` (P01–P12 pass). |
| **A02** | Nhập 300 ID và phân loại V3 | `done` | `common.traits.ts` (186), `human.traits.ts` (24), `beast.traits.ts` (45), `demon.traits.ts` (45), `legacy-traits.config.ts` (8 legacyOnly + 105 snapshot), `TraitCatalog.ts`, `tests/trait-catalog-regression.ts` (C01–C10, S09 pass). |
| **A03** | TraitService và resolver có thể gọi lặp an toàn | `done` | `TraitService.ts`, `TraitEffectResolver.ts`, `DerivedStatsService.ts`, `BeingComponents.ts`, `tests/trait-runtime-regression.ts` (R01–R06, C08 pass). |
| **A04** | Save schema và migration trước khi bật sinh mới | `done` | `TraitTalentMigration.ts`, `SaveTypes.ts`, `SaveManager.ts`, `World.ts`, `AIComponents.ts`, `tests/talent-save-regression.ts` (S01–S09, G06, P11 pass). |
| **A05** | Sinh bẩm sinh, di truyền và thức tỉnh | `done` | `TalentGenerator.ts`, `BeingFactory.ts`, `SpiritualRootSystem.ts`, `archetypes.config.ts`, `tests/talent-generation-regression.ts` (G01–G06, C04–C07 pass). |
| **A06** | XP và hàng đợi sự kiện độc lập | `done` | `GrowthEvents.ts`, `GrowthSystem.ts` (kiểm tra world, dedupe, milestone, novelty, cooldown, trần ngày/30 ngày, trần nguồn). |
| **A07** | Producer lao động, thiền, đột phá và kiếp | `done` | `BehaviorTree.ts`, `AIComponents.ts`, `AIPlanner.ts`, `CommunityTaskBoard.ts`, `CultivationSystem.ts`, `TribulationSystem.ts`. |
| **A08** | Encounter và mất mát | `done` | `EncounterTracker.ts`, `CombatSystem.ts`, `ProjectileSystem.ts`, `CorpseAndGraveSystem.ts`. |
| **A09** | Tinh thần và suy ngẫm | `done` | `MentalStateSystem.ts`, `StrategicGoal.ts`, `AIPlanner.ts`, `BehaviorTree.ts`, `tests/mental-growth-regression.ts` (C03, X01–X13, M01–M07 pass). |
| **A10** | Gameplay đọc chỉ số mới | `done` | `CultivationSystem.ts`, `CombatSystem.ts`, `NeedsSystem.ts`, `AlchemySystem.ts`, `Engine.ts` (revision cache, single root pass, `permanentStatAdjustments`). |
| **A11** | Inspector, badge và nhãn tên | `done` | `InspectorPanel.ts`, `EntityRenderer.ts`, `tests/entity-label-regression.ts` (U01–U06, fixture 60.5, bậc 5, trần 12 nhãn pass). |
| **A12** | Catalog hoàn thiện và báo cáo coverage | `done` | Kiểm định 300 V3 ID + 8 `legacyOnly`, 20 canonical modifier keys có handler đại diện, thống kê đầy đủ `active`/`planned`/`legacyOnly`. |
| **A13** | Cân bằng và hồi quy đầy đủ | `done` | `tests/talent-population.ts` & `tests/talent-population.mjs` (100.000 hồ sơ tự nhiên seed `20260925` + 8 kịch bản trưởng thành 100 năm pass). |
| **A14** | Tài liệu bàn giao và cơ chế mở rộng | `done` | Hoàn thiện tài liệu bàn giao, báo cáo từng gói, migration notes và backlog mở rộng kèm điều kiện chuyển `active`. |

---

## 2. Báo cáo chi tiết từng gói công việc (theo mục 18.2)

### A00 — Chụp hiện trạng và khóa phạm vi
- **Trạng thái:** `done`
- **File tạo/sửa:** `docs/TRAIT_TALENT_IMPLEMENTATION_STATUS.md`
- **API đã có:** Kiểm kê đầy đủ các điểm đọc/sửa `TraitsComponent`, `ComprehensionComponent`, `SpiritualRootComponent`, `TRAIT_DEFINITIONS`.
- **Hành vi kiểm chứng được:** Baseline `npm test` và `npm run build` đều chạy sạch (exit code 0).
- **Test đã chạy và kết quả:** Toàn bộ regression cũ và `appearance-catalog` pass.

### A01 — Schema, hàm điểm và DTO độc lập
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/config/traits/trait.types.ts`
  - `src/config/talent.config.ts`
  - `src/config/mental-growth.config.ts`
  - `src/modules/talent/TalentComponents.ts`
  - `src/modules/talent/PotentialCalculator.ts`
  - `tests/talent-potential-regression.ts`
- **API đã có:**
  - `validatePotentialWeights()`, `xpForScore(s)`, `scoreFromXp(x)`, `calculateRootAptitudeBase(rootType, purity)`
  - `calculateTraitInnateDeltas(traits)` (diminishing return `1, 0.5, 0.25...` tách nhánh âm/dương, tie-break bằng ID, không cộng `aptitude` từ primary root trait lần hai)
  - `calculatePotential(profile, growth, traits)`, `calculatePotentialFromScores(scores)`
  - `toLegacyComprehensionValue(score)` (`0..100 -> 0..100000`) & `fromLegacyComprehensionValue(val)`
- **Hành vi kiểm chứng được:** Công thức `P = 0.30*C + 0.15*A + 0.10*B + 0.25*W + 0.20*M` chính xác tuyệt đối; `80/70/60/40/50 -> 60.5`; `mentalState` và `fortune` không làm đổi `P`.
- **Test đã chạy và kết quả:** `tests/talent-potential-regression.ts` (P01–P12 pass).

### A02 — Nhập 300 ID và phân loại V3
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/config/traits/common.traits.ts` (186 traits, bao gồm toàn bộ 21 trait nghề nghiệp `allowedRaces: 'all'`)
  - `src/config/traits/human.traits.ts` (24 traits)
  - `src/config/traits/beast.traits.ts` (45 traits)
  - `src/config/traits/demon.traits.ts` (45 traits)
  - `src/config/traits/legacy-traits.config.ts` (8 `legacyOnly` traits + snapshot 105 trait cũ)
  - `src/modules/traits/TraitCatalog.ts`
  - `src/config/traits.config.ts`
  - `tests/trait-catalog-regression.ts`
- **API đã có:** `SOURCE_300_TRAITS_LIST`, `ALL_TRAITS_LIST_V3`, `V3_TRAIT_CATALOG`, `resolveTraitId`, `getTraitDefinition`, `validateTraitCatalog`, `areTraitsConflictingV3`, `isTraitAllowedForRaceAndSpecies`.
- **Hành vi kiểm chứng được:**
  - Phân bố chủng tộc V3 khớp chính xác `{"all":186,"human":24,"beast":45,"demon":45}`.
  - Phân bố nguồn gốc V3 khớp chính xác `{"innate":221,"acquired":43,"reincarnation":3,"lineage":33}`.
  - Xử lý riêng `kim_giac_tê_huyet -> kim_giac_te_huyet` và tách nghĩa `an_linh_can` (Ẩn Linh Căn `legacyOnly`) khỏi `bien_di_am_linh_can` (Biến Dị Ám Linh Căn dòng 034).
  - Mọi trait có `unmappedEffectKeys` hoặc thiếu producer/condition đều gắn `implementation: 'planned'` và `spawnWeight: 0`.
- **Test đã chạy và kết quả:** `tests/trait-catalog-regression.ts` (C01–C10, S09 pass).

### A03 — TraitService và resolver có thể gọi lặp an toàn
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/modules/beings/BeingComponents.ts` (`TraitsComponent.entries`, `BaselineStatsComponent`, `DerivedStatsCacheComponent`)
  - `src/modules/traits/TraitService.ts`
  - `src/modules/traits/TraitEffectResolver.ts`
  - `src/modules/traits/DerivedStatsService.ts`
  - `tests/trait-runtime-regression.ts`
- **API đã có:** `grantTrait`, `removeTrait`, `evolveTrait`, `refreshTraitStates`, `aggregateTraitModifiers`, `rebuildEntityStats`, `applyPermanentStatAdjustment`, `getEntityPotential`.
- **Hành vi kiểm chứng được:**
  - `rebuildEntityStats` tính lại từ `BaselineStatsComponent + permanentStatAdjustments`, gọi lặp 100 lần không tăng/giảm lệch chỉ số (idempotent).
  - Giữ nguyên tỷ lệ `HP.current / HP.max` khi đổi `maxHP` và không hồi sinh thực thể đã chết.
  - Chuỗi tiến hóa (`kinh_nghiem_non_not -> bach_chien_bat_bai`, `long_huyet_ba_the -> to_long_chan_huyet`) thay thế trait bậc thấp thay vì cộng chồng.
  - Đan dược tăng thọ nguyên vĩnh viễn ghi vào `permanentStatAdjustments`, không bị xóa khi rebuild trait.
- **Test đã chạy và kết quả:** `tests/trait-runtime-regression.ts` (R01–R06, C08 pass).

### A04 — Save schema và migration trước khi bật sinh mới
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/modules/save/TraitTalentMigration.ts`
  - `src/modules/save/SaveTypes.ts`
  - `src/modules/save/SaveManager.ts`
  - `src/ecs/World.ts`
  - `src/modules/ai/brain/AIComponents.ts`
  - `tests/talent-save-regression.ts`
- **API đã có:** `migrateCharacterToV3`, `validateV3CharacterTalentData`, `computeDeterministicHash`, serialize/deserialize V3 trong `stagingWorld`.
- **Hành vi kiểm chứng được:**
  - Bản lưu cũ 105 ID nạp thành công, bảo toàn 7 ID cũ không có trong danh mục V2 và giữ nguyên nghĩa `an_linh_can` (Ẩn Linh Căn).
  - Khử nhân đôi HP/ATK/Speed/Lifespan bằng `legacySnapshot` của 105 trait cũ và `legacyAnchor` (sai số nguyên `<= 1`).
  - Trẻ chưa thức tỉnh trong save cũ sinh `pendingRoot` tất định từ `computeDeterministicHash(worldSeed, entityId, birthTick)`.
  - Từ chối `traitSystemVersion > 3` hoặc `NaN`/`Infinity` trong `stagingWorld` trước khi commit, giữ nguyên thế giới đang chơi.
- **Test đã chạy và kết quả:** `tests/talent-save-regression.ts` (S01–S09, G06, P11 pass).

### A05 — Sinh bẩm sinh, di truyền và thức tỉnh
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/modules/talent/TalentGenerator.ts`
  - `src/modules/beings/BeingFactory.ts`
  - `src/modules/cultivation/SpiritualRootSystem.ts`
  - `src/config/archetypes.config.ts`
  - `tests/talent-generation-regression.ts`
- **API đã có:** `generateTalentBundle(ctx)`, `deriveFounderLineageTags`, `awakenSpiritualRoot` (reveal `pendingRoot`, không roll lại trait).
- **Hành vi kiểm chứng được:**
  - Cùng `(worldSeed, birthOrdinal)` luôn sinh cùng hồ sơ thiên phú, độc lập với RNG ngoại hình.
  - Trẻ sơ sinh (`newborn`) khởi tạo `willpowerXp = 0`, `mindsetXp = 0`, không có `techniqueTraits`/`trainingTraits` hậu thiên, `knowledge = 'unassessed'`.
  - Con cái pha trộn `baseC`/`baseB` từ cha mẹ (`0.6 * rolled + 0.4 * parentMean`), không thừa kế `willpowerXp`/`mindsetXp`/`mentalState`.
  - Đến 12 tuổi thức tỉnh linh căn chỉ mở khóa `pendingRoot` đã chốt từ lúc sinh, không thay đổi `TraitsComponent`.
- **Test đã chạy và kết quả:** `tests/talent-generation-regression.ts` (G01–G06, C04–C07 pass).

### A06, A07, A08, A09, A10 — Hệ XP, Producers, Encounter/Bereavement, Tinh thần & Consumers
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/modules/talent/GrowthEvents.ts`, `src/modules/talent/GrowthSystem.ts`
  - `src/modules/talent/EncounterTracker.ts`, `src/modules/talent/MentalStateSystem.ts`
  - `src/modules/ai/brain/goals/StrategicGoal.ts`, `src/modules/ai/brain/planner/AIPlanner.ts`, `src/modules/ai/brain/behavior/BehaviorTree.ts`, `src/modules/ai/community/CommunityTaskBoard.ts`
  - `src/modules/cultivation/CultivationSystem.ts`, `src/modules/cultivation/TribulationSystem.ts`
  - `src/modules/combat/CombatSystem.ts`, `src/modules/combat/ProjectileSystem.ts`
  - `src/modules/beings/CorpseAndGraveSystem.ts`, `src/modules/ai/NeedsSystem.ts`, `src/modules/alchemy/AlchemySystem.ts`
  - `src/core/Engine.ts`
  - `tests/mental-growth-regression.ts`
- **API đã có:** `GrowthSystem.processEvent`, `EncounterTracker.recordAttackExchange`/`onCombatEnded`, `MentalStateSystem.update`, `completeReflectionSessionDay`.
- **Hành vi kiểm chứng được:**
  - Chống trùng `eventId`, chống nhận chéo `world`, giới hạn ngày/30 ngày, hệ số novelty `[1, 0.35, 0.1, 0]` bền vững qua save/load, trần điểm theo từng nguồn.
  - Mất người thân (`bereavement`) làm giảm `mentalState` ngay lập tức nhưng không thay đổi `P` hay `mindsetXp`; chỉ khi hoàn tất đủ ngày suy ngẫm (`reflect_experience`) mới giảm 60% áp lực cảm xúc của biến cố và nhận thưởng `mindsetXp` đúng 1 lần.
  - Tốc độ `1x` và `50x` với cùng chuỗi tick/sự kiện cho kết quả `XP` và `mentalState` khớp trong sai số `1e-6`.
- **Test đã chạy và kết quả:** `tests/mental-growth-regression.ts` (C03, X01–X13, M01–M07 pass).

### A11 — Inspector, badge và nhãn tên
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `src/renderer/systems/EntityRenderer.ts`
  - `src/ui/InspectorPanel.ts`
  - `tests/entity-label-regression.ts`
- **API đã có:** `shouldShowCharacterMapLabel`, `shouldShowCorpseMapLabel`, `selectVisibleCharacterLabels`, `MAX_VISIBLE_CHARACTER_LABELS = 12`, `escapeHtml`, `getMentalStateDisplay`, `renderTraitBadgeHtml`, `renderPotentialSummaryHtml`.
- **Hành vi kiểm chứng được:**
  - Nhãn tên trên bản đồ hiện khi `zoom >= 1.0` và (`normalizedRealm >= 2` hoặc (`assessmentComplete && potential >= 80`)); giới hạn tối đa 12 nhãn không chồng lấn theo thứ tự ưu tiên `selected -> normalizedRealm -> potentialScore -> entityId`.
  - Inspector hiển thị 5 thanh thuộc tính kèm trọng số (`30%/15%/10%/25%/20%`), tổng điểm `P`, phẩm chất, dòng trạng thái tinh thần động tách rời khỏi Tâm cảnh dài hạn, 3 mốc tăng trưởng gần nhất, badge bậc 1–5 (bao gồm bậc 5 Tiên Phẩm), ẩn tư chất của trẻ chưa thức tỉnh, và escape an toàn mọi chuỗi HTML.
- **Test đã chạy và kết quả:** `tests/entity-label-regression.ts` (U01–U06, fixture 60.5, badge bậc 5, trần 12 nhãn pass).

### A12 & A13 — Báo cáo coverage catalog, mô phỏng 100.000 hồ sơ và 8 kịch bản trưởng thành 100 năm
- **Trạng thái:** `done`
- **File tạo/sửa:**
  - `tests/talent-population.ts`
  - `tests/talent-population.mjs`
- **Kết quả kiểm chứng (`node tests/talent-population.mjs`):**
  1. **Độ phủ Catalog (`A12`):**
     - Tổng số mục trong catalog: `308` (`300` đặc điểm nguồn V3 + `8` đặc điểm `legacyOnly`).
     - Trạng thái thực thi trên 300 đặc điểm V3: **`active`: 111**, **`planned`: 189** (`legacyOnly`: 8). Mọi đặc điểm `active` thuộc nhóm `acquired` đều có producer phát sự kiện, ghi milestone và gọi `grantTrait`/`evolveTrait` đầy đủ trong runtime.
     - Phân bố chủng tộc V3: `all: 186`, `human: 24`, `beast: 45`, `demon: 45`.
     - Phân bố nguồn gốc V3: `innate: 221`, `acquired: 43`, `reincarnation: 3`, `lineage: 33`.
     - Phân bố theo bậc (Tier 1–5):
       - Bậc 1 (Phàm Phẩm): `51` (`26 active`, `25 planned`)
       - Bậc 2 (Linh Phẩm): `74` (`37 active`, `37 planned`)
       - Bậc 3 (Địa Phẩm): `78` (`29 active`, `49 planned`)
       - Bậc 4 (Thiên Phẩm): `57` (`17 active`, `40 planned`)
       - Bậc 5 (Tiên Phẩm): `40` (`2 active`, `38 planned`)
  2. **Mô phỏng 100.000 hồ sơ tự nhiên (`A13`, seed `20260925`):**
     - Hiệu năng: `0.2115 ms / profile` (tổng `21.15s` cho 100.000 hồ sơ), độ tăng bộ nhớ heap `28.5 MB`.
     - Số vi phạm ràng buộc (`race`, `species/lineage`, `origin`, `exclusiveGroup`, `budget`, `tier5InCappedSeed`, `tierCeiling`): **tất cả bằng `0`**.
     - Số lần sinh đặc điểm `planned` hoặc `legacyOnly`: **`0`** (`active` được chọn tổng cộng `248.884` lần).
     - Phân bố Seed Class (so với kỳ vọng `55 / 28 / 12 / 4 / 0.9 / 0.1%`):
       - `ordinary`: `54.886` (`54.89%`)
       - `capable`: `28.120` (`28.12%`)
       - `talented`: `12.017` (`12.02%`)
       - `prodigy`: `3.971` (`3.97%`)
       - `exceptional`: `909` (`0.91%`)
       - `legendary`: `97` (`0.10%`)
     - Phân bố Linh căn Nhân tộc trước và sau khi áp `primaryRootOverride`:
       - Trước override: `none: 25.096`, `impure: 6.616`, `true: 1.300`, `earth: 318`, `heaven: 4`.
       - Sau override: `none: 24.559`, `impure: 6.470`, `true: 1.269`, `earth: 1.016`, `heaven: 20`.
     - Thống kê điểm tiềm năng `P`:
       - Nhóm trưởng thành đã kiểm định (`n = 85.000`): `min = 21.41`, `mean = 34.19`, `p50 = 34.40`, `p90 = 39.37`, `p99 = 44.61`, `max = 55.32`.
       - Nhóm sơ sinh chưa kiểm định (`n = 15.000`, `W = 0, M = 0`): `min = 15.60`, `mean = 25.08`, `p50 = 25.41`, `p90 = 29.78`, `p99 = 35.26`, `max = 42.74`.
  3. **8 kịch bản trưởng thành 100 năm deterministic (`A13`):**
     - Kịch bản 1 (Ăn/ngủ/đứng yên 100 năm): `P` giữ nguyên `33.0 -> 33.0`, `willpowerXp = 0`, `mindsetXp = 0`.
     - Kịch bản 2 (Chỉ lao động thường 100 năm): `W = 40.0` (chạm trần nguồn `40`), `M = 0`.
     - Kịch bản 3 (Chỉ thiền thường 100 năm): `W = 50.0` (chạm trần nguồn `50`), `M = 40.0` (chạm trần nguồn `40`).
     - Kịch bản 4 (Kết hợp chiến đấu nguy hiểm + độ kiếp + suy ngẫm 100 năm): `W = 87.03 > 50`, `M = 51.29 > 40`.
     - Kịch bản 5 (Cùng bẩm sinh, rèn luyện vs không rèn luyện): `P_untrained = 39.25`, `P_trained = 71.30` (`diff = 32.014 <= 45`, chênh lệch cực đại lý thuyết đúng bằng `45`).
     - Kịch bản 6 (Bẩm sinh `100/100/100`, không rèn luyện `W=0, M=0`): `P = 55.0 < 100`.
     - Kịch bản 7 (Biến cố tang thương & phục hồi): lúc xảy ra biến cố `mentalState = -26.61`, `mindsetXp` giữ nguyên `750`; sau khi suy ngẫm hóa giải `mindsetXp = 760.1`; sau 180 ngày `mentalState` hồi phục về `0.11`.
     - Kịch bản 8 (Batch 30 ngày vs từng ngày suốt 90 ngày): `mentalState` khớp tuyệt đối (`3.729092` vs `3.729092`, sai số `0`).

---

## 3. Ghi chú Tương thích & Migration (Migration Notes)

1. **Tương thích ngược với bản lưu cũ (Pre-V3):**
   - Bản lưu thiếu `traitSystemVersion` được tự động nhận diện là bản lưu cũ (`version < 3`) và chuyển qua `hydrateOrMigrateEntityTraitTalent` trong `stagingWorld`.
   - Bảo toàn 100% các ID đặc điểm cũ:
     - 7 ID cũ không có trong nguồn V2 (`linh_can_thuan_khiet`, `vo_linh_can`, `thien_phu_tram_am`, `da_tam_勃_勃`, `tu_luyen_cuong`, `than_hon_cuong_dai`, `co_than_bat_diet`) được giữ ở trạng thái `legacyOnly` (`legacyGrandfathered: true`) và vẫn giữ hiệu ứng.
     - `an_linh_can` trong save cũ được giữ nguyên nghĩa **Ẩn Linh Căn** (`legacyOnly`), tách biệt hoàn toàn với `bien_di_am_linh_can` (**Biến Dị Ám Linh Căn**, dòng 034 V3).
   - `ensureStatBaseline` suy ngược `baseAttack`, `baseMaxHealth`, `baseLifespan`, `baseMoveSpeed` bằng cách chia cả hệ số cảnh giới (`atkScale = 1.25^stageIndex`, `hpScale`, `lifeScale`) lẫn hiệu ứng trait, đồng thời `rebuildEntityStats` luôn nhân nhất quán hệ số cảnh giới ở mọi lần gọi (`100 -> 100 -> 100` ở `stageIndex = 3`).
2. **Bảo vệ toàn vẹn khi nạp bản lưu (Staging Rollback):**
   - Toàn bộ quá trình nạp và kiểm định (`validateTraitTalentSaveData`) diễn ra trên `stagingWorld`, quét đệ quy toàn bộ cây JSON và kiểm tra tường minh mọi trường con (`cooldownUntilDay`, `dailyBuckets`, `familyDayBuckets`, `experiences`, `professionCounters`, `foundationChanges`, `permanentAdjustments`, `legacyStatAnchor`).
   - Nếu `traitSystemVersion > 3` hoặc có bất kỳ giá trị `NaN`/`Infinity` nào (ví dụ tràn số `1e400` trong `cooldownUntilDay`), `SaveManager` hủy bỏ bản nạp trước khi commit, giữ nguyên thế giới đang chơi.

---

## 4. Danh mục Cơ chế Mở rộng (`planned` -> `active`) cho giai đoạn tiếp theo

Hiện tại có **189 / 300** đặc điểm V3 đang ở trạng thái `implementation: 'planned'` (`spawnWeight: 0`) do có trường hiệu ứng V2 ngoài 20 `CanonicalModifierKey` của lõi V3 hoặc yêu cầu hệ thống gameplay chuyên biệt chưa mở trong phạm vi lõi. Để chuyển một nhóm đặc điểm từ `planned` sang `active`, cần đáp ứng đủ 5 thành phần kỹ thuật dưới đây:

### 4.1. Nhóm Kháng Tâm Ma & Độ Kiếp Nâng Cao (`heartDemonResistance`, `tribulationSeverity`, `bottleneckPenalty`) — 33 đặc điểm
- **Producer:** `CultivationSystem` (khi gặp bình cảnh tiểu/đại cảnh giới) và `TribulationSystem` (khi tính sát thương tia sét lôi kiếp và xác suất phát sinh tâm ma).
- **Consumer:** `TraitEffectResolver` mở rộng thêm `heartDemonResistanceBonus`, `tribulationDamageFactor`, `bottleneckPenaltyFactor`; `CultivationSystem.attemptBreakthrough` và `TribulationSystem.strikeEntity` đọc trực tiếp từ `DerivedStatsCacheComponent`.
- **Persistence:** Lưu trạng thái bình cảnh hoặc độ lệch tâm ma (nếu có) trong `GrowthMindComponent` hoặc `CultivationComponent`.
- **Kiểm thử bắt buộc:** So sánh xác suất đột phá khi tâm ma xâm nhập và lượng sát thương lôi kiếp giữa thực thể có/không có đặc điểm; đảm bảo rebuild 100 lần không cộng dồn.
- **Điều kiện chuyển `active`:** Đã nối công thức giảm rủi ro tâm ma trong `CultivationSystem` + test hồi quy vượt qua.

### 4.2. Nhóm Nghề Nghiệp Chuyên Sâu (`alchemy`, `inscription`, `formation`, `taming`, `farmingYield`, `pillFailure`) — 29 đặc điểm
- **Producer:** Hệ thống công việc nghề nghiệp (`AlchemySystem`, `BuildingSystem`, `CommunityTaskBoard`) khi hoàn tất mẻ luyện đan, khắc phù, bố trận, thuần thú hoặc thu hoạch linh điền có sản phẩm thực tế (`actualOutput > 0`).
- **Consumer:** `AlchemySystem` (tỷ lệ thành đan, phẩm chất đan), `CommunityTaskBoard` (sản lượng thu hoạch), `GrowthSystem` (phát sự kiện `work_completed` với `professionDomain` tương ứng).
- **Persistence:** Lưu cấp độ/thành tựu nghề nghiệp trong component nghề nghiệp hoặc `GrowthMindComponent.claimedMilestones`.
- **Kiểm thử bắt buộc:** Thực thể có trait luyện đan tăng đúng tỷ lệ thành đan trong giới hạn cap; Yêu tộc đã Hóa Hình (`stageIndex >= 2`) học và kích hoạt được trait nghề nghiệp chung (`C02`).
- **Điều kiện chuyển `active`:** Có vòng lặp sản xuất đan/phù/trận tạo vật phẩm thật trong túi đồ/kho tông môn và bài kiểm thử xác nhận.

### 4.3. Nhóm Uy Danh, Khí Vận & Xã Hội (`prestige`, `fortune`, `leadership`, `negotiation`, `relationshipGain`, `moraleAura`) — 44 đặc điểm
- **Producer:** `FactionSystem` (bầu chọn chức vị, điểm cống hiến), `DiplomacySystem` (đàm phán tông môn), `ThreeTierAISystem` (tương tác xã hội và kỳ ngộ nhặt bảo vật).
- **Consumer:** `FactionSystem` đọc `prestige` khi xét duyệt trưởng lão/chưởng môn; kỳ ngộ đọc `fortune` (tách biệt hoàn toàn khỏi điểm tiềm năng `P` theo bất biến `P12`).
- **Persistence:** Lưu điểm `prestige` và lịch sử kỳ ngộ trong `FactionMemberComponent` / `SocialRelationshipComponent`.
- **Kiểm thử bắt buộc:** Tăng `fortune`/`prestige` làm tăng xác suất kỳ ngộ/thăng chức nhưng tuyệt đối không làm thay đổi `P` (`P12`).
- **Điều kiện chuyển `active`:** Hệ thống kỳ ngộ và bầu cử tông môn đọc modifier từ `DerivedStatsCacheComponent` kèm test đơn vị.

### 4.4. Nhóm Thân Hòa Nguyên Tố & Pháp Tắc (`*Affinity`, `*Compatibility`, `swordAffinity`, `soulAffinity`, `spaceAffinity`, `timeInsight`) — 42 đặc điểm
- **Producer:** Hệ thống công pháp & kỹ năng chiến đấu theo nguyên tố (`TECHNIQUE_DEFINITIONS` gắn nhãn hệ `kim`/`moc`/`thuy`/`hoa`/`tho`/`loi`/`bang`/`kiem`/`hon`).
- **Consumer:** `CultivationSystem` (nhân tốc độ lĩnh ngộ/tu luyện khi công pháp khớp nguyên tố) và `CombatSystem` (nhân sát thương chiêu thức cùng hệ).
- **Persistence:** Không cần thêm trường lưu trữ mới nếu tính thuần qua `DerivedStatsCacheComponent` dựa trên `CultivationTechniqueComponent` đang trang bị.
- **Kiểm thử bắt buộc:** Khi đổi công pháp khác hệ, bonus nguyên tố tự động bật/tắt chính xác qua `rebuildEntityStats`.
- **Điều kiện chuyển `active`:** Bổ sung trường `element`/`weaponType` chuẩn hóa cho toàn bộ công pháp và vũ khí, nối vào `CombatSystem` & `CultivationSystem`.

### 4.5. Nhóm Huyết Mạch Đặc Thù, Phục Sinh & Chiến Đấu Tổ Đội (`regeneration`, `phoenixReviveCharge`, `squadDamage`, `stealth`, `cursePower`, `devourEfficiency`) — 38 đặc điểm
- **Producer:** `CombatSystem` (hồi máu mỗi giây, kích hoạt niết bàn khi HP về 0, buff đồng đội trong bán kính `SpatialGrid`, đánh lén phát đầu).
- **Consumer:** `CombatSystem`, `NeedsSystem`, `TraitService` (tiêu hao lượt phục sinh hoặc tích lũy tầng thôn phệ).
- **Persistence:** Số lượt phục sinh còn lại (`reviveCharges`) hoặc bộ đếm cooldown kỹ năng huyết mạch lưu trong `TalentProfileComponent` / `CombatStatsComponent`.
- **Kiểm thử bắt buộc:** Phục sinh chỉ kích hoạt đúng số lần quy định mỗi đại cảnh giới, lưu/nạp không reset lượt phục sinh để trục lợi.
- **Điều kiện chuyển `active`:** Hoàn thiện cơ chế trạng thái chiến đấu (buff/debuff/revive) trong `CombatSystem` và kiểm thử save/load roundtrip.

---

## 5. Kết quả 3 lệnh kiểm tra bàn giao cuối cùng (Mục 17.5)

1. `npm.cmd test`: **PASS (exit code 0)** — Toàn bộ bộ kiểm thử mới (`talent-potential`, `trait-catalog`, `trait-runtime`, `talent-save`, `talent-generation`, `mental-growth`, `entity-label`) và toàn bộ kiểm thử hồi quy hiện có (`dialogue`, `activity-overlay`, `appearance`, `faction-settlement`, `ai`, `save`, `simulation-audit`, `appearance-benchmark`, `appearance-catalog`) đều vượt qua.
2. `npm.cmd run build`: **PASS (exit code 0)** — `tsc && vite build` biên dịch sạch không có lỗi TypeScript (cảnh báo kích thước chunk > 500kB của Vite giữ nguyên từ baseline).
3. `node tests/talent-population.mjs`: **PASS (exit code 0)** — Báo cáo coverage 308 đặc điểm, mô phỏng 100.000 hồ sơ tự nhiên (0 vi phạm) và 8 kịch bản trưởng thành 100 năm đều vượt qua.
