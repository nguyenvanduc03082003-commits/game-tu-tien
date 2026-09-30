# Trạng thái triển khai đặc điểm độ cao địa hình

> Cập nhật theo trình tự triển khai bắt buộc trong `docs/ELEVATION_IMPLEMENTATION_PLAN.md`.

## Bước 1: Khởi động và lưu kết quả gốc

- **Đã làm**:
  - Kiểm tra môi trường hệ thống: `git` không cài đặt trong PATH hệ thống Windows; sử dụng `cmd /c` cho các script npm.
  - Chạy `npm test`: Toàn bộ test hiện tại (Mental Growth V3, Resident AI, Save regression, Simulation Audit, Animal Catalog, Animal Simulation, Animal Save, Animal Asset, Flora Spawn, Catalog template) PASS 100%.
  - Chạy `npm run build`: `tsc && vite build` thành công mà không có lỗi TypeScript hay build lỗi.
  - Chạy `npm run assets:check`: `node scripts/appearance-catalog.mjs` chạy thành công (0 bộ nhân vật; 0 bộ trang phục).
  - Kết quả kiểm tra ban đầu được ghi nhận sạch sẽ, không có lỗi tồn đọng trước khi triển khai.
- **Lệnh kiểm tra**:
  - `cmd /c npm test`
  - `cmd /c npm run build`
  - `cmd /c npm run assets:check`
- **Lỗi còn lại**: Không có lỗi.
- **Bước kế tiếp**: Bước 2 - ĐÃ HOÀN THÀNH.

## Bước 2: Tạo ElevationRules.ts và kiểm thử ranh giới

- **Đã làm**:
  - Tạo `src/modules/world/ElevationRules.ts` với đầy đủ các hàm thuần túy và hằng số cân bằng:
    - Hằng số `MAX_TRAVERSABLE_SLOPE = 0.20`, `ELEVATION_BRUSH_STEP = 0.02`.
    - Phân chia 5 mức `ElevationBand`: `'lowland'`, `'low'`, `'middle'`, `'high'`, `'summit'` kèm tên hiển thị tiếng Việt.
    - `clampElevation(value)` và `isValidElevation(value)`: bảo vệ nghiêm ngặt chống `NaN`, `Infinity`, số âm, số > 1.
    - `getSlope(from, to)` và `canTraverseSlope(from, to)`.
    - `getSlopeMoveFactor(from, to)` và `getSlopePathCost(from, to)`: đảm bảo tương thích 1:1 (`moveFactor * pathCost = 1.0`), lên dốc chậm/đắt hơn xuống dốc, không âm, không 0, không NaN.
    - `canTraverseDiagonalSlope(from, to, ortho1, ortho2)`: kiểm tra dốc đường chéo và ngăn chặn lách góc qua vách núi.
    - `reconcileElevationForTerrain(terrain, currentElevation)`: hòa giải độ cao khi tô địa hình (núi phải cao, hồ/biển phải thấp, rừng/sông giữ được độ cao tự nhiên).
    - `calculateBaseTemperature(terrain, elevation)`: công thức nhiệt độ chuẩn hóa tập trung.
  - Tạo `tests/elevation-regression.ts` và đăng ký vào `tests/run.mjs`.
  - Kiểm thử ranh giới vượt qua 100%.
- **Lệnh kiểm tra**:
  - `cmd /c npm test`
  - `cmd /c npm run build`
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 3 & Bước 4 - ĐÃ HOÀN THÀNH.

## Bước 3: Thêm WorldMap.setElevation() và applyElevationBrush()

- **Đã làm**:
  - Triển khai `WorldMap.setElevation(x, y, elevation)`: kiểm tra biên tọa độ, chống giá trị `NaN`/vô hạn, chuẩn hóa bằng `clampElevation`, cập nhật nhiệt độ nền theo công thức tập trung và đánh dấu map dirty khi có thay đổi thực sự.
  - Triển khai `WorldMap.applyElevationBrush(centerX, centerY, mode, radius, step)`:
    - Chế độ `'raise'` và `'lower'` với bước `ELEVATION_BRUSH_STEP = 0.02`.
    - Chế độ `'smooth'` lấy snapshot vùng cũ trước khi tính toán để đảm bảo kết quả tất định và độc lập với thứ tự duyệt ô.
    - Phát sự kiện `world:elevation_modified` qua `EventBus` khi có ô thay đổi.
  - Thêm test regression cho `setElevation` và `applyElevationBrush` trong `tests/elevation-regression.ts`.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.

