# Quan hệ xã hội — Giai đoạn 4, đợt 4

Ngày: 30-09-2026. Trạng thái: triển khai quyết định trợ chiến; chưa nghiệm thu runtime.

## 1. Evaluator chỉ đọc

SocialDecisionService.evaluateSocialAssistance(world, helper, ally) trả eligible với enemyId/distance hoặc rejected với reason. Không đặt target, ghi điểm/ký ức, sửa ràng buộc/cooldown, tạo component, gọi RNG hay thưởng cứu mạng.

| Điều kiện | Quy tắc |
|---|---|
| Chủ thể | Hai người sống HP hữu hạn >0, khác nhau; helper có HP tối đa hữu hạn >0, vị trí và CombatStats |
| Ràng buộc với ally | Đạo lữ/sư phụ/đệ tử/kết nghĩa active đối ứng và cùng episode, dùng helper hiện có |
| Điểm helper -> ally | affinity>=20, trust>=40; không đòi điểm chiều ngược cùng ngưỡng |
| Sức khỏe helper | HP/max>25%; đúng25% từ chối self_preservation |
| Đang chiến đấu | Helper có target hiện tại thì không đổi mục tiêu để trợ chiến |
| Kẻ địch | Target hiện tại của ally sống, HP hữu hạn>0, có vị trí, khác helper và ally |
| Khoảng cách | Helper–ally <=180, vị trí hữu hạn |
| Xung đột | Kẻ địch không có ràng buộc active đặc biệt với helper, gồm huyết thống |

Reason codes: participant_unavailable, no_active_bond, insufficient_affinity, insufficient_trust, self_preservation, already_engaged, no_live_enemy, out_of_range, conflicting_bond. Đợt5 có thể dùng cho giải thích UI đúng chiều.

## 2. Nối StrategicGoal

Nhánh cứu viện gọi evaluator; chỉ eligible mới đặt combat.targetEntityId và tăng COMBAT_DEFENSE lên94. Giữ thứ tự tự vệ/bỏ chạy trước cứu viện, hysteresis và chọn goal hiện có.

Một cặp đang mâu thuẫn nhưng chưa đủ30ngày có thể vẫn active; khi điểm helper không đạt sẽ không tự can thiệp. Từ chối không kết thúc bond hoặc reset ngày/history. Helper HP<=25% không được tăng điểm ưu tiên chiến đấu do cứu viện; không tự tạo mục tiêu bỏ chạy khi bản thân chưa bị tấn công. Nhánh bỏ chạy/tự vệ hiện có vẫn xử lý khi đã có combat target.

Đây là điều kiện **bắt đầu can thiệp tự nguyện**. Sau khi đã đặt target, combat đang diễn ra tiếp tục qua đường combat/tự vệ hiện có; không thêm nguồn gốc target hoặc hủy trận đang đánh khi điểm ally thay đổi. Không tuyên bố có cơ chế theo dõi liên tục quan hệ của mọi mục tiêu chiến đấu.

## 3. Reader mục tiêu

StrategicGoal không coi mục tiêu HP0/chết/mất vị trí là mục tiêu chiến đấu hợp lệ; clear target để lập kế hoạch khác. BehaviorTree.executeAttack kết thúc bước khi HP0/chết/mất dữ liệu, chỉ clear combat target nếu vẫn trỏ đúng target của bước cũ. Không vô tình xóa mục tiêu mới.

AIPlanner vẫn tạo bước chiến đấu từ combat target/thần dụ như hiện có. Không đưa evaluator trợ chiến vào mọi ATTACK_TARGET vì sẽ làm lệch tự vệ và thần dụ.

## 4. Tình huống phân biệt

- Ally đủ điểm/trust và helper khỏe: có thể cứu viện nếu target/range hợp lệ.
- Ally active nhưng helper trust<40: không cứu viện, ràng buộc vẫn giữ.
- Helper đang bị tấn công: giữ mục tiêu tự vệ, không đổi sang kẻ địch của ally.
- Ally đang đánh đạo lữ/thầy/trò/kết nghĩa/người thân active của helper: không can thiệp tự nguyện.
- Thần dụ tấn công: vẫn qua đường OBEY_DECREE, không bị evaluator này từ chối. Nếu thực sự đánh người có bond, phản bội vẫn xử lý theo CombatSystem giai đoạn3.
- Trợ chiến không tự là cứu mạng; chỉ đòn kết liễu với evidence hợp lệ mới thưởng theo RescueEvidenceService.
- Không đổi sát thương, phạm vi cứu mạng, parentIds, hệ chôn cất hoặc cooldown.

## 5. Tệp và xác nhận

| Tệp | Thay đổi |
|---|---|
| src/modules/social/SocialDecisionService.ts | Evaluator và reason codes trợ chiến |
| src/modules/ai/brain/goals/StrategicGoal.ts | Nối cổng trợ chiến và loại target HP0/mất vị trí |
| src/modules/ai/brain/behavior/BehaviorTree.ts | Kết thúc bước/clear đúng target không khả dụng |

Build production thành công sau sửa cuối, diff check tệp nguồn sửa thành công. Không thêm/chạy test; chưa kiểm tra gameplay/browser hoặc save roundtrip. Cảnh báo chunk>500kB vẫn còn. Ngưỡng là cấu hình khởi điểm, chưa cân bằng thực nghiệm.

## 6. Đợt tiếp theo

Đợt5 hiển thị khả năng giao tiếp và lý do hỗ trợ hai hướng trong Inspector, dùng reader/evaluator chỉ đọc; cập nhật báo cáo toàn diện, ghi phần kiểm chứng chưa chạy riêng với trạng thái triển khai.
