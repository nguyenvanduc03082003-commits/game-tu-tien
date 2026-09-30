# Kế hoạch triển khai cho model nhỏ: sinh thái, tiến cấp, rương, xây dựng và cư trú

Nguồn khảo sát: `docs/WORLD_ECOLOGY_PROGRESSION_BEHAVIOR_REVIEW.md`. Ngày lập: 27-09-2026.

## Mục tiêu và quy tắc chung

Khi tạo thế giới: có người khởi đầu và động vật thường được rải ngẫu nhiên theo seed; **không tự sinh yêu tộc**. Cây gỗ và cây cho thức ăn phải tái tạo được tài nguyên. Công trình thường phải có thợ xây thật. Mỗi nhà có số cư dân cố định. Tiến cấp khó hơn nhưng không kẹt vĩnh viễn. Rương hiếm, chứa ít đồ, mở một lần. Cư dân và động vật tiếp tục sinh tồn được qua nhiều năm game.

Làm **tuần tự từng bước** dưới đây. Sau mỗi bước chạy test liên quan, `npm test`, `npm run build`; nếu bước đụng asset thì chạy thêm `npm run assets:check`. Chỉ chuyển bước khi tất cả đạt. Giữ nguyên bản lưu V2/V3: trường mới phải có giá trị mặc định khi nạp, dữ liệu nhập sai bị từ chối trước commit. Không sửa test để che lỗi; thay kỳ vọng cũ khi thiết kế mới thay đổi và thêm test hành vi thật. Không thêm hệ AI thứ hai để điều khiển cùng thực thể.

Quy ước thời gian: `TimeManager.TICKS_PER_SECOND = 20`, `TICKS_PER_DAY = 100`; 1 ngày game = 5 giây mô phỏng ở 1×. Mọi cooldown theo ngày dùng `dt * TICKS_PER_SECOND / TICKS_PER_DAY`, không dùng số giây như ngày.

## Bước 0 — Chụp trạng thái và lập test nền

**Làm:** ghi `git status --short`, giữ nguyên mọi thay đổi đang có. Đọc `Engine.initNewWorld()`, `PlantFactory`, `CultivationSystem`, `FactionFactory`, `CommunityTaskBoard`, `ThreeTierAISystem`, `AnimalAISystem`, `SaveManager`. Chạy `npm test`, `npm run build`, `npm run assets:check` và ghi kết quả trước khi sửa. Không sửa mã trong bước này.

**Hoàn thành khi:** biết test nào hiện kỳ vọng 5 loài động vật cố định (`tests/flora-spawn-regression.ts`) và test nào tự giả lập yêu tộc ban đầu (`tests/simulation-audit-regression.ts`); có danh sách bản lưu cũ cần giữ tương thích.

## Bước 1 — Chỉ sinh động vật thường lúc tạo thế giới

**Tệp chính:** `src/core/Engine.ts`, `src/modules/animals/AnimalSpawnService.ts`, `src/config/animals/animal.simulation.ts`, `tests/flora-spawn-regression.ts`, `tests/simulation-audit-regression.ts`.

1. Bỏ 4 lệnh `spawnFromArchetype(..., 'yao_*')` và lệnh `BeingFactory.generateInitialFauna()` trong `Engine.initNewWorld()`. Không xóa archetype yêu tộc, không xóa khả năng tạo yêu tộc bằng công cụ, và không loại yêu tộc khi nạp save.
2. Thay 5 cặp `{speciesId,count}` cố định bằng một **ngân sách tổng** động vật có giới hạn, rồi gọi `AnimalSpawnService.populate(world, map, budget, rng)` với pool sinh cảnh. Đặt ngân sách theo diện tích, có min/max để map nhỏ không rỗng và map lớn không quá đông. Cấu hình tách thú ăn cỏ, ăn thịt; ưu tiên đủ con mồi và đủ cặp đực/cái cho vài loài phổ biến. Không bắt buộc xuất hiện mọi loài trong catalog ở mỗi seed.
3. Giữ quy tắc vị trí: ô đất đi được, đúng `habitats`, không chồng công trình, tránh vùng khởi đầu người và lề map nếu có thể. Dùng duy nhất RNG theo seed, không thêm `Math.random()` trong quá trình rải ban đầu.
4. Cập nhật test: thế giới mới có `0` yêu tộc (`RaceComponent` beast/yao theo phân loại hiện có), động vật có `AnimalComponent` và không có Realm/Cultivation/Talent; nhiều seed cho tập loài/vị trí khác nhau, cùng seed cho kết quả y hệt. Kiểm tra cả bản đồ nhỏ và 360×360.

