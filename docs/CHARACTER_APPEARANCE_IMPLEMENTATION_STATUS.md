# Kết quả triển khai ngoại hình — 24/09/2026

## Đã tích hợp

- Quét thư mục bằng Vite middleware lúc mở trang; manifest tĩnh phát sinh khi build; lệnh kiểm tra riêng.
- Ngoại hình có ID cố định, chủng tộc, loài, bodyProfile, trọng số; thiếu ảnh dùng dự phòng.
- Mọi archetype thả tuổi 15–30, không cấp trang bị/công cụ/pháp bảo/đan dược. Đặc tính đặc biệt của archetype vẫn được giữ.
- Renderer thân/đồ thường/giáp tách lớp, ba giai đoạn tuổi, bốn hướng, pose chung. Ban giáp kiểm tra ảnh tương thích; tháo giáp trong tab Trang Bị.
- Trưởng thành ở 15; thức tỉnh linh căn tuổi 12 không còn xóa trạng thái trẻ em. Già ở 90% thọ nguyên; tăng thọ nguyên có thể trở về hình trưởng thành.
- API sinh trẻ tuổi 0 giữ đúng loài, chọn mẫu mới và quan hệ gia đình hai chiều.
- Sinh tự nhiên: cặp khác giới trưởng thành từ 18, cùng chủng tộc/loài, đủ máu/độ no, không chiến đấu; người/ma cần đạo lữ hai chiều, thú cần ở gần; loại cha mẹ–con và anh chị em chung cha/mẹ. Cooldown 360 giây mô phỏng, kiểm tra mỗi 5 giây, xác suất 4%, tối đa 2 ca/lần và 1.000 sinh linh có dữ liệu gia đình đang sống.
- Người giám hộ có thể chia thức ăn cho trẻ gần đó; trẻ có mục tiêu tìm về người giám hộ. Cơ chế chăm sóc vẫn đơn giản, chưa có thai kỳ hay hệ thống nuôi trẻ đầy đủ.
- Save 1.1.0 lưu ngoại hình, gia đình, cooldown và danh sách con. Save cũ được gán một lần; không xóa trang bị cũ; missing ID vẫn được giữ.

## Kiểm chứng

- 9 ca AI cũ và 7 ca ngoại hình/vòng đời/save đều đạt; kiểm tra catalog ở thư mục tạm cũng đạt.
- Browser Edge headless: game tải thành công, vẽ 24 trường hợp (3 tuổi × 4 hướng × 2 trang phục), không lỗi JavaScript. Ảnh chụp đã được kiểm tra trực quan tại `docs/appearance-preview.png`.
- TypeScript strict + Vite production build.

## Giới hạn và phần mở rộng

- Người dùng chưa cung cấp mỹ thuật chính thức. Bộ mẫu hình khối nằm riêng trong examples để kiểm tra; không trộn vào quần thể mặc định.
- Atlas mới hiện chỉ hỗ trợ idle/walk bốn hướng. Hành động còn lại dùng pose dự phòng chung, xác chết dùng hình nằm ngang; chưa có clip riêng cho mỗi động tác.
- Hỗ trợ trang phục toàn thân ở ô bodyArmor, chưa thêm ô mũ hoặc atlas vũ khí/công cụ. Hình vũ khí đơn giản hiện hữu vẫn được sử dụng.
- Ảnh gộp thân và áo không thể tự bóc tách, phải chuẩn bị lớp body/casual đúng hướng dẫn.
- Tải danh mục/ảnh tại khởi động với tối đa 8 lượt tải đồng thời; dùng chung cache theo URL. Kho ảnh rất lớn sẽ tăng thời gian mở game và bộ nhớ, cần tải lười khi quy mô mỹ thuật tăng.
- Cân bằng sinh sản và nhịp ngày đêm cần theo dõi khi chơi lâu. Không coi các kiểm thử cục bộ là bằng chứng đạt 60 FPS ở 1.000 cư dân.

Hướng dẫn cho người thêm ảnh: `public/assets/sprites/characters/README.md`.

## Đo chi phí các hệ thống mới

Benchmark Node, 120 nhịp mỗi quy mô; gồm LifeStageSystem, AnimationSystem, ReproductionSystem và tính danh sách lớp ảnh. Không gồm vẽ canvas hoặc toàn bộ AI/game:

| Cư dân | Trung bình mỗi nhịp | P95 |
|---|---:|---:|
| 100 | 0,090 ms | 0,251 ms |
| 500 | 0,270 ms | 0,399 ms |
| 1.000 | 0,484 ms | 0,635 ms |

Kết quả phụ thuộc máy và kịch bản, không phải số FPS của game. Script tái hiện: `tests/appearance-benchmark.ts` (bundle bằng esbuild rồi chạy Node).
