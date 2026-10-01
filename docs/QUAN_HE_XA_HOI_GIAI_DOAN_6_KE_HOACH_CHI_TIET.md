# Quan hệ xã hội — Kế hoạch chi tiết giai đoạn 6

Ngày lập: 01-10-2026. Trạng thái: **đã triển khai các đợt 1–5, có browser smoke UI/load đợt 5; chưa chạy đối chứng G6/parity và roundtrip progress mới**. Báo cáo: [đợt 1](QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_1.md), [đợt 2](QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_2.md), [đợt 3](QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_3.md), [đợt 4](QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_4.md), [đợt 5](QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_5.md).

## 1. Mục tiêu và căn cứ

Giai đoạn 6 đề xuất hoàn thiện **hiệu quả xử lý, khả năng tích lũy tín nhiệm và nhịp giao lưu trong đời sống thực tế**, dựa trên [nghiệm thu giai đoạn 5](QUAN_HE_XA_HOI_GIAI_DOAN_5_NGHIEM_THU_2026-10-01.md).

| Bằng chứng giai đoạn 5 | Ý nghĩa | Hướng xử lý |
|---|---|---|
| 79,96–81,35% lời gọi hội thoại tích hợp bị từ chối vì khoảng cách | Cộng đồng quét quá nhiều cặp không thể giao tiếp | Lọc gần và cooldown trước gọi; đo số cặp xét và chi phí |
| Cụm rảnh có bạn ngày 23–36, ràng buộc ngày 59–92 | Hệ thống có thể phát triển quan hệ trong điều kiện thuận lợi | Giữ làm đối chứng, tránh tăng tốc mọi trường hợp |
| Cụm bận không có ràng buộc sau 180 ngày; neutral không tăng trust | Gặp thường xuyên chưa tạo đường tích lũy tín nhiệm đủ rộng | Đề xuất tín nhiệm từ nhiều cuộc gặp trung tính thực sự hoàn tất |
| AI tích hợp có bạn đầu ngày 57/60; một seed chưa có bạn sau 60 ngày | Cơ hội giao lưu cạnh tranh với nhu cầu sống | Đo thời gian theo goal và lý do hủy plan trước sửa ưu tiên |
| 17 nhóm hồi quy đạt, có save/browser evidence | Có nền bảo vệ hành vi và đối chứng | Mở rộng hồi quy, giữ các invariant cũ |
| Chưa có baseline toàn Engine nhiều chủng tộc và dài hạn | Chưa đủ kết luận cân bằng phổ quát | Bổ sung đo tích hợp đầy đủ và kiểm tra gameplay trực tiếp |

Các số trên là kết quả lần nghiệm thu đã lưu, không phải kết quả chạy mới trong lượt lập kế hoạch này. Ngày game vẫn là 400 tick/20 giây ở 1x. Không dùng phút chạy máy để thay ngày mô phỏng.

## 2. Phạm vi và nguyên tắc

- Giữ ba mẫu rải dân: nhân tộc, yêu tộc, ma tộc; đặc điểm lúc tạo vẫn ngẫu nhiên. Không mặc định tính cách theo chủng tộc.
- Không mở thêm gossip, danh vọng, gia phả, hôn lễ, chiến tranh mới hoặc nghề/trang bị trong giai đoạn này.
- Không giảm ưu tiên tránh nguy hiểm, tự vệ, đói/khát cấp thiết hoặc chăm trẻ chỉ để tăng quan hệ.
- Không tạo điểm/ký ức từ preview, chọn đối tượng, lọc cặp, xem UI hoặc hội thoại từ chối.
- Giữ cùng gate kiểm tra cuối lúc commit; lọc sớm không đủ chứng minh lúc thực hiện vẫn hợp lệ.
- Đợt tối ưu và đợt cân bằng có đối chứng riêng. Không thay nhiều nhóm thông số trong một lần đo.
- Những thông số mới ở mục 4 là **cấu hình thử nghiệm đề xuất**, chưa phải giá trị được nghiệm thu.
- Giữ working tree hiện có. Mỗi đợt cập nhật báo cáo riêng, ghi thay đổi hành vi, lệnh thực sự chạy và giới hạn chứng cứ.