**Hoàn thành khi:** không có yêu tộc ở thế giới mới; save cũ có yêu tộc vẫn nạp; động vật ban đầu hợp sinh cảnh và có đa dạng seed. Không gọi lại `generateInitialFauna()` từ đường khởi tạo mới.

## Bước 2 — Sửa sinh cây, quả tái mọc và nguồn gỗ

**Tệp chính:** `src/modules/flora/PlantFactory.ts`, `PlantComponents.ts`, `PlantGrowthSystem.ts`, `src/config/plants.config.ts`, `src/modules/ai/brain/planner/AIPlanner.ts`, `src/modules/ai/brain/behavior/BehaviorTree.ts`, `src/modules/factions/FactionSystem.ts`, `src/modules/save/SaveManager.ts`. Test mới: `tests/flora-economy-regression.ts`, đưa vào `tests/ai-regression.ts` hoặc `tests/run.mjs`.

**2A — Gieo cây.** Gom việc chọn cây vào bảng theo `preferredTerrain` + `naturalSpawnWeight`. Cây gỗ, cây cho thức ăn và linh thảo có ngân sách theo diện tích/sinh cảnh riêng để rừng vẫn dày hơn đồng bằng. Tăng `floraCount` với **mọi** cây được tạo (hiện các nhánh ngoài rừng bỏ sót). Loại bỏ 4 cây mẫu đặt cứng gần tâm trong Engine, hoặc chuyển chúng thành tài nguyên bảo đảm cho vùng người khởi đầu bằng quy tắc theo seed và kiểm tra vị trí hợp lệ. Nếu muốn có cây ăn quả thân gỗ, thêm loại mới rõ `category: food`/thuộc tính cho gỗ; không biến bụi quả thành nguồn gỗ. Tránh nước, tọa độ ngoài map, đè lên nhà và trùng vị trí.

**2B — Vòng đời.** Đổi tăng trưởng sang ngày game. Thêm `fruitRegrowDaysRemaining` hoặc trường tương đương vào `PlantComponent`. Khi hái quả: chỉ một người lấy được một lượt, đặt `hasFruit=false`, bắt đầu cooldown; khi cooldown hết và cây còn sống/trưởng thành thì có quả lại. `growthProgress` mô tả trưởng thành, không dùng để giả lập tái ra quả. Tách sản lượng bụi quả/nấm/cây ăn quả trong config. Lưu/nạp cooldown; bản lưu cũ không có trường mới lấy mặc định hợp lý. Test sau hái lần 1, chưa đến kỳ không hái được, đúng kỳ ra quả lại, save/load giữa cooldown, dt 0.05/0.5/1 cho cùng kết quả theo ngày.

**2C — Gỗ.** Thêm trạng thái gỗ còn lại/cooldown tái sinh nếu cây có thể chặt mà vẫn sống; hoặc chặt hạ rồi tái gieo theo chu kỳ sinh thái. Thêm task chặt gỗ vào AI ba tầng, yêu cầu thợ/tiều phu đến gần cây thật, tiêu tốn thời gian, chuyển lượng gỗ đúng một lần vào kho thế lực/khu định cư. Kiểm tra nhiều thợ không khai thác cùng cây vượt số gỗ còn lại. Khi luồng này chạy, bỏ công thức `woodStock += floor(aliveMembers * 0.25)` trong `FactionSystem` hoặc thay bằng cơ chế sản xuất có nguồn cụ thể; cân lại chi phí xây để 12 người ban đầu không bị kẹt vì thiếu gỗ. Không đụng sản lượng đá nếu chưa thêm khai thác đá.

**Hoàn thành khi:** cây xuất hiện theo seed/sinh cảnh, tổng số không vượt ngân sách, quả mọc lại, gỗ trong kho truy được từ khai thác hoặc nguồn khởi đầu, thế giới không cạn thức ăn sau một lần hái.

## Bước 3 — Mọi công trình thường cần thợ xây thật

**Tệp chính:** `src/modules/factions/FactionFactory.ts`, `FactionComponents.ts`, `src/modules/ai/community/CommunityTaskBoard.ts`, `src/modules/ai/brain/behavior/BehaviorTree.ts`, `src/modules/factions/FactionSystem.ts`, `src/core/Engine.ts`, `src/ui/GodToolbar.ts`, `src/modules/save/SaveManager.ts`. Test: mở rộng `tests/construction-pipeline-regression.ts` và `tests/construction-lifecycle-audit-regression.ts`.

