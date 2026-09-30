# Thư Mục Sprite Động Vật (`public/assets/sprites/animals/`)

Thư mục này dành cho việc cung cấp hình ảnh (sprite) đồ họa cho các loài động vật trong thế giới.

Hệ thống đồ họa (`AnimalAssetManager` và `AnimalRenderer`) được thiết kế theo cơ chế **tùy chọn (optional)**:
- Không bắt buộc phải có đầy đủ ảnh cho tất cả các loài.
- Nếu không có ảnh, trò chơi tự động vẽ hình dáng hình học cơ bản trên Canvas theo `bodyShape`, `primaryColor` và `secondaryColor` của loài.
- Không gửi 120 yêu cầu mạng khi bắt đầu game; ảnh chỉ được nạp theo nhu cầu (on-demand) khi cá thể xuất hiện hoặc được chọn.

---

## 1. Quy ước cấu trúc thư mục

Mỗi loài sử dụng một thư mục con tương ứng với `spriteDirectory` trong cấu hình (mặc định là `assets/sprites/animals/<speciesId>/`):

```text
public/assets/sprites/animals/
├── README.md
├── water_buffalo/
│   ├── adult.png       # (Tùy chọn) Ảnh cá thể trưởng thành
│   ├── child.png       # (Tùy chọn) Ảnh con non
│   └── elder.png       # (Tùy chọn) Ảnh già lão
├── spotted_deer/
│   └── adult.png
└── ...
```

---

## 2. Quy tắc nạp ảnh và Fallback giai đoạn tuổi

1. **Ảnh trưởng thành (`adult.png`) là tùy chọn**:
   - Nếu có `adult.png`, cá thể trưởng thành (`adult`) sẽ hiển thị bằng ảnh này.
   - Nếu không có `adult.png`, cá thể hiển thị bằng hình vẽ hình học cơ bản trên Canvas.

2. **Cơ chế Fallback cho con non (`child`) và già lão (`elder`)**:
   - Khi vẽ cá thể `child`:
     - Thử tìm `child.png`. Nếu có, vẽ bằng `child.png`.
     - Nếu `child.png` không tồn tại, tự động chuyển sang dùng `adult.png` nhưng vẫn áp dụng hệ số thu nhỏ kích thước con non (`ANIMAL_CHILD_SCALE_FACTOR = 0.68`).
     - Nếu cả `child.png` và `adult.png` đều không có, chuyển sang vẽ hình học cơ bản của con non.
   - Khi vẽ cá thể `elder`:
     - Thử tìm `elder.png`. Nếu có, vẽ bằng `elder.png`.
     - Nếu thiếu `elder.png`, tự động dùng `adult.png`.
     - Nếu thiếu cả hai, chuyển sang vẽ hình học cơ bản.

3. **Chống lặp request 404**:
   - `AnimalAssetManager` ghi nhận trạng thái `pending`, `loaded` và `failed` theo từng URL.
   - Khi một tệp ảnh bị 404 (không tồn tại), hệ thống ghi nhận `failed` và không gửi lại request ở các khung hình tiếp theo trong suốt phiên chơi, đảm bảo hiệu năng 60 FPS mượt mà.

---

## 3. Quy cách tệp ảnh khuyến nghị

- **Định dạng**: PNG có nền trong suốt (`RGBA`).
- **Hướng nhìn mặc định**: Hướng mặt sang **bên phải** (`right`). Khi động vật di chuyển sang trái (`left`), renderer tự động lật ngang đối xứng.
- **Kích thước ảnh**: Tối ưu trong khoảng `24×24 px` đến `48×48 px` tùy theo cỡ cơ thể (`small`, `medium`, `large`, `huge`).
- **Tâm chân**: Căn chỉnh chân/thân ở vùng trung tâm bên dưới để bóng đổ tiếp xúc tự nhiên với mặt đất.
