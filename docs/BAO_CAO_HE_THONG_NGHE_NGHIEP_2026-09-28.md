# Báo cáo triển khai hệ thống nghề nghiệp cư dân

**Ngày lập:** 28/09/2026  
**Dự án:** `G:\game_tu_tien`  
**Trạng thái:** Đã viết và tích hợp phần nền tảng; chưa nghiệm thu bản mã cuối.  
**Mục đích:** Để chủ dự án xem xét thiết kế, những gì đã được làm, các điểm còn đơn giản hóa và công việc còn lại.

> **Đánh giá hiện tại:** Có danh mục 35 nghề, dữ liệu tay nghề, lựa chọn nghề tự động, các hoạt động sản xuất/dịch vụ, giao diện và lưu tải. Điều này **chưa có nghĩa là toàn bộ 35 nghề đã có đầy đủ cơ chế như trong tài liệu gốc**. Bốn nghề tu chân mới có hoạt động học nền tảng; nhiều nghề khác đang dùng mô hình sản xuất hoặc dịch vụ đơn giản.

> **Phạm vi của lượt lập báo cáo:** Đọc lại mã nguồn và tổng hợp kết quả đã có. Báo cáo này không thay đổi cơ chế game và không đồng nghĩa với việc các thông số đề xuất đã được chủ dự án chấp thuận.

## 1. Căn cứ và yêu cầu của chủ dự án

### 1.1. Tài liệu thiết kế được cung cấp

Nguồn chính là [Tổng thư nghề nghiệp trong thế giới tu tiên](</C:/Users/nguye/Downloads/h_th_ng_ngh_nghi_p_th_gi_i_tu_ti_n.md>), gồm hai nhánh:

- **Tu Chân Bách Nghệ:** Tứ nghệ, sản xuất và hậu cần tu chân, nghề liên quan sinh vật/cơ quan, chiêm bặc và tà phái.
- **Phàm Trần Bách Nghiệp:** Lao dịch tiên môn, khai thác, thủ công, thương nghiệp, hành chính, võ thuật và y tế.

Tài liệu mô tả thế giới và vai trò nghề nghiệp. Nó chưa quy định đầy đủ những thông số để lập trình như thời gian một ca, số lượng nguyên liệu, kinh nghiệm, số vị trí làm việc hay thuật toán chọn nghề. Các phần đó đã được tôi đặt giá trị ban đầu để có thể triển khai, và được liệt kê riêng trong báo cáo này.

### 1.2. Những yêu cầu đã có trong cuộc trao đổi

1. Xây dựng hệ thống nghề nghiệp cho cư dân phàm nhân và cư dân có thể tu tiên.
2. Tận dụng hệ thống cư dân và hoạt động trong game hiện có.
3. Không thêm chức năng thả/ban trang bị cho cư dân trong GodToolbar.
4. Cơ chế vũ khí, rèn vũ khí và cách cư dân nhận vũ khí sẽ được chủ dự án thống nhất sau.
5. Trước khi tiếp tục hoàn thiện, cần một báo cáo chi tiết để xem xét.

### 1.3. Những nội dung chưa được áp đặt từ tài liệu

Các mô tả sau chưa được chuyển thành quy luật cứng của game:

- Tỷ lệ tu sĩ dưới 5% và phàm nhân trên 95%.
- Tuổi thọ nghề mỏ, tai nạn nghề nghiệp, phản phệ chiêm bặc và bệnh nghề nghiệp.
- Chế độ bóc lột, tô thuế, giai cấp hoặc cơ chế chư hầu mới.
- Hệ tiền tệ riêng gồm vàng, bạc, đồng và nhiều phẩm linh thạch.
- Các hệ chiến đấu, sinh vật và triệu hồi hoàn chỉnh chỉ được nhắc tới trong mô tả nghề.

## 2. Ý định thiết kế

Mục tiêu là để nghề nghiệp ảnh hưởng đến việc cư dân thực sự làm trong thế giới:

```text
Cư dân đủ điều kiện
    ↓
Xét linh căn, cảnh giới, nơi ở, nguyên liệu và nghề đã học
    ↓
Chọn một nghề chính
    ↓
Nhận việc → tìm đường → tới nơi làm → thực hiện công việc
    ↓
Kiểm tra điều kiện lần cuối trước khi trừ nguyên liệu
    ↓
Tạo sản phẩm / thực hiện dịch vụ / hoàn thành buổi học
    ↓
Ghi nhận kinh nghiệm và số việc đã hoàn thành
    ↓
Tăng tay nghề, lưu lại tiến bộ, định kỳ xem xét nghề phù hợp
```

Các nguyên tắc đã được dùng khi triển khai:

- Một người có **một nghề chính**, nhưng có thể giữ tay nghề của nhiều nghề đã từng làm.
- Tu sĩ vẫn có thể làm nghề phàm nhân. Nghề tu chân có thêm điều kiện linh căn và cảnh giới.
- Kinh nghiệm đến từ công việc hoàn thành có kết quả được hệ thống ghi nhận.
- Sản xuất tại công trình phải dùng tài nguyên của đúng thế lực sử dụng lao động.
- Thiếu nguyên liệu, công trình không hợp lệ hoặc người lao động chưa tới nơi thì không được hoàn tất mẻ sản xuất.
- Nghề nghiệp phải tồn tại qua lưu/tải và không được phát thưởng lặp ngay khi tải lại.

**Giới hạn quan trọng:** Đây mới là hệ nghề nghiệp và một phần hoạt động kinh tế. Chưa có đầy đủ hợp đồng lao động, tiền công cá nhân, truyền nghề, thị trường giữa nhiều thế lực hoặc mạng vận chuyển vật tư.

## 3. Tổng quan phần đã triển khai

| Hạng mục | Hiện trạng trong mã nguồn | Mức xác nhận |
|---|---|---|
| Danh mục nghề | 35 nghề: 20 phàm nhân, 15 tu chân | Có trong mã; kiểm thử danh mục đã qua |
| Nghề chính và tay nghề | Một nghề chính; lưu XP và số việc cho từng nghề | Có trong mã; kiểm thử đã qua |
| Điều kiện hành nghề | Tuổi, sức khỏe, Nhân tộc; thêm linh căn/cảnh giới/thế lực theo nghề | Có trong mã; đã kiểm tra một số ranh giới |
| Tự chọn và đổi nghề | Chấm điểm nghề phù hợp; định kỳ xét lại | Có trong mã; đã kiểm tra đổi nghề và giữ XP |
| Làm việc tại công trình | Tìm vị trí ngoài công trình, kiểm tra đường đi, tích lũy tiến độ | Có trong mã; đã kiểm thử ca làm cơ bản |
| Sản xuất và dịch vụ | Nguyên liệu, sản phẩm, chữa thương, sửa trận, tinh thần, ổn định, bán hàng | Có trong mã; mới kiểm thử một số chuỗi đại diện |
| Luyện đan | Bỏ tự sinh đan ở công trình; thêm ca làm của luyện đan sư | Kiểm thử đã qua |
| Nghề săn | Tìm xác để thu thịt hoặc chọn con mồi nhỏ; dùng lượng dinh dưỡng hữu hạn | Bổ sung sau lượt kiểm thử nghề; chưa xác nhận bản cuối |
| Sáp nhập thế lực | Chuyển hàng nghề từ thế lực bị nhập sang thế lực nhận | Bổ sung sau lượt kiểm thử nghề; chưa xác nhận bản cuối |
| Giao diện | Tên nghề, bậc, XP, nơi làm, nghề đã học; sản phẩm trong bảng công trình | Kiểm thử chuỗi HTML đã qua; chưa xem trực tiếp trong trình duyệt |
| Lưu/tải | Lưu nghề, XP, kho nghề và mã chống thưởng lặp; kiểm tra dữ liệu lỗi | Kiểm thử nền tảng đã qua |
| Hiệu năng đông dân | Có nhiều lần tìm thế lực/công trình/cư dân khi xét nghề | Chưa đo riêng hệ nghề nghiệp ở quy mô lớn |

