# Quan hệ xã hội — Kế hoạch chi tiết giai đoạn 4

Ngày lập: 30-09-2026. **Trạng thái: đề xuất kế hoạch; chưa triển khai mã gameplay trong lượt này.**

## 1. Phạm vi và mục tiêu

Chưa tìm thấy một phạm vi giai đoạn 4 đã chốt trong tài liệu hiện có. Kế hoạch này đề xuất nối tiếp lifecycle của giai đoạn 3 bằng **chất lượng giao tiếp, lựa chọn người giao lưu và quyết định hỗ trợ của AI**.

Kết quả mong muốn:

1. Các nguồn giao tiếp dùng một cách đánh giá kết quả; cùng một cặp không nhận các mức thưởng chênh lệch lớn chỉ vì caller khác nhau.
2. Tính cách hiện có ảnh hưởng xu hướng giao lưu và nội dung cuộc gặp; không sinh lại tính cách hoặc gắn tính cách cố định theo chủng tộc.
3. AI chọn người theo quan hệ hai phía, khả năng đáp lại, hoàn cảnh và khoảng cách; kiểm tra lại khi thực sự gặp.
4. Trợ chiến xét mức tin tưởng và an toàn, tránh hỗ trợ bằng nhãn quan hệ khi điểm đã xấu nhưng chưa đủ 30 ngày để kết thúc.
5. Lời thoại/ký ức/Inspector phản ánh đúng hành động và kết quả; giao tiếp có thể trung tính, không mặc định mọi cuộc gặp đều tăng điểm.
6. Giữ các quy tắc hình thành, lifecycle, cứu mạng và thời gian ngày đã triển khai.

Chia 5 đợt tuần tự. Mỗi đợt phải có báo cáo phạm vi thay đổi và giới hạn kiểm chứng trước khi chuyển tiếp. Không thêm/chạy test trong lượt lập kế hoạch; ma trận ở cuối chỉ là kế hoạch khi có yêu cầu kiểm thử.

## 2. Căn cứ nguồn hiện tại và phần cần sửa trước

| Tệp | Quan sát trực tiếp | Hệ quả đối với kế hoạch |
|---|---|---|
| src/modules/social/SocialInteractionSystem.ts | Nhánh chữa thương ghi saved_life cho người nhận đan | Mâu thuẫn với giải thích giai đoạn 3; cần đổi ký ức mới thành helped |
| src/modules/social/SocialInteractionService.ts | performCommunication nhận một bộ delta và cộng giống nhau hai phía | Chưa có đánh giá phản ứng riêng từng người |
| src/modules/ai/brain/behavior/BehaviorTree.ts | Giao tiếp hoàn tất gọi performCommunication(...,2,1), có kiểm tra khoảng cách 48 | Cần giữ kiểm tra tại thời điểm gặp, bổ sung HP > 0 và kết quả từ cổng chung |
| src/modules/factions/FactionSystem.ts | Giao lưu cộng đồng gọi performCommunication(...,8,5) | Mức thưởng lệch so với AI thường; cần cấu hình theo hoạt động cụ thể |
| src/modules/ai/brain/planner/AIPlanner.ts | Người quen được chọn theo khoảng cách, affinity > 10 và cooldown; người hướng ngoại tìm người lạ gần | Có nền tảng nhưng thiếu thứ hạng theo tin tưởng/khả năng đáp lại |
| src/modules/ai/brain/ResidentPreferences.ts | Có sociability, diligence, curiosity, ambition; residentPreferences tạo bằng RNG nếu thiếu | Reader mới chỉ đọc component; không gọi hàm tạo từ UI/evaluator |
| src/modules/save/SaveManager.ts | Có hydrate và validation 4 trường personality [0,1] | Tái sử dụng dữ liệu hiện có; không tạo bộ tính cách mới |
| src/modules/ai/brain/goals/StrategicGoal.ts | Trợ chiến dùng active đối ứng, sống và phạm vi | Bổ sung cổng quyết định tin tưởng/nguy hiểm, không đổi lifecycle |
| src/ui/SocialRelationshipInspector.ts | Đã có lịch sử, mâu thuẫn, cooldown và giải thích cứu mạng | Mở rộng giải thích giao tiếp/hỗ trợ; giữ chỉ đọc |

Các build/diff trước đã qua nhưng giai đoạn 3 chưa có nghiệm thu gameplay/save roundtrip. Không dùng trạng thái đó làm bằng chứng runtime của giai đoạn 4.

