# Quan hệ xã hội — Giai đoạn 5, đợt 1

Cập nhật: 01-10-2026. Trạng thái: đã triển khai mã nguồn trong phạm vi dưới đây.

## Mục tiêu và thay đổi

- Tách gate kiểm tra người tham gia, thời gian chờ và commit khỏi wrapper giao tiếp, bỏ vòng import giữa conversation và interaction.
- Thêm SocialEventTime lấy ngày/tick từ ECSWorld; các producer điểm, ký ức giao tiếp, ràng buộc, xung đột, cứu mạng và tang chế truyền clock của thế giới.
- Bỏ ghi đè lastInteractionDay/lastInteractionTick sau adjustScores. Giữ fallback API cũ và timestamp máy tính của ký ức để tương thích; timestamp này không dùng tính cooldown.
- Inventory mục tiêu: StrategicGoal, BehaviorTree, CombatSystem, AnimalAISystem, DiplomacySystem; target của projectile, task và animal brain là dữ liệu riêng.

## Bản đồ tệp

SocialInteractionGate.ts; SocialEventTime.ts; SocialInteractionService.ts; SocialComponents.ts; các producer xã hội. Các tên ngắn trong bảng thuộc src/modules tương ứng hoặc src/ui.

## Bằng chứng và giới hạn

- Build tổng hợp cuối giai đoạn: npm run build (TypeScript + Vite); kết quả cuối ghi ở báo cáo tổng kết.
- Rà soát trực tiếp các writer/reader, validator, reset và nhánh hủy kế hoạch.
- Không thêm/chạy test tự động, không browser smoke test, không chạy mô phỏng thu baseline trong đợt này. Build không chứng minh hành vi runtime hay save roundtrip đúng.

## Việc cần nghiệm thu tiếp

Quan sát thực tế ở tốc độ 1x/nhanh/tạm dừng, mục tiêu chết/mất/mất quan hệ, tự vệ sau sát thương, bản lưu cũ/mới và giao diện chi tiết. Chỉ quyết định cân bằng sau khi có số liệu.
