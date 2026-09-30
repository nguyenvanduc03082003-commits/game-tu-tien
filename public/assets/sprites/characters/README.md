# Thêm ngoại hình nhân vật và trang phục

Game tự nhận các bộ hợp lệ trong thư mục này khi mở lại trang ở chế độ phát triển. Không cần sửa TypeScript. Với bản đóng gói, chạy lại `npm run build` và cập nhật thư mục phát hành.

## Bắt đầu từ bộ mẫu

Bộ mẫu kỹ thuật nằm trong `examples/appearance-template` tại gốc dự án. Các hình khối màu chỉ để kiểm tra khung và sự khớp giữa thân/áo, không phải mỹ thuật chính thức.

- Chép `examples/appearance-template/characters/human/template_resident` vào `public/assets/sprites/characters/human/`.
- Chép `examples/appearance-template/equipment/linen_robe` vào `public/assets/sprites/equipment/` để thử mặc Thô Bố Đạo Bào bằng công cụ ban giáp hiện có.
- Mở lại game, thả nhân tộc mới. Nhân vật cũ không đổi mẫu.
- Tab Trang Bị có nút tháo trang phục khi đang mặc. Tab Não AI hiển thị mã mẫu/giai đoạn.
- Đổi tên `template_resident` thành ID riêng trước khi vẽ bộ chính thức. ID chỉ dùng chữ thường, số, `_`, `-`, bắt đầu bằng chữ cái.

## Thư mục bộ nhân vật

```text
characters/human/mau_001/
  child/body.png
  child/casual.png
  adult/body.png
  adult/casual.png
  elder/body.png
  elder/casual.png
```

Ma tộc dùng `characters/demon/mau_001/`. Thú dùng `characters/beast/tiger/mau_001/`; thay tiger bằng wolf, leopard, bear, eagle, dragon, ape, deer, rabbit hoặc crane. Tên loài này khớp dữ liệu cư dân hiện tại. Thêm thư mục của loài hoàn toàn mới chưa làm phát sinh luật gameplay cho loài đó.

`body.png` là cơ thể/mặt/tóc. `casual.png` là đồ thường tách riêng; bắt buộc với người và ma, có thể bỏ với thú. Cả hai là PNG nền trong suốt, dùng cùng bố cục. Khi mặc giáp, game thay casual bằng hình giáp, nên không vẽ áo thường rộng liền vào body. Ảnh gộp toàn thân không thể tự tách áo bằng hệ thống này.

## Chuẩn khung hiện tại

- Mặc định frame 64×64 px; bảng ảnh **384×512 px** (6 cột × 8 hàng).
- Điểm đặt chân: x=32, y=56 của mỗi frame. Trẻ vẽ nhỏ hơn bên trong cùng khung.
- Hàng 0–3: đứng yên, lần lượt xuống/trái/phải/lên, 4 frame đầu mỗi hàng, 5 frame/giây. Hai cột cuối bỏ trống.
- Hàng 4–7: di chuyển, lần lượt xuống/trái/phải/lên, đủ 6 frame mỗi hàng, 10 frame/giây.
- Chỉ số hàng/cột bắt đầu từ 0. Hướng trái/phải được vẽ riêng, không tự lật.
- Các hành động khác hiện dùng pose đứng yên chung cho thân và áo. Khi chết dùng frame tĩnh xoay nằm ngang. Chưa hỗ trợ khai báo thêm hàng đánh, ngủ, làm việc trong bộ mới.
- Nếu dùng frame 32×32, bảng ảnh 192×256, điểm chân (16,28); thêm `appearance.json` như dưới.

```json
{"frameSize":32,"bodyProfile":"humanoid_standard","weight":1}
```

File này không bắt buộc nếu dùng chuẩn 64. `bodyProfile` là dáng/nhịp hoạt ảnh dùng chung để mặc cùng bộ áo. Mặc định người và ma là `humanoid_standard`; thú là ID loài. Đổi profile nếu cấu trúc cơ thể khác. `weight` là trọng số xuất hiện, mặc định 1, phải lớn hơn 0.

## Trang phục

```text
equipment/linen_robe/humanoid_standard/
  child/front.png
  adult/front.png
  elder/front.png
```

- Tên thư mục đầu tiên là ID giáp gameplay hiện có: linen_robe, black_iron_armor, demon_scale_armor, golden_silk_armor, celestial_silk_robe.
- `front.png` bắt buộc đủ ba giai đoạn, cùng canvas và pose với thân.
- Có thể thêm `back.png` trong mỗi giai đoạn cho phần vẽ sau cơ thể; thứ tự vẽ: back → body → front.
- Nếu frame 32, thêm `visual.json` trong thư mục profile với nội dung `{"frameSize":32}`.
- Cùng profile nhưng khác frameSize không được mặc chung. Người và thú không tự dùng chung trang phục.
- Trang phục không có ảnh phù hợp sẽ bị từ chối khi ban mặc mới, có thông báo trong game. Đồ từ save cũ được giữ, dù thiếu ảnh thì dùng ngoại hình dự phòng.
- Hiện hỗ trợ thay một bộ trang phục toàn thân qua ô giáp. Vũ khí/công cụ vẫn dùng hình đơn giản cũ; chưa có atlas nhiều lớp cho từng vũ khí hay ô mũ riêng.

## Kiểm tra lỗi và giữ danh tính

Chạy `npm run assets:check` để xem số bộ nhận được và file sai kích thước/thiếu giai đoạn. Bộ sai bị loại riêng; game vẫn chạy với hình mặc định nếu chưa có bộ hợp lệ. PNG không giải mã được cũng bị loại khi mở game.

Mã mẫu gồm chủng tộc/loài/tên thư mục. Thêm mã mới không thay cư dân cũ. Thay pixel của cùng mã sẽ cập nhật hình của người đang dùng mã đó. Xóa mã: nhân vật dùng dự phòng nhưng save vẫn giữ mã cũ; thêm lại mã sẽ khôi phục. Đừng đổi tên thư mục của mẫu đã sử dụng nếu muốn giữ liên kết.

Bản development quét lại danh mục khi trang được mở/F5, không phải mỗi frame. Chỉ thêm ảnh rồi bấm thả trong phiên cũ chưa đủ; hãy mở lại trang. Bản tĩnh đã build chỉ đọc danh mục đóng gói cùng bản phát hành.
