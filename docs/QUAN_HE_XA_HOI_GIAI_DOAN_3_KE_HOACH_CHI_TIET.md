# Quan hệ xã hội — Kế hoạch chi tiết giai đoạn 3

Ngày lập: 30-09-2026. Trạng thái: kế hoạch; chưa sửa logic gameplay trong lượt này.

## 1. Mục tiêu

Giai đoạn 3 hoàn thiện vòng đời quan hệ và đưa sự kiện xã hội vào gameplay bằng bằng chứng cụ thể:

1. Ràng buộc có trạng thái đang hoạt động/kết thúc, ngày và lý do kết thúc.
2. Người chết được giữ trong lịch sử, không tiếp tục hỗ trợ hoặc chiếm sức chứa quan hệ.
3. Đạo lữ/sư đồ/kết nghĩa có thể kết thúc vì phản bội hoặc mâu thuẫn kéo dài; huyết thống được giữ.
4. Cứu mạng chỉ được ghi khi hành động thực sự loại bỏ mối đe dọa tới người đang nguy hiểm.
5. AI, tâm cảnh, sinh sản, ký ức và Inspector đọc cùng trạng thái quan hệ.
6. Save/load/reset không phát lặp sự kiện hoặc hồi sinh ràng buộc đã kết thúc.

Chia thành 5 đợt, phụ thuộc tuần tự. Các ngưỡng mới trong tài liệu là đề xuất khởi điểm khi người dùng cho triển khai; chưa phải quy tắc hiện có.

## 2. Căn cứ mã nguồn đã đọc

| Vị trí | Hiện trạng |
|---|---|
| SocialComponents.ts | Một relationType/cặp; chưa có ngày/lý do kết thúc hoặc lịch sử nhiều lần hình thành |
| RelationshipRules.ts | Ràng buộc hoạt động suy từ người sống và hai loại đối ứng; bản ghi lịch sử vẫn còn nhãn cũ |
| RelationshipService.ts | Tạo ràng buộc/cooldown và giảm điểm combat; chưa có API chấm dứt |
| CorpseAndGraveSystem.ts | Khi tạo corpse phát bereavement cho người thân/bạn thân; sau đó corpse/grave có thể bị destroyEntity |
| GrowthSystem.ts | Đã có chống trùng milestone và xử lý sự kiện trưởng thành |
| MentalStateSystem.ts | relationshipSupport dựa affinity >= 50 và loại quan hệ; vòng đọc hiện chưa lọc đối tượng chết/bị xóa |
| StrategicGoal.ts | AI trợ chiến theo nhãn đạo lữ/sư đồ/kết nghĩa; chưa dùng trạng thái kết thúc |
| ReproductionSystem.ts | Kiểm tra đạo lữ hai phía cùng điều kiện sinh sản; phải bổ sung trạng thái active nếu thêm lifecycle |
| SocialInteractionSystem.handleRescueLife | Chưa có caller gameplay; tăng mạnh điểm và ghi saved_life nhưng chưa kiểm tra bằng chứng cứu mạng |
| CombatSystem.ts | Trừ HP -> social attack hook -> isDead -> lịch sử/defeated_enemy; có thể lấy snapshot mục tiêu trước đòn chết |
| CombatComponents.ts | CombatStatsComponent có targetEntityId |
| EncounterTracker.ts | Theo dõi trao đổi chiến đấu theo cặp; cần xem khả năng tái dùng nhưng không coi có trao đổi là đủ chứng minh cứu mạng |
| SocialSaveCodec.ts/SaveManager.ts | Validator/staging/ledger đã có, chưa có lifecycle/rescue evidence |
| SocialRelationshipInspector.ts | Có phân biệt lịch sử theo người sống/đã mất; chưa có lý do chia tay/đoạn tuyệt |

Nhịp thời gian giữ nguyên: 400 ticks/ngày, 20 ticks/giây, **1 ngày = 20 giây ở 1x**. Các mốc dùng clock world, không dùng Date.now cho gameplay.

