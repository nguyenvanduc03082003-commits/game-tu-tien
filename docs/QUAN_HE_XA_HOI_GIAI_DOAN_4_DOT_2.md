# Quan hệ xã hội — Giai đoạn 4, đợt 2

Ngày: 30-09-2026. Trạng thái: đã chuyển đủ ba nguồn giao tiếp sang service chung; chưa nghiệm thu runtime.

## 1. Reader và commit

SocialConversationService.readConversationSnapshot đọc world tại thời điểm thực hiện: người sống HP > 0, có xã hội/vị trí hữu hạn, HP tối đa hợp lệ, điểm theo đúng chiều, tính cách snapshot trung tính nếu thiếu, trạng thái bận/nguy cấp/combat, kỹ thuật tu luyện và communication cooldown.

Nguy cấp HP <= 25% hoặc có combat target/state attack từ chối giao tiếp. Ngủ/làm việc chỉ ảnh hưởng busyPenalty; service không sửa trạng thái hoặc hủy công việc của người được gặp. Phạm vi service <= 55. cultivation cần cả hai có CultivationTechniqueComponent; chỉ điều chỉnh receptivity, không thưởng EXP.

performConversation đánh giá snapshot rồi commit đồng bộ qua performSocialInteraction communication. Mỗi phía tăng interactionsCount một lần, delta theo đánh giá riêng, clamp qua API, ghi lastInteractionDay/tick theo world và cập nhật nhãn thường. Neutral cũng là completed; skipped không điểm/count/ký ức/cooldown.

Mỗi phía có chatted importance 1, emotion theo outcome +10/0/-5, mô tả context/outcome riêng. Tạo MemoryComponent nếu thiếu sau khi hợp lệ. Một lời thoại theo outcome chung phát sau commit/cooldown, không RNG và không chronicle cho mỗi chat. Không còn producer chat cũ phát ký ức/lời thoại thêm lần nữa.

## 2. Ba nguồn đã chuyển

| Nguồn | Thay đổi |
|---|---|
| SocialInteractionSystem proximity | Giữ xác suất xuất hiện 0,22 và cooldown precheck; bỏ RNG affinityBoost 2..5 và producer ký ức/lời thoại riêng; cultivation khi cả hai có technique, nếu không casual |
| BehaviorTree IDLE_WAIT socialWith | Khi hoàn tất gọi performConversation casual, kiểm tra thêm target HP > 0; skipped cooldown cho kết thúc giải trí không điểm; các từ chối khác failure/replan, ngoại trừ đường trẻ ở bên guardian |
| FactionSystem nhóm lưu dân | Gọi context community; bỏ +8/+5; cặp phải ở <=55 dù cùng cluster 180; không cộng từ xa chỉ vì cùng nhóm |

Đường trẻ tìm guardian vẫn giữ hoạt động nghỉ/chăm sóc khi chuyện trò bị skip, không tạo điểm giả. Target thiếu/chết/đi xa vẫn thất bại theo kiểm tra vị trí/sinh tồn hiện có. AI vẫn nhắm phạm vi 48 ở bước chờ, nghiêm hơn trần service55; kế hoạch lựa chọn người được cải tiến ở đợt 3.

## 3. Compatibility và cân bằng

performCommunication còn là wrapper deprecated cho caller ngoài nguồn hiện tại: validate delta hữu hạn nhưng không dùng delta caller để thưởng; gọi performConversation casual rồi ánh xạ performed/skipped. Nhờ vậy không còn đường wrapper cộng +8/+5 hoặc bỏ qua khoảng cách/an toàn. Cần lưu ý đây là thay đổi hành vi API cũ; các bài test cũ có thể cần cập nhật theo quy tắc mới khi người dùng yêu cầu kiểm thử.

Nguồn src hiện chỉ còn định nghĩa wrapper, không có caller gameplay dùng nó. SocialConversationService và SocialInteractionService có import qua lại ở mức function; không có lời gọi hoặc đọc binding phía kia tại khởi tạo module. Build bundle thành công; runtime module initialization chưa smoke-test.

Trò chuyện mặc định neutral +1, warm +3/+1, awkward -1; respect không tự tăng từ trò chuyện thường. Giao lưu cộng đồng tiến triển chậm hơn trước và chỉ cho cặp thực sự gần nhau; có thể làm thành lập thôn chậm hơn. Không thay ngưỡng thành lập thôn để bù khi chưa có số liệu runtime.

## 4. Ngoài phạm vi

Healing, hostility/witness, rescue và bonus formBond giữ delta riêng, không đi qua conversation. Không đổi cooldown1ngày, lifecycle, personality spawn, phương án trợ chiến hoặc thêm dữ liệu save. Memory/cooldown hiện có tiếp tục được codec lưu/nạp. Không tự khởi tạo tính cách khi giao tiếp.

## 5. Tệp và xác nhận

| Tệp | Công việc |
|---|---|
| src/modules/social/SocialConversationService.ts | Snapshot reader, commit, ký ức/lời thoại |
| src/modules/social/SocialInteractionService.ts | Wrapper tương thích không bypass đánh giá |
| src/modules/social/SocialInteractionSystem.ts | Chuyển proximity, xóa thưởng/feedback riêng |
| src/modules/ai/brain/behavior/BehaviorTree.ts | Chuyển bước giao lưu, HP/guardian/replan |
| src/modules/factions/FactionSystem.ts | Chuyển community, bỏ điểm cứng |

Build production sau chỉnh sửa cuối thành công; diff check các tệp nguồn đã sửa thành công. Đã rà bằng rg các caller performCommunication/performConversation. Không thêm/chạy test, chưa browser gameplay hoặc save roundtrip; không xem build là xác nhận hành vi runtime.

## 6. Tiếp theo

Đợt 3 dùng evaluator/reader thuần để xếp hạng ứng viên hai phía, kiểm tra lúc gặp và tránh churn. Giữ caregiver, không cộng điểm ở MOVE_TO. Đợt 4 mới bật ngưỡng trợ chiến; đợt 5 UI giải thích và tổng kết.
