# Quan hệ xã hội — Giai đoạn 5, đợt 4

Cập nhật: 01-10-2026. Trạng thái: đã triển khai mã nguồn trong phạm vi dưới đây.

## Mục tiêu và thay đổi

- Kiểm tra lại riêng intent social_assistance trong chọn chiến lược, thực thi attack và vòng chiến đấu.
- Dừng nếu mất ràng buộc hoạt động, đổi episode, hảo cảm/tin tưởng thiếu, người giúp nguy cấp, người tham gia/kẻ địch không hợp lệ, vượt phạm vi 180, xung đột ràng buộc với địch hoặc người được giúp đổi mục tiêu.
- Hủy chỉ mục tiêu khớp intent; đánh dấu kế hoạch thất bại và yêu cầu lập lại, tránh bước attack cũ khôi phục trợ chiến vừa dừng.
- Khi thực sự nhận sát thương và còn sống, nhân vật có social component chuyển sang self_defense và yêu cầu lập lại kế hoạch nếu cần. Nguồn god_decree được ưu tiên; động vật giữ cơ chế AI sẵn có.
- Điều kiện duy trì bỏ kiểm tra “đã có mục tiêu” vì trợ chiến đang chạy đã có target. Không áp điều kiện xã hội lên autonomous/self_defense/god_decree.
- Giữ bán kính 180 và HP >25% như cấu hình hiện tại; không thêm bán kính truy đuổi riêng.
- Không chỉnh điểm, cooldown, top12 hoặc ngân sách lập kế hoạch 24/tick do chưa có baseline. Phần cân bằng thực nghiệm còn chờ số liệu.

## Bản đồ tệp

CombatIntentService.ts; SocialDecisionService.ts; StrategicGoal.ts; BehaviorTree.ts; CombatSystem.ts. Các tên ngắn trong bảng thuộc src/modules tương ứng hoặc src/ui.

## Bằng chứng và giới hạn

- Build tổng hợp cuối giai đoạn: npm run build (TypeScript + Vite); kết quả cuối ghi ở báo cáo tổng kết.
- Rà soát trực tiếp các writer/reader, validator, reset và nhánh hủy kế hoạch.
- Không thêm/chạy test tự động, không browser smoke test, không chạy mô phỏng thu baseline trong đợt này. Build không chứng minh hành vi runtime hay save roundtrip đúng.

## Việc cần nghiệm thu tiếp

Quan sát thực tế ở tốc độ 1x/nhanh/tạm dừng, mục tiêu chết/mất/mất quan hệ, tự vệ sau sát thương, bản lưu cũ/mới và giao diện chi tiết. Chỉ quyết định cân bằng sau khi có số liệu.