## 4. Phạm vi cư dân và điều kiện nghề

### 4.1. Đối tượng hiện được hỗ trợ

Điều kiện hiện tại trong `canHaveProfession`:

- `raceId` phải là `human`.
- Có dữ liệu sức khỏe, chưa chết và HP lớn hơn 0.
- Không còn được đánh dấu là trẻ nhỏ.
- Tuổi từ 16 trở lên.

**Điều này có nghĩa:** Bản hiện tại bao phủ phàm nhân Nhân tộc và tu sĩ Nhân tộc. Yêu tộc, Ma tộc dưới các mã chủng tộc riêng và động vật thường chưa được cấp nghề bởi hệ thống này.

Luyện thi sư hiện là **người thuộc Nhân tộc trong thế lực Ma đạo**, không đồng nghĩa với việc nghề đã mở cho toàn bộ Ma tộc.

### 4.2. Nghề phàm nhân và nghề tu chân

| Nhóm cư dân | Nghề phàm nhân | Nghề tu chân |
|---|---|---|
| Chưa đủ 16 tuổi | Chưa được hệ nghề nghiệp cấp nghề | Chưa được cấp nghề |
| Nhân tộc không thể tu luyện | Được xét nếu đáp ứng điều kiện của nghề | Không được |
| Nhân tộc có linh căn nhưng cảnh giới đang ở bậc 0 | Được xét | Chưa đủ điều kiện nghề tu chân |
| Nhân tộc đã vào cảnh giới tu luyện | Được xét | Được xét theo từng nghề |
| Người chết hoặc HP không còn | Không hành nghề | Không hành nghề |
| Chủng tộc khác | Chưa hỗ trợ trong mô đun nghề nghiệp này | Chưa hỗ trợ trong mô đun nghề nghiệp này |

Nghề tu chân dùng `SpiritualRootComponent.canCultivate()` và `RealmComponent.stageIndex` để kiểm tra. Phần lớn yêu cầu bậc cảnh giới từ 1; Khôi lỗi sư, Ngự trùng sư, Chiêm bặc sư và Luyện thi sư yêu cầu từ 2.

### 4.3. Điều kiện ngũ hành hiện là điều kiện bắt buộc

| Nghề | Yêu cầu hiện tại |
|---|---|
| Luyện đan sư | Có cả Hỏa và Mộc |
| Luyện khí sư | Có cả Kim và Hỏa |
| Linh y | Có cả Thủy và Mộc |
| Các nghề tu chân còn lại | Chưa bắt buộc cặp thuộc tính cụ thể |

Hệ quả cần xem xét: một người có Thiên linh căn chỉ mang một thuộc tính vẫn có thể bị loại khỏi các nghề yêu cầu song thuộc tính. Chưa có cơ chế bù điều kiện bằng dị hỏa, pháp khí, công pháp hoặc phối hợp nhiều người.

## 5. Danh mục 20 nghề phàm nhân

**Cách đọc bảng:** Thời gian là giây mô phỏng cơ bản của một ca chuyên nghề, chưa tính tăng tốc tay nghề và hiệu ứng lao động. Những dòng “theo việc cũ” dùng hoạt động sẵn có, không có công thức ca riêng trong cấu hình nghề mới.

| Nghề / mã | Nơi làm hiện tại | Hoạt động và kết quả trong mã | Thời gian | Giới hạn cần biết |
|---|---|---|---|---|
| Nông phu — `farmer` | Ruộng hoặc lao động nông nghiệp hiện có | Gắn XP nghề vào các việc `farm`/`farmer` | Theo việc cũ | Chưa có chu kỳ gieo–chăm–thu hoạch mới cho từng vụ |
| Tiều phu — `lumberjack` | Công việc đốn cây cộng đồng | Ghi nhận nghề từ việc `chop_wood` | Theo việc cũ | Dùng cơ chế cây và đặt trước gỗ đã có |
| Thợ xây — `builder` | Công trường/công trình cần sửa | Gắn XP vào xây, sửa và việc xây dựng cộng đồng | Theo việc cũ | Chưa tách kiến trúc sư, thợ đá, thợ nề |
| Đầu bếp — `cook` | Hoạt động nấu ăn hiện có | Gắn XP vào nấu ăn | Theo việc cũ | Chưa có danh mục món ăn và chất lượng món mới |
| Tạp dịch tiên môn — `sect_servant` | Giếng hoặc đại điện | Dùng 1 lương thực để thực hiện dịch vụ tinh thần | 8 giây | Chỉ trong tiên môn; chưa mô phỏng riêng gánh nước, quét dọn, rửa lò |
| Trực canh điền nông — `tenant_farmer` | Ruộng phàm | Tạo 3 lương thực vào kho thế lực | 8 giây | Chỉ trong tiên môn; chưa có chủ đất, hợp đồng hay tô thuế riêng |
| Dược đồng — `herbal_assistant` | Dược điền hoặc luyện đan phòng | 2 thảo dược → 2 dược liệu sơ chế | 8 giây | Chưa phân loại rễ, lá, củ hay phẩm chất |
| Khoáng công — `miner` | Lửa trại hoặc đại điện gần núi | 1 gỗ → 3 đá/quặng thô | 10 giây | Có kiểm tra núi gần nơi làm; chưa có thân quặng hữu hạn, hầm mỏ hoặc tai nạn |
| Thái dược nhân — `herbalist` | Hái lượm/thu hoạch hiện có | Gắn XP vào `forage`/`forager` | Theo việc cũ | Sự kiện đang gộp nhiều loại hái lượm, chưa riêng từng dược liệu |
| Tráp thú nhân — `hunter` | Thiên nhiên | Tìm thịt từ xác thú; khi cần thì tìm con mồi nhỏ | Pha thịt: 3 giây | Mới bổ sung; chưa có bẫy, da, xương hoặc bán tin dấu thú |
| Thiết tượng — `blacksmith` | Lửa trại | 3 đá/quặng thô + 2 gỗ → 1 phôi kim loại | 10 giây | Chưa tạo công cụ hoặc vũ khí; nguyên liệu đá/quặng còn gộp |
| Mộc công — `carpenter` | Nhà tranh hoặc lửa trại | 3 gỗ → 2 gỗ gia công | 8 giây | Chưa tạo đồ nội thất, xe hoặc bộ phận công trình riêng |
| Thợ dệt — `weaver` | Ruộng hoặc nhà tranh | 2 lương thực → 1 vải | 8 giây | Đây là công thức tạm; chưa có bông, gai, tằm và thuốc nhuộm |
| Tiêu sư — `escort` | Lửa trại hoặc đại điện | Dùng 1 lương thực để tăng ổn định | 8 giây | Chưa có đoàn hàng, tuyến đường, hộ tống và phục kích |
| Chưởng quầy — `innkeeper` | Nhà tranh hoặc lửa trại | Dùng 2 lương thực để phục vụ tinh thần cư dân gần đó | 8 giây | Chưa có khách điếm, khách thuê phòng hay doanh thu cá nhân |
| Hành thương — `merchant` | Lửa trại hoặc đại điện | Bán một hàng thủ công dư thành ngân khố | 10 giây | Giao dịch đang trừ hàng và cộng tiền trực tiếp; chưa có người mua hoặc chợ liên vùng |
| Lang trung — `physician` | Nhà tranh hoặc dược điền | 1 dược liệu sơ chế → hồi tối đa 10 HP cho một người | 8 giây | Chưa phân biệt bệnh, gãy xương, thương tích linh lực |
| Võ giả giang hồ — `martial_artist` | Lửa trại | Dùng 1 lương thực để làm việc bảo vệ, tăng ổn định | 10 giây | Chưa có hệ Hậu Thiên/Tiên Thiên và nội công mới |
| Quan lại — `official` | Đại điện | Dùng 1 lương thực để tăng ổn định hành chính | 8 giây | Chưa ràng buộc nghề với bổ nhiệm chức quan; chưa có công việc thuế hay xét xử riêng |
| Binh lính — `soldier` | Đại điện hoặc lửa trại | Dùng 1 lương thực để tăng ổn định | 8 giây | Chưa tạo quân ngũ, quân hàm, lương hoặc đội hình chiến đấu |

