# Trạng thái triển khai: Tách Động Vật khỏi Yêu Tộc & Bổ sung 40 Loài

> Cập nhật lần cuối: 26/09/2026

## Tiến độ tổng quan (9 bước tuần tự)

| Bước | Công việc | Trạng thái | Kiểm tra đã chạy | Ghi chú / Bước tiếp theo |
|---|---|---|---|---|
| **1** | Ghi nhận baseline `npm test`, `npm run build`; tạo tài liệu trạng thái | `done` | `npm test` (PASS, exit 0), `npm run build` (PASS, exit 0), `npm run assets:check` (PASS, exit 0) | Baseline sạch 100%, không có lỗi cũ. Chuyển sang Bước 2. |
| **2** | Tạo type, cấu hình mẫu, catalog đủ 40 loài và kiểm tra dữ liệu | `done` | `npm run build` (PASS, exit 0) | Đã tạo đủ 40 loài trong 5 file nhóm, `animal.types.ts`, `animal.defaults.ts`, `animal.simulation.ts`, `animal.catalog.ts` và `yao-species.config.ts`. |
| **3** | Tạo component, factory và save codec động vật | `done` | `npm run build` (PASS, exit 0) | Đã tạo `AnimalComponents.ts`, `AnimalFactory.ts`, `AnimalSaveCodec.ts`. |
| **4** | Tách nội dung yêu tộc, đổi archetype và cập nhật mọi caller/test liên quan | `done` | `npm run build` (PASS, exit 0), `npm test` (PASS, exit 0) | Đã đổi `wild_beast` -> `yao_common`, `awakened_beast` -> `yao_cultivator`, `Thú Vật` -> `Yêu Sinh`, `Khai Trí` -> `Luyện Yêu`, loại bỏ giả định yêu tộc thiếu công pháp là thú chưa khai trí. |
| **5** | Thêm lifecycle, AI, di chuyển và sinh sản | `done` | `npm run build` (PASS, exit 0) | Đã hoàn thiện `AnimalMovement.ts`, `AnimalLifecycleSystem.ts`, `AnimalAISystem.ts`, `AnimalCarcassSystem.ts`, `AnimalReproductionSystem.ts`. |
| **6** | Tích hợp combat, xác, spatial grid và reset hệ thống | `done` | `npm run build` (PASS, exit 0) | Đã tích hợp `NeedsSystem.ts`, `CorpseAndGraveSystem.ts`, `CombatSystem.ts`, `ProjectileSystem.ts`, `EncounterTracker.ts`, `SocialInteractionSystem.ts`, `Engine.ts`. |
| **7** | Thêm spawn tự nhiên, toolbar, renderer, Inspector và thống kê | `done` | `npm run build` (PASS, exit 0) | Đã hoàn thiện `AnimalSpawnService.ts`, `AnimalRenderer.ts`, `AnimalInspector.ts`, `GodToolbar.ts`, `TimeControls.ts`, `Minimap.ts`. |
| **8** | Hoàn thiện save `2.0.0`, chặn save cũ, chạy kiểm thử tổng | `done` | `npm test` (PASS, exit 0), `npm run build` (PASS, exit 0), `npm run assets:check` (PASS, exit 0) | Đã nâng save lên `2.0.0`, chặn save `< 2.0.0`, đăng ký 3 suite test mới (`animal-catalog`, `animal-simulation`, `animal-save`), toàn bộ test PASS 100%. |
| **9** | Viết README thêm loài và hoàn thiện tài liệu bàn giao | `done` | `npm test` (PASS, exit 0), `npm run build` (PASS, exit 0), `npm run assets:check` (PASS, exit 0) | Đã tạo `src/config/animals/README.md`, `public/assets/sprites/animals/README.md` và hoàn tất bàn giao 9/9 bước. |

---

## Nhật ký từng bước

