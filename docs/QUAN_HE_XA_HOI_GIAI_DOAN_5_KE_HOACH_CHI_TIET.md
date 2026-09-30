# Quan hệ xã hội — Kế hoạch chi tiết giai đoạn 5

Ngày lập: 30-09-2026. **Trạng thái: đề xuất phạm vi và kế hoạch; chưa sửa gameplay, chưa chạy test trong lượt này.**

## 1. Mục tiêu

Chưa có phạm vi giai đoạn5 được chốt trong tài liệu trước. Đề xuất giai đoạn này hoàn thiện **tính nhất quán, khả năng theo dõi và cân bằng mô phỏng xã hội** sau bốn giai đoạn đã triển khai.

Kết quả mong muốn:

1. Giao tiếp không còn dependency vòng; thời điểm điểm/ký ức/cooldown lấy từ cùng world.
2. Các hoạt động phân biệt attempted/completed/skipped và có số liệu theo dõi, không suy gameplay đúng từ lời thoại hoặc build.
3. AI biết mục tiêu chiến đấu bắt nguồn từ tự vệ, trợ chiến hay thần dụ, để kiểm tra lại trợ chiến mà không hủy nhầm tự vệ.
4. Điều kiện cộng đồng và các reader quan hệ hiểu lifecycle nhất quán.
5. Cân bằng dựa trên thời gian20s/ngày và số liệu, có báo cáo trước/sau từng thay đổi.
6. UI hiển thị quyết định thực tế và phạm vi dữ liệu, tránh hứa khả năng trợ giúp chưa diễn ra.

Không mở gia phả/multiple bonds/gossip/danh vọng/chiến tranh phe/tha thứ tự động hoặc hệ sự kiện hôn lễ mới. Ngẫu nhiên đặc điểm lúc spawn và phạm vi nhân tộc/yêu tộc/ma tộc giữ nguyên. Không dùng giai đoạn này để thay tài sản đồ họa, nghề hoặc trang bị.

## 2. Căn cứ và ranh giới bằng chứng

| Nguồn đã đọc | Quan sát | Công việc dự kiến |
|---|---|---|
| SocialConversationService.ts / SocialInteractionService.ts | Import function qua lại | Tách gate và wrapper, không đổi kết quả giao tiếp |
| SocialComponents.adjustScores | Date.now và TimeManager singleton; nhiều caller ghi đè world day/tick | Chuẩn hóa clock truyền vào API, giữ fallback tương thích có phạm vi |
| SocialDecisionService / StrategicGoal | Trợ chiến chỉ kiểm tra khi bắt đầu, sau đó chỉ giữ combat target | Thêm nguồn target và kiểm tra lại riêng trợ chiến |
| FactionSystem | Điều kiện nhóm có thể dựa nhãn đặc biệt trong khi điểm chưa đạt | Đối chiếu lifecycle để nhãn ended không đủ chứng minh ràng buộc sống |
| AIPlanner / ThreeTierAISystem | Top12/radius200; giới hạn lập kế hoạch hiện tại24/tick | Giữ ngân sách thực tế, đo chi phí trước đổi thuật toán |
| Báo cáo giai đoạn4 | Thưởng cộng đồng giảm, chưa đo tốc độ lập thôn/quan hệ | Thu số liệu trước quyết định tăng giảm điểm |
| CombatSystem | Có chọn mục tiêu qua phe/chủng tộc và nhiều chỗ đặt target | Lập inventory nguồn target; không chỉ sửa nhánh trợ chiến |

Đây là các quan sát nguồn/giới hạn thiết kế, không phải kết quả nghiệm thu runtime. Bốn giai đoạn trước đã có build/diff nhưng chưa có browser/save roundtrip/test xã hội được chạy trong chuỗi triển khai này.

## 3. Quy tắc thiết kế

### 3.1. Gate giao tiếp và clock

- Tách kiểm tra người sống/cooldown và performSocialInteraction thành SocialInteractionGate.ts. SocialConversationService phụ thuộc gate; SocialInteractionService re-export API tương thích và wrapper, không được gate import conversation.
- Không đổi contract completed/skipped hoặc điểm/cooldown chỉ vì refactor.
- Đề xuất SocialEventTime gồm tick và day từ ECSWorld. adjustScores/addMemory nhận time tùy chọn hoặc service chuyên dụng, không tự sửa clock world.
- Inventory đầy đủ caller trước chuyển. API tương thích cũ giữ Date.now timestamp để đọc save cũ nếu cần, nhưng gameplay mới không dùng timestamp giờ máy tính để tính hạn.
- Không chuyển ngày cũ bằng cách chia tick cho400 khi world có calendar offset; dùng calendarDaysAtTick của đúng world.
- Không gọi Math.random để sinh lại tính cách từ reader/UI/load.

