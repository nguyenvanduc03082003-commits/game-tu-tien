# Tổng kết toàn diện giai đoạn 4 — Quan hệ xã hội

Ngày: 30-09-2026. **Đã triển khai cả5đợt; chưa nghiệm thu gameplay/UI/save roundtrip.**

## 1. Tiến độ

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Nhãn chữa thương, cấu hình, contract, reader personality thuần | Đã triển khai |
| 2 | Ba nguồn conversation chung, điểm/ký ức riêng, cooldown | Đã triển khai |
| 3 | AI xếp hạng ứng viên hai phía, grid, guardian/fallback | Đã triển khai |
| 4 | Trợ chiến theo trust/affinity/HP/xung đột, reader target | Đã triển khai |
| 5 | Giải thích UI hai hướng, báo cáo và đối chiếu save/reset | Đã triển khai; xác nhận runtime chưa chạy |

## 2. Giao tiếp

- Gặp gỡ tự nhiên, BehaviorTree socialWith và giao lưu nhóm lưu dân dùng performConversation, cùng communication cooldown1ngày/cặp.
- Reader chỉ đọc vị trí/sống/điểm/tính cách/hoàn cảnh lúc commit. HP<=25% hoặc combat từ chối; đang ngủ/làm việc chịu busyPenalty nhưng không bị service hủy công việc.
- Phạm vi service55; AI bước chờ vẫn48. Cultivation cần cả hai có technique, không thưởngEXP; community không nhân điểm chỉ vì nguồn gọi khác.
- Mỗi phía receptivity riêng, warm +3/+1/0, neutral +1/0/0, awkward -1/0/0. Ngưỡngwarm>=0,65, awkward<0,35. Affinity<=-30 ở một phía từ chối.
- Completed ghi count một lần mỗi phía, world day/tick, chatted importance1/emotion+10/0/-5; cooldown chốt trước lời thoại. Skipped không ghi điểm/count/ký ức/khóa.
- performCommunication deprecated còn wrapper qua cơ chế mới; delta cũ chỉ validate, không quyết định thưởng. Thay đổi hành vi API phải được tính khi cập nhật test cũ nếu có yêu cầu.
- Nhận đan mới dùng helped, cứu mạng thực tế vẫn saved_life; ký ức cũ không sửa hàng loạt.

## 3. Personality và AI

- readResidentPreferences trả snapshot đóng băng, missing/nonfinite dùng0,5, hữu hạn clamp[0,1]. Không RNG/component mutation từ reader; cách ngẫu nhiên lúc spawn không đổi.
- AI xét tối đa12 người hợp lệ gần nhất/bán kính200. Quan hệ35%, receptivity25%, distance25%, chung recreate/idle thực tế15%.
- Dùng phía yếu hơn để tránh một người thích che người còn lại ghét; tie score -> distance -> ID. Người quen/người lạ xét chung, bỏ hard gate sociability>0,45 để tìm người lạ.
- ThreeTierAISystem truyền grid hiện có; fallbackO(N) lúc lập kế hoạch, buffer12, không N² mỗi tick/static cache. Giữ time slicing/replan budget/hysteresis.
- Guardian ưu tiên trước selector, phải sốngHP>0. Khi không có candidate giữ bếp lửa/nghỉ dưỡng. Điểm chỉ ở commit; target chết/đi xa/unsafe kiểm tra lại tại cuộc gặp.

## 4. Trợ chiến

- Đạo lữ/sư đồ/kết nghĩa active đối ứng, helper->ally affinity>=20/trust>=40, helperHP>25%, helper chưa có target, ally/enemy sống, radius<=180.
- Từ chối nếu enemy là người có active bond đặc biệt với helper, gồm huyết thống; không tự ép chọn người thân làm kẻ địch.
- Eligible mới chọn enemy và tăngCOMBAT_DEFENSE94; tự vệ/bỏ chạy/thần dụ giữ đường riêng. Từ chối không đổi bond/history/cooldown hoặc thưởng cứu mạng.
- Reader StrategicGoal và executeAttack loạiHP0/dead/missing position, clear đúng target cũ.
- Đây là điều kiện bắt đầu can thiệp. Sau khi tham chiến, không thêm provenance/monitor liên tục để hủy combat khi quan hệ ally đổi. Không tự tạo FLEE target chỉ vì helper từ chối can thiệp.

## 5. Giao diện

