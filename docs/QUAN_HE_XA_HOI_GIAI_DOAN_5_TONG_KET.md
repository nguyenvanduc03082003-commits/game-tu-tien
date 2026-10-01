# Quan hệ xã hội — Tổng kết giai đoạn 5

Cập nhật: 01-10-2026. Đã triển khai lần lượt năm đợt mã nguồn. Chưa nghiệm thu runtime; cân bằng thực nghiệm cần baseline.

## 1. Trạng thái theo đợt

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Gate độc lập, clock ECSWorld, inventory target | Đã triển khai |
| 2 | Telemetry có giới hạn, reader cộng đồng hiểu lifecycle | Đã triển khai; chưa thu baseline |
| 3 | CombatIntent, writer chung, save validation/hydration/reset | Đã triển khai; chưa roundtrip |
| 4 | Kiểm tra trợ chiến đang chạy và tự vệ thực tế | Đã triển khai; thông số giữ nguyên, cân bằng thực nghiệm chưa làm |
| 5 | Inspector chỉ đọc, debug opt-in, báo cáo | Đã triển khai; chưa xem UI trong trình duyệt |

## 2. Hành vi mới đáng chú ý

- Trợ chiến có nguồn riêng và người được giúp, được kiểm tra lại trong vòng AI/chiến đấu. Ràng buộc chấm dứt hoặc đổi episode, người giúp nguy cấp, thiếu tín nhiệm/hảo cảm, địch chết/mất, vượt khoảng cách hoặc người được giúp đổi địch sẽ dừng trợ chiến và yêu cầu kế hoạch mới.
- Tự vệ được ghi sau cú đánh thật. Nhân vật còn sống có dữ liệu xã hội có thể đổi mục tiêu sang người vừa gây sát thương; kế hoạch cũ được hủy khi mục tiêu/nguồn thay đổi. Thần dụ đang chiến đấu được ưu tiên, động vật vẫn do AnimalAI điều khiển.
- Bản lưu mới ghi cả target và intent. Bản lưu cũ thiếu dữ liệu nhận null; không suy đoán nguồn. Metadata sai cấu trúc bị từ chối trước hydrate. Mất đối tượng sau load được xử lý bởi vòng mô phỏng.
- Inspector không tạo tính cách khi đọc nhân vật. Đánh giá trợ chiến trên UI không tự hủy mục tiêu hoặc cộng điểm.
- Theo dõi toàn thế giới mặc định tắt, bật trong tab quan hệ > Công cụ phát triển. Giới hạn 128 khóa/200 mẫu; UI hiển thị 20 bộ đếm/10 mẫu. Reset khi tạo/tải thế giới; không có thống kê trước lúc bật, không lưu cùng save.

## 3. Bản đồ mã nguồn

| Nhóm | Tệp |
|---|---|
| Gate và clock | src/modules/social/SocialInteractionGate.ts, SocialEventTime.ts, SocialInteractionService.ts, SocialComponents.ts |
| Producer và telemetry | src/modules/social/SocialConversationService.ts, RelationshipService.ts, RescueEvidenceService.ts, SocialDeathService.ts, SocialInteractionSystem.ts, SocialSimulationTelemetry.ts |
| Quyết định xã hội | src/modules/social/SocialDecisionService.ts; src/modules/factions/FactionSystem.ts |
| Nguồn chiến đấu | src/modules/combat/CombatComponents.ts, CombatIntentService.ts, CombatSystem.ts |
| Writer/AI | src/modules/ai/brain/goals/StrategicGoal.ts; src/modules/ai/brain/behavior/BehaviorTree.ts; src/modules/animals/AnimalAISystem.ts; src/modules/factions/DiplomacySystem.ts |
| Save/reset | src/modules/save/SaveManager.ts; src/core/Engine.ts |
| Inspector | src/ui/SocialRelationshipInspector.ts; src/ui/InspectorPanel.ts |

Tên ngắn trong cùng ô tiếp tục thuộc thư mục của tên đầy đủ đầu ô. Không sửa forge/trang bị/nghề, chủng tộc spawn hay phạm vi già yếu trong giai đoạn này.

## 4. Thời gian và cân bằng