## 3. Quy tắc thiết kế đề xuất

### 3.1. Giữ nền tảng đã có

- Ngày mô phỏng: 400 ticks/ngày, 20 ticks/giây, 1 ngày = 20 giây ở 1x.
- Giao tiếp dùng cùng communication cooldown 1 ngày cho cặp, không thêm khóa ở từng caller.
- Đạo lữ/sư đồ/kết nghĩa vẫn theo điều kiện giai đoạn 2; phản bội/mâu thuẫn/tử vong theo giai đoạn 3.
- Cứu mạng tiếp tục yêu cầu evidence; chữa thương không gọi claimRescueLife hoặc ghi saved_life mới.
- Mọi đặc điểm lúc rải nhân vật tiếp tục ngẫu nhiên theo yêu cầu trước; không reroll khi gặp gỡ, mở Inspector hoặc load.
- Không thay tư chất/ngộ tính/thiên phú hoặc gán xu hướng theo nhân tộc/yêu tộc/ma tộc trong giai đoạn này.

### 3.2. Hợp đồng giao tiếp chung

Đề xuất SocialConversationService.ts mới, tái sử dụng performSocialInteraction để khóa và kiểm tra người sống:

```ts
type ConversationContext = 'casual' | 'cultivation' | 'community';
type ConversationOutcome = 'warm' | 'neutral' | 'awkward';
// evaluateConversation: chỉ đọc, trả delta riêng cho hai phía + reason codes.
// performConversation: kiểm tra lại, callback đồng bộ qua communication,
// chỉ commit điểm/ký ức/lời thoại khi thực sự completed.
```

Đề xuất result: completed kèm outcome/context hoặc skipped với lý do participant_unavailable, out_of_range, unsafe, cooldown_active, declined. Declined không ghi điểm/khóa và không phát ký ức bị xúc phạm. Cooldown_active vẫn cho kết thúc nhu cầu giải trí theo logic hiện có, nhưng không giả thành một cuộc trò chuyện có thưởng.

Mặc định context casual; caller truyền context từ hoạt động có thực. community chỉ dùng đường cộng đồng hiện có, không phải đặc quyền có mức tăng vô hạn. cultivation chỉ dùng khi cả hai có dữ liệu tu luyện phù hợp, không tự chuyển thành truyền công/sư đồ.

Khoảng cách tối đa giao tiếp đề xuất thống nhất 55, là phạm vi encounter hiện tại; AI MOVE_TO tiếp tục nhắm gần hơn nếu cần. Chỉ kiểm tra khoảng cách khi commit, không coi kế hoạch di chuyển là cuộc gặp đã xảy ra. Hoạt động cộng đồng phải chọn cặp tại cùng điểm hoạt động theo vị trí thực, không cộng điểm từ xa.

### 3.3. Tính cách và kết quả giao tiếp

Đọc ResidentPersonalityComponent bằng getComponent. Thiếu component trong reader dùng giá trị trung tính 0,5; không tạo ngẫu nhiên trong reader. Mọi khởi tạo còn thiếu phải ở bước tạo cư dân/staging đã kiểm soát, không thực hiện khi mở UI. Nếu nhánh động vật thiếu xã hội thì bỏ qua.

Đề xuất điểm đáp lại phía nhận:

`receptivity = clamp(0.50 + 0.25*(sociability-0.5) + 0.20*(affinity/100) + 0.15*((trust-50)/50) - busyPenalty, 0, 1)`

- Đang nguy cấp/combat: từ chối giao tiếp thường, không chỉ trừ vài điểm.
- Đang làm việc/ngủ: busyPenalty đề xuất 0,20; chưa cho AI phá bước công việc đang chạy để tiếp chuyện.
- Context cultivation dùng curiosity để điều chỉnh lợi ích người nghe, không đổi cảnh giới hoặc tăng EXP chỉ vì nói chuyện.
- diligence và ambition không tự biến thành tốt/xấu; chỉ dùng nếu có ý nghĩa hoạt động rõ, không ép mọi trường vào công thức.
- Không dùng mức giống nhau của tính cách để suy ra hai người bắt buộc hợp nhau. Không loại cư dân ít hướng ngoại khỏi giao lưu.