1. Xác định một API tạo công trình thường: kiểm tra vị trí/chủ sở hữu/nguồn lực → giữ vật tư → tạo `ConstructionSiteComponent` → tạo task xây. `FactionFactory.spawnBuilding()` không còn là đường mặc định để công trình thường xuất hiện hoàn tất; chỉ cho `instant` ở luồng có chủ đích rõ ràng (ví dụ nhập bản lưu/migration), và test chứng minh UI game không gọi đường này.
2. Gỡ ngoại lệ `found_campfire`/`found_sect_hall` khỏi quy trình site. **Lưu ý:** lúc khởi công sáng lập chưa có `factionId`; tạo công trường tạm gắn `FoundingIntent`/founder và vật tư khởi đầu, chưa tạo thế lực rỗng chỉ để đứng tên. Khi tiến độ đủ, kiểm tra lại 10 người lập xóm/50 người lập tông môn, tạo faction/settlement, chuyển quyền sở hữu công trường rồi gọi `completeBuilding()` đúng một lần. Nếu nhóm tan trước đó, hủy công trường và hoàn trả vật tư cho đúng nguồn. Nhóm sáng lập cần có người thực sự tham gia xây; công trình không được hoàn tất chỉ vì `task.duration` hết.
3. Công cụ đặt nhà trong Engine/GodToolbar: nút xây đặt **công trường**, không sinh nhà hoàn tất. Nếu không có faction, thợ hoặc nguồn vật tư hợp lệ, hiển thị lý do và không tự tạo một faction rỗng để đặt công trình. Nếu muốn giữ quyền Thượng Đế tạo tức thì, đó là một nút/hành động khác ghi rõ "Tạo tức thì"; yêu cầu xây thông thường không dùng nó.
4. Đóng các đường tắt `completeTask()` hoặc fallback `spawnBuilding(..., {instant:true})` cho task xây bình thường khi không có site. Tái giao task nếu thợ chết/bỏ đi; không tăng tiến độ nếu không có thợ sống ở đúng tầm tương tác. Đặt cọc/tiêu thụ/hoàn tiền đúng một lần và không ghi đè khoản đặt cọc của công trường khác.
5. Bản lưu đang xây nạp lại phải khôi phục task, thợ và tiến độ. Bản lưu cũ có nhà hoàn tất không bị biến thành công trường. `MortalAISystem` không được gắn vào Engine song song với `ThreeTierAISystem`; chuyển hành vi cần dùng sang board/behavior tree trước khi bỏ mã chết.

**Test bắt buộc:** không có thợ → 0 tiến độ qua nhiều ngày; một thợ → tiến độ tăng; rời đi/chết → dừng; thợ khác tiếp tục; hủy → hoàn đúng vật tư; save/load giữa chừng; các loại nhà/lửa trại/đại điện đều không cho tương tác trước khi xong.

## Bước 4 — Cư trú có giới hạn theo từng nhà

**Tệp chính:** `src/config/factions.config.ts`, `src/modules/factions/FactionFactory.ts`, `FactionComponents.ts`, `src/modules/ai/brain/planner/AIPlanner.ts`, `src/modules/ai/smartobjects/SmartObjectManager.ts`, `src/modules/save/SaveManager.ts`. Test mới: `tests/housing-capacity-regression.ts`.

1. Lấy `BUILDING_DEFINITIONS[type].housingCapacity` làm nguồn sức chứa. Nhà tranh hiện là 3; đại điện/động phủ có sức chứa riêng. Không dùng `SettlementComponent.housingCapacity` để quyết định một nhà còn trống; đó chỉ là tổng hợp.
2. Thêm hàm tập trung `assignHome(world, residentId, buildingId)` và `releaseHome(...)`: nhà phải hoàn tất, còn bền, cùng settlement, đúng loại cho phép ở và còn chỗ tính từ các `ResidenceComponent` của người còn sống. Gọi từ `assignResidence` khi có ID nhà và từ luồng tự phân nhà; không ghi đè nhà cũ nếu nhà mới đầy.
3. Khi dân chết/chuyển đi, nhà bị phá/hóa phế tích, hoặc sau nạp save, giải phóng/sửa liên kết cư trú. Người thứ 4 của nhà 3 chỗ phải ở trạng thái chưa có nhà hoặc được chuyển sang nhà khác. UI/Inspector hiển thị `đã ở / sức chứa`.
4. AI nghỉ ưu tiên nhà được gán, dùng slot ngủ từ cùng sức chứa; nếu hết chỗ thì chọn nơi khác/giải pháp ngủ ngoài trời có chi phí sinh tồn. Không cho bước `SLEEP_REST` hưởng hiệu quả trú ẩn như có nhà khi thực tế không có chỗ. Dọn slot tạm khi kế hoạch hủy hoặc người chết.

