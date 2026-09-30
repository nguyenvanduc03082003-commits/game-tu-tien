# Phần 3 — Sinh linh và mô phỏng xã hội

Ngày rà soát: 30-09-2026. Phạm vi: mã nguồn hiện tại trong G:\game_tu_tien.

Báo cáo mô tả những gì đã có trong mã nguồn và được nối vào vòng mô phỏng. Không chạy test hoặc chơi thử ở lượt lập báo cáo này. Các giới hạn dưới đây được nhận diện từ mã nguồn, chưa phải kết quả đo độ ổn định khi chơi dài hạn.

## Cập nhật sau yêu cầu thay đổi ngày 30-09-2026

Đã triển khai ba mẫu tạo cư dân Nhân tộc/Yêu tộc/Ma tộc; dữ liệu cá nhân được sinh ngẫu nhiên, tính cách được lưu trên nhân vật. Ngưỡng mất máu do đói của cư dân là dưới 10. Tuổi già giảm HP tối đa, công, thủ, giáp, tốc độ di chuyển/đánh và né tránh từ 90% tuổi thọ, với phần giảm tuổi già tối đa 50% mốc khỏe mạnh gần nhất. Đã bỏ rút máu định kỳ do già yếu; diên thọ thoát ngưỡng phục hồi trần chỉ số nhưng không hồi máu hiện tại. Mốc khỏe mạnh được lưu trong statBaseline.

Các phần bên dưới là bản rà soát trước thay đổi này; các mục về sáu mẫu và ngưỡng đói 15 không còn mô tả phiên bản mới. Tuổi cư dân vẫn tăng theo năm nên mức suy giảm tuổi già cập nhật theo tuổi năm. Build được kiểm tra; chưa chạy bộ test hoặc chơi thử trong lượt triển khai.

## 1. Tổng quan hiện trạng

Game đã có các hệ thống cho cư dân có danh tính, nhu cầu, vòng đời, gia đình, quan hệ, ký ức, nghề nghiệp và AI tự chọn hành động. Động vật có hệ mô phỏng riêng; cây cối cung cấp tài nguyên và phản ứng với môi trường. Các cá nhân được nối vào cộng đồng và thế lực qua công việc, nhà ở, thành viên, kho tài nguyên và các biến cố.

Các hệ thống đang được đăng ký trong Engine gồm ThreeTierAISystem, NeedsSystem, LifeStageSystem, ChildcareSystem, ReproductionSystem, SocialInteractionSystem, CorpseAndGraveSystem, GrowthSystem, MentalStateSystem, ProfessionSystem, các hệ động vật, PlantGrowthSystem, BuildingSystem, FactionSystem và DiplomacySystem.

**Điểm cần biết khi bắt đầu chơi:** initNewWorld hiện tạo cây, động vật, linh mạch và rương; không tự tạo cư dân. Người chơi phải tạo cư dân bằng công cụ hoặc tải thế giới đã có cư dân để mô phỏng xã hội bắt đầu vận hành.

## 2. Danh tính và chủng tộc cư dân

### Những gì đã có

- Ba chủng tộc cư dân: Nhân tộc, Yêu tộc và Ma tộc. ID `beast` là Yêu tộc; động vật thường dùng component riêng.
- Sáu mẫu tạo cư dân: Phàm Nhân, Thiên Kiêu Vạn Năm, Yêu Tộc Thường, Yêu Tu, Chiến Tốt Ma Tộc và Huyết Ma Cuồng Bạo.
- Mỗi cư dân được tạo với tên, chủng tộc, ngoại hình, giới tính, vị trí, tốc độ, sức khỏe, tuổi và thọ nguyên, độ no, trạng thái hành động, thông tin chiến đấu, trang bị và túi đồ.
- Có dữ liệu linh căn, cảnh giới, công pháp và đặc điểm tùy mẫu và trạng thái nhân vật. Nhân vật sơ sinh không được gán công pháp trưởng thành và bắt đầu với linh căn chưa thức tỉnh.
- Có đặc điểm, hồ sơ tiềm năng, nền chỉ số và lịch sử cá nhân; các hệ thống này nối sang tu luyện và trưởng thành.
- Cư dân được tạo thông thường có tuổi ngẫu nhiên 15–30; sơ sinh có tuổi 0.
- Nhân tộc được gán nhu cầu khát, ngủ và giải trí cùng lịch hoạt động. Không nên suy rộng rằng cả ba chủng tộc có bộ nhu cầu giống nhau.
- Bốn thiên hướng cá nhân được suy ra ổn định từ ID: giao tiếp, chăm chỉ, tò mò và tham vọng. Đây là các hệ số ảnh hưởng quyết định AI, chưa phải mô hình tính cách đầy đủ.