## Bước 4: Hòa giải cao độ trong WorldMap.setTerrain() và đồng bộ WorldGenerator

- **Đã làm**:
  - Cập nhật `WorldMap.setTerrain()` để tự động hòa giải cao độ (`reconcileElevationForTerrain`):
    - Tô Núi lên vùng trũng/hồ nâng cao độ lên dải núi (0.75).
    - Tô Hồ lên vùng núi cao hạ cao độ xuống dải hồ (0.20).
    - Tô Rừng trên núi cao giữ nguyên cao độ (0.75) thay vì ép về đồng bằng.
  - Sử dụng công thức nhiệt độ chuẩn hóa tập trung `calculateBaseTemperature` thay vì hardcode.
  - Giữ nguyên logic sinh địa hình tự nhiên và dòng sông chảy từ núi cao trong `WorldGenerator.ts`.
  - Kiểm thử tính tất định tạo thế giới theo cùng seed `12345` trùng khớp 100% về địa hình, cao độ và nhiệt độ.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 5 - ĐÃ HOÀN THÀNH.

## Bước 5: Thêm lớp phủ độ cao, nút toggle và hiển thị InspectorPanel

- **Đã làm**:
  - `QiOverlayRenderer.ts`:
    - Thêm cờ `showElevation` và phương thức `setOverlayMode('none' | 'qi' | 'temperature' | 'elevation')`.
    - Vẽ lớp phủ độ cao bán trong suốt theo 5 band (lowland, low, middle, high, summit) với màu sắc trực quan, chỉ duyệt các ô nằm trong khung nhìn camera `getVisibleBounds`, sprite mặt đất bên dưới vẫn hiển thị rõ ràng.
  - `TimeControls.ts`:
    - Thêm nút `⛰️ Độ Cao` vào hàng điều khiển lớp phủ `interactive-ui`.
    - Ràng buộc loại trừ hoàn toàn (mutual exclusion) giữa 3 lớp phủ: bật Độ Cao sẽ tắt Linh Khí và Nhiệt Độ, và ngược lại.
  - `InspectorPanel.ts`:
    - Thêm dòng thông tin độ cao tương đối `0–100%` kèm tên phân dải tiếng Việt: `${Math.round(tile.elevation * 100)}% (${ELEVATION_BAND_NAMES[getElevationBand(tile.elevation)]})`.
  - Thêm test regression cho lớp phủ và tên band trong `tests/elevation-regression.ts`.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 6 - ĐÃ HOÀN THÀNH.

## Bước 6: Thêm công cụ Nâng, Hạ, Làm mượt trong GodToolbar và kết nối sự kiện Engine

- **Đã làm**:
  - `Engine.ts`:
    - Thêm biến trạng thái `activeElevationBrushMode: 'raise' | 'lower' | 'smooth' | null`.
    - Xử lý chuột kéo thả (`mousemove` với `buttons === 1`) và `mousedown`: áp dụng `applyElevationBrush(tx, ty, mode, brushRadius)`.
    - Reset `activeElevationBrushMode = null` khi reset thế giới.
    - Cập nhật hiển thị vòng tròn cọ (`hoverTile`) khi đang chọn cọ địa hình hoặc cọ độ cao.
  - `GodToolbar.ts`:
    - Tab `🖌️ Địa Hình`: thêm 3 nút công cụ độ cao: `🔺 Nâng Đất`, `🔻 Hạ Đất`, `〰️ Làm Mượt`.
    - Ràng buộc loại trừ lẫn nhau: khi kích hoạt cọ độ cao sẽ tự động hủy cọ đổi `TerrainType`, và ngược lại; nút `✋ Chế độ xem` hủy cả hai loại cọ.
    - Cả hai nhóm công cụ đều chia sẻ chung thiết lập bán kính cọ `brushRadius` (1x1, 3x3, 5x5, 9x9).
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 7 - ĐÃ HOÀN THÀNH.

## Bước 7: Tích hợp quy tắc dốc vào thuật toán A*

