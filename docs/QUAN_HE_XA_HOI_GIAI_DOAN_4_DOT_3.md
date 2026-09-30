# Quan hệ xã hội — Giai đoạn 4, đợt 3

Ngày: 30-09-2026. Trạng thái: đã triển khai lựa chọn người giao lưu; chưa nghiệm thu runtime.

## 1. Evaluator và lựa chọn

SocialDecisionService.ts mới có evaluateSocialCandidate thuần trên snapshot và selectSocialCandidate chỉ đọc world.

- Ứng viên trong bán kính <=200, sống HP >0, có xã hội/vị trí hợp lệ, không self, không cooldown, không unsafe hoặc affinity một phía <=-30.
- Lập kế hoạch cho cuộc gặp tương lai đánh giá khả năng giao tiếp mà chưa áp trần khoảng cách55. Khoảng cách thật vẫn dùng để kiểm tra bán kính tìm kiếm/chấm điểm. Không coi chọn mục tiêu là cuộc gặp đã hoàn thành.
- Điểm 0..100: quan hệ35%, receptivity25%, khoảng cách25%, chung hoạt động15%.
- Quan hệ dùng min affinity hai phía chuẩn hóa [-100,100] -> [0,1] và min trust hai phía [0,100] -> [0,1], lấy trung bình. Receptivity dùng phía thấp hơn để tránh một người hào hứng che phía còn lại.
- Bonus chung hoạt động chỉ khi cùng recreate/idle và thực sự trong55; không coi cùng idle ở xa là chung sự kiện.
- Lấy tối đa12 ứng viên hợp lệ gần nhất, sau đó chọn score cao nhất; hòa điểm chọn gần hơn, rồi ID nhỏ hơn. Không có ngẫu nhiên hoặc ghi component/điểm.
- Người lạ/người quen được xét trong cùng danh sách; không chặn người lạ bằng sociability>0,45. Sociability vẫn ảnh hưởng receptivity và utility hiện có; không reroll.

## 2. Nối AI và hiệu năng

AIPlanner SOCIAL_RECREATE thay nearest-only và fallback hướng ngoại bằng selectSocialCandidate. ThreeTierAISystem truyền spatialGrid hiện có qua tham số tùy chọn, không tạo cache static. Query grid chỉ tìm lân cận, vẫn kiểm tra khoảng cách thật từ world.

Nếu không có grid, fallback đọc danh sách cư dân O(N) mỗi lần lập kế hoạch, giữ buffer tối đa12 và sắp buffer nhỏ; không tạo ma trận cặp hoặc chạy selector mọi tick. Replan throttling, time slicing và goal hysteresis hiện có được giữ, không thêm timer/ledger mới.

Không có ứng viên hợp lệ vẫn dùng đường bếp lửa/nghỉ dưỡng hiện có. Không ép tìm người khi bản thân unsafe. Đánh giá quyết định không gọi residentPreferences có tác dụng tạo RNG.

## 3. Guardian và xác nhận lúc gặp

Đường trẻ tìm guardian chạy trước selector, không lọc bằng cooldown/declined. Bổ sung HP guardian>0 khi tạo kế hoạch; guardian chết/mất vị trí không được chọn.

BehaviorTree từ đợt2 đã kiểm tra target sống/vị trí/phạm vi48 khi chờ, và gọi performConversation để đọc lại cooldown/an toàn/khả năng đáp lại lúc hoàn tất. Rejected không điểm/memory/cooldown; cooldown cho kết thúc nghỉ dưỡng, các lỗi khác dùng failure/replan, ngoại trừ hoạt động ở bên guardian được giữ. Không tạo điểm ở MOVE_TO.

Ràng buộc ended hoặc vai đặc biệt không hợp lệ đối ứng không được gọi bằng danh xưng active trong kế hoạch. Nhân vật vẫn có thể nói chuyện với người từng chia tay nếu đủ điều kiện như quan hệ thường.

## 4. Tệp

| Tệp | Công việc |
|---|---|
| src/modules/social/SocialDecisionService.ts | Chấm điểm và tìm ứng viên thuần, grid/fallback |
| src/modules/ai/brain/planner/AIPlanner.ts | Thay selector, giữ guardian/fallback; tham số grid tùy chọn |
| src/modules/ai/systems/ThreeTierAISystem.ts | Truyền spatialGrid hiện có khi lập kế hoạch |

## 5. Kiểm tra và giới hạn

Build đầu báo import NameComponent không còn dùng; đã xóa import và build lại sau sửa cuối thành công. Diff check các tệp nguồn sửa thành công. Không thêm/chạy test, chưa quan sát gameplay/browser/save roundtrip. Cảnh báo chunk>500kB vẫn còn.

- Top12 gần nhất có thể bỏ qua người quen phù hợp ở xa hơn; đây là giới hạn tìm kiếm có chủ ý trong cấu hình, cần quan sát cân bằng.
- Thứ hạng ổn định không bảo đảm path thực sự tới được; MOVE_TO/pathfinder vẫn xử lý đường đi và failure như trước.
- Khả năng đáp lại khi chọn là snapshot dự báo; phải kiểm tra lại lúc commit. Target có thể chết/đi xa/đổi hoàn cảnh trong lúc di chuyển.
- Không thêm từ chối cooldown khi lập kế hoạch thất bại. Nhân vật từ chối chưa nhận ledger mới; replan throttling hiện có giới hạn churn, chưa có số liệu đo runtime.
- Trợ chiến chưa dùng cấu hình assistance; đó là đợt4.

## 6. Tiếp theo

Đợt4 triển khai evaluateSocialAssistance với affinity/trust/HP và xung đột ràng buộc, nối nhánh hỗ trợ StrategicGoal mà giữ tự vệ/thần dụ. Đợt5 hoàn thiện giải thích UI và tổng kết toàn diện.
