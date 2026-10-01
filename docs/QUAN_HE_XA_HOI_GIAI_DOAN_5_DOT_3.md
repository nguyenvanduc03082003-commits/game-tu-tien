# Quan hệ xã hội — Giai đoạn 5, đợt 3

Cập nhật: 01-10-2026. Trạng thái: đã triển khai mã nguồn trong phạm vi dưới đây.

## Mục tiêu và thay đổi

- CombatIntent schema 1 lưu source autonomous/self_defense/social_assistance/god_decree, enemyId và startedAtDay; trợ chiến thêm allyId và bondEpisodeId nếu có.
- Mỗi phép gán target trực tiếp xóa metadata cũ; setCombatIntent ghi mục tiêu và nguồn đồng bộ. Gán null xóa cả nguồn.
- Chuyển các writer mục tiêu chiến đấu của AI, chiến đấu, động vật và ngoại giao sang API chung.
- Save lưu target và intent, validate trước hydrate, kiểm tra kiểu/ID/ngày/source/đối ứng target và cấu trúc episode; hydrate sao chép metadata.
- Save cũ thiếu trường nhận null, không tự bịa nguồn. Tính hợp lệ runtime của đối tượng do các hệ chiến đấu xử lý; validator không bảo đảm entity đích còn sống.
- Chưa chạy save/load roundtrip hoặc kiểm thử save lỗi.

## Bản đồ tệp

CombatComponents.ts; CombatIntentService.ts; SaveManager.ts; Engine.ts; các writer mục tiêu. Các tên ngắn trong bảng thuộc src/modules tương ứng hoặc src/ui.

## Bằng chứng và giới hạn

- Build tổng hợp cuối giai đoạn: npm run build (TypeScript + Vite); kết quả cuối ghi ở báo cáo tổng kết.
- Rà soát trực tiếp các writer/reader, validator, reset và nhánh hủy kế hoạch.
- Không thêm/chạy test tự động, không browser smoke test, không chạy mô phỏng thu baseline trong đợt này. Build không chứng minh hành vi runtime hay save roundtrip đúng.

## Việc cần nghiệm thu tiếp

Quan sát thực tế ở tốc độ 1x/nhanh/tạm dừng, mục tiêu chết/mất/mất quan hệ, tự vệ sau sát thương, bản lưu cũ/mới và giao diện chi tiết. Chỉ quyết định cân bằng sau khi có số liệu.
