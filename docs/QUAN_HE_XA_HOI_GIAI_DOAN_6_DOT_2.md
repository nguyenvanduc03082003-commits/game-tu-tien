# Quan hệ xã hội — Giai đoạn 6, đợt 2

Ngày 01-10-2026. Trạng thái: **đã triển khai tối ưu đường hội thoại cộng đồng; chưa nghiệm thu parity và hiệu năng bằng mô phỏng**.

## Thay đổi

- Tạo `src/modules/social/CommunityConversationService.ts` và thay vòng gọi mọi cặp tại `src/modules/factions/FactionSystem.ts`.
- Dựng spatial grid riêng từ vị trí hữu hạn hiện tại của các thành viên trong cụm. Grid này bao gồm người trong nhà; không phụ thuộc grid Engine vốn loại InsideBuildingComponent và có thể được dựng trước bước di chuyển AI.
- Query bán kính từ SOCIAL_CONFIG.conversation.maxDistance (hiện 55), chỉ lấy thành viên đứng sau trong thứ tự cụm; sắp theo index để giữ thứ tự i/j cũ cho các cặp gần.
- Loại cặp còn communication cooldown trước gọi service hội thoại.
- Set cặp chuẩn hóa theo ID dùng chung trong một lần quét lập thôn, tránh gọi lại cặp gần từ cụm chồng lấn. Set được tạo mới mỗi lượt, không save và không chặn casual/cultivation.
- Commit vẫn qua performConversation, kiểm tra lại participant/vị trí/HP/nguy hiểm/context/điểm/cooldown. Bộ lọc không thưởng điểm hoặc ghi ký ức.

Điều kiện lập thôn, bán kính cụm 180, kiểm tra quan hệ, bầu trưởng thôn và giao nhiệm vụ giữ nguyên. Không đổi tín nhiệm, hảo cảm hay ngân sách số cuộc gặp hợp lệ.

## Metric

| Counter | Ý nghĩa |
|---|---|
| input_pairs | Tổng số cặp đầu vào qua các cụm; có thể trùng |
| excluded_non_near_pairs | Số lượt cặp không được grid chọn, gồm xa hoặc thiếu vị trí hữu hạn; không gọi tất cả là out_of_range |
| unique_near_pairs | Cặp gần duy nhất được xét trong lượt quét |
| duplicate_near_pairs | Lượt cặp gần trùng từ cụm khác |
| filtered_cooldown | Cặp gần duy nhất còn cooldown |
| changed_position | Cặp được chọn nhưng vị trí lúc xét không còn phù hợp |
| commit_calls | Số lời gọi performConversation cuối |

Không đếm cặp xa duy nhất toàn lượt, vì làm vậy cần tái liệt kê cặp xa O(N²). excluded_non_near_pairs là số lượt xuất hiện qua cụm. Với cụm có N người, input_pairs vẫn N(N−1)/2 nhưng được tính số học; chỉ những cặp grid chọn mới được duyệt. Cụm dày vẫn có thể có O(N²) cặp gần; không tuyên bố đã loại mọi chi phí bậc hai.

## Kiểm tra và giới hạn

- `npm.cmd run build`: đạt, 170 module; còn cảnh báo chunk lớn.
- `git -c core.safecrlf=false diff --check`: đạt.
- Chưa thêm/chạy test, baseline trước/sau hay browser trong lượt này. Chưa có số liệu chứng minh mức giảm 90% lời gọi xa hoặc tốc độ tick.
- Đối chứng G6 đợt 1 chưa chạy. Không gọi gate parity của kế hoạch là đã đạt chỉ từ build.
- Quy tắc cặp đã xét chỉ được thử một lần mỗi lượt là hành vi chủ đích. Nếu callback đồng bộ khác làm một cặp từng bị từ chối thành hợp lệ ngay trong cùng lượt, hệ thống chờ lượt sau thay vì thử lại từ cụm khác. Cần case hồi quy cho tương tác này khi nghiệm thu.
- Grid riêng là snapshot khi bắt đầu xử lý cụm. Service cuối kiểm tra lại cặp được chọn; một người bị di chuyển bởi callback đồng bộ vào phạm vi sau khi grid dựng có thể được xét ở cụm/lượt sau. Gameplay thông thường không có bước update AI chen giữa vòng đồng bộ này, nhưng parity vẫn cần kiểm chứng.
- Snapshot chỉ lấy vị trí hữu hạn. Dữ liệu NaN bị loại sớm, thay vì đi vào service rồi rejected. Không thay đổi world hoặc chữa dữ liệu hỏng trong bộ lọc.

## Việc tiếp theo

Trước chốt tối ưu: kiểm tra 55/55,001, cooldown 399/400 tick, cụm chồng lấn, thứ tự ID khác thứ tự cụm, người trong nhà và callback làm thay đổi vị trí/trạng thái; đối chiếu completed/delta/bond/faction cùng seed. Phần tín nhiệm của đợt 3 vẫn chưa triển khai.
