# Kế hoạch ngoại hình, trang phục và vòng đời nhân vật

Ngày lập: 24/09/2026. Trạng thái: kế hoạch triển khai, chưa thực hiện thay đổi runtime trong đợt lập kế hoạch này.

## 1. Yêu cầu đã xác nhận

- Áp dụng cho tất cả chủng tộc.
- Mỗi bộ ngoại hình có trẻ em, trưởng thành và già, kèm hoạt ảnh di chuyển tương ứng.
- Người dùng thêm bộ ảnh vào thư mục rồi mở lại game; không cần nạp nóng trong phiên.
- Khi thả: tuổi nguyên ngẫu nhiên trong đoạn 15–30, bao gồm hai đầu.
- Sinh tự nhiên: tuổi 0, ngoại hình chọn ngẫu nhiên trong nhóm phù hợp; chưa triển khai di truyền ngoại hình.
- Một nhân vật giữ mã bộ ngoại hình suốt đời; lớn lên chỉ chuyển giai đoạn trong bộ đó.
- Thêm bộ mới chỉ mở rộng lựa chọn của các nhân vật được tạo sau; không bốc lại ngoại hình cư dân cũ.
- Cư dân mới mặc đồ thường về mặt hình ảnh; không phát trang bị/vũ khí/pháp bảo/đan dược. Kế hoạch cũng bỏ cấp công cụ tự động theo nghề, theo diễn giải đã trình bày.
- Mặc trang phục nào phải thể hiện trang phục đó trên bản đồ, đồng bộ hướng và động tác.
- Lưu/tải giữ ngoại hình, tuổi, đặc điểm và trang bị.

## 2. Các mặc định thiết kế cần phân biệt với yêu cầu đã xác nhận

- Mỗi mẫu hợp lệ có xác suất bằng nhau trong cùng nhóm; hỗ trợ trọng số cấu hình nhưng mặc định là 1.
- Giai đoạn trẻ em dưới 15, trưởng thành từ 15. Mốc già lấy theo ngưỡng già yếu hiện có, đặt trong cấu hình theo chủng tộc. Đây là đề xuất triển khai, không phải mốc tuổi người dùng đã chỉ định.
- Giữ thức tỉnh linh căn ở tuổi 12, tách khỏi điều kiện hết tuổi trẻ em. Không tự thay đổi cân bằng tu luyện.
- Nếu thọ nguyên tăng và nhân vật thoát ngưỡng già yếu, hình quay về trưởng thành theo chính sách tuổi dựa trên thọ nguyên. Đặt chính sách này thành cấu hình để sau này chọn già theo tuổi thực hoặc trẻ hóa do tu luyện.
- Giữ ý nghĩa các archetype đặc biệt về cảnh giới/đặc điểm cố định; chỉ bỏ đồ phát sẵn. Ngoại hình độc lập với sức mạnh. Bổ sung đặc điểm ngẫu nhiên phải kiểm tra xung đột với đặc điểm bắt buộc.
- Các loài trong nhóm yêu thú có mã loài riêng, không dùng tên hiển thị làm định danh. Đây là điều kiện để hổ không chọn hình của thỏ.

## 3. Hiện trạng và điểm nối cần sửa

| Vị trí | Hiện trạng | Công việc |
|---|---|---|
| BeingFactory | Khởi tạo tuổi theo chủng tộc, sprite chung; phát trang bị và đan | Tách nguồn tạo, tuổi 15–30/0, chọn mẫu và khởi tạo không đồ |
| BeingComponents | AnimationComponent giữ configId; chưa có danh tính ngoại hình | Thêm AppearanceComponent và định danh loài |
| animations.config | Cấu hình cố định, chưa biểu diễn đầy đủ clip theo hướng | Dùng hồ sơ hoạt ảnh chung và danh mục runtime |
| AssetManager | Chỉ tải các ảnh đã khai báo | Nạp manifest, kiểm tra bộ ảnh, quản lý cache |
| AnimationSystem | Chọn frame theo trạng thái | Dùng một pose/frame thống nhất cho thân và trang phục |
| EntityRenderer | Sprite đơn; vũ khí là hình đơn giản; chưa vẽ giáp | Thêm renderer nhiều lớp, giữ tỷ lệ ảnh và điểm đặt chân |
| EquipmentComponent | Có bodyArmor, hai tay, artifact, workTool | Thêm liên kết hình trang bị và kiểm tra tương thích |
| NeedsSystem/SpiritualRootSystem | Tăng tuổi; thức tỉnh tự xóa isChild | Tách tuổi, thức tỉnh và giai đoạn cơ thể |
| SaveManager | Lưu component thủ công, phục hồi não AI | Lưu ngoại hình bằng ID, bổ sung migration |
| Social/Childcare | Có quan hệ và giám hộ; chưa có chu trình sinh con hoàn chỉnh | Tạo API newborn và giai đoạn sinh sản riêng |

