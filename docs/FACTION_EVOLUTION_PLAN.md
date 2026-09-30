# Kế hoạch cư dân tự lập và phát triển thế lực

Ngày: 25/09/2026. Trạng thái: đề xuất thiết kế, chưa triển khai.
Hiểu “thánh đại” trong yêu cầu là “thánh địa”, tương ứng `holy_land` đang có trong game.

## 1. Mục tiêu trải nghiệm

Cư dân tự tập hợp vì nhu cầu sinh tồn, quan hệ xã hội và chí hướng. Họ chọn nơi định cư, bầu người đứng đầu, xây dựng, thu hút dân cư và phát triển thành thế lực. Người chơi có thể quan sát nguyên nhân của mỗi quyết định và can thiệp bằng công cụ thần linh hiện có.

Hai hướng phát triển song song:

- Dân sinh: nhóm lưu dân → thôn xóm (`hamlet`) → làng (`village`) → vương quốc (`kingdom`).
- Tu luyện: tu sĩ cùng chí hướng → tông môn (`sect`) → thánh địa (`holy_land`).

Làng không bắt buộc biến thành tông môn. Một tu sĩ xuất thân từ làng có thể rời đi lập phái và duy trì quan hệ bảo hộ với quê hương. Vương quốc quản lý nhiều khu định cư; tông môn có thể bảo hộ làng mà không sở hữu toàn bộ cư dân.

## 2. Nền tảng hiện có và điểm cần sửa

- `src/config/factions.config.ts` đã khai báo đủ năm loại thế lực.
- `FactionComponent`, `FactionFactory`, `FactionSystem` đã có thành viên, thủ lĩnh, tài nguyên tu luyện, kế vị, tuyển người và diệt vong.
- `CommunityTaskBoard` đã tạo làng khi hoàn thành `found_campfire`, nhưng kiểm tra lửa trại và nhu cầu cộng đồng theo thống kê chung. Quyền sở hữu công trình còn có nhánh lấy thế lực đầu tiên trong thế giới.
- `FactionSystem` áp dụng phẩm cấp tông môn cho mọi loại thế lực; `highestStage >= 3` đã cho hạng thánh địa. Loại thế lực và phẩm cấp chưa được phân biệt rõ.
- Tuyển người hiện dựa vào khoảng cách tới `sect_hall`, tự gán vai trò ngoại môn. Làng chỉ có lửa trại chưa được phục vụ đúng bởi cơ chế này.
- `DiplomacySystem` đã có liên minh, trung lập, chiến tranh; có thể mở rộng bằng quan hệ bảo hộ và trực thuộc.
- Có hệ thống lưu game, AI mục tiêu, quan hệ xã hội, công việc cộng đồng và hiển thị lãnh thổ để tích hợp.

## 3. Điều kiện hình thành và phát triển

Các ngưỡng sau là giá trị khởi đầu để cân bằng, cần đưa vào cấu hình và kiểm chứng bằng mô phỏng.

| Loại | Điều kiện đề xuất | Hoạt động chính |
|---|---|---|
| Thôn xóm | Ít nhất 4 cư dân trưởng thành tự nguyện; nơi ở an toàn, có nguồn thức ăn/nước tiếp cận được; dựng xong lửa trại | Kiếm ăn, dựng nhà, phân công lao động |
| Làng | Ít nhất 12 cư dân; đủ chỗ ở, nguồn nước, ruộng; dự trữ đủ 3 ngày tiêu thụ; ổn định ít nhất 1 mùa | Sản xuất, tích trữ, tuần tra, tiếp nhận lưu dân |
| Vương quốc | Ít nhất 3 khu định cư và 60 cư dân; các làng đồng thuận quy phục hoặc được sáp nhập hợp lệ; có thủ đô, lực lượng bảo vệ, ngân khố; ổn định 1 năm | Thuế, hạ tầng, bảo vệ đường đi, ngoại giao |
| Tông môn | Người sáng lập đạt Trúc Cơ hoặc mức tương đương theo chủng tộc; có công pháp truyền dạy, ít nhất 3 người theo; địa điểm đủ linh khí; xây xong cơ sở khai môn | Thu nhận đệ tử, truyền công pháp, tu luyện, linh dược |
| Thánh địa | Tông môn có ít nhất 30 thành viên, nhiều tu sĩ cao cấp, truyền thừa cao cấp, linh mạch và đại trận; uy danh và kinh tế ổn định ít nhất 3 năm | Đào tạo thiên tài, bảo hộ chư hầu, ảnh hưởng khu vực |

Điều kiện tu luyện dùng cấp sức mạnh quy đổi theo chuỗi cảnh giới, không so sánh trực tiếp cùng một `stageIndex` giữa mọi chủng tộc. Cấu hình thánh địa cần chốt ngưỡng tu vi sau khi đo nhịp tiến triển thực tế.

## 4. Chu trình AI tự lập thế lực

