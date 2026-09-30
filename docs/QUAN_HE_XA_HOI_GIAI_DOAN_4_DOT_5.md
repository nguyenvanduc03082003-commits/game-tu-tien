# Quan hệ xã hội — Giai đoạn 4, đợt 5

Ngày: 30-09-2026. Trạng thái: hoàn thiện mã UI và báo cáo; chưa nghiệm thu runtime.

## 1. Giải thích giao tiếp

SocialRelationshipInspector đọc snapshot/evaluateConversation khi mở chi tiết. Hiển thị sociability, bận/rảnh theo dữ liệu, dự đoán outcome/delta từng phía hoặc lý do chưa thể trò chuyện. Ghi rõ context casual, chưa ghi điểm và phải kiểm tra lại lúc gặp; không dùng kết quả này để hứa community/cultivation có cùng phản ứng.

Giải thích giới hạn12 ứng viên/bán kính200, personality thiếu dùng trung tính50%. Không khởi tạo component hoặc thay tính cách khi xem. Trạng thái mở/scroll dùng cơ chế Inspector hiện có.

## 2. Trợ chiến hai hướng

Gọi evaluateSocialAssistance theo helper/ally đảo chiều, hiển thị tên người giúp/người nhận, target hiện tại nếu hợp lệ và các reason codes đã dịch. Bao gồm thiếu active bond, thiếu điểm/trust, tự bảo toàn, đang có mục tiêu, không có kẻ địch hợp lệ, ngoài phạm vi, xung đột ràng buộc.

Giải thích đây là điều kiện can thiệp hiện tại; đủ điều kiện không bảo đảm AI chọn, từ chối không kết thúc bond và trợ chiến không tự là cứu mạng. Không thêm nút ép trợ chiến hoặc side effect từ render.

## 3. Lời thoại/save/reset

Lời thoại context/outcome đã được gom trong SocialConversationService đợt2; đợt5 đối chiếu lại, không thêm producer trùng. Skipped không lời thoại/ký ức mới, trò chuyện thường không spam chronicle.

Decision/evaluation là transient, không thêm trường save hoặc static cache. Personality, memory và cooldown tiếp tục dùng SaveManager/codec hiện có. UI không dọn cooldown/evidence, không gọi performConversation hoặc residentPreferences tạo RNG. Đối chiếu nguồn save/reset không thay thế kiểm thử save roundtrip.

## 4. Tệp và xác nhận

| Tệp | Công việc |
|---|---|
| src/ui/SocialRelationshipInspector.ts | Giải thích giao tiếp/trợ chiến và dự đoán hai phía |
| docs/QUAN_HE_XA_HOI_GIAI_DOAN_4_TONG_KET.md | Tổng kết đủ5đợt, giới hạn, file map và kiểm chứng |

Build production sau sửa cuối thành công, diff check nguồn sửa thành công; cảnh báo chunk>500kB vẫn còn. Không thêm/chạy test, chưa browser UI/gameplay hoặc save roundtrip. Chưa xác nhận panel hẹp/refresh bằng quan sát trực tiếp.

## 5. Trạng thái cuối

Cả5đợt đã có mã/tài liệu. Cân bằng ngưỡng, hành vi runtime, save/reset và hiệu năng vẫn cần nghiệm thu theo ma trận kế hoạch khi có yêu cầu kiểm thử. Không coi build là hoàn tất nghiệm thu toàn hệ thống.
