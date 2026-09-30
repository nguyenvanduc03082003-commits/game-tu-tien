# Kiểm tra sau khi triển khai kế hoạch nhịp game và xây dựng

Ngày kiểm tra: 2026-09-27. Phạm vi: so mã hiện tại với `SMALL_MODEL_GAMEPLAY_FIX_GUIDE.md`, chạy `npm test`, `npm run build`, `npm run assets:check`, rà các đường chạy lưu/nạp và thi công. Chưa kiểm tra trực quan game đang mở vì công cụ xem giao diện không khởi tạo được trong phiên này. Không sửa logic dự án trong lượt kiểm tra.

## Kết quả chung

- Cả ba lệnh `npm test`, `npm run build`, `npm run assets:check` đều trả mã 0. Build vẫn cảnh báo bundle chính khoảng 1.07 MB.
- Tốc độ mới `0/0.5/1/2/3/5`, ngày 100 tick, di trú đồng hồ save cũ, ngưỡng dân số 10/30/90 và 50/200, 12 cư dân khởi đầu, `constructionDays` và HUD responsive đã xuất hiện trong mã. Các test mới xác nhận phần lớn cấu hình và một số đường xử lý.
- **Chưa nghiệm thu xây dựng:** có các lỗi luồng chạy và tài nguyên dưới đây dù bộ test xanh.

## [P1] Công trường sau nạp có thể không bao giờ hoàn thành

`SaveManager` lưu `ConstructionSiteComponent` nhưng không lưu hoặc khôi phục `CommunityTaskBoard.tasks`. Khi nạp, `Engine.resetWorldState()` gọi `CommunityTaskBoard.clear()` (`src/core/Engine.ts:699–733`), sau đó chỉ khôi phục component công trường (`src/modules/save/SaveManager.ts:1330–1341`). `CommunityTaskBoard.update()` thấy `isUnderConstruction` thì không tạo task xây mới (`src/modules/ai/community/CommunityTaskBoard.ts:235–320`, `396–464`). AI cũ có thể còn `communityTaskId` trong planner nhưng board không tìm được task để `completeTask()`. `MortalAISystem` có nhánh tiếp tục công trường nhưng không được đăng ký trong `Engine.initSystems()` (`src/core/Engine.ts:236–264`).

**Hậu quả:** công trường từ save có thể tồn tại vĩnh viễn; vật tư đã giữ không giải phóng; nhà/ruộng/đại điện không bao giờ có công năng. Test hiện tại chỉ kiểm tra số tick tiến độ được nạp lại, chưa chạy AI tiếp tục đến hoàn thành.

**Cách sửa:** lưu/khôi phục task board cùng assignment, hoặc xây lại task từ mỗi công trường trong một bước phục hồi sau nạp; remap `communityTaskId` trong AI planner và `FoundingIntentComponent` nếu ID đổi. Test phải save giữa chừng, nạp sang engine mới, chạy AI đến hoàn thành và kiểm tra công trình hoạt động đúng một lần.

## [P1] Đại điện thủ phủ được khởi công nhưng không có người/task thi công

`FactionSystem` tạo đại điện thủ phủ bằng `spawnBuilding(..., { underConstruction: true })` (`src/modules/factions/FactionSystem.ts:961–987`) mà không tạo task trong `CommunityTaskBoard`. `MortalAISystem` có thể tìm công trường nhưng không được chạy trong Engine. Vì `hasHallOrSite` đã đúng và `isUnderConstruction` bị loại khỏi điều kiện thăng cấp, vương quốc có thể mắc kẹt ở giai đoạn trước đại điện.

**Cách sửa:** tạo task thi công cho công trường này theo cùng service với các công trình khác; kiểm tra sau nạp vẫn có task. Test khởi công đại điện từ đường `FactionSystem`, cho thợ làm và xác nhận có thể thăng cấp khi các điều kiện còn lại đạt.

## [P1] Hoàn tất một công trình có thể xóa nhầm khoản giữ của công trình khác

`CommunityTaskBoard.completeTask()` gọi `consumeReservedResources()` (`src/modules/ai/community/CommunityTaskBoard.ts:799–802`), rồi các nhánh xây gọi `FactionFactory.completeBuilding()` (`...:1016–1059`). `completeBuilding()` lại gọi `consumeReservedResources()` cho cùng site (`src/modules/factions/FactionFactory.ts:539–548`). Hàm này không trừ kho lần hai, nhưng trừ **bộ đếm `reservedResources` chung** lần hai. Nếu hai công trình cùng giữ vật tư, hoàn tất A có thể làm khoản giữ của B biến mất; hủy B sau đó không được hoàn vật tư đã trừ khỏi kho.