## 4. Chuẩn ảnh và trang phục

### 4.1. Hồ sơ hoạt ảnh dùng chung

Thiết lập một hồ sơ mẫu được kiểm tra trực quan trước khi người dùng vẽ hàng loạt:

- Khung vuông 64×64 px, PNG trong suốt, điểm chân mặc định (32, 56); quy mô hiển thị tách khỏi kích thước khung. Đây là chuẩn khởi đầu đề xuất; 32×32 được hỗ trợ bằng hồ sơ riêng.
- Mỗi giai đoạn dùng cùng khổ canvas và điểm chân; trẻ được vẽ nhỏ hơn bên trong canvas.
- Bắt buộc idle và walk cho bốn hướng down/left/right/up.
- Hồ sơ mẫu: 4 frame idle và 6 frame walk; 8 hàng: idle down/left/right/up, sau đó walk down/left/right/up. Cột trống cuối hàng idle được bỏ qua.
- Các động tác meditate, attack, breakthrough, sleep, farm, cook, build, recreate, dead là mở rộng. Nếu thiếu, chọn pose dự phòng thống nhất cho toàn bộ các lớp, không để thân dùng idle trong khi áo dùng động tác khác.
- Mặc định không tự lật ảnh trái/phải để tránh sai tay cầm và trang phục bất đối xứng. Hồ sơ có thể khai báo mirror khi bộ ảnh thực sự phù hợp.

### 4.2. Giải quyết đồ thường bị lộ dưới trang phục

Một ảnh nhân vật đã vẽ áo rộng không thể tự bóc áo cũ ra bằng code. Để thay trang phục chính xác, chuẩn chính là:

- `body.png`: nhân dạng/cơ thể, tóc và phần nền tối thiểu không nhô ra khỏi trang phục.
- `casual.png`: lớp đồ thường hiển thị khi không có trang phục thay thế.
- Trang phục đang mặc thay lớp casual tương ứng, không chồng cả hai một cách vô điều kiện.
- Bộ PNG đã gộp sẵn vẫn có chế độ tương thích, nhưng chỉ dùng được lớp phủ che đủ áo nền; không cam kết thay áo chính xác cho mọi thiết kế.
- Không tự tạo các frame hoặc lớp thiếu từ một ảnh tĩnh. Bộ mẫu và hướng dẫn sẽ chỉ rõ dữ liệu người dùng phải vẽ.

### 4.3. Tổ chức thư mục đề xuất

```text
public/assets/sprites/
  characters/
    human/human_001/
      child/body.png
      child/casual.png
      adult/body.png
      adult/casual.png
      elder/body.png
      elder/casual.png
      appearance.json           # Chỉ cần khi khác mặc định
    demon/demon_001/...
    beast/tiger/tiger_001/...
  equipment/
    linen_robe/
      visual.json
      humanoid_standard/
        child/front.png
        adult/front.png
        elder/front.png
```

Đường dẫn nhân vật cho phép suy ra ID, chủng tộc và loài; bộ đúng chuẩn không cần sửa JSON hoặc TypeScript. `appearance.json` chỉ cần để thay hồ sơ khung, bodyProfile, tên hoặc trọng số. Một thư mục mới là mẫu của loài hiện có; thêm loài gameplay hoàn toàn mới còn cần định nghĩa loài.

Ảnh trang phục được dùng chung theo `bodyProfile`, không phải mỗi khuôn mặt một bộ áo. Nhân tộc/ma tộc có thể dùng chung chỉ khi cùng cấu trúc và nhịp chuyển động. Thú bốn chân dùng profile riêng, không kéo giãn áo người lên thân thú.