Nông phu, tiều phu, thợ xây và đầu bếp được tách rõ để khớp với các hoạt động game đã có. Một số vai trò được nhóm chung trong tài liệu đã được tách thành nghề riêng để cấu hình.

## 6. Danh mục 15 nghề tu chân

Tất cả các nghề trong bảng đều yêu cầu Nhân tộc đủ tuổi và có thể tu luyện. Cột điều kiện ghi thêm yêu cầu của từng nghề.

| Nghề / mã | Điều kiện thêm | Nơi làm | Hoạt động và kết quả hiện tại | Thời gian |
|---|---|---|---|---|
| Luyện đan sư — `alchemist` | Bậc 1; Hỏa + Mộc | Luyện đan phòng | 3 thảo dược + 1 linh thạch → 1 đơn vị đan trong kho | 12 giây |
| Luyện khí sư — `artificer` | Bậc 1; Kim + Hỏa | Luyện đan phòng dùng chung | 2 phôi kim loại + 2 linh thạch → 1 phôi linh kim | 12 giây |
| Trận pháp sư — `array_master` | Bậc 1 | Hộ trận | 1 linh thạch → sửa tối đa 40 độ bền | 10 giây |
| Phù lục sư — `talisman_master` | Bậc 1 | Tàng kinh các | 1 vải + 1 linh thạch → 2 phù hộ thân | 10 giây |
| Linh thực phu — `spiritual_farmer` | Bậc 1 | Dược điền | 1 linh thạch → 4 thảo dược | 10 giây |
| Tầm quáng sư — `geomancer` | Bậc 1; nơi làm gần núi | Động phủ hoặc đại điện | 4 đá/quặng thô → 1 linh thạch | 12 giây |
| Linh trù sư — `spiritual_chef` | Bậc 1 | Lửa trại | 2 lương thực + 1 thảo dược → dịch vụ hồi tinh thần | 8 giây |
| Giám bảo sư — `appraiser` | Bậc 1 | Tàng kinh các | Bán hàng thủ công cao cấp với giá bằng 125% giá cơ bản | 12 giây |
| Linh chức sư — `spiritual_weaver` | Bậc 1 | Tàng kinh các hoặc nhà tranh | 2 vải + 1 linh thạch → 1 linh bố | 12 giây |
| Ngự thú sư — `beast_tamer` | Bậc 1 | Tàng kinh các | 1 thảo dược + 1 linh thạch → một buổi học nền tảng | 12 giây |
| Khôi lỗi sư — `puppeteer` | Bậc 2 | Tàng kinh các | 2 gỗ gia công + 1 phôi kim loại + 1 linh thạch → 1 linh kiện khôi lỗi | 12 giây |
| Linh y — `spiritual_physician` | Bậc 1; Thủy + Mộc | Dược điền hoặc động phủ | 1 dược liệu sơ chế + 1 linh thạch → hồi tối đa 25 HP cho một người | 8 giây |
| Ngự trùng sư — `gu_master` | Bậc 2 | Dược điền | 1 thảo dược + 1 linh thạch → một buổi học nền tảng | 12 giây |
| Chiêm bặc sư — `diviner` | Bậc 2 | Tàng kinh các | 1 thảo dược + 1 linh thạch → một buổi học nền tảng | 12 giây |
| Luyện thi sư — `corpse_refiner` | Bậc 2; thế lực Ma đạo | Động phủ | 1 thảo dược + 1 linh thạch → một buổi học nền tảng | 12 giây |

### 6.1. Những giới hạn chưa thể hiện hết trong tên nghề

- **Luyện đan:** kết quả là tăng `pillStock`, chưa có công thức chọn từng loại đan, đan độc, tỷ lệ hỏng hoặc phẩm cấp thành phẩm trong mô đun mới.
- **Luyện khí:** chỉ tinh luyện nguyên liệu. Không tạo vũ khí, giáp hoặc pháp bảo.
- **Trận pháp:** chỉ sửa hộ trận đang có. Chưa thiết kế, xây mới, nâng cấp hoặc điều khiển các loại trận khác bằng nghề.
- **Phù lục:** phù hiện là hàng trong kho; khi làm dịch vụ an ninh, một phù có thể được tiêu thụ để tăng hiệu quả ổn định. Chưa phải bùa người chơi/cư dân kích hoạt trong chiến đấu.
- **Tầm quáng:** mới có công thức tuyển luyện ở vùng gần núi. Chưa phát hiện mỏ mới, di tích hay địa mạch ẩn.
- **Linh trù:** hiện hồi tinh thần; chưa có cơ chế ăn linh thực tăng tu vi hoặc phân biệt độc tố.
- **Giám bảo:** hiện tăng giá bán một số hàng cao cấp. Chưa giải mã bảo vật, xác định niên đại hoặc mở thuộc tính ẩn.
- **Linh chức:** chỉ tạo linh bố. Chưa có pháp y, chống phép ngũ hành hoặc thay đổi hình ảnh trang bị.
- **Khôi lỗi:** chỉ tạo linh kiện; chưa có thực thể khôi lỗi tự hành, khai mỏ hoặc chiến đấu.
- **Linh y:** hiện hồi HP; chưa phân biệt tổn thương kinh mạch, đan điền, thần hồn và tà khí.

### 6.2. Bốn nghề đang ở mức học nền tảng

Ngự thú, Ngự trùng, Chiêm bặc và Luyện thi có thể thực hiện buổi học, tiêu hao nguyên liệu và tăng kinh nghiệm, tối đa **350 XP**.

Chưa có các cơ chế tương ứng:

| Nghề | Phần chưa triển khai |
|---|---|
| Ngự thú | Bắt giữ, thuần hóa, khế ước, phối giống, chỉ huy thú |
| Ngự trùng | Nuôi đàn trùng, túi linh trùng, độc tố, cổ thuật |
| Chiêm bặc | Suy diễn vận mệnh, dự đoán sự kiện, truy tìm người, phản phệ |
| Luyện thi | Thu thập thi hài cho nghề, luyện xác, phẩm cấp cương thi, điều khiển cương thi |

Giới hạn 350 XP hiện trùng ngưỡng bậc “Thợ lành nghề” của bảng bậc chung. Cách đặt tên này cần xem xét lại vì nhân vật mới học lý thuyết nền tảng.

## 7. Cách cư dân tự chọn nghề

### 7.1. Chu kỳ xét nghề

- Hệ nghề nghiệp kiểm tra cư dân khoảng mỗi 1 giây mô phỏng.
- Một nghề đang hợp lệ thường được giữ ít nhất tới lần xét lại sau 7 ngày lịch.
- Nếu người không còn đủ điều kiện hoặc nơi làm việc không còn hợp lệ, lần kiểm tra tiếp theo có thể chọn lại sớm.
- Người mới được tạo cũng được khởi tạo xét nghề; lần này chưa có tham số bản đồ nên một số nghề cần khảo sát địa hình chưa được chọn ngay.
- Đổi nghề giữ nguyên XP nghề cũ.

Mốc 7 ngày dùng lịch game, không phải 7 ngày ngoài đời.

### 7.2. Điểm lựa chọn đang dùng

Các nghề không đủ điều kiện bị loại trước. Nghề có công thức ca làm còn phải tìm được công trình và đáp ứng điều kiện đầu vào/nhu cầu hiện tại.

| Yếu tố | Điểm hiện tại |
|---|---:|
| Trùng thiên hướng lao động trong lịch sinh hoạt | +10 |
| Nghề có công thức sản xuất/dịch vụ/buổi học | +20 |
| Nghề dùng lao động cũ, không có công thức ca riêng | +5 |
| Nghề tu chân | +18 |
| Giữ nghề chính đang có | +8 |
| Mỗi bậc tay nghề đã đạt, tính từ bậc 0 | +5 |
| Mỗi người trưởng thành khác cùng nghề, cùng thế lực sử dụng lao động | −12 |
| Giá trị phân xử bằng nhau, tính từ ID người và nghề | Từ 0 đến dưới 1 |

