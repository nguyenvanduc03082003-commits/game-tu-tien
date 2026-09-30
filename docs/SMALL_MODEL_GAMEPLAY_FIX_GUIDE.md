# Hướng dẫn triển khai cho model nhỏ: nhịp thời gian, UI, thế lực, xây dựng

Tài liệu nền: [GAMEPLAY_PACING_UI_FACTION_BUILDING_PLAN.md](GAMEPLAY_PACING_UI_FACTION_BUILDING_PLAN.md). Tài liệu này là **chỉ dẫn thực thi**; chưa phải báo cáo đã sửa. Làm từng bước, hoàn tất và kiểm thử một bước trước khi chuyển bước kế. Giữ nguyên thay đổi chưa commit hiện có; không dọn hoặc ghi đè working tree của người dùng.

## 0. Quy tắc chung và giá trị cần đạt

- Mục tiêu thời gian: 20 tick mô phỏng/giây, 100 tick/ngày; tốc độ cho phép `0, 0.5, 1, 2, 3, 5`. `0` là tạm dừng. Một năm 360 ngày.
- Mục tiêu dân số: xóm 10 → làng 30 → vương quốc 90 người; tông môn 50 người **gồm cả người sáng lập** → thánh địa 200 người. Chỉ đếm thành viên sống, đủ điều kiện và không trùng.
- Công trình thường phải có thời gian thi công, công năng chỉ kích hoạt khi hoàn thành. Tiến độ và vật tư giữ trước phải sống qua lưu/nạp.
- Giữ khả năng nạp bản lưu từ phiên bản hiện tại `2.0.0` trở lên; không xóa hoặc tái tạo thế giới đang chơi khi dữ liệu lưu lỗi. Tất cả thông số mới phải được xác thực trước giai đoạn commit của `SaveManager.deserializeWorld()`.
- Không đánh dấu hoàn tất dựa trên `tsc` hoặc build đơn thuần. Cần test hành vi đúng, bản lưu cũ và thao tác UI ở trình duyệt.

## Bước 1 — Chốt một nguồn sự thật cho đồng hồ và tốc độ

### Tệp chính

`src/core/TimeManager.ts`, `src/core/GameSettings.ts`, `src/ui/TimeControls.ts`, `src/ui/MainMenu.ts`, `src/modules/save/SaveTypes.ts`, `src/modules/save/SaveManager.ts`, `tests/simulation-audit-regression.ts`.

### Việc cần làm

1. Khai báo tập tốc độ hợp lệ trong một module chung, tránh mảng riêng ở settings/save/UI. Đổi `TimeSpeed` thành `0 | 0.5 | 1 | 2 | 3 | 5`. Hiển thị đúng 6 lựa chọn trong HUD: `⏸`, `0.5x`, `1x`, `2x`, `3x`, `5x`. Cài đặt tốc độ mặc định chỉ nhận tốc độ dương.
2. Khi người chơi pause rồi resume, khôi phục tốc độ dương trước khi pause. Menu ESC (`PauseMenu`) có cờ `isPausedByMenu` riêng; không làm nó ghi đè tốc độ được chọn.
3. Bản lưu/cài đặt cũ có tốc độ 10x hoặc 50x: chuyển về 5x khi nạp/đọc settings; không từ chối toàn bộ save chỉ vì giá trị tốc độ cũ. Bản lưu mới nhận 0.5x/3x; đầu vào không thuộc tập cũ hoặc mới vẫn bị từ chối.
4. Giữ 20 tick/giây. Chỉ đổi nhịp lịch sang 100 tick/ngày. **Không** hạ `TICKS_PER_SECOND` xuống 2; điều đó làm chuyển động và AI chỉ cập nhật 2 lần/giây.
5. Thay mọi phép chia tick→ngày viết cứng `/ 20` có nghĩa lịch tại `TribulationSystem.ts`, `EncounterTracker.ts`, `TalentGenerator.ts`, `GrowthSystem.ts` và các tệp khác tìm bằng `rg`. Không thay những số 20 mang nghĩa khác (ví dụ chỉ số nhu cầu).

