# Quan hệ xã hội — Kế hoạch chi tiết giai đoạn 2

Ngày lập: 30-09-2026. Trạng thái cập nhật: đã triển khai mã nguồn 4 đợt; chưa hoàn tất kiểm chứng tự động và gameplay. Xem báo cáo từng đợt và tổng kết giai đoạn 2.

## 1. Mục tiêu và phạm vi

Giai đoạn 1 đã tách API điểm/ràng buộc, sửa vai trò tương tác và bổ sung validator save. Giai đoạn 2 xây dựng điều kiện hình thành quan hệ và kiểm soát tốc độ tích lũy tương tác.

Kết quả mong muốn:

1. Đạo lữ cần đủ điều kiện ở cả hai phía, không hình thành giữa họ hàng gần.
2. Sư đồ có sự chấp nhận của trò, một sư phụ đang hoạt động cho mỗi trò và giới hạn đồ đệ.
3. Kết nghĩa được xác nhận hai phía, không sinh ra từ một lần đổi nhãn một chiều.
4. AI chủ động, gặp gỡ tự nhiên và giao lưu cộng đồng dùng cùng cơ chế cooldown.
5. Tấn công/chứng kiến không tạo vô hạn điểm âm và ký ức theo mỗi đòn.
6. Cooldown tồn tại qua save/load và không lọt sang thế giới mới; điều kiện được trình bày rõ trong Inspector.

Không triển khai trong giai đoạn này: chia tay/đoạn tuyệt, hệ thống tang chế mới, tự sửa ràng buộc lịch sử mơ hồ, nối cứu mạng vào combat, chuỗi nhiệm vụ xã hội, thay quy tắc sinh sản, sửa tư chất/thiên phú/tính cách khi tạo dân cư.

Các giá trị ở mục 3 là **đề xuất khởi điểm**, cần xác nhận qua cân bằng gameplay. Không mô tả chúng là quy tắc hiện có.

## 2. Điểm xuất phát đã đọc từ mã nguồn

| Tệp | Hiện trạng liên quan |
|---|---|
| `src/modules/social/RelationshipService.ts` | Đạo lữ kiểm tra hảo cảm phía đề xuất 75; thầy kiểm tra hảo cảm 45; chưa giới hạn số đồ đệ |
| `src/modules/social/SocialComponents.ts` | Quan hệ có điểm và ngày/tick; friend có thể tự đổi thành sworn_brother khi hảo cảm 70 |
| `src/modules/social/SocialInteractionSystem.ts` | Quét mỗi 1,8 giây; nhiều tương tác có xác suất; chưa có cooldown cặp; combat có thể ghi theo mỗi đòn |
| `src/modules/ai/brain/behavior/BehaviorTree.ts` | Hoàn thành giao tiếp tăng điểm bằng đường riêng |
| `src/modules/factions/FactionSystem.ts` | Giao lưu cộng đồng tăng điểm bằng đường riêng |
| `src/modules/ai/brain/planner/AIPlanner.ts` | Chọn người quen/gần nhất; chưa xét cooldown chung |
| `src/modules/beings/FamilyComponent.ts` | Có parentIds để truy vết cha mẹ |
| `src/modules/beings/ReproductionSystem.ts` | Kiểm tra quan hệ đạo lữ đối ứng; phải giữ tương thích |
| `src/core/TimeManager.ts` | 20 ticks/giây, 400 ticks/ngày; có calendarDaysAtTick hỗ trợ lịch save cũ |
| `src/modules/save/SaveManager.ts` và `SocialSaveCodec.ts` | Đã kiểm tra cấu trúc quan hệ/ký ức, chưa có schema cooldown |
| `src/ui/InspectorPanel.ts` | Hiển thị loại quan hệ, điểm và ký ức; chưa giải thích điều kiện hình thành |

