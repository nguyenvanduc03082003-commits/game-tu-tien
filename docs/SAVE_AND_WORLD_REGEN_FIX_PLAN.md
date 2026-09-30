# Kế hoạch sửa các lỗi logic đã xác minh

Tài liệu này dành cho model nhỏ triển khai tuần tự. Mỗi bước là một thay đổi độc lập: đọc đúng các tệp liên quan, thêm test tái hiện lỗi trước, sửa phạm vi nhỏ nhất, chạy test và build, rồi mới chuyển bước. Không thay đổi quy tắc game không liên quan hoặc chỉnh test để che lỗi.

## Hiện trạng đã xác minh

- `npm test`, `npm run build` và `npm run assets:check` đều chạy qua tại thời điểm rà soát.
- Build cảnh báo bundle JavaScript chính khoảng 1,04 MB. Đây là việc tối ưu riêng, ưu tiên sau các lỗi dữ liệu.
- Các lỗi bên dưới chưa được bộ test hiện tại bao phủ đầy đủ.

## Cách giao việc cho model nhỏ

Giao **một bước mỗi lần**. Kèm đường dẫn tài liệu này và yêu cầu model báo: (1) nguyên nhân, (2) tệp đã sửa, (3) test mới chứng minh tình huống lỗi, (4) kết quả `npm test` và `npm run build`, (5) giới hạn còn lại. Sau mỗi bước, xem diff trước khi giao bước tiếp theo. Không giao toàn bộ các bước trong một prompt.

Thứ tự đề xuất: **1 → 2 → 4 → 5 → 3 → 6 → 7 → 8**. Bước 2 phụ thuộc vào bước 1. Các bước 1 và 4 lớn hơn những bước còn lại: giao lần lượt **1A (giao dịch và fallback), 1B (đọc/index), 1C (xóa)** và **4A (hàm dùng đan), 4B (buff trong chiến đấu), 4C (lưu/nạp buff)**; không yêu cầu model sửa cả nhóm trong một lượt.

**Prompt mẫu:** “Đọc `docs/SAVE_AND_WORLD_REGEN_FIX_PLAN.md`. Chỉ thực hiện bước `<số hoặc phần chữ>`; trước tiên thêm test tái hiện lỗi của phần đó. Giữ nguyên thay đổi hợp lệ đã có trong workspace. Sau khi sửa, chạy test liên quan, `npm test`, `npm run build`; báo nguyên nhân, diff chính và kết quả. Không thực hiện bước kế tiếp.”

## Bước 1 — Chỉ báo lưu thành công sau khi dữ liệu đã được ghi bền vững

**Ưu tiên:** Cao. **Tệp chính:** `src/modules/save/SaveStorage.ts`, `src/modules/save/SaveManager.ts`.

### Vấn đề

`SaveStorage.putSlot()` hiện cập nhật `memStore` trước khi ghi bền vững. Nhánh lỗi IndexedDB có thể nuốt cả lỗi `localStorage` và trả về thành công dù bản lưu chỉ còn trong RAM. Ngoài ra, `request.onsuccess` chưa chứng minh giao dịch IndexedDB đã commit.

### Cách sửa

1. Chờ `transaction.oncomplete` để xác nhận ghi IndexedDB. Bắt `transaction.onerror` và `transaction.onabort`; tránh resolve chỉ từ `request.onsuccess`.
2. Nếu ghi IndexedDB thất bại, thử `localStorage.setItem`. Nếu fallback cũng thất bại hoặc không khả dụng, ném lỗi lên `SaveManager.saveSlot()`.
3. Chỉ đưa bản mới vào `memStore` sau khi một nơi lưu trữ bền vững đã ghi thành công.
4. Khi một lần ghi đè rơi sang `localStorage`, `getSlot()` phải trả về bản fallback mới thay vì bản cũ còn trong IndexedDB. Khi ghi IndexedDB thành công, dọn khóa fallback cũ.
5. Đảm bảo danh mục bản lưu chỉ được cập nhật sau khi ghi dữ liệu thành công. Nếu ghi index `localStorage` lỗi nhưng payload IndexedDB đã commit, phải có đường khôi phục metadata từ IndexedDB sau khi mở lại ứng dụng; không để bản lưu bền vững biến mất khỏi danh sách.
6. Với `deleteSlot()`, không xóa mục trong danh mục nếu bản lưu ở một backend còn tồn tại do lỗi xóa; chuyển lỗi lên nơi gọi để UI báo đúng.