### Tương thích save: cách triển khai cụ thể

`SaveData.time` hiện chỉ lưu `totalTicks` và `speed`. Không nhân `totalTicks` cũ lên 5 rồi bỏ nguyên các timestamp trong component: nhiều sự kiện/cooldown dùng tick tuyệt đối.

Đề xuất lưu một mốc chuyển hệ lịch trong `time`, ví dụ `{ totalTicks, speed, clockSchema: 2, calendarEpochTick, calendarEpochDays, oldTicksPerDay }`:

- Với thế giới mới: epoch tick/ngày = 0, tốc độ lịch từ epoch là 100 tick/ngày.
- Với save cũ không có `clockSchema`: giữ `totalTicks` nguyên; đặt `calendarEpochTick = totalTicks`, `calendarEpochDays = totalTicks / 20`, `oldTicksPerDay = 20` khi nạp. Như vậy ngày/năm hiển thị ngay sau load giữ nguyên.
- Sau epoch, ngày lịch thực = `calendarEpochDays + (totalTicks - calendarEpochTick) / 100`. Ngày của sự kiện lịch sử có tick ≤ epoch được tính `tick / oldTicksPerDay`; ngày của sự kiện mới dùng công thức sau epoch. Viết hàm thuần `calendarDaysAtTick(timeState, tick)` và dùng trong `TimeManager` cũng như code di trú chạy trên staging world. Persist nguyên epoch trong các lần lưu tiếp theo.
- Với save đã có `clockSchema: 2`, xác thực epoch/ticksPerDay là số hữu hạn, không âm, nhất quán với `totalTicks`; không di trú lại lần hai. Nếu chỉ đổi `TICKS_PER_DAY` mà không có cơ chế này, save cũ sẽ lùi ngày/năm 5 lần.
- `checkDateTransitions()` so sánh ngày tính từ hàm mới trước/sau mỗi tick. Những module đang dùng `world.getCurrentTick()` phải gọi helper lịch tương ứng; tránh đọc trạng thái singleton của thế giới cũ trong giai đoạn dựng staging.

Nếu chọn thiết kế đồng hồ khác, phải đạt cùng bốn bất biến: `totalTicks` mô phỏng không đổi khi nạp save cũ; ngày/năm hiện tại không đổi; timestamp/cooldown lịch sử giữ đúng ngày; save→load lần thứ hai không di trú lại.

### Test bắt buộc trước bước 2

- Tick giả lập 100 lần ở 1x cho ra 1 ngày; 0.5x cần gấp đôi thời gian thực; 3x và 5x xen kẽ đồng hồ với mô phỏng đúng từng tick; pause không cộng tick.
- Qua ranh giới 30 ngày, 90 ngày, 360 ngày có sự kiện chuyển tháng/mùa/năm đúng một lần.
- Save cũ tại tick không chia hết cho 20 (ví dụ 45) giữ đúng ngày và phần ngày sau load; save lại/nạp lại không dịch ngày; sự kiện cũ và mới có thứ tự ngày đúng.
- Save cũ 10x/50x nạp ở 5x; speed mới 0.5x/3x save/load nguyên vẹn. Cập nhật test 50x cũ thay vì xóa kiểm tra tick xen kẽ.

## Bước 2 — Cân bằng sinh thái theo đồng hồ mới

### Tệp chính

`src/modules/animals/AnimalLifecycleSystem.ts`, `AnimalReproductionSystem.ts`, `AnimalCarcassSystem.ts`, `AnimalFactory.ts`, `src/config/animals/animal.simulation.ts`, `src/modules/ai/NeedsSystem.ts`, `src/modules/beings/ReproductionSystem.ts`, `src/modules/beings/FamilyComponent.ts`, test động vật và quần thể.

### Việc cần làm

