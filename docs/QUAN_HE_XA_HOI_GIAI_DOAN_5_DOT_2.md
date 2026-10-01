# Quan hệ xã hội — Giai đoạn 5, đợt 2

Cập nhật: 01-10-2026. Trạng thái: đã triển khai mã nguồn trong phạm vi dưới đây.

## Mục tiêu và thay đổi

- Theo dõi mặc định tắt, gắn theo ECSWorld bằng WeakMap; giới hạn 128 khóa bộ đếm và 200 mẫu gần nhất, không lưu vào save và không tiêu RNG.
- Phân biệt đề nghị ràng buộc, commit hình thành, thất bại ngẫu nhiên, giao tiếp attempted/completed/skipped, outcome từng phía, kết thúc, tang chế, trợ chiến eligible/chosen/rejected/cancelled và cứu mạng.
- Reader lập nhóm đối chiếu đạo lữ/kết nghĩa bằng isActiveBondBetween; nhãn ràng buộc đã kết thúc không đủ làm bằng chứng hoạt động.
- Reset theo dõi khi load hoặc tạo thế giới; bật lại không xóa số liệu cũ trong cùng phiên.
- Chưa có baseline runtime, phân bố thời gian lập thôn hoặc thời gian hình thành quan hệ. Bộ đếm này chưa đo CPU, pathfinding hoặc toàn bộ graph.

## Bản đồ tệp

SocialSimulationTelemetry.ts; SocialConversationService.ts; RelationshipService.ts; RescueEvidenceService.ts; SocialDeathService.ts; FactionSystem.ts; StrategicGoal.ts. Các tên ngắn trong bảng thuộc src/modules tương ứng hoặc src/ui.

## Bằng chứng và giới hạn

- Build tổng hợp cuối giai đoạn: npm run build (TypeScript + Vite); kết quả cuối ghi ở báo cáo tổng kết.
- Rà soát trực tiếp các writer/reader, validator, reset và nhánh hủy kế hoạch.
- Không thêm/chạy test tự động, không browser smoke test, không chạy mô phỏng thu baseline trong đợt này. Build không chứng minh hành vi runtime hay save roundtrip đúng.

## Việc cần nghiệm thu tiếp

Quan sát thực tế ở tốc độ 1x/nhanh/tạm dừng, mục tiêu chết/mất/mất quan hệ, tự vệ sau sát thương, bản lưu cũ/mới và giao diện chi tiết. Chỉ quyết định cân bằng sau khi có số liệu.
