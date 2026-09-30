# Rà soát logic và phát triển AI cư dân — 24/09/2026

## Phạm vi

Đọc cấu trúc dự án, đường đăng ký hệ thống trong Engine/ECS, thời gian mô phỏng và các điểm nối giữa AI, nhu cầu, chiến đấu, tu luyện, luyện đan, quan hệ, công việc cộng đồng, công trình và lưu/tải. Kiểm tra sâu luồng đánh giá mục tiêu → lập kế hoạch → thực thi. Đây là rà soát mã nguồn và kiểm thử mô phỏng cục bộ; chưa phải chứng nhận toàn bộ game không có lỗi, chưa đo FPS hoặc kiểm tra trình duyệt bằng mắt.

## Thay đổi đã thực hiện

- Mỗi ID cư dân có bốn sở thích ổn định: giao tiếp, chăm chỉ, tò mò, ham tu luyện. Các sở thích điều chỉnh mục tiêu thường ngày, không tăng chúng vượt các ưu tiên khẩn cấp. ID được lưu nên sở thích giữ nguyên qua tải game; save cũ không cần chuyển đổi.
- Người cởi mở tìm hàng xóm chưa quen khi không có bạn gần đó. Trò chuyện hoàn tất tăng quan hệ hai chiều; đối tượng đã chết hoặc đi xa làm kế hoạch thất bại thay vì giao tiếp từ xa.
- Nghỉ ngơi một mình, tụ họp quanh lửa và dạo chơi hồi phục tinh thần. Tab AI hiển thị sở thích cá nhân.
- Đầu bếp nấu khi có đủ một đơn vị nguyên liệu; thiếu nguyên liệu chuyển sang thu gom. Hái lượm bổ sung thực phẩm thô. Nấu ăn chỉ chuyển đổi tài nguyên khi hành động hoàn tất, độc lập tốc độ tick. Công việc nấu ăn cộng đồng có một nơi duy nhất quyết toán tài nguyên.
- Ăn lương khô thực sự tiêu thực phẩm và hồi độ no. Ăn cơm kiểm tra lại tồn kho khi thực thi.
- Chọn điểm utility cao nhất trước, rồi áp dụng ngưỡng chống đổi ý một lần; loại bỏ lệch do thứ tự duyệt. Mục tiêu khẩn cấp được vượt cooldown khi đã được đánh giá.
- Kế hoạch thất bại không tiếp tục thực thi trong thời gian chờ. Di chuyển quá hạn báo thất bại, không giả vờ đã tới nơi để làm việc từ xa.
- Giải phóng chỗ tương tác và công việc khi hoàn tất kế hoạch. Công việc chỉ được hoàn thành bởi cư dân đang được phân công.
- Giới hạn 24 lượt lập kế hoạch mỗi tick áp dụng cả cư dân mới. Các thánh chỉ gửi cho nhiều cư dân trước tick tiếp theo được giữ trong hàng đợi theo ID thay vì ghi đè nhau.
- Tìm bờ nước quét tất cả ô trong vùng tìm kiếm, tránh bỏ sót sông hẹp; bờ phải đi được.

## Những vấn đề còn cần phát triển

1. `BehaviorTree.executeUsePill` lấy viên đầu tiên và tiêu thụ nhưng không áp dụng công dụng; `AlchemySystem` có cơ chế dùng đan riêng. Cần thống nhất API sử dụng đan và kiểm thử từng công dụng trước khi chỉnh cân bằng.
2. `TimeManager` đặt một ngày bằng một giây mô phỏng, trong khi di chuyển/ngủ kéo dài nhiều giây. Đồng hồ được tiến toàn bộ trước vòng chạy các tick của frame trong Engine. Cần quyết định nhịp ngày đêm mong muốn rồi tách cập nhật lịch theo từng tick; tốc độ cao hiện có thể làm cư dân bỏ qua khung lịch.
3. Thánh chỉ chưa có vòng đời hoàn tất thống nhất; lệnh có thể được lập lại khi hết kế hoạch. Không tự thay đổi ý nghĩa lệnh liên tục trong đợt này.
4. Chăm trẻ, săn bắn theo nghề, chuyển vật tư và kinh tế cộng đồng còn đơn giản. Thợ săn thiếu nhiệm vụ riêng sẽ thu gom; hành vi hái lượm công việc là sản lượng trừu tượng, chưa tiêu hao nguồn tài nguyên trên bản đồ.
5. Kiểm tra A* cần thêm tình huống ngân sách tìm đường cạn, mục tiêu di động, công trình thay đổi và né đòn va chạm. Mô phỏng đông dân cần benchmark 100/500/1.000 cư dân; chưa khẳng định đạt 60 FPS.
6. SaveManager khởi tạo lại não AI thay vì lưu toàn bộ tiến độ kế hoạch. Sở thích vẫn ổn định, nhưng công việc dở dang không được tiếp tục nguyên trạng sau tải.
7. AI cũ MortalAISystem/AutonomousMovementSystem không được đăng ký trong Engine hiện tại; không nên bật lại song song với ThreeTierAISystem vì dễ có hai bộ điều khiển cùng ghi vị trí/trạng thái.

## Kiểm chứng

- `npm test`: 9 ca hồi quy về nấu ăn theo nhiều bước thời gian, kế hoạch thất bại, nghỉ ngơi, quan hệ hai chiều, đối tác rời đi, di chuyển quá hạn, sở thích ổn định, khát khẩn cấp, ăn thực phẩm thô và hái lượm.
- `npm run build`: TypeScript strict và Vite production build thành công.
- Chưa chạy kiểm thử UI, round-trip save hay mô phỏng dân số lớn. Những hạng mục này vẫn cần để đánh giá cân bằng và trải nghiệm thực tế.