## 3. Thiết kế tối ưu cộng đồng

### 3.1. Bảo toàn điều kiện lập thôn

`FactionSystem.ts` hiện gom cụm trong phạm vi 180 từ người khởi xướng và dùng quan hệ đủ điều kiện để lập thôn. Khi chưa có bằng chứng quan hệ, hệ thống gọi hội thoại cho mọi cặp trong cụm, trong khi hội thoại chỉ cho phép khoảng cách 55.

Chỉ tối ưu đường hội thoại của cụm. Giữ cách tìm người sáng lập, bầu trưởng thôn, kiểm tra quan hệ và điều kiện tài nguyên. Không biến bán kính hội thoại thành bán kính lập thôn.

### 3.2. Bộ lọc sớm và tránh gọi trùng

Đề xuất service mới `src/modules/social/CommunityConversationService.ts`:

1. Nhận danh sách thành viên cụm theo thứ tự hiện có, chỉ lấy cặp trong cụm.
2. Nếu có grid, query gần bằng `SOCIAL_CONFIG.conversation.maxDistance`; kiểm tra lại vị trí hiện tại của world. Nếu không có grid, dùng fallback theo cặp trong cụm.
3. Sắp cặp theo thứ tự cũ để giữ thứ tự commit; không tiêu RNG trong bộ lọc.
4. Loại cặp có khoảng cách >55 hoặc communication cooldown >0 trước `performConversation`.
5. Ghi nhận cặp đã xét trong **một lượt quét cộng đồng**, tránh cùng cặp bị gọi từ các cụm chồng lấn. Bộ nhớ này hết hạn cuối lượt, không lưu save, không chặn nguồn casual/cultivation.
6. Luôn dùng `performConversation` cho commit cuối; participant/unsafe/context/decline kiểm tra theo contract hiện có.

Nếu grid không chứa người ở trong nhà, không coi grid tự động tương đương fallback. Đợt 1 phải xác lập chính sách và đường bổ sung cho thành viên cụm bị grid bỏ qua; chưa thêm khả năng giao tiếp xuyên nhà/tường. Khi không chứng minh dữ liệu grid đầy đủ, dùng fallback cho phần thiếu hoặc cả cụm.

Không đặt trần số cuộc hội thoại mỗi tick trong đợt tối ưu đầu vì việc bỏ cặp hợp lệ sẽ thay nhịp gameplay. Nếu cụm đông vẫn quá tải, thiết kế budget + hàng đợi công bằng thành thay đổi riêng với bằng chứng chống bỏ đói.

### 3.3. Metric không bị hiểu nhầm

Theo dõi riêng: số cặp đầu vào, cặp duy nhất, cặp lọc do xa/cooldown, lời gọi commit, completed và thời gian xử lý. Không đổi nghĩa `conversation:attempted`: vẫn là lần gọi service cuối. Giảm attempted sau lọc không đồng nghĩa giảm giao tiếp thực tế.

Counter runtime tiếp tục tắt mặc định, giới hạn số key/sample hiện có. Báo cáo dài hạn do harness tổng hợp, không tăng sample UI thành lịch sử vô hạn.

## 4. Đề xuất tích lũy tín nhiệm từ giao tiếp trung tính

### 4.1. Vì sao cần cơ chế riêng

Hiện warm tăng trust 1, neutral tăng 0. Tại trust 50/affinity 100, người bận có receptivity tối đa 0,625, dưới warm 0,65; người rảnh sociability <0,3 cũng có thể chưa đạt warm bằng casual. Đây là đường tiến triển cần cân bằng, không kết luận mọi nhân vật đó đều không thể có ràng buộc vì còn các kênh tương tác khác.

### 4.2. Phương án ưu tiên để thử

Tạo `SocialFamiliarityService.ts` và state tùy chọn theo **chiều quan hệ**. Đề xuất cấu hình ban đầu:

| Thông số thử | Giá trị đề xuất | Mục đích |
|---|---:|---|
| Số cuộc gặp neutral đủ điều kiện cho một lần tăng trust | 3 | Tín nhiệm tăng chậm qua tiếp xúc thực |
| Trust mỗi lần thưởng | +1 | Tránh tăng ngang warm ở từng cuộc gặp |
| Trust tối đa từ cơ chế này | 60 | Mở đường tới ngưỡng ràng buộc hiện có, không tự nâng tới 100 |
| Hảo cảm tối thiểu của mỗi bên | 10 | Chỉ tích lũy khi đã quen và hai phía không thù ghét |
| Khoảng nghỉ làm xóa tiến độ chưa hoàn thành | 10 ngày | Không cộng vô hạn các cuộc gặp quá rời rạc |

Giữ nguyên delta warm/neutral/awkward hiện tại; familiarity là delta bổ sung có điều kiện trong cùng commit. Không đổi ngưỡng companion/sworn để né bài toán trust.

Quy tắc cụ thể:

- Chỉ xét sau hội thoại completed, cả hai phía có affinity trước commit >=10; bên có outcome neutral mới tích lũy. Awkward của bên nào xóa tiến độ bên đó; warm xóa tiến độ neutral của bên đó vì đã có tăng trust riêng.
- Casual/community/cultivation dùng chung tiến độ để không nhân thưởng khi đổi context; cooldown communication hiện có vẫn dùng chung.
- Cho phép neutral hoàn tất khi bận tích lũy; không tự phát cuộc gặp trong lúc đang làm việc, không ghi điểm cho lần bị từ chối.
- Mỗi chiều tối đa ghi một lần cho cùng tick; trùng commit bị gate chặn. Clock dùng ngày/tick của đúng world.
- Nếu trust đã >=60, xóa tiến độ chưa hoàn thành và không thưởng. Nếu trust 59, thưởng tối đa tới 60; không cộng trust cho chiều khác để bảo đảm cả đôi cùng vượt ngưỡng.
- Nếu hảo cảm một bên xuống <10 tại cuộc gặp tiếp theo, tiến độ của hai phía không còn đủ điều kiện. Betrayal/death/bond-end xóa tiến độ liên quan để không thưởng lại từ chứng cứ cũ.
- Khi không gặp nhau, không tăng điểm thụ động. Hết 10 ngày xóa tiến độ lúc lần ghi tiếp theo; reader/UI chỉ tính trạng thái hiệu lực, không sửa dữ liệu.

State đề xuất: `{schemaVersion: 1, neutralCount, lastQualifiedDay, lastQualifiedTick}` trong `RelationshipRecord`; giới hạn count 0..2 cho cấu hình thử ba cuộc gặp. Không dùng `interactionsCount % 3` vì bộ đếm đó gồm các loại tương tác khác.

Thêm codec/validation/hydration cùng đợt thêm state. Trường thiếu ở save cũ bắt đầu tiến độ 0, không suy lịch sử từ interactionsCount. Từ chối NaN, day/tick sai, count ngoài cấu hình/schema không hỗ trợ trước commit world. Clone state sâu trong reader/save/history; không giữ tiến độ sống trong bondHistory nếu không cần.

Sau baseline, thử cấu hình ba cuộc gặp và chỉ đổi một tham số nếu cần. Không cam kết mọi cư dân phải có bạn đời trong thời gian cố định.

## 5. Nhịp giao lưu của AI

Đo trước khi tăng điểm utility. Mở rộng số liệu gồm thời gian mô phỏng tích lũy theo goal, số plan giao lưu bắt đầu/hoàn tất/hủy, lý do mục tiêu mất/xa/không có đường/bận/cooldown, thời gian từ chọn tới gặp. Lấy mẫu ngày chỉ dùng kiểm tra chéo, không gọi là phần trăm thời gian.

Thứ tự can thiệp:

1. Nếu có plan cũ/mục tiêu hết hợp lệ: sửa kiểm tra mục tiêu và replan, giữ cùng evaluator thực thi.
2. Nếu nhân vật an toàn/rảnh có người hợp lệ nhưng không có cơ hội gặp: đề xuất cửa sổ nghỉ/giao lưu trong nhịp schedule hiện có, có cooldown và ưu tiên thấp hơn sinh tồn khẩn cấp.
3. Nếu đa số thời gian là sinh tồn thật: báo thiếu thức ăn/nước/nghỉ; không ép giao lưu hoặc sửa tốc độ đói/khát ngoài phạm vi.

