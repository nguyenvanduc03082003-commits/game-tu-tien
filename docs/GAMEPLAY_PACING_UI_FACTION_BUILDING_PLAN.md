# Rà soát nhịp game, UI, thế lực và xây dựng

Ngày rà soát: 2026-09-27. Tài liệu này là kế hoạch sửa; chưa thay đổi logic game. Đã đối chiếu mã và test hiện tại. Chưa chụp/kiểm tra trực tiếp cửa sổ game vì công cụ xem giao diện không khởi tạo được trong phiên này; nhận xét về UI dựa trên vị trí và kích thước panel trong mã.

## Kết luận và thông số đề xuất

| Vấn đề | Hiện tại | Mục tiêu đề xuất |
| --- | --- | --- |
| Thời gian | 20 tick/giây và 20 tick/ngày: **1 ngày/giây ở 1x** | 20 tick/giây, **100 tick/ngày: 5 giây/ngày ở 1x**; giữ chuyển động/mô phỏng 20 tick/giây |
| Tốc độ | Tạm dừng, 1x, 2x, 5x, 10x, 50x | Tạm dừng, 0.5x, 1x, 2x, 3x, 5x; mặc định 1x |
| Dân số dân sự | Xóm 3 người, làng 8, vương quốc 25 | Xóm **10**, làng **30**, vương quốc **90** người sống, đủ điều kiện |
| Dân số tu luyện | Tông môn 1 người sáng lập + 3 người theo; thánh địa 30 | Tông môn **50** người gồm người sáng lập; thánh địa **200** thành viên |
| Thi công | Task AI 3.5–5 giây mô phỏng; các đường khác dựng ngay | Công trình có tiến độ theo **ngày game**, dùng được sau khi hoàn thành; tiến độ giữ qua lưu/nạp |

Các mốc 10→30→90 và 50→200 là cách hiểu trực tiếp yêu cầu “mỗi cấp gấp 3” cho nhánh dân sự và “thánh địa gấp 4” cho nhánh tu luyện. Các điều kiện tài nguyên, công trình, tu vi và ổn định vẫn cần giữ, nhưng phải điều chỉnh cho tương xứng dân số mới.

## 1. Thời gian và vòng đời động vật

### Phát hiện

- `src/core/TimeManager.ts`: `TICKS_PER_SECOND = 20`, `TICKS_PER_DAY = 20`. Ở 50x, một năm 360 ngày chỉ mất khoảng 7.2 giây thực. Động vật tuổi thọ 4 năm sống tối đa khoảng 29 giây thực ở 50x, chưa kể tuổi đã có khi sinh thế giới.
- `src/modules/animals/AnimalLifecycleSystem.ts`: tuổi, độ đói và sát thương chết đói đều tiến theo ngày game. `ANIMAL_HUNGER_DECAY_PER_DAY = 18`, ngưỡng đói là 15 (`src/config/animals/animal.simulation.ts`). Con vật mới sinh có điểm no khoảng 70–95 (`AnimalFactory.ts`), nên nếu không kiếm được thức ăn có thể bắt đầu đói chỉ sau khoảng 3–4.5 giây ở 1x hiện tại. Cần phân biệt chết già, chết đói và bị săn trong thống kê/tình huống thử.
- Tuổi cư dân tăng bằng sự kiện `time:year_passed` (`src/modules/ai/NeedsSystem.ts`); đổi thời lượng ngày sẽ ảnh hưởng trực tiếp tới lão hóa người, mùa, trồng trọt, AI và tiến trình thế lực.
- Vẫn có các phép đổi tick→ngày viết cứng `/ 20` ở `TribulationSystem.ts`, `EncounterTracker.ts`, `TalentGenerator.ts`, `GrowthSystem.ts`. Chỉ sửa `TICKS_PER_DAY` sẽ làm các hệ này lệch lịch.

### Cách sửa

