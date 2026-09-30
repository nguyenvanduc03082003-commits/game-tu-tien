# Xác minh tải dự án lên GitHub cho Codex cloud

Ngày xác minh cuối: 2026-10-01 (Asia/Saigon).

## Đã hoàn tất

- Repository: https://github.com/nguyenvanduc03082003-commits/game-tu-tien, nhánh `main`, Public theo cấu hình người dùng đã tạo.
- Snapshot mã nguồn: `6cc08aa0096ed1ef63ea3e53fc75f4e5b2f32e85`, gồm 1.021 file trước khi thêm báo cáo này.
- SHA cây file: `1f6a057358cc75cde9ef03101077f6baa7b79d73`, khớp chính xác với snapshot local `81c86542e323bb38d1f0cd371005c083c4cc4b33`.
- Đã tải mã nguồn, tests, scripts, docs, cấu hình, lockfile, tài nguyên public và thư mục ảnh; font NotoSans gốc cũng đã xác minh SHA.
- Đã liên kết remote `origin` và upstream `origin/main`. Giữ lịch sử Git local cũ bằng merge với lịch sử GitHub; không force push hoặc reset lịch sử.
- Thêm `AGENTS.md`, hướng dẫn `docs/CODEX_CLOUD_SETUP.md` và setup script `scripts/setup-codex-cloud.sh`.

## Kiểm tra bản snapshot GitHub riêng biệt

Xuất archive từ `origin/main` vào thư mục tạm, dùng dependency local qua junction `node_modules`. Đây là kiểm tra Windows độc lập với các sửa đổi đang diễn ra trong workspace; chưa chứng minh môi trường Linux/cloud.

- `npm run build`: PASS, 169 modules; có cảnh báo bundle JavaScript lớn hơn 500 kB.
- `npm run assets:check`: PASS, 0 bộ nhân vật và 3 bộ trang phục.
- `npm test`: FAIL tại `tests/profession-regression.ts:208`, test `morning shift survives normal goal reevaluation but emergency combat interrupts`: thực tế `LABOUR_WORK`, kỳ vọng `COMBAT_DEFENSE`. Runner dừng tại test này, không kết luận toàn bộ suite đã được kiểm tra.
- `bash -n scripts/setup-codex-cloud.sh`: PASS với Git Bash local.
- Chưa kiểm tra gameplay trên trình duyệt hoặc Linux/cloud.

## Còn cần thao tác tài khoản

Trang ChatGPT/Codex cloud đang chờ người dùng nhập mã xác thực hai lớp. Chưa tạo môi trường cloud, chưa chạy task cloud và chưa xác minh dependency cài bằng `npm ci` trên cloud.

Sau khi đăng nhập, chọn repository này trong môi trường Codex cloud và dùng setup script:

```sh
bash scripts/setup-codex-cloud.sh
```

Sau đó chạy `npm run build`, `npm run assets:check`, `npm test` trong môi trường cloud. Có thể chạy preview bằng `npm run dev -- --host 0.0.0.0` tại cổng 3000 nếu giao diện cloud hỗ trợ preview.

## Các thay đổi đang tiếp diễn

Trong quá trình tải lên, workspace vẫn có chỉnh sửa mới từ công việc khác. Snapshot trên GitHub bao gồm bản ban đầu và đợt đồng bộ bổ sung 22 file. Các sửa đổi sau mốc snapshot vẫn được giữ nguyên local; chúng chưa thuộc bản đã xác minh này. Không tự sửa lỗi gameplay trong tác vụ chuyển repository.