Chưa đặt số utility mới hoặc giờ tụ họp cố định. Đợt 4 chỉ chọn can thiệp có lý do được metric xác nhận. Nội dung không cần sửa ghi rõ “đã đo, giữ nguyên”. Không mở hành vi di chuyển xã hội mới cho động vật thường; yêu tộc/ma tộc dùng contract cư dân đang có.

## 6. Sáu đợt thực hiện tuần tự

### Đợt 1 — Chốt phép đo và đối chứng

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.1.1 | Inventory mọi producer hội thoại, grid và participant trong nhà | FactionSystem.ts, SocialInteractionSystem.ts, SocialConversationService.ts, SocialDecisionService.ts, SpatialGrid.ts | Bảng caller/context/clock/phạm vi/đường fallback |
| G6.1.2 | Tách lời gọi, lọc cặp, completed và thời gian goal trong metric | SocialSimulationTelemetry.ts, tests/social-integration-baseline.ts | Metric có đơn vị/mẫu số và giới hạn key rõ |
| G6.1.3 | Đầu ra riêng theo revision/config, không ghi đè số liệu G5 | tests/social-baseline.ts, tests/social-integration-baseline.ts | CLI/output G6, seed và cấu hình đầy đủ, hash nguồn |
| G6.1.4 | Lập đặc tả parity và tiến độ trust trước chỉnh nguồn | docs/QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_1.md | Baseline trước sửa hoặc ghi rõ chưa chạy |

Chưa thay cân bằng ở đợt này. Tệp chính trong bảng dùng tên ngắn; bản đồ đường dẫn đầy đủ ở mục 9.

### Đợt 2 — Tối ưu hội thoại cộng đồng, giữ hành vi

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.2.1 | Service sinh cặp gần trong cụm, fallback và thứ tự ổn định | CommunityConversationService.ts mới | Không lấy người ngoài cụm, không tiêu RNG |
| G6.2.2 | Lọc cooldown và chống gọi trùng trong một lượt quét | Service mới, FactionSystem.ts | Cache hữu hạn hết lượt; không chặn nguồn khác |
| G6.2.3 | Hook metric và commit gate cũ | Service mới, SocialSimulationTelemetry.ts | attempted giữ định nghĩa; không double count |
| G6.2.4 | So sánh baseline trước/sau tối ưu | tests/social-phase6-regression.ts mới, baseline | Completed/delta/clock/bond/faction giống đối chứng cùng seed; lời gọi ngoài phạm vi giảm |

Mục tiêu cơ học: cặp đã chắc chắn xa/cooldown không gọi commit. Mục tiêu đo tạm: giảm ít nhất 90% lời gọi out_of_range của community trên ba fixture G5; tổng thời gian không tăng có hệ thống. Mục tiêu này là gate đề xuất, không phải kết quả đã đạt. Nếu parity gameplay lệch, truy nguyên trước chuyển đợt 3.

### Đợt 3 — Tín nhiệm tích lũy và persistence

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.3.1 | Cấu hình thử và state progress có schema | social.config.ts, SocialComponents.ts | Không thay field/ngưỡng cũ; clone sâu |
| G6.3.2 | Evaluator thuần và ghi progress trong commit | SocialFamiliarityService.ts mới, SocialConversationService.ts | Skipped không ghi; delta bổ sung một lần/chiều |
| G6.3.3 | Validation/hydration/reset tương thích thiếu trường | SocialSaveCodec.ts, SaveManager.ts | Save/load giữa 2/3 cuộc gặp không mất/nhân progress |
| G6.3.4 | Xóa progress khi bằng chứng không còn hợp lệ | RelationshipService.ts, SocialDeathService.ts | Betrayal/end/death không tái thưởng từ progress cũ |
| G6.3.5 | Đối chứng trust và nhịp bond | Hồi quy G6, baseline có kiểm soát | Người ít giao tiếp/bận có đường tăng trust; không thưởng khi không gặp |