Ngưỡng outcome đề xuất: receptivity trung bình >= 0,65 warm; < 0,35 awkward; còn lại neutral. Delta hai phía được tính riêng theo receptivity của mỗi người. Hàm đánh giá thuần, không RNG. Có thể giữ RNG lịch xuất hiện cuộc gặp hiện có; không tiêu thêm RNG từ UI hoặc bảng xếp hạng AI.

| Kết quả | Delta khởi điểm đề xuất cho mỗi phía |
|---|---|
| warm | affinity +3, trust +1, respect +0 |
| neutral | affinity +1, trust +0, respect +0 |
| awkward | affinity -1, trust +0, respect +0 |

Context không nhân thưởng cộng đồng vượt trần. Tổng tăng tối đa đề xuất mỗi cuộc giao tiếp thường: affinity +4, trust +2, respect +1; giảm affinity tối đa -2, không giảm trust chỉ vì vụng về. Các số là cấu hình khởi điểm chưa cân bằng runtime. Không áp vào healing/combat/rescue hoặc bonus hình thành ràng buộc.

### 3.4. Điểm và ký ức

- Một completed interaction tăng interactionsCount đúng một lần mỗi phía, kể cả neutral; skipped không tăng.
- Chỉ cập nhật ngày/tick theo world trong cùng đường commit. Không tạo nợ cooldown khi RNG chưa chọn cuộc gặp hoặc bị từ chối.
- Ký ức nói chuyện dùng chatted, mô tả outcome phù hợp. importance 1 hoặc 2, cảm xúc đề xuất +10/0/-5; không dùng insulted/attacked cho cuộc nói chuyện awkward.
- Không phát chronicle cho từng cuộc nói chuyện thường; lời thoại ngắn theo context/outcome, đi qua overlay hiện có.
- Không sửa ký ức saved_life cũ hàng loạt: trước đây không có evidence đủ để phân biệt chữa thương/cứu thật. Chỉ sửa producer cho ký ức mới và ghi giới hạn dữ liệu cũ trong báo cáo.

### 3.5. Chọn người giao lưu của AI

Service chỉ đọc đề xuất SocialDecisionService.ts. Hard gates: target tồn tại, sống HP > 0, có vị trí/xã hội; không self; không cooldown; không đang nguy cấp/combat. Không loại ended tự động nếu hai người vẫn có thiện cảm; coi là quan hệ thường cho hành động này.

Chấm điểm ứng viên đề xuất theo 0..100, trọng số cấu hình:

- Quan hệ hai phía và trust: 35%.
- Khả năng đáp lại: 25%.
- Khoảng cách: 25%.
- Context/chung hoạt động thực tế: 15%.

Dùng min/average phù hợp cho hai phía để tránh affinity người đề xuất cao che người nhận ghét. Hard reject khi affinity phía nhận <= -30, ngưỡng đề xuất. Tie-break theo khoảng cách rồi entityId để ổn định.

Giới hạn ứng viên đề xuất 12 gần nhất trong bán kính 200; ưu tiên spatial grid nếu có, không tự thêm static cache. Fallback đọc world có giới hạn và chỉ chạy khi lập kế hoạch, không quét N² mọi tick. Không để 12 người quen xa che toàn bộ hàng xóm có thể tiếp chuyện.

Trẻ tìm người chăm sóc là đường chăm sóc riêng; không chặn theo cooldown giao tiếp để làm mất hành vi theo guardian. Khi gặp, nếu conversation bị skip thì không phát điểm giả, vẫn giữ hoạt động chăm sóc hiện có.

Kiểm tra lại vị trí/sống/cooldown/khả năng đáp lại khi bước giao lưu hoàn tất. Target chết/đi xa/đang chiến đấu thì không commit, không treo plan hoặc log lặp; dùng cơ chế failure/replan hiện có.

### 3.6. Quyết định trợ chiến

Áp dụng với trợ chiến do ràng buộc; không áp vào tự vệ/thi hành thần dụ/chăm sóc trẻ/chôn cất.

- Bắt buộc active đối ứng như hiện có, người được giúp/mục tiêu sống và mục tiêu != người giúp.
- Ngưỡng đề xuất: affinity người giúp tới đồng minh >= 20, trust >= 40. Không tự kết thúc ràng buộc khi không đạt.
- Người giúp HP <= 25% thì ưu tiên FLEE_DANGER/tự bảo toàn; không tăng COMBAT_DEFENSE lên 94 chỉ vì đồng minh ở gần.
- Không tự chọn kẻ mà người giúp đang có ràng buộc active để đánh thay; trả lý do conflicting_bond. Tránh trợ chiến gây phản bội vòng dây chuyền.
- Giữ bán kính 180, không thêm trả thù hay chiến tranh phe. Giữ hành vi tự vệ nếu bản thân bị tấn công, kể cả người tấn công là quan hệ cũ.
- Quyết định hỗ trợ chỉ là chọn AI, không thưởng cứu mạng; thưởng vẫn do đòn kết liễu/evidence.

