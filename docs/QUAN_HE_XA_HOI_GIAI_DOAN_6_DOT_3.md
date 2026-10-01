# Quan hệ xã hội — Giai đoạn 6, đợt 3

Ngày: 01-10-2026. Trạng thái: **đã triển khai tín nhiệm tích lũy và persistence; chưa nghiệm thu bằng hồi quy, roundtrip hoặc baseline mới**.

## 1. Cơ chế đã triển khai

Cấu hình thử nghiệm tại `src/config/social.config.ts`:

| Thông số | Giá trị |
|---|---:|
| Cuộc gặp trung tính cho một lần thưởng | 3 |
| Tín nhiệm mỗi lần | +1 |
| Trần tín nhiệm từ cơ chế này | 60 |
| Hảo cảm tối thiểu của cả hai phía, trước cuộc gặp | 10 |
| Khoảng nghỉ xóa tiến độ chưa hoàn thành | >=10 ngày mô phỏng |

Đây là cấu hình đã đưa vào mã để thử nghiệm, chưa là giá trị đã cân bằng qua số liệu. Không đổi delta warm/neutral/awkward cũ hoặc ngưỡng hình thành companion/sworn.

Mỗi chiều quan hệ có `familiarity` tùy chọn gồm schemaVersion 1, neutralCount, lastQualifiedDay và lastQualifiedTick. Các context casual/community/cultivation dùng cùng tiến độ; không dùng interactionsCount để suy số cuộc gặp trung tính.

### Quy tắc thực thi

- Evaluator thuần nhận outcome và điểm hai phía **trước** commit; không truy cập world, RNG hoặc ghi dữ liệu.
- Chỉ sau khi hội thoại được gate cho thực hiện mới ghi tiến độ và delta trust. Skipped không thay progress/điểm/ký ức.
- Bên neutral tích lũy riêng nếu cả hai affinity >=10; bên warm/awkward xóa tiến độ riêng. Warm vẫn nhận delta trust vốn có.
- Lần thứ ba thưởng +1, tiến độ trở về 0 và giữ tick/day để tránh cộng lại trong cùng tick. Tới trust 60 thì không giữ progress; cooldown hội thoại vẫn chặn gọi lặp.
- Trust 59,5 chỉ nhận tối đa 0,5 tới 60; trust đã cao hơn 60 từ các nguồn khác không bị hạ xuống.
- Khi khoảng nghỉ >=10 ngày, lần neutral tiếp theo bắt đầu lại từ count 1, không thưởng từ count cũ. Không tăng điểm thụ động; reader trả bản sao hiệu lực mà không xóa state trong world.
- Nếu một bên dưới affinity 10 trước cuộc gặp thì cả hai không tích lũy. Sau các nguồn adjustScores khác, phía dưới ngưỡng affinity hoặc đã đạt trust 60 xóa tiến độ của mình; reader kiểm tra cả hai phía trước hiển thị/lưu.
- Delta trust bổ sung được gộp vào cùng một `adjustScores` của hội thoại. Không tăng interactionsCount thêm lần thứ hai để thưởng familiarity.
- Kết quả completed trả delta trust tổng thực tế; evaluateConversation thuần hiện vẫn trả delta cơ bản theo outcome. Preview và commit có phạm vi khác nhau, UI tiến độ sẽ bổ sung ở đợt 5.

## 2. Lifecycle và bản lưu