Nguồn: src/config/races.config.ts, src/config/archetypes.config.ts, src/modules/beings/BeingFactory.ts, src/modules/ai/brain/ResidentPreferences.ts.

## 3. Sinh tồn và nhu cầu thường nhật

| Thành phần | Cơ chế hiện có | Hệ quả |
|---|---|---|
| Đói | Độ no giảm theo ngày, có điều chỉnh bởi đặc điểm; tu sĩ từ stageIndex 2 tiêu hao ít hơn | Dưới 15 điểm no gây mất máu |
| Khát | Giảm theo ngày; khi hạn hán dùng hệ số tiêu hao 1,8 | Khát về 0 gây mất máu |
| Ngủ/năng lượng | Giảm theo thời gian; đi lại, tấn công và nấu ăn có mức tiêu hao cao hơn trạng thái khác | Tham gia chấm điểm nhu cầu nghỉ |
| Giải trí | Giảm theo ngày | Thúc đẩy mục tiêu giao tiếp/nghỉ ngơi |
| Sức khỏe | Có máu hiện tại/tối đa, trạng thái chết, hồi phục và chữa trị | Ảnh hưởng sinh tồn, giao tranh và điều kiện sinh sản |
| Tuổi/thọ nguyên | Tăng tuổi theo sự kiện năm mới, kiểm tra già yếu | Có suy giảm sức khỏe và tử vong |

AI đã có các chuỗi tìm thức ăn, thu thập tài nguyên, uống nước, dùng đan, nghỉ/ngủ và tìm nơi phù hợp. Một phần hoạt động gắn với công trình như giếng, lửa trại, nhà và động phủ. Địa hình, đường đi, khoảng cách, vật tư và sự tồn tại của nơi tương tác quyết định khả năng thực hiện.

Nguồn: src/modules/ai/NeedsSystem.ts, src/modules/ai/brain/planner/AIPlanner.ts, src/modules/ai/brain/behavior/BehaviorTree.ts.

## 4. AI cá nhân

AI đang hoạt động do ThreeTierAISystem điều phối ba tầng:

1. **Chọn mục tiêu:** chấm điểm nhu cầu, nguy hiểm, công việc, tu luyện và sắc lệnh.
2. **Lập kế hoạch:** chuyển mục tiêu thành các bước như di chuyển, thu thập, tương tác, làm việc, nghỉ và sử dụng vật phẩm.
3. **Thực hiện:** cây hành vi xử lý từng bước, đường đi, thời gian hành động và kết quả.

Có 11 mục tiêu chiến lược: phụng mệnh, đột phá, bế quan, sinh tồn cấp thiết, tự vệ, chạy trốn, lao động, giao tiếp/giải trí, dạo bước tìm cơ duyên, an táng người thân và suy ngẫm hồi phục.

Những tình huống đã có luồng xử lý:

- Chuyển ưu tiên sang nhu cầu cấp thiết hoặc mối đe dọa.
- Nhận công việc từ bảng việc cộng đồng.
- Di chuyển theo A*, chịu ảnh hưởng loại đất và độ dốc, có kiểm tra bước vượt vách.
- Tìm người quen để giao tiếp; cá nhân có thiên hướng giao tiếp cao có thể chủ động đến người chưa quen.
- Trẻ tìm về người chăm sóc để hoạt động gần người thân.
- Nhận sắc lệnh người chơi với ưu tiên cao.
- Tu luyện, cân nhắc đột phá và suy ngẫm sau trải nghiệm.

AI có chia nhóm đánh giá so le, giới hạn lập kế hoạch và ngân sách tìm đường. Đây là cơ chế kiểm soát chi phí đã được viết; chưa có kết quả đo hiệu năng quần thể lớn trong lượt báo cáo này. Không dùng sự tồn tại của MortalAISystem hoặc AutonomousMovementSystem để khẳng định chúng đang chạy song song: vòng hiện tại đăng ký ThreeTierAISystem.

## 5. Vòng đời, gia đình và sinh sản

### Giai đoạn đời sống

- Trẻ: dưới 15 tuổi theo LifeStageSystem/ngoại hình.
- Trưởng thành: từ 15 tuổi trước vùng già yếu.
- Già: từ 90% thọ nguyên trong phân loại ngoại hình và kiểm tra già yếu.
- Tuổi bắt đầu nghề hiện là 16; tuổi kết đạo lữ và sinh sản tối thiểu là 18. Các ngưỡng đang khác nhau theo chức năng.

