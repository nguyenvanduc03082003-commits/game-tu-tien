# Quan hệ xã hội — Giai đoạn 3, đợt 3

Ngày: 30-09-2026. Trạng thái: đã triển khai; chưa kiểm thử tự động/gameplay.

## 1. Phản bội trực tiếp

CombatSystem gọi handleBondBetrayal sau khi xác định đòn đánh trúng và sát thương cuối, trước khi giảm HP. Sát thương hữu hiệu phải hữu hạn và lớn hơn 0; hai nhân vật phải sống và có ràng buộc đối ứng đang hoạt động. Đòn kết liễu vẫn ghi nguyên nhân betrayal trước khi nạn nhân chết. Né tránh/không có sát thương không kích hoạt.

Áp dụng đạo lữ, sư phụ–đệ tử, kết nghĩa. Không đoạn tuyệt phụ mẫu–hài nhi; không thay sát thương, công thức chiến đấu hoặc tự thêm trả thù.

## 2. Mâu thuẫn kéo dài

- Quét cùng nhịp SocialInteractionSystem, khoảng 1,8 giây mô phỏng; không yêu cầu hai nhân vật ở gần nhau hoặc có MemoryComponent.
- Xét từng cặp một lần bằng ID nhỏ hơn. Ràng buộc phải hợp lệ hai phía và người tham gia còn sống.
- Mỗi phía có mốc riêng: affinity <= -50 và trust <= 20 bắt đầu conflictSinceDay.
- Một phía giữ đủ cả hai ngưỡng liên tục 30 ngày thì kết thúc cả cặp với estrangement.
- Hồi phục vượt một trong hai ngưỡng xóa mốc của phía đó ngay trong adjustScores, kể cả hồi phục giữa hai lần quét. Không cộng dồn các đoạn mâu thuẫn rời rạc.
- Mốc dùng world.calendarDaysAtTick, được lưu/nạp qua metadata đợt 1. Pause không tự trôi ngày; 30 ngày = 600 giây/10 phút ở 1x với ngày 20 giây.
- Mốc bắt đầu được ghi ở lần quét đầu thấy điều kiện; kết thúc tại lần quét đầu thấy đủ thời gian. Có độ trễ theo nhịp quét, không phải bộ đếm số lần quét.
- Ràng buộc cũ đối ứng hợp lệ thiếu metadata được cấp episodeId bằng bộ đếm lưu; không bịa ngày hình thành. Quan hệ không nhất quán không tự sửa.

## 3. Ký ức và nhật ký

API kết thúc chung ghi bond_ended cho hai phía; đường phản bội combat xác định đúng người bị đánh để người đó nhận betrayed. Importance 4, emotionalValence -60, ngày theo world; nhật ký xã hội ghi lý do. Không thêm sự kiện thưởng/phạt GrowthSystem.

Chỉ ghi khi API thực sự trả ended. Gọi lại already_ended không lặp ký ức/nhật ký hoặc kéo dài khóa. Giữ khóa bondAttempt tối thiểu 30 ngày, bảo toàn khóa dài hơn. Huyết thống và điểm quan hệ vẫn được giữ theo các đợt trước.

## 4. AI và nhân chứng

- AI trợ chiến yêu cầu ràng buộc còn hoạt động, hợp lệ hai phía; người liên quan và mục tiêu chiến đấu phải sống. Không chọn chính mình làm mục tiêu khi đồng minh đang đánh mình.
- AI chôn cất giữ vai trò gia đình; đạo lữ/kết nghĩa chỉ tính vai lịch sử nếu kết thúc do death hoặc là bản ghi cũ chưa có metadata. Người đã chia tay vẫn có thể được chôn như bạn thân nếu affinity >= 60.
- AI giao lưu vẫn được gặp người từng chia tay nếu đủ thiện cảm, nhưng mô tả hiển thị Bằng Hữu thay vì Đạo Lữ/Sư Tôn/Đồ Đệ cho bản ghi ended.
- Nhân chứng combat chỉ dùng ràng buộc đối ứng chưa kết thúc và mã episode khớp; giữ phạm vi vai trò nhân chứng hiện có. Đường này vẫn cho ghi nhận đòn kết liễu trước cờ isDead. Chứng kiến không trực tiếp kết thúc ràng buộc; điểm giảm có thể khởi đầu mâu thuẫn kéo dài theo cùng quy tắc.

## 5. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| src/modules/social/RelationshipService.ts | Hook phản bội, quét mâu thuẫn, ký ức/nhật ký kết thúc |
| src/modules/social/SocialComponents.ts | Hai loại ký ức, badge, xóa mốc khi điểm hồi phục |
| src/modules/social/SocialSaveCodec.ts | Chấp nhận ký ức mới |
| src/modules/social/SocialInteractionSystem.ts | Gọi quét lifecycle, lọc quan hệ nhân chứng |
| src/modules/combat/CombatSystem.ts | Hook phản bội trước giảm HP |
| src/modules/ai/brain/goals/StrategicGoal.ts | Trợ chiến và chôn cất theo lifecycle |
| src/modules/ai/brain/planner/AIPlanner.ts | Cách gọi người từng kết thúc ràng buộc |

## 6. Kiểm tra và phần còn lại

Build production thành công sau chỉnh sửa cuối; cảnh báo chunk lớn hơn 500 KB vẫn còn. Diff check các tệp nguồn đã sửa thành công. Đã đọc các đường combat, điểm quan hệ, AI và save validator. Chưa thêm/chạy test, chưa kiểm tra trình duyệt hoặc save roundtrip; chưa khẳng định hành vi runtime đã được xác nhận.

Đợt 4: cứu mạng có bằng chứng. Đợt 5: giao diện lịch sử/nguyên nhân đầy đủ và tổng kết.
