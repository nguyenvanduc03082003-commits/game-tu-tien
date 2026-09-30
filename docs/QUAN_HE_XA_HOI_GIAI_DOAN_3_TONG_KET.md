# Tổng kết giai đoạn 3 — Quan hệ xã hội

Ngày tổng kết: 30-09-2026.

**Trạng thái cập nhật sau đợt 5: đã triển khai mã của cả 5 đợt. Chưa nghiệm thu gameplay, UI trực tiếp và save roundtrip.**

Bản đầu đối chiếu mã và kế hoạch sau đợt 4. Lần cập nhật này bổ sung giao diện/lời thoại/nhật ký của đợt 5 và kết quả build, giữ riêng phạm vi chưa kiểm chứng.

## 1. Tiến độ theo đợt

| Đợt | Phạm vi | Trạng thái |
|---|---|---|
| 1 | Lifecycle, API kết thúc/tạo lại, lịch sử, codec, sinh sản/chỉ điểm | Đã triển khai |
| 2 | Tử vong, tang chế một lần, hỗ trợ tinh thần | Đã triển khai |
| 3 | Phản bội, mâu thuẫn 30 ngày, AI/nhân chứng | Đã triển khai |
| 4 | Cứu mạng có bằng chứng, cooldown, save | Đã triển khai |
| 5 | Inspector lịch sử/ngày/lý do, giải thích cứu mạng, nhật ký/lời thoại và tài liệu | Đã triển khai mã; nghiệm thu runtime chưa thực hiện |

Đây là trạng thái công việc, không phải tỷ lệ nghiệm thu. Các nhánh runtime chưa được kiểm chứng bằng test hoặc chơi trực tiếp.

## 2. Vòng đời ràng buộc

- Metadata schema 1: episodeId, active/ended, ngày hình thành nếu có, ngày/nguyên nhân kết thúc, mốc mâu thuẫn từng phía.
- API kết thúc đạo lữ, sư đồ và kết nghĩa kiểm tra hai phía; kết thúc một lần, gọi lại không đổi ngày, lặp ký ức/nhật ký hoặc kéo dài khóa.
- Tạo lại phải đạt điều kiện hiện hành và hết khóa. Lưu snapshot cũ vào bondHistory trước thay thế, tối đa 20 mục mỗi nhân vật; mã đợt mới từ bộ đếm lưu.
- Không tự gán ngày hình thành cho save cũ hoặc sửa quan hệ một chiều không nhất quán trong đường tạo/kết thúc thông thường.
- Huyết thống và parentIds được giữ. Chỉ điểm/sinh sản cư dân dùng ràng buộc hoạt động; không đổi nhánh sinh sản động vật.

## 3. Tử vong và tang chế

- SocialDeathService chạy khi tạo/quét thi thể chưa xử lý. Kết thúc từng ràng buộc liên quan với lý do death, kể cả khi thiếu bản ghi đối ứng; không tạo đối ứng giả.
- Chụp người nhận trước kết thúc. Người thân trực hệ/đạo lữ phù hợp thuộc close_kin; kết nghĩa/sư đồ hoặc hảo cảm >= 60 thuộc friend. Người nhận phải sống.
- Ký ức bereavement importance 5, emotion -80; tiếp tục pipeline GrowthEvents hiện có, không thêm trừ tâm cảnh trực tiếp.
- Marker socialDeathProcessed trên corpse được lưu, độc lập giới hạn 40 ký ức. Save cũ có corpse thiếu marker coi đã xử lý; không phát lại tang chế hoặc tự gán ngày kết thúc mới cho thi thể cũ.
- MentalState chỉ nhận hỗ trợ từ người sống; vai đặc biệt phải hợp lệ hai phía và chưa kết thúc.

## 4. Phản bội và xa cách