### Đợt 4 — Cơ hội giao lưu trong AI

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.4.1 | Đọc phân bố goal và vòng đời plan theo thời gian | StrategicGoal.ts, AIPlanner.ts, baseline | Phân biệt sinh tồn thật và plan bị treo |
| G6.4.2 | Sửa nhánh chọn/giữ mục tiêu lỗi nếu metric xác nhận | SocialDecisionService.ts, AIPlanner.ts, BehaviorTree.ts | Replan hợp lý, không ép nhân vật chết/xa/đang nguy hiểm |
| G6.4.3 | Thử cửa sổ nghỉ giao lưu nếu còn thiếu cơ hội | StrategicGoal.ts, schedule caller sau inventory | Không hạ ưu tiên sống; chưa có căn cứ thì giữ nguyên |
| G6.4.4 | Đối chiếu trước/sau với thông số trust đã cố định | baseline tích hợp | Báo số cơ hội/hoàn tất/hủy, tỷ lệ sống và sản xuất |

### Đợt 5 — UI và quan sát nhiều chủng tộc

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.5.1 | Giải thích tiến độ tín nhiệm bằng lời dễ hiểu | SocialRelationshipInspector.ts | Phân biệt điểm hiện tại và điều kiện dự kiến; readonly |
| G6.5.2 | Debug phân biệt cặp lọc và cuộc gặp hoàn tất | InspectorPanel.ts, telemetry | Có scope/cửa sổ dữ liệu, không hiện debug trong flow thường |
| G6.5.3 | Browser: rải ba mẫu, tính cách ngẫu nhiên, đọc UI/load | UI hiện có, SaveManager.ts | Ảnh/chứng cứ và lỗi còn lại, không tự tạo personality từ reader |
| G6.5.4 | Hỗ trợ/cứu viện/né/tang ký trực quan | Combat/Projectile/Social services hiện có | Ghi từng case đạt/chưa đạt; không suy từ câu thoại |

Không ép mọi chủng tộc có cùng số bond: điều kiện tuổi/tu luyện/cấu trúc cộng đồng khác nhau phải ghi cùng kết quả.

### Đợt 6 — Nghiệm thu dài hạn và chốt cấu hình

| ID | Công việc nhỏ | Tệp chính | Điều kiện hoàn thành |
|---|---|---|---|
| G6.6.1 | Harness hệ thống theo Engine thực tế, hoặc chạy browser Engine | tests/social-world-baseline.ts mới nếu cần, Engine.ts chỉ tham chiếu | Liệt kê system/order/update/grid/reset so với Engine; không gọi subset là toàn Engine |
| G6.6.2 | Chạy ma trận mục 7 và đo tick tuần tự | tests, docs/so_lieu | Config/seed/revision/đơn vị đầy đủ, đối chiếu cùng môi trường |
| G6.6.3 | Save/load tại progress, bond và intent giữa chừng | SocialSaveCodec.ts, SaveManager.ts | Liên tục và chia phiên cùng state quyết định; reject atomically |
| G6.6.4 | Chốt cấu hình từ số liệu | social.config.ts chỉ khi có căn cứ | Một thay đổi/lượt; không chốt giá trị thử chỉ vì build xanh |
| G6.6.5 | Báo cáo toàn diện/CSV/manifest | docs/QUAN_HE_XA_HOI_GIAI_DOAN_6_TONG_KET.md | Tách triển khai/kiểm thử/cân bằng và việc chưa làm |

## 7. Ma trận kiểm chứng và số liệu dự kiến

### Hồi quy bắt buộc khi thực hiện nghiệm thu