- Chi tiết quan hệ hiện tại có sociability/busy, outcome/delta theo chiều hoặc lý do từ chối, ghi rõ dự đoán casual chưa ghi điểm.
- Trợ chiến hai hướng có đúng helper/ally, lý do hiện tại và enemy nếu đủ điều kiện. Giải thích đủ điều kiện chưa bảo đảm AI chọn; không đồng nghĩa cứu mạng.
- Chỉ khi mở chi tiết mới đánh giá, escape tên/nội dung, cho xuống dòng, giữ cơ chế mở/cuộn hiện có.
- Kế thừa lifecycle/history/mâu thuẫn/cooldown/cứu mạng giai đoạn3; không thêm factory/RNG/commit trong UI.

## 6. Save, đơn vị và giới hạn

Không thêm state persistent mới: personality/memory/cooldown đã có codec, evaluator/selector là transient, không giữ cache qua world. Nạp/reset không có producer thưởng conversation mới. Đây là đối chiếu nguồn, chưa phải chứng minh save roundtrip.

1ngày=20giây ở1x; cooldown conversation1ngày. Giữ các mốc30ngày lifecycle/rescue và quy tắc sinh sản/chỉ điểm/phản bội. Không thêm race/gender/personality restriction cho hình thành bond.

Giới hạn cần quan sát:

1. Bỏ +8/+5 cộng đồng làm tiến triển/đủ điều kiện lập thôn chậm hơn; chưa bù ngưỡng lập thôn.
2. Top12 gần nhất có thể bỏ người phù hợp xa hơn; chưa đo hiệu năng/đường đi thực tế.
3. Outcome deterministic và điểm khởi điểm chưa cân bằng runtime; reader trung tính không bổ sung component thiếu.
4. Service conversation/interaction có import function qua lại, không truy cập binding bên kia lúc khởi tạo; bundle qua, initialization runtime chưa smoke-test.
5. Một relationType/cặp vẫn là giới hạn kiến trúc; không mở gia phả/multiple bonds/gossip/tha thứ/trả thù/chiến tranh phe.
6. Các giai đoạn trước chưa có nghiệm thu tự động/gameplay; không coi tác vụ này tự giải quyết phần kiểm chứng tồn đọng.

## 7. Bản đồ tệp

| Tệp | Vai trò |
|---|---|
| src/config/social.config.ts | Ngưỡng khởi điểm |
| src/modules/ai/brain/ResidentPreferences.ts | Reader tính cách |
| src/modules/social/SocialConversationService.ts | Contract, snapshot/evaluation/commit/feedback |
| src/modules/social/SocialDecisionService.ts | Candidate và assistance evaluator |
| src/modules/social/SocialInteractionService.ts | Gate/cooldown và wrapper |
| src/modules/social/SocialInteractionSystem.ts | Proximity và healing producer |
| src/modules/factions/FactionSystem.ts | Community caller |
| src/modules/ai/brain/planner/AIPlanner.ts | Chọn người/guardian/fallback |
| src/modules/ai/systems/ThreeTierAISystem.ts | Grid và nhịp lập kế hoạch |
| src/modules/ai/brain/goals/StrategicGoal.ts | Chọn trợ chiến |
| src/modules/ai/brain/behavior/BehaviorTree.ts | Commit giao lưu, xử lý target |
| src/ui/SocialRelationshipInspector.ts | Giải thích hai hướng |

## 8. Kiểm chứng và hồ sơ

Build/diff check đã qua ở các đợt, build cuối đợt5 thành công (165module), cảnh báo chunk>500kB. Không thêm/chạy test, chưa browser smoke/gameplay/save roundtrip. Build chỉ chứng minh biên dịch, không nghiệm thu hành vi.

Ma trận kiểm chứng vẫn ở QUAN_HE_XA_HOI_GIAI_DOAN_4_KE_HOACH_CHI_TIET.md: biên distance/HP/trust/affinity, hai nguồn cùng tick/cooldown, personality missing, ID đảo chiều, guardian, conflicting bond, pause/speed/save/reset/UI hẹp. Chỉ tạo/chạy test khi có yêu cầu kiểm thử.

Hồ sơ gồm kế hoạch chi tiết, QUAN_HE_XA_HOI_GIAI_DOAN_4_DOT_1.md đến DOT_5.md và tổng kết này.

## 9. Kết luận

Cả5đợt đã tích hợp: giao tiếp chung có phản ứng hai phía, AI chọn người phù hợp, trợ chiến có ngưỡng/an toàn và UI giải thích. Hoàn tất triển khai mã/tài liệu; nghiệm thu runtime và cân bằng thực tế còn chưa thực hiện.
