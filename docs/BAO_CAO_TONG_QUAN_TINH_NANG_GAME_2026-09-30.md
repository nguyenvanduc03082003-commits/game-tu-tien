# Báo cáo tổng quan tính năng, đặc điểm, hoạt động và sự kiện của game

**Ngày lập:** 30-09-2026  
**Phạm vi:** Mã nguồn và tài liệu hiện có trong workspace `G:\game_tu_tien` tại thời điểm lập báo cáo.  
**Mục đích:** Tóm tắt nội dung game đã được xây dựng để làm tài liệu giới thiệu, bàn giao và đối chiếu phạm vi phát triển.

## 1. Khái quát

Đây là game mô phỏng thế giới tu tiên 2D theo thời gian thực. Người chơi quan sát thế giới, chọn tốc độ mô phỏng, xem thông tin từng nhân vật/thế lực, chỉnh sửa địa hình, tạo sinh vật, ban linh đan hoặc sắc lệnh và tác động trực tiếp đến diễn biến. Song song đó, cư dân, tu sĩ, yêu tộc, động vật, thực vật và các thế lực có những hệ thống tự vận hành.

Các trụ cột gameplay hiện có:

1. **Kiến tạo thế giới:** sinh bản đồ theo seed và mẫu địa hình, quản lý cao độ, linh khí, thời tiết và tai biến.
2. **Mô phỏng sinh linh:** cư dân có nhu cầu, tuổi đời, gia đình, sinh sản, quan hệ xã hội và AI; động vật có sinh tồn, di chuyển và sinh sản riêng.
3. **Tu tiên:** linh căn, linh khí, cảnh giới, bế quan, đột phá, đan dược và thiên kiếp.
4. **Cộng đồng và thế lực:** lập xóm/làng/quốc gia hoặc tông môn/thánh địa; xây dựng, phân công, ngoại giao, chiến tranh và biến động quyền lực.
5. **Trưởng thành cá nhân:** đặc điểm, tiềm năng, ý chí, tâm cảnh, trải nghiệm và nghề nghiệp.
6. **Can thiệp của người chơi:** thanh công cụ quản trị thế giới, công cụ địa hình, tạo thực thể, chọn thế giới, ban lệnh và theo dõi biên niên sử.

## 2. Thế giới và địa hình

### 2.1. Sinh bản đồ

- Có thể tạo thế giới ngẫu nhiên theo seed hoặc chọn mẫu địa hình định sẵn.
- Các mẫu có trong công cụ tạo thế giới: ngẫu nhiên, **Thập Vạn Đại Sơn**, **Bình Nguyên Trung Thổ**, **Ma Vực Đầm Lầy** và **Hải Đảo Tiên Sơn**.
- Bản đồ tạo ra địa hình, bờ biển, vùng cao thấp và độ ẩm; loại địa hình ảnh hưởng đến nơi sinh trưởng của cây, khả năng đi lại và phân bố sinh vật.
- Khởi tạo lại thế giới là thao tác tạo thế giới mới, thay thế các thực thể và công trình của thế giới đang chơi.

### 2.2. Cao độ 2D

- Mỗi ô có cao độ tương đối trong khoảng `[0,1]`, hiển thị như tỷ lệ tương đối chứ không phải độ cao theo mét.
- Có công cụ nâng, hạ và làm mượt cao độ theo vùng; chỉnh sửa có giới hạn để giữ địa hình hợp lý.
- Độ dốc ảnh hưởng đến khả năng đi qua, tìm đường, tầm nhìn và tốc độ di chuyển tại cạnh ô kế tiếp.
- Thời tiết tính đến cao độ khi xác định nhiệt độ nền.
- Loại địa hình và cao độ là hai đặc tính khác nhau: công cụ cao độ không tự đổi loại địa hình.

### 2.3. Linh khí và thời tiết