1. Đối với tuổi, đói, sát thương vì đói, sinh sản và phân hủy của động vật: tính theo **ngày game** qua helper lịch mới, không theo số giây render. Giữ AI tìm thức ăn/di chuyển tính theo tick mô phỏng. Không tăng đồng loạt `lifespanYears` của 40 loài để che sai nhịp lịch.
2. Rà soát người/yêu tộc: `NeedsSystem` hiện giảm no, khát, ngủ bằng `dt` giây mô phỏng, còn tuổi tăng theo năm game. Với ngày dài hơn, các nhu cầu này sẽ giảm nhanh hơn tính theo ngày. Chốt đơn vị rõ cho từng nhu cầu (khuyến nghị no/khát theo ngày; thao tác ngủ/di chuyển theo tick), chuyển hệ số cấu hình và sửa test tương ứng.
3. `ReproductionSystem`/`FamilyComponent` dùng `cooldownSeconds = 360`. Quyết định đây là ngày lịch hay giây mô phỏng rồi đổi tên/đơn vị nhất quán. Kiểm tra tốc độ tăng dân phù hợp ngưỡng xóm 10/làng 30.
4. Thêm bộ đếm nguyên nhân chết động vật trong test/mô phỏng quan sát: già, đói, bị săn/chiến đấu. Với động vật có thức ăn sẵn, không được chết đói chỉ vì đổi lịch; với động vật không có thức ăn, tử vong phải theo cấu hình ngày mới.

### Test bắt buộc

Test vòng đời 1/30/360 ngày; loài tuổi thọ 4 năm; đói→kiếm ăn→hồi no; sinh sản và xác phân hủy. Chạy cùng một số ngày game tại 0.5x/1x/5x và kiểm tra kết quả sinh học tương đương (khác thời gian thực, không khác số ngày).

## Bước 3 — Quy mô thế lực; sửa các giới hạn cắt nhóm trước khi đổi ngưỡng

### Tệp chính

`src/config/factions.config.ts`, `src/modules/factions/FactionSystem.ts`, `FactionFactory.ts`, `src/modules/ai/community/CommunityTaskBoard.ts`, `src/ui/InspectorPanel.ts`, test faction/settlement.

### Việc cần làm

1. Sửa **điều kiện không thể đạt** trước: `FactionSystem.ts` đang dùng `cluster.slice(0, 8)` cho xóm và `[founderId, ...followers.slice(0, 6)]` cho tông môn. Đổi thành chọn đủ `minFounders` và `1 + minFollowers` hoặc mô hình dân số cam kết riêng, không cắt ở 8/7. `CommunityTaskBoard.completeTask()` đang xác nhận lại kích thước nhóm, nên nếu bỏ sót, mọi task sáng lập mới đều bị hủy.
2. Đặt cấu hình thống nhất: `hamlet.minAdults/minFounders = 10`; `village.minPopulation/minResidents/hamletToVillage.minResidents = 30`; `kingdom.minPopulation/minTotalResidents/villageToKingdom.minTotalPopulation = 90`; `sect.minFollowers = 49`; `holy_land.minMembers/sectToHolyLand.minMembers = 200`. Tách rõ số follower khỏi tổng số người để không tạo lệch 49/50.
3. Xác nhận người tham gia còn sống, đủ tuổi, gần địa điểm và chưa thuộc ý định sáng lập khác ở ba thời điểm: lập intent, giao task, hoàn tất. Với tông môn 50 người, hiện tìm follower trong bán kính 260px; với xóm 10 người, hiện tìm cluster trong 180px. Nếu thế giới không có mật độ đó, cần cơ chế tuyển/rủ dần trong một thời hạn, thay vì yêu cầu cả 50 đứng cạnh founder cùng lúc. Không mở rộng bán kính vô hạn gây quét O(n²) mỗi tick.
4. Xem lại `Engine.initNewWorld()`: hiện chỉ gieo yêu tộc và động vật, không có 10 nhân tộc khởi đầu. Chọn một nguồn dân khả thi cho nhánh tự phát triển: quần thể người khởi đầu, luồng di cư hoặc tùy chọn thế giới có sẵn dân. Đảm bảo thức ăn và chỗ ở tối thiểu, không chỉ tăng số lượng.
5. Chuyển các mốc viết cứng trong `FactionSystem.ts` (hợp nhất 16, tuyển vệ binh 50, suy thoái 5/15, phẩm cấp tông môn 8/15) sang cấu hình/tỷ lệ mới. Đồng bộ dự trữ thức ăn, sức chứa nhà, số điểm định cư và điều kiện phòng thủ. Ví dụ 90 dân × 3 ngày cần ít nhất 270 suất dự trữ; `kingdom.minFoodStock = 80` hiện không đủ theo quy tắc đó.
6. Chỉ đếm thành viên sống, không trùng ID; điều kiện thăng cấp không được phụ thuộc vào xác chết hoặc người rời phe. Điều kiện suy thoái có thời gian ân hạn; tránh thăng/hạ liên tục khi dân số dao động quanh mốc.
7. Cập nhật Inspector và nhật ký hiển thị tiến trình, ví dụ `Xóm 9/10`, `Tông môn 49/50`, kèm điều kiện còn thiếu.

