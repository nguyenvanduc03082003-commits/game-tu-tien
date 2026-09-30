# Kiểm tra lại bản sửa gameplay (27-09-2026)

## Trạng thái sau khi sửa

Hai lỗi P1/P2 nêu trong báo cáo này đã được sửa. `SaveManager` từ chối công trường sai trước commit; `CommunityTaskBoard` khôi phục Tàng Kinh Các thành task xây dựng riêng và hoàn tất qua `FactionFactory.completeBuilding()`. Hai ca hồi quy mới đã đạt, cùng toàn bộ `npm test` và `npm run build`.

## Kết luận tại thời điểm kiểm tra ban đầu

Các lỗi P1/P2 nêu trong `POST_SMALL_MODEL_IMPLEMENTATION_AUDIT.md` đã được sửa ở các luồng chính: công trường không cấp tương tác trước khi hoàn tất, tài nguyên đặt cọc được tiêu thụ một lần, task xây dựng được phục hồi khi nạp, đại điện thủ phủ có task, và nhu cầu sinh học dùng đơn vị ngày. Tuy nhiên **chưa nên coi bản sửa là hoàn toàn ổn** vì còn hai lỗi dưới đây.

## Lỗi còn lại

### P1 — Bản lưu có dữ liệu công trường sai có thể làm hỏng lượt nạp

- `SaveManager.validateSaveData()` kiểm tra ID, buff và dữ liệu động vật nhưng không kiểm tra `components.constructionSite` (`src/modules/save/SaveManager.ts`, khoảng dòng 885–927).
- Khi dựng tạm, `assignedWorkerIds`, `requiredWorkTicks`, `completedWorkTicks`, `reservedResources` và `status` được nhận gần như trực tiếp (khoảng dòng 1330–1339). Sau commit, `restoreTasksFromConstructionSites()` gọi `siteComp.assignedWorkerIds.includes(...)` (`src/modules/ai/community/CommunityTaskBoard.ts`, khoảng dòng 200). Nếu `assignedWorkerIds` là object thay vì mảng, lỗi chạy xuất hiện **sau khi thế giới cũ đã bị xóa**. Giá trị âm/NaN ở tiến độ hoặc vật tư cũng có thể phá logic tiến độ và đối soát kho.
- Sửa: xác thực trước commit rằng site chỉ đi cùng BuildingComponent đang xây; `requiredWorkTicks` hữu hạn và > 0; `completedWorkTicks` hữu hạn trong khoảng `[0, requiredWorkTicks]`; `assignedWorkerIds` là mảng ID nguyên dương không trùng; `status` thuộc enum; từng khoản `reservedResources` hữu hạn và không âm; `payerFactionId` hợp lệ. Thêm test nhập JSON sai, xác nhận `deserializeWorld()` từ chối và thế giới đang chơi vẫn nguyên vẹn.

### P2 — Tàng Kinh Các đang xây sẽ bị phục hồi thành task sửa chữa

- Bảng ánh xạ `BUILDING_TYPE_TO_TASK_CONFIG` gán `scripture_pavilion` thành `repair_structure` (`src/modules/ai/community/CommunityTaskBoard.ts`, dòng 102). Khi nạp, `restoreTasksFromConstructionSites()` tạo task loại này. Nhánh hoàn thành `repair_structure` chỉ hồi độ bền (`CommunityTaskBoard.ts`, khoảng dòng 1175), không gọi `FactionFactory.completeBuilding()`, nên công trường có thể mắc kẹt mãi.
- Hiện chưa thấy luồng AI tự khởi công Tàng Kinh Các; lỗi tác động đến công trường loại này nếu được tạo qua API hoặc thêm luồng xây trong tương lai. Sửa bằng task xây riêng cho Tàng Kinh Các, ánh xạ hai chiều và kiểm thử save/load rồi hoàn tất.

## Xác minh đã chạy

- `npm test`: đạt, gồm 5 ca `construction-audit`, 6 ca `construction-pipeline`, 3 ca `faction-pacing`, 6 ca `responsive-hud` và các suite khác.
- `npm run build`: đạt; bundle chính 1,074.22 kB vẫn có cảnh báo dung lượng.
- `npm run assets:check`: đạt.
- Chưa kiểm tra giao diện bằng thao tác trực tiếp trên trình duyệt trong lượt kiểm tra này; các test HUD chỉ kiểm tra cấu trúc và kích thước tính toán.

## Lưu ý phạm vi

Kho làm việc có nhiều thay đổi chưa commit từ trước khi kiểm tra. Lượt kiểm tra này chỉ thêm báo cáo, không sửa mã nguồn game.