1. **Nảy sinh ý định:** thiếu nơi ở, cần bảo vệ, muốn truyền đạo hoặc bất mãn với thế lực hiện tại. Chấm điểm theo nhu cầu, tính cách, quan hệ và nguồn lực.
2. **Tìm người đồng hành:** mời người thân, bạn bè hoặc người cùng chí hướng. Mỗi người tự cân nhắc lợi ích, khoảng cách, lòng tin và ràng buộc hiện tại.
3. **Chọn địa điểm:** chấm điểm thức ăn, nước, đất xây dựng, linh khí, nguy hiểm, đường đi và lãnh thổ lân cận. Không cho lập tại nơi không thể tới hoặc vùng đang bị chiếm hữu nếu chưa có thỏa thuận.
4. **Chuẩn bị:** giữ chỗ địa điểm, gom tài nguyên, giao công việc xây dựng. Kế hoạch có thời hạn; hủy khi thủ lĩnh chết, thiếu người, mất đường đi hoặc không còn đủ điều kiện.
5. **Thành lập:** kiểm tra lại toàn bộ điều kiện rồi tạo thế lực, trung tâm, thành viên và thủ lĩnh trong một thao tác nhất quán; ghi lịch sử một lần.
6. **Vận hành:** định kỳ đánh giá lương thực, nhà ở, nhân lực, an ninh và tu luyện để sinh công việc.

Sinh tồn, trốn nguy hiểm và chăm sóc con nhỏ được ưu tiên hơn việc lập thế lực. Dùng thời gian chờ theo cư dân/địa điểm và khóa nhóm sáng lập để tránh nhiều thế lực trùng nhau. Người có ràng buộc hiện tại phải hoàn tất rời thế lực trước khi gia nhập thế lực mới.

## 5. Mô hình dữ liệu và quyền sở hữu

- Giữ `FactionComponent` cho tổ chức: loại, phẩm cấp phù hợp, người sáng lập, ngày thành lập, uy danh, ổn định, giai đoạn phát triển và thời điểm đủ điều kiện nâng cấp.
- Thêm `SettlementComponent`: khu định cư, thế lực quản lý, tâm điểm, dân cư, công trình, sức chứa và kho vật tư. Một vương quốc có nhiều khu định cư.
- Thêm `FoundingIntentComponent`: loại muốn lập, nhóm ứng viên, địa điểm, tài nguyên đặt trước, tiến độ và hạn chót.
- Tách nơi cư trú (`ResidenceComponent`) khỏi tư cách thành viên tổ chức (`MemberComponent`). Một đệ tử có thể cư trú tại làng thuộc vương quốc mà không bị đổi môn phái.
- Mỗi cư dân có tối đa một tư cách thành viên tổ chức chính. Cư dân không có môn phái có thể là thành viên chính của chính quyền địa phương; nơi cư trú vẫn được quản lý riêng.
- Quyền lực chính trị của vương quốc đi qua quyền quản lý khu định cư. Quan hệ bảo hộ của tông môn đi qua hiệp ước, không sửa hàng loạt `factionId` của dân làng.
- Công việc luôn mang `settlementId` và bên chịu chi phí. Công trình có chủ sở hữu rõ ràng; không dùng thế lực đầu tiên làm mặc định.
- Bổ sung kho lương thực, gỗ, đá và ngân khố với luồng thu/chi. Chi phí xây dựng phải được đặt trước và tiêu hao đúng một lần; hủy việc thì hoàn lại phần chưa dùng.
- Mọi thao tác gia nhập, rời đi, kế vị, chuyển giao đều qua API tập trung, đồng bộ danh sách thành viên và component hai chiều.

## 6. Lãnh đạo, ngoại giao và suy vong

Thôn/làng chọn người có đóng góp, uy tín và quan hệ tốt; vương quốc xét kế thừa và sự ủng hộ; tông môn xét tu vi, truyền thừa và uy tín. Hiển thị đúng danh xưng: trưởng thôn, quốc vương, chưởng môn, thánh chủ.

Nâng cấp phải đồng thời đạt yêu cầu dân cư, công trình, tài nguyên và ổn định. Khi mất điều kiện, vào giai đoạn suy yếu có thời gian phục hồi; không đổi cấp liên tục sau mỗi lần kiểm tra. Tách phẩm cấp tu luyện khỏi loại tổ chức và khỏi độ phát triển dân sinh.

Mở rộng ngoại giao theo thứ tự: bảo hộ và quy phục → thương mại → tranh chấp và ly khai. Quan hệ trực thuộc phải chống vòng lặp. Chiến tranh, sáp nhập và thay chủ phải xử lý riêng dân cư, công trình, tài nguyên và hiệp ước.

Khi giải thể, cư dân sống sót thành lưu dân hoặc xin gia nhập nơi khác. Công trình có thể thành phế tích/vô chủ; không mặc định xóa toàn bộ thực thể mang trung tâm lãnh thổ. Ghi rõ lý do trong biên niên sử.

## 7. Giao diện quan sát

