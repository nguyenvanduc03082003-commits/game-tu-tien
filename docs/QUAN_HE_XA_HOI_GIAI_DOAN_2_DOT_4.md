# Quan hệ xã hội — Giai đoạn 2, đợt 4

Ngày thực hiện: 30-09-2026. Trạng thái: hoàn thành triển khai mã nguồn; chưa nghiệm thu đầy đủ bằng test/gameplay.

## Inspector: thông tin hai phía

- Mỗi thẻ quan hệ có mục mở rộng "Hai phía · điều kiện · thời gian chờ".
- Bảng so sánh hảo cảm, tín nhiệm, kính trọng, số lần tương tác ở hai hướng, có tên người đánh giá rõ ràng.
- Phía đối diện thiếu bản ghi hiển thị dấu — và giải thích, không tạo bản ghi trung tính trong UI.
- Ngày hình thành ràng buộc được hiển thị nếu có. Ký ức thêm ngày xảy ra.
- Điều kiện đạo lữ, kết nghĩa, sư đồ được đọc từ cùng evaluator gameplay; hiển thị cả hai vai trò nhận trò/bái sư.
- Có ba trạng thái: đã hình thành, đủ điều kiện để thử, chưa đạt kèm các lý do. Nếu điều kiện đạt nhưng bondAttempt còn hạn, hiển thị đủ điều kiện nhưng còn chờ.
- Ngưỡng giải thích lấy từ SOCIAL_CONFIG. Không hứa chắc hình thành khi đủ điểm: vẫn cần cuộc gặp và lần thử thành công.

## Thời gian chờ

- Hiển thị các khóa còn hiệu lực: giao tiếp, chữa thương, chỉ điểm, đề nghị ràng buộc, điểm bị đánh/chứng kiến và ký ức chiến đấu.
- Kênh cặp tự đọc owner ID nhỏ hơn; kênh có hướng hiển thị chiều của nhân vật đang xem tới đối tượng.
- Đơn vị ngày trong game, làm tròn lên tối đa hai chữ số thập phân để không hiển thị 0 ngày khi thực tế chưa hết khóa.
- Dùng nhịp cập nhật HUD hiện có (500 ms), không thêm timer/singleton cho mô phỏng.
- Giữ mục chi tiết đang mở và vị trí cuộn khi cập nhật. Chỉ tính evaluator đầy đủ cho mục mở rộng đang mở để giảm chi phí khi mạng lưới lớn.
- Pause không làm giảm thời gian mô phỏng; UI có chú thích này.

## Quan hệ hoạt động và lịch sử

- Ràng buộc sống đối ứng được gắn nhãn "Ràng buộc đang hoạt động"; dùng isActiveBondBetween chung với cách đếm sức chứa trong gameplay.
- Nhân vật đã chết/corpse/grave hiển thị "Quan hệ lịch sử · đã mất".
- Đối tượng đã bị xóa hiển thị "Quan hệ lịch sử · không còn trong thế giới".
- Bản ghi đặc biệt thiếu phía đối ứng hoặc người tham gia không khả dụng được giải thích; không tự sửa.
- Không có vị trí thì không dựng nút Xem. Có vị trí di tích thì cho xem di tích. Handler kiểm tra lại vị trí trước khi chuyển camera/Inspector để chịu việc đối tượng biến mất giữa hai lần cập nhật.

## Tính thuần của phần mới

- Renderer không gọi residentPreferences/factory, Math.random, adjustScores, startSocialCooldown hay prune.
- Chỉ đọc component, evaluator và cooldown rồi dựng HTML. Tên/mô tả/ngày ràng buộc được escape khi đưa vào HTML.
- Không thay quan hệ, điểm, count, ký ức, ledger hoặc tính cách khi mở mục điều kiện.
- Không thêm nút tạo ràng buộc thủ công; gameplay tiếp tục thực hiện theo cuộc gặp/API đã triển khai.
- Nhật ký/lời thoại thành công ở đợt 3 đã nằm sau created; đợt 4 không tạo nhật ký từ việc xem điều kiện.

## Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| src/ui/SocialRelationshipInspector.ts (mới) | Renderer chi tiết chỉ đọc, reason codes tiếng Việt, hai phía, cooldown và trạng thái lịch sử |
| src/ui/InspectorPanel.ts | Tích hợp thẻ chi tiết, ngày ký ức, giữ open/scroll, refresh và kiểm tra nút focus |
| src/ui/UIManager.ts | Gọi refreshRelations trong nhịp HUD 500 ms hiện có |
| src/modules/social/RelationshipRules.ts | Helper isActiveBondBetween; dùng chung khi đếm ràng buộc và hiển thị |
| docs/QUAN_HE_XA_HOI_GIAI_DOAN_2_KE_HOACH_CHI_TIET.md | Cập nhật trạng thái triển khai |
| docs/QUAN_HE_XA_HOI_GIAI_DOAN_2_TONG_KET.md | Tổng kết, bảng bằng chứng và giới hạn |

## Mức kiểm tra

- TypeScript/Vite build thành công; vẫn có cảnh báo bundle > 500 kB.
- Diff check tệp mã nguồn liên quan không phát hiện lỗi khoảng trắng.
- Đã đọc lại đường render và handler để kiểm tra side effect, điều kiện active/historical, lưu open/scroll và đối tượng không có vị trí.
- Chưa thêm/chạy bộ test tự động hoặc kiểm tra trình duyệt. Chưa chứng minh thực nghiệm hiển thị hẹp, mở/đóng details khi refresh, hiệu năng mạng lưới lớn hay tính bất biến qua nhiều lần render.
- Vì vậy hoàn thành triển khai đợt 4 không đồng nghĩa ma trận nghiệm thu trong kế hoạch đã đạt toàn bộ.