- Thế giới có lưới linh khí, nguồn/mạch linh khí và các hệ thống hấp thu, phân phối linh khí.
- Cư dân tu luyện, cây cỏ linh tính và hoạt động của công trình tu tiên tương tác với nguồn linh khí.
- Hệ thời tiết và tai biến môi trường được đăng ký vào vòng mô phỏng; chi tiết tác động phụ thuộc hệ thống và cấu hình từng loại.

## 3. Sinh linh và mô phỏng xã hội

### 3.1. Cư dân và chủng tộc

- Cư dân được tạo theo archetype, chỉ số cơ bản, tuổi đời, nhu cầu, trí tuệ và dữ liệu tu luyện phù hợp.
- Các nhóm chủng tộc tu tiên gồm Nhân tộc, Yêu tộc và Ma tộc theo cấu hình nội dung.
- Người chơi có thể tạo cư dân hoặc yêu tộc bằng công cụ quản trị; AI điều khiển hành vi thường nhật.
- Cư dân có các nhu cầu sinh tồn, có thể di chuyển, tìm thức ăn, nghỉ ngơi, làm việc, tu luyện, giao tiếp, chiến đấu và tham gia hoạt động cộng đồng.

### 3.2. Vòng đời, gia đình và xã hội

- Có các giai đoạn đời sống, tuổi tác, sinh sản và chăm sóc trẻ.
- Quan hệ gia đình được lưu dưới dạng component; mất người thân có thể tạo tác động tinh thần.
- Hệ tương tác xã hội xử lý quan hệ và các tương tác giữa cư dân.
- Khi chết, cư dân có dữ liệu tử vong; hệ thống xác và mộ quản lý phần hậu sự.

### 3.3. Động vật

- Có catalog **40 loài động vật trên cạn và chim**, chia thành thú nuôi, thú nhỏ, thú lớn, chim và bò sát.
- Động vật có component và AI sinh tồn riêng; có di chuyển, tìm thức ăn, đói, vòng đời, chết và sinh sản.
- Xác động vật có thể được xử lý để tạo tài nguyên; hệ chiến đấu có thể tác động đến động vật.
- Động vật được tách biệt với Yêu tộc tu tiên: không có linh căn, cảnh giới hay component cư dân/tu luyện.

### 3.4. Thực vật và hệ sinh thái

- Thực vật gồm cây lấy gỗ, cây/quả làm thức ăn, linh thảo và thần dược theo cấp.
- Cây có địa hình ưa thích, tốc độ trưởng thành, hấp thu linh khí, trọng số xuất hiện và sản lượng.
- Một số loại cây có thể cho thu hoạch gỗ hoặc quả; cây/quả và gỗ có cơ chế hồi phục/tái sinh theo dữ liệu loài.
- Thực vật được gieo tự nhiên hoặc do người chơi rải từ công cụ; có hệ thống tăng trưởng.
- Tài liệu kiểm chứng trước đây ghi nhận mô phỏng nhiều seed cho cây, động vật và rương trong 360 ngày mô phỏng; đó là phạm vi thử nghiệm mô phỏng, không thay thế chơi thử trực tiếp toàn bộ hệ sinh thái.

## 4. Tu luyện và tiến trình sức mạnh

- Nhân vật có linh căn, độ tinh khiết/ngũ hành và khả năng hấp thu linh khí.
- Hệ thống tu luyện tăng tu vi theo linh khí, trạng thái, điều kiện nhân vật và ảnh hưởng của môi trường/công trình.
- Có cảnh giới, giai đoạn/bình cảnh và kiểm tra điều kiện đột phá.
- Quy tắc đột phá được gom trong `BreakthroughRules`; có điều kiện theo cảnh giới/tuổi, xác suất có trần, chi phí và thời gian hồi sau thất bại.
- Đan dược và AI sử dụng chung dịch vụ áp dụng hiệu quả đan; có thể có tác dụng hồi phục hoặc điều chỉnh chỉ số lâu dài theo loại đan.
- Đột phá có thể dẫn đến thiên kiếp; hệ thống thiên kiếp xử lý các biến cố và tương tác chiến đấu liên quan.
- Yêu tộc gồm các archetype yêu sinh/yêu tu và giữ bản sắc yêu tộc; động vật thường không tự chuyển thành nhân vật tu luyện.

