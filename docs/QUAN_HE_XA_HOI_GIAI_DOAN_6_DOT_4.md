# Quan hệ xã hội — Giai đoạn 6, đợt 4

Ngày: 01-10-2026. Trạng thái: **đã triển khai theo dõi vòng đời plan và kiểm tra lại mục tiêu giao lưu; chưa chạy đối chứng cơ hội giao lưu**.

## 1. Rà nguồn và quyết định

- StrategicGoal đã có cửa sổ buổi tối theo chronotype, điểm theo recreation, sociability và hysteresis. Không có số liệu G6 mới để chứng minh cần tăng utility hoặc thêm cửa sổ khác. Giữ nguyên các giá trị đó, ưu tiên sinh tồn/chiến đấu/thần dụ và chăm trẻ.
- AIPlanner chọn đối tượng một lần khi lập plan; bước MOVE_TO trước đây chỉ cần mục tiêu có vị trí. Một người chết vẫn còn PositionComponent, vào chiến đấu, vừa giao tiếp với nguồn khác hoặc ra ngoài bán kính tìm có thể vẫn bị theo đuổi tới khi bước chờ thất bại/timeout.
- Bước IDLE_WAIT có socialWith kiểm tra phạm vi 48 trong khi service hội thoại dùng 55. Đây là bất nhất nguồn đã sửa theo cấu hình chung.
- Anti-stuck MOVE_TO đã có timeout 12 giây; giữ nguyên, không đặt timeout mới để làm giả cải thiện nhịp AI.

## 2. Thay đổi hành vi

`SocialDecisionService.evaluateSocialMeetingTarget` đọc snapshot hiện tại và dùng evaluator chung:

- Trong lúc đi tới người gặp: kiểm tra participant, nguy hiểm, cooldown, từ chối theo hảo cảm và bán kính tìm hiện có 200.
- Trong lúc chờ: kiểm tra điều kiện hội thoại hiện tại, khoảng cách 55; bỏ cooldown khỏi kiểm tra duy trì để giữ hành vi nghỉ ngơi bên người quen khi đang cooldown.
- Lúc hết thời lượng chờ vẫn gọi performConversation thật; nếu cooldown còn hoạt động thì ghi skipped, không tạo điểm giả. Plan nghỉ có thể completed mà không có hội thoại completed; metric phân biệt hai việc.
- Khi mục tiêu không còn hợp lệ, bước thất bại qua đường BT hiện có: clear path, giải phóng reservation/task, fail plan và yêu cầu replan theo nhịp/cooldown cũ. Riêng plan SOCIAL_RECREATE xóa tọa độ di chuyển cũ.
- Plan trẻ đi về bên guardian không áp evaluator giao lưu người lớn. Điều kiện sống/khoảng cách trong bước chờ và gate hội thoại thực vẫn hoạt động; không thay ưu tiên chăm trẻ.
- Không sửa chọn partner của các nguồn casual/community, không thay tốc độ đói/khát, không thêm RNG hoặc điều chỉnh score chiến lược trong đợt này.

## 3. Theo dõi vòng đời

Thêm `SocialPlanTelemetry.ts` và hook đúng điểm chuyển trạng thái:

| Result | Thời điểm |
|---|---|
| started | Sau khi AIPlanner gán steps/revision và executing |
| interrupted | Plan đang executing bị AIPlanner thay thế; reason goal_changed hoặc replanned |
| completed | BT hoàn tất bước cuối |
| failed | BT xử lý failure; reason participant/range/unsafe/cooldown/decline hoặc movement_failed/travel_timeout/step_failed |
| conversation_completed | Service cuối thực sự cập nhật hội thoại |
| conversation_skipped | Service cuối từ chối; reason đúng kết quả service |

Purpose của started/completed là conversation, guardian hoặc rest. SOCIAL_RECREATE còn gồm nghỉ và chăm trẻ, không gọi mọi plan thuộc goal này là cuộc trò chuyện.

Sample thêm planRevision, cùng actor/target/tick/day để phân biệt các plan cùng trạng thái. Revision chỉ là metadata sample; không đưa revision hoặc ID vào counter key. Telemetry vẫn tắt mặc định, 128 key/200 sample chung; không có cache plan mới trong save.

Harness tích hợp giữ counter tổng và xuất recentSocialPlanSamples từ cửa sổ 200 sample chung. Mẫu gần nhất có thể bị hội thoại/bond khác đẩy khỏi cửa sổ; không dùng chúng như lịch sử đầy đủ để tính thời gian của mọi plan. Phép đo giây theo goal ở đợt 1 tiếp tục tích lũy mỗi tick cho cư dân sống.

Giới hạn: movement_failed gộp lỗi đường đi/vật cản/budget A* chưa phân biệt từng nguyên nhân. Plan chết hoặc bị thay ngoài AIPlanner/BT chưa có terminal hook riêng; số started không nhất thiết bằng completed+failed+interrupted trong cửa sổ đo. Không đọc snapshot lần nữa chỉ để ghi telemetry; validator mục tiêu đọc snapshot vì quyết định duy trì gameplay.

## 4. Bản đồ tệp

- `src/modules/social/SocialPlanTelemetry.ts` mới: ghi lifecycle, purpose và revision.
- `src/modules/social/SocialSimulationTelemetry.ts`: metadata planRevision tùy chọn trong sample.
- `src/modules/social/SocialDecisionService.ts`: kiểm tra lại target ở lúc đi/chờ.
- `src/modules/ai/brain/planner/AIPlanner.ts`: interrupted/started tại thay và lập kế hoạch.
- `src/modules/ai/brain/behavior/BehaviorTree.ts`: guard mục tiêu, khoảng cách theo config, hook kết quả và clear đích cũ.
- `tests/social-integration-baseline.ts`: đầu ra mẫu plan gần nhất; chưa chạy trong lượt này.

## 5. Kiểm tra và nghiệm thu còn lại

- Build cuối `npm.cmd run build`: đạt, 172 module; còn cảnh báo chunk lớn.
- `git -c core.safecrlf=false diff --check`: đạt.
- Chưa thêm/chạy test, baseline hoặc browser. Không tuyên bố đã giảm plan lỗi hoặc tăng số bạn/ràng buộc.
- Chưa có phân bố goal và plan mới để chốt G6.4.1/G6.4.4. G6.4.3 cửa sổ giao lưu mới giữ ở trạng thái chưa cần thay đổi cho tới có dữ liệu.

Nghiệm thu cần case target chết còn Position, combat giữa đường, cooldown do nguồn khác, target 200/200,001 lúc đi và 55/55,001 lúc chờ, decline, guardian, timeout/budget/path, cùng goal nhưng revision mới, nghỉ completed mà conversation skipped. Đối chiếu tỷ lệ sống/công trình/thời gian goal với cấu hình familiarity đã cố định; giữ hồi quy tự vệ/thần dụ/sinh tồn cấp thiết.

Đợt 5 bổ sung UI giải thích progress tín nhiệm và kiểm tra runtime. Số liệu đối chứng của các đợt 1–4 vẫn cần chạy trước chốt cân bằng/nghiệm thu giai đoạn.