- Bản đồ: phân biệt vùng quản lý dân sự, vị trí môn phái và vùng bảo hộ bằng lớp hiển thị có thể bật/tắt.
- Bảng thế lực: thủ lĩnh, người sáng lập, dân số, thành viên, khu định cư, kho, ổn định, quan hệ và điều kiện phát triển còn thiếu.
- Bảng cư dân: nơi cư trú, tổ chức, vai trò, lòng trung thành và lý do đang muốn gia nhập/rời đi/lập thế lực.
- Biên niên sử: lập làng, khai tông, lập quốc, kế vị, thăng cấp, ly khai, suy vong. Gộp thông báo thường xuyên để tránh tràn nhật ký.

## 8. Thứ tự triển khai

| Giai đoạn | Công việc | Tiêu chí hoàn tất |
|---|---|---|
| 1. Sửa nền tảng | Phạm vi công việc theo khu định cư; bỏ chủ sở hữu mặc định; API thành viên; tâm lãnh thổ cho làng; tách danh xưng/phẩm cấp | Hai cụm cư dân xây dựng độc lập, không dùng nhầm kho hoặc công trình |
| 2. Làng tự phát | Ý định sáng lập, gom nhóm, chọn đất, xây dựng, kho dân sinh, thôn → làng; UI giải thích | Từ bản đồ chưa có thế lực, cư dân tự lập và duy trì nhiều làng |
| 3. Tông môn | Người sáng lập, truyền thừa, lựa chọn gia nhập, công việc tu luyện, nơi cư trú độc lập | Tu sĩ có thể lập phái; làng quê tiếp tục hoạt động |
| 4. Vương quốc | Nhiều khu định cư, quy phục, thủ đô, thuế, kế vị, bảo hộ | Nhiều làng hợp thành vương quốc mà không mất dữ liệu dân cư |
| 5. Thánh địa và vòng đời | Điều kiện phát triển lâu dài, suy yếu, giải thể, ly khai; cân bằng hiệu năng | Thánh địa là thành quả hiếm của cả tổ chức, có thể suy tàn hợp lý |

Mỗi giai đoạn cập nhật lưu/tải và kiểm thử hồi quy ngay khi thêm dữ liệu. Không đợi đến giai đoạn cuối mới làm tương thích bản lưu.

## 9. Tích hợp và kiểm chứng

Điểm sửa chính: `FactionComponents.ts`, `FactionFactory.ts`, `FactionSystem.ts`, `CommunityTaskBoard.ts`, `SmartObjectManager.ts`, AI mục tiêu/lập kế hoạch, `DiplomacySystem.ts`, `Engine.ts`, `SaveManager.ts`, `InspectorPanel.ts`, `TerritoryRenderer.ts` và cấu hình thế lực.

Có thể thêm `FactionFoundingSystem`, `SettlementSystem`, `FactionProgressionSystem` khi triển khai để tách trách nhiệm. Bộ đếm tiến độ dùng thời gian mô phỏng; reset đúng khi tạo thế giới mới. Dùng nguồn ngẫu nhiên có seed cho quyết định mới, lưu trạng thái cần thiết để tải lại không sinh trùng sự kiện.

Bản lưu cũ: suy ra khu định cư từ công trình/trung tâm hiện hữu, giữ ID và thành viên; thêm mặc định an toàn cho trường mới. Không tự chuyển một làng thành thánh địa chỉ vì bản lưu cũ có `rank = thanh_dia`. Khôi phục đặt trước/ý định đang làm hoặc hủy và hoàn tài nguyên theo quy tắc rõ ràng.

Các kịch bản nghiệm thu bắt buộc:

- Hai nhóm dân ở xa lập hai làng độc lập; nhiều ứng viên trong một nhóm chỉ lập một làng.
- Không còn đất hợp lệ, thiếu vật tư, người sáng lập chết hoặc mất đường đi: hủy gọn, không trừ tài nguyên hai lần.
- Trẻ nhỏ và dã thú chưa có năng lực xã hội không tự trở thành người sáng lập/thành viên do đi ngang lãnh thổ.
- Chuyển thế lực không để lại thành viên ảo; lãnh đạo chết chọn được người kế vị hợp lệ.
- Tu sĩ lập môn phái không làm mất nơi cư trú hoặc chuyển chủ làng ngoài ý muốn.
- Sáp nhập, ly khai, giải thể không tạo quyền sở hữu mồ côi hoặc vòng lặp trực thuộc.
- Nâng cấp và suy yếu tuân thủ thời gian ổn định; một cá nhân mạnh không đủ lập thánh địa.
- Lưu/tải giữa lúc sáng lập vẫn nhất quán; bản lưu cũ vẫn mở được.
- Đo chi phí cập nhật với nhiều thế lực và dân cư; dùng chỉ mục không gian, bộ nhớ đệm theo khu định cư và chia lượt đánh giá, tránh mỗi thế lực quét toàn bộ thế giới mỗi khung hình.

Phạm vi bản đầu tiên nên dừng ở giai đoạn 1–2: cư dân tự lập nhiều làng, có kinh tế cơ bản, lãnh đạo và lý do hành động quan sát được. Đây là nền để mở tông môn và vương quốc mà không phải thay lại mô hình sở hữu.