Giai đoạn đầu dùng một ô trang phục toàn thân gắn với `bodyArmor` hiện có. Thiết kế layer sẵn chỗ cho mũ/áo choàng nhưng không mở thêm các ô đồ khi chưa có gameplay tương ứng.

## 5. Các giai đoạn triển khai và điều kiện hoàn thành

### Giai đoạn A — Danh mục dữ liệu và công cụ thêm ảnh

1. Tạo kiểu AppearanceDefinition, AnimationProfile, EquipmentVisualDefinition và SpeciesDefinition tối thiểu.
2. Tạo script quét thư mục, kiểm tra ID trùng, đường dẫn, ba giai đoạn, kích thước PNG và bố cục frame.
3. Tạo manifest có phiên bản; sắp xếp ổn định; tách lỗi từng bộ. Bộ không hợp lệ bị loại khỏi lựa chọn mới, ảnh mặc định vẫn khả dụng.
4. Gắn quét với npm dev và npm build. Trong dev, endpoint danh mục phải quét ở lần mở trang mới hoặc sự kiện thay đổi thư mục để F5 nhận mẫu mới ngay cả khi server chưa khởi động lại.
5. Khi xuất bản, quét trong build và đóng gói ảnh + manifest. Bản tĩnh không tự duyệt thư mục máy người dùng; muốn thêm ảnh vào bản đã xuất phải cập nhật bộ phát hành.
6. Không quét thư mục hoặc tải toàn bộ ảnh lại mỗi frame. Cache ảnh dùng chung; chưa có mẫu đã tải thì dùng dự phòng tới khi sẵn sàng.

Hoàn thành khi: chép hai bộ đúng chuẩn, mở lại trang và thấy chúng trong danh mục mà không sửa code; một bộ lỗi không chặn game.

### Giai đoạn B — Danh tính ngoại hình và khởi tạo cư dân

1. Thêm AppearanceComponent: appearanceId, bodyProfileId, phiên bản dữ liệu và thông tin cần giữ ổn định. Giai đoạn tuổi được suy ra từ tuổi/chính sách, không lưu thêm bản sao dễ lệch.
2. Tạo hàm chọn mẫu theo raceId/speciesId; loại bộ vô hiệu, trọng số không hợp lệ; dùng RNG có thể gắn seed để kiểm thử.
3. Tách nguồn tạo: manual, world_initial, newborn, restore. Restore tuyệt đối không chạy random khởi tạo.
4. Manual: random nguyên 15–30. Newborn: 0. World_initial dùng chính sách được cấu hình, mặc định 15–30 cho cư dân tạo mới.
5. Giữ cách sinh đặc điểm có kiểm tra xung đột, không reroll khi đổi đồ hoặc lớn lên. Khởi tạo equipment rỗng và inventory đan rỗng; bỏ cấp đồ theo archetype và nghề.
6. Kiểm tra AI lao động/tự vệ hoạt động khi không có công cụ. Không đồng thời xóa thực phẩm sinh tồn vì người dùng chưa yêu cầu thay đổi phần đó.
7. Bổ sung định danh loài rõ ràng ở điểm tạo thú, đồng bộ tên với loài; thay dần các điểm suy luận loài từ tên liên quan đến hành vi để hình và hành vi không mâu thuẫn.

Hoàn thành khi: mọi nhóm cư dân thả có tuổi trong khoảng, mẫu đúng nhóm, không đồ phát sẵn và đặc điểm không đổi sau nhiều tick.

### Giai đoạn C — Renderer và trang phục thật