Điểm trừ theo số đồng nghiệp nhằm giảm việc cả cộng đồng cùng chọn một nghề. Nó **chưa phải hạn ngạch lao động** và chưa bảo đảm tỷ lệ nông dân, thợ xây, thợ rèn hoặc tu sĩ cụ thể.

Nhu cầu hiện được đánh giá khá đơn giản: có nguyên liệu, còn chỗ theo ngưỡng sản xuất, có người cần dịch vụ. Chưa dự báo thiếu đói, ưu tiên chuỗi cung ứng hoặc tối ưu lợi nhuận.

Khi nhận nghề, hệ thống cập nhật lại thiên hướng lao động của lịch sinh hoạt theo nghề đó. Do đó thiên hướng này chưa phải sở thích bẩm sinh độc lập, bất biến.

### 7.3. Nghề phàm nhân của tu sĩ

Tu sĩ không bị cấm làm nông, làm mộc, nấu ăn hoặc làm nghề phàm nhân khác. Nghề tu chân được cộng điểm ưu tiên khi người đó đủ điều kiện và có nơi làm phù hợp.

Đây là lựa chọn thiết kế hiện tại, chưa có quy tắc buộc mọi tu sĩ phải bỏ nghề phàm sau khi nhập đạo.

## 8. AI làm việc và quan hệ với sinh hoạt

### 8.1. Quy trình nghề tại công trình

1. Chọn công trình phù hợp, hoàn tất xây dựng, còn độ bền và không phải phế tích.
2. Kiểm tra công trình thuộc đúng thế lực sử dụng lao động và phù hợp nơi cư trú khi có dữ liệu khu định cư.
3. Tìm vị trí đứng ở bên ngoài công trình, kiểm tra có thể đi tới bằng A*.
4. Đi tới vị trí đó rồi bắt đầu ca làm.
5. Trong ca, tiếp tục kiểm tra nơi làm, điều kiện và nguyên liệu.
6. Khi đủ tiến độ, kiểm tra lần cuối rồi mới trừ nguyên liệu và ghi kết quả.
7. Ghi mã ca đã hoàn thành để chặn lặp trong lịch sử gần đây.

Khoảng tìm công trình tối đa hiện là **600 pixel**, tương đương **37,5 ô** với ô 16 pixel. Đây là giới hạn tìm nơi làm, chưa phải quãng đường đi thực tế trên bản đồ.

Người lao động đứng làm bên ngoài công trình. Hệ nghề nghiệp mới chưa cho họ đi vào trong và ẩn khỏi bản đồ như cơ chế vào nhà ngủ.

### 8.2. Việc chuyên nghề và việc cộng đồng

Nếu chưa nhận việc cộng đồng và không có ý định sáng lập thôn/tông môn, AI thử lập kế hoạch làm nghề trước. Nếu không lập được kế hoạch, nó có thể quay về việc lao động hiện có.

Nhờ vậy, thiếu nguyên liệu không bắt buộc cư dân phải đứng yên. Tuy nhiên, việc ưu tiên nghề riêng có thể cạnh tranh nhân lực với việc xây dựng cộng đồng. Chưa có mô phỏng dài hạn để kết luận phân bổ hiện tại đã cân bằng.

### 8.3. Thời gian tu luyện

- Cửa sổ khởi động ca ưu tiên nằm trong khoảng **25% đến dưới 40% ngày**, có tính lệch lịch sinh hoạt của từng người.
- Khi có việc chuyên nghề phù hợp, điểm lao động được ưu tiên để tu sĩ có cơ hội bắt đầu làm.
- Khi một kế hoạch chuyên nghề đang thực hiện, AI ưu tiên hoàn tất nó thay vì đổi sang tu luyện ngay do giờ trong ngày thay đổi.
- Tự vệ, chạy trốn, nhu cầu sinh tồn khẩn cấp hoặc lệnh cấp cao vẫn có thể ngắt việc.

**Cần hiểu đúng:** Đây là điều chỉnh điểm ưu tiên AI, chưa phải lịch làm việc cứng hoặc giới hạn một ca mỗi ngày. Ca dài 8–12 giây mô phỏng có thể kéo qua nhiều ngày lịch vì game hiện quy định 5 giây ở tốc độ 1x cho một ngày. Cần cân bằng lại quan hệ giữa thời lượng ca và lịch tu luyện.

### 8.4. Nghề săn vừa được bổ sung

Luồng hiện có trong mã:

- Chỉ lập kế hoạch săn khi lương thực thô cá nhân dưới 6.
- Tìm xác động vật có dinh dưỡng còn lại trong phạm vi 220 pixel và có thể tiếp cận; ưu tiên pha thịt trước khi săn con sống.
- Nếu không có xác phù hợp và người có chỉ số chiến đấu, tìm động vật còn sống có HP tối đa không quá một nửa HP hiện tại của thợ săn.
- Dùng cơ chế tấn công hiện có để săn con mồi.
- Pha thịt cần ở gần xác, hoàn thành khoảng 3 giây công việc; lấy tối đa 40 dinh dưỡng mỗi lần, đổi 20 dinh dưỡng thành 1 lương thực thô.
- Không vượt mức 10 lương thực thô cá nhân; lượng dinh dưỡng xác được trừ và xác hết dinh dưỡng bị xóa.

Luồng này chưa có kiểm thử riêng sau khi thêm. Việc chọn con mồi mới dựa trên HP và đường đi; chưa đánh giá đầy đủ sức tấn công, độc, đàn thú hoặc độ nguy hiểm của loài. Cũng chưa có bẫy và thu da/xương.

## 9. Kinh nghiệm, bậc và hiệu suất

### 9.1. Bậc tay nghề

| Bậc nội bộ | Tên hiển thị | XP tích lũy tối thiểu | Hệ số hiệu suất tay nghề |
|---|---|---:|---:|
| 0 | Học việc | 0 | ×1,00 |
| 1 | Thợ sơ cấp | 100 | ×1,10 |
| 2 | Thợ lành nghề | 350 | ×1,20 |
| 3 | Chuyên gia | 900 | ×1,30 |
| 4 | Đại sư | 2.000 | ×1,40 |
| 5 | Tông sư | 4.500 | ×1,50 |

Các tên bậc đang dùng chung cho cả nghề phàm và nghề tu chân. Chưa có Nhất phẩm/Cửu phẩm hoặc phẩm nghề phụ thuộc cảnh giới.

### 9.2. Cách tăng kinh nghiệm

Chỉ nhận các sự kiện `work_completed` và `responsibility_completed` có kết quả lớn hơn 0, dữ liệu thời gian hợp lệ và người đủ điều kiện hành nghề.

Kinh nghiệm cơ bản cho mỗi công việc được chấp nhận:

```text
XP = 8 × (0,75 + ngộ_tính_cơ_bản / 200)
```

Ngộ tính trong phép tính được giới hạn về khoảng 0–100. Vì vậy XP cơ bản nằm trong khoảng **6–10 điểm/việc**, trước khi áp dụng giới hạn:

- Tổng XP nhận trong một ngày, cộng chung các nghề: tối đa 40.
- XP tích lũy mỗi nghề thông thường: tối đa 4.500.
- Bốn nghề học nền tảng: tối đa 350.

Số việc hoàn thành vẫn có thể tăng khi đã chạm giới hạn XP. Hệ thống ghi tối đa 96 mã sự kiện gần nhất để nhận diện sự kiện lặp, và một danh sách riêng tối đa 96 mã ca sản xuất/thu hoạch đã hoàn tất.

**Giới hạn:** Đây là chống lặp bằng lịch sử hữu hạn, không phải sổ cái lưu mọi sự kiện từ đầu thế giới. Chưa có chứng minh chống mọi trường hợp phát lại mã cũ đã bị loại khỏi danh sách.

### 9.3. Tác động thực tế của tay nghề

