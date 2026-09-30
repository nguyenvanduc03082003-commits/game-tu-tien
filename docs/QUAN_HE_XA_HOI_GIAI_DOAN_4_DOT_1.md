# Quan hệ xã hội — Giai đoạn 4, đợt 1

Ngày: 30-09-2026. Trạng thái: đã triển khai nền tảng; chưa chuyển caller giao tiếp sang service mới.

## 1. Thay đổi gameplay có hiệu lực

SocialInteractionSystem: ký ức người nhận đan chữa thương mới dùng helped thay saved_life. Giữ mô tả nhận đan, importance 4/emotion 80, hồi HP, tiêu đan, điểm và cooldown chữa thương. Không đổi ký ức cũ hoặc đường cứu mạng thực tế RescueEvidenceService.

## 2. Cấu hình khởi điểm

social.config.ts có conversation, socialDecision, assistance:

- Giao tiếp phạm vi 55, nguy cấp HP <= 25%, từ chối khi một phía affinity <= -30.
- Receptivity base 0,5; trọng số sociability 0,25, affinity 0,20, trust 0,15; busyPenalty 0,20; curiosity context cultivation 0,10 quanh trung tính 0,5.
- Warm >= 0,65; awkward < 0,35; còn lại neutral.
- Điểm warm +3/+1/0, neutral +1/0/0, awkward -1/0/0; trần affinity [-2,4], trust [0,2], respect [0,1].
- Chọn AI: 12 ứng viên/bán kính 200; trọng số quan hệ 35%, receptivity 25%, khoảng cách 25%, context 15%.
- Trợ chiến affinity >= 20, trust >= 40, tự bảo toàn khi HP <= 25%, radius 180.

Các giá trị mới là cấu hình khởi điểm. Ngoài evaluator mới chưa có caller gameplay nào sử dụng; không tuyên bố AI/trợ chiến đã đổi trong đợt này. Communication cooldown 1 ngày hiện có được giữ.

## 3. Hợp đồng giao tiếp

SocialConversationService.ts định nghĩa context casual/cultivation/community, outcome warm/neutral/awkward, delta riêng mỗi phía, snapshot và result.

- evaluateConversation nhận snapshot chỉ đọc, không nhận ECSWorld hoặc gọi RNG/clock/API ghi.
- Trả eligible kèm evaluation hai phía hoặc skipped với lý do participant_unavailable, out_of_range, unsafe, cooldown_active, declined, invalid_context.
- Kiểm tra ID/sống/điểm hữu hạn và khoảng điểm, khoảng cách, tình trạng an toàn, cooldown, khả năng nói chuyện tu luyện.
- Hai phía có receptivity/outcome/delta riêng. Outcome chung dựa trung bình, không thay delta riêng bằng outcome chung.
- Context community chưa nhân thưởng. Cultivation điều chỉnh receptivity bằng curiosity, không tăng EXP.
- Contract completed chỉ dành cho commit đợt 2; hiện không có hàm performConversation, không ghi điểm/ký ức/cooldown từ evaluator.
- Snapshot available/unsafe/busy/canDiscussCultivation sẽ do reader world đợt 2 xác định tại lúc thực hiện. Không coi snapshot thủ công là chứng nhận hành động gameplay đã diễn ra.

## 4. Reader tính cách

readResidentPreferences trong ResidentPreferences.ts trả object snapshot đóng băng, 4 trường sociability/diligence/curiosity/ambition. Thiếu hoặc không hữu hạn dùng 0,5; số hữu hạn clamp [0,1]. Không tạo ResidentPersonalityComponent, không gọi constructor Math.random, không thay component gốc.

residentPreferences hiện có vẫn phục vụ các caller AI cũ; chưa chuyển toàn bộ các reader cũ trong đợt 1. Tính cách khi tạo/rải cư dân không đổi.

## 5. Bản đồ caller cho đợt 2

| Nguồn | Đường hiện tại | Việc chuyển tiếp |
|---|---|---|
| Gặp gỡ tự nhiên | SocialInteractionSystem.performCommunication, affinityBoost 2..5, trust/respect +1 | Tạo snapshot/đánh giá/commit, lời thoại và ký ức theo outcome |
| AI giao lưu | BehaviorTree IDLE_WAIT gọi performCommunication +2/+1 | Kiểm tra HP > 0/unsafe/context khi hoàn tất, chuyển sang performConversation |
| Cộng đồng | FactionSystem gọi performCommunication +8/+5 | Kiểm tra vị trí thực tế, context community, bỏ mức điểm riêng |
| Cổng thấp hiện có | SocialInteractionService.performCommunication | Xác định compatibility; không để caller thường bypass service mới |

Các producer delta riêng giữ ngoài cổng trò chuyện: chữa thương, chiến đấu/nhân chứng, cứu mạng, bonus tạo bond. Không ép chúng qua trần giao tiếp.

## 6. Tệp và xác nhận

| Tệp | Thay đổi |
|---|---|
| src/config/social.config.ts | Cấu hình conversation/decision/assistance |
| src/modules/ai/brain/ResidentPreferences.ts | Reader thuần trả snapshot |
| src/modules/social/SocialConversationService.ts | Kiểu contract và evaluator thuần |
| src/modules/social/SocialInteractionSystem.ts | Đổi nhãn ký ức nhận đan mới |

Build production thành công sau sửa; diff check các tệp nguồn đã sửa thành công. Không thêm/chạy test, chưa kiểm tra gameplay/trình duyệt/save roundtrip. Service mới chưa được import bởi runtime caller nên chưa tăng module bundle; TypeScript vẫn kiểm tra tệp mới trong build.

## 7. Đợt tiếp theo

Đợt 2 tạo reader snapshot từ world và commit đồng bộ qua communication; chuyển đủ ba nguồn giao tiếp, ghi điểm/ngày/tick/ký ức đúng mỗi phía và không thưởng khi skipped. Bắt buộc đọc lại caller để tránh thưởng hai lần. UI chỉ đọc và ngưỡng trợ chiến có hiệu lực thuộc các đợt sau.