## 3. Phạm vi và điều chưa triển khai

Trong phạm vi: lifecycle, kết thúc do chết/phản bội/mâu thuẫn, tang chế dùng pipeline hiện có, cứu mạng bằng tiêu diệt mối đe dọa, tích hợp AI/tâm cảnh/sinh sản/UI/save.

Chưa triển khai: gia phả độc lập nhiều thế hệ, nhiều loại ràng buộc đồng thời trên cùng cặp, chuỗi hội thoại đề nghị, nhiệm vụ xã hội, trả thù tự động cấp phe, chiến tranh do một quan hệ cá nhân, cứu mạng bằng kéo ra khỏi thiên tai, hồi sinh người chết, ép ghép đôi hay giới hạn chủng tộc/tính cách mới.

Không tự sửa dữ liệu ràng buộc cũ một chiều mơ hồ. Phải hiển thị trạng thái cần xử lý và từ chối thao tác không nhất quán.

## 4. Quy tắc lifecycle đề xuất

### 4.1. Dữ liệu trên bản ghi

Thêm metadata tùy chọn, ví dụ:

```ts
interface RelationshipBondState {
  schemaVersion: 1;
  status: 'active' | 'ended';
  formedAtDay?: number;
  endedAtDay?: number;
  endReason?: 'death' | 'betrayal' | 'estrangement';
  conflictSinceDay?: number;
}
```

- relationType tiếp tục chỉ vai trò của bản ghi; status cho biết vai trò còn hoạt động hay đã kết thúc.
- Không thêm biến thể dao_companion_dead/ex_master vào enum để thay thế trạng thái.
- Quan hệ thông thường có thể không có bond metadata. Metadata chỉ dùng cho đạo lữ/sư đồ/kết nghĩa/huyết thống được ghi nhận.
- Save cũ thiếu metadata: suy ra active khi hai phía sống đối ứng; đối tượng chết/mất hiển thị lịch sử. Không phát ký ức/nhật ký mới chỉ vì nạp dữ liệu cũ.
- Không có ngày hình thành số chính xác trong save cũ thì giữ undefined; không bịa ngày từ chuỗi specialBondDate hoặc ngày nạp.
- Khi kết thúc, giữ điểm hiện tại, tên, loại cũ, ngày hình thành và ngày/lý do kết thúc.
- Huyết thống không bị xóa khi điểm âm. Đối tượng mất khiến liên hệ không còn hoạt động nhưng parentIds/nhãn gia đình vẫn là bằng chứng gia đình.

### 4.2. Kết thúc và tạo lại

- API endCompanionBond/endMentorship/endSwornBond hoặc một endBond nội bộ phải kiểm tra hai phía trước ghi.
- Idempotent: đã kết thúc trả already_ended, không lặp ký ức/nhật ký, không đặt lại ngày kết thúc/cooldown.
- Kết thúc bình thường yêu cầu cặp đối ứng; không ghi đè ràng buộc khác hoặc tự sửa một chiều.
- Kết thúc do chết được phép xử lý từng bản ghi lịch sử liên quan tới người đã mất; không tạo bản ghi đối ứng giả khi thiếu dữ liệu.
- Khóa đề nghị sau kết thúc do phản bội/mâu thuẫn: tối thiểu 30 ngày cho cặp; giữ max(hạn hiện tại, now + 30), không giảm hạn đã có.
- Sau khi hết khóa, người sống có thể hình thành ràng buộc mới nếu đạt lại điều kiện giai đoạn 2.
- Nếu ghi ràng buộc mới vào cặp có bản ghi ended, lưu snapshot kết thúc vào bondHistory trước khi thay thế. Đề xuất tối đa 20 mục mỗi nhân vật, ưu tiên mục mới, không trộn vào MemoryComponent.
- Lịch sử chỉ ghi một lần mỗi đợt ràng buộc. Hình thành lại phải có episodeId mới; sinh episodeId bằng counter trên world/nhân vật được lưu, không dùng Date.now hoặc RNG trong renderer.
- Giữ một nhãn/cặp: không tạo ràng buộc khác với họ gần; việc kết thúc không cho bỏ qua areCloseKin.