### Test bắt buộc

Test 9/10, 29/30, 89/90, 49/50, 199/200; founder chết; một người xuất hiện trong hai intent; thành viên rời nhóm giữa lúc xây; nhóm đủ dân nhưng thiếu nhà/thức ăn; save/load intent dở dang; 200 người không làm vượt ngân sách tick AI. Sửa fixture test cũ từng giả định 3 người lập xóm hoặc 4 người lập tông môn; không làm yếu kiểm tra.

## Bước 4 — Một pipeline thi công bền vững

### Tệp chính

`src/config/factions.config.ts` (`BUILDING_DEFINITIONS`), `src/modules/ai/community/CommunityTaskBoard.ts`, `src/modules/ai/brain/planner/AIPlanner.ts`, `src/modules/ai/brain/behavior/BehaviorTree.ts`, `src/modules/ai/MortalAISystem.ts`, `src/modules/factions/FactionSystem.ts`, `FactionFactory.ts`, `BuildingSystem.ts`, `src/core/Engine.ts`, `src/modules/save/SaveTypes.ts`, `SaveManager.ts`, renderer/Inspector công trình.

### Việc cần làm

1. Thêm `constructionDays` theo loại công trình, khởi đầu: lửa trại 1; nhà tranh/ruộng 3; giếng 5; vườn thuốc 7; động tu luyện 12; phòng luyện đan 15; đại điện 20; trận phòng thủ 30. Tính `requiredWorkTicks = constructionDays × 100`; đóng góp mỗi tick dựa trên `workSpeedFactor`. Đây là **thời gian lao động tích lũy**, không phải thời gian chờ lịch tự hoàn thành khi không ai xây.
2. Chọn một nơi giữ tiến độ bền vững: đề xuất `ConstructionSiteComponent` trên thực thể công trường, gồm type, owner/settlement, vị trí, `requiredWorkTicks`, `completedWorkTicks`, tài nguyên đã giữ và trạng thái. `CommunityTask` chỉ tham chiếu site. Công trường chiếm vị trí để tránh dựng chồng, nhưng chưa có `BuildingComponent`; vì vậy chưa cấp chỗ ở, thức ăn, phòng thủ hay điều kiện thăng cấp.
3. Khi worker nghỉ, đổi việc, chết hoặc thay người, `completedWorkTicks` không reset. Khi task bị hủy, hoàn trả vật tư đúng một lần theo quy tắc rõ; khi hoàn tất, trừ vật tư đúng một lần và tạo công trình bằng `FactionFactory.spawnBuilding()` đúng một lần. Tách thao tác `start/progress/cancel/complete` trong một service thay vì lặp ở mỗi hệ.
4. Xử lý đủ mọi đường: task của `CommunityTaskBoard`; tự dựng sau `stateTimer > 5` ở `MortalAISystem`; đại điện thủ phủ dựng trực tiếp trong `FactionSystem`; click đặt công trình và lập tông môn trong `Engine`. Không để một đường thường nào gọi `spawnBuilding()` tức thì. Nếu vẫn giữ quyền Thượng Đế tạo tức thì, đặt nút/nhãn riêng để người chơi hiểu đây là ngoại lệ quản trị.
5. Save/load: hiện `CommunityTaskBoard` chỉ ở bộ nhớ và bị `clear()` khi nạp. Lưu công trường, tiến độ và khoản vật tư giữ; khôi phục task/assignment sau khi staged world đã được xác thực. Tránh lưu hai nguồn sự thật độc lập có thể lệch. Với save cũ, công trình đã có mặc định là hoàn thành; không tự biến chúng thành công trường.
6. Renderer và Inspector hiển thị công trường, phần trăm tiến độ, loại công trình, nguồn vật tư và người xây. Khi công trường hoàn tất, cập nhật pathfinding/spatial cache nếu cần.

