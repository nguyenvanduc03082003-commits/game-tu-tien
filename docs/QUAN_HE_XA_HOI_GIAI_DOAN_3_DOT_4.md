# Quan hệ xã hội — Giai đoạn 3, đợt 4

Ngày: 30-09-2026. Trạng thái: triển khai mã; chưa kiểm thử tự động hoặc gameplay.

## 1. Bằng chứng cứu mạng

RescueEvidenceService lưu dữ liệu trên SocialRelationshipComponent của người bị đe dọa. Không sửa nghĩa EncounterTracker của hệ thống trưởng thành vì dữ liệu trao đổi chiến đấu không đủ chứng minh nguy hiểm/cứu mạng.

- Mỗi đòn gây sát thương cập nhật snapshot HP sau đòn đánh, độc lập cooldown điểm xã hội; chỉ ghi người còn sống có xã hội với HP tối đa hữu hạn > 0 và tỷ lệ HP <= 35%.
- Đòn mới khi HP trên ngưỡng loại snapshot nguy hiểm chưa giải quyết của cùng kẻ địch.
- Trước đòn kết liễu, chụp targetEntityId của kẻ địch; nếu mục tiêu đang nguy hiểm thì ghi bằng chứng dù chưa có đòn đánh gần đây. Sau đó chụp các bằng chứng của kẻ địch đó còn hạn.
- Bằng chứng từ sát thương có hiệu lực tối đa 1 ngày (20 giây ở 1x). Chỉ chọn mục tiêu khi chụp đòn kết liễu hoặc có sát thương thực tế gần đây mới đủ; ở gần/chung phe/hạ người bất kỳ không đủ.
- Kẻ địch có thể là cư dân hoặc động vật có HealthComponent. Người giúp/người nhận phải sống và có component xã hội.

## 2. Điều kiện giải quyết

CombatSystem xác nhận HP trước đòn > 0 và sau đòn bằng 0, đánh dấu chết, rồi resolve bằng chứng với đúng người ra đòn kết liễu. Người giúp khác người được cứu và kẻ địch; không ghi resolution tự cứu.

Claim yêu cầu đúng episode, đúng rescuer, chưa claimed, threat đã chết, tỷ lệ nguy hiểm hợp lệ và resolution tại chính tick hiện tại. Khoảng cách người nhận–người giúp <= 180. Điều kiện vị trí và mối đe dọa được xét trong tick giải quyết; không cho đi tới xác địch ở tick sau để nhận thưởng muộn.

Chặn thưởng nếu còn kẻ sống đang target người nhận hoặc còn bằng chứng sát thương nguy hiểm chưa giải quyết, chưa hết hạn từ kẻ sống khác. Đây là kiểm tra thận trọng: kẻ vừa gây sát thương nguy hiểm vẫn được coi là mối đe dọa đến khi bằng chứng hết hạn, dù đã đổi mục tiêu. Không khẳng định nhận biết các đe dọa chưa có mục tiêu/bằng chứng.

## 3. Thưởng và chống lặp

- Người nhận: +70 hảo cảm, +60 tin tưởng, +40 kính trọng, clamp theo API; ký ức saved_life importance 5, emotion +95.
- Người giúp: ký ức helped importance 4, emotion +60. Không cộng thưởng quan hệ ngược hoặc XP trưởng thành mới.
- Tạo MemoryComponent nếu cần; cập nhật ngày/tick điểm theo world.
- Cooldown rescueLife có hướng người nhận -> người giúp, 30 ngày (10 phút ở 1x), độc lập communication/bondAttempt/combatMemory.
- Sau toàn bộ kiểm tra, ghi claimed/cooldown/điểm/ký ức trong cùng đường đồng bộ. Từ chối không ghi claimed hoặc cooldown. Resolution vẫn ghi nhận kẻ địch thực sự đã chết; không chuyển bằng chứng đó thành lần cứu mới.
- Không tự kết đạo lữ/kết nghĩa; các điều kiện hình thành trước đây tiếp tục áp dụng.
- Hàm handleRescueLife cũ nhận hai nhân vật và thưởng vô điều kiện đã được thay bằng API yêu cầu evidenceEpisodeId, trả awarded/rejected. Caller gameplay là đường CombatSystem resolveRescueKill.

## 4. Giới hạn và save

- Tối đa 8 mục gần nhất mỗi người, dọn quá hạn trong nhịp quét xã hội, khi ghi/chụp/claim và khi serialize.
- EpisodeId rescue:owner:counter, bộ đếm lưu trên component; không static Map, không dùng giờ máy tính.
- Save social.rescue schemaVersion 1 gồm counter và các entry snapshot, resolution day/tick, rescuerId, claimed.
- Validator trước staging kiểm tra giới hạn, ID chủ thể/threat, tỷ lệ HP, ngày, tick, kiểu claimed, episode duy nhất và bộ đếm, resolution phải sau snapshot trong hạn 1 ngày; không nhận self-rescue hay resolution thiếu rescuer.
- SaveManager sao chép entry khi nạp; save cũ thiếu rescue mặc định rỗng/counter 0. Nạp/reset không tự phát thưởng hoặc sự kiện cứu mạng.
- Bằng chứng đã claimed có thể bị dọn; cooldown vẫn tồn tại đủ 30 ngày và bằng chứng bị xóa không còn để claim lại.

## 5. Tệp

| Tệp | Công việc |
|---|---|
| src/modules/social/RescueEvidenceService.ts | Ghi snapshot, chụp ứng viên, resolve kill, claim và dọn |
| src/modules/social/SocialComponents.ts | Kiểu và dữ liệu evidence/counter |
| src/modules/social/SocialCooldown.ts | Kênh rescueLife có hướng |
| src/config/social.config.ts | Thời gian chờ cứu mạng |
| src/modules/combat/CombatSystem.ts | Hook mỗi đòn và đòn kết liễu |
| src/modules/social/SocialInteractionSystem.ts | Dọn evidence, thay hàm thưởng vô điều kiện |
| src/modules/social/SocialSaveCodec.ts | Serialize và validate rescue |
| src/modules/save/SaveManager.ts | Nạp rescue |
| src/ui/SocialRelationshipInspector.ts | Hiển thị cooldown cứu mạng trong chi tiết |

## 6. Xác nhận

Build production sau sửa cuối thành công (163 module); cảnh báo chunk > 500 KB hiện hữu. Diff check các tệp nguồn được sửa thành công. Chưa thêm/chạy test, chưa kiểm tra trình duyệt hoặc save roundtrip. Không xem build là bằng chứng đã xác nhận thưởng trong ván chơi.

Các trường hợp cần kiểm chứng runtime khi có yêu cầu: HP đúng 35%, snapshot đúng 1 ngày, bán kính đúng 180, kẻ địch thứ hai còn sống, tự cứu, hai người giúp, nhiều người nhận, cooldown hai hướng, save/load trước và sau claim, evidence bị dọn và reset sang thế giới mới.

Đợt 5 còn lại: giao diện lịch sử/nguyên nhân đầy đủ và tổng kết giai đoạn.