- Ca chuyên nghề và pha thịt mới có dùng hệ số tay nghề để tăng tốc tiến độ.
- Các nhánh lao động cũ có sử dụng hệ số lao động, như xây dựng hoặc cày cấy, được nối thêm hiệu suất nghề phù hợp.
- Khi chấm điểm nhận việc cộng đồng, tay nghề liên quan được cộng ưu tiên.
- Tay nghề đã học vẫn có thể hữu ích khi làm công việc liên quan dù người đó đã đổi nghề chính.

**Chưa hoàn thiện:** Không phải mọi hành động cũ đều đã áp dụng tăng tốc đồng nhất. Những nhánh dùng thời gian cố định như nấu ăn/hái lượm cần rà soát riêng. Màn hình hiện hiển thị phần trăm hiệu suất theo bậc, nên chưa nên hiểu là mọi thao tác của nghề đều đã nhanh hơn đúng tỷ lệ đó.

Ngoài ra, nghề mới chưa dùng đầy đủ các thuộc tính riêng như thần thức, khống hỏa, thư họa, thuật số hoặc hiệu ứng học nghề từ thiên phú. Hiện phép cộng XP dùng ngộ tính cơ bản của hồ sơ tài năng.

## 10. Kho hàng, chuỗi sản xuất và dịch vụ

### 10.1. Ai sở hữu hàng nghề?

Hàng nghề được giữ trong `ProfessionStockComponent` của **thế lực sử dụng lao động**.

- Nghề phàm thường ưu tiên thế lực nơi cư trú, sau đó mới xét thế lực người đó là thành viên.
- Nghề tu chân và nghề chỉ phục vụ tiên môn thường ưu tiên thế lực thành viên, sau đó mới xét nơi cư trú.
- Sản phẩm từ các ca công trình đi vào kho thế lực, không tự động vào túi cá nhân.
- Thịt do thợ săn thu được đi vào lương thực cá nhân.
- Chưa có kho độc lập cho mỗi thôn khi nhiều thôn thuộc cùng một thế lực; chưa có việc vận chuyển hàng giữa các kho.

### 10.2. Các tài nguyên mới

| Mã hàng | Tên trong game | Công dụng hiện tại |
|---|---|---|
| `prepared_herbs` | Dược liệu sơ chế | Chữa thương; bán khi dư |
| `metal` | Phôi kim loại | Luyện linh kim; chế linh kiện khôi lỗi; bán khi dư |
| `planks` | Gỗ gia công | Chế linh kiện khôi lỗi; bán khi dư |
| `cloth` | Vải | Chế phù; dệt linh bố; bán khi dư |
| `spirit_metal` | Phôi linh kim | Hàng cao cấp để bán; nguyên liệu dành cho mở rộng sau |
| `spirit_cloth` | Linh bố | Hàng cao cấp để bán; nguyên liệu dành cho mở rộng sau |
| `talismans` | Phù hộ thân | Dịch vụ an ninh tiêu thụ để tăng ổn định tốt hơn |
| `puppet_parts` | Linh kiện khôi lỗi | Hàng cao cấp để bán; chưa lắp thành khôi lỗi |

Lương thực, gỗ, đá, thảo dược, đan dược, linh thạch và ngân khố vẫn dùng các trường kho hiện có của thế lực.

### 10.3. Chuỗi hiện có

```text
Gỗ → Khoáng công → Đá/quặng thô
Đá/quặng thô + Gỗ → Thiết tượng → Phôi kim loại
Phôi kim loại + Linh thạch → Luyện khí sư → Phôi linh kim

Gỗ → Mộc công → Gỗ gia công
Gỗ gia công + Phôi kim loại + Linh thạch → Khôi lỗi sư → Linh kiện

Lương thực → Thợ dệt → Vải
Vải + Linh thạch → Phù lục sư → Phù hộ thân
Vải + Linh thạch → Linh chức sư → Linh bố

Thảo dược → Dược đồng → Dược liệu sơ chế → Lang trung / Linh y
Thảo dược + Linh thạch → Luyện đan sư → Kho đan dược

Hàng dư → Hành thương / Giám bảo sư → Ngân khố
```

Đây là các chuỗi đơn giản để kết nối nghề với tài nguyên đang có. Hai phép thay thế **đá/quặng thô → kim loại** và **lương thực → vải** đặc biệt cần được chủ dự án xem xét trước khi coi là thiết kế lâu dài.

### 10.4. Các dịch vụ

| Dịch vụ | Hiệu quả đang có | Điều kiện dừng/chờ |
|---|---|---|
| Lang trung | Hồi tối đa 10 HP cho một người sống thuộc cộng đồng ở gần | Không có người bị thương hoặc thiếu dược liệu |
| Linh y | Hồi tối đa 25 HP cho một người sống thuộc cộng đồng ở gần | Không có người bị thương hoặc thiếu đầu vào |
| Phục vụ tinh thần | Tăng tối đa 15 tinh thần cho tối đa 4 cư dân trong danh sách gần đó | Không tìm thấy ai có tinh thần dưới 85 |
| Sửa hộ trận | Hồi tối đa 40 độ bền cho công trình | Công trình đã đầy độ bền |
| An ninh | Tăng 1 ổn định; có phù thì dùng 1 phù để tăng 3 | Ổn định đã đạt 95 |
| Hành chính | Tăng 1 ổn định | Ổn định đã đạt 95 |

Phạm vi phục vụ người ở gần hiện là **100 pixel** quanh công trình. Việc nhận người phục vụ dùng quan hệ cư trú/thành viên thế lực, không phải tìm bất kỳ người lạ nào trên bản đồ.

### 10.5. Giá bán tạm

Người bán chỉ chọn một mặt hàng khi kho có ít nhất **6 đơn vị**, sau đó bán **1 đơn vị** mỗi ca.

| Mặt hàng | Tiền vào ngân khố mỗi đơn vị |
|---|---:|
| Dược liệu sơ chế | 2 |
| Gỗ gia công | 2 |
| Phôi kim loại | 3 |
| Vải | 3 |
| Linh bố | 8 |
| Phôi linh kim | 9 |
| Linh kiện khôi lỗi | 10 |

Giám bảo sư chỉ bán phôi linh kim, linh bố và linh kiện khôi lỗi, với hệ số giá ×1,25. Hành thương có thể bán các hàng trong bảng, bao gồm cả hàng cao cấp.

Chưa có người mua trả tiền từ một ngân khố khác, giá cung–cầu hoặc giới hạn nhu cầu bên mua. Cơ chế hiện tại là một nguồn chuyển hàng thành tiền của mô phỏng.

### 10.6. Giới hạn tồn kho và cạnh tranh nguyên liệu

- Mẻ mới bị chặn nếu lượng sản phẩm khả dụng cộng sản lượng mẻ vượt 100.
- Với lương thực, gỗ, đá và linh thạch, lượng khả dụng đã trừ phần đặt trước cho xây dựng.
- Hàng nghề trung gian không dùng cùng sổ đặt trước đó.
- Ca làm chưa đặt trước nguyên liệu ngay từ lúc bắt đầu; trước khi hoàn tất sẽ kiểm tra và trừ một lần.
- Hai người cùng trông chờ một phần nguyên liệu có thể khiến một ca thất bại sau khi người kia tiêu hết; hệ thống nhằm tránh trừ âm kho, nhưng chưa có cơ chế xếp hàng hoặc bảo đảm suất nguyên liệu cho từng người.
- Mốc 100 là ngưỡng dừng sản xuất, không phải sức chứa vật lý tuyệt đối của mọi kho. Hàng cộng dồn khi sáp nhập có thể vượt mốc này.

### 10.7. Các nguồn sản xuất cũ

Đã bỏ phần **luyện đan phòng tự tiêu thụ thảo dược và tự tạo đan** trong `BuildingSystem`.

Tuy nhiên, nguồn **lương thực tự tăng ở nông điền** và **thảo dược tự tăng ở dược điền** vẫn còn trong hệ công trình cũ. Chưa chuyển toàn bộ kinh tế sang nguyên tắc “mọi sản lượng đều cần người lao động”.