### 3.2. Dữ liệu theo dõi mô phỏng

Đề xuất SocialSimulationTelemetry.ts chỉ lưu runtime trong instance gắn world, reset khi world đổi. Mặc định tắt; bật qua công cụ debug, không phát chronicle cho mỗi rejected.

Các bộ đếm: conversation attempts/completed/outcomes/skipped theo reason/context; bond attempts/created/rejected; ends theo reason; rescue resolutions/awarded/rejected; assistance eligible/chosen/rejected/cancelled. Phân biệt eligible với chosen, không cộng cả hai như hai hành động thành công.

Giữ sample tối đa200 bản ghi gần nhất, thống kê tổng bằng counter, không snapshot toàn social graph mỗi tick. Sample chỉ chứa tick/day/entity IDs/context/result/reason và delta thực tế cần thiết. Không gọi evaluator lần nữa chỉ để ghi telemetry, không tiêu RNG, không đổi tốc độ gameplay. Không lưu telemetry vào save.

Các phân bố cần quan sát: số người không giao lưu, thời gian tới friend/bond, warm/neutral/awkward, thất bại do path/replan/cooldown, thời gian lập thôn, tỷ lệ trợ chiến/cứu mạng. Ngưỡng cảnh báo ban đầu là thông tin debug, không tự điều chỉnh điểm game.

### 3.3. Nguồn mục tiêu chiến đấu

Đề xuất metadata tùy chọn trên CombatStatsComponent hoặc component riêng sau inventory:

```ts
// Thiết kế đề xuất, chưa là schema hiện tại.
type CombatIntentSource = 'autonomous' | 'self_defense' | 'social_assistance' | 'god_decree';
interface SocialAssistanceIntent {
  allyId: number;
  enemyId: number;
  startedAtDay: number;
  bondEpisodeId?: string; // legacy không có ngày/mã vẫn phải có quy tắc rõ
}
```

- Metadata phải gắn với target cụ thể; đổi target không giữ nguồn cũ vô tình.
- API set/clearCombatIntent là đường duy nhất cho các nguồn đã inventory; chuyển tuần tự và rà mọi phép gán.
- Save cũ có target nhưng thiếu source: coi unknown/autonomous theo policy, không suy ra tự vệ hoặc trợ chiến từ tên relation.
- Nếu state nguồn ảnh hưởng quyết định sau load thì phải có codec/validation/hydration ngay đợt thêm.
- Đánh trực tiếp vào helper chuyển ưu tiên sang self_defense theo bằng chứng đòn thật. Không xóa tự vệ chỉ vì ally chết hoặc bond kết thúc.
- Thần dụ vẫn giữ quyền ưu tiên hiện có. Metadata không ngăn hook phản bội khi thực sự gây sát thương cho người có bond.

### 3.4. Kiểm tra lại trợ chiến

Chỉ social_assistance bị kiểm tra lại theo ally/episode/enemy; không áp gate trợ chiến cho mọi combat target.

Khi ally chết/mất, bond kết thúc/thay episode, target không còn sống, helperHP<=25%, trust/affinity xuống ngưỡng hoặc xung đột active bond với enemy: hủy intent trợ chiến nếu nó vẫn là nguồn hiện hành. Không ghi thêm ký ức chia tay hoặc giảm điểm vì hủy.

Nếu helper đã bị enemy tấn công thì chuyển tự vệ, giữ quyền bỏ chạy hiện có. Không đổi enemy chỉ vì ally đổi target: hủy/re-evaluate có kiểm soát, không chuyển liên tục mỗi tick. Kiểm tra theo nhịp thinker hiện có hoặc trước thực hiện attack khi cần; không thêm scan N².

Phạm vi180 dùng khi bắt đầu hỗ trợ; khi truy đuổi cần quy tắc riêng. Đề xuất giới hạn duy trì gắn với leash combat hiện có sau đọc nguồn, không tự đặt số mới hoặc teleport.

### 3.5. Reader cộng đồng và cân bằng

- Trong điều kiện nhóm lập thôn, nhãn đạo lữ/kết nghĩa chỉ là bằng chứng khi active hai phía. Huyết thống dùng dữ liệu gia đình hoặc vai phù hợp; lịch sử ended không đủ chứng minh hỗ trợ hiện tại.
- Affinity đủ theo điều kiện nhóm hiện có vẫn là bằng chứng quan hệ thường, kể cả từng chia tay. Không cấm các nhân vật lập thôn chỉ vì có lịch sử ended.
- Không tăng lại +8/+5 cộng đồng. Chỉ điều chỉnh một nhóm thông số mỗi lần sau báo cáo số liệu: delta conversation, tốc độ gặp, ngưỡng nhóm hoặc giới hạn tìm người.
- Mỗi thay đổi cân bằng có cấu hình trước/sau, lý do, metric mong đợi và giới hạn quan sát. Không đặt mục tiêu có đạo lữ trong một số phút cố định khi chưa có quy mô/thời gian mô phỏng chuẩn.

