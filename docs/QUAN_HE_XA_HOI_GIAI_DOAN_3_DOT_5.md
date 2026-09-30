# Quan hệ xã hội — Giai đoạn 3, đợt 5

Ngày: 30-09-2026. Trạng thái: triển khai mã và báo cáo; chưa nghiệm thu UI/gameplay trực tiếp.

## 1. Inspector vòng đời

Chi tiết mỗi quan hệ có ngày hình thành, ngày kết thúc và lý do qua đời/phản bội/xa cách. Ưu tiên formedAtDay; dữ liệu cũ specialBondDate được ghi rõ là ghi chép cũ, thiếu cả hai thì hiển thị chưa có ngày. Không tự tạo ngày khi xem.

Ràng buộc hoạt động có mốc mâu thuẫn của từng phía và số ngày còn lại tới 30 ngày; giải thích phải duy trì affinity <= -50 và trust <= 20, hồi phục qua ngưỡng sẽ tính lại từ đầu. Không tính mâu thuẫn cho snapshot lịch sử.

## 2. Lịch sử ràng buộc

Khối riêng trong tab Nhân duyên hiển thị bondHistory tối đa 20 mục, tên/vai trò, ngày hình thành/kết thúc, lý do và điểm khi lưu. Sắp mới nhất trước trên mảng sao chép; không thay thứ tự dữ liệu gameplay.

Giải thích rõ: ràng buộc vừa kết thúc ở mạng lưới hiện tại; các lần trước chuyển vào lịch sử khi hình thành lại. Lịch sử luôn hiển thị đã kết thúc dù cặp hiện đang có ràng buộc mới. Không đặt nút focus cho snapshot. Tên/ngày/nội dung được escape khi dựng HTML, văn bản dài cho phép xuống dòng.

Dùng cùng khóa data-social-details và cơ chế refresh hiện có để giữ mở/đóng và cuộn. Nội dung lịch sử được tải khi mở; renderer chỉ đọc, không tạo component, gọi RNG, sửa điểm hoặc dọn evidence/cooldown.

## 3. Giải thích cứu mạng và sự kiện

Chi tiết giải thích HP <= 35%, bằng chứng đe dọa, người giúp hạ địch trong phạm vi 180 và không còn mối đe dọa khác được biết. Chữa thương/tặng đan không tự tính cứu mạng. Hiển thị cooldown theo tên người nhận/người giúp ở cả hai hướng; không có cooldown không đồng nghĩa có tình huống cứu mạng hợp lệ.

Sau claim thành công, RescueEvidenceService phát một chronicle entry và lời cảm ơn của người được cứu. claimed và cooldown được chốt trước phát sự kiện; các nhánh rejected hoặc claim lại không phát nhật ký/lời thoại.

## 4. Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| src/ui/SocialRelationshipInspector.ts | Renderer vòng đời/lịch sử, mâu thuẫn và giải thích cứu mạng hai hướng |
| src/ui/InspectorPanel.ts | Nối khối lịch sử vào tab Nhân duyên |
| src/modules/social/RescueEvidenceService.ts | Nhật ký và lời cảm ơn khi cứu mạng thành công |
| docs/QUAN_HE_XA_HOI_GIAI_DOAN_3_TONG_KET.md | Báo cáo toàn diện cập nhật đủ 5 đợt, giới hạn và kiểm chứng |

## 5. Xác nhận và giới hạn

Build đầu báo TS2345 vì renderer lịch sử chưa chấp nhận component undefined; đã sửa kiểu tham số và build lại thành công sau sửa cuối. Diff check các tệp nguồn được sửa thành công. Cảnh báo chunk lớn hơn 500 kB vẫn còn.

Không thêm/chạy test; chưa mở trình duyệt kiểm tra UI, chưa chơi tình huống thật hoặc thử save roundtrip. Các đánh giá về giữ cuộn, hiển thị hẹp và chống lặp dựa vào đọc luồng mã, chưa phải bằng chứng quan sát runtime.

Ngưỡng điểm/trust bổ sung độc lập cho AI trợ chiến chưa được thiết kế; hiện dùng ràng buộc active đối ứng. Bằng chứng cứu mạng vẫn xét thận trọng trong hạn 1 ngày với kẻ vừa gây sát thương. Không mở rộng hồi sinh, gia phả nhiều thế hệ, nhiều ràng buộc đồng thời hoặc cứu khỏi thiên tai.

## 6. Trạng thái cuối giai đoạn

Đã triển khai mã của cả 5 đợt và cập nhật báo cáo toàn diện. Phần nghiệm thu runtime theo ma trận kế hoạch chưa thực hiện; không coi build thành công là nghiệm thu gameplay/UI/save.