## 4. Các đợt triển khai

### Đợt 1 — Sửa tính nhất quán và dựng hợp đồng

| ID | Việc cụ thể | Tệp | Tiêu chí hoàn thành |
|---|---|---|---|
| G4.1.1 | Đổi ký ức nhận đan mới saved_life -> helped; giữ hồi HP/tiêu đan/điểm | SocialInteractionSystem.ts | Chữa thương không tạo cứu mạng giả; không sửa ký ức cũ |
| G4.1.2 | Gom ngưỡng conversation/decision/support vào cấu hình | src/config/social.config.ts | Có đơn vị, giới hạn, không rải số mới |
| G4.1.3 | Định nghĩa context/outcome/rejection/delta hai phía | src/modules/social/SocialConversationService.ts (mới) | Contract rõ, evaluator chỉ đọc, chưa nối mọi caller |
| G4.1.4 | Helper đọc personality trung tính | ResidentPreferences.ts hoặc service mới | Không Math.random/addComponent trong reader |
| G4.1.5 | Bản đồ caller và báo cáo | docs/QUAN_HE_XA_HOI_GIAI_DOAN_4_DOT_1.md | Liệt kê AI/proximity/faction, API cũ và đường chưa chuyển |

Gate: sửa producer chữa thương và contract xong; không đưa thưởng conversation mới vào một nguồn duy nhất rồi gọi là thống nhất toàn hệ thống.

### Đợt 2 — Một cổng giao tiếp cho mọi nguồn

| ID | Việc cụ thể | Tệp | Tiêu chí hoàn thành |
|---|---|---|---|
| G4.2.1 | Implement evaluation/commit, delta hai phía, cooldown chung | SocialConversationService.ts, SocialInteractionService.ts | Validate trước ghi; skipped không điểm/memory/khóa |
| G4.2.2 | Chuyển proximity chat | SocialInteractionSystem.ts | Outcome đúng, không còn thưởng chat riêng 2..5 |
| G4.2.3 | Chuyển completed social step | BehaviorTree.ts | Kiểm tra HP > 0/vị trí/hoàn cảnh; cooldown không tạo thưởng giả |
| G4.2.4 | Chuyển giao lưu cộng đồng | FactionSystem.ts | Chỉ người thực sự có thể gặp, bỏ +8/+5 hardcoded |
| G4.2.5 | Rà API compatibility và timestamp | SocialInteractionService.ts, callers | Không caller thường bỏ qua service mới; API low-level phải có phạm vi rõ |

Gate: rg inventory performCommunication/adjustScores và đối chiếu mọi producer giao tiếp. Healing, combat, rescue và bonus bond có delta riêng được giữ, không vô tình đưa qua trần trò chuyện.

### Đợt 3 — AI chọn người và kiểm tra lúc gặp

| ID | Việc cụ thể | Tệp | Tiêu chí hoàn thành |
|---|---|---|---|
| G4.3.1 | Pure candidate score/reason codes | src/modules/social/SocialDecisionService.ts (mới) | Xem xét hai phía, tie-break ổn định, không RNG/ghi |
| G4.3.2 | Thay nearest-only selection | AIPlanner.ts | Người gần nhưng từ chối không luôn thắng; ứng viên giới hạn |
| G4.3.3 | Tái đánh giá khi bước kết thúc | BehaviorTree.ts | Người chết/đi xa/chiến đấu không nhận điểm; replan được |
| G4.3.4 | Giữ caregiver/fallback | AIPlanner.ts, StrategicGoal.ts nếu cần | Trẻ vẫn tìm guardian; không hết mục tiêu là đứng im mãi |
| G4.3.5 | Rà tốc độ/churn | planner và cấu hình AI hiện có | Không đổi mục tiêu mỗi tick, không quét toàn bộ social graph liên tục |

Gate: planner chỉ chọn/di chuyển; điểm và ký ức duy nhất ở lúc commit. Không tạo social memory khi MOVE_TO mới bắt đầu.