### 4.3. Mất người thân

- Hook khi initNewCorpses xử lý một cái chết mới, trước vòng bereavement và trước khi đối tượng bị xóa.
- Ghi endedAtDay/endReason = death cho liên hệ tới người mất, giữ lịch sử và tên.
- Giữ emitGrowthEvent bereavement hiện có, không cộng thêm một khoản tâm cảnh âm riêng cho cùng sự kiện.
- Thêm ký ức bereavement cho người thân/bạn thân phù hợp, dùng cùng nhóm xác định close_kin/friend hiện có; đề xuất importance = 5, emotionalValence = -80.
- Tang chế xử lý qua cùng một điều phối: mỗi (người sống, người mất, deathEpisode) chỉ phát một lần. Marker đã xử lý phải được lưu; không phụ thuộc ký ức còn trong danh sách 40 mục.
- Nếu nạp save có corpse/grave đã được ghi nhận trước đây, không phát lại. Save cũ có corpse và thiếu marker mặc định coi đã xử lý để tránh thưởng/phạt lặp.
- Đối tượng vừa isDead nhưng chưa corpse được xử lý ở tick tiếp theo bằng snapshot ràng buộc trước kết thúc.
- Không giới hạn tang chế bằng bán kính 180 của nhân chứng combat; dùng quy tắc quan hệ người thân đang có. Không thiết kế hệ truyền tin trong giai đoạn này.

### 4.4. Phản bội và mâu thuẫn

| Tình huống | Quy tắc đề xuất |
|---|---|
| Trực tiếp gây sát thương dương lên đạo lữ/thầy/trò/tri kỷ sống đối ứng | Kết thúc ràng buộc ngay, lý do betrayal; không RNG |
| Chỉ chứng kiến người khác đánh người thân | Giảm điểm theo giai đoạn 2; không tự chấm dứt ràng buộc với người đánh |
| Một phía hảo cảm <= -50 và tin tưởng <= 20 liên tục | Đánh dấu conflictSinceDay; đủ 30 ngày thì kết thúc với estrangement |
| Điểm hồi lên và không còn thỏa cả hai ngưỡng | Xóa mốc mâu thuẫn; không cộng dồn các đoạn rời rạc |
| Huyết thống bị tấn công | Giảm điểm/ký ức, giữ parentIds và quan hệ gia đình; không đoạn tuyệt huyết thống |

- Một phía muốn chấm dứt là đủ để kết thúc chung; việc hình thành mới vẫn cần điều kiện hai phía.
- Dùng daily scan/lifecycle system, không tăng timer theo số lần quét. Pause không trôi mốc 30 ngày = 600 giây ở 1x.
- Xử lý phản bội trước khi ghi đổi nhãn hostility, nếu không sworn_brother có thể bị đổi enemy làm mất bằng chứng ràng buộc.
- Không thêm sát thương đối đầu/đồng minh mới, không bắt AI tự trả thù vì ràng buộc kết thúc.
- Thêm MemoryType bond_ended/betrayed với mô tả đúng vai; proposed importance 4, cảm xúc -60, không tự cấp XP GrowthSystem mới.

## 5. Cứu mạng có bằng chứng

### 5.1. Tiêu chí khởi điểm

Một lần hạ kẻ địch chỉ ghi là cứu mạng nếu đồng thời:

1. Người được cứu còn sống, HP > 0 và <= 35% HP tối đa tại snapshot nguy hiểm.
2. Có bằng chứng kẻ địch đang tấn công/chọn người đó làm mục tiêu, hoặc vừa gây sát thương lên người đó trong vòng 1 ngày.
3. Người giúp khác người được cứu, khác kẻ địch, còn sống và có dữ liệu xã hội.
4. Người giúp thực sự gây đòn kết liễu kẻ địch đó; HP kẻ địch trước đòn > 0 và sau đòn = 0.
5. Người được cứu trong bán kính 180 tại thời điểm giải quyết, và không đang bị một mối đe dọa còn sống khác được tracker biết tới tiếp tục tấn công.
6. Evidence chưa claimed và cặp người nhận/người giúp hết cooldown rescueLife.