Giai đoạn 1 chưa được kiểm chứng bằng test tự động/gameplay trong các lượt triển khai trước. Cần đưa các tình huống nền tảng vào tiêu chí nghiệm thu giai đoạn 2.

## 3. Quy tắc thiết kế đề xuất

### 3.1. Điều kiện chung

- Người tham gia tồn tại, có HealthComponent và còn sống (không chỉ kiểm tra isDead, phải kiểm tra current > 0).
- Không tự tạo quan hệ với chính mình; chỉ cư dân có dữ liệu xã hội hợp lệ được tham gia.
- Evaluator chỉ đọc dữ liệu; không gọi residentPreferences để ngầm sinh tính cách, không tạo bản ghi, không tiêu thụ RNG hoặc cooldown.
- Mọi điều kiện phải được kiểm tra lại ở API ghi. Không coi điều kiện đã kiểm tra tại giao diện/AI là đủ.
- Quan hệ đang hoạt động là ràng buộc có loại đối ứng, người đối ứng tồn tại và còn sống. Bản ghi lịch sử vẫn được giữ.
- Bản ghi đặc biệt một chiều giữa hai người đang sống trả về existing_bond_conflict; không tự sửa.
- Không cho tạo ràng buộc khác với họ hàng gần, kể cả khi nhãn xã hội bị thiếu.
- Không thêm điều kiện theo chủng tộc, giới tính, thiên phú hoặc tính cách. Đặc điểm ngẫu nhiên đã được người dùng yêu cầu vẫn giữ nguyên.

### 3.2. Đạo lữ

| Điều kiện | Đề xuất |
|---|---|
| Tuổi | Cả hai >= 18 |
| Hảo cảm | Cả hai >= 75 |
| Tin tưởng | Cả hai >= 60 |
| Giao lưu thành công | Cả hai >= 5; dùng interactionsCount hiện có, chưa có loại bộ đếm riêng |
| Độc quyền | Không có đạo lữ đang hoạt động khác |
| Huyết thống | Không cha mẹ/con, anh chị em cùng cha hoặc mẹ, ông bà/cháu, anh chị em họ cùng ông/bà |
| Xác suất | Giữ 25% mỗi lần đủ điều kiện và hết cooldown |

Đồng thuận ở giai đoạn này được mô hình hóa bằng điều kiện hai phía, chưa có hội thoại đề nghị/chấp nhận nhiều bước. Hảo cảm 90/20 không đủ để hình thành đạo lữ.

Huyết thống: tập tổ tiên tối đa 2 thế hệ + quan hệ cha mẹ/con trực tiếp + nhãn kin_parent/kin_child làm bằng chứng bổ sung. Chặn nếu hai tập tổ tiên giao nhau hoặc một người thuộc tổ tiên của người kia. Bỏ qua ID không còn truy vết được, không coi thiếu dữ liệu là chứng cứ huyết thống. Chống vòng lặp bằng visited set. Ghi rõ hạn chế khi ông bà đã bị xóa và không còn dữ liệu truy vết.

Không thay điều kiện sinh sản, giới tính sinh học hoặc chủng tộc của ReproductionSystem. Tạo đạo lữ không đồng nghĩa cặp đó có thể sinh con.

### 3.3. Sư đồ

- Giữ thầy stageIndex >= 1, trò stageIndex = 0; không mở rộng hệ thống cảnh giới trong đợt này.
- Thầy với trò: hảo cảm >= 45, tin tưởng >= 50.
- Trò với thầy: hảo cảm >= 30, tin tưởng >= 50, kính trọng >= 60.
- Mỗi trò tối đa 1 sư phụ đang hoạt động; mỗi thầy tối đa 3 đồ đệ đang hoạt động.
- Họ hàng gần không chuyển nhãn huyết thống thành sư đồ; mô hình một nhãn/cặp hiện chưa biểu diễn được đồng thời hai vai trò.
- Giữ xác suất 15% mỗi lần đủ điều kiện và hết cooldown.
- Chỉ điểm dùng ràng buộc đối ứng, người sống và cooldown; giữ mức EXP hiện có.
- Khi trò đã đột phá, quan hệ sư đồ vẫn tồn tại; stageIndex = 0 chỉ là điều kiện lúc hình thành.