**Test bắt buộc:** 3 người ở nhà tranh hợp lệ, người thứ 4 không thể nhận cùng nhà; xóa người/đập nhà/chuyển settlement/nạp save đều sửa số chỗ đúng; công trường không có sức chứa; không hai người giữ cùng slot ngủ.

## Bước 5 — Cân bằng tiến cấp theo chủng tộc và bậc

**Tệp chính:** `src/config/realms.config.ts`, `src/config/races.config.ts`, `src/modules/cultivation/CultivationSystem.ts`, `TribulationSystem.ts`, `src/modules/ai/brain/goals/StrategicGoal.ts`, `src/ui/InspectorPanel.ts`. Test mới: `tests/cultivation-balance-regression.ts`.

1. Trước khi chọn hệ số mới, viết script mô phỏng 100–500 nhân vật/seed trong 1, 5, 20 năm game với Qi môi trường phổ biến và các mức thiên phú. Báo cáo tỷ lệ đạt từng đại cảnh giới, số lần thử, tử vong; không dùng thời gian thực để đánh giá.
2. Gom công thức tiểu/đại cảnh giới vào hàm thuần đọc cấu hình theo chủng tộc/bậc. Hiện tiểu cảnh giới bắt đầu 70%, bonus có thể lên trần 95%; đại cảnh giới không có lôi kiếp thành công ngay. Thêm xác suất thành công cho đại cảnh giới không qua lôi kiếp, cooldown sau thất bại tính bằng ngày và chi phí Qi/HP rõ ràng. Trần bonus tổng phải hợp lý; không để đan + công pháp + ngộ tính biến mọi lần thử thành 95%.
3. Yêu tộc có yêu cầu Qi/thời gian/huyết mạch cao hơn trước Hóa Hình; ma tộc có rủi ro phản phệ cao hơn; nhân tộc giữ đường tiến cấp ổn định. Điều chỉnh lôi kiếp theo bậc và khả năng sống sót thực tế, tránh khó bằng cách chỉ tăng sát thương quá mức. Giữ một xác suất tối thiểu để không kẹt vô hạn; UI cho thấy tỷ lệ dự kiến và lý do chưa đủ điều kiện.
4. AI không spam thử khi Qi vừa đầy nếu còn cooldown hoặc thiếu điều kiện; `StrategicGoal` và `CultivationSystem` dùng cùng hàm kiểm tra. Save/load bảo toàn cooldown/bonus; bản lưu cũ lấy mặc định tương thích.

**Hoàn thành khi:** mô phỏng nhiều seed cho thấy yêu tộc/ma tộc lên cấp chậm và rủi ro hơn theo mục tiêu đã ghi trong test; không có đường đột phá 100% ngoài thiết kế; không spam thất bại mỗi tick; thuốc và trait chỉ cộng đúng một lần.

## Bước 6 — Rương kho báu hiếm, mở một lần

**Tệp chính:** tạo module `src/modules/treasure/` cho catalog, component, sinh rương và service mở rương; nối `src/core/Engine.ts`, renderer/Inspector, `src/modules/save/SaveManager.ts`, `src/modules/alchemy/InventoryComponent.ts` nếu cần. Test mới: `tests/treasure-regression.ts`.