- Kẻ địch có thể là cư dân hoặc động vật. Chỉ người giúp/người được cứu phải là cư dân có SocialRelationshipComponent; không thêm xã hội cho động vật.
- Không suy luận cứu mạng chỉ từ việc ở gần, chung phe, từng quen biết hoặc vừa hạ một người bất kỳ.
- Chữa thương thông thường vẫn là healing; chưa tự đổi mọi lần tặng đan thành saved_life mới.
- Khi bỏ chạy hoặc mất mục tiêu thì evidence hết hạn; chưa thưởng vì chạy thoát trong giai đoạn này.
- Nhiều người đang bị một kẻ địch đe dọa có thể được xét riêng nếu mỗi người đủ bằng chứng; mỗi evidence/cặp chỉ được nhận một lần.

### 5.2. Tracker và save

- Ưu tiên kiểm tra liệu EncounterTracker có đủ dữ liệu; nếu không, thêm RescueEvidenceComponent cho người bị đe dọa, không sửa ý nghĩa tracker trưởng thành.
- Evidence gồm episodeId, threatEntityId, lastThreatDay, dangerHealthRatio, resolved/claimed và rescuerId khi được nhận.
- HP snapshot/người bị đe dọa phải được ghi ở mỗi đòn nguy hiểm, độc lập cooldown điểm xã hội. Điểm bị đánh chỉ cập nhật mỗi ngày không được làm mất bằng chứng combat mới.
- Snapshot kẻ địch và targetEntityId phải lấy trước đánh dấu chết/clear target. Resolve sau đòn chết một lần.
- Lưu evidence còn hiệu lực/claim cần thiết; dữ liệu sai bị từ chối trước staging commit; save cũ mặc định rỗng.
- Reset sạch qua component/world. Không Map static sống qua nhiều thế giới. Giới hạn đề xuất 8 threats gần nhất mỗi người và dọn quá hạn định kỳ.

### 5.3. Điểm và ký ức

- Đề xuất giữ thưởng người được cứu hiện có: +70 hảo cảm, +60 tin tưởng, +40 kính trọng; clamp qua API điểm.
- Người giúp có ký ức helped, không tự được cộng điểm thưởng ngược hoặc cấp thêm XP.
- Người được cứu có saved_life importance 5, cảm xúc +95 như hàm hiện có.
- Thêm kênh rescueLife có hướng người nhận -> người giúp, 30 ngày; không dùng communication/bondAttempt.
- Claim evidence, ghi điểm/ký ức và ghi cooldown trong cùng đường xử lý đồng bộ sau toàn bộ kiểm tra; bị từ chối không tiêu evidence.
- Không tự lập đạo lữ/kết nghĩa; kết nghĩa tiếp tục theo điều kiện và lần thử giai đoạn 2.
- handleRescueLife phải yêu cầu evidence hợp lệ hoặc chuyển thành wrapper service; không giữ lối gọi public nhận hai ID rồi cộng thưởng vô điều kiện.

## 6. Hậu quả xã hội và tích hợp