1. AnimationSystem tạo pose chung: action, direction, frame, profile.
2. AppearanceResolver chọn bộ theo tuổi và hình trang phục từ EquipmentComponent.
3. LayeredCharacterRenderer vẽ lớp sau → cơ thể → trang phục trước → vật cầm tay theo quy định của hướng. Cho phép back/front đối với áo choàng hoặc trang phục cần che khuất.
4. Các lớp dùng cùng scale, anchor và frame; không ép khung chữ nhật thành hình vuông.
5. Khi có giáp thay toàn thân, ẩn lớp casual; tháo giáp phục hồi casual. Không đổi mặt/tóc/mã nhân vật.
6. Dùng cấu hình hình vũ khí/công cụ khi có, giữ dự phòng hiện tại trong lúc chưa có ảnh. Cầm công cụ theo hành vi làm việc, vũ khí theo chiến đấu; tránh vẽ trùng hai hệ.
7. Trang phục có ảnh chỉ được mặc lên profile tương thích. Thiếu hình tương thích: từ chối thao tác mặc mới với lý do rõ ràng; save cũ giữ vật phẩm và dùng hình dự phòng kèm chẩn đoán, không âm thầm xóa đồ/chỉ số.
8. Đổi giai đoạn tuổi phải có biến thể trang phục hoặc fallback đã khai báo. Validator yêu cầu bộ trang phục dùng xuyên đời có đủ các biến thể cần thiết.
9. Tích hợp đường mặc/tháo hiện có và tạo giao diện kiểm tra nội bộ để chứng minh hình ↔ trang bị đồng bộ. Không cần xây cả hệ thống cửa hàng/chế tạo trong giai đoạn này.

Hoàn thành khi: đổi áo, tháo áo, đi bốn hướng và chuyển động đều khớp trên bản đồ; không lộ áo nền, không lệch chân; cùng bộ áo dùng được trên nhiều mẫu chung bodyProfile.

### Giai đoạn D — Tuổi và phát triển

1. Tạo LifeStageSystem chạy sau cập nhật tuổi và trước AI/animation cần đọc kết quả. Xử lý cả thay đổi thọ nguyên do đan hoặc tu luyện, không chỉ sự kiện năm mới.
2. Đưa mốc tuổi vào cấu hình; cập nhật ChildcareComponent theo mốc trưởng thành.
3. Bỏ việc SpiritualRootSystem tự chuyển isChild về false khi thức tỉnh; giữ cơ chế thức tỉnh độc lập.
4. Chuyển giai đoạn không thay appearanceId, innate traits hoặc tính cách. Reset frame nếu thay atlas để không đọc vượt ảnh.
5. Kiểm tra trẻ không bị nhận việc người lớn chỉ do có linh căn; các hành vi sinh tồn phù hợp vẫn chạy.
6. Tuổi hiển thị đúng khi tải save, tua nhanh và qua nhiều năm. Rà soát sự kiện tăng tuổi bị gộp trước khi dùng làm nguồn chuyển giai đoạn.

Hoàn thành khi: trẻ 14 → 15 đổi đúng hình cùng bộ; già/thoát già theo cấu hình; không thức tỉnh hoặc ghi lịch sử lặp lại.

### Giai đoạn E — Trẻ sinh ra và sinh sản

1. Xây createNewborn dùng pipeline ở giai đoạn B, liên kết cha mẹ/người giám hộ và lịch sử ra đời.
2. Trẻ chọn mẫu ngẫu nhiên của chủng tộc/loài phù hợp; không lấy ngẫu nhiên toàn bộ kho ảnh và chưa trộn hai loài.
3. Gắn quan hệ cha mẹ–con hai chiều, danh sách con, vị trí sinh hợp lệ và nhu cầu ban đầu.
4. Kiểm thử vòng đời bằng tạo trẻ có kiểm soát trước khi bật sinh tự nhiên.
5. Sinh sản tự nhiên là một nhánh triển khai riêng: dữ liệu cặp có khả năng sinh sản, điều kiện trưởng thành, cooldown theo thời gian mô phỏng, giới hạn dân số và điều kiện chăm sóc. Không giả định quan hệ đạo lữ hiện tại đã đủ dữ liệu để sinh con.
6. Đặt tham số sinh sản trong cấu hình; hiệu chỉnh bằng mô phỏng trước khi bật mặc định. Quy tắc khác chủng tộc/loài chưa hỗ trợ ở bản đầu.

Hoàn thành tích hợp ngoại hình khi: trẻ thực sự được tạo qua createNewborn và lớn lên đúng mẫu. Hoàn thành sinh sản tự nhiên chỉ khi nhánh điều kiện/cooldown/giới hạn đã được triển khai và kiểm thử, không chỉ có hàm tạo trẻ.