## 5. Đặc điểm, tiềm năng, ý chí và tâm cảnh

- Hệ trait V3 có catalog 300 ID được phân loại theo chủng tộc và nguồn hình thành; một số mục cũ được giữ ở trạng thái tương thích/legacy.
- Đặc điểm có thể ảnh hưởng đến chỉ số hoặc khả năng, có trạng thái, điều kiện và nhóm xung đột; có hỗ trợ tiến hóa trait theo chuỗi.
- Chỉ số hiệu lực được tính lại từ nền tảng và các điều chỉnh vĩnh viễn, tránh cộng dồn sai khi cập nhật lặp.
- Tiềm năng được tổng hợp từ nhiều trục năng lực; giao diện Inspector có các thanh thành phần, điểm tổng và thông tin tư chất.
- Hồ sơ trưởng thành theo dõi ý chí và tâm cảnh qua kinh nghiệm/sự kiện. Một sự kiện có thể tác động đến trạng thái tinh thần; hoạt động suy ngẫm giúp xử lý áp lực và tạo tiến triển phù hợp.
- Hệ XP có chống sự kiện trùng, kiểm tra thế giới, giới hạn nhận theo ngày/khoảng thời gian và hệ số giảm thưởng khi sự kiện lặp.
- Nhãn bản đồ, badge trait và Inspector giúp đọc trạng thái cá nhân; số nhãn tên đồng thời được giới hạn để giảm che khuất bản đồ.

## 6. Nghề nghiệp, sản xuất và kinh tế

- Có **35 nghề** thuộc hai nhánh nghề phàm và nghề tu luyện.
- Dữ liệu nghề quy định điều kiện tuổi/cảnh giới/ngũ hành, nơi làm, công việc, công thức tiêu hao và đầu ra hoặc hiệu quả.
- Nhóm nghề bao gồm nông nghiệp, đốn gỗ, xây dựng, nấu ăn, khai khoáng, hái thuốc, săn bắt, rèn/gia công, dệt, buôn bán, chữa thương, bảo vệ, hành chính và các nghề tiên môn như luyện đan, luyện khí, trận pháp, phù lục, linh thực.
- Nghề được đánh giá định kỳ; nhân vật tích lũy XP và tăng bậc nghề, có giới hạn XP ngày.
- AI có thể chọn nơi làm, nhận ca và thực hiện một số chuỗi lao động; đầu vào được lấy từ kho thế lực, sản phẩm được bổ sung vào kho.
- Có giao diện nghề nghiệp và kho sản phẩm; dữ liệu nghề cá nhân và hàng hóa được lưu riêng.
- **Phạm vi cần hiểu đúng:** đây là hệ nghề nền tảng. Một số nghề chỉ có phần học/nghiên cứu cơ sở, còn công thức vũ khí và một số chuyên môn sâu được tài liệu đánh dấu là chưa hoàn chỉnh. Chưa có cơ sở khẳng định toàn bộ dân số tự tạo chuỗi cung ứng ổn định trong mọi thế giới dài hạn.

## 7. Cộng đồng, thế lực và xây dựng

### 7.1. Các loại thế lực

- Nhánh dân sự: xóm, làng và vương quốc.
- Nhánh tu tiên: tông môn và thánh địa.
- Thế lực có thành viên, vai trò/chức vụ, tài nguyên, lãnh thổ, cấp bậc và quan hệ với thế lực khác.
- Có quá trình thành lập, mở rộng, thăng cấp, suy thoái, tách nhánh, kế vị, sáp nhập hoặc tan rã tùy điều kiện mô phỏng.

### 7.2. Công trình

