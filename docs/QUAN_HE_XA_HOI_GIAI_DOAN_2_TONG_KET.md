# Tổng kết giai đoạn 2 — Quan hệ xã hội

Ngày: 30-09-2026. Đã hoàn thành triển khai 4 đợt. Mức xác nhận: source review + build + diff check; chưa nghiệm thu đầy đủ bằng tests hoặc trình duyệt.

## 1. Kết quả theo đợt

| Đợt | Kết quả |
|---|---|
| 1 | Cấu hình tập trung; evaluator hai phía; huyết thống 2 thế hệ; đạo lữ độc quyền; giới hạn sư đồ; API kết nghĩa |
| 2 | Ledger cooldown; cổng giao tiếp chung AI/proximity/cộng đồng; chữa thương/chỉ điểm; save codec và reset |
| 3 | Khóa RNG đề nghị; kết nghĩa trong cuộc gặp; AI chọn người theo cooldown; hạn chế phản ứng combat; khoảng cách thực |
| 4 | Inspector hai phía, điều kiện và lý do; thời gian chờ cập nhật; phân biệt lịch sử; tài liệu tổng kết |

## 2. Quy tắc thực dùng

### Đạo lữ

Cả hai sống, tuổi >= 18, hảo cảm >= 75, tin tưởng >= 60, interactionsCount >= 5; không họ gần, không đạo lữ đang hoạt động khác, không xung đột ràng buộc. Xác suất 25% mỗi lần đủ điều kiện và hết khóa đề nghị.

### Sư đồ

Thầy stageIndex >= 1, trò stageIndex = 0 lúc hình thành. Thầy hảo cảm >= 45/tin tưởng >= 50; trò hảo cảm >= 30/tin tưởng >= 50/kính trọng >= 60. Một trò tối đa 1 thầy; một thầy tối đa 3 trò đang hoạt động. Xác suất 15%. Trò đột phá sau đó không bị xóa quan hệ.

### Kết nghĩa

Cả hai sống, hảo cảm >= 70, tin tưởng >= 60, interactionsCount >= 5, không họ gần/xung đột. Xác suất 15%. Tạo hai phía và ngày hình thành, không cộng thưởng/count giả. Friend không tự đổi thành sworn_brother.

### Cooldown

| Kênh | Ngày | Tương đương 1x |
|---|---:|---:|
| Giao tiếp tăng điểm | 1 | 20 giây |
| Chữa thương | 3 | 60 giây |
| Chỉ điểm | 10 | 200 giây |
| Đề nghị ràng buộc chung | 30 | 600 giây |
| Điểm bị đánh/chứng kiến | 1 | 20 giây |
| Ký ức chiến đấu | 3 | 60 giây |

RNG đề nghị thất bại vẫn ghi khóa; điều kiện không đạt không tiêu RNG. Khóa cặp không có hướng; combat có hướng. Sát thương không bị hạn chế bởi cooldown xã hội.

## 3. Dữ liệu và giao diện

- Ledger nằm trên component, schemaVersion = 1, chỉ lưu khóa còn hạn, giữ nguyên expiresAtDay qua nạp; save cũ thiếu ledger dùng rỗng.
- Validator từ chối ID/kênh/schema/thời hạn/khóa trùng hoặc owner sai trước commit.
- Dùng clock world, nhịp hiện tại 400 ticks/ngày và 20 ticks/giây; không dùng giờ máy tính cho cooldown.
- Đối tượng lịch sử được giữ; không tính vào độc quyền/sức chứa hoạt động. Ràng buộc một chiều giữa người sống liên quan giới hạn bị từ chối, không tự sửa.
- Inspector có bảng điểm hai phía, ngày hình thành, điều kiện cả hai vai trò sư đồ, lý do từ evaluator, cooldown và trạng thái lịch sử.
- UI đọc thông tin; không thực hiện lần thử, tăng điểm hay khởi tạo tính cách khi xem phần mới.

## 4. Bằng chứng và giới hạn xác nhận

| Hạng mục | Mức xác nhận hiện tại |
|---|---|
| Biên dịch TypeScript/Vite | Thành công qua các đợt |
| Diff check | Không phát hiện lỗi khoảng trắng trong tệp liên quan |
| Đường ghi API/cooldown | Đã đọc mã nguồn và nối các caller được liệt kê |
| Thứ tự đòn chí mạng | Đã đọc trừ HP -> social hook -> isDead |
| Bất biến evaluator/renderer mới | Đã đọc nguồn; chưa chạy kiểm chứng trạng thái trước/sau |
| Biên ngưỡng, huyết thống, sức chứa | Chưa chạy test độc lập |
| Cooldown qua pause/tăng tốc/save/load/reset | Chưa kiểm chứng thực nghiệm |
| Giao diện hẹp, scroll/details/focus | Chưa kiểm tra trình duyệt |
| Hiệu năng khi nhiều quan hệ | Chưa đo |

Không gọi toàn bộ giai đoạn đã nghiệm thu dựa trên build. Ma trận nghiệm thu trong kế hoạch còn cần thực hiện khi có yêu cầu kiểm thử/xác minh.

## 5. Các giới hạn còn lại

- Truy vết huyết thống tối đa 2 thế hệ và phụ thuộc dữ liệu tổ tiên còn ghi lại; không có cơ sở gia phả độc lập.
- Một cặp chỉ có một relationType; họ gần không chuyển thành sư đồ/kết nghĩa. Chưa biểu diễn đồng thời gia đình và sư môn.
- Đồng thuận là ngưỡng hai phía, chưa có chuỗi hội thoại đề nghị/chấp nhận.
- interactionsCount vẫn là tổng tương tác thành công hiện có, không phải bộ đếm riêng số cuộc trò chuyện tích cực.
- Kết nghĩa ghi ký ức bằng loại helped hiện có; chưa có MemoryType kết nghĩa riêng.
- Chưa có chia tay, trục xuất/đoạn tuyệt, tang chế mới hoặc sửa tự động ràng buộc lịch sử thiếu phía đối ứng.
- handleRescueLife chưa có caller gameplay; chưa chứng minh cứu mạng thực sự bằng quan hệ giữa mục tiêu, kẻ địch và người giúp.
- Chưa nghiệm thu hồi quy sinh sản/sư đồ/mental support qua gameplay.

## 6. Tài liệu

- QUAN_HE_XA_HOI_GIAI_DOAN_2_KE_HOACH_CHI_TIET.md
- QUAN_HE_XA_HOI_GIAI_DOAN_2_DOT_1.md
- QUAN_HE_XA_HOI_GIAI_DOAN_2_DOT_2.md
- QUAN_HE_XA_HOI_GIAI_DOAN_2_DOT_3.md
- QUAN_HE_XA_HOI_GIAI_DOAN_2_DOT_4.md

Bước tiếp theo: kiểm chứng giai đoạn 2 theo ma trận hoặc xây dựng giai đoạn vòng đời quan hệ, sự kiện cứu mạng và hậu quả xã hội theo yêu cầu người dùng.