### Test bắt buộc

- IndexedDB lỗi, `localStorage` ghi được: lưu và nạp lại bản mới thành công.
- IndexedDB lỗi, `localStorage` cũng lỗi hoặc không khả dụng: `saveSlot()` từ chối; không báo thành công.
- `request.onsuccess` xảy ra rồi giao dịch abort: thao tác lưu vẫn thất bại.
- Bản cũ ở IndexedDB, bản ghi đè mới ở fallback: sau khi xóa `memStore`, nạp ra bản mới.
- Xóa trong IndexedDB thất bại: danh mục không biến mất như thể đã xóa thành công.
- Payload đã commit nhưng ghi index lỗi: sau khi mở lại, danh sách vẫn tìm được slot từ IndexedDB.

**Hoàn thành khi:** Không có đường đi nào trả về thành công nếu dữ liệu chỉ tồn tại trong `memStore`; các test trên và `npm test` qua.

## Bước 2 — Không dựa vào lưu bất đồng bộ trong `beforeunload`

**Ưu tiên:** Cao. **Tệp chính:** `src/main.ts`.

### Vấn đề

Handler `beforeunload` gọi `SaveManager.saveSlot()` nhưng trình duyệt không chờ Promise nén và ghi IndexedDB. `try/catch` hiện tại cũng không bắt được Promise bị từ chối.

### Cách sửa

1. Bỏ lời gọi lưu bất đồng bộ khỏi `beforeunload` hoặc bỏ mọi kỳ vọng nó là bản lưu đã xác nhận.
2. Kích hoạt một lần lưu sớm khi `document.visibilityState` chuyển sang `hidden`. Đây vẫn là nỗ lực lưu tốt nhất, không bảo đảm hoàn tất khi trang bị đóng ngay.
3. Giữ autosave định kỳ và thao tác lưu thủ công làm các đường lưu có xác nhận. Ngăn các lần lưu cùng slot chạy chồng nhau hoặc ghi đè ngược thứ tự.
4. Bắt và xử lý lỗi Promise trong handler mới; không phát thông báo “lưu thành công” trước khi `saveSlot()` hoàn tất.

### Test bắt buộc

- Chuyển trang sang trạng thái ẩn chỉ khởi phát một lần lưu cho cùng một lượt chuyển trạng thái.
- Hai yêu cầu lưu liên tiếp cùng slot không khiến bản cũ ghi đè bản mới.
- Test không giả định `beforeunload` có thể chờ Promise.

**Hoàn thành khi:** Không còn đường lưu khi đóng trang được trình bày như một bảo đảm; autosave và lưu thủ công vẫn hoạt động.

## Bước 3 — Tạo lại bản đồ qua Engine

**Ưu tiên:** Trung bình. **Tệp chính:** `src/ui/GodToolbar.ts`, `src/core/Engine.ts`.

### Vấn đề

Nút tạo bản đồ hiện chỉ gọi `WorldGenerator.generate()` và khởi tạo lại `qiGrid`. Thực thể, cây và công trình của thế giới trước vẫn nằm nguyên vị trí; seed và mẫu lưu trong Engine cũng không được cập nhật.

### Cách sửa

1. Quy định nút này là **tạo thế giới mới**, không phải đổi riêng địa hình. Ghi rõ tác động xóa thế giới hiện tại trong UI trước khi thực hiện.
2. Gọi `engine.initNewWorld()` với mẫu và seed mới, thay vì thao tác trực tiếp lên `worldMap` và `qiGrid`.
3. Giữ tên thế giới và kích thước hiện tại; truyền các giá trị này rõ ràng vào `initNewWorld()`.
4. Đồng bộ seed, mẫu, thực thể, cây, công trình và lưới linh khí qua cùng một luồng khởi tạo. Nếu về sau cần **đổi địa hình nhưng giữ cư dân**, đó là tính năng riêng có bước di dời thực thể và kiểm tra công trình.

### Test bắt buộc

- Sau khi tạo lại, seed và mẫu trong Engine và metadata của bản lưu khớp bản đồ mới.
- Không còn thực thể hoặc công trình từ thế giới cũ.
- Tạo lại cùng seed và mẫu cho kết quả khởi tạo lặp lại được.

