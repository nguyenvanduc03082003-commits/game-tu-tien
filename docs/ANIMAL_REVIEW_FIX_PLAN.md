# Kế hoạch sửa lỗi hệ động vật sau mốc Git `1504cfc`

## Mục tiêu và ranh giới

Sửa ba lỗi đã xác nhận: sprite động vật không được nạp, động vật tăng độ no ở nơi không có thức ăn hợp lệ, và tài liệu thêm loài/sprite không khớp mã. Giữ nguyên ranh giới động vật với yêu tộc, 40 loài hiện có, định dạng save 2.0.0 và cân bằng mô phỏng ngoài ba lỗi này. Không tạo 40 bộ sprite trong đợt sửa.

Mốc trước sửa: `1504cfc` trên nhánh `main`. Dùng `git status`, `git diff --check`, `git diff 1504cfc..HEAD --stat` và `git log --oneline` để kiểm tra tiến độ. Tạo một commit riêng sau mỗi bước dưới đây; không sửa commit mốc. Nếu máy khác báo `dubious ownership`, chỉ thêm chính đường dẫn `G:/game_tu_tien` vào `safe.directory`, không dùng `*`.

## Bước 1 — Nạp sprite đúng theo catalog

**Lỗi:** `AnimalRenderer.getOptionalSprite()` chỉ gọi `AssetManager.hasTexture/getTexture` với key `animal_<id>_<stage>` hoặc `animal_<id>_adult`, nhưng `AssetManager.preloadConfiguredAssets()` chưa đăng ký URL động vật. Trường `spriteDirectory` trong catalog hiện không được sử dụng.

1. Tạo một bộ quản lý ảnh động vật nhỏ trong `src/renderer/assets/` hoặc mở rộng `AssetManager` (chỉ một nơi chịu trách nhiệm). Đầu vào là `AnimalSpeciesDefinition` và `AnimalLifeStage`; đường dẫn lấy từ `spriteDirectory`, không tự ghép lại từ ID ở renderer. Giữ quy ước key `animal_<id>_<stage>`.
2. Khi cần vẽ loài/giai đoạn lần đầu, nạp `<spriteDirectory>/<stage>.png` qua `AssetManager.loadTexture()`. Với `child`/`elder`, nếu ảnh riêng thiếu thì thử `adult.png`. Nếu adult cũng thiếu, trả về hình vẽ dự phòng. Không dùng sprite yêu tộc.
3. Lưu trạng thái `pending` và `failed` theo URL, để ảnh thiếu không tạo request 404 ở mỗi khung hình. Khi tải xong, frame tiếp theo tự dùng ảnh; không chặn vòng render để chờ mạng. Đảm bảo `child` vẫn dùng hệ số kích thước con non khi fallback về ảnh adult.
4. Sửa [AnimalRenderer] và đường khởi tạo asset tương ứng. Không yêu cầu 120 request cho 40 loài lúc vào game; chỉ tải khi loài xuất hiện hoặc được chọn.
5. Test: giả lập `Image`/loader để chứng minh đường dẫn và key đúng; `child.png` có thì ưu tiên child, thiếu child thì dùng adult, thiếu cả hai thì dùng hình vẽ dự phòng, cùng một URL lỗi chỉ được thử một lần. Thêm test vào runner `tests/run.mjs` nếu tạo suite mới.

**Đạt khi:** thêm `public/assets/sprites/animals/dog/adult.png` rồi mở game thì chó hiện ảnh sau khi nạp; loài không có ảnh vẫn hiện hình vẽ cơ bản và không lặp request mỗi frame.

## Bước 2 — Chỉ cho kiếm ăn khi có nguồn thức ăn

**Lỗi:** `AnimalAISystem.startForage()` có thể đặt `forage` nhưng không có đích. `tickOngoingConsumption()` coi trường hợp đó như đã tới nơi và cộng độ no. `pickWanderDestination()` còn trả về ô đi được ngoài `spec.habitats` như phương án dự phòng.