### 3.4. Kết nghĩa

- Bỏ chuyển tự động friend -> sworn_brother trong updateOrdinaryLabel.
- Tạo API formSwornBond kiểm tra cả hai phía: hảo cảm >= 70, tin tưởng >= 60, interactionsCount >= 5, người sống và không xung đột ràng buộc được bảo vệ.
- Đề xuất xác suất 15% mỗi lần đủ điều kiện và hết cooldown.
- Họ hàng gần giữ quan hệ gia đình, không bị đổi nhãn.
- Tạo hai bản ghi sworn_brother cùng ngày; đề xuất không cộng điểm thưởng mới để tránh vòng tăng điểm thêm.
- Không chuyển hàng loạt quan hệ sworn_brother cũ. Giữ bản ghi lịch sử; kết nghĩa mới phải qua dịch vụ.
- Cứu mạng vẫn chỉ tăng điểm/ký ức; không tự lập ràng buộc kết nghĩa.

### 3.5. Cooldown bằng thời gian mô phỏng

| Kênh | Thời gian đề xuất | Quy tắc khóa |
|---|---:|---|
| Giao tiếp tăng điểm | 1 ngày | Cặp không có hướng; AI, proximity và cộng đồng dùng chung |
| Chữa thương | 3 ngày | Cặp không có hướng, tối đa một đan/lượt |
| Chỉ điểm | 10 ngày | Cặp thầy/trò |
| Thử tạo đạo lữ/sư đồ/kết nghĩa | 30 ngày | Một khóa đề nghị ràng buộc chung cho cặp |
| Điểm do bị tấn công | 1 ngày | Có hướng: nạn nhân -> người tấn công |
| Điểm do chứng kiến | 1 ngày | Có hướng: nhân chứng -> người tấn công |
| Ký ức tấn công/chứng kiến | 3 ngày | Có hướng; dùng kênh riêng với điểm |

Đây là đơn vị ngày trong game: 1 ngày hiện bằng 20 giây ở tốc độ 1x; 30 ngày bằng 600 giây. Pause không trôi cooldown, tăng tốc chỉ làm mô phỏng đi nhanh hơn. Dùng calendarDaysAtTick(world.timeState, world.getCurrentTick()) cho ngày liên tục; không dùng Date.now, không chia tick save cũ trực tiếp bằng hằng số của nhịp ngày hiện tại.

Khóa chỉ ghi sau tương tác thành công. Riêng đề nghị ràng buộc: khi đủ điều kiện và đã tiêu thụ lần thử RNG, ghi khóa dù RNG không tạo được; tránh thử 25% mỗi 1,8 giây. Không đủ điều kiện không tiêu thụ RNG hoặc ghi khóa. API tạo thành công phải tự ghi khóa để caller khác không bỏ qua.

Tấn công vẫn gây sát thương bình thường trong cooldown. Chỉ hạn chế điểm xã hội/ký ức; đòn đầu tiên phản ứng ngay. Các kênh tấn công và chứng kiến tách biệt, nhưng cùng loại ký ức bị giới hạn theo cặp để tránh nhân đôi từ hai đường.

## 4. Kiến trúc và dữ liệu

Tệp mới đề xuất:

- `src/config/social.config.ts`: ngưỡng, thời gian, xác suất; không rải số cân bằng trong hệ thống.
- `src/modules/social/RelationshipRules.ts`: evaluator thuần, kiểm tra huyết thống và số ràng buộc đang hoạt động.
- `src/modules/social/SocialInteractionService.ts`: cổng ghi tương tác thường, khóa cooldown và kết quả performed/skipped.