**Cách sửa:** để một nơi duy nhất tiêu thụ khoản giữ của công trường; nhánh task không được gọi thêm khi `ConstructionSiteComponent` sở hữu khoản đó. Thêm test hai site A/B cùng giữ gỗ, hoàn tất A rồi hủy B: kho cuối phải bằng kho đầu trừ đúng chi phí A, `reservedResources` phải về 0. `completeBuilding()` cũng nên trả ngay nếu công trình đã hoàn thành để không cộng sức chứa nhà lần hai.

## [P2] Công trường vẫn được AI xem như nhà, ruộng hoặc giếng đã dùng được

`FactionFactory.spawnBuilding()` đăng ký mọi `BuildingComponent` với `SmartObjectManager` ngay cả khi `isUnderConstruction` (`src/modules/factions/FactionFactory.ts:480`). `SmartObjectManager.registerBuilding()` cấp các khả năng `sleep_rest`, `farm_work`, `drink_water`, `cook_meal` theo loại công trình mà không kiểm tra trạng thái xây (`src/modules/ai/smartobjects/SmartObjectManager.ts:70–115`). `syncFromWorld()` cũng đăng ký lại sau nạp (`...:208–220`). Nhánh `MortalAISystem.findNearestBuilding()` cũng không lọc công trường, dù hiện hệ này không được chạy trong Engine.

**Cách sửa:** công trường không đăng ký smart affordance cho đến khi hoàn thành; khi hoàn thành mới đăng ký, khi hủy gỡ khỏi manager. Thêm test AI không thể đặt chỗ ngủ/ăn/uống/cày ở công trường, kể cả sau save/load.

## [P2] Nhịp sinh học người chưa được cân lại theo ngày game mới

Động vật đã dùng delta ngày mới, nhưng `NeedsSystem` vẫn giảm no và khát theo `dt` giây mô phỏng (`src/modules/ai/NeedsSystem.ts:79–95`); sinh sản người vẫn có `cooldownSeconds = 360` (`src/modules/beings/FamilyComponent.ts`, `ReproductionSystem.ts`). Sau khi ngày dài gấp 5, cùng một ngày game người mất no/khát nhiều gấp 5 so với trước; cooldown sinh sản tính theo ngày lại ngắn còn 1/5. Đây là lệch cân bằng, chưa được test theo cùng số ngày ở các tốc độ.

**Cách sửa:** xác định rõ đơn vị của no/khát/cooldown, dùng delta ngày cho nhu cầu sinh học hoặc chỉnh hệ số tương ứng; giữ chuyển động và hành vi ngắn theo giây mô phỏng. Test cùng 10 ngày game ở 0.5x/1x/5x phải cho kết quả sinh học tương đương.

## Phần cần xác minh thủ công

HUD mới dùng container chung và media query, nhưng test responsive hiện kiểm tra cấu trúc/bounds mô phỏng. Cần chụp game thực ở 1366×768, 1024×768 và 768×600; thử chọn thực thể, mở toolbar/nhật ký/minimap, đổi tốc độ và mở pause. Công cụ “Khai Sơn Lập Phái” và đặt công trình trong `Engine.ts:486–541` vẫn tạo tức thì; nếu đây là quyền Thượng Đế, UI cần ghi rõ “tạo tức thì” để tránh hiểu là đường xây thường.

## Thứ tự xử lý đề xuất

1. Khôi phục/giao lại task công trường sau nạp và tạo task cho đại điện thủ phủ.
2. Bỏ tiêu thụ khoản giữ lặp, làm `completeBuilding()` idempotent và thêm test hai công trường.
3. Khóa affordance của công trường chưa hoàn thành.
4. Cân lại nhu cầu/sinh sản người; kiểm tra trình duyệt và bố cục HUD.

Sau từng mục chạy test liên quan, `npm test`, `npm run build`, `npm run assets:check`. Chỉ nghiệm thu khi có test mô phỏng hoàn tất xây dựng **sau nạp**, nhiều công trường cùng đặt cọc và thao tác UI thật.