- Công trình gồm đại điện/phủ thành chủ, động phủ, dược điền, phòng luyện đan, tàng kinh các, hộ trận, nhà ở, giếng, ruộng và lửa trại.
- Công trình có chi phí, độ bền, kích thước, hiệu quả, sức chứa nhà ở và thời gian xây theo cấu hình.
- Luồng xây dựng thường có công trường, vật tư giữ chỗ, nhân công và tiến độ; hủy công trường có xử lý vật tư. Tiến độ công trường được đưa vào luồng lưu/nạp.
- Công trình đang xây chưa được tính như công trình hoàn thành đối với các chức năng phụ thuộc vào nó.
- Công cụ quản trị có ngoại lệ tạo tức thì được ghi rõ trong giao diện.
- Có quy tắc vị trí đặt công trình và kiểm tra sức chứa nhà; việc gán nhà phải hợp lệ với khu định cư và chỗ còn trống.

### 7.3. AI cộng đồng

- Bảng công việc cộng đồng phân phối việc xây dựng, sửa chữa, thu thập và một số hoạt động khác.
- AI cá nhân có tầng lập kế hoạch, mục tiêu chiến lược và cây hành vi; các tầng phối hợp để chọn việc, di chuyển đến nơi làm và hoàn thành hành động.
- Hệ thống cân nhắc nhu cầu, mối đe dọa, ưu tiên công việc và kỹ năng nghề nghiệp khi giao việc.

## 8. Chiến đấu, ngoại giao và biến cố

- Có hệ chiến đấu, đạn/đòn đánh, sát thương, thành phần chiến đấu và theo dõi trao đổi giao tranh.
- Nhân vật có thể chủ động hoặc tự động tấn công mục tiêu theo AI; cư dân cùng phe/quan hệ có thể ảnh hưởng đến hành vi giao tranh.
- Hệ ngoại giao quản lý quan hệ giữa thế lực; giao diện có thao tác tạo quan hệ thù địch hoặc đồng minh.
- Thế lực có thể mở rộng, suy yếu, bị tiêu diệt hoặc thay đổi quyền lực; các biến cố chiến đấu và tử vong có thể tạo dấu vết trong hệ trưởng thành và biên niên sử.
- Hệ thời tiết và thiên tai bổ sung các biến cố môi trường bên cạnh xung đột do nhân vật/thế lực tạo ra.

## 9. Hoạt động người chơi

Người chơi có thể thực hiện các hoạt động chính sau:

- Tạo thế giới mới, chọn mẫu, thay đổi seed và điều chỉnh tốc độ mô phỏng.
- Tạm dừng hoặc chạy thời gian ở các mức tốc độ hiện cấu hình: `0.5x`, `1x`, `2x`, `3x`, `5x`.
- Xem bản đồ thu nhỏ, lớp phủ và thống kê; chọn thực thể để xem Inspector và biên niên sử.
- Chỉnh sửa loại địa hình/cao độ bằng cọ; nâng, hạ hoặc làm mượt cao độ.
- Tạo cư dân, Yêu tộc, động vật theo loài, cây theo chủng loại; có thao tác rải quần thể.
- Chọn và sử dụng linh đan cho nhân vật.
- Đặt công trình hoặc ra lệnh xây dựng; tạo tông môn/thế lực và điều khiển một số tương tác ngoại giao.
- Ban sắc lệnh cho cư dân: bế quan phá cảnh, di cư/di chuyển, thảo phạt mục tiêu, xây dựng/sửa chữa hoặc khai hoang.
- Dùng công cụ Thiên Đạo để tạo hiệu ứng như sét/mạch linh khí theo giao diện quản trị.
- Lưu, nạp, quản lý thế giới và cài đặt; game có tự lưu theo cấu hình và cơ chế lưu trữ nhiều lớp.

## 10. Sự kiện và hoạt động được theo dõi

### 10.1. Biên niên sử thế giới

Biên niên sử có các nhóm sự kiện tiêu biểu:

- Dị tượng.
- Nhân vật đạt mốc đột phá cao nhất.
- Thế lực được thành lập hoặc bị tiêu diệt.
- Xóm được lập, tông môn được thành lập.
- Sự kiện khai sáng/lập nghiệp và thăng cấp.
- Kế vị, phân ly/tách nhánh và suy thoái.
- Sinh và tử.

Biên niên sử hiển thị thông điệp theo sự kiện và giới hạn số dòng giữ trên giao diện.

### 10.2. Sự kiện trưởng thành nhân vật

Hệ thống kinh nghiệm theo dõi sự kiện từ lao động, tu luyện, đột phá, thiên kiếp, giao tranh/đối mặt và mất mát. Sự kiện được định danh để chống lặp; việc nhận XP còn chịu giới hạn và điều kiện của từng nguồn. Tâm cảnh phản ứng với trải nghiệm và có tiến trình suy ngẫm.

### 10.3. Hoạt động mô phỏng lặp lại

Trong mỗi lượt mô phỏng, hệ thống có thể xử lý nhu cầu, di chuyển, tìm đường, kiếm ăn, làm việc, xây dựng, sửa chữa, tu luyện, chiến đấu, giao tiếp, sinh trưởng cây, sinh sản, tiến triển nghề, thay đổi thế lực, thời tiết và tai biến. Danh sách hành động cụ thể phụ thuộc trạng thái nhân vật, môi trường, tài nguyên và lựa chọn AI.

## 11. Giao diện và lưu trữ

- **Menu chính:** vào game, quản lý save/cài đặt và truy cập quy trình tạo thế giới.
- **Time Controls:** ngày/thời gian, điều khiển tạm dừng/tốc độ và lớp phủ.
- **Minimap:** xem nhanh không gian thế giới.
- **Inspector:** xem nhân vật, sinh vật, thế lực, công trình và dữ liệu đặc điểm/tiềm năng/nghề tương ứng.
- **God Toolbar:** tab địa hình, cư dân & yêu tộc, động vật, linh đan, thế lực & kiến trúc, thảo mộc, Thiên Đạo, sắc lệnh và tạo thế giới.
- **Profession Panel:** nghề và hàng hóa nghề nghiệp.
- **World Chronicle:** nhật ký biến cố.
- **Save/Load:** kiểm tra dữ liệu và dựng thế giới tạm trước khi thay thế thế giới đang chơi; có lưu trữ bền vững cùng đường dự phòng theo thiết kế hiện tại.
- Dữ liệu lưu bao gồm trạng thái thế giới và các hệ như động vật, đặc điểm/tiềm năng, nghề, công trường, kho và thời gian. Một số phiên bản save cũ có quy tắc tương thích riêng; save động vật trước phiên bản được hỗ trợ có thể bị từ chối theo chính sách lưu của hệ động vật.

## 12. Tình trạng triển khai và mức độ kiểm chứng

### Đã có trong mã nguồn

Các hệ được mô tả trong báo cáo đều có module/cấu hình/giao diện tương ứng trong workspace: thế giới, AI, tu luyện, thế lực, xây dựng, hệ sinh thái, nghề nghiệp, trait/talent, save, biên niên sử và công cụ người chơi.

### Bằng chứng kiểm thử có trong tài liệu dự án

- Tài liệu trạng thái và kiểm toán ghi nhận nhiều suite hồi quy cho AI, save/load, động vật, thực vật, thế lực, công trường, nghề, đặc điểm/tiềm năng, tâm cảnh, tốc độ thời gian, HUD và rương.
- Tài liệu sinh thái 28-09-2026 ghi nhận tại thời điểm đó `npm test`, `npm run build`, `npm run assets:check` và kiểm tra whitespace đã đạt; đồng thời nêu rõ giới hạn: chưa kiểm tra trực quan trên trình duyệt và chưa chạy ma trận 360 ngày qua vòng UI thật.
- Báo cáo nghề nghiệp 28-09-2026 ghi rõ kết quả test/build không bao phủ các sửa đổi cuối báo cáo và bản cuối chưa được nghiệm thu bằng một lượt build/test mới.
- Các ghi nhận trên là kết quả ở thời điểm nêu trong từng tài liệu, không được xem là bằng chứng cho toàn bộ snapshot hiện tại.