### Test bắt buộc

Tiến độ trước/sau 1 ngày; không hoàn tất khi thiếu tick lao động; thợ đổi người không mất tiến độ; hủy không hoàn hai lần; hoàn tất không trừ hai lần; save/load giữa chừng giữ đúng tiến độ/vật tư; công trường không tạo hiệu lực sớm; từng đường xây kể trên đều đi qua pipeline. Test việc thành lập xóm/tông môn chỉ commit phe khi điều kiện dân số còn đạt tại thời điểm hoàn thành.

## Bước 5 — Sắp lại HUD dựa trên kích thước màn hình

### Tệp chính

`index.html`, `src/ui/UIManager.ts`, `TimeControls.ts`, `Minimap.ts`, `InspectorPanel.ts`, `GodToolbar.ts`, `WorldChronicle.ts`.

### Việc cần làm

1. Thay tọa độ inline rời rạc bằng vùng HUD có CSS class: hàng trên cho ngày/tốc độ/pause, góc phải cho minimap, ngăn trái cho Inspector, cạnh dưới cho toolbar mở theo nhóm, nhật ký dạng khay thu gọn. Giữ canvas có vùng trống để click.
2. `Minimap` đang `right: 240px` trong khi `TimeControls` có chiều rộng thay đổi; không căn bằng số 240 cố định. Inspector và Chronicle cùng rộng 360px; toolbar 10 tab có thể xuống nhiều dòng. Dùng CSS grid/flex và breakpoint thay vì giả định kích thước màn hình.
3. Trên viewport 1024px trở xuống: Inspector/toolbar thành drawer, minimap thu nhỏ hoặc bật/tắt, Chronicle rút gọn. Nút tốc độ mới phải đủ rộng để bấm, có trạng thái đang chọn rõ và tooltip.
4. Kiểm tra 1366×768, 1024×768, 768×600: không chồng panel, không mất nút lưu/menu/pause, hộp thoại nằm trong viewport, nội dung cuộn được, canvas vẫn thao tác được. Thử chọn thực thể, đóng Inspector, mở toolbar, đổi tốc độ, mở pause menu.

## Thứ tự nghiệm thu và bàn giao

Sau **mỗi bước**, chạy test liên quan, `npm test`, `npm run build`, `npm run assets:check`. Ghi kết quả thực tế vào cuối tài liệu hoặc một báo cáo riêng. Không đổi số lượng test kỳ vọng bằng cách bỏ test thất bại. Sau bước 5, chơi thử ít nhất một save cũ và một thế giới mới trong trình duyệt; theo dõi 30 ngày game ở 1x rồi 5x, số động vật sống và nguyên nhân chết, tiến độ xóm/công trình, bố cục ở ba viewport.

Hoàn thành khi toàn bộ tiêu chí trên đạt. Nếu phát hiện yêu cầu chưa rõ hoặc mốc dân số 200 không khả thi vì quần thể hiện tại, ghi số liệu thực tế và đề xuất điều chỉnh nguồn dân; không âm thầm giảm mốc người dùng yêu cầu.