- Đòn trúng có damage dương đi qua handleBondBetrayal xóa tiến độ hai phía, kể cả chưa có ràng buộc đặc biệt. Đòn bị né không đi qua hook này.
- EndBond thành công xóa tiến độ trước các callback sự kiện.
- endBondsForDeath xóa tiến độ của các quan hệ liên quan tới người chết, kể cả quan hệ thường; không tạo quan hệ ngược giả.
- cloneRelationshipRecord sao chép sâu progress; archive/serialize lịch sử không mang progress sống.
- SocialSaveCodec kiểm tra schema/count/day/tick; count phải 0..2 theo cấu hình hiện tại. SaveManager truyền thời điểm save vào validator để từ chối progress vượt ngày/tick bản lưu trước staging/commit.
- Lưu qua SaveManager loại progress hết hạn, không còn đủ affinity/trust hoặc participant không còn sống khỏi bản sao, không sửa state world trong lúc serialize.
- Constructor component hydrate progress qua clone hiện có. Save thiếu trường progress bắt đầu không có tiến độ; không suy từ interactionsCount hoặc ký ức.
- Reset world/load sử dụng component mới từ dữ liệu đã validate; không có cache progress toàn cục.

Giới hạn: schema/count đang theo cấu hình thử ba cuộc gặp. Nếu đổi số cuộc gặp về sau phải quyết định migration/bounds đồng thời; không tự coi mọi cấu hình mới tương thích save chứa progress cũ. Validator day/tick dùng clock có calendar offset, không chia tất cả ngày cho 400.

## 3. Bản đồ tệp

| Tệp | Thay đổi |
|---|---|
| `src/config/social.config.ts` | Nhóm cấu hình familiarity |
| `src/modules/social/SocialFamiliarityService.ts` mới | Evaluator thuần, reader bản sao hiệu lực, clear hai chiều |
| `src/modules/social/SocialComponents.ts` | Schema progress, deep clone, archive và xử lý điều kiện không còn hợp lệ |
| `src/modules/social/SocialConversationService.ts` | Snapshot trước commit, gộp delta, ghi progress trong callback thành công |
| `src/modules/social/SocialSaveCodec.ts` | Serialize/validate progress và loại progress khỏi history |
| `src/modules/save/SaveManager.ts` | Owner serialize và thời điểm save cho validation |
| `src/modules/social/RelationshipService.ts` | Xóa khi end/đòn trúng |
| `src/modules/social/SocialDeathService.ts` | Xóa khi chết cho quan hệ thường và đặc biệt |

Telemetry bổ sung familiarity:advanced/rewarded/duplicate khi tiến độ được xử lý trong commit; tắt mặc định, không tiêu RNG. Không ghi mỗi reset như một sự kiện gameplay mới.

## 4. Kiểm tra và phạm vi chứng cứ

- Build cuối: `npm.cmd run build` đạt, 171 module, còn cảnh báo chunk lớn. Lần build đầu phát hiện tên biến owner chưa đúng trong SaveManager; đã sửa và build lại.
- `git -c core.safecrlf=false diff --check` đạt.
- Chưa thêm/chạy test, roundtrip, baseline hoặc browser trong lượt triển khai này. Không gọi persistence đã nghiệm thu chỉ vì codec biên dịch.
- Chưa có bằng chứng cơ chế mới làm xuất hiện bond trong nhóm bận hoặc cải thiện tốc độ bạn đầu tiên; cần đo đối chứng trước/sau.
- G6 đợt 2 vẫn chờ parity/hiệu năng; triển khai đợt 3 theo yêu cầu tiếp tục, không đổi trạng thái gate còn thiếu thành đã đạt.

## 5. Nghiệm thu cần thực hiện

Các case: 0→1→2→thưởng, ngưỡng affinity9/10, trust59/60 và trust cao từ nguồn khác; hai phía outcome khác nhau; đổi context; cooldown/trùng tick; khoảng nghỉ dưới/đúng10 ngày; skipped không mutation; clone độc lập; death/betrayal/end reset; save ở count2 tiếp tục sau load; save thiếu trường; malformed schema/count/NaN/day/tick tương lai reject atomically; calendar offset/pause. Giữ hồi quy G5 và chạy baseline nhóm rảnh/bận trước chốt cấu hình.

Đợt 4 tập trung đo cơ hội giao lưu và vòng đời plan AI; đợt 5 mới thêm giải thích tiến độ trên giao diện.