### Trạng thái workspace tại ngày lập báo cáo

- Git có nhiều tệp đã sửa và tệp mới chưa commit. Báo cáo này phản ánh trạng thái mã nguồn đang có trong workspace, không xác nhận thay đổi nào đã phát hành hoặc đã được chủ dự án nghiệm thu.
- Lượt lập báo cáo này không chạy lại build/test và không thực hiện kiểm tra giao diện trực tiếp trên trình duyệt. Vì vậy không kết luận snapshot hiện tại đã qua kiểm thử cuối hoặc mọi tính năng đều hoàn chỉnh ở cấp trải nghiệm.

## 13. Phạm vi chưa nên mô tả là hoàn tất

- Cân bằng dài hạn giữa sinh thái, sinh sản, đói, săn bắt và mật độ quần thể trong mọi tốc độ chơi.
- Tính ổn định của chuỗi sản xuất nghề nghiệp tự vận hành ở thế giới đông dân và nhiều thế lực.
- Chuyên môn sâu cho toàn bộ nghề; một số nghề có ghi chú giới hạn, một số công thức/sản phẩm tương lai chưa có.
- Kiểm thử thủ công mọi thao tác HUD trên nhiều kích thước màn hình; tài liệu trước đây ghi nhận còn thiếu xác nhận trực quan ở một số lượt.
- Hiệu năng và kích thước bundle cần được đánh giá riêng khi phát triển nội dung tiếp.
- Mức độ tích hợp đầy đủ của mọi sự kiện, công thức và hành vi cần được xác nhận theo đúng phiên bản chạy thực tế.

## 14. Kết luận

Game hiện đã có nền tảng mô phỏng thế giới tu tiên tương đối rộng: người chơi vừa quan sát và can thiệp, vừa chứng kiến cư dân, sinh vật và thế lực tự thay đổi qua thời gian. Nội dung đã xây dựng bao trùm kiến tạo địa hình, sinh thái, xã hội, tu luyện, đặc điểm cá nhân, nghề nghiệp, xây dựng, ngoại giao, chiến đấu và ghi lại lịch sử thế giới.

Đây là báo cáo hiện trạng mã nguồn và tài liệu. Các số lượng catalog như 40 loài động vật, 35 nghề và 300 ID đặc điểm mô tả quy mô dữ liệu hiện có; chúng không tự thân chứng minh mọi nhánh gameplay đã hoàn thiện hoặc đã được kiểm thử trực tiếp trong giao diện.

## 15. Tài liệu và khu vực mã nguồn tham chiếu

- `src/core/Engine.ts`, `src/core/TimeManager.ts`, `src/core/GameSettings.ts`
- `src/modules/world/`, `src/modules/ai/`, `src/modules/beings/`, `src/modules/animals/`, `src/modules/flora/`
- `src/modules/cultivation/`, `src/modules/energy/`, `src/modules/combat/`, `src/modules/factions/`, `src/modules/professions/`
- `src/modules/traits/`, `src/modules/talent/`, `src/modules/alchemy/`, `src/modules/treasure/`, `src/modules/save/`
- `src/ui/` và `src/renderer/systems/`
- `docs/TRAIT_TALENT_IMPLEMENTATION_STATUS.md`
- `docs/ANIMAL_YAO_IMPLEMENTATION_STATUS.md`
- `docs/ELEVATION_IMPLEMENTATION_STATUS.md`
- `docs/WORLD_ECOLOGY_IMPLEMENTATION_VERIFICATION.md`
- `docs/SAVE_AND_WORLD_REGEN_VERIFICATION.md`
- `docs/BAO_CAO_HE_THONG_NGHE_NGHIEP_2026-09-28.md`