Một ngày giữ 400 tick, 20 tick/giây: 20 giây ở tốc độ 1x. Cooldown và thời điểm xã hội lấy từ ngày/tick ECSWorld. Tạm dừng không làm ngày mô phỏng trôi; tăng tốc làm cooldown diễn ra nhanh hơn theo thời gian thực.

Giữ cấu hình điểm giao tiếp và cooldown, bán kính trợ chiến 180, HP người giúp >25%, tối đa 12 ứng viên giao tiếp, ngân sách lập kế hoạch hiện tại 24/tick. Chưa có bằng chứng để tăng/giảm các giá trị này. Chưa đo tỷ lệ lập thôn, số nhân vật cô lập, độ trễ lập quan hệ hoặc chi phí CPU. Telemetry hiện có là nền tảng quan sát sự kiện, chưa tự tính toàn bộ các phân bố trong kế hoạch.

## 5. Bằng chứng kỹ thuật

- Build cuối sau toàn bộ sửa mã: npm run build, exit 0; TypeScript + Vite thành công, 169 modules. Vite 5.4.21; JS 1.183,83 kB, gzip 298,30 kB. Cảnh báo chunk lớn hơn 500 kB vẫn còn.
- git -c core.safecrlf=false diff --check: exit 0, không có lỗi whitespace; Git có thông báo chuẩn hóa LF/CRLF.
- Rà soát các đường ghi/xóa target, validator/hydrate, reset telemetry và nhánh planStatus thất bại.
- Không thêm/chạy test tự động; không chạy browser smoke test, save/load roundtrip hoặc phiên mô phỏng lấy baseline.

## 6. Các giới hạn còn lại và tiêu chí nghiệm thu

1. Cần quan sát trợ chiến ở ranh giới khoảng cách/HP/điểm, quan hệ mất/đổi episode, địch chết/mất, đổi địch và tự vệ khi bị đánh. Bán kính duy trì hiện dùng đúng 180; chưa có vùng truy đuổi rộng hơn.
2. Cần nghiệm thu save mới/cũ và dữ liệu lỗi, tải trong lúc trợ chiến, tạo thế giới mới, tạm dừng/tăng tốc, giao diện debug.
3. Bộ đếm đếm lời gọi/commit theo từng category; bond_proposal và bond không phải hai lần hình thành. Eligible và chosen không được cộng thành số trợ chiến thành công. Outcome conversation_side đếm từng phía, conversation đếm cuộc gặp.
4. Giới hạn bộ đếm có thể làm mất khóa mới sau 128 khóa. Mẫu là cửa sổ gần nhất, không phải lịch sử đầy đủ; không được coi là baseline dân số dài hạn.
5. API điểm/ký ức cũ còn fallback thời gian singleton cho caller không truyền clock; producer xã hội đã chuyển dùng world. Timestamp máy tính chỉ phục vụ dữ liệu ký ức, không quyết định cooldown mới.
6. Đã xong triển khai trong phạm vi năm đợt; chưa đủ bằng chứng tuyên bố hoàn tất nghiệm thu và cân bằng toàn hệ xã hội.

## 7. Báo cáo từng đợt

- [Đợt 1](QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_1.md)
- [Đợt 2](QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_2.md)
- [Đợt 3](QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_3.md)
- [Đợt 4](QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_4.md)
- [Đợt 5](QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_5.md)
- [Kế hoạch và cập nhật trạng thái](QUAN_HE_XA_HOI_GIAI_DOAN_5_KE_HOACH_CHI_TIET.md)

## Cập nhật nghiệm thu 01-10-2026

Đã nghiệm thu 17 nhóm xã hội, toàn bộ npm test, build và assets:check; thu 18 lượt baseline có kiểm soát, 3 lượt tích hợp AI và bằng chứng trình duyệt. Đã sửa ba vấn đề được xác nhận trong nghiệm thu. Xem [báo cáo nghiệm thu và số liệu](QUAN_HE_XA_HOI_GIAI_DOAN_5_NGHIEM_THU_2026-10-01.md) để biết kết quả, phạm vi, giới hạn và công việc tiếp theo. Các ghi chú chưa chạy kiểm tra phía trên phản ánh thời điểm viết ban đầu.