### Giai đoạn F — Save, di chuyển dữ liệu và chẩn đoán

1. Lưu appearanceId, speciesId/bodyProfile khi cần, dữ liệu gia đình và ID trang bị; không nhúng pixel hoặc lưu đường dẫn tuyệt đối.
2. Tăng phiên bản save, thêm migration cho save cũ: gán mẫu một lần và lưu lại; không xóa trang bị người cũ.
3. Mẫu bị xóa: giữ ID, dùng hình dự phòng; khi ảnh quay lại thì khôi phục. Đổi ID thư mục được coi là mẫu khác, phải có hướng dẫn đổi tên an toàn/alias nếu cần.
4. Cùng ID nhưng sửa pixel là cập nhật hình của bộ hiện hữu, nên ảnh cư dân đang dùng ID đó có thể thay đổi. Muốn chỉ dành cho nhân vật mới phải tạo ID mới.
5. Inspector hiển thị mã mẫu, loài, giai đoạn, profile và đồ đang hiển thị. Bảng chẩn đoán liệt kê file thiếu, ID trùng và ảnh không tương thích.

Hoàn thành khi: save mới round-trip giữ dữ liệu; save cũ mở được; thêm/xóa mẫu không đổi danh tính hoặc gây crash.

## 6. Kiểm thử bắt buộc

| Nhóm | Ca kiểm tra |
|---|---|
| Danh mục | Thêm bộ mới rồi F5; sai kích thước; thiếu giai đoạn; ID trùng; thư mục rỗng; URL khi build |
| Ngẫu nhiên | Seed tái lập; không chọn khác chủng tộc/loài; không sinh tuổi ngoài 15–30; không kiểm tra bằng xác suất dễ flaky |
| Khởi tạo | Mọi archetype không đồ phát sẵn; nghề vẫn hoạt động; giữ đặc điểm bắt buộc và loại xung đột |
| Vòng đời | Tuổi 0/14/15/ngưỡng già; qua nhiều năm; tăng thọ nguyên; không đổi bộ hoặc reroll traits |
| Trang phục | Mặc/tháo/đổi; bốn hướng; đủ frame; giữ anchor; không lộ casual; profile không tương thích |
| Hoạt ảnh | Clip thiếu dùng fallback chung; thay atlas reset frame; chết/đứng yên không đọc frame vượt giới hạn |
| Gia đình | Newborn đúng tuổi/loài; quan hệ hai chiều; giám hộ mất; cooldown và giới hạn nếu bật sinh tự nhiên |
| Save | Save cũ/mới; mẫu bị xóa rồi thêm lại; thứ tự manifest thay đổi; cư dân cũ không reroll |
| Hiệu năng | 100/500/1.000 thực thể; số ảnh/cache tăng theo bộ dùng chung; không fetch theo frame |

Kiểm chứng bằng npm test, npm run build và kiểm tra ảnh chụp/browser với các bộ ảnh mẫu. Báo số liệu đo, không cam kết FPS trước khi benchmark. Kiểm thử PNG mẫu chỉ phục vụ kỹ thuật, không thay cho bộ mỹ thuật người dùng cung cấp.

## 7. Thứ tự bàn giao

1. Chuẩn ảnh + thư mục mẫu + công cụ kiểm tra/manifest.
2. Chọn mẫu khi thả + tuổi 15–30 + không phát đồ + save cơ bản.
3. Hiển thị trang phục theo lớp với một bộ mẫu kiểm chứng trước khi mở rộng ảnh hàng loạt.
4. Chuyển giai đoạn theo tuổi + API trẻ sơ sinh + save đầy đủ.
5. Sinh sản tự nhiên và hiệu chỉnh dân số theo cấu hình.
6. Hoàn tất hướng dẫn người dùng, chẩn đoán tài nguyên và benchmark.

Mỗi mốc cần có tiêu chí hoàn thành ở trên. Có thể xây mã và test fixture trước khi nhận ảnh mỹ thuật; việc xác nhận trang phục đẹp, không lệch trên các dáng thật phụ thuộc bộ ảnh thực tế. Không cần người dùng cung cấp toàn bộ kho ảnh ngay từ đầu: nên kiểm chứng một bộ nhân vật và một bộ trang phục cùng profile trước.
