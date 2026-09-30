# Kiểm tra và khắc phục phần còn lại của kế hoạch 8 bước

Ngày kiểm tra và sửa: 2026-09-27. Phạm vi: đối chiếu mã nguồn hiện tại, chạy `npm test`, `npm run build`, `npm run assets:check`. Cả ba lệnh đều thành công sau khi sửa. Chưa kiểm tra thủ công trên trình duyệt thật. Các thay đổi đang nằm trong working tree, chưa được commit.

## Kết luận

Các lỗi gốc được liệt kê trong báo cáo phần lớn đã có hướng sửa và test hồi quy. Lần rà soát này phát hiện thêm **2 lỗi logic có thể làm sai dữ liệu** và một thiếu sót ở danh mục slot. Cả ba đã được sửa và có test hồi quy mới. Bộ test lưu/nạp hiện có 29 ca; bộ test đan dược có 16 ca.

| Nhóm lỗi trong báo cáo | Kết quả đối chiếu |
| --- | --- |
| Ghi IndexedDB, fallback khi ghi lỗi, xếp hàng lưu cùng slot | Đã sửa ở `SaveStorage.ts` và `SaveManager.ts`; test đạt. Lỗi xóa fallback ở mục 1 đã được xử lý tiếp. |
| `beforeunload`, sự kiện ẩn trang | Đã bỏ lưu bất đồng bộ trong `beforeunload`; `visibilitychange` được chặn lặp. Test đạt. Việc lưu khi trang ẩn vẫn là nỗ lực tốt nhất của trình duyệt, không thể bảo đảm giao dịch hoàn tất nếu trang bị đóng ngay. |
| Kiến tạo thế giới qua Engine | `GodToolbar` gọi `engine.initNewWorld()`; test xóa thực thể/công trình và tính tất định đạt. |
| Dùng đan ở UI, AI, hệ thống tự động; buff và đột phá | Đã dùng `PillUsageService`; các test hiện có đạt. Lỗi mất đan tăng thọ ở mục 2 đã được xử lý tiếp. |
| Xác thực save: speed, ID, tuple bản đồ/Qi | Các điều kiện được bổ sung; test dữ liệu lỗi đạt. |
| Nhật ký sinh/tử | `birth` và `death` đã được phép hiển thị; test đạt. |
| Đơn vị ngày tăng thọ, lưu `statBaseline` | Đã dùng `TimeManager.TICKS_PER_DAY` và lưu/khôi phục điều chỉnh vĩnh viễn; test vòng lưu/nạp đạt. ID điều chỉnh trùng ở mục 2 đã được xử lý tiếp. |

## 1. Xóa slot có thể báo thành công dù bản fallback còn nguyên — đã sửa

**Mức độ: cao.** `SaveStorage.deleteSlot()` nuốt lỗi `localStorage.removeItem()` rồi xóa `memStore` và trả về thành công (`src/modules/save/SaveStorage.ts`, khoảng dòng 336–373). `SaveManager.deleteSlot()` sau đó xóa mục trong danh mục (`src/modules/save/SaveManager.ts`, khoảng dòng 1964–1974). Nếu khóa fallback chưa bị xóa, lần nạp sau vẫn có thể lấy lại slot tưởng đã xóa. Test hiện có chỉ giả lập lỗi xóa ở IndexedDB, chưa giả lập `removeItem()` thất bại.

**Đã sửa:** `deleteSlot()` ném lỗi khi xóa fallback thất bại, giữ cache và danh mục để người dùng có thể thử lại. Test mới giả lập `removeItem(saveKey)` ném lỗi và xác nhận slot không bị báo xóa thành công.

## 2. Viên tăng thọ có thể bị tiêu hao nhưng không cộng thọ sau khi nạp lại — đã sửa

**Mức độ: cao.** ID của điều chỉnh vĩnh viễn được tạo từ `pillSequence` tĩnh (`src/modules/alchemy/PillUsageService.ts`, khoảng dòng 28 và 172–185). Biến này bắt đầu lại từ 0 sau khi tải lại trang, còn `permanentAdjustments` được giữ trong save. Nếu dùng cùng loại đan cho cùng nhân vật ở cùng tick trước và sau lần tải lại, ID có thể trùng. `applyPermanentStatAdjustment()` trả `false` khi ID trùng (`src/modules/traits/DerivedStatsService.ts`, khoảng dòng 304–315; `src/modules/talent/TalentComponents.ts`, khoảng dòng 289–296), nhưng `usePill()` bỏ qua kết quả và vẫn gọi `inv.consumePill()` (`PillUsageService.ts`, khoảng dòng 225).

**Cách tái hiện:** ở tick 40, cho nhân vật hai `duong_tho_dan`; dùng một viên, lưu và tải lại trang, nạp save khi tick vẫn là 40, dùng viên thứ hai. Kỳ vọng thọ tối đa tăng thêm 15 và còn 0 viên; hiện tại có thể còn 0 viên nhưng thọ không tăng lần thứ hai.

**Đã sửa:** trước khi áp dụng, `PillUsageService` bỏ qua mọi ID đã có trong `permanentAdjustments`; nếu áp dụng thất bại, hàm trả lỗi và không trừ đan. Test mới nạp save, đặt lại bộ đếm tĩnh để mô phỏng tải lại module, rồi xác nhận viên thứ hai tăng thêm 15 năm thọ.

## 3. Danh mục slot có thể giữ mục không còn dữ liệu — đã sửa

**Mức độ: trung bình.** `syncIndexFromStorage()` bắt đầu từ toàn bộ `listSlots()` hiện tại rồi chỉ cộng thêm metadata từ IndexedDB và fallback (`src/modules/save/SaveManager.ts`, khoảng dòng 133–171). Nếu index cũ chứa một ID mà cả hai nơi lưu bền vững đều không còn, mục đó không bị loại. Người chơi thấy slot nhưng nạp thất bại.

**Đã sửa:** khi đọc backend thành công, danh mục được dựng từ bản lưu thực tế và cache của slot mồ côi bị loại. Nếu đọc backend lỗi, hàm giữ danh mục cũ để tránh mất dấu bản lưu. Test mới xác nhận cả index và cache đều loại slot mồ côi.

## Lưu ý về báo cáo trước

Báo cáo ghi `Engine.ts` và `CombatComponents.ts` đã sửa, nhưng hai tệp này không có thay đổi trong working tree tại thời điểm kiểm tra. Luồng ẩn trang thực tế ở `src/main.ts`, còn giao dịch IndexedDB ở `src/modules/save/SaveStorage.ts`. Đây là sai lệch mô tả, không tự nó chứng minh lỗi chạy game.

Đã chạy lại `npm test`, `npm run build`, `npm run assets:check`; cả ba đều đạt. Chưa thử lưu/xóa/nạp trong trình duyệt với IndexedDB và localStorage thật. Cảnh báo bundle lớn hơn 500 kB vẫn còn, thuộc tối ưu hiệu năng riêng.
