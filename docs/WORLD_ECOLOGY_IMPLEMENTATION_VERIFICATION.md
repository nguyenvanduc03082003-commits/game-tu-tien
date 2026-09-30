# Kiểm tra tiếp nối kế hoạch sinh thái thế giới

Ngày kiểm tra: 28-09-2026. Nguồn: `docs/SMALL_MODEL_WORLD_ECOLOGY_IMPLEMENTATION_PLAN.md`.

## Tình trạng tiếp nhận

Workspace đã có nhiều thay đổi chưa commit khi tiếp nhận. Model trước đã triển khai phần lớn bước 1 và 2. Bài test cây ở bước 2 ban đầu gọi sai API hủy nhiệm vụ và API lưu/nạp; đã sửa test, rồi sửa lỗi thật: AI không nhận đúng việc đốn gỗ, lượng gỗ giữ chỗ có thể sai, và gỗ khai thác phải vào kho đúng một lần. Không hoàn nguyên các thay đổi có sẵn.

## Phần đã triển khai tiếp

| Bước | Kết quả | Kiểm chứng |
| --- | --- | --- |
| 3. Xây dựng | Công trình thường, kể cả lửa trại lập xóm và đại điện lập tông, tạo công trường. Thợ còn sống phải tới nơi và làm đủ tiến độ. Hủy hoàn vật tư; save/load giữ tiến độ. Công cụ “Khai Sơn (Tức thì)” là ngoại lệ có ghi rõ trong UI. | `construction-pipeline`, `construction-audit`, `faction-settlement`, `faction-pacing` |
| 4. Nhà ở | Sức chứa lấy theo định nghĩa từng nhà. Gán nhà kiểm tra cùng khu định cư, còn chỗ và đã xây xong; chết, chuyển đi, phá nhà và nạp save đều hòa giải chỗ ở. AI chỉ được lợi ích ngủ trong nhà khi giữ được chỗ ngủ. | `housing-capacity` |
| 5. Tiến cấp | Công thức khả năng và điều kiện tập trung trong `BreakthroughRules`. Có trần xác suất, điều kiện tuổi cảnh giới theo chủng tộc, chi phí và hồi chiêu sau thất bại. AI, đan dược và UI cùng đọc điều kiện. Save/load bảo toàn trạng thái mới. | `cultivation-balance`, các regression AI/save |
| 6. Rương | Rải thưa theo seed, tránh nước, công trình và điểm khởi đầu. Phiên bản này chỉ chứa 1–2 viên đan có ID hợp lệ. Mở một lần, trong tầm, túi còn chỗ; động vật không thể mở. UI và AI dùng cùng hàm. Save/load xác thực dữ liệu rương. | `treasure-regression` |
| 7. Sinh thái | Đã chạy 10 seed ở mốc 30/180/360 ngày mô phỏng với động vật, cây, tái sinh sản và rương. Bài test phải đặt lại cờ di chuyển và ngân sách tìm đường mỗi tick giống Engine; nếu bỏ qua, động vật đứng yên rồi chết đói giả. Sau khi sửa harness, số động vật còn sống ở ngày 360 là 13–17 trên 18 con ban đầu ở 10 seed. | `ecosystem-integration` |

## Kết quả tự động

- `npm test`: đạt, gồm toàn bộ suite cũ và regression mới.
- `npm run build`: đạt TypeScript và Vite.
- `npm run assets:check`: đạt.
- `git diff --check`: không còn lỗi whitespace.
- Cảnh báo bundle chính trên 500 kB vẫn còn: khoảng 1.10 MB minified, 268 kB gzip. Đây là việc tối ưu tải trang riêng.

## Giới hạn nghiệm thu

- Mô phỏng 10 seed ở bước 7 chạy theo thời gian mô phỏng cố định, không chạy vòng UI ở ba tốc độ thực. `time-pacing-regression` kiểm tra riêng lịch tick ở 0.5×, 1×, 3×, 5× và tạm dừng; chưa có bài tích hợp 360 ngày qua chính vòng render/UI.
- Mô phỏng dài hiện đo động vật, cây và rương trên bản đồ 64×64. Chưa đo đủ ma trận người, kho gỗ/đá/lương thực, công trường và phân bố cảnh giới trong cùng một phiên 360 ngày. Các nhóm đó có test hành vi riêng.
- Probe tiến cấp 300 nhân vật là mô hình xác suất/điều kiện đơn giản, không phản ánh đầy đủ tử vong, AI chiến đấu và toàn bộ kinh tế Qi trong một thế giới đang chơi.
- Chưa kiểm tra trực quan trên trình duyệt trong lượt này. Nên mở thế giới mới và thử bằng mắt: rải cây/động vật/rương, công trường có thợ, nhà đầy chỗ, ngủ, mở rương, save/load giữa lúc xây và quả tái mọc.

Không xem các test đạt là bằng chứng “hoàn thành 100%” của trải nghiệm chơi dài hạn.
