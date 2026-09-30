# Quan hệ xã hội — Giai đoạn 1, đợt 2

Ngày thực hiện: 2026-09-30.

## 1. Phạm vi đã triển khai

### Chữa thương xét cả hai hướng

- Mỗi cặp xét A giúp B và B giúp A, không phụ thuộc người có ID nhỏ hơn.
- Người cho cần Hồi Xuân Đan và hảo cảm với người nhận ít nhất 20; người nhận cần HP tối đa dương và HP hiện tại dưới 45%.
- Nếu cả hai hướng hợp lệ, chọn người nhận có tỷ lệ HP thấp hơn; hòa thì dùng ID người nhận để chọn ổn định.
- Mỗi lượt gặp chỉ dùng tối đa một đan. Chỉ hồi tối đa 60 HP và ghi điểm/ký ức khi lấy đan khỏi túi thành công.
- Người giúp ghi ký ức `helped`; người nhận ghi `saved_life`. Cập nhật nhãn quan hệ thông thường sau khi tăng điểm.

### Xác định đúng thầy và trò

- Xét cả hai hướng: thầy có stageIndex >= 1, trò có stageIndex = 0.
- Giữ điều kiện hảo cảm từ thầy tới trò >= 45 và xác suất 15% mỗi lượt xét.
- Ghi tên, ký ức và lời thoại theo vai trò thực tế.
- Chỉ điểm công pháp yêu cầu hai bản ghi sư đồ tương ứng. Bản ghi sư đồ một chiều chưa hợp lệ không được dùng để chỉ điểm.

### Xử lý kết quả tạo ràng buộc

- Đạo lữ xét người đề xuất ở cả hai hướng, chọn phía có hảo cảm cao hơn. Giữ ngưỡng 75, tuổi tối thiểu 18, kiểm tra đạo lữ hiện có và xác suất 25%.
- Chỉ ghi sự kiện và kết thúc lượt khi dịch vụ trả về `created`.
- Khi bị từ chối hoặc ràng buộc đã tồn tại, tiếp tục xét những tương tác sau.
- Đây vẫn là điều kiện hảo cảm của người đề xuất; chưa bổ sung cơ chế đồng thuận hai phía.

### Thời gian mô phỏng

- CombatSystem truyền ngày mô phỏng hiện tại khi ghi nhận tấn công.
- Giá trị ngày mặc định của các hàm ghi tấn công, cứu mạng và thêm ký ức lấy từ TimeManager.
- Bản ghi quan hệ thêm `lastInteractionDay` và `lastInteractionTick`. Các trường là tùy chọn để dữ liệu cũ có thể thiếu chúng.
- `lastInteractionTime` vẫn giữ dấu thời gian máy tính phục vụ tương thích. Hai trường mới được lưu cùng bản ghi quan hệ.

### Xung đột và ràng buộc được bảo vệ

- `recordHostility` giảm điểm và chuyển quan hệ thông thường thành `enemy` khi ghi nhận tấn công hoặc chứng kiến tấn công.
- Với đạo lữ, sư đồ và cha mẹ/con, giảm điểm nhưng giữ loại ràng buộc. Quy tắc chia tay, trục xuất hoặc đoạn tuyệt chưa thuộc đợt này.
- Chạm mặt xét thù địch từ cả hai phía và chọn người có hảo cảm thấp hơn để phát lời thoại.
- Nhân vật chứng kiến đã chết không nhận thêm phản ứng xã hội.

## 2. Tệp mã nguồn

- `src/modules/social/SocialInteractionSystem.ts`: chọn vai trò, chữa thương, bái sư, phản ứng thù địch và ngày ký ức.
- `src/modules/social/RelationshipService.ts`: API ghi nhận thù địch, bảo vệ loại ràng buộc.
- `src/modules/social/SocialComponents.ts`: ngày/tick tương tác và ngày mặc định của ký ức.
- `src/modules/combat/CombatSystem.ts`: truyền ngày mô phỏng vào sự kiện tấn công.

## 3. Mức kiểm tra đã thực hiện

- `npm.cmd run build`: thành công, TypeScript và Vite hoàn tất. Còn cảnh báo kích thước bundle lớn hơn 500 kB.
- `git diff --check`: thành công; Git có cảnh báo chuyển đổi LF/CRLF ở các tệp trong workspace.
- Chưa chạy bộ kiểm thử tự động, chưa kiểm tra gameplay trên trình duyệt. Build không chứng minh đầy đủ hành vi trong mô phỏng.

## 4. Công việc tiếp theo

- Đợt 3: chuyển các chỗ còn dùng setter tương thích sang API điểm/ràng buộc đúng mục đích; kiểm tra dữ liệu quan hệ và ký ức khi nạp save.
- Các giai đoạn sau: đồng thuận hai phía, cooldown, quan hệ kết thúc khi chết và quy tắc chấm dứt ràng buộc.
