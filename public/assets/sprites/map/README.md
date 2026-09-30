# Hướng Dẫn Thêm Đồ Họa Bản Đồ (Map Tilesets)

Thư mục này dùng để chứa file ảnh texture cho các loại ô địa hình của thế giới.

## 1. Danh Sách Tên File Quy Chuẩn
Mỗi ô địa hình trong game tương ứng với 1 file ảnh định dạng `.png`:

| Tên File | Loại Địa Hình | Kích Thước Khuyến Nghị |
| :--- | :--- | :--- |
| `terrain_plain.png` | Đồng Bằng (Cỏ xanh, hoa đồng nội) | 16x16 px (hoặc 32x32, 64x64) |
| `terrain_hill.png` | Đồi Thấp (Đất dốc mấp mô) | 16x16 px |
| `terrain_mountain.png` | Núi Cao (Đá xám, tuyết trắng) | 16x16 px |
| `terrain_dense_forest.png`| Rừng Rậm (Cây rậm rạp, tán lá) | 16x16 px |
| `terrain_plateau.png` | Cao Nguyên (Đất đỏ, gió lớn) | 16x16 px |
| `terrain_swamp.png` | Đầm Lầy (Nước đen, rêu phong) | 16x16 px |
| `terrain_river.png` | Sông Ngòi (Dòng nước biếc) | 16x16 px |
| `terrain_lake.png` | Hồ Nước (Mặt nước trong xanh) | 16x16 px |
| `terrain_ocean.png` | Biển Cả (Sóng đại dương) | 16x16 px |

## 2. Cách Kích Hoạt
Chỉ cần thả file ảnh đúng tên vào thư mục này:
1. Game sẽ tự động nhận diện và hiển thị ảnh của bạn khi tải trang.
2. Nếu chưa có file nào, game tự động vẽ hình Procedural Pixel Art, đảm bảo không bao giờ bị lỗi màn hình đen.