**Hoàn thành khi:** Nút tạo lại không để thực thể cũ trên địa hình mới; `npm test` qua.

## Bước 4 — Sửa mọi đường dùng đan dược

**Ưu tiên:** Cao. **Tệp chính:** `src/ui/InspectorPanel.ts`, `src/modules/ai/brain/behavior/BehaviorTree.ts`, `src/modules/alchemy/AlchemySystem.ts`, `src/modules/alchemy/InventoryComponent.ts`, `src/modules/combat/CombatSystem.ts`, `src/modules/combat/CombatComponents.ts`, `src/modules/save/SaveManager.ts`. Có thể thêm một service nhỏ trong `src/modules/alchemy/`.

### Vấn đề

UI tạo nút dùng cho mọi viên đan rồi tiêu hao trước khi kiểm tra hiệu ứng. Đường `BehaviorTree.executeUsePill()` của AI cũng tiêu hao viên đầu tiên và chỉ phát thông báo. Loại `revive` và `buff` có thể mất vô ích; đan đột phá ở UI cộng Qi thay vì `breakthroughBonus`. `buffDamageMultiplier` và `buffTimer` chưa tham gia công thức đánh và chưa được lưu.

### Cách sửa

1. Tạo **một hàm dùng đan chung** nhận `(world, entityId, pillId)` và trả kết quả `{ used, reason }` hoặc cấu trúc tương đương. Kiểm tra định nghĩa, số lượng, tình trạng nhân vật và điều kiện hiệu lực **trước** khi gọi `consumePill()`.
2. Quy tắc tối thiểu: hồi máu chỉ khi còn sống và thiếu máu; hồi sinh chỉ khi đã chết; tăng thọ khi có `LifespanComponent`; đan đột phá đặt `realm.breakthroughBonus` đúng mô tả và đúng giai đoạn; buff cần `CombatStatsComponent` và có thời hạn. Không trừ viên nếu không thể áp dụng hiệu ứng.
3. Dùng hàm chung ở nút UI và bước AI; AI chọn viên **có thể dùng và phù hợp mục tiêu** thay vì viên đầu tiên trong túi. Giữ cơ chế tự động của `AlchemySystem` nhưng chuyển về cùng quy tắc hiệu ứng để tránh hai cách dùng khác nhau.
4. Giảm `buffTimer` theo tick mô phỏng, áp `buffDamageMultiplier` **một lần** vào sát thương nguồn trước khi tạo projectile hoặc gây đòn cận chiến; hết giờ thì trả multiplier về `1`. Không nhân lặp qua mỗi tick.
5. Lưu/nạp hai trường buff còn hiệu lực trong `comps.stats`. Bản lưu cũ thiếu trường này phải dùng mặc định `1` và `0`; xác thực giá trị hữu hạn, không âm.
6. Nút UI của viên chưa dùng được nên bị vô hiệu hóa hoặc trả thông báo lý do rõ ràng; không báo đã dùng khi không có hiệu ứng.

### Test bắt buộc

- Bấm dùng `revive` khi còn sống hoặc buff khi thiếu combat stats: số viên không giảm.
- AI không tiêu hao viên đầu tiên nếu viên đó không áp dụng được.
- Đan đột phá tăng đúng tỷ lệ, không tự cộng Qi; đan hồi sinh tự động vẫn hồi sinh đúng một lần.
- Buff tăng sát thương cận chiến và tầm xa đúng một lần, hết hạn trở về sát thương gốc, save/load giữ thời gian còn lại; bản lưu cũ vẫn nạp được.

**Hoàn thành khi:** Mọi đường dùng đan có cùng điều kiện và hiệu ứng; không còn trường hợp trừ viên mà không có tác dụng.

## Bước 5 — Siết xác thực và khôi phục bản lưu nhập

**Ưu tiên:** Trung bình. **Tệp chính:** `src/modules/save/SaveManager.ts`, có thể bổ sung helper trong `src/modules/save/`.

### Vấn đề

`validateSaveData()` chưa kiểm tra `time.speed`, ID trùng, quan hệ `nextEntityId` với ID lớn nhất, và nhiều phần tử của tuple bản đồ/Qi. Sau staging, code lại đặt bộ đếm ID từ dữ liệu chưa ràng buộc; một bản lưu nhập sai có thể làm đứng mô phỏng hoặc cấp trùng ID.