| Hệ thống | Cần thay đổi |
|---|---|
| RelationshipRules/Service | Active cần metadata còn hiệu lực + đối ứng + người sống; ended không chặn sức chứa; ràng buộc một chiều active vẫn từ chối |
| MentalStateSystem | Không tính hỗ trợ từ người chết/mất; ràng buộc ended không cấp bonus; friend thông thường sống vẫn dùng ngưỡng hiện có |
| StrategicGoal | Trợ chiến chỉ từ ràng buộc hoạt động; đề xuất yêu cầu hảo cảm >= 0, tin tưởng >= 30; không tự nhập cuộc vì nhãn cũ |
| AIPlanner/BehaviorTree | Tìm người/nhận chỉ điểm theo active; dữ liệu ended/dead không dùng như người thân đang hoạt động |
| SocialInteractionSystem | Chỉ điểm cần active; không phát sự kiện mới từ ràng buộc ended; hình thành lại đi qua điều kiện/cooldown |
| ReproductionSystem | Cư dân cần đạo lữ active hai phía, giữ nguyên điều kiện tuổi/chủng tộc/giới tính/sinh sản hiện có; nhánh động vật giữ riêng |
| CorpseAndGraveSystem | Kết thúc liên hệ + tang chế một lần; không xóa lịch sử khi corpse/grave phân rã |
| Inspector | Ngày/lý do kết thúc, trạng thái active/ended/historical, lịch sử các đợt; ký ức cứu mạng/tang chế có vai trò đúng |
| SaveManager/SocialSaveCodec | Lifecycle/history/counter/marker/evidence validate và hydrate trong staging trước commit |

## 7. Các đợt triển khai

### Đợt 1 — Trạng thái và API vòng đời

| ID | Công việc | Tệp | Hoàn thành khi |
|---|---|---|---|
| G3.1.1 | Thêm cấu hình lifecycle/rescue | src/config/social.config.ts | Ngưỡng và đơn vị ngày rõ, không rải magic numbers |
| G3.1.2 | Metadata/history/counter | src/modules/social/SocialComponents.ts | Dữ liệu active/ended và snapshot lịch sử không dùng chung object |
| G3.1.3 | API kết thúc/tạo lại | RelationshipService.ts, RelationshipRules.ts | Hai phía nhất quán; idempotent; ended không chặn sai; family giữ nguyên |
| G3.1.4 | Codec ngay khi thêm dữ liệu | SocialSaveCodec.ts, SaveManager.ts | Phiên bản, trạng thái, ngày, reason, history giới hạn/counter hợp lệ; save cũ dùng mặc định |
| G3.1.5 | Nối các reader cốt lõi | SocialInteractionSystem.ts, ReproductionSystem.ts | Không chỉ điểm/sinh sản từ ended ngay sau khi schema được đưa vào |

Không bật tự động kết thúc bằng mâu thuẫn hoặc rescue trước khi reader và codec đã hiểu metadata.

### Đợt 2 — Cái chết và tang chế một lần

| ID | Công việc | Tệp | Hoàn thành khi |
|---|---|---|---|
| G3.2.1 | Hook death lifecycle | CorpseAndGraveSystem.ts, RelationshipService.ts | Chốt lịch sử trước hủy entity; xử lý người thân đúng dù bản ghi thiếu phía |
| G3.2.2 | Điều phối tang chế | src/modules/social/RelationshipLifecycleService.ts (mới nếu cần) | Một nguồn xác định close_kin/friend, một marker sự kiện |
| G3.2.3 | Ký ức tang chế | SocialComponents.ts, SocialSaveCodec.ts | Loại mới hợp lệ và không lặp khi nạp |
| G3.2.4 | Giữ GrowthSystem nhất quán | CorpseAndGraveSystem.ts, GrowthEvents.ts/GrowthSystem.ts (chỉ sửa nếu cần) | Không phát bereavement từ hai đường; không cộng thêm áp lực âm riêng |
| G3.2.5 | Sửa hỗ trợ người đã mất | MentalStateSystem.ts, RelationshipRules.ts | Điểm hỗ trợ chỉ từ người sống/ràng buộc hoạt động |

Save/load ngay giữa isDead và initNewCorpses hoặc sau corpse đã tạo phải có quy tắc rõ, không phát lặp/đánh mất sự kiện mới.

### Đợt 3 — Phản bội, mâu thuẫn và reader xã hội