Mở rộng SocialRelationshipComponent bằng ledger cooldown không phụ thuộc sự tồn tại bản ghi quan hệ. Đề xuất lưu theo key (targetId, channel), giá trị expiresAtDay, schemaVersion = 1. Kênh không có hướng chỉ ghi ở component của ID nhỏ hơn; kênh có hướng lưu ở người nhận tác động. Mọi caller dùng helper dựng key, không tự nối chuỗi.

Không tạo relationship chỉ để ghi một lần thử thất bại. Chỉ serialize khóa chưa hết hạn; component phải dọn khóa hết hạn định kỳ để tránh tăng bộ nhớ theo số cặp từng gặp. Lưu khóa trong component giúp stagingWorld/save/load dùng cùng dữ liệu và không cần singleton dùng chung thế giới.

Evaluator trả kết quả đủ điều kiện hoặc danh sách reason codes ổn định; API ghi dùng cùng evaluator và trả lý do từ chối. Reason code ví dụ: underage, insufficient_mutual_affinity, insufficient_trust, insufficient_respect, insufficient_interactions, close_kin, companion_unavailable, master_capacity_reached, already_has_master, existing_bond_conflict, participant_unavailable, cooldown_active.

## 5. Các đợt triển khai

### Đợt 1 — Cấu hình và điều kiện hình thành

| Công việc | Tệp | Hoàn thành khi |
|---|---|---|
| G2.1.1 Tập trung cấu hình | social.config.ts (mới) | Có đủ ngưỡng/xác suất/thời gian đề xuất, tên đơn vị rõ |
| G2.1.2 Viết kiểm tra huyết thống | RelationshipRules.ts (mới), FamilyComponent.ts (đọc) | Hai chiều, 2 thế hệ, chịu thiếu dữ liệu và vòng lặp |
| G2.1.3 Đếm ràng buộc đang hoạt động | RelationshipRules.ts | Chỉ tính cặp đối ứng sống; không tính lịch sử vào sức chứa |
| G2.1.4 Viết evaluator đạo lữ/sư đồ/kết nghĩa | RelationshipRules.ts | Thuần đọc, trả reason codes, đủ cả hai phía |
| G2.1.5 Áp điều kiện vào API ghi | RelationshipService.ts | Caller trực tiếp cũng chịu đủ điều kiện; từ chối không tạo bản ghi/điểm/ký ức |
| G2.1.6 Tách kết nghĩa khỏi ngưỡng tự động | SocialComponents.ts, RelationshipService.ts | API mới tạo hai phía; updateOrdinaryLabel không tự lập kết nghĩa |

Giữ các caller hoạt động với API hiện có; chưa đổi xác suất thành công hay thêm UI ở đợt này. Không thay hàng loạt dữ liệu save cũ.

### Đợt 2 — Cooldown chung và dữ liệu lưu

| Công việc | Tệp | Hoàn thành khi |
|---|---|---|
| G2.2.1 Ledger và clock helper | SocialComponents.ts, SocialInteractionService.ts (mới) | Kênh có/không hướng đúng; biên now == expires cho phép |
| G2.2.2 Cổng giao tiếp chung | SocialInteractionService.ts | Check trước ghi; performed/skipped; cập nhật mỗi phía độc lập |
| G2.2.3 Nối các đường tăng điểm | SocialInteractionSystem.ts, BehaviorTree.ts, FactionSystem.ts | Không tăng hai lần khi cùng cặp được nhiều hệ thống xét |
| G2.2.4 Giới hạn chữa thương/chỉ điểm | SocialInteractionSystem.ts | Cooldown không tiêu đan, tăng EXP hoặc tạo ký ức giả |
| G2.2.5 Thêm codec cooldown | SocialSaveCodec.ts, SaveManager.ts | Khóa chưa hết hạn round trip; save cũ không có ledger dùng rỗng |
| G2.2.6 Dọn ledger và reset | SocialComponents.ts, SocialInteractionSystem.ts, Engine.ts | Không giữ khóa hết hạn; reset timer quét khi đổi thế giới |