### Cách sửa

1. Chỉ chấp nhận `time.speed` thuộc `[0, 1, 2, 5, 10, 50]`; `totalTicks` là số nguyên không âm.
2. Mọi `entity.id` phải là số nguyên dương, hữu hạn, không trùng. Với bản lưu có `nextEntityId`, yêu cầu số nguyên lớn hơn `max(entity.id)`; với bản lưu cũ thiếu trường này, suy ra `max(entity.id) + 1` (ít nhất bằng mốc khởi tạo cần thiết) thay vì dùng hằng `1000` mà không xét ID đã có.
3. Kiểm tra toàn bộ tuple `worldMap.tiles` và `qiGrid.tiles`: đúng kiểu, giá trị hữu hạn, miền hợp lệ theo cấu hình; kiểm tra kích thước Qi khớp bản đồ. Giới hạn kích thước mảng theo các kích thước thế giới mà game hỗ trợ để tránh cấp phát vô hạn từ tệp nhập.
4. Giữ nguyên nguyên tắc staging: dữ liệu sai phải bị từ chối **trước khi** xóa hoặc sửa thế giới đang chơi. Không đổi schema bản lưu hợp lệ hiện tại.

### Test bắt buộc

- `time.speed = null` hoặc `-1`, entity ID trùng, `nextEntityId <= maxId`, tuple có `NaN`/chuỗi, kích thước Qi lệch: đều bị từ chối và thế giới đang chơi còn nguyên.
- Bản lưu hợp lệ hiện tại và bản lưu cũ không có `nextEntityId` vẫn nạp; ID thực thể tạo tiếp theo không trùng.

**Hoàn thành khi:** Các đầu vào sai không thể làm đứng tick hoặc cấp trùng ID sau nạp.

## Bước 6 — Hiển thị các sự kiện sinh và tử trong nhật ký

**Ưu tiên:** Thấp. **Tệp chính:** `src/ui/WorldChronicle.ts`, `src/modules/beings/ReproductionSystem.ts`, `src/modules/ai/NeedsSystem.ts`.

### Cách sửa

Thêm `birth` và `death` vào kiểu và bộ lọc danh mục của WorldChronicle; dùng màu/kiểu hiển thị hiện có hoặc bổ sung kiểu đơn giản. Giữ giới hạn 35 dòng và cơ chế gộp sự kiện trùng để tránh spam. Không thay đổi điều kiện phát sinh sự kiện.

### Test bắt buộc

Phát `world:log` loại `birth` và `death`, xác nhận xuất hiện; loại không được phép vẫn bị bỏ qua; `clear()` vẫn hoạt động.

**Hoàn thành khi:** Hai sự kiện đã phát được hiển thị một lần trong nhật ký.

## Bước 7 — Dùng cùng đơn vị ngày khi uống đan tăng thọ

**Ưu tiên:** Thấp. **Tệp chính:** `src/ui/InspectorPanel.ts`, `src/core/TimeManager.ts`.

### Cách sửa

Thay phép chia cứng `getCurrentTick() / 600` bằng `TimeManager.TICKS_PER_DAY`, giống nhánh tự động trong `AlchemySystem`. Tốt hơn là để service dùng đan của bước 4 tính ngày một lần cho cả UI và AI.

### Test bắt buộc

Ở tick 40, điều chỉnh tăng thọ ghi ngày 2; save/load giữ đúng ngày này. Hiệu lực tăng thọ và quy tắc chống cộng lặp vẫn giữ nguyên.

**Hoàn thành khi:** Không còn hằng `600` dùng để đổi tick sang ngày trong luồng uống đan.

## Bước 8 — Kiểm tra cuối

Chạy `npm test`, `npm run build` và `npm run assets:check`. Xem diff toàn bộ, chạy lại các ca save/load cùng bản lưu cũ và bản lưu mới, kiểm tra UI lưu/nạp, tạo thế giới và dùng từng loại đan trong trình duyệt. Không đánh dấu hoàn thành chỉ vì build qua. Cảnh báo bundle 1,04 MB là công việc tối ưu riêng, không thuộc phạm vi sửa lỗi logic này.