1. Tạo `TreasureChestComponent` có `loot` dạng ID + số lượng, `opened`, và phiên bản/schema đơn giản. Dùng các định nghĩa vật phẩm thật trong catalog; không lưu object item tùy ý không xác thực. Sinh 4–8 rương cho map 360×360, điều chỉnh theo diện tích với trần thấp; chỉ trên đất đi được, tránh nước, công trình và khu khởi đầu. Dùng RNG theo seed và phân tán khoảng cách tối thiểu. Không sinh lại khi nạp save.
2. Loot có trọng số: phần lớn 1–2 vật phẩm thường, hiếm khi có vật phẩm quý. Phiên bản đầu chỉ chọn loại đã có nơi chứa và quy tắc trao đồ rõ ràng. `InventoryComponent` hiện **chỉ lưu đan**; nếu rương chứa vũ khí/giáp/pháp bảo, phải bổ sung túi chứa vật phẩm tương ứng (hoặc giới hạn phiên bản đầu ở đan/vật tư có kho), cập nhật save/load và UI. Không tự trang bị đè món đang mặc.
3. `openChest(world, chestId, actorId)` kiểm tra rương chưa mở, người còn sống, trong tầm tương tác, có chỗ nhận đồ, rồi chuyển đồ **nguyên tử** và đặt `opened=true`. Nếu túi đầy/ID sai/ngoài tầm, rương giữ nguyên. UI và AI gọi cùng service; AI chỉ tìm rương khi không có nhu cầu sinh tồn cấp bách.
4. Renderer/Inspector thể hiện rõ chưa mở/đã mở và nội dung sau khi mở. Save/load lưu trạng thái; `validateSaveData()` kiểm tra item ID, số lượng nguyên dương, trạng thái và tọa độ trước commit.

**Test bắt buộc:** cùng seed cho cùng vị trí/loot; mật độ và khoảng cách hợp lệ; không trùng công trình/nước; mở hai lần không nhân đồ; hai người tranh cùng rương chỉ một người nhận; túi đầy không mất đồ; save/load trước và sau mở giữ nguyên kết quả.

## Bước 7 — Rà AI và mô phỏng tích hợp

**Tệp chính:** `src/modules/ai/systems/ThreeTierAISystem.ts`, `src/modules/ai/brain/goals/StrategicGoal.ts`, `AIPlanner.ts`, `BehaviorTree.ts`, `src/modules/animals/AnimalAISystem.ts`, `AnimalLifecycleSystem.ts`, `AnimalReproductionSystem.ts`. Test mới: `tests/ecosystem-integration-regression.ts`.

Rà theo ma trận tình huống, không sửa mò toàn bộ AI:

| Nhóm | Tình huống phải kiểm tra | Kết quả mong đợi |
| --- | --- | --- |
| Người phàm | đói/khát, hái quả, chặt gỗ, xây, về nhà, sinh con | ưu tiên sinh tồn; không tạo tài nguyên từ hư không; không ở quá sức chứa |
| Yêu/ma tạo thủ công hoặc từ save cũ | tu luyện, đột phá, ăn, di chuyển, chiến đấu | vẫn hoạt động dù thế giới mới không sinh sẵn |
| Động vật ăn cỏ | tìm địa hình thức ăn, trốn thú săn, sinh sản | không chết hàng loạt vì AI kẹt đường/thiếu thức ăn |
| Động vật ăn thịt | săn mồi hợp loài, ăn xác, rời mục tiêu hỏng | không khóa mục tiêu đã chết/mất, không tạo dinh dưỡng vô hạn |
| Công trường | nhiều thợ, thợ chết, save/load | tiến độ/tài nguyên cộng đúng một lần |
| Rương | hai AI cùng tới, bị gián đoạn, save/load | một lần nhận quà, không mất đồ |

Chạy mô phỏng ít nhất 10 seed, đo mốc 30/180/360 ngày game ở 0.5×, 1×, 5×. Ghi số người, động vật theo loài, cây có quả, gỗ/đá/lương thực, nhà đã ở/quá tải, công trường kẹt, rương còn/mở, phân bố cảnh giới, lỗi runtime và thời gian mỗi tick. Nếu kết quả khác nhau giữa các tốc độ với cùng số tick, sửa trước khi nghiệm thu. Không yêu cầu seed khác phải cho thế giới giống nhau.

## Bước 8 — Nghiệm thu và bàn giao

Chạy đầy đủ `npm test`, `npm run build`, `npm run assets:check`; kiểm tra `git diff --check`. Mở game kiểm tra bằng mắt: thế giới mới không có yêu tộc; động vật/cây/rương rải tự nhiên; quả mọc lại; công trình dở có thợ; nhà không quá người; cảnh giới tăng chậm; save/load giữa từng hoạt động. Ghi kết quả, số test, lỗi còn lại và phạm vi chưa kiểm tra vào `docs/WORLD_ECOLOGY_IMPLEMENTATION_VERIFICATION.md`.

Không được báo “hoàn thành 100%” chỉ vì test xanh. Khi gặp cấu trúc dữ liệu cũ không khớp, sửa migration và thêm test save cũ trước khi tiếp tục. Không xóa dữ liệu thế giới đang chơi của người dùng để áp thay đổi cho **thế giới mới**.
