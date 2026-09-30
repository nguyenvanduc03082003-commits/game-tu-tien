# Quan hệ xã hội — Giai đoạn 1, đợt 1

Ngày: 30-09-2026.

## Danh sách đường ghi

| Nơi ghi | Hoạt động | Kiểu thay đổi | Trạng thái đợt 1 |
|---|---|---|---|
| SocialInteractionSystem | Chữa thương | Cộng điểm hai phía, vật phẩm, ký ức | Giữ API tương thích; vai trò hai hướng ở đợt 2 |
| SocialInteractionSystem | Đạo lữ | Ràng buộc hai phía + điểm thưởng | Dùng formCompanionBond; chỉ phát sự kiện khi created |
| SocialInteractionSystem | Bái sư | Ràng buộc đối ứng + điểm thưởng | Dùng formMentorship; chỉ phát sự kiện khi created |
| SocialInteractionSystem | Trò chuyện gần | Cộng điểm hai phía, chuyển nhãn thường | Giữ API tương thích |
| SocialInteractionSystem.handleCombatAttack | Bị đánh/chứng kiến | Cộng điểm âm, ký ức | Giữ API tương thích; chuyển xung đột/ngày ở đợt 2 |
| SocialInteractionSystem.handleRescueLife | Ân cứu mạng | Cộng điểm và ký ức | Chưa có nơi gọi; chưa nối ở đợt 1 |
| BehaviorTree | Hoàn thành giao tiếp chủ động | Cộng điểm hai phía | Giữ API tương thích |
| FactionSystem | Kết giao khi tập hợp cư dân | Cộng điểm hai phía | Giữ API tương thích |
| BeingFactory.createNewborn | Quan hệ cha mẹ–con | Ràng buộc đối ứng | Dùng linkParentAndChild, xác nhận parentIds |
| SaveManager | Khôi phục quan hệ | Dựng component từ dữ liệu lưu | Giữ nguyên schema; kiểm tra sâu ở đợt 3 |

## API dữ liệu

- ensureRelationship: tạo bản ghi trung tính nếu chưa có, không tính một tương tác giả.
- adjustScores: kiểm tra số hữu hạn trước khi ghi, giới hạn điểm và cập nhật số tương tác.
- updateOrdinaryLabel: chuyển nhãn theo quy tắc hiện tại; bảo vệ đạo lữ, sư đồ, huyết thống.
- setRelationship: lớp tương thích cho các đường gọi cũ, chưa chuyển toàn bộ gameplay ở đợt này.

## API ràng buộc

- formCompanionBond: kiểm tra người sống, tuổi 18, hảo cảm phía đề nghị 75, ràng buộc đang có, độc quyền đạo lữ.
- formMentorship: kiểm tra người sống, hảo cảm phía thầy 45, thầy stage >=1, trò stage 0 và ràng buộc đang có.
- linkParentAndChild: kiểm tra người sống, parentIds và ràng buộc đang có.
- Kết quả: created / already_exists / rejected kèm lý do.
- Kiểm tra cả hai phía trước khi thay đổi. Bản ghi đặc biệt một chiều bị từ chối; không tự sửa dữ liệu cũ mơ hồ.
- Ngày hình thành lấy từ ngày mô phỏng. Thời điểm cộng điểm cũ vẫn dùng Date.now, chuẩn hóa ở đợt 2.
- Không thay điều kiện thiết kế của giai đoạn 2 như đồng thuận hai chiều, huyết thống đạo lữ hoặc giới hạn số đồ đệ.

## Phần tiếp theo

Đợt 2: đánh giá vai trò không phụ thuộc ID, hoàn thiện xử lý sự kiện bị từ chối và chuẩn hóa ngày chiến đấu.

Đợt 3: chuyển toàn bộ đường ghi sang service phù hợp và kiểm tra lưu/tải ràng buộc.

Đợt này kiểm tra build và diff; chưa chạy bộ test hoặc kiểm chứng giao diện/sinh sản thực tế.
