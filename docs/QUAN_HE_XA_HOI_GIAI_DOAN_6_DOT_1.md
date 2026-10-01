# Quan hệ xã hội — Giai đoạn 6, đợt 1

Ngày: 01-10-2026. Trạng thái: đã triển khai nền phép đo và chuẩn bị đầu ra đối chứng; **chưa chạy đối chứng G6 mới**.

## 1. Inventory nguồn giao tiếp

| Caller | Context | Phạm vi/clock/gate | Ghi chú |
|---|---|---|---|
| `src/modules/social/SocialInteractionSystem.ts` | casual hoặc cultivation khi hai phía có công pháp | Quét 1,8 giây mô phỏng, cặp trong 55; cooldown theo world day | Có grid và fallback; loại trùng theo ID |
| `src/modules/social/SocialInteractionService.ts` | casual qua wrapper | performConversation kiểm tra lại snapshot hiện tại | Không tạo commit riêng |
| `src/modules/ai/brain/behavior/BehaviorTree.ts` | casual khi thực hiện kế hoạch | Service cuối kiểm tra participant/distance/unsafe/cooldown | Chọn target không đồng nghĩa đã trò chuyện |
| `src/modules/factions/FactionSystem.ts` | community khi cụm chưa đủ bằng chứng quan hệ | Cụm 180 từ seed; gọi từng cặp, service giới hạn 55 | Cụm chồng nhau có thể xét lại cặp; nguồn cần tối ưu ở đợt 2 |

`SocialConversationService.ts` là commit chung. Cooldown communication dùng `world.calendarDaysAtTick()` qua SocialInteractionGate; điểm và ký ức dùng SocialEventTime. Từ chối không ghi điểm/ký ức/cooldown.

## 2. Grid và nhân vật trong nhà

`src/core/Engine.ts` loại entity có InsideBuildingComponent khỏi spatialItems trước rebuild. Harness tích hợp hiện làm tương tự. Grid vì thế không phải danh sách đầy đủ mọi cư dân có PositionComponent.

Đợt 2 không được thay vòng cặp trong cụm bằng query grid đơn thuần rồi tuyên bố parity. Phải kiểm tra thành viên trong nhà/ngoài grid và bổ sung fallback theo cụm. Không thêm hành vi trò chuyện xuyên tường hay sửa vị trí nhân vật trong đợt này.

## 3. Thay đổi nguồn trong đợt 1

- `src/modules/social/SocialSimulationTelemetry.ts`: thêm `incrementSocialCounter` cho bộ đếm tổng hợp. Tắt mặc định, không tạo sample, không gọi evaluator/RNG; giữ giới hạn 128 key và reset hiện có.
- `src/modules/factions/FactionSystem.ts`: ghi `community_scan:input_pairs` và `community_scan:commit_calls` tại đường hội thoại cũ. Chưa lọc cặp hoặc đổi thứ tự/hành vi.
- `tests/social-integration-baseline.ts`: tích lũy giây mô phỏng theo goal/planner mỗi tick cho cư dân còn sống; giữ snapshot ngày để kiểm tra chéo. Thêm chuyển trạng thái liên quan SOCIAL_RECREATE.
- `tests/social-baseline-output.ts` mới: đầu ra riêng, không ghi đè nếu thiếu --overwrite, metadata Node/time/hash toàn bộ nguồn TypeScript và cấu hình; kiểm tra đường ra trước mô phỏng.
- Hai harness baseline mặc định ghi `QUAN_HE_XA_HOI_G6_CONTROLLED_BEFORE.json` và `QUAN_HE_XA_HOI_G6_INTEGRATION_BEFORE.json`. `tests/run-social.mjs` chuyển tiếp đối số harness.

### Định nghĩa metric

| Metric | Đơn vị và phạm vi |
|---|---|
| community_scan:input_pairs | Tổng cặp từ mỗi cụm cần giao lưu; có thể trùng giữa cụm |
| community_scan:commit_calls | Số lần gọi performConversation của community, chưa phải completed |
| conversation:attempted/completed/skipped | Giữ contract cũ, không đổi định nghĩa |
| residentSimulationSecondsByGoal | Tổng giây mô phỏng của cư dân sống theo trạng thái sau tick; không phải walltime |
| residentSimulationSecondsByPlannerStatus | Tổng giây mô phỏng theo status, mọi goal |
| socialPlanStateTransitions | Chuyển chữ ký goal/status giữa các tick liên quan SOCIAL_RECREATE; không phải số plan ID duy nhất |
| dailyGoalSamples/dailyPlannerSamples | Mẫu ngày, không gọi là tỷ lệ thời gian |

Chưa có số cặp duy nhất/lọc xa/cooldown: sẽ ghi tại bộ sinh cặp ở đợt 2. Chưa có lý do hủy plan cụ thể hoặc số lần replan cùng status; state transition không đo được những trường hợp đó. Chi phí theo system và vòng đời plan có ID cần bổ sung trước kết luận hiệu năng/điều chỉnh AI ở đợt 4.

## 4. Đặc tả đối chiếu trước sửa

Đợt 2 phải so completed, delta hai phía, cooldown, firstFriend/firstBond/firstFaction và snapshot cuối cùng seed với đối chứng. Attempted/skipped được phép giảm đúng những cặp bị prefilter; không dùng giảm counter như chứng cứ tăng gameplay.

Đợt 3 phải so riêng cấu hình trust, case 0→1→2→thưởng, hai chiều khác outcome, cap 60, khoảng nghỉ 10 ngày, context chung và save ở tiến độ 2. Các tham số đó vẫn là đề xuất thử, chưa đưa vào gameplay ở đợt 1.

## 5. Kiểm tra và số liệu

- `npm.cmd run build`: đạt, 169 module; còn cảnh báo chunk lớn. Build kiểm tra nguồn game; không chứng minh harness hay metric runtime đã đúng.
- `git -c core.safecrlf=false diff --check`: đạt.
- Chưa thêm hoặc chạy test hồi quy/mô phỏng mới trong lượt triển khai này. Không tạo JSON G6 giả hoặc sao chép số G5 thành kết quả G6.
- Đối chứng G5 tiếp tục đọc từ `docs/so_lieu/QUAN_HE_XA_HOI_BASELINE_2026-10-01.json` và `QUAN_HE_XA_HOI_INTEGRATION_2026-10-01.json`.

Lệnh khi chạy thu số liệu được yêu cầu:

```powershell
node tests/run-social.mjs tests/social-baseline.ts --output docs/so_lieu/QUAN_HE_XA_HOI_G6_CONTROLLED_BEFORE.json
node tests/run-social.mjs tests/social-integration-baseline.ts --output docs/so_lieu/QUAN_HE_XA_HOI_G6_INTEGRATION_BEFORE.json
```

Chạy tuần tự để số thời gian không bị tác vụ đo khác tranh CPU. Dùng đường ra mới cho từng revision; chỉ dùng --overwrite khi chủ đích thay dữ liệu đó.

## 6. Việc tiếp theo

Nền đo đã sẵn sàng. Trước chốt parity tối ưu, cần chạy baseline G6 mới và kiểm tra các metric. Đợt 2 sẽ bổ sung service cặp cộng đồng, fallback người ngoài grid, thống kê cặp duy nhất/lọc sớm và kiểm tra giữ hành vi.
