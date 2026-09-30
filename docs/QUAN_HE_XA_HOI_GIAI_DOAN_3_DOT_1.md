# Quan hệ xã hội — Giai đoạn 3, đợt 1

Ngày thực hiện: 30-09-2026. Đã triển khai nền tảng lifecycle; chưa bật tự động kết thúc/tang chế/cứu mạng.

## 1. Dữ liệu mới

- RelationshipRecord có bond tùy chọn: schemaVersion 1, episodeId, status active/ended, formedAtDay, endedAtDay, endReason và conflictSinceDay.
- Lý do hỗ trợ trong schema: death, betrayal, estrangement. Death hook sẽ nối ở đợt 2; conflictSinceDay mới là dữ liệu cho đợt 3.
- SocialRelationshipComponent có bondHistory tối đa 20 bản ghi và bondEpisodeCounter.
- Episode ID dùng cặp ID chuẩn hóa và counter: bond:minId:maxId:counter. Hai phía nhận cùng ID; counter được lưu, không dùng giờ máy tính hoặc RNG.
- Quan hệ mới được gắn active và ngày hình thành liên tục từ clock world.
- Khi tạo lại cặp có bản ghi ended, lưu snapshot cũ vào history rồi thay metadata mới. Không archive lặp cùng episode; giữ 20 mục mới nhất.
- Sao chép sâu metadata khi dựng component, lưu history và xuất save để snapshot không bị sửa theo gameplay.

## 2. API kết thúc

Thêm endCompanionBond, endMentorship(master, disciple), endSwornBond. Lý do mặc định estrangement, có thể truyền betrayal. Không có API chấm dứt huyết thống.

- Kiểm tra self, dữ liệu hai phía, loại đối ứng, người sống, trạng thái active và episode trước ghi.
- Ghi endedAtDay/endReason cùng thời điểm ở hai phía; giữ nhãn, điểm, tên và ngày hình thành.
- Cặp legacy sống đối ứng thiếu metadata được cấp episode khi kết thúc; formedAtDay giữ thiếu thay vì bịa ngày.
- Gọi lại cặp đã ended cùng episode trả already_ended, không thay ngày, tăng count, tạo history mới hoặc đặt lại cooldown.
- Bản ghi không đúng loại, một chiều, khác episode hoặc chỉ một phía ended bị từ chối, không tự sửa.
- Sau kết thúc giữ thời gian chờ đề nghị ít nhất 30 ngày; lấy max(thời gian còn lại, 30 ngày), không giảm hạn dài hơn đã có.
- 30 ngày = 600 giây ở 1x với 20 giây/ngày.
- Không phát ký ức/nhật ký từ API nền tảng trong đợt này. Các hook và sự kiện nội dung sẽ thêm ở đợt 2/3.

## 3. Điều kiện active và hình thành lại

- isActiveBondBetween yêu cầu hai người sống, hai loại đối ứng, cả hai không ended và episode ID phù hợp.
- Legacy thiếu metadata ở cả hai phía vẫn được đọc theo điều kiện sống/đối ứng trước đây; không bị cấp metadata chỉ vì xem UI.
- Một phía có metadata còn phía kia không có, hoặc hai episode khác nhau, không được coi active.
- Ràng buộc ended không được tính vào độc quyền đạo lữ/sức chứa sư đồ.
- Ràng buộc đặc biệt đang hoạt động, gồm kết nghĩa, không bị ghi đè thành một loại khác; cần kết thúc trước.
- Sau hết khóa, hình thành lại vẫn qua đủ điều kiện hai phía giai đoạn 2; không phục hồi tự động.
- Huyết thống vẫn dùng parentIds/nhãn kin làm bằng chứng, kể cả bản ghi lịch sử. Không cho dùng ended để lách kiểm tra họ hàng.
- Nhãn của bản ghi có metadata không bị đổi ngầm bởi updateOrdinaryLabel/hostility; giữ nhãn để lịch sử và lifecycle không mất vai trò. Điểm vẫn tăng/giảm theo hoạt động.

## 4. Reader cốt lõi

- Chỉ điểm chỉ dùng isActiveBondBetween sư đồ. Cặp ended không tăng masteryExp.
- Sinh sản cư dân cần đạo lữ active hai phía. Các điều kiện sinh sản khác và nhánh động vật giữ nguyên.
- Inspector bổ sung nhãn cơ bản "Ràng buộc đã kết thúc · quan hệ lịch sử"; ngày/lý do/history đầy đủ thuộc đợt 5.
- MentalStateSystem và AI trợ chiến chưa chuyển toàn bộ trong đợt này; lần lượt thuộc đợt 2 và 3. Chưa có hook gameplay tự gọi end API nên chưa bật hậu quả tự động trước khi nối reader.

## 5. Save codec

- Xuất/khôi phục bond metadata, bondHistory và counter qua SaveManager.
- Validator kiểm tra loại ràng buộc, schema, episode ID đúng cặp/counter, episode không trùng trong component, trạng thái, ngày, reason và số lượng history.
- active không được có endedAtDay/endReason; ended cần đủ ngày và reason; ngày kết thúc không trước ngày hình thành nếu có.
- conflictSinceDay chỉ được có trên active và không trước formedAtDay nếu có.
- History phải là ended; tối đa 20. Huyết thống chỉ được có endReason death trong schema.
- Save cũ thiếu trường mới dùng metadata thiếu, history rỗng, counter 0. Không tạo ngày hình thành mới, ký ức hoặc sự kiện chỉ do nạp.
- Khôi phục trong staging sau validate; không dùng chung object metadata với save đầu vào.
- Bộ codec kiểm tra cấu trúc/giá trị từng component; không tự sửa hoặc áp chính sách migration cho đồ thị một chiều.

## 6. Cấu hình chuẩn bị

- lifecycle: history 20, cooldown sau kết thúc 30 ngày, ngưỡng mâu thuẫn -50 hảo cảm/20 trust/30 ngày.
- rescue: nguy hiểm HP <= 35%, evidence 1 ngày, bán kính 180, tối đa 8 threats, cooldown 30 ngày.
- Các giá trị mâu thuẫn/rescue mới chỉ được khai báo, chưa kích hoạt trong đợt 1.

## 7. Tệp được sửa

- src/config/social.config.ts
- src/modules/social/SocialComponents.ts
- src/modules/social/RelationshipRules.ts
- src/modules/social/RelationshipService.ts
- src/modules/social/SocialInteractionService.ts
- src/modules/social/SocialSaveCodec.ts
- src/modules/save/SaveManager.ts
- src/modules/social/SocialInteractionSystem.ts
- src/modules/beings/ReproductionSystem.ts
- src/ui/SocialRelationshipInspector.ts

## 8. Mức kiểm tra

- Build TypeScript/Vite thành công sau sửa lỗi nullability; còn cảnh báo bundle > 500 kB.
- Diff check tệp liên quan không phát hiện lỗi khoảng trắng.
- Đã đọc lại thứ tự validate -> ghi hai phía, idempotence và reader chỉ điểm/sinh sản.
- Không thêm/chạy tests, chưa kiểm tra gameplay, tạo lại nhiều lần, codec round trip hoặc save/load lỗi bằng thực nghiệm. Build không chứng minh đầy đủ ma trận lifecycle.

## 9. Tiếp theo

Đợt 2: death hook, tang chế một lần, marker qua save và loại hỗ trợ tâm cảnh từ người đã mất.

Đợt 3: phản bội/mâu thuẫn tự động và reader AI. Đợt 4: cứu mạng có bằng chứng. Đợt 5: Inspector lịch sử đầy đủ và nghiệm thu theo yêu cầu.
