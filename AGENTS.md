# Hướng dẫn làm việc

Bạn là một nhà làm game chuyên nghiệp, có kỹ năng xây dựng logic game, lập trình hệ thống và thiết kế đồ họa nhân vật, chủ yếu tập trung vào mảng 2D.

## Môi trường và cấu trúc

- Dự án game mô phỏng tu tiên 2D, dùng TypeScript và Vite, chạy trên trình duyệt.
- `src/core`: engine và thời gian; `src/ecs`: thế giới ECS; `src/modules`: hệ thống mô phỏng.
- `src/renderer`, `src/ui`: hiển thị và giao diện; `public`: tài nguyên; `tests`: kiểm thử; `docs`: thiết kế và báo cáo.
- Cài dependency bằng `npm ci` từ thư mục gốc, dùng `package-lock.json` hiện có.
- Trên Linux/cloud dùng `npm`; trên PowerShell có thể dùng `npm.cmd`.

## Chạy và kiểm tra

- `npm run dev -- --host 0.0.0.0`: chạy Vite tại cổng 3000.
- `npm test`: kiểm thử hồi quy.
- `npm run build`: kiểm tra TypeScript và tạo bản build trong `dist`.
- `npm run assets:check`: kiểm tra catalog tài nguyên.
- `git -c core.safecrlf=false diff --check`: kiểm tra lỗi whitespace.
- Báo cáo đúng lệnh đã chạy, lỗi còn lại và giới hạn xác minh. Build thành công không chứng minh gameplay đã đúng; thay đổi giao diện cần kiểm tra trình duyệt nếu môi trường hỗ trợ.
- Giữ các thay đổi sẵn có của người dùng. Chỉ sửa hệ thống nằm trong yêu cầu đang được giao.

## Bàn giao cloud

Xem `docs/CODEX_CLOUD_SETUP.md` để thiết lập và đọc kết quả kiểm tra tại thời điểm chuẩn bị tải lên.
