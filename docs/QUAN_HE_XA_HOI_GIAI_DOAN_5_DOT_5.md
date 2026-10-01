# Quan hệ xã hội — Giai đoạn 5, đợt 5

Cập nhật: 01-10-2026. Trạng thái: đã triển khai mã nguồn trong phạm vi dưới đây.

## Mục tiêu và thay đổi

- Chi tiết quan hệ hiển thị nguồn mục tiêu hiện tại, người được trợ chiến và đánh giá tiếp tục/dừng bằng evaluator chỉ đọc.
- Thêm mục công cụ phát triển trong tab quan hệ; người dùng chủ động bật thu số liệu toàn thế giới. Hiển thị tối đa 20 bộ đếm và 10 mẫu; trạng thái đóng không dựng bảng chi tiết.
- Inspector đọc snapshot tính cách bằng readResidentPreferences, không sinh component/RNG khi xem nhân vật thiếu dữ liệu.
- UI escape nội dung tên/lý do/mẫu. Theo dõi không tự bật khi mở Inspector.
- Hoàn thành báo cáo năm đợt và tổng kết; chưa kiểm tra giao diện bằng trình duyệt.

## Bản đồ tệp

SocialRelationshipInspector.ts; InspectorPanel.ts; docs/QUAN_HE_XA_HOI_GIAI_DOAN_5_*.md. Các tên ngắn trong bảng thuộc src/modules tương ứng hoặc src/ui.

## Bằng chứng và giới hạn

- Build tổng hợp cuối giai đoạn: npm run build (TypeScript + Vite); kết quả cuối ghi ở báo cáo tổng kết.
- Rà soát trực tiếp các writer/reader, validator, reset và nhánh hủy kế hoạch.
- Không thêm/chạy test tự động, không browser smoke test, không chạy mô phỏng thu baseline trong đợt này. Build không chứng minh hành vi runtime hay save roundtrip đúng.

## Việc cần nghiệm thu tiếp

Quan sát thực tế ở tốc độ 1x/nhanh/tạm dừng, mục tiêu chết/mất/mất quan hệ, tự vệ sau sát thương, bản lưu cũ/mới và giao diện chi tiết. Chỉ quyết định cân bằng sau khi có số liệu.