1. Giữ 20 tick mô phỏng/giây để chuyển động không giật. Đặt 100 tick/ngày như cấu hình cân bằng đầu tiên: 1 năm ≈ 30 phút ở 1x, 6 phút ở 5x; 4 năm ≈ 2 giờ ở 1x, 24 phút ở 5x. Cho phép tinh chỉnh 100→200 sau khi chơi thử, tránh rải số cứng trong mã.
2. Gom phép đổi tick/ngày vào `TimeManager` hoặc module thời gian chung; thay toàn bộ `/ 20` mang nghĩa ngày. Rà soát cả sinh sản, phân hủy xác, cây trồng, nhu cầu, cooldown và điều kiện ổn định thế lực. Các hoạt động tính theo giây cần được phân loại rõ: hiệu ứng chiến đấu giữ giây; sinh thái và xây dựng nên theo ngày.
3. Bổ sung `clockVersion`/`ticksPerDayAtSave` cho dữ liệu lưu. Bản lưu cũ dùng 20 tick/ngày phải nạp với **ngày/năm hiện tại không đổi**. Cần chuyển các bộ đếm tick tuyệt đối liên quan hoặc thiết kế đồng hồ lịch độc lập với số tick mô phỏng; không chỉ nhân `time.totalTicks` rồi bỏ qua timestamp/cooldown trong component.
4. Ghi hoặc hiển thị nguyên nhân chết của động vật để đo tác động cân bằng: tuổi già, đói, bị săn, chiến đấu. Sau khi kéo dài ngày, kiểm tra khả năng kiếm ăn/sinh sản chứ không tự ý tăng tuổi thọ catalog của 40 loài.

### Tiêu chí nghiệm thu

- Ở 1x, 100 tick tiến sau khoảng 5 giây thực và lịch tăng đúng 1 ngày; 0.5x ≈ 10 giây/ngày; 5x ≈ 1 giây/ngày.
- Động vật ở tình trạng đủ thức ăn không chết trước `maxLifespan`; khi bị bỏ đói, nguyên nhân chết và thời điểm phù hợp với mức tiêu hao/ngày.
- Nạp save cũ không lùi ngày/năm, không nhân tuổi hoặc bỏ qua cooldown; test các mốc qua ngày/mùa/năm.

## 2. Bộ điều khiển tốc độ

### Phát hiện

`TimeSpeed` ở `src/core/TimeManager.ts`, nút trong `src/ui/TimeControls.ts`, `GameSettings.sanitize()` và lựa chọn mặc định trong `src/ui/MainMenu.ts` đều dùng tập cũ 0/1/2/5/10/50. `SaveManager.validateSaveData()` cũng chỉ chấp nhận tập này.

### Cách sửa

1. Định nghĩa tập tốc độ duy nhất `0 | 0.5 | 1 | 2 | 3 | 5`, dùng lại ở UI, settings, xác thực save và test. Nút tạm dừng hiển thị riêng; khi tiếp tục, khôi phục tốc độ dương trước đó thay vì luôn 1x nếu người chơi đang ở 0.5x hoặc 3x.
2. Với save cũ chứa 10x/50x, chuyển về 5x khi nạp; lưu 0.5x/3x hợp lệ. Settings cũ cũng cần chuẩn hóa về 5x hoặc 1x theo quy tắc đã chọn.
3. Sửa test 50x hiện tại ở `tests/simulation-audit-regression.ts` sang 5x và giữ kiểm tra rằng mỗi tick đồng hồ xen kẽ chính xác với update thế giới.

## 3. Bố cục UI

### Phát hiện từ mã

- `TimeControls` ở góc phải trên nhưng chứa ngày, dân số, 6 nút tốc độ, 3 nút lớp phủ và menu trong một hộp; `Minimap` có `right: 240px` cố định (`src/ui/Minimap.ts`). Chiều rộng thực của hộp thời gian không cố định, nên hai panel có nguy cơ chồng lên nhau.
- `InspectorPanel` cố định `width: 360px` bên trái trên; `WorldChronicle` cố định `width: 360px` bên trái dưới; `GodToolbar` ở giữa cạnh dưới, 10 tab tự xuống dòng trong `max-width: 95vw`. Khi cửa sổ hẹp/thấp, thanh công cụ có thể che nhật ký và phần bản đồ. Tất cả đang dùng vị trí và style inline, gần như không có breakpoint responsive (`index.html`, `src/ui/UIManager.ts`).
- Thanh công cụ quản trị rất nhiều chức năng luôn hiện, trong khi thông tin chơi chính (ngày, tốc độ, bản đồ) cạnh tranh cùng không gian.