- Cặp 55/55,001, cooldown 399/400 tick, pause/calendar offset; grid/fallback và cặp trùng cụm.
- Nhân vật di chuyển/chết/bị đánh sau prefilter trước commit; không thưởng stale snapshot.
- Cụm có người trong nhà/ngoài grid; người ngoài cụm không được thêm vào hội thoại.
- Progress 0→1→2→thưởng, affinity 9/10, trust 59/60, outcome khác nhau hai phía, đổi context, awkward/warm và khoảng nghỉ đúng 10 ngày.
- Không tạo progress từ skipped/UI; không RNG thêm; clone độc lập; kiểm tra trùng tick.
- Save ở count 2, thiếu trường, count/schema/NaN/day/tick sai; load lỗi giữ world cũ.
- Trust từ cứu viện/quà/giảng dạy không bị familiarity cap hạ xuống; bond end/death/betrayal xóa tiến độ.
- AI đói dưới 10, khát nguy cấp, HP25%, địch đang đánh và chăm trẻ không bị giao lưu chiếm ưu tiên.
- Giữ 17 nhóm G5, tự vệ/thần dụ/hỗ trợ, melee/projectile/dodge, tang ký đúng một lần.

### Ma trận đo

| Bộ | Quy mô và thời gian | Mục đích |
|---|---|---|
| Đối chứng G5 | 3 kịch bản × 6 seed × 30 người × 180 ngày | Tách hiệu quả tối ưu và trust; thêm phân bố sociability/busy |
| Tích hợp tái lập | 3 seed × 30 nhân tộc × 60 ngày | So sánh chính xác G5 cùng điều kiện tài nguyên |
| Đời sống dài hạn | 3 seed × 3 nhóm chủng tộc × 30 người × 360 ngày | Giao lưu, tuổi, tu luyện, bond/ends/cứu viện; ghi khác biệt hệ thống |
| Nhóm hỗn hợp | 3 seed × 90 người (30 mỗi mẫu) × 180 ngày | Tương tác giữa chủng tộc; không ép hòa bình nếu logic hiện có xung đột |
| Hiệu năng | 30/100/300 người, telemetry tắt/bật, cùng seed; warmup và 3 lần đo tuần tự | mean/p50/p95/p99 tick, social/faction riêng, bộ nhớ và cặp xét |
| Tình huống dựng | Ally/enemy có bond, projectile, death; save giữa episode | Đảm bảo nhánh hiếm có bằng chứng dù baseline không tự xảy ra |

360 ngày là một năm game, không phải kiểm tra hết vòng đời; nếu không đủ già yếu thì dựng riêng case thọ nguyên. Thiếu sự kiện tự nhiên không tính là tần suất 0 trong mọi thế giới. Chủng tộc/đói/tu luyện chết sớm phải ghi censored và số ngày sống, không gọi “không có bạn” như thể sống đủ thời gian.

Đầu ra mỗi run: source/config hash, seed, archetype, số người, map/tài nguyên, systems, tick/day, snapshot, firstFriend/firstBond/firstFaction hoặc chưa quan sát, directedFriends, mutualFriendPairs, activeBondPairs, isolatedLiving, cuộc gặp theo context/outcome, lý do lọc/hủy, số bond-end/rescue/assist, thời gian goal, HP/hunger/sống/công trình. Không dùng `bondSides/2` nếu chưa xác nhận hai phía cùng episode; đếm cặp chuẩn hóa có hai phía hợp lệ.

Tạm đặt tiêu chí cân bằng: có đường trust bằng neutral trong fixture đủ điều kiện; không thưởng thụ động; không làm sống sót/sản xuất giảm có hệ thống khi tăng cơ hội xã hội. Mốc bạn/bond quan sát của G5 là đối chứng, không là thời hạn bắt buộc. Kết quả của seed chưa có sự kiện không được bỏ khỏi trung bình để làm số đẹp.

## 8. Quy trình và trạng thái