### Đợt 4 — Trợ chiến theo trust và an toàn

| ID | Việc cụ thể | Tệp | Tiêu chí hoàn thành |
|---|---|---|---|
| G4.4.1 | evaluateSocialAssistance thuần | SocialDecisionService.ts | Ngưỡng điểm/trust/sức khỏe/ràng buộc với địch rõ |
| G4.4.2 | Nối nhánh trợ chiến | StrategicGoal.ts | Không đè tự bảo toàn, không chọn self/dead/active partner làm địch |
| G4.4.3 | Rà reader combat mục tiêu | AIPlanner.ts, BehaviorTree.ts theo caller thực tế | Target mất không treo, hỗ trợ không tự cấp cứu mạng |
| G4.4.4 | Phân biệt từ chối giúp với kết thúc bond | RelationshipService.ts chỉ đọc đối chiếu | Không sửa ngày/status/history khi chỉ không trợ chiến |
| G4.4.5 | Báo cáo tình huống | docs/...GIAI_DOAN_4_DOT_4.md | Tự vệ, thần dụ, đồng minh, xung đột ràng buộc tách rõ |

Gate: không thay sát thương/cứu mạng/phản bội; chỉ thay điều kiện lựa chọn AI do quan hệ.

### Đợt 5 — UI, tài liệu và phạm vi nghiệm thu

| ID | Việc cụ thể | Tệp | Tiêu chí hoàn thành |
|---|---|---|---|
| G4.5.1 | Giải thích xu hướng/khả năng giao tiếp | SocialRelationshipInspector.ts, InspectorPanel.ts | UI chỉ đọc, không hứa cuộc gặp chắc chắn thành công |
| G4.5.2 | Giải thích hỗ trợ hai hướng | SocialRelationshipInspector.ts | Đúng người giúp/nhận, lý do trust/HP/conflict rõ |
| G4.5.3 | Lời thoại theo context/outcome | SocialConversationService.ts, producers | Trung tính/vụng về không dùng lời thù hận; skipped không spam |
| G4.5.4 | Rà save/reset | SocialSaveCodec.ts, SaveManager.ts, Engine.ts | Không thêm dữ liệu transient vào save; không side effect khi load/UI |
| G4.5.5 | Tổng kết toàn diện | docs/QUAN_HE_XA_HOI_GIAI_DOAN_4_TONG_KET.md | Tách đã viết, đã kiểm chứng, giới hạn/chưa chốt cân bằng |

Không thêm persistent conversation history riêng trong phạm vi mặc định: ký ức dùng MemoryComponent hiện có, quyết định là transient. Nếu phát sinh state mới thật sự cần lưu thì phải thêm codec/validation ngay trong đợt thêm state, không để đến đợt 5.

## 5. Thứ tự và nguyên tắc thực hiện

1. Mỗi task nhỏ đọc caller và component liên quan trước sửa.
2. Chỉnh cấu hình/contract -> evaluator -> commit -> caller -> UI/tài liệu.
3. Thực hiện lần lượt, không để API cũ và mới thưởng cùng một hoạt động.
4. Giữ working tree đang có thay đổi; không reset/revert ngoài phạm vi.
5. Khi triển khai, chạy build và diff check; ghi rõ đây là xác nhận biên dịch, không phải nghiệm thu hành vi.
6. Chỉ thêm/chạy test khi người dùng yêu cầu kiểm thử/xác minh; không tự coi yêu cầu lập kế hoạch là yêu cầu chạy test.
7. Đợt tiếp theo chỉ bắt đầu sau khi đợt trước có mã và báo cáo review; nếu có lỗi nguồn liên quan phải ghi cụ thể, không che bằng một build xanh.

## 6. Ma trận kiểm chứng dự kiến

Khi có yêu cầu kiểm thử, đề xuất tests/social-conversation-regression.ts và tests/social-decision-regression.ts, đăng ký trong tests/run.mjs; kết hợp case giai đoạn 3 ở harness riêng nếu có. Chưa tạo/chạy các tệp này.