### Cách sửa

1. Tạo bố cục HUD chung trong CSS thay cho các tọa độ độc lập: thanh trạng thái mỏng ở trên (ngày, tốc độ, pause), minimap thành một ô góc phải, inspector thành ngăn bên trái có thể đóng, nhật ký là khay thu gọn, công cụ quản trị là ngăn dưới mở theo tab.
2. Trên màn hình hẹp: minimap thu nhỏ/ẩn bằng nút, inspector mở dạng drawer, toolbar cuộn ngang hoặc dùng danh mục, nhật ký chỉ hiện vài dòng. Đặt giới hạn chiều cao theo viewport và để canvas còn vùng thao tác đủ lớn.
3. Dùng CSS class và media query; kiểm tra kích thước tối thiểu 1366×768, 1024×768 và 768×600. Đo bounding boxes để bảo đảm các panel không giao nhau và các nút chính vẫn nhìn thấy/click được. Chỉ chốt tinh chỉnh thị giác sau khi xem ảnh chụp của game đang chạy.

## 4. Dân số lập và thăng cấp thế lực

### Phát hiện

`src/config/factions.config.ts`: `hamlet.minAdults/minFounders = 3`, `village.minResidents = 8`, `kingdom.minTotalResidents = 25`, `sect.minFollowers = 3`, `holy_land.minMembers = 30`. Ngưỡng được dùng ở `FactionSystem.ts` và xác nhận lại tại `CommunityTaskBoard.completeTask()`. Có ngưỡng viết cứng khác trong `FactionSystem.ts` như 16 người để hợp nhất, 50 người để tuyển vệ binh, 5/15 người để suy thoái; phần hiển thị Inspector cũng đọc cấu hình.

### Cách sửa

1. Đặt cấu hình: `hamlet.minAdults = minFounders = 10`; `village.minPopulation = minResidents = hamletToVillage.minResidents = 30`; `kingdom.minPopulation = minTotalResidents = villageToKingdom.minTotalPopulation = 90`; `sect.minFollowers = 49` (cộng founder = 50); `holy_land.minMembers = sectToHolyLand.minMembers = 200`.
2. Đếm **người sống, đủ tuổi/điều kiện, thành viên duy nhất**. Giữ kiểm tra cả lúc phát sinh ý định, lúc bắt đầu xây và lúc hoàn tất, để một nhóm 10 người không thể tạo nhiều xóm cùng lúc.
3. Đưa các ngưỡng 16/50/5/15 và những mốc phẩm cấp tông môn vào cấu hình hoặc công thức tương đối. Cập nhật thực phẩm, nhà ở, số điểm định cư, bảo vệ và ngưỡng suy thoái tương ứng; hiện `kingdom.minFoodStock = 80` thấp hơn mức dự trữ tối thiểu 3 ngày cho 90 dân.
4. Kiểm tra nguồn dân: `Engine.initNewWorld()` hiện gieo yêu tộc và động vật, không gieo cộng đồng nhân tộc đủ 10 người. Nếu mong muốn hình thành xóm tự nhiên, cần thêm quần thể dân khởi đầu đủ điều kiện và nguồn thực phẩm, hoặc có lựa chọn tạo thế giới khởi đầu với cư dân. Không để ngưỡng mới làm nhánh dân sự không thể phát triển.
5. Làm rõ UI tiến trình: “Xóm 7/10”, “Làng 25/30”, “Tông môn 43/50”, “Thánh địa 180/200”; hiển thị cả điều kiện vật tư/công trình chưa đạt.

## 5. Thi công công trình

### Phát hiện