| Đợt | Phụ thuộc | Trạng thái hiện tại |
|---|---|---|
| 1. Đo và đối chứng | G5 đã nghiệm thu | Đã chạy 18 controlled + 3 integration; có hash/scope. Chưa có đối chứng G6 trước sửa toàn Engine |
| 2. Tối ưu cộng đồng | Đợt 1, parity rõ | Parity fixture ổn định/RNG và bộ lọc đạt; giảm community calls trên 99% ở ba seed. Chưa có parity optimization-only toàn Engine; faction còn nút thắt CPU |
| 3. Tín nhiệm + save | Đợt 2 đạt parity | Đã nghiệm thu progress/save 2/3/validation/reset trong bộ G6; cấu hình còn thử nghiệm; chưa so chia phiên với liên tục toàn world/RNG |
| 4. AI | Đợt 3 có baseline | Đã đo goal và kiểm tra guard mục tiêu; giữ utility. Phát hiện thiếu nhu cầu/lịch cho ma/yêu và nhánh utility giao lưu loại beast |
| 5. UI/runtime | State và nhịp đã ổn định | Browser smoke đợt 5 và HTML readonly đợt 6 đạt phạm vi đã làm; trực quan nhánh hiếm còn chờ |
| 6. Nghiệm thu | Các đợt trước và cấu hình thử cố định | Đã chạy ma trận 12 long + 18 perf, 3 mixed detail và 3 death probe, G6 17 nhóm/19 suite đạt; báo cáo/CSV/manifest đã lưu. Chưa chốt cân bằng và hiệu năng quy mô lớn |

Lượt này chỉ viết kế hoạch, không sửa gameplay, thêm hoặc chạy test. Khi triển khai: hoàn thành từng đợt tuần tự; test/đo là các việc đã mô tả cần được thực hiện khi yêu cầu nghiệm thu/xác minh hoặc thực hiện toàn bộ giai đoạn bao gồm nghiệm thu. Mỗi báo cáo chỉ ghi lệnh đã thực sự chạy. Không mở rộng sửa sinh tồn/nghề/tu luyện nếu số liệu chỉ phát hiện vấn đề ngoài phạm vi; ghi issue và phương án riêng.

Giai đoạn chỉ hoàn tất khi tối ưu đúng hành vi, progress có persistence hợp lệ, nhịp AI có căn cứ, UI readonly, ma trận nghiệm thu có chứng cứ và cấu hình được chốt từ dữ liệu. Nếu harness thiếu system hoặc browser case chưa chạy thì ghi rõ phần còn thiếu.

## 9. Bản đồ tệp

Đường dẫn trong mục này tính từ thư mục `G:\game_tu_tien`:

- Cấu hình: `src/config/social.config.ts`.
- Xã hội hiện có: `src/modules/social/SocialConversationService.ts`, `SocialInteractionGate.ts`, `SocialInteractionSystem.ts`, `SocialDecisionService.ts`, `SocialComponents.ts`, `SocialSaveCodec.ts`, `SocialSimulationTelemetry.ts`, `RelationshipService.ts`, `SocialDeathService.ts`.
- Xã hội dự kiến mới: `src/modules/social/CommunityConversationService.ts`, `src/modules/social/SocialFamiliarityService.ts`.
- Cộng đồng: `src/modules/factions/FactionSystem.ts`; grid: `src/core/SpatialGrid.ts`.
- AI: `src/modules/ai/brain/goals/StrategicGoal.ts`, `src/modules/ai/brain/planner/AIPlanner.ts`; đường dẫn BehaviorTree/schedule phải inventory ở đợt 1 trước sửa.
- Save: `src/modules/save/SaveManager.ts`; tham chiếu engine/clock: `src/core/Engine.ts`, `src/core/TimeManager.ts`.
- UI: `src/ui/SocialRelationshipInspector.ts`, `src/ui/InspectorPanel.ts`.
- Test hiện có: `tests/social-phase5-regression.ts`, `tests/social-fixture.ts`, `tests/social-baseline.ts`, `tests/social-integration-baseline.ts`, `tests/run-social.mjs`, `tests/run.mjs`.
- Test dự kiến mới: `tests/social-phase6-regression.ts`, `tests/social-world-baseline.ts` nếu cần harness riêng.
- Tài liệu từng đợt: `docs/QUAN_HE_XA_HOI_GIAI_DOAN_6_DOT_1.md` đến `DOT_6.md`; số liệu mới `docs/so_lieu/QUAN_HE_XA_HOI_G6_*`.

**Điểm bắt đầu:** đợt 1 lập inventory caller/grid và metric, lưu đối chứng G6 trước sửa. Không bắt đầu bằng tăng điểm hội thoại.