Điểm này quan trọng khi đánh giá đóng góp thực tế của Nông phu, Trực canh điền nông và Linh thực phu.

## 11. Giao diện đã bổ sung

Trong bảng thông tin cư dân, đã có phần hiển thị:

- Nhánh phàm trần hay tu chân và tên nghề chính.
- Bậc tay nghề, XP, thanh tiến độ và số công việc hoàn thành.
- Mô tả nghề.
- Nơi làm việc và cộng đồng sử dụng lao động.
- Phần trăm hiệu suất theo bậc.
- Các tay nghề khác đã có XP.
- Cảnh báo rõ các nghề mới có học nền tảng hoặc mới chế tạo linh kiện.

Trong bảng thông tin công trình thuộc thế lực, đã thêm danh sách sản phẩm nghề đang có trong kho thế lực.

**Chưa có:** màn hình quản lý tổng thể tất cả nghề, lọc cư dân theo nghề, giao nghề thủ công, chỉ tiêu tuyển dụng, hàng đợi sản xuất, giao diện chọn công thức hoặc bảng lương.

Chưa bổ sung nút nghề nghiệp/thả trang bị vào GodToolbar. Chưa có bộ hoạt ảnh riêng cho từng nghề; ca làm vẫn tận dụng trạng thái làm nông, nấu ăn hoặc xây dựng hiện có.

Giao diện đã được kiểm tra ở mức chuỗi HTML và thoát ký tự của tên công trình. Chưa có ảnh chụp hoặc xác nhận hiển thị trực tiếp trong trình duyệt.

## 12. Lưu/tải và tích hợp dữ liệu

### 12.1. Dữ liệu của cư dân

`ProfessionComponent` lưu:

- Phiên bản cấu trúc dữ liệu.
- Mã nghề chính và nơi làm việc.
- XP, số việc của từng nghề đã học.
- Ngày chọn nghề, ngày xét lại gần nhất và ngày làm việc gần nhất.
- Ngày tính giới hạn XP và lượng XP đã nhận trong ngày.
- Danh sách gần đây của mã sự kiện XP và mã ca đã hoàn thành.

### 12.2. Dữ liệu kho

`ProfessionStockComponent` lưu bảng số lượng hàng nghề trên thực thể thế lực. Nó được ghi và dựng lại riêng với dữ liệu nghề của từng người.

### 12.3. Xử lý bản lưu

- Bản lưu thuộc phiên bản được game chấp nhận nhưng chưa có dữ liệu nghề: khi tải sẽ thêm hồ sơ nghề rỗng cho Nhân tộc; hệ thống chọn nghề trong mô phỏng tiếp theo.
- Điều này không thay đổi quy tắc game đã có về việc từ chối những phiên bản bản lưu quá cũ.
- Có kiểm tra nghề không tồn tại, XP sai miền, `NaN`, `Infinity`, số việc âm, mã nơi làm không hợp lệ, danh sách chống lặp quá dài và dữ liệu nghề gắn sai đối tượng.
- Dữ liệu được kiểm tra trước khi thay thế thế giới đang chơi; bài kiểm thử có kiểm tra một bản lưu lỗi không làm mất hồ sơ nghề hiện tại.
- Nơi làm đã mất hoặc không còn hợp lệ được hệ nghề nghiệp kiểm tra lại; chưa coi mọi quan hệ tham chiếu nghề đều đã được kiểm chứng ở tất cả tình huống biến động thế lực.

### 12.4. Sáp nhập thế lực

Đã thêm hàm cộng hàng nghề từ kho nguồn sang kho đích, rồi xóa số hàng khỏi kho nguồn. Hàm được gọi trong đường sáp nhập ôn hòa hiện có trước khi xóa thế lực nguồn.

Phần này được bổ sung sau lượt kiểm thử nghề nghiệp đã ghi nhận. Chưa có kiểm thử chuyên biệt xác nhận chuyển kho một lần, cộng dồn vượt 100 và lưu/tải sau sáp nhập trên bản cuối.

## 13. Kết quả kiểm tra và độ chắc chắn

### 13.1. Những kết quả đã có bằng chứng

| Kiểm tra | Kết quả ghi nhận | Phạm vi và giới hạn |
|---|---|---|
| `npm.cmd run build` | Một lượt thành công; có cảnh báo gói JS lớn hơn 500 kB | Ở mốc triển khai trước một số sửa đổi cuối; chưa xác nhận build lại bản cuối |
| `npm.cmd test` | Lượt đã khởi chạy trước đó kết thúc với mã 0; đầu ra hoàn tất được đọc lại khi lập báo cáo | Bộ nghề chạy trước khi thêm các sửa đổi nghề săn/chuyển kho cuối; không dùng kết quả này để xác nhận toàn bộ mã hiện tại |
| Kiểm thử nghề nghiệp | 13 nhóm đã qua trong lượt trên | Có trong `tests/profession-regression.ts` |
| Kiểm tra HTML nghề | Đã kiểm tra nội dung nghề, ghi chú hạn chế, tên công trình được thoát ký tự và hàng trong kho | Không thay cho kiểm tra bố cục thực tế |
| Trình duyệt | Chưa kiểm tra trực tiếp bản nghề nghiệp | Chưa xác nhận không tràn khung, không mất trạng thái hoặc không lỗi khi chơi lâu |
| Hiệu năng riêng nghề nghiệp | Chưa có số đo chuyên biệt | Không suy từ benchmark hệ thống khác rằng hệ nghề đã đạt yêu cầu |

### 13.2. Nội dung 13 nhóm kiểm thử nghề nghiệp

1. Danh mục đủ 35 nghề, không trùng ID, chia 20/15 và công thức có giá trị hợp lệ.
2. Ranh giới 16 tuổi, người chết, đối tượng không hợp lệ; yêu cầu linh căn và cảnh giới.
3. Điều kiện thuộc tiên môn và Ma đạo.
4. Đổi nghề khi mất điều kiện, giữ XP nghề cũ và loại trẻ nhỏ.
5. Chỉ cộng XP cho kết quả hợp lệ, chống sự kiện lặp gần đây, giới hạn 40 XP và ranh giới lên bậc.
6. Ca làm trong cây hành vi với bước thời gian 0,05 / 0,25 / 1 giây; kiểm tra chưa đủ tiến độ và làm từ xa.
7. Công trình hỏng, đang xây, bị đổi chủ; nguyên liệu đặt trước; tranh chấp nguyên liệu và lặp mã ca.
8. Một số công thức thủ công, trần sản xuất, chữa thương, giao dịch và trần học nền tảng.
9. Điều kiện núi cho khai khoáng và công trình bị bao bởi địa hình không thể đi tới.
10. Khởi động ca trong buổi sáng, giữ mục tiêu làm việc và chuyển sang chiến đấu khi bị đe dọa.
11. Luyện đan phòng trống không tự sản xuất đan.
12. Lưu/tải nghề, hàng hóa, chống lặp, bản lưu thiếu nghề và từ chối dữ liệu lỗi trước khi thay thế thế giới.
13. HTML của bảng nghề và hàng hóa, bao gồm tên công trình có ký tự đặc biệt.

Các nhóm trên dùng tình huống dựng có kiểm soát. Chúng chưa chứng minh toàn bộ dân số tự hình thành chuỗi cung ứng ổn định trong một lần chơi dài.

### 13.3. Lý do chưa có kiểm chứng cuối

Ở lượt triển khai trước, thao tác build lại và mở bản chạy thử bị bộ xét duyệt tự động ngăn thực thi do hết hạn mức của bộ xét duyệt. Thông báo đó là lỗi hạn mức, không kết luận lệnh nguy hiểm và cũng không phải lỗi biên dịch.

Trong lượt lập báo cáo đã đọc lại mã nguồn và lấy kết quả hoàn tất của lượt test cũ; **chưa chạy một lượt build/test mới**. Vì vậy trạng thái cuối vẫn là chưa nghiệm thu.

## 14. Các quyết định tôi tự đặt, cần chủ dự án xem xét