### Bước 1 — Baseline & Tài liệu trạng thái
- **Đã làm:**
  - Chạy `npm.cmd test`: Toàn bộ suite hiện có (`dialogue`, `activity-overlay`, `appearance`, `entity-label`, `faction-settlement`, `talent-potential`, `trait-catalog`, `trait-runtime`, `talent-save`, `talent-generation`, `mental-growth`, `ai`, `save`, `simulation-audit`, `appearance-benchmark`, `appearance-catalog`) đều PASS (exit code 0).
  - Chạy `npm.cmd run build`: `tsc && vite build` biên dịch thành công (exit code 0).
  - Chạy `npm.cmd run assets:check`: PASS (exit code 0).
  - Khởi tạo tài liệu theo dõi `docs/ANIMAL_YAO_IMPLEMENTATION_STATUS.md`.
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 2.

### Bước 2 — Tạo type, cấu hình mẫu, catalog đủ 40 loài và kiểm tra dữ liệu
- **Đã làm:**
  - Tạo `src/config/yao/yao-species.config.ts` và cập nhật `src/modules/appearance/Appearance.ts` để dùng cấu hình loài Yêu tộc từ đây.
  - Tạo `src/config/animals/animal.types.ts`, `src/config/animals/animal.defaults.ts`, `src/config/animals/animal.simulation.ts`.
  - Tạo 5 file nhóm loài thuần dữ liệu: `domestic.animals.ts` (12 loài), `small-mammals.animals.ts` (8 loài), `large-mammals.animals.ts` (10 loài), `birds.animals.ts` (7 loài), `reptiles.animals.ts` (3 loài).
  - Tạo `src/config/animals/animal.catalog.ts` gộp đủ 40 loài và hàm `validateAnimalCatalog()`.
  - Chạy `npm.cmd run build`: PASS (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 3.

### Bước 3 — Tạo component, factory và save codec động vật
- **Đã làm:**
  - Tạo `src/modules/animals/AnimalComponents.ts` (`AnimalComponent`, `AnimalBrainComponent`, `AnimalCarcassComponent`).
  - Tạo `src/modules/animals/AnimalFactory.ts` (`AnimalFactory.spawn`, `AnimalFactory.createOffspring`, chỉ gắn component sinh tồn/chiến đấu cơ bản, không gắn bất kỳ component tu luyện/tiềm năng/cư dân nào).
  - Tạo `src/modules/animals/AnimalSaveCodec.ts` (serialize, validate nghiêm ngặt, hydrate, kiểm tra cấm component tu luyện).
  - Chạy `npm.cmd run build`: PASS (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 4.

### Bước 4 — Tách nội dung yêu tộc, đổi archetype và cập nhật mọi caller/test liên quan
- **Đã làm:**
  - Cập nhật `src/config/archetypes.config.ts` (`wild_beast` -> `yao_common`, `awakened_beast` -> `yao_cultivator`).
  - Cập nhật `src/config/realms.config.ts` (`beast_realms`: `Thú Vật` -> `Yêu Sinh`, `Khai Trí` -> `Luyện Yêu`, giữ `Hóa Hình` và `Kết Đan (Yêu Đan)`).
  - Cập nhật `src/config/factions.config.ts`, `src/config/traits/beast.traits.ts`, `src/modules/beings/BeingFactory.ts`, `src/modules/factions/FactionFactory.ts`, `src/modules/factions/FactionSystem.ts`, `src/modules/factions/DiplomacySystem.ts`, `src/core/Engine.ts`, `src/ui/GodToolbar.ts`.
  - Cập nhật `src/modules/ai/brain/goals/StrategicGoal.ts` và `src/modules/ai/brain/planner/AIPlanner.ts` (bỏ giả định yêu tộc thiếu công pháp là động vật chưa khai trí; Yêu tộc săn mồi tìm `AnimalComponent`).
  - Cập nhật ID archetype trong `tests/appearance-regression.ts`, `tests/mental-growth-regression.ts`, `tests/talent-generation-regression.ts`.
  - Chạy `npm.cmd run build` và `npm.cmd test`: PASS 100% (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 5.

### Bước 5 — Thêm lifecycle, AI, di chuyển và sinh sản động vật
- **Đã làm:**
  - Mở rộng `src/modules/ai/pathfinding/AStar.ts` với `walkableFilter` và `preventCornerCutting` tùy chọn.
  - Thêm `BehaviorTreeExecutor.markMovedThisTick` trong `src/modules/ai/brain/behavior/BehaviorTree.ts`.
  - Tạo `src/modules/animals/AnimalMovement.ts` (chặn đi qua nước/công trình, chống cắt góc chéo, cooldown retry 2.0s khi đường cụt).
  - Tạo `src/modules/animals/AnimalLifecycleSystem.ts` (tuổi tác, giai đoạn child/adult/elder, đói 18/ngày, rút máu khi đói kiệt, giảm cooldown sinh sản).
  - Tạo `src/modules/animals/AnimalAISystem.ts` (FSM 0.5s: flee, forage, hunt, eat, wander, idle).
  - Tạo `src/modules/animals/AnimalCarcassSystem.ts` (chuyển động vật chết thành xác hữu hạn dinh dưỡng, phân hủy sau 30 ngày).
  - Tạo `src/modules/animals/AnimalReproductionSystem.ts` (kiểm tra 5.0s, điều kiện cặp sinh sản, chặn cận huyết cha-con & anh-chị-em, giới hạn 30/loài và 300 tổng).
  - Chạy `npm.cmd run build`: PASS (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 6.

### Bước 6 — Tích hợp combat, xác, spatial grid và reset hệ thống
- **Đã làm:**
  - Cập nhật `src/modules/ai/NeedsSystem.ts` và `src/modules/beings/CorpseAndGraveSystem.ts` để bỏ qua thực thể có `AnimalComponent` hoặc `AnimalCarcassComponent`.
  - Cập nhật `src/modules/combat/CombatSystem.ts`, `src/modules/combat/ProjectileSystem.ts`, `src/modules/talent/EncounterTracker.ts`, `src/modules/social/SocialInteractionSystem.ts` để động vật tấn công/bị tấn công độc lập, không cộng `combatPower` cảnh giới giả, không gọi active dodge, không tạo quan hệ xã hội hay ký ức cho động vật, và Yêu tộc săn mồi tìm `AnimalComponent`.
  - Đăng ký `AnimalLifecycleSystem`, `AnimalAISystem`, `AnimalMovementSystem` (đồng bộ `SpatialGrid`), `AnimalCarcassSystem`, `AnimalReproductionSystem` vào `src/core/Engine.ts` đúng thứ tự và reset trong `resetWorldState()` / `resizeWorldContainers()`.
  - Chạy `npm.cmd run build`: PASS (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 7.

### Bước 7 — Thêm spawn tự nhiên, toolbar, renderer, Inspector và thống kê
- **Đã làm:**
  - Tạo `src/modules/animals/AnimalSpawnService.ts` (sinh quần thể động vật tự nhiên khi tạo map mới theo `naturalSpawnWeight` và `habitats`, đảm bảo cặp đực/cái trưởng thành ở khoảng cách `<= 32px`, giới hạn 18/loài và 140 tổng).
  - Tạo `src/renderer/systems/AnimalRenderer.ts` và tích hợp vào `src/renderer/systems/EntityRenderer.ts` (vẽ 6 nhóm hình dáng cơ bản + xác động vật, hỗ trợ chọn hình ảnh theo giai đoạn `child`/`adult`/`elder` trong `public/assets/sprites/animals/<speciesId>/` nếu có).
  - Tạo `src/ui/AnimalInspector.ts` và tích hợp vào `src/ui/InspectorPanel.ts` (hiển thị loài, giới tính, giai đoạn, tuổi, máu, đói, trạng thái AI, cha/mẹ, xác động vật; hoàn toàn không có tab linh căn, cảnh giới, công pháp, tiềm năng, thiên phú hay quan hệ xã hội).
  - Cập nhật `src/ui/GodToolbar.ts` (thêm tab/danh mục **Động Vật** gom theo 5 nhóm loài, đổi nhãn tab `Yêu Thú` thành `Yêu Tộc`).
  - Cập nhật `src/ui/TimeControls.ts` (tách bộ đếm Cư Dân / Tu Sĩ / Động Vật độc lập, không tính `AnimalComponent` vào cư dân hay tu sĩ).
  - Cập nhật `src/ui/Minimap.ts` (hiển thị chấm động vật màu `#a3be8c` kích thước nhỏ).
  - Chạy `npm.cmd run build`: PASS (exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 8 — Hoàn thiện save `2.0.0`, chặn save cũ, chạy kiểm thử tổng.

### Bước 8 — Hoàn thiện save `2.0.0`, chặn save cũ, chạy kiểm thử tổng
- **Đã làm:**
  - Cập nhật `src/modules/save/SaveManager.ts`: nâng `CURRENT_SAVE_VERSION = '2.0.0'`, chặn bản lưu có `version < '2.0.0'` hoặc thiếu `version` ngay trong `validateSaveData()` với thông báo chính xác `"Bản lưu này thuộc phiên bản trước khi tách động vật và yêu tộc. Vui lòng tạo thế giới mới."` trước khi chạm vào thế giới đang chơi; serialize/validate/hydrate đầy đủ `animal`, `animalBrain`, `animalCarcass` qua `AnimalSaveCodec`; không gắn `SocialRelationshipComponent` hay `MemoryComponent` mặc định cho động vật khi nạp save.
  - Viết 3 bộ kiểm thử mới và đăng ký vào `tests/run.mjs`:
    - `tests/animal-catalog-regression.ts` (4 tests PASS)
    - `tests/animal-simulation-regression.ts` (6 tests PASS)
    - `tests/animal-save-regression.ts` (3 tests PASS)
  - Chạy `npm.cmd test` (PASS 100%, exit code 0), `npm.cmd run build` (PASS, exit code 0), `npm.cmd run assets:check` (PASS, exit code 0).
- **Lỗi còn lại:** Không có.
- **Bước tiếp theo:** Bước 9 — Viết README thêm loài và hoàn thiện tài liệu bàn giao.

### Bước 9 — Viết README thêm loài và hoàn thiện tài liệu bàn giao
- **Đã làm:**
  - Viết `src/config/animals/README.md` khớp chính xác với mã nguồn thực tế: kiểu dữ liệu `AnimalSpeciesSeedInput` (`sizePreset`, `spawnWeight`, `scale`, `spriteDirectory`, `description`, `lifespanYears`, `adultAgeYears`, `reproductionCooldownDays`), hướng dẫn thêm loài qua `species/large-mammals.animals.ts` với `TerrainType` thực, và giải thích mốc kiểm tra 40 loài trong `validateAnimalCatalog()`.
  - Viết `public/assets/sprites/animals/README.md` khớp với cơ chế `AnimalAssetManager`: ảnh `adult.png` là tùy chọn, cơ chế fallback con non (`child`) và già lão (`elder`), hệ số kích thước con non `ANIMAL_CHILD_SCALE_FACTOR`, quy ước ví dụ `water_buffalo`, và cơ chế chống spam request 404 theo URL.
  - Chạy tổng kiểm tra bàn giao:
    - `npm.cmd test`: PASS 100% (exit code 0)
    - `npm.cmd run build`: PASS (exit code 0)
    - `npm.cmd run assets:check`: PASS (exit code 0)
- **Lỗi còn lại:** Không có.
- **Trạng thái tổng:** Hoàn thành 9/9 bước.

---

## Các đợt sửa lỗi sau mốc `1504cfc`

| Commit | Nội dung sửa | File ảnh hưởng | Kiểm tra đã chạy |
|---|---|---|---|
| `559076b` | **Fix animal sprite loading** | `src/renderer/assets/AnimalAssetManager.ts`, `src/renderer/systems/AnimalRenderer.ts`, `tests/animal-asset-regression.ts`, `tests/run.mjs` | `npm test` (`5/5` animal-asset tests PASS), `npm run build` (exit 0) |
| `79b685d` | **Require valid forage habitat** | `src/modules/animals/AnimalAISystem.ts`, `tests/animal-simulation-regression.ts` | `npm test` (`7/7` animal-simulation tests PASS), `npm run build` (exit 0) |
| `e923db5` | **Correct animal extension guides** | `src/config/animals/README.md`, `public/assets/sprites/animals/README.md`, `docs/ANIMAL_YAO_IMPLEMENTATION_STATUS.md` | `npm test`, `npm run build`, `npm run assets:check` |