- **Đã làm**:
  - Mở rộng `AStarPathfinder.findPath` với tùy chọn rõ ràng `enforceElevationSlope: boolean = false`:
    - Giữ nguyên hành vi mặc định `false` cho các lệnh gọi cũ để không phá vỡ tương thích.
    - Fast direct raycast kiểm tra dốc qua `hasLineOfSight(..., enforceElevationSlope)`.
    - Hạn ngạch tính toán nặng mỗi tick (`searchesThisTick >= MAX_HEAVY_SEARCHES_PER_TICK`) kiểm tra đường thẳng đệm an toàn qua `hasLineOfSight`.
    - Quá trình mở rộng cạnh lân cận: kiểm tra dốc trực giao và chéo (`canTraverseSlope`, `canTraverseDiagonalSlope`), tính chi phí `slopeCost = getSlopePathCost(...)` tương thích với tốc độ di chuyển thực.
    - Xử lý bao kín: khi `openSet` rỗng mà chưa chạm đích, báo không có đường (`[]`).
    - Làm mượt đường (`smoothPath`) truyền cờ `enforceElevationSlope` xuống `hasLineOfSight`, đảm bảo không bao giờ làm mượt xuyên qua vách núi.
  - Thêm test regression toàn diện trong `tests/elevation-regression.ts`:
    - Tìm đường vòng qua vách núi khi có lối mở.
    - Trả về rỗng khi bị bao kín hoàn toàn.
    - Fast path và Raycast DDA chặn dốc khi bật `enforceElevationSlope = true`, nhưng vẫn cho phép tầm nhìn thông thường khi `false`.
    - Ngăn chặn cắt góc chéo xuyên qua 2 góc vách núi.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 8 - ĐÃ HOÀN THÀNH.

## Bước 8: Áp dụng quy tắc dốc vào bước di chuyển thực tế

- **Đã làm**:
  - `BehaviorTree.ts` (cư dân) & `AnimalMovement.ts` (động vật):
    - Tích hợp hệ số tốc độ theo dốc `getSlopeMoveFactor(tile.elevation, wpTile.elevation)`. Đi lên dốc chậm hơn rõ rệt so với đất bằng và xuống dốc.
    - Kỹ thuật Sub-stepping: khi `dt` lớn (tốc độ mô phỏng cao như 50x) làm bước nhảy vượt quá nửa kích thước ô `tileSize * 0.5`, chia nhỏ bước di chuyển thành các đoạn kiểm tra liên tục dọc theo vector hướng di chuyển. Kiểm tra tính hợp lệ và độ dốc của từng ô cắt qua, ngăn chặn hoàn toàn việc nhân vật/động vật nhảy cóc qua vách núi hay ô nước.
    - Kiểm tra dốc đường chéo qua `canTraverseDiagonalSlope` để chống lách góc vách núi trong thực tế.
    - Cơ chế tự động hủy đường đi và tính lại khi phát hiện vách cản trên đường (ví dụ do Thần Linh dùng cọ nâng vách núi khi thực thể đang di chuyển).
  - Thêm test regression trong `tests/elevation-regression.ts`:
    - Đo khoảng cách di chuyển thực tế: lên dốc (`+0.20`) di chuyển ngắn hơn đất bằng.
    - Bảo vệ bước nhảy lớn khi `dt = 3.0`: không xuyên qua vách núi cao `0.80`, giữ thực thể an toàn ở phía trước vách.
    - Cọ nâng đất tạo vách cắt ngang đường: phát hiện tức thì, hủy đường đi `path = []` và chuyển trạng thái `blocked`.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 9 - ĐÃ HOÀN THÀNH.

## Bước 9: Rà soát và bảo vệ Save/Load trong SaveManager.ts và SaveTypes.ts

