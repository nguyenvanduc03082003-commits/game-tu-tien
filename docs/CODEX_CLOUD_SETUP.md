# Chuẩn bị dự án cho Codex cloud

Ngày kiểm tra: 2026-09-30 (Asia/Saigon).

## Trạng thái

Đã tải snapshot đầy đủ lên nhánh `main` của GitHub: commit `3aa54d0cf88c7642a6f517d9eb00e3efd943fb6e`, gồm 1.015 file. SHA cây file `c74159e2da132830fb90e62146cefd8fa02c684e` khớp chính xác với snapshot local `b3369897e5455b74c3f0a7505551b740ae22e5bb`, xác minh cả tên file và nội dung mã nguồn/tài nguyên. Các thay đổi workspace phát sinh sau snapshot được đồng bộ ở commit tiếp theo.

Chưa tạo môi trường Codex cloud và chưa xác minh chạy trên Linux/cloud. Trang ChatGPT đang chờ người dùng hoàn tất xác thực hai lớp. Git CLI local chưa đăng nhập; lần tải lên này dùng connector GitHub. Remote `origin` đã trỏ đến repository đích.

Repository đích đã được người dùng tạo: https://github.com/nguyenvanduc03082003-commits/game-tu-tien. Đã xác minh quyền push/admin qua connector GitHub. Repository đang Public theo cấu hình người dùng đã tạo. Bản mã nguồn tải lên là snapshot của workspace hiện tại, gồm các thay đổi chưa commit từ trước.

## Nội dung cần đưa lên GitHub

Toàn bộ mã nguồn và thay đổi hiện tại trong `src`, `tests`, `scripts`, `docs`, `public`, `examples`, thư mục `ảnh`, cùng cấu hình gốc, `AGENTS.md`, `package.json` và `package-lock.json`.

`node_modules`, `dist`, file log và `.env` được loại theo `.gitignore`; cloud khôi phục dependency từ lockfile và tạo lại bản build. Save trong trình duyệt không nằm trong Git repository.

## Thiết lập môi trường

1. Repository đã được người dùng tạo và mã nguồn đã tải lên nhánh `main`.
2. Đăng nhập ChatGPT và hoàn tất xác thực hai lớp trên trang Codex cloud.
3. Trong Codex cloud chọn repository này. Nếu repository chưa xuất hiện, kiểm tra quyền truy cập GitHub của kết nối Codex.
4. Cấu hình setup script chạy từ gốc repository:

```sh
bash scripts/setup-codex-cloud.sh
```

5. Khi môi trường sẵn sàng, chạy:

```sh
npm run build
npm run assets:check
npm test
```

Chạy game trong môi trường có preview trình duyệt bằng:

```sh
npm run dev -- --host 0.0.0.0
```

Vite dùng cổng 3000 theo `vite.config.ts`. Dự án hiện không cần API key để build hoặc chạy game. Môi trường setup cần tải dependency từ npm registry. Khả năng truy cập preview phụ thuộc giao diện cloud được sử dụng.

Tài liệu OpenAI tham chiếu: https://learn.chatgpt.com/docs/environments/cloud-environment

## Kết quả local trước khi tải lên

- `npm run build`: PASS. Vite cảnh báo bundle JavaScript lớn hơn 500 kB.
- `npm run assets:check`: PASS, 0 bộ nhân vật và 3 bộ trang phục.
- `git -c core.safecrlf=false diff --check`: PASS trước khi thêm tài liệu này.
- `npm test`: FAIL trong `tests/profession-regression.ts`, test `morning shift survives normal goal reevaluation but emergency combat interrupts`; tại dòng 208, kết quả `LABOUR_WORK`, kỳ vọng `COMBAT_DEFENSE`. Runner dừng tại lỗi này, các nhóm sau chưa được xác minh trong lần chạy này.
- Chưa thực hiện kiểm tra gameplay trên trình duyệt hoặc Linux/cloud.

Các kết quả build/test ở trên áp dụng cho snapshot đầu. Các thay đổi xã hội phát sinh trong lúc tải lên cần được kiểm tra tiếp trên cloud. Kiểm tra diff sau khi stage cả tài liệu phát hiện khoảng trắng cuối dòng trong hai báo cáo Markdown sẵn có; không sửa nội dung báo cáo trong tác vụ tải repository.

Không tự sửa gameplay chỉ để chuyển repository. Giao lỗi regression thành task riêng nếu người dùng yêu cầu.
