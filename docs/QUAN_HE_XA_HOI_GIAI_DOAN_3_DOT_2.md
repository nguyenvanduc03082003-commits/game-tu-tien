# Quan hệ xã hội — Giai đoạn 3, đợt 2

Ngày: 30-09-2026. Trạng thái: đã triển khai mã; chưa kiểm thử tự động hoặc gameplay.

## 1. Kết quả

- `SocialDeathService.ts` điều phối kết thúc ràng buộc và tang chế khi cư dân chết.
- Chụp danh sách người nhận trước khi kết thúc ràng buộc. Người nhận phải còn sống, HP > 0 và có component xã hội.
- Người thân trực hệ xác định từ FamilyComponent hai phía; đạo lữ/phụ mẫu/hài nhi chưa kết thúc thuộc nhóm close_kin. Kết nghĩa/sư đồ chưa kết thúc hoặc hảo cảm >= 60 thuộc nhóm friend nếu không thuộc close_kin.
- Quan hệ đã chia tay không được coi là đạo lữ hiện tại; nếu vẫn có hảo cảm >= 60 thì có thể nhận tang chế như bạn thân.
- Ký ức bereavement: importance 5, emotionalValence -80, có ID/tên người mất và ngày mô phỏng. Tạo MemoryComponent nếu người nhận chưa có.
- Tiếp tục phát sự kiện GrowthSystem hiện có, giữ eventId/familyKey/milestoneKey. Không trừ tâm cảnh trực tiếp thêm lần nữa; MemoryComponent cung cấp ký ức xã hội, áp lực tâm cảnh tiếp tục qua GrowthMind.

## 2. Kết thúc ràng buộc do chết

- Duyệt bản ghi của người mất và bản ghi của các nhân vật hướng tới người mất; không yêu cầu hai phía hoàn chỉnh cho đường xử lý tử vong.
- Đạo lữ, sư phụ, đệ tử, kết nghĩa, phụ mẫu, hài nhi chuyển thành ended với endReason death và endedAtDay từ clock world.
- Giữ tên, loại, điểm, ngày hình thành có sẵn; không thay nguyên nhân/ngày của ràng buộc đã kết thúc từ trước.
- Bản ghi cũ chưa có metadata được cấp mã bằng bộ đếm lưu trên component. Không tự tạo quan hệ đối ứng khi thiếu và không tự sửa mã không khớp.
- Không xóa parentIds; huyết thống vẫn là bằng chứng gia đình. Bản ghi kết thúc nằm trong relationships; bondHistory tiếp tục dùng khi bản ghi hiện tại được thay thế theo đợt 1.
- Không áp khóa chia tay cho tử vong; kiểm tra người sống và sức chứa hiện có tự loại người chết.

## 3. Chống phát lặp và save

- `CorpseComponent.socialDeathProcessed` là marker cho toàn bộ đợt chết, độc lập với danh sách tối đa 40 ký ức của người nhận.
- Marker được ghi trước các callback sự kiện để chặn gọi lồng nhau/phát lại trong luồng đồng bộ.
- SaveManager lưu và nạp marker; validator từ chối marker có kiểu khác boolean trước staging.
- Thi thể đã xử lý được bỏ qua; thi thể có marker false được xử lý khi quét, kể cả sau nạp.
- Save cũ có thi thể thiếu marker mặc định true vì đường cũ đã phát tang chế khi tạo thi thể. Không phát lại sự kiện/ký ức, cũng không tự gán lại ngày kết thúc cho thi thể cũ.
- Không hỗ trợ hồi sinh trong phạm vi này; ID thực thể người mất là khóa đợt tử vong. Khi thi thể được chôn hoặc xóa, đường tạo thi thể không còn thực thể đó để phát lại.

## 4. Tâm cảnh

`MentalStateSystem` chỉ nhận hỗ trợ từ đối tượng sống có xã hội; bỏ qua người HP <= 0, isDead, bị xóa hoặc bond ended. Các vai đặc biệt phải hợp lệ hai phía qua isActiveBondBetween. Giữ trọng số và trần hỗ trợ hiện có.

## 5. Tệp thay đổi

| Tệp | Công việc |
|---|---|
| src/modules/social/SocialDeathService.ts | Điều phối tử vong, kết thúc từng bản ghi, tang chế |
| src/modules/beings/CorpseAndGraveSystem.ts | Gọi điều phối cho thi thể mới/chưa xử lý; thay vòng phát tang chế cũ |
| src/modules/beings/DeathComponents.ts | Marker xử lý tử vong |
| src/modules/social/SocialComponents.ts | Loại ký ức và badge tang chế |
| src/modules/social/SocialSaveCodec.ts | Kiểm tra marker và chấp nhận loại ký ức mới |
| src/modules/save/SaveManager.ts | Lưu/nạp marker, mặc định save cũ |
| src/modules/talent/MentalStateSystem.ts | Lọc nguồn hỗ trợ tinh thần |

## 6. Phạm vi xác nhận

- Đọc nguồn các đường tạo thi thể, save staging, hỗ trợ tâm cảnh và pipeline GrowthEvents.
- Build production thành công; có cảnh báo chunk > 500 KB hiện hữu.
- Diff check các tệp nguồn đã sửa thành công.
- Không thêm/chạy test, chưa thao tác trình duyệt, chưa xác nhận save roundtrip hoặc tang chế trong một ván chơi.
- Marker xử lý theo luồng đồng bộ bình thường, không phải cơ chế transaction rollback khi callback bất ngờ ném lỗi.

## 7. Tiếp theo

Đợt 3: phản bội trực tiếp, xung đột kéo dài 30 ngày và cập nhật AI đọc trạng thái ràng buộc. Cứu mạng có bằng chứng thuộc đợt 4; giao diện lịch sử đầy đủ thuộc đợt 5.