1. Viết một hàm kiểm tra vị trí kiếm ăn hợp lệ dùng chung cho cả chọn đích và cộng độ no: ô phải đi được, thuộc `spec.habitats`; một cây gần đó chỉ hợp lệ nếu nằm trên ô có thể tới. Không thêm cơ chế trữ lượng thức ăn vào đợt này.
2. Tách `pickWanderDestination` cho đi dạo và chọn đích kiếm ăn, hoặc thêm tham số yêu cầu sinh cảnh. Khi tìm đồ ăn không được trả về ô dự phòng ngoài sinh cảnh.
3. Nếu không có đích kiếm ăn hợp lệ, đưa AI về `idle` với thời gian chờ rồi thử lại; không duy trì `forage` rỗng. Khi động vật đã tới đích, kiểm tra lại địa hình tại vị trí hiện tại trước khi cộng độ no, vì bản đồ có thể đã thay đổi.
4. Duy trì ngưỡng đói hiện có (tìm ăn dưới 45, dừng ở 80), tiêu hao đói của `AnimalLifecycleSystem`, và hành vi săn/xác ăn thịt.
5. Test ở `tests/animal-simulation-regression.ts`: thú ăn cỏ đặt trên ô đi được nhưng ngoài sinh cảnh, không có cây/ô sinh cảnh hợp lệ trong tầm, chạy nhiều tick thì độ no không tăng; khi thêm ô sinh cảnh có đường tới, nó di chuyển rồi mới ăn; đổi ô đích thành không hợp lệ trước khi tới thì không ăn. Test riêng rằng săn mồi/ăn xác vẫn hoạt động.

**Đạt khi:** động vật không thể tự hồi độ no trên ô sai sinh cảnh hay khi không tìm được đường đến thức ăn; world mới vẫn có thể duy trì các loài ăn cỏ trong sinh cảnh phù hợp.

## Bước 3 — Viết lại hướng dẫn theo mã hiện tại

1. Viết lại `src/config/animals/README.md` dựa trên `animal.types.ts`, `animal.defaults.ts`, `animal.catalog.ts` và một file loài thật trong `species/`. Liệt kê đúng `AnimalSpeciesSeedInput`: `sizePreset`, `spawnWeight`, `scale`, `spriteDirectory`, `description`, `lifespanYears`, `adultAgeYears`, `reproductionCooldownDays` và các trường khác đang có. Không nhắc `temperament`, `sizeClass`, `offspringRange`, `naturalSpawnWeight`, `baseScale`, `spriteFolder` vì không tồn tại.
2. Ví dụ thêm loài phải dùng đường dẫn `src/config/animals/species/large-mammals.animals.ts`, `TerrainType` có thật (ví dụ `HILL`, `MOUNTAIN`, `PLATEAU`), mảng export thật và mã `createAnimalSpecies()` biên dịch được. `AnimalSpeciesId` hiện là `string`, vì vậy không hướng dẫn sửa union. Việc thêm loài cần thêm phần tử vào mảng nhóm, không phải sửa trực tiếp catalog trừ khi thêm một nhóm mới.
3. Ghi rõ catalog hiện được kiểm tra ở mốc 40 loài; nếu bổ sung loài thứ 41, cập nhật kiểm tra số lượng và test tương ứng. UI/spawn/renderer tự đọc catalog sau khi đã đăng ký đúng mảng.
4. Sửa `public/assets/sprites/animals/README.md` theo cơ chế nạp thực sự hoàn tất ở Bước 1. Dùng ví dụ `water_buffalo` thay `buffalo`; bỏ tên `visual.bodyShape` và sáu kiểu hình cũ. Nêu ảnh adult là tùy chọn và child/elder fallback ra sao.
5. Cập nhật `docs/ANIMAL_YAO_IMPLEMENTATION_STATUS.md` tại phần sprite/README: mô tả kết quả mới và test đã chạy, không giữ tuyên bố cũ sai sự thật.

**Đạt khi:** một người chưa biết dự án có thể chép ví dụ README, thêm một loài thử nghiệm, chạy build/test thành công; xóa loài thử nghiệm sau khi xác minh để giữ danh mục 40.

## Kiểm tra và bàn giao

Sau mỗi bước chạy test liên quan và `npm run build`. Sau cả ba bước chạy `npm test`, `npm run build`, `npm run assets:check`, `git diff --check`; kiểm tra trực tiếp trong browser ít nhất một loài có ảnh và một loài không có ảnh, đi dạo và kiếm ăn. Ghi kết quả, commit hash và giới hạn chưa kiểm tra vào tài liệu trạng thái. Nếu xuất hiện lỗi ở hành vi yêu tộc, save hay catalog 40 loài, xử lý như hồi quy của thay đổi vừa thực hiện. Không sửa test bằng cách bỏ assertion hoặc tắt suite.

Các commit gợi ý: `Fix animal sprite loading`, `Require valid forage habitat`, `Correct animal extension guides`. Sau đó dùng `git diff 1504cfc..HEAD` để xem toàn bộ phần sửa và `git show <hash>` để xem từng bước.