- Sát thương trực tiếp dương trong CombatSystem kết thúc đạo lữ/sư đồ/kết nghĩa đang hoạt động với betrayal, trước trừ HP; cả đòn kết liễu được ghi đúng thứ tự.
- Huyết thống không bị đoạn tuyệt vì tấn công. Chứng kiến chỉ ảnh hưởng điểm/ký ức theo đường hiện có.
- Một phía affinity <= -50 và trust <= 20 liên tục 30 ngày dẫn tới estrangement. Hồi phục qua một ngưỡng xóa mốc, không cộng dồn các đoạn rời rạc.
- Quét khoảng 1,8 giây mô phỏng, dùng timestamp ngày world; không phải bộ đếm số lần quét. Có độ trễ theo nhịp quét.
- bond_ended/betrayed importance 4, emotion -60 và nhật ký kết thúc chỉ ghi khi thao tác thành công. Khóa đề nghị sau phản bội/xa cách tối thiểu 30 ngày, giữ hạn dài hơn.
- AI trợ chiến dùng active đối ứng và mục tiêu sống, tránh chọn chính mình. Giao lưu gọi bản ghi ended là bạn hữu; chôn cất phân biệt lịch sử do chết với ràng buộc chia tay.
- AI trợ chiến chưa có một ngưỡng điểm/trust bổ sung độc lập ngoài kiểm tra ràng buộc đang hoạt động. Kế hoạch có nhắc đọc điểm/trust nhưng chưa xác định ngưỡng; không coi phần này là đã có quy tắc mới.

## 5. Cứu mạng

- RescueEvidenceService ghi snapshot HP <= 35% sau đòn thật hoặc khi chụp mục tiêu hiện tại của kẻ địch trước đòn kết liễu.
- Bằng chứng sát thương hạn 1 ngày; tối đa 8 mục mỗi người. Tách khỏi EncounterTracker và cooldown điểm bị đánh.
- Đòn kết liễu xác nhận HP trước > 0, sau 0; người giúp/người nhận sống, khác nhau và khác threat, khoảng cách <= 180, không còn threat sống khác được biết.
- Threat khác gồm kẻ đang target người nhận hoặc có bằng chứng nguy hiểm chưa hết hạn. Cách xét thận trọng có thể chặn thưởng khi kẻ vừa đánh đã đổi mục tiêu; chưa có hệ truyền tin/nhận biết toàn bộ đe dọa.
- Chỉ claim trong tick giải quyết; không đến gần xác ở tick sau để thưởng muộn. Không thưởng tự cứu hoặc chỉ đứng gần/chung phe.
- Người nhận +70 affinity/+60 trust/+40 respect, ký ức saved_life importance 5/+95; người giúp ký ức helped importance 4/+60, không thêm điểm ngược/XP.
- rescueLife 30 ngày có hướng người nhận -> người giúp; claimed và cooldown chống lặp. Không tự lập ràng buộc.

## 6. Save/reset và thời gian

Codec kiểm tra lifecycle/history/counter, loại ký ức, marker corpse, evidence/resolution/claim và kênh cooldown. SaveManager nạp bằng bản sao, dữ liệu cũ thiếu trường dùng mặc định. Nạp/reset không tự phát thưởng hay sự kiện mới. Không có static Map giữ evidence qua nhiều world.

| Mốc | Quy đổi ở 1x |
|---|---|
| 1 ngày | 20 giây |
| Bằng chứng sát thương 1 ngày | 20 giây |
| Mâu thuẫn/khóa đề nghị/cooldown cứu mạng 30 ngày | 600 giây = 10 phút |

Các mốc gameplay dùng clock world; pause không tăng ngày. API ký ức hiện có vẫn dùng giờ máy tính để tạo ID/timestamp trình bày; episode và thời hạn mới dùng bộ đếm/ngày mô phỏng.

## 7. Giao diện và thông tin sau đợt 5