Kiểm tra ledger: schema, channel, target ID hợp lệ và khác self, không trùng key, expiresAtDay hữu hạn không âm. Khóa đối tượng lịch sử được phép tồn tại tới lúc hết hạn. Save mới phải có validator ngay trong đợt 2, không để gameplay tạo dữ liệu chưa kiểm tra tới đợt cuối.

### Đợt 3 — Lựa chọn tương tác và chống lặp chiến đấu

| Công việc | Tệp | Hoàn thành khi |
|---|---|---|
| G2.3.1 Tích hợp lần thử ràng buộc | SocialInteractionSystem.ts, RelationshipService.ts | Một RNG/kênh/cặp hết cooldown; thất bại không phát sự kiện thành công |
| G2.3.2 Giữ luồng fallback | SocialInteractionSystem.ts | Bị khóa/từ chối có thể xét tương tác khác; thành công một hoạt động thì kết thúc lượt |
| G2.3.3 Xử lý kết nghĩa mới | SocialInteractionSystem.ts | Đặt sau đạo lữ/sư đồ, trước chat; không cướp lượt bái sư |
| G2.3.4 AI chọn người phù hợp | AIPlanner.ts, BehaviorTree.ts | Không lập kế hoạch tăng điểm liên tục với cặp bị khóa; vẫn có thể vui chơi hồi recreation |
| G2.3.5 Giới hạn điểm/ký ức combat | RelationshipService.ts, SocialInteractionSystem.ts, CombatSystem.ts | Đòn đầu phản ứng; đòn lặp trong cửa sổ không tăng count/điểm/ký ức tiếp |
| G2.3.6 Kiểm tra thứ tự và bán kính | SocialInteractionSystem.ts | Có/không SpatialGrid dùng điều kiện khoảng cách thực <= 55; đổi ID không đổi điều kiện |

AI đang nghỉ với người bị cooldown không bị đánh dấu thất bại chỉ vì không được cộng điểm; tách hoàn thành hoạt động và phần thưởng điểm. Tiếp tục giữ thiên phú/tính cách đã sinh ngẫu nhiên.

### Đợt 4 — Inspector, tài liệu và nghiệm thu

| Công việc | Tệp | Hoàn thành khi |
|---|---|---|
| G2.4.1 Trình bày điều kiện | InspectorPanel.ts, RelationshipRules.ts | Hiển thị hai chiều, lý do chưa đủ, cooldown còn lại bằng ngày; evaluator không có side effect |
| G2.4.2 Lời thoại và nhật ký | SocialInteractionSystem.ts | Thành công có sự kiện đúng vai; từ chối/khóa không spam nhật ký |
| G2.4.3 Phân biệt đối tượng lịch sử | InspectorPanel.ts | Nhân vật đã mất không được hiển thị như ràng buộc đang hoạt động; nút xem phù hợp đối tượng còn tồn tại |
| G2.4.4 Tài liệu triển khai | docs/QUAN_HE_XA_HOI_GIAI_DOAN_2_DOT_*.md | Ghi thay đổi, giá trị thực dùng và giới hạn chưa làm |
| G2.4.5 Kiểm chứng | Các tình huống ở mục 6 | Ghi bằng chứng từng nhóm; không kết luận từ build đơn lẻ |

Đợt 4 không tự sửa dữ liệu quan hệ lịch sử hoặc triển khai góa phụ/đoạn tuyệt. Chỉ làm rõ trạng thái đối tượng và điều kiện hình thành.

## 6. Ma trận nghiệm thu dự kiến

Đây là danh sách cần kiểm chứng khi triển khai; chưa thêm hoặc chạy test trong lượt lập kế hoạch. Nếu người dùng yêu cầu kiểm thử/nghiệm thu, bổ sung `tests/social-relationship-regression.ts` và đăng ký `tests/run.mjs`, sử dụng fixtures với quan hệ/điểm cấu hình rõ, không dựa vào RNG tình cờ.