## 4. Năm đợt thực hiện

### Đợt1 — Chuẩn hóa gate, clock và inventory

| ID | Công việc | Tệp | Gate hoàn thành |
|---|---|---|---|
| G5.1.1 | Tách gate khỏi vòng import | SocialInteractionGate.ts mới, SocialInteractionService.ts, SocialConversationService.ts | Dependency một chiều; wrapper vẫn cùng contract |
| G5.1.2 | Clock world cho API điểm/ký ức | SocialComponents.ts, SocialEventTime.ts mới nếu cần | Không ghi singleton rồi ghi đè ở caller mới |
| G5.1.3 | Chuyển đủ producer xã hội | RelationshipService.ts, SocialDeathService.ts, RescueEvidenceService.ts, SocialInteractionSystem.ts | Ngày/tick đúng world, không mất tương thích save |
| G5.1.4 | Inventory target/lifecycle readers | CombatSystem.ts, StrategicGoal.ts, BehaviorTree.ts, FactionSystem.ts | Bảng tất cả nguồn set/clear và reader cần chuyển |
| G5.1.5 | Báo cáo thay đổi | docs/QUAN_HE_XA_HOI_GIAI_DOAN_5_DOT_1.md | Tách refactor và thay đổi hành vi thật |

Không bật intent monitor trước có provenance và codec.

### Đợt2 — Theo dõi kết quả và reader cộng đồng

| ID | Công việc | Tệp | Gate hoàn thành |
|---|---|---|---|
| G5.2.1 | Counter/sample runtime hữu hạn | SocialSimulationTelemetry.ts mới, cấu hình debug | Tắt mặc định, reset theo world, không save |
| G5.2.2 | Hook kết quả thực tế | conversation/bond/death/rescue services | Không gọi evaluator/RNG thêm, không double count |
| G5.2.3 | Thống kê decision/chosen | SocialDecisionService.ts, StrategicGoal.ts | eligible khác chosen; capture reason hiện có |
| G5.2.4 | Sửa bằng chứng quan hệ lập nhóm | FactionSystem.ts, RelationshipRules.ts | Ended label không vượt điều kiện, affinity thường vẫn dùng |
| G5.2.5 | Báo cáo baseline | docs/...DOT_2.md | Có schema metric; chỉ ghi số liệu đã thực sự quan sát |

Nếu chưa chạy mô phỏng, báo baseline là chưa có, không tạo số giả từ công thức.

### Đợt3 — Nguồn target và save

| ID | Công việc | Tệp | Gate hoàn thành |
|---|---|---|---|
| G5.3.1 | Schema intent và API set/clear | CombatComponents.ts, CombatIntentService.ts mới | Source gắn đúng target, không stale provenance |
| G5.3.2 | Chuyển nguồn tự động/tự vệ/thần dụ/hỗ trợ | CombatSystem.ts, StrategicGoal.ts, BehaviorTree.ts, callers inventory | Không còn phép gán bỏ qua ở các nguồn trong phạm vi |
| G5.3.3 | Codec/hydration/old-save policy | SaveManager.ts, codec chiến đấu mới nếu cần | Validate ID/source/day/episode trước commit |
| G5.3.4 | Reset và target mất | Engine.ts, ThreeTierAISystem.ts, intent service | Không giữ intent qua world, clear đúng target |
| G5.3.5 | Báo cáo source precedence | docs/...DOT_3.md | Tự vệ vs thần dụ vs trợ chiến có quy tắc cụ thể |

Không đổi sát thương/AI săn mồi chỉ để chuyển nguồn target; nhánh động vật phải được inventory riêng và giữ hành vi hiện có.

### Đợt4 — Duy trì trợ chiến và cân bằng có căn cứ

| ID | Công việc | Tệp | Gate hoàn thành |
|---|---|---|---|
| G5.4.1 | Evaluator duy trì intent hỗ trợ | SocialDecisionService.ts, CombatIntentService.ts | Kiểm tra ally/episode/enemy/HP/điểm, chỉ đọc |
| G5.4.2 | Hook kiểm tra lại/clear/chuyển tự vệ | StrategicGoal.ts, BehaviorTree.ts, CombatSystem.ts | Không hủy tự vệ hoặc thần dụ; không treo plan |
| G5.4.3 | Telemetry cancellation | Telemetry service | Một lần/thay đổi thật, không log mỗi scan |
| G5.4.4 | Review cân bằng theo baseline | social.config.ts, factions.config.ts chỉ nếu cần | Mỗi thay đổi có metric và lý do; thiếu dữ liệu thì giữ cấu hình |
| G5.4.5 | Báo cáo trước/sau | docs/...DOT_4.md | Không gọi ngưỡng đã cân bằng khi chưa quan sát |