- `CommunityTaskBoard.ts` tạo task xây với `duration` khoảng 3.5–5.0; `AIPlanner.ts` đưa duration vào bước `PERFORM_WORK`; `BehaviorTree.ts` cộng `stepElapsedTimer += dt` và sinh công trình ngay khi đủ thời gian. Tiến độ nằm ở bước AI của một người, không phải ở công trình.
- `CommunityTaskBoard` chỉ giữ task trong bộ nhớ; `SaveManager.deserializeWorld()` gọi `clear()`. Nếu kéo dài thi công mà không lưu task/tiến độ, nạp game sẽ mất công việc dở và có thể làm rối tài nguyên đã giữ.
- `MortalAISystem.ts` có đường tự dựng công trình sau `stateTimer > 5` rồi gọi `FactionFactory.spawnBuilding()`; `FactionSystem.ts` dựng đại điện thủ phủ trực tiếp; công cụ đặt công trình trong `Engine.ts` cũng dựng ngay. Chỉ sửa `duration` của task cộng đồng không bao phủ các đường này.

### Cách sửa

1. Đặt `constructionDays` theo loại công trình trong `BUILDING_DEFINITIONS` hoặc bảng cấu hình tập trung. Giá trị thử: lửa trại 1 ngày; nhà tranh/ruộng 3 ngày; giếng 5 ngày; vườn thuốc 7 ngày; động tu luyện/phòng luyện đan 12–15 ngày; đại điện 20 ngày; trận phòng thủ 30 ngày. Chỉnh sau playtest.
2. Tạo trạng thái `planned → under_construction → complete`, có `requiredWorkTicks`, `completedWorkTicks`, người xây/đóng góp, vị trí và tài nguyên giữ. Công trình dở không cấp chỗ ở, sản lượng, phòng thủ hoặc điều kiện thăng cấp. Hiển thị thanh tiến độ và ngày dự kiến hoàn thành.
3. Tiến độ gắn với công trình hoặc task bền vững, không gắn riêng `planner.stepElapsedTimer`. Khi thợ nghỉ/đổi việc/chết, người khác tiếp tục được; khi hủy thì giải phóng vị trí và hoàn trả tài nguyên theo một quy tắc rõ ràng. Save/load phải lưu tiến độ và khoản dự trữ, tránh trừ hoặc hoàn hai lần.
4. Dẫn các đường xây của `MortalAISystem`, `FactionSystem` và công cụ người chơi qua cùng service thi công. Nếu vẫn có quyền “Thượng Đế tạo tức thì”, tách nó thành thao tác quản trị có nhãn rõ, không dùng làm đường xây thông thường.

## Thứ tự triển khai và kiểm thử

1. **Đồng hồ + tốc độ:** chốt 100 tick/ngày; sửa toàn bộ phép đổi ngày; xử lý save cũ; cập nhật bộ tốc độ và UI. Test thời gian thực, ngày/mùa/năm, save cũ, 0.5x/3x và tạm dừng.
2. **Sinh thái:** kiểm tra tuổi, đói, săn mồi, sinh sản, phân hủy ở 0.5x/1x/5x. Dùng thống kê nguyên nhân chết trong mô phỏng dài để xác nhận quần thể không biến mất bất thường.
3. **Dân số thế lực:** cập nhật cấu hình và các điều kiện hardcode; bổ sung dân khởi đầu/đường tăng dân nếu cần. Test các biên 9/10, 29/30, 89/90, 49/50, 199/200; kiểm tra mất thành viên ngay trước commit và save/load.
4. **Thi công:** trạng thái dở dang, tiến độ bền vững, đường xây thống nhất. Test gián đoạn, đổi thợ, hủy/hoàn tài nguyên, save/load giữa chừng, buff tốc độ làm việc, công trình dở không có hiệu lực.
5. **UI:** bố cục responsive sau khi kích thước nút tốc độ và panel tiến độ đã ổn; kiểm tra screenshot ở ba cỡ viewport và thao tác chuột/bàn phím.

Mỗi bước cần chạy `npm test`, `npm run build`, `npm run assets:check`; chỉ coi nghiệm thu khi các test mới đạt và chơi thử trên trình duyệt không còn chồng panel, chết đói hàng loạt hoặc xây xong tức thì ngoài chế độ quản trị.
