# Quan hệ xã hội — Giai đoạn 2, đợt 3

Ngày: 30-09-2026.

## 1. Khóa lần thử tạo ràng buộc

- Đạo lữ, sư đồ, kết nghĩa dùng chung bondAttempt 30 ngày cho mỗi cặp: 600 giây (10 phút) ở 1x với nhịp 20 giây/ngày.
- Thêm attemptCompanionBond, attemptMentorship, attemptSwornBond. Chỉ thử RNG sau đủ điều kiện và hết cooldown.
- RNG thất bại trả not_formed, ghi khóa nhưng không tạo quan hệ, cộng thưởng, thêm ký ức hay nhật ký thành công.
- API formCompanionBond/formMentorship/formSwornBond cũng kiểm tra khóa và ghi khóa khi thành công. Caller trực tiếp không bỏ qua cooldown.
- Đã tồn tại hoặc không đủ điều kiện không thử RNG và không ghi khóa mới.
- Khóa chung khiến một lần thử đạo lữ thất bại không được tiếp tục thử kết nghĩa/sư đồ trong cùng cửa sổ. Những hoạt động khác như chat có thể tiếp tục.
- Quan hệ cha mẹ/con không dùng bondAttempt; sinh con không bị chặn bởi cooldown đề nghị.
- Ngày hình thành và mốc tương tác khi cộng thưởng dùng clock của world.

## 2. Kết nghĩa trong cuộc gặp

- Nối attemptSwornBond sau nhánh đạo lữ/sư đồ và trước chat.
- Dùng điều kiện hai phía của đợt 1, xác suất cấu hình 15% mỗi lần đủ điều kiện và hết khóa.
- Thành công ghi hai bản ghi, ký ức hai phía (loại helped hiện có), nhật ký kết nghĩa và lời thoại hai người, rồi kết thúc lượt.
- Không cộng thêm điểm thưởng hoặc tăng giả số lần tương tác.
- Bị khóa, từ chối, đã tồn tại hoặc RNG thất bại không phát nhật ký thành công; tiếp tục luồng còn lại.
- Chữa thương/chỉ điểm thành công vẫn ưu tiên và kết thúc lượt như trước.

## 3. AI chọn người giao tiếp

- AIPlanner bỏ qua người quen và hàng xóm đang bị khóa communication, đồng thời loại người HP <= 0 hoặc đã chết.
- Khi không có người phù hợp, dùng phương án vui chơi/nghỉ quanh lửa hoặc phương án dự phòng có sẵn.
- Trẻ em vẫn được tìm người chăm sóc dù đang cooldown. Việc vui chơi và hồi recreation không cần được cộng điểm mỗi lần.
- BehaviorTree vẫn kiểm tra cooldown tại thời điểm hoàn thành qua service của đợt 2. Nếu khóa thay đổi trong lúc di chuyển, không được cộng điểm tiếp nhưng hoạt động có thể hoàn thành.
- Không thay đặc điểm/tính cách ngẫu nhiên hoặc tái sinh tính cách trong evaluator.

## 4. Giới hạn phản ứng chiến đấu

| Tác động | Cooldown | Owner/target |
|---|---:|---|
| Điểm do bị tấn công | 1 ngày | Nạn nhân/người đánh |
| Điểm do chứng kiến | 1 ngày | Nhân chứng/người đánh |
| Ký ức chiến đấu | 3 ngày | Người ghi nhớ/người đánh |

- recordHostility dùng cổng cooldown có hướng; đòn lặp trong cửa sổ không giảm tiếp điểm hoặc tăng count.
- Ký ức có kênh riêng với điểm; bị đánh và chứng kiến dùng chung combatMemory của cùng người ghi nhớ/người đánh để tránh nhân đôi.
- Sau 1 ngày có thể giảm điểm tiếp trong khi ký ức vẫn chờ đủ 3 ngày. Đổi người tấn công tạo cặp riêng.
- Giữ giảm điểm -60/-50/-30 cho nạn nhân, -50/-40/-20 cho nhân chứng; không đổi sát thương/giáp/HP trong CombatSystem.
- Nạn nhân có HP vừa xuống 0 được ghi phản ứng của đòn chí mạng: CombatSystem gọi social hook sau trừ HP và trước gán isDead. Người đã isDead hoặc nhân chứng không còn sống không được nhận phản ứng mới.
- Tự tấn công hoặc đối tượng động vật/carcass bị loại khỏi social hook như phạm vi xã hội cư dân.
- Ngày ký ức truyền từ world.calendarDayFloorAtTick, tương thích lịch của world.
- Sự kiện cứu mạng vẫn chưa được nối vào combat; không thuộc đợt này.

## 5. Khoảng cách và lưu/nạp

- Đường SpatialGrid có thêm kiểm tra khoảng cách thực <= 55, giống fallback. Không chỉ dựa vào kết quả queryRadius.
- Các kênh mới sử dụng ledger/schema đã triển khai ở đợt 2; khóa được serialize, hydrate, validate và dọn theo mốc hết hạn qua cùng cơ chế.
- Không đổi schema hoặc sửa quan hệ lịch sử.

## 6. Tệp được sửa

- src/modules/social/RelationshipService.ts: API lần thử, kiểm tra cooldown khi tạo trực tiếp, giới hạn hostility.
- src/modules/social/RelationshipRules.ts: bổ sung reason cooldown_active.
- src/modules/social/SocialInteractionService.ts: helper ghi khóa và cổng phản ứng combat, xử lý đòn chí mạng.
- src/modules/social/SocialInteractionSystem.ts: nối lần thử/kết nghĩa, luồng fallback, ký ức combat, khoảng cách thực.
- src/modules/ai/brain/planner/AIPlanner.ts: chọn người theo cooldown.
- src/modules/combat/CombatSystem.ts: truyền ngày từ clock world vào hook xã hội.

## 7. Mức kiểm tra và phần còn lại

- Build TypeScript/Vite thành công; còn cảnh báo bundle lớn hơn 500 kB.
- Diff check các tệp liên quan không báo lỗi khoảng trắng.
- Đã đọc lại thứ tự trừ HP -> social hook -> đánh dấu chết để giữ phản ứng ở đòn chí mạng.
- Chưa thêm/chạy test tự động, chưa kiểm tra gameplay hoặc round trip save/load. Các quy tắc trên là logic đã triển khai, chưa phải xác nhận thực nghiệm đầy đủ.
- Đợt 4: Inspector hiển thị điều kiện/cooldown/trạng thái lịch sử; tài liệu và nghiệm thu theo phạm vi yêu cầu của người dùng.