| Nhóm | Case | Điều cần xác nhận |
|---|---|---|
| Ngữ nghĩa | Nhận đan chữa thương; combat rescue thật | helped khác saved_life; không mất hồi HP/điểm |
| Hai phía | A thích B, B ghét A; đảo ID | Không cộng delta giống nhau máy móc, không lợi thế ID |
| Personality | Thiếu component; low/high sociability | Reader không sinh RNG; ít hướng ngoại vẫn có giao tiếp |
| Outcome | Biên 0,35 và 0,65 | Kết quả/điểm theo đúng ngưỡng, clamp hữu hạn |
| Điều kiện | HP 0, dead, deleted, thiếu position, combat | Không commit hoặc thưởng |
| Khoảng cách | 54,99/55/55,01; target đi xa lúc chờ | Đúng phạm vi và kiểm tra lại |
| Cooldown | AI + proximity + faction cùng ngày | Một completed/cặp/ngày; skipped không tăng count/memory |
| Community | Khác điểm hoạt động, cùng phe xa nhau | Không tăng điểm từ xa |
| AI selection | Candidate gần từ chối; xa hơn nhưng phù hợp; tie | Chọn hợp lý, tie ổn định, không N² mỗi tick |
| Caregiver | Guardian cooldown/đang bận | Không mất đường chăm sóc trẻ |
| Trợ chiến | affinity 19/20; trust 39/40; HP 25% | Đúng ngưỡng, không đè tự bảo toàn |
| Xung đột | Đồng minh đánh đạo lữ của người giúp | Không tự trợ chiến gây phản bội |
| Lifecycle | Active/ended/one-sided/mismatched episodes | Không hỗ trợ bằng lịch sử; giao lưu ended vẫn có thể nếu hợp lệ |
| Save | Nạp trước/sau interaction, personality thiếu | Không reroll UI, không phát thưởng lại |
| UI | Mở nhiều lần/refresh, tên dài/panel hẹp | Không mutation/RNG; nội dung đọc được và đúng chiều |
| Nhịp | Pause, 1x/5x, ngày20s | Đơn vị world đúng, không phụ thuộc thời gian máy tính |

Runtime smoke dự kiến khi được yêu cầu: một nhóm cư dân khác sociability; theo dõi chọn người/cuộc gặp, hai phía điểm, chữa thương/cứu mạng, trợ chiến trust thấp, save/load và Inspector. Không chỉ quan sát lời thoại để kết luận điểm/cooldown đúng.

## 7. Rủi ro và giới hạn

- Ngày20s làm +3 affinity mỗi ngày khá nhanh; cần quan sát tốc độ hình thành bond thực tế trước chốt cân bằng, không đổi ngưỡng bond đồng thời khi chưa có số liệu.
- Giảm thưởng cộng đồng từ +8/+5 có thể làm quan hệ tiến triển chậm; phải báo thay đổi cân bằng rõ.
- Pure evaluator với ngưỡng cố định có thể khiến nhóm ít sociability nhiều neutral; chưa thêm jitter/RNG nếu chưa có lý do thực tế.
- Mỗi cặp vẫn chỉ một relationType hiện tại. Không mở nhiều vai song song, không gia phả độc lập, không nhiệm vụ/hôn lễ/lễ bái sư/chiến tranh phe mới.
- Không tạo traits mới, chỉnh cách ngẫu nhiên lúc spawn, thêm nghề, trang bị hoặc hệ trao đổi vật phẩm.
- Chưa thêm gossip/danh vọng truyền qua mạng xã hội, tình yêu cưỡng ép, hệ hận thù/tha thứ dài hạn hoặc trả thù tự động.
- Giai đoạn 3 chưa có nghiệm thu runtime; các case hồi quy nền tảng phải được ghi riêng khi kiểm chứng được yêu cầu.

## 8. Tiêu chí chốt giai đoạn 4

- Chữa thương mới không gắn nhãn cứu mạng.
- Ba nguồn giao tiếp dùng service chung, delta hai phía và cooldown thống nhất.
- AI lựa chọn và tái kiểm tra đúng, không tạo personality từ evaluator/UI.
- Trợ chiến xét trust/affinity/an toàn và tránh xung đột ràng buộc; giữ tự vệ/thần dụ.
- UI/lời thoại mô tả đúng outcome và hướng quan hệ, không có side effect.
- Save/reset không phát lặp hoặc reroll; không bỏ codec nếu thêm state.
- Báo cáo đủ 5 đợt và tổng kết, ghi rõ cấu hình khởi điểm và kiểm chứng đã/chưa thực hiện.

Hoàn thành triển khai mã và hoàn thành nghiệm thu runtime là hai trạng thái phải được ghi riêng trong báo cáo.