| Nội dung | Giá trị/lựa chọn đang có | Điểm cần quyết định |
|---|---|---|
| Chủng tộc | Chỉ Nhân tộc | Có mở cho Ma tộc, Yêu tộc hóa hình hay không? |
| Tuổi nghề nghiệp | 16 tuổi | Học việc sớm hơn hay giữ tuổi này? |
| Số nghề | Một nghề chính, giữ XP nhiều nghề | Có cần nghề phụ hoặc giới hạn số nghề thành thạo? |
| Truyền nghề | Đủ điều kiện thì tự có thể chọn nghề | Có cần sư phụ, bí kíp, học phí và thời gian nhập môn? |
| Song thuộc tính | Là điều kiện bắt buộc cho một số nghề | Dùng điều kiện cứng hay chuyển thành lợi thế? |
| Bậc nghề | 6 bậc chung, không có phẩm nghề tu chân riêng | Có tách hai hệ cấp bậc? |
| Xét nghề | Mỗi 7 ngày; đổi sớm nếu mất điều kiện | Có quá thường xuyên cho xã hội mô phỏng? |
| XP | 6–10 XP/việc, tối đa 40/ngày | Nhịp trưởng thành nghề cần chậm/nhanh hơn? |
| Hiệu suất | Tối đa +50% theo bậc | Có thêm chất lượng, tỷ lệ thành công, tiết kiệm vật liệu? |
| Kho sản phẩm | Kho thế lực | Có tách kho thôn/xưởng và sở hữu cá nhân? |
| Nơi làm | Dùng công trình sẵn có | Có thêm lò rèn, xưởng mộc, xưởng dệt, y quán, chợ, mỏ? |
| Nguyên liệu | Gộp đá/quặng; dùng lương thực đại diện nguyên liệu dệt | Có tách quặng, than, sắt, bông, tơ và da ngay? |
| Chữa bệnh | Hồi HP | Có tách thương tích phàm và thương tích linh lực? |
| Võ giả, binh lính, quan lại | Một số nghề đang cùng tăng ổn định | Có cần cơ chế và điều kiện bổ nhiệm riêng? |
| Giao dịch | Giá cố định, bán hàng trực tiếp thành ngân khố | Có cần người mua thật và giao thương liên thế lực? |
| Nghề đặc thù | Được tự chọn học nền tảng, có tiêu hao đầu vào | Có nên tạm khóa tới khi có cơ chế chuyên môn? |
| Lịch làm của tu sĩ | Điểm ưu tiên AI và giữ ca đang làm | Có giới hạn số ca/ngày hoặc ngân sách thời gian? |
| Sản xuất nông nghiệp cũ | Vẫn có sản lượng tự động từ công trình | Có chuyển hoàn toàn sang cần lao động? |

Các câu hỏi này là nội dung để xem xét thiết kế. Chưa có câu trả lời mặc định nào được coi là chủ dự án đã phê duyệt.

## 15. Điểm cần sửa hoặc kiểm chứng thêm từ việc đọc mã

Các mục dưới đây là nhận xét từ mã hiện tại; trừ nơi có nói rõ, chưa có thử nghiệm riêng để xác nhận ảnh hưởng khi chơi. Lượt lập báo cáo chưa sửa chúng.

| Ưu tiên | Điểm cần xử lý | Căn cứ / ảnh hưởng có thể xảy ra |
|---|---|---|
| Cao | Kiểm chứng nghề săn và chuyển kho cuối | Hai phần thêm sau lượt kiểm thử nghề; chưa có kiểm thử riêng |
| Cao | Dịch vụ tinh thần phải chọn đúng người cần phục vụ | Kiểm tra nhu cầu quét mọi người gần, nhưng áp dụng hiệu quả cho 4 người đầu danh sách; có thể tiêu nguyên liệu khi người thực sự cần nằm ngoài nhóm đó |
| Cao | Đánh giá khả năng tự phát triển của làng | AI thử làm nghề trước việc cộng đồng chưa nhận; có nguy cơ thiếu người xây công trình hoặc thu nguyên liệu nền |
| Cao | Cân bằng việc học các nghề chưa có cơ chế | Bốn nghề nền tảng vẫn được chấm điểm tự chọn và tiêu hao thảo dược/linh thạch, cạnh tranh với sản xuất hữu ích |
| Trung bình | Thử công trình khác nếu công trình gần nhất không có đường | Hàm chọn nơi làm lấy công trình hợp lệ gần nhất trước, sau đó mới kiểm tra lối tiếp cận; chưa thử lần lượt mọi công trình thay thế |
| Trung bình | Hoàn thiện giới hạn thời gian lao động của tu sĩ | Đã có giữ ca để tránh bị ngắt, nhưng chưa có hạn mức ca/ngày; chưa đo tỷ lệ thời gian lao động/tu luyện |
| Trung bình | Chặn công việc vô hiệu ngay khi đổi nghề giữa ca | Việc hoàn tất kiểm tra lại nghề chính; cần kiểm tra ca đang dở có bị tiếp tục tốn thời gian khi nghề đổi hay không |
| Trung bình | Rà soát cộng XP đúng loại việc | Một số việc xây/khai khẩn vẫn phát miền nghề theo thiên hướng; sự kiện thu hoạch đang gộp hái lượm |
| Trung bình | Hiệu suất hiển thị phải khớp hành vi | Một số hoạt động cũ dùng thời gian cố định, chưa đồng nhất với phần trăm hiệu suất trên bảng nghề |
| Trung bình | Kiểm tra tranh chấp nhiều người làm một công trình | Chưa có giới hạn vị trí nghề hoặc hàng đợi riêng; kiểm tra kho tránh trừ âm chưa giải quyết hết tổ chức lao động |
| Trung bình | Tối ưu chọn nghề khi đông dân | Mỗi người xét nhiều nghề, quét công trình, thế lực và đồng nghiệp; cần số đo trước khi khẳng định chạy tốt ở 500–1.000 người |
| Trung bình | Cân bằng tác động nghề săn lên hệ động vật | Chưa đo số lượng động vật sau khi cư dân thực sự săn trong thời gian dài |
| Trung bình | Rà soát ca dở dang qua lưu/tải | Bộ nghề đã kiểm tra dữ liệu tổng thể; cần bài riêng cho tiến độ, chủ sử dụng lao động, mục tiêu săn và mã hoàn thành qua tải lại |
| Thiết kế | Thầy thuốc phàm và linh y chưa khác chuyên môn | Hiện khác mức hồi HP và đầu vào, chưa có loại bệnh hoặc thương tích riêng |
| Thiết kế | Phạm vi Nhân tộc cần thống nhất | Yêu tộc/Ma tộc hiện không được cấp nghề; không nên mô tả là mọi cư dân đều đã được hỗ trợ |
| Thiết kế | Tên phẩm nghề đang dùng chung | “Thợ lành nghề” cho người chỉ học lý thuyết và “Thợ sơ cấp” cho các tiên nghệ có thể chưa phù hợp không khí game |

## 16. Các bước tiếp theo được đề xuất

Đây là kế hoạch tiếp theo để xem xét, chưa phải danh sách đã hoàn thành.

### Bước 1 — Thống nhất phạm vi và các lựa chọn thiết kế

Ưu tiên chốt chủng tộc, tuổi học nghề, cách học/truyền nghề, điều kiện linh căn, kho sở hữu hàng hóa và cách xử lý bốn nghề mới có nền tảng.

**Điều kiện hoàn tất:** có quy tắc rõ cho các mục đó, tránh viết sâu thêm trên giả định chưa được thống nhất.

### Bước 2 — Sửa các điểm logic đã xác định và kiểm chứng mã cuối