| Nhóm | Tình huống | Kết quả cần đạt |
|---|---|---|
| Đạo lữ | Hảo cảm 90/20 | Từ chối, không thay dữ liệu |
| Biên | 74/75; 75/75, trust 59/60; tuổi 17/18 | Đúng biên từng điều kiện |
| Huyết thống | Cha/con, cùng mẹ, ông/cháu, chung ông bà, người lạ | Chặn họ gần; người lạ không bị chặn sai |
| Dữ liệu thiếu | parentIds thiếu/ID đã xóa/chu trình tổ tiên | Không crash; giới hạn truy vết rõ |
| Sư đồ | Thầy đủ, trò không kính trọng; trò có thầy; thầy có 3 trò | Từ chối đúng lý do |
| Sư đồ cũ | Trò đột phá sau bái sư | Ràng buộc/chỉ điểm không bị xóa vì điều kiện hình thành |
| Kết nghĩa | Một phía đạt 70 hoặc friend tự tăng qua 70 | Không tạo kết nghĩa một chiều |
| Ràng buộc | Có nhãn bảo vệ trái với phía còn lại | Từ chối ghi đè, không cộng thưởng |
| Cooldown | AI + proximity + cộng đồng cùng cặp | Một lần cộng điểm trong 1 ngày |
| Đồng hồ | pause, tốc độ 1x/5x, trước/đúng hạn, lịch cũ | Cùng mốc mô phỏng cho cùng kết quả |
| RNG | Thử đủ điều kiện thất bại rồi quét lại | Không thử tiếp trong 30 ngày |
| Chữa thương | Bị khóa hoặc không tiêu được đan | Không mất đan, hồi HP, tăng điểm hay thêm ký ức |
| Combat | Nhiều đòn/người chứng kiến | Sát thương giữ nguyên; điểm/ký ức tuân cửa sổ riêng |
| Save/load | Nạp giữa cooldown; khóa hết hạn; save cũ thiếu ledger | Không reset thời gian chờ; mặc định rỗng đúng |
| Save lỗi | Trùng key, NaN, channel sai, self ID | Từ chối trước commit; thế giới đang chơi giữ nguyên |
| Reset | Thế giới mới tái sử dụng ID | Không kế thừa cooldown/timer cũ |
| Tích hợp | Đạo lữ được sinh sản, sư đồ chỉ điểm, người chết trong lịch sử | Không hồi quy điều kiện đối ứng và lọc người sống |
| UI | Mở Inspector nhiều lần | Không thay điểm, count, tính cách, ledger hoặc RNG |

Kiểm chứng đề xuất: build + diff check; test tự động khi được yêu cầu; gameplay quan sát cặp cư dân, đổi tốc độ, save/load, tạo thế giới mới. Báo riêng bằng chứng tự động và bằng chứng trực tiếp.

## 7. Điều kiện kết thúc giai đoạn

- Tất cả đường tạo ràng buộc dùng cùng evaluator và API ghi.
- Không hình thành đạo lữ/kết nghĩa mới một chiều; giới hạn sư đồ được áp dụng ở API.
- Không có đường tăng điểm gameplay bỏ qua cooldown tương ứng.
- Các trạng thái mới được lưu/nạp/kiểm tra và không rò sang thế giới mới.
- Giao diện phản ánh quy tắc thực và không gây side effect.
- Ghi rõ ma trận đã kiểm chứng và phần chưa kiểm chứng. Build xanh chỉ xác nhận khả năng biên dịch.

Thứ tự phụ thuộc: đợt 1 -> đợt 2 -> đợt 3 -> đợt 4. Mỗi đợt hoàn thành và cập nhật báo cáo trước khi sang đợt tiếp theo.