- Chi tiết quan hệ hiện tại hiển thị ngày hình thành từ metadata; bản ghi cũ dùng specialBondDate với nhãn ghi chép cũ hoặc nói chưa có ngày được ghi nhận.
- Bản ghi ended hiển thị ngày kết thúc và nguyên nhân qua đời/phản bội/xa cách. Người mất/bị xóa không hiển thị active.
- Khối lịch sử riêng hiển thị tối đa 20 snapshot đã lưu, sắp ngày kết thúc mới nhất trước, tên/vai trò/ngày/lý do và điểm lúc lưu. Không đối chiếu snapshot với quan hệ mới để biến lịch sử thành active.
- Bản ghi vừa kết thúc còn trong mạng lưới hiện tại; chỉ được chuyển vào bondHistory khi hình thành lại. Giao diện giải thích rõ sự khác nhau này.
- Hiển thị mốc mâu thuẫn và ngày còn lại ở từng phía nếu ràng buộc đang hoạt động, giải thích hồi phục reset mốc.
- Cứu mạng có điều kiện giải thích trong chi tiết; thời gian chờ hai chiều ghi tên người nhận/người giúp. Chữa thương/tặng đan không tự tính cứu mạng; không có cooldown không đồng nghĩa đủ bằng chứng.
- Giữ trạng thái mở chi tiết/lịch sử và vị trí cuộn bằng cơ chế refresh hiện có. Lịch sử chỉ đọc snapshot, không có nút focus vào dữ liệu cũ.
- Cứu mạng thành công phát một chronicle entry và lời cảm ơn của người được cứu; rejected hoặc evidence claimed không phát.

Phần còn lại là kiểm chứng runtime theo ma trận kế hoạch: UI hẹp/refresh, biên HP/thời gian/radius, lặp sự kiện, save/load trước/sau death và claim, readers sau kết thúc, reset world.

## 8. Bằng chứng kiểm tra

- Các lượt triển khai 1–4 đã báo build và diff check thành công; lần build cuối ở đợt 4: 163 module, JS khoảng 1.164 KB theo cách hiển thị kB của Vite, gzip khoảng 291 kB; cảnh báo chunk > 500 kB.
- Đợt 5 chạy build/diff check sau sửa UI và sự kiện. Build cuối thành công; không thêm/chạy test.
- Chưa có kiểm thử tự động của lifecycle/rescue, trình duyệt gameplay hoặc save roundtrip cho giai đoạn 3. Các build trước không thay thế bằng chứng nghiệm thu runtime.
- Marker/claim xử lý đồng bộ thông thường, chưa có transaction rollback khi callback ném lỗi bất ngờ.

## 9. Hồ sơ và tệp chính

- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_KE_HOACH_CHI_TIET.md
- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_1.md
- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_2.md
- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_3.md
- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_4.md
- docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_DOT_5.md
- src/modules/social/SocialComponents.ts, RelationshipRules.ts, RelationshipService.ts
- src/modules/social/SocialDeathService.ts, RescueEvidenceService.ts, SocialSaveCodec.ts
- src/modules/social/SocialInteractionSystem.ts, SocialCooldown.ts
- src/modules/beings/CorpseAndGraveSystem.ts, ReproductionSystem.ts
- src/modules/talent/MentalStateSystem.ts, src/modules/combat/CombatSystem.ts
- src/modules/ai/brain/goals/StrategicGoal.ts, planner/AIPlanner.ts
- src/modules/save/SaveManager.ts, src/ui/SocialRelationshipInspector.ts

## 10. Kết luận

Nền tảng lifecycle và bốn cơ chế gameplay chính đã có mã tích hợp: tử vong/tang chế, phản bội, xa cách liên tục và cứu mạng có bằng chứng. Đã triển khai đợt 5 về giao diện/hoàn thiện thông tin. Cả 5 đợt đã có mã và tài liệu; cần kiểm chứng runtime trước khi tuyên bố nghiệm thu toàn bộ giai đoạn 3.