### Sinh sản đã có điều kiện

- Hệ sinh sản kiểm tra định kỳ mỗi 5 giây mô phỏng.
- Cha mẹ phải sống, khỏe ít nhất 70% máu tối đa, độ no trên 50, không có mục tiêu giao chiến và hết thời gian chờ sinh.
- Tuổi từ 18 và dưới 60% thọ nguyên.
- Cùng chủng tộc và species ngoại hình, gần nhau trong 48 pixel; cặp sinh sản có một nữ và một nam.
- Nhân tộc/Ma tộc cần quan hệ đạo lữ hai chiều; nhánh Yêu tộc tìm bạn cùng loài gần đó.
- Chặn cha mẹ–con và cặp có chung cha/mẹ.
- Xác suất hiện tại 4% mỗi lần kiểm tra ứng viên; tối đa 2 ca sinh mỗi lần kiểm tra, giới hạn quần thể 1.000 trong hệ này.
- Thời gian chờ sau sinh được trừ theo ngày lịch, giá trị 360 ngày. Tên cấu hình cooldownSeconds hiện không phản ánh đơn vị thực tế.

### Sơ sinh và chăm sóc

Con được tạo ở tuổi 0, giữ chủng tộc/species cha mẹ, chọn ngoại hình mới, lưu ID cha mẹ, gán người chăm sóc và tạo quan hệ cha mẹ–con hai chiều. Hệ chăm sóc có thể đổi người chăm sóc sang cha/mẹ còn sống; khi ở gần, lấy thức ăn chín hoặc sống trong dữ liệu nhu cầu của người chăm sóc để tăng độ no cho trẻ.

**Giới hạn:** đây là sinh trực tiếp khi đạt điều kiện; chưa thấy chu kỳ mang thai hoặc sinh nở nhiều giai đoạn. Chăm sóc hiện chủ yếu là tìm người thân và cho ăn, chưa có luồng nhận nuôi cộng đồng cho trẻ không còn cha mẹ trong hệ được rà.

Nguồn: src/modules/beings/FamilyComponent.ts, ReproductionSystem.ts, LifeStageSystem.ts và BeingFactory.ts.

## 6. Quan hệ xã hội

### Dữ liệu quan hệ

Có 12 loại: người lạ, sơ giao, bằng hữu, đồng môn, tri kỷ/kết nghĩa, đạo lữ, sư phụ, đồ đệ, cha mẹ, con, kình địch và cừu địch.

Mỗi quan hệ lưu người đích, tên, loại quan hệ, hảo cảm [-100,100], tín nhiệm [0,100], kính trọng [0,100], số tương tác và thời điểm gần nhất. Quan hệ nằm trên từng cá nhân, nên hai chiều có thể khác nhau; một số sự kiện cập nhật cả hai bên.

### Hành vi xã hội đã nối vào mô phỏng

- Quét tương tác gần nhau mỗi 1,8 giây; nhánh SpatialGrid dùng bán kính 55 pixel, bỏ qua cặp có người chết.
- Trò chuyện tăng hảo cảm và tạo ký ức ở hai bên.
- Quan hệ thông thường có thể tiến từ người lạ/sơ giao thành bạn; bạn đủ hảo cảm có thể thành tri kỷ. Hảo cảm rất thấp có thể chuyển thành cừu địch.
- Kết đạo lữ khi hai bên từ 18 tuổi, hảo cảm phía đang đánh giá từ 75, chưa có đạo lữ, tránh một số quan hệ ràng buộc và qua kiểm tra xác suất. Có cập nhật hai chiều, ký ức, lời thoại và biên niên sử.
- Bái sư có nhánh xử lý thực tế khi hảo cảm đủ, người bậc cao có stageIndex >=1 và người kia ở stageIndex 0; không phải mọi chênh lệch cảnh giới đều đã có quy tắc riêng.
- Sư phụ chỉ điểm tăng EXP công pháp cho đồ đệ đã có công pháp; chưa thấy cấp mới công pháp ngay trong nhánh chỉ điểm này.
- Người có thiện cảm từ 20, đang giữ Hồi Xuân Đan có thể dùng một viên giúp người gần bị thương dưới 45% máu; tăng máu tối đa 60 và ghi nhận quan hệ/ký ức.
- Bị đánh tạo ký ức xấu và giảm hảo cảm với người tấn công. Đạo lữ, sư phụ hoặc tri kỷ gần nạn nhân có thể hình thành thù ghét kẻ tấn công.
- Gặp cừu địch có nhánh lời thoại khiêu khích. Quan hệ thù ghét không đồng nghĩa mọi lần gặp đều tự động tạo trận đánh.

