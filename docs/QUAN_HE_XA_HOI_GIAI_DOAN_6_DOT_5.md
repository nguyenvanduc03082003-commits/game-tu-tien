# Quan hệ xã hội — Giai đoạn 6, đợt 5

Ngày: 01-10-2026. Trạng thái: **đã triển khai UI và kiểm tra một phiên browser; nghiệm thu các nhánh progress/chiến đấu hiếm còn thiếu**.

## 1. Giao diện tiến độ tín nhiệm

`src/ui/SocialRelationshipInspector.ts` bổ sung phần “Quen nhau qua những cuộc gặp” trong chi tiết quan hệ:

- Hai chiều đánh giá riêng, tên được escape như các phần khác.
- Hiển thị count/3, số cuộc gặp còn thiếu, mức thưởng tối đa +1, ngày đủ điều kiện gần nhất và thời gian còn lại trước hết hiệu lực.
- Giải thích chưa đủ hảo cảm hai phía, không có bản ghi đối ứng, người đã mất/thiếu dữ liệu, tiến độ đã hết hạn và trust đã từ 60.
- Không suy trust >=60 là do familiarity: nguồn khác cũng có thể đã tạo điểm đó.
- Giải thích warm/awkward xóa progress phía tương ứng, chỉ tính completed, không hứa tự hình thành bond.
- Dự đoán cuộc gặp đủ điều kiện dùng evaluator familiarity thuần và cộng delta bổ sung vào trust dự kiến. Preview không ghi điểm/progress hoặc tiêu RNG.
- Đọc count hiệu lực qua readSocialFamiliarity; không dọn state trong lúc mở/refresh UI. UI chỉ tính/escape HTML, không tạo component/tính cách mới.

Không thêm nút tăng điểm hay sửa tiến độ cho người chơi. Cấu hình ba cuộc gặp vẫn là giá trị thử chưa chốt cân bằng.

## 2. Debug theo dõi

Bổ sung nhóm dễ đọc trong phần công cụ phát triển có sẵn:

1. Cuộc gặp: gọi/hoàn tất/bỏ qua.
2. Cộng đồng: đầu vào lượt cặp, không gần/thiếu vị trí, trùng, cooldown và commit calls.
3. Kế hoạch nghỉ/giao lưu: bắt đầu/hoàn tất/thất bại/bị thay.
4. Số lần thưởng familiarity theo từng phía.

Raw counters và 10 mẫu gần nhất tiếp tục hiện ở phần debug; mẫu plan có revision. Phần thường không hiện raw key. Cảnh báo rõ plan completed chưa là conversation completed, cặp đầu vào có thể lặp, counter có thể thiếu khi hết key budget, sample không là toàn bộ lịch sử. Mặc định tắt và reset sau load giữ nguyên.

## 3. Phiên trình duyệt đã thực hiện

Thế giới thử “Nghiệm thu G6 đợt 5”, seed 10605, Đồng Bằng Trung Thổ, map150; rải bằng các nút nhân tộc/yêu tộc/ma tộc, dùng x10. Đây là thao tác thử, không suy mỗi click luôn tạo đúng10 hoặc kiểm chứng phân bố ngẫu nhiên của mọi đặc điểm.

- Mở nhân vật ma tộc Huyết Sát #234, xem chỉ số/traits và quan hệ với Ma Lệ #819. Hai phía có hảo cảm1/trust50/lần gặp1; UI giải thích đúng cần hảo cảm cả hai từ10.
- Quan sát hướng ngoại hiển thị hai phía khác nhau (65,11% và27,98%); không dùng hai mẫu để kết luận chất lượng phân bố RNG.
- Quan hệ với đối tượng đã mất hiện trạng thái lịch sử; người đang sống có focus riêng. Không coi việc thấy death/history là đã xác nhận tang ký hoặc rescue.
- Xem bố cục Inspector hẹp thực tế, cuộn đến phần familiarity và lưu ảnh. Các dòng giải thích xuống hàng, nằm trong vùng cuộn.
- Mở debug lúc mặc định tắt: số liệu0; sau bật có thể chạy thu một cửa sổ runtime.
- Vite reload sau chỉnh câu hiển thị cuối; dùng CHƠI TIẾP tải autosave thử. Thế giới/nhân vật và quan hệ đã nạp lại, telemetry trở về tắt/rỗng; giữ TXT chứng cứ.
- Dân số sống thay đổi trong thời gian mô phỏng. Metadata “40 cư dân” của menu bản lưu không được dùng làm số người còn sống; không kết luận load mất người từ so sánh hai bộ đếm khác nghĩa.

### Chứng cứ

- `docs/so_lieu/G6_DOT5_MA_TOC_UI.txt`: chi tiết quan hệ lúc xem.
- `docs/so_lieu/G6_DOT5_QUAN_HE.png`: ảnh phần giải thích familiarity.
- `docs/so_lieu/G6_DOT5_LOAD_RESET.txt`: bảng sau load, tắt/rỗng.
- `docs/so_lieu/G6_DOT5_DEBUG.txt` và `G6_DOT5_DEBUG.png`: cửa sổ thu số liệu cuối.

Cửa sổ cuối ghi 5 lời gọi hội thoại:2 completed neutral,3 skipped unsafe;0 lượt thưởng familiarity và0 lifecycle plan trong cửa sổ. Đây là số liệu toàn world từ lúc bật, không phải riêng người đang xem và không phải lịch sử cả thế giới. Các nhóm0 không chứng minh nhánh đó đã được thực thi đúng. Đọc tối đa10 console error gần nhất trả danh sách rỗng tại lần kiểm tra cuối.

## 4. Kiểm tra và giới hạn

- `npm.cmd run build` cuối đạt,172module; cảnh báo chunk lớn còn.
- `git -c core.safecrlf=false diff --check` đạt.
- Browser smoke có chứng cứ UI và load/reset, không thay cho hồi quy readonly/RNG hoặc roundtrip tiến độ count2.
- Chưa quan sát/dựng trên UI các nhánh count1/2/đủ3, progress hết10ngày, cap60 và phần thưởng dự kiến. Không gọi các nhánh đó đã nghiệm thu từ ảnh hảo cảm1.
- Chưa kiểm tra trực quan đầy đủ trợ chiến, cứu viện, projectile bị né và tang ký. Các điều kiện dựng nhánh có bond/evidence phù hợp chưa có trong phiên ngắn; giữ case cần thực hiện ở đợt nghiệm thu.
- Chưa có bảng kiểm từng chủng tộc/traits trước-sau load hoặc baseline nhiều seed. Rải ba nút và xem ma tộc chỉ là smoke flow, không nghiệm thu toàn bộ spawn/randomness.
- Chưa thêm/chạy suite hồi quy hoặc baseline G6 trong lượt này. Các gate parity/cân bằng của đợt1–4 vẫn còn thiếu.

## 5. Bàn giao

Phần giao diện đã triển khai. Đợt6 cần hồi quy readonly và đầy đủ progress/save, kiểm tra runtime từng nhánh hiếm, mô phỏng đối chứng và chốt cân bằng từ dữ liệu. Không đánh dấu cả giai đoạn đã nghiệm thu chỉ từ build và phiên UI này.
