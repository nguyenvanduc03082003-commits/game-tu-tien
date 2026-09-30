# Quan hệ xã hội — Giai đoạn 1, đợt 3

Ngày: 2026-09-30.

## Thay đổi mã nguồn

1. `SocialInteractionSystem.ts`: trò chuyện và cứu mạng dùng `adjustScores` rồi `updateOrdinaryLabel`. Cứu mạng tăng điểm của người nhận; không tự tạo quan hệ kết nghĩa một chiều. Các ngưỡng nhãn thông thường vẫn áp dụng.
2. `BehaviorTree.ts`: hoàn thành giao tiếp cập nhật điểm riêng từng phía, không dùng nhãn của một phía để khởi tạo phía còn lại.
3. `FactionSystem.ts`: giao lưu trong cụm dân cư cập nhật điểm và xét ngưỡng quen biết. Với +8 điểm lần đầu, quan hệ bắt đầu là người lạ; chuyển sơ giao khi tích lũy đủ 10.
4. `SocialComponents.ts`: setter cũ đánh dấu deprecated, chỉ giữ tương thích; không còn caller trong `src`. Constructor sao chép bản ghi để trạng thái đang chơi không dùng chung đối tượng với dữ liệu save.
5. `SocialSaveCodec.ts`: validator riêng cho quan hệ/ký ức. `SaveManager.validateSaveData` gọi trước khi dựng staging world. Khi xuất save, sao chép bản ghi quan hệ/ký ức để snapshot không bị thay đổi theo các tương tác sau đó.

## Quy tắc kiểm tra save

- Component có mặt phải là object và chứa mảng đúng cấu trúc; thiếu toàn bộ component vẫn dùng cơ chế tạo mặc định hiện có.
- Quan hệ: ID nguyên dương an toàn, không tự trỏ, không trùng đối tượng; tên chuỗi; loại thuộc 12 loại hỗ trợ; affinity -100..100, trust/respect 0..100; số lần tương tác nguyên không âm; thời gian hữu hạn không âm.
- Ngày/tick mới và ngày ràng buộc được kiểm tra khi có; dữ liệu cũ được phép thiếu các trường tùy chọn này.
- Ký ức: tối đa 40; ID chuỗi không rỗng và không trùng trong một nhân vật; loại hợp lệ; mô tả chuỗi; cảm xúc -100..100; tầm quan trọng nguyên 1..5; timestamp/day/decayTimer hữu hạn không âm; ID/tên đối tượng tùy chọn phải đúng kiểu nếu có.
- Cho phép đối tượng lịch sử đã bị xóa khỏi thế giới. Không yêu cầu đối tượng ký ức còn sống hoặc tồn tại.
- Không tự sửa hay từ chối riêng vì ràng buộc cũ thiếu phía đối ứng. Việc rà soát/sửa đồ thị quan hệ lịch sử cần chính sách riêng; validator hiện bảo vệ cấu trúc và giá trị.
- Dữ liệu sai bị từ chối với ID nhân vật và đường dẫn bản ghi. Không cắt bớt ký ức hay clamp điểm âm thầm khi nạp.

## Mức kiểm tra

- Build TypeScript/Vite và kiểm tra diff được thực hiện.
- Tìm `setRelationship` trong `src`: chỉ còn định nghĩa API tương thích.
- Không thêm/chạy tests; chưa kiểm tra save/load hoặc giao tiếp trực tiếp trong trình duyệt.

## Giới hạn còn lại

- `handleRescueLife` vẫn chưa có caller gameplay; đợt này chỉ sửa đường ghi dữ liệu của hàm.
- Chưa có đồng thuận hai phía, cooldown từng cặp, cơ chế đoạn tuyệt, hoặc dọn quan hệ khi chết.
- Hoàn thành triển khai ba đợt nền tảng không đồng nghĩa hệ thống xã hội đã được xác nhận đầy đủ bằng gameplay.