### Đợt5 — UI, tổng kết và phạm vi nghiệm thu

| ID | Công việc | Tệp | Gate hoàn thành |
|---|---|---|---|
| G5.5.1 | Giải thích source/duy trì hỗ trợ | SocialRelationshipInspector.ts, InspectorPanel.ts | Quyết định hiện tại, lịch sử và dự đoán phân biệt |
| G5.5.2 | Debug số liệu có giới hạn | UI debug hiện có hoặc SocialDebugPanel.ts mới | Tắt mặc định, không lộ thuật ngữ kỹ thuật trong flow chơi thường |
| G5.5.3 | Rà readonly/save/reset | Services/UI/SaveManager | Không side effect khi xem/nạp |
| G5.5.4 | Báo cáo toàn diện | docs/QUAN_HE_XA_HOI_GIAI_DOAN_5_TONG_KET.md | Status từng việc, file map, evidence và giới hạn |
| G5.5.5 | Nghiệm thu nếu được yêu cầu | Ma trận mục5 | Báo riêng test/build/browser/save, không thay nhau |

## 5. Ma trận kiểm chứng dự kiến

Chỉ lập kế hoạch; không tạo/chạy test trong lượt này. Khi có yêu cầu kiểm thử, đề xuất social-clock-regression.ts, social-intent-regression.ts, social-telemetry-regression.ts và cases save/faction tích hợp, đăng ký tests/run.mjs.

| Nhóm | Case | Kết quả cần đạt |
|---|---|---|
| Module | Import gate/conversation/compatibility theo nhiều thứ tự | Không dependency vòng/init lỗi |
| Clock | Hai world khác offset, pause/speed/load | Ngày/tick đúng world, không dùng singleton sai |
| Conversation | Hai nguồn cùngtick, skipped, delta hai phía | Một completed/cặp, telemetry không thưởng thêm |
| Telemetry | Tắt/bật, quá200sample, reset | Không đổi RNG/gameplay, bộ nhớ hữu hạn |
| Faction | Ended bond điểm thấp; ended nhưng affinity đủ | Không lách bằng nhãn, vẫn cho quan hệ thường đủ điểm |
| Source | Auto/selfdefense/god/assistance thay target | Source đúng, không metadata cũ bám target mới |
| Monitor | Ally chết, episode thay, trust giảm, helperHP25% | Hủy đúng trợ chiến, không sửa bond |
| Self-defense | Helper bị địch đánh trước khi ally chết | Giữ tự vệ, không clear nhầm |
| Enemy | HP0/mất, ally đổi target, ràng buộc enemy | Plan không treo, không target nhảy vô hạn |
| Save | Trước/sau intent, malformed source/ID/day | Từ chối trước staging, old-save policy rõ |
| Động vật | Săn mồi/target brain/carcass | Không hồi quy vì chuyển provenance |
| UI | Mở lặp, refresh, panel hẹp, người đã xóa | Readonly, tên đúng, không tạo component |
| Cân bằng | 1x/5x theo cùng ngày mô phỏng | So sánh metric theo ngày, không theo walltime |

Kịch bản quan sát khi được yêu cầu: nhóm cư dân nhiều sociability, theo dõi quen biết/lập thôn, hai ally/enemy có xung đột, ally chết/đổi episode giữa trận, save/load tại thời điểm intent tồn tại. Ghi seed/cấu hình/quy mô/ngày mô phỏng/revision để kết quả có thể đối chiếu.

## 6. Quy trình thực hiện và tiêu chí kết thúc

- Đọc inventory/caller trước sửa; giữ thay đổi đang có trong working tree, không reset ngoài phạm vi.
- Triển khai từng đợt tuần tự, codec cùng đợt state mới; build/diff check khi sửa mã.
- Không thêm/chạy test trừ khi người dùng yêu cầu kiểm thử/xác minh. Nghiệm thu là workstream riêng; thiếu evidence phải ghi chưa chạy.
- Nếu không có baseline thực nghiệm, hoàn thành instrumentation nhưng để task cân bằng ở trạng thái chờ số liệu, không tự gọi là xong toàn bộ.
- Mỗi đợt có báo cáo files/behavior/evidence/risks; không tuyên bố cả giai đoạn nghiệm thu chỉ từ build xanh.
- Giai đoạn chốt triển khai khi dependency/clock/intent/readers/UI/codec nhất quán. Chốt cân bằng và nghiệm thu cần số liệu và kiểm chứng riêng.

## 7. Điểm bắt đầu

Đợt1: tách gate giao tiếp, chuẩn hóa world clock cho producer xã hội và inventory nguồn combat target. Đây là phần nền tảng có thể triển khai độc lập trước khi thêm monitoring hoặc thay đổi cân bằng.