| ID | Công việc | Tệp | Hoàn thành khi |
|---|---|---|---|
| G3.3.1 | Snapshot ràng buộc trước hostility | RelationshipService.ts, SocialInteractionSystem.ts/CombatSystem.ts | Tấn công trực tiếp được phân biệt với chứng kiến; sworn không mất bằng chứng trước kết thúc |
| G3.3.2 | Scan mâu thuẫn theo ngày | src/modules/social/RelationshipLifecycleSystem.ts (mới), Engine.ts | 30 ngày liên tục; hồi phục reset mốc; pause không tăng thời gian |
| G3.3.3 | Hậu quả/ký ức | RelationshipService.ts, SocialComponents.ts | Ghi kết thúc một lần, đúng vai trò, không tự thêm XP |
| G3.3.4 | AI trợ chiến và chọn người | StrategicGoal.ts, AIPlanner.ts, BehaviorTree.ts | Đọc active + điểm/trust; không dùng ràng buộc ended |
| G3.3.5 | Reset/save reader | Engine.ts, SaveManager.ts, SocialSaveCodec.ts | conflictSinceDay và marker qua nạp; timer scan không rò thế giới |

### Đợt 4 — Bằng chứng cứu mạng và hook chiến đấu

| ID | Công việc | Tệp | Hoàn thành khi |
|---|---|---|---|
| G3.4.1 | Thu thập threats/danger snapshot | CombatSystem.ts; src/modules/social/RescueEvidence.ts (mới nếu cần) | Chỉ sát thương thật và người nguy hiểm; không phụ thuộc social attack cooldown |
| G3.4.2 | Resolve đòn kết liễu | CombatSystem.ts; src/modules/social/RescueService.ts (mới) | Người được cứu sống, kẻ địch chết, có evidence còn hạn và không còn threat đã biết |
| G3.4.3 | Claim và thưởng | RescueService.ts, SocialInteractionSystem.ts | Một lần/evidence; handleRescueLife không là lối thưởng vô điều kiện |
| G3.4.4 | Cooldown/codec | SocialCooldown.ts, social.config.ts, SocialSaveCodec.ts, SaveManager.ts | rescueLife 30 ngày có hướng, schema tương thích, evidence được validate/hydrate |
| G3.4.5 | Dọn/reset | RescueEvidence.ts, LifecycleSystem.ts/Engine.ts | Tối đa 8 threats, dọn hạn, không rò sang world khác |

Giữ nguyên sát thương, AI động vật và phần trưởng thành của EncounterTracker. Không coi kill credit là cứu mạng nếu thiếu bằng chứng người được cứu.

### Đợt 5 — Inspector, tài liệu và nghiệm thu

| ID | Công việc | Tệp | Hoàn thành khi |
|---|---|---|---|
| G3.5.1 | Trạng thái và lịch sử | SocialRelationshipInspector.ts, InspectorPanel.ts | Đúng ngày/lý do, bản ghi đã mất không hiển thị active |
| G3.5.2 | Lời thoại/nhật ký | LifecycleService.ts/RescueService.ts, SocialInteractionSystem.ts | Thành công có một sự kiện đúng vai; skipped/rejected không spam |
| G3.5.3 | Nội dung giải thích | InspectorPanel.ts | Không hứa cứu mạng khi chỉ tặng đan; không tạo side effect |
| G3.5.4 | Báo cáo từng đợt/tổng kết | docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_*.md và TONG_KET.md | Tách mã đã viết, kiểm chứng đã chạy, giới hạn còn lại |
| G3.5.5 | Kiểm chứng theo yêu cầu | Ma trận mục 8 | Không coi build là bằng chứng nghiệm thu gameplay |

## 8. Ma trận nghiệm thu dự kiến

Danh sách dưới đây là kế hoạch; lượt này không thêm hoặc chạy tests. Khi có yêu cầu kiểm thử/xác minh, có thể tạo tests/social-lifecycle-regression.ts và tests/social-rescue-regression.ts, đăng ký tests/run.mjs và thêm tình huống tích hợp vào harness phù hợp.