### Những gì chưa nên gọi là tính năng đầy đủ

- Có hàm handleRescueLife để ghi ân cứu mạng, nhưng tìm kiếm lời gọi hiện chỉ thấy định nghĩa; chưa xác nhận nó được kích hoạt từ diễn biến giao tranh.
- Có loại ký ức tỷ thí, chứng kiến đột phá và thần tích trong dữ liệu; chưa tìm thấy nơi phát các loại ký ức này trong lượt rà.
- Nhãn kình địch/đồng môn có trong dữ liệu nhưng chưa đủ căn cứ nói đã có vòng tranh đua hoặc tự gán quan hệ đồng môn toàn diện.
- Kết đạo lữ chưa có mô hình hôn nhân nhiều giai đoạn. Điều kiện chọn đạo lữ chưa kiểm tra đầy đủ các điều kiện cùng loài, khác giới và huyết thống như hệ sinh sản.

Nguồn: src/modules/social/SocialComponents.ts, SocialInteractionSystem.ts và src/modules/combat/CombatSystem.ts.

## 7. Ký ức và trưởng thành tinh thần

Ký ức ghi loại sự kiện, người liên quan, cảm xúc, độ quan trọng 1–5, ngày, thời điểm và diễn giải. Giới hạn 40 ký ức mỗi cá nhân; ký ức cấp 1–4 có thời gian phai mờ, cấp 5 không bị hệ thời gian xóa nhưng vẫn chịu chính sách giới hạn dung lượng.

Có các luồng tạo ký ức cho xuất thế, trò chuyện, kết đạo lữ, bái sư, được giúp bằng đan và bị tấn công. Ký ức hiển thị ở giao diện; không phải toàn bộ nội dung ký ức đều được AI dùng làm điều kiện quyết định.

Hệ trưởng thành tinh thần là lớp riêng: có ý chí, tâm cảnh dài hạn, trạng thái tinh thần động và trải nghiệm. Các loại sự kiện gồm làm việc, học, thiền, hướng dẫn, sống sót giao tranh, đột phá thành/bại, vượt kiếp, trách nhiệm, mất người thân và suy ngẫm. Có giới hạn XP và chống lặp sự kiện; danh sách loại sự kiện không tự chứng minh mọi producer đã phát đúng trong mọi đường thực thi.

Nguồn: src/modules/social/SocialComponents.ts, src/modules/talent/GrowthEvents.ts, src/config/mental-growth.config.ts, src/modules/talent/MentalStateSystem.ts.

## 8. Tử vong và hậu sự

Có tử vong do giao chiến, suy kiệt và già yếu. CorpseAndGraveSystem tạo trạng thái xác, xử lý mang xác, phân hủy, vật phẩm rơi, khu an táng và mộ. AI có mục tiêu an táng người thân; người sống có thể nhận biến cố mất người thân/bạn bè, nối sang hệ trưởng thành tinh thần. Mộ có thời gian tồn tại và phong hóa.

Giới hạn: có luồng hậu sự và biến cố mất người thân, chưa thấy hệ kế thừa tài sản cá nhân, tang lễ tập thể hoặc luật thừa kế gia đình đầy đủ trong phần rà này.

## 9. Lao động và cộng đồng

Catalog hiện có **35 nghề**, chia nghề phàm và nghề tu luyện. Có điều kiện nhận nghề, xét lại định kỳ, XP, 6 bậc nghề, nơi làm, nguyên liệu/sản phẩm hoặc hiệu quả như chữa thương, sửa chữa, tinh thần, an ninh, hành chính, trao đổi và học.

Bảng việc cộng đồng có nhiệm vụ dựng lửa trại, làm nhà, khai ruộng, đào giếng, nấu bữa ăn, đốn gỗ, thu hoạch, sửa công trình, tuần tra và xây các công trình tiên môn. Nhiệm vụ có người nhận, ưu tiên, vị trí, thời lượng, liên kết khu định cư/thế lực và vật tư. AI dùng nghề và nhu cầu để lựa chọn việc.

Các loại thế lực gồm xóm, làng, vương quốc, tông môn và thánh địa. Có thành lập tự động khi đạt điều kiện, tuyển cư dân, thành viên/vai trò, nhà ở, tài nguyên, tiến cấp, suy thoái, kế vị, tan rã; ngoại giao có sáp nhập và ly khai khu định cư. Những cơ chế này tạo tầng xã hội tập thể liên kết với cá nhân.