- Chọn đúng đối tượng hưởng dịch vụ tinh thần.
- Thử nơi làm khác khi công trình đầu tiên không tiếp cận được.
- Kiểm thử riêng nghề săn, vật liệu hữu hạn, hai người tranh cùng xác thú và lưu/tải giữa lúc thu hoạch.
- Kiểm thử chuyển kho khi sáp nhập, không nhân đôi hoặc mất hàng, bao gồm tổng hàng vượt 100.
- Kiểm thử ca làm bị đổi nghề, mất linh căn, đổi nơi ở, đổi chủ công trình và gián đoạn bởi sinh tồn.
- Chạy lại build và toàn bộ bộ kiểm thử trên cùng bản mã cuối.

**Điều kiện hoàn tất:** kiểm thử qua; không dùng kết quả của bản trước để thay thế.

### Bước 3 — Chơi thử chuỗi nghề tự vận hành

Các tình huống nên thử:

1. Thôn có phàm nhân nhưng không có tu sĩ.
2. Thôn có cả phàm nhân và người có linh căn chưa nhập đạo.
3. Tông môn có ít người đủ điều kiện luyện đan/luyện khí.
4. Thiếu thảo dược, thiếu linh thạch, thiếu gỗ hoặc dư hàng thủ công.
5. Có người bị thương nhưng ở ngoài vùng phục vụ.
6. Công trình bị phá, thế lực tan rã hoặc sáp nhập.
7. Chạy dân số đông và theo dõi thời gian xét nghề.

**Điều kiện hoàn tất:** có số liệu sản lượng, thời gian lao động/tu luyện, số cư dân theo nghề, số ca thất bại và tác động đến hệ động vật.

### Bước 4 — Kiểm tra giao diện thực tế

- Xem bảng nghề trên cư dân phàm, tu sĩ, người chưa đủ tuổi và người đã đổi nghề.
- Xem nghề nền tảng có ghi rõ giới hạn.
- Xem bảng nghề và kho hàng trên màn hình nhỏ, tên dài, nhiều nghề đã học.
- Xác nhận lưu/tải không làm mất tiến bộ hiển thị.

**Điều kiện hoàn tất:** quan sát trực tiếp trong trình duyệt, có ghi nhận tình huống đã thử.

### Bước 5 — Mở rộng cơ chế chuyên môn theo lựa chọn đã chốt

Các phần có thể phát triển sau gồm xưởng nghề riêng, học nghề qua sư phụ, phẩm chất sản phẩm, tiền công, thương mại có người mua, nghề y theo loại thương tích và các tiên nghệ đặc thù.

Cơ chế vũ khí sẽ được thực hiện sau khi chủ dự án thống nhất yêu cầu riêng, như đã trao đổi.

## 17. Bản đồ file liên quan

### 17.1. File mới của hệ nghề nghiệp

| File | Vai trò |
|---|---|
| [professions.config.ts](</G:/game_tu_tien/src/config/professions.config.ts>) | 35 nghề, công thức, điều kiện, bậc và thông số |
| [ProfessionComponents.ts](</G:/game_tu_tien/src/modules/professions/ProfessionComponents.ts>) | Hồ sơ nghề của cư dân và kho hàng nghề |
| [ProfessionService.ts](</G:/game_tu_tien/src/modules/professions/ProfessionService.ts>) | Điều kiện, chọn nghề, XP, nơi làm, sản xuất, nghề săn và chuyển kho |
| [ProfessionSystem.ts](</G:/game_tu_tien/src/modules/professions/ProfessionSystem.ts>) | Lịch chạy xét nghề trong mô phỏng |
| [ProfessionSaveCodec.ts](</G:/game_tu_tien/src/modules/professions/ProfessionSaveCodec.ts>) | Kiểm tra, ghi và dựng lại dữ liệu nghề khi lưu/tải |
| [ProfessionPanel.ts](</G:/game_tu_tien/src/ui/ProfessionPanel.ts>) | HTML bảng nghề cư dân và hàng trong kho |
| [profession-regression.ts](</G:/game_tu_tien/tests/profession-regression.ts>) | 13 nhóm kiểm thử nghề nghiệp đã viết |

### 17.2. Các file hiện có đã nối thêm nghề nghiệp

| File | Phần nối thêm |
|---|---|
| [Engine.ts](</G:/game_tu_tien/src/core/Engine.ts>) | Tạo, đăng ký và đặt lại hệ nghề nghiệp |
| [BeingFactory.ts](</G:/game_tu_tien/src/modules/beings/BeingFactory.ts>) | Khởi tạo xét nghề khi tạo cư dân |
| [GrowthEvents.ts](</G:/game_tu_tien/src/modules/talent/GrowthEvents.ts>) | Nối sự kiện hoàn thành lao động sang XP nghề |
| [AIPlanner.ts](</G:/game_tu_tien/src/modules/ai/brain/planner/AIPlanner.ts>) | Thử lập kế hoạch hành nghề trong mục tiêu lao động |
| [StrategicGoal.ts](</G:/game_tu_tien/src/modules/ai/brain/goals/StrategicGoal.ts>) | Ưu tiên ca nghề và giữ kế hoạch đang làm |
| [BehaviorTree.ts](</G:/game_tu_tien/src/modules/ai/brain/behavior/BehaviorTree.ts>) | Thực thi ca nghề, pha thịt và hệ số tay nghề |
| [CommunityTaskBoard.ts](</G:/game_tu_tien/src/modules/ai/community/CommunityTaskBoard.ts>) | Ưu tiên người có tay nghề; nhận diện việc đốn gỗ |
| [BuildingSystem.ts](</G:/game_tu_tien/src/modules/factions/BuildingSystem.ts>) | Bỏ phần luyện đan tự động của công trình |
| [FactionSystem.ts](</G:/game_tu_tien/src/modules/factions/FactionSystem.ts>) | Chuyển kho nghề khi sáp nhập ôn hòa |
| [factions.config.ts](</G:/game_tu_tien/src/config/factions.config.ts>) | Cập nhật mô tả luyện đan phòng |
| [SaveManager.ts](</G:/game_tu_tien/src/modules/save/SaveManager.ts>) | Gọi các bước kiểm tra, lưu và tải dữ liệu nghề |
| [InspectorPanel.ts](</G:/game_tu_tien/src/ui/InspectorPanel.ts>) | Hiển thị bảng nghề và sản phẩm nghề |
| [run.mjs](</G:/game_tu_tien/tests/run.mjs>) | Đăng ký bộ kiểm thử nghề nghiệp |

Dự án đang có nhiều thay đổi từ các công việc trước. Không phải toàn bộ file đang hiện thay đổi trong Git đều do hệ nghề nghiệp; danh sách trên chỉ ghi những điểm tích hợp liên quan đến báo cáo này. Chưa tạo commit riêng cho hệ nghề nghiệp.

## 18. Phiếu ghi ý kiến của chủ dự án

Có thể ghi trực tiếp vào bảng này hoặc trao đổi theo số mục.

| Mục cần xem xét | Ý kiến / yêu cầu thay đổi |
|---|---|
| 1. Chủng tộc được hành nghề | |
| 2. Tuổi học việc và tuổi hành nghề | |
| 3. Số nghề chính/phụ một người được có | |
| 4. Tự học hay bắt buộc có sư phụ/bí kíp | |
| 5. Điều kiện song linh căn | |
| 6. Bậc nghề phàm nhân và phẩm nghề tu chân | |
| 7. Chu kỳ đổi nghề, nhịp tăng XP | |
| 8. Xưởng nghề riêng và vật tư riêng | |
| 9. Sở hữu hàng hóa: cá nhân, thôn, thế lực | |
| 10. Mức mô phỏng thương mại, vận tải, hành chính | |
| 11. Giữ hay tạm khóa các nghề chỉ có học nền tảng | |
| 12. Nông nghiệp có bắt buộc người lao động hay không | |
| 13. Thời gian lao động so với tu luyện | |
| 14. Nhóm nghề muốn hoàn thiện trước | |

**Mốc đánh giá của tài liệu:** Bản triển khai nền tảng đã có trong mã nguồn, còn những giới hạn thiết kế và kiểm chứng được nêu cụ thể ở trên. Chưa đủ cơ sở gọi đây là hệ “bách nghệ” hoàn chỉnh theo toàn bộ mô tả của tài liệu gốc.