- **Đã làm**:
  - Rà soát cấu trúc lưu trữ: Giữ nguyên tuple save 6 phần tử `[terrainIdx, elev100, moist100, temp, qi, variant]` và phiên bản save hiện hành `CURRENT_SAVE_VERSION = '2.0.0'`.
  - Trong `SaveManager.validateSaveData()`:
    - Bổ sung vòng lặp kiểm tra tính hợp lệ của toàn bộ ô bản đồ `worldMap.tiles`.
    - Kiểm tra cấu trúc tuple tối thiểu 6 phần tử.
    - Kiểm tra nghiêm ngặt `elev100` phải là số hữu hạn (`Number.isFinite`), không âm và không vượt quá 100 (`0 <= elev100 <= 100`).
    - Ném lỗi thông báo tiếng Việt chi tiết nếu gặp cao độ sai lệch, `NaN` hoặc số âm.
  - Trong `SaveManager.deserializeWorld()` (pha staging):
    - Đảm bảo kiểm tra `elev100` và tính hợp lệ `isValidElevation(elev100 / 100)` trước khi gán vào `stagedMapTiles`.
    - Cơ chế Staging Rollback bảo vệ thế giới đang chơi: nếu dữ liệu bản lưu bị lỗi/corrupt, quá trình nạp thất bại ngay trong pha staging mà không làm biến dạng hay thay đổi bất kỳ ô gạch hoặc thực thể nào của thế giới đang mở.
  - Thêm test regression trong `tests/elevation-regression.ts`:
    - Lưu và nạp bản đồ thành công, bảo toàn chính xác giá trị cao độ trên mọi ô trong giới hạn sai số `0.01`.
    - Từ chối bản lưu chứa `NaN` ở cao độ ô bản đồ.
    - Từ chối bản lưu chứa cao độ âm (`-10`).
    - Từ chối bản lưu chứa cao độ vượt ngưỡng (`120`).
    - Xác nhận thế giới đang chạy hoàn toàn nguyên vẹn sau khi ném lỗi bản lưu corrupt.
- **Lệnh kiểm tra**: `cmd /c npm test`, `cmd /c npm run build`.
- **Lỗi còn lại**: Không có.
- **Bước kế tiếp**: Bước 10 - ĐÃ HOÀN THÀNH.

## Bước 10: Hoàn thiện test, kiểm tra template thế giới, benchmark hiệu năng 360x360 và bàn giao

- **Đã làm**:
  - Kiểm tra tính hợp lệ của tất cả các template thế giới (`'random'`, `'thap_van_dai_son'`, `'dong_bang_trung_tho'`, `'ma_vuc_dam_lay'`, `'hai_dao_tien_son'`): toàn bộ ô đều có cao độ hợp lệ `isValidElevation`, nhiệt độ và độ ẩm hữu hạn.
  - Kiểm tra riêng hàm di chuyển trên bản đồ 360×360 (129.600 ô) với 300 động vật:
    - 1.500 lượt gọi `moveTowards` có kiểm tra độ dốc. Đây chỉ là phép đo vi mô, không đo toàn bộ AI, render hoặc một tick hoàn chỉnh.
  - Chạy toàn bộ 3 lệnh kiểm tra tổng thể dự án:
    - `cmd /c npm test`: PASS các bộ kiểm thử hiện có, bao gồm Elevation regression và Flora spawn.
    - `cmd /c npm run build`: Vite & TypeScript production build thành công 100% trong 3.36s.
    - `cmd /c npm run assets:check`: Chạy thành công mà không có lỗi tài nguyên.
  - Hoàn tất toàn bộ 10/10 bước của kế hoạch triển khai độ cao địa hình.
- **Lệnh kiểm tra**:
  - `cmd /c npm test`
  - `cmd /c npm run build`
  - `cmd /c npm run assets:check`
- **Lỗi còn lại**: Không có.
- **Kết luận**: Tính năng độ cao địa hình 2D đã sẵn sàng và tích hợp hoàn chỉnh vào trò chơi.

## Rà soát và sửa sau nghiệm thu

- Né đòn của cư dân nay kiểm tra cả công trình, mặt biển và độ dốc trên toàn đoạn lướt; gặp vật cản sẽ dừng né và bỏ đường cũ.
- `WeatherSystem` dùng cùng công thức nhiệt độ gốc theo cao độ với bản đồ, nên chênh lệch nhiệt giữa vùng thấp và vùng cao không mất dần sau nhiều tick.
- Cư dân và động vật tính hệ số tốc độ theo cạnh ô ngay trước mặt, thay vì so vị trí hiện tại với waypoint có thể ở xa nhiều ô.
- Cọ độ cao giữ hồ/biển trong miền nước và núi trên ngưỡng núi. Muốn chuyển chúng thành loại địa hình khác, dùng cọ địa hình.
- Thêm kiểm thử cho bốn trường hợp trên. Bài đo 300 động vật đã xác nhận 1.500/1.500 lượt gọi thực sự di chuyển trên ô đất hợp lệ. Đây là **microbenchmark của `moveTowards`**, không đại diện cho toàn bộ vòng lặp AI, renderer và game.
- Đã chạy lại `npm test`, `npm run build`, `npm run assets:check` sau khi sửa; tất cả đều đạt.