**Giới hạn:** có nghề còn dừng ở nghiên cứu hoặc đầu ra vật tư nền; mô tả thợ rèn ghi rõ công thức vũ khí sẽ bổ sung sau. Chưa có bằng chứng trong lượt này rằng mọi nghề đã hình thành chuỗi cung ứng hoàn chỉnh hoặc mọi cộng đồng luôn tự cân bằng dân số, thức ăn và lao động.

Nguồn: src/config/professions.config.ts, src/modules/professions, src/modules/ai/community/CommunityTaskBoard.ts, src/modules/factions.

## 10. Động vật và thực vật

Catalog động vật có **40 loài**: 12 loài nhóm domestic, 8 thú nhỏ, 10 thú lớn, 7 chim và 3 bò sát. Tên nhóm domestic là phân loại catalog, không chứng minh đã có thuần hóa.

Động vật có giới tính, tuổi/thọ nguyên, đói, sức khỏe, dữ liệu cha mẹ và AI riêng. Có kiếm ăn, gặm cỏ/tìm cây, ăn xác, săn mồi, phản ứng nguy hiểm, di chuyển và sinh sản theo điều kiện cùng loài; sinh sản có chặn quan hệ gần, giới hạn số lượng chung/từng loài và kiểm tra vị trí. Xác có tài nguyên thịt/da theo cấu hình và luồng thu gom. Không dùng AI xã hội cư dân hoặc linh căn/cảnh giới cho động vật thường.

Thực vật có loài, giai đoạn sinh trưởng, quả/gỗ, hấp thu linh khí và luồng linh hóa cây đủ điều kiện. Nhiệt độ/độ ẩm tác động sinh trưởng; quả và gỗ có tái tạo. Cây trên cạn không sống trên sông, hồ, biển. Đây là nguồn tài nguyên cho cư dân và một phần AI động vật.

Chưa có căn cứ khẳng định đã có thuần hóa, chăn nuôi có chủ hoặc sinh thái thủy sinh. Cân bằng săn mồi–con mồi dài hạn cần quan sát mô phỏng riêng.

## 11. Người chơi quan sát được gì

- Ngoại hình 2D theo trẻ/trưởng thành/già, cấu hình body và lớp trang phục/trang bị.
- Inspector có thông tin cá nhân, nghề nghiệp, mục tiêu/kế hoạch AI, quan hệ và lịch sử; có thao tác chuyển góc nhìn đến người liên quan.
- Lời thoại xã hội, phản hồi hoạt động ngắn và chữ chiến đấu có các luồng hiển thị riêng.
- Biên niên sử nhận các biến cố như đạo lữ, bái sư và biến động thế lực; log thế giới nhận sinh/tử và hoạt động khác tùy producer. Không phải mọi sự kiện đều vào cùng một bảng.
- Công cụ tạo cư dân/động vật, cho đan, chọn thực thể và ban sắc lệnh cho phép tác động tới mô phỏng.
- Luồng save có dữ liệu gia đình, quan hệ và ký ức cùng các lớp hồ sơ khác. Chưa thực hiện kiểm chứng save/load xã hội trong lượt báo cáo này.

## 12. Kết luận và phần cần phát triển tiếp

Đã có nền mô phỏng cá nhân và xã hội hoạt động qua nhiều hệ liên kết. Phạm vi hiện mạnh nhất ở nhu cầu, hành động tự chọn, quan hệ gần, gia đình cơ bản, công việc và biến cố cá nhân/cộng đồng.

Các hướng cần rà sâu trước khi phát triển tiếp:

1. Xác định trải nghiệm khởi đầu khi thế giới mới không có cư dân.
2. Thống nhất ý nghĩa các mốc tuổi 15/16/18 cho trưởng thành, nghề và gia đình.
3. Hoàn thiện điều kiện kết đạo lữ, chăm sóc trẻ mất cha mẹ và sinh sản.
4. Nối hoặc xác định phạm vi các hook xã hội chưa có nơi gọi, nhất là cứu mạng và ký ức chứng kiến.
5. Kiểm tra hậu quả của quan hệ/ký ức lên quyết định AI, tránh có dữ liệu nhưng ít ảnh hưởng hành vi.
6. Quan sát mô phỏng dài hạn với nhiều mật độ dân số, tài nguyên và địa hình để đánh giá dân số, lao động, cộng đồng và hệ sinh thái.

Các mục trên là hướng phát triển/kiểm chứng tiếp theo, không phải thay đổi đã thực hiện trong lượt lập báo cáo.
