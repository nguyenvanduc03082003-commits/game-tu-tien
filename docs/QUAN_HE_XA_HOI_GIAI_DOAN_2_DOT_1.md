# Quan hệ xã hội — Giai đoạn 2, đợt 1

Ngày thực hiện: 30-09-2026.

## Nhịp thời gian

Đã đọc TimeManager: 20 ticks/giây, 400 ticks/ngày, tương đương 20 giây/ngày ở tốc độ 1x. Kế hoạch giai đoạn 2 đã cập nhật: 30 ngày tương đương 600 giây ở 1x. Không chỉnh lại TimeManager vì mã nguồn đã có nhịp người dùng yêu cầu.

## Tệp và kết quả triển khai

| Tệp | Thay đổi |
|---|---|
| `src/config/social.config.ts` (mới) | Tập trung ngưỡng đạo lữ, sư đồ, kết nghĩa, nhãn thông thường, độ sâu huyết thống, xác suất và thời gian chờ theo ngày |
| `src/modules/social/RelationshipRules.ts` (mới) | Evaluator chỉ đọc; kiểm tra người sống, hai phía, huyết thống, độc quyền và sức chứa; trả reason/reasons |
| `src/modules/social/RelationshipService.ts` | Tất cả API tạo ràng buộc kiểm tra evaluator trước khi ghi; thêm formSwornBond |
| `src/modules/social/SocialComponents.ts` | Dùng ngưỡng nhãn từ cấu hình; bỏ friend tự chuyển thành sworn_brother |
| `src/modules/social/SocialInteractionSystem.ts` | Gặp gỡ dùng evaluator trước RNG đạo lữ/bái sư; loại người HP <= 0; xác suất lấy từ cấu hình |
| `docs/QUAN_HE_XA_HOI_GIAI_DOAN_2_KE_HOACH_CHI_TIET.md` | Cập nhật nhịp ngày mới |

## Điều kiện thực sự được áp dụng

### Đạo lữ

- Cả hai còn sống, có dữ liệu xã hội và tuổi >= 18.
- Cả hai hảo cảm >= 75, tin tưởng >= 60, interactionsCount >= 5.
- Không họ hàng gần; không có đạo lữ đang hoạt động khác.
- Ràng buộc đang hoạt động cần hai bản ghi tương ứng và hai người sống.
- Ràng buộc đạo lữ một chiều với một người khác đang sống, kể cả bản ghi chỉ nằm ở phía người kia, bị từ chối do xung đột. Không tự sửa.
- Bản ghi tới người đã chết/bị xóa vẫn được giữ nhưng không chặn độc quyền đang hoạt động.

### Sư đồ

- Thầy stageIndex >= 1, trò stageIndex = 0 lúc hình thành.
- Thầy hảo cảm >= 45, tin tưởng >= 50 với trò.
- Trò hảo cảm >= 30, tin tưởng >= 50, kính trọng >= 60 với thầy.
- Trò tối đa 1 sư phụ đang hoạt động; thầy tối đa 3 đồ đệ đang hoạt động.
- Không họ hàng gần; không ghi đè ràng buộc được bảo vệ.
- Ràng buộc một chiều liên quan tới độc quyền/sức chứa giữa người sống bị từ chối.
- Quan hệ có sẵn không bị xóa khi trò đột phá. Chỉ điểm tiếp tục dùng ràng buộc đối ứng hiện có.

### Kết nghĩa

- API formSwornBond: cả hai còn sống, hảo cảm >= 70, tin tưởng >= 60, interactionsCount >= 5, không họ hàng gần hoặc xung đột ràng buộc.
- Ghi sworn_brother và ngày hình thành ở cả hai phía; không cộng điểm, không tăng giả số lần giao lưu.
- Kết nghĩa một chiều của chính cặp bị từ chối; không tự sửa dữ liệu lịch sử.
- Bỏ tự chuyển friend -> sworn_brother. Tích hợp chọn kết nghĩa trong cuộc gặp sẽ thực hiện ở đợt 3; đợt này chỉ hoàn thành API và điều kiện.

### Huyết thống và tính thuần của evaluator

- Dùng parentIds tối đa 2 thế hệ, cộng bằng chứng kin_parent/kin_child của cả hai phía.
- Chặn cha mẹ/con, ông bà/cháu, anh chị em cùng cha/mẹ, anh chị em họ chung ông/bà.
- ID cha mẹ/ông bà đã mất vẫn có thể là bằng chứng chung nếu còn ghi trong parentIds; không cần tổ tiên còn sống.
- Nếu cần truy sâu qua nhân vật đã bị xóa và không còn FamilyComponent thì dừng truy vết. Có visited set chống vòng lặp.
- Evaluator không tạo quan hệ, tính cách, tiêu thụ RNG, thay điểm hay sửa thời gian. Số liệu NaN/Infinity không được coi là đạt ngưỡng.
- Trả lý do có tên ổn định để giao diện đợt 4 dùng lại. API ghi gọi evaluator lần nữa, không tin riêng điều kiện từ caller.

## Cách xử lý kết quả

- created: chỉ ghi sau khi tất cả điều kiện đạt.
- already_exists: cặp ràng buộc sống đối ứng đã tồn tại, không cộng thưởng lần nữa.
- rejected: trả reason và danh sách reasons nếu có; không thay đổi quan hệ/điểm/ký ức.
- Đạo lữ giữ xác suất 25%, bái sư 15%. Các điều kiện không đạt không tiêu thụ lần thử RNG tương ứng và vẫn xét các tương tác phía sau.
- Quan hệ cha mẹ/con dùng kiểm tra người sống và xác nhận parentIds như đường tạo trước đó; không áp điều kiện tuổi/hảo cảm của đạo lữ.

## Mức kiểm tra

- Build TypeScript/Vite thành công; còn cảnh báo bundle lớn hơn 500 kB.
- Diff check các tệp được sửa không báo lỗi khoảng trắng.
- Không thêm/chạy test tự động, chưa kiểm tra gameplay/save-load trên trình duyệt. Build xác nhận biên dịch, không xác nhận đầy đủ ma trận hành vi.

## Ranh giới đợt này

- Cooldown mới chỉ khai báo trong cấu hình, chưa áp dụng; triển khai và lưu/nạp ở đợt 2.
- Lựa chọn kết nghĩa, chống lặp combat và AI chọn đối tượng theo cooldown thuộc đợt 3.
- Inspector hiển thị điều kiện thuộc đợt 4.
- Không thay quy tắc sinh sản, tính cách/thiên phú ngẫu nhiên, không tự chuyển đổi quan hệ trong save cũ.