| Nhóm | Trường hợp | Kết quả cần đạt |
|---|---|---|
| API | End hai lần, cặp sai, self, một chiều | Không ghi trùng, không ghi đè ràng buộc khác |
| Tạo lại | Cặp ended đủ/thiếu điều kiện; chưa hết 30 ngày | Đúng khóa; history lưu một lần; episode mới |
| Death | Đói, thọ nguyên, chiến đấu, thiên tai | Mọi đường chết có lifecycle; không chỉ combat |
| Tang chế | Hai người thân, bạn thường, người đã chết | Phân nhóm đúng, một bereavement/người, không double Growth XP/áp lực |
| Save | Trước corpse, sau corpse, sau grave, sau destroy | Không lặp sự kiện; giữ tên/ngày/lý do lịch sử |
| Hỗ trợ | Đạo lữ sống, dead, deleted, ended; friend sống | Không bonus từ lịch sử; friend hợp lệ vẫn hỗ trợ |
| Phản bội | Đánh trực tiếp, chứng kiến, hạ HP về 0, kin | Đúng nguồn; kết thúc trước đổi nhãn; kin giữ huyết thống |
| Mâu thuẫn | 29,99/30 ngày; hồi phục giữa chừng | Đúng biên; yêu cầu liên tục; không cộng dồn |
| Readers | Sinh sản, chỉ điểm, trợ chiến sau kết thúc | Không dùng ràng buộc ended; không làm hồi quy nhánh động vật |
| Rescue dương | Người nguy hiểm bị kẻ địch đe dọa, người thứ ba hạ nó | Thưởng đúng một lần, hai vai ký ức đúng |
| Rescue âm | Người đứng gần, người tự hạ địch, không nguy hiểm, không recent threat | Không thưởng |
| Threat | Địch đổi mục tiêu, evidence hết hạn, còn địch khác | Không suy cứu mạng sai hoặc resolve sai |
| Loại đối tượng | Threat động vật; người giúp/nhận là động vật | Threat động vật có thể hợp lệ; không thêm social cho động vật |
| Lặp | Combo nhiều đòn, resolve hai lần, memory bị capacity evict | Evidence/marker vẫn chống thưởng lặp |
| Cooldown | Rescue 30 ngày, đảo chiều, save/load/pause/5x | Thời hạn world đúng, một chiều rõ, không reset khi nạp |
| Codec | Ngày âm/NaN, reason sai, active có endedAtDay, ID/key trùng | Từ chối trước commit; thế giới cũ còn nguyên |
| Reset | ID tái sử dụng ở world mới | Không kế thừa history marker/evidence/timer |
| UI | Mở nhiều lần, người bị xóa, panel hẹp | Không đổi gameplay/RNG, không focus đối tượng mất, đọc được lịch sử |

Nghiệm thu theo lớp: đọc source -> build/diff -> tests khi được yêu cầu -> quan sát trình duyệt với save/load và các tình huống thật. Giai đoạn 2 vẫn còn các mục kiểm chứng chưa chạy; ghi riêng hồi quy nền tảng và tính năng giai đoạn 3.

## 9. Tiêu chí hoàn thành

- Metadata lifecycle, history và marker/evidence có codec ngay trong đợt thêm dữ liệu.
- Tất cả reader quan trọng sử dụng active nhất quán; không hỗ trợ, sinh sản/chỉ điểm/trợ chiến từ nhãn lịch sử.
- Sự kiện mất người thân và kết thúc chỉ ghi một lần mỗi episode; save/load không lặp.
- Cứu mạng có threat/danger evidence, không thể thưởng chỉ bằng hai ID.
- Mốc thời gian theo ngày world ở nhịp 20 giây/ngày; reset không rò dữ liệu.
- Tài liệu ghi rõ ngưỡng thực dùng, bằng chứng và giới hạn.

Thứ tự: đợt 1 -> 2 -> 3 -> 4 -> 5. Hoàn thành và báo cáo một đợt trước khi chuyển đợt tiếp theo.
