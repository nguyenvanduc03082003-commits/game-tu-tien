# Kế hoạch bổ sung đặc điểm độ cao địa hình

> Tài liệu giao việc cho model triển khai. Phạm vi là bản đồ 2D có độ cao nhìn thấy được, chỉnh sửa được và ảnh hưởng hợp lý đến di chuyển. Chưa chuyển sang đồ họa 3D hoặc địa hình đẳng cự.

## 1. Hiện trạng đã kiểm tra

- `WorldTile.elevation` trong `src/modules/world/WorldMap.ts` đã tồn tại, là số tương đối trong `[0, 1]`.
- `WorldGenerator.ts` dùng độ cao để chọn biển/hồ/núi/đồi, tạo sông chảy xuống dốc, tính nhiệt độ và linh khí ban đầu.
- `SaveManager.ts` đã lưu độ cao thành số nguyên `Math.round(elevation * 100)` trong bộ sáu giá trị của từng ô, rồi khôi phục khi tải.
- `WorldRenderer.ts`, `Minimap.ts` và `InspectorPanel.ts` chưa thể hiện độ cao. Đường đi hiện tính chi phí theo `TerrainType`, chưa tính chênh lệch giữa hai ô.
- `WorldMap.setTerrain()` đổi loại địa hình nhưng giữ `elevation` cũ. Cọ có thể tạo núi thấp như hồ hoặc hồ cao như núi.
- A* có đường đi thẳng, tìm đường tám hướng, làm mượt đường và nhánh trả đường tạm khi hết ngân sách. Hệ động vật còn kiểm tra bước di chuyển thực tế. Tất cả nhánh này phải nhất quán nếu độ dốc ảnh hưởng đi lại.

## 2. Mục tiêu và ranh giới

1. Người chơi xem được độ cao tương đối `0–100%` của từng ô qua Inspector và lớp phủ “Độ cao”. Không gọi số này là mét.
2. Tab địa hình có công cụ nâng, hạ, làm mượt cao độ; cọ sửa một vùng với bán kính hiện có.
3. Tô lại loại địa hình không giữ độ cao vô lý. Độ cao mới được giới hạn `[0, 1]` và bản đồ được đánh dấu dirty.
4. Di chuyển trên dốc có chi phí và tốc độ tương ứng. Một cạnh quá dốc không đi được; đường A*, đường thẳng, làm mượt và bước thực tế cùng tuân thủ quy tắc.
5. Save hiện hành tiếp tục tải được; độ cao sau khi chỉnh vẫn lưu được. Dữ liệu cao độ lỗi bị từ chối trước khi thay thế thế giới đang mở.

Không làm trong đợt này: bản đồ 3D, sprite nhiều tầng, sát thương ngã, leo núi bằng kỹ năng tu luyện, thay đổi sinh cảnh của 40 loài, tự tạo thêm sông/hồ khi nâng hạ, hoặc viết lại toàn bộ thuật toán sinh thế giới.

**Nguyên tắc:** `terrain` là loại bề mặt/sinh cảnh, `elevation` là cao độ. Rừng có thể ở nhiều độ cao; sông có thể bắt nguồn trên núi. Không phân loại lại toàn bản đồ sau mỗi lần dùng cọ.

## 3. Quy tắc dữ liệu đề xuất

Tạo `src/modules/world/ElevationRules.ts` làm nguồn quy tắc duy nhất. Xuất các hàm thuần để dễ kiểm thử, ví dụ:

```ts
clampElevation(value: number): number
getElevationBand(value: number): 'lowland' | 'low' | 'middle' | 'high' | 'summit'
getSlope(fromElevation: number, toElevation: number): number
canTraverseSlope(fromElevation: number, toElevation: number): boolean
getSlopeMoveFactor(fromElevation: number, toElevation: number): number
getSlopePathCost(fromElevation: number, toElevation: number): number
reconcileElevationForTerrain(terrain: TerrainType, currentElevation: number): number
```

Điểm cân bằng ban đầu, có thể chỉnh sau kiểm thử: ngưỡng chặn chênh lệch hai ô kề nhau `0,20`; đi lên đắt/chậm hơn đi xuống. Chi phí không được âm, bằng 0 hoặc `NaN`. Với cùng một cạnh, A* và chuyển động thực phải dùng công thức tương thích. Bước chéo phải xét cả hai cạnh vuông góc để không lách qua vách.

Năm mức hiển thị nên có ranh giới rõ, ví dụ `<0,20`, `0,20–<0,40`, `0,40–<0,60`, `0,60–<0,80`, `≥0,80`. Các mức này **chỉ phục vụ hiển thị**, không được dùng để ghi đè `TerrainType`. Kiểm tra giá trị không hữu hạn ở ranh giới ghi dữ liệu và lúc nạp save; không lặng lẽ biến save lỗi thành độ cao hợp lệ.

Khi người chơi tô địa hình, chỉ sửa cao độ nếu nó nằm ngoài miền hợp lý của loại mới. Ví dụ biển/hồ phải thấp, núi phải cao. Không ép mọi ô rừng, sông hoặc đồng bằng vào một giá trị cố định. Quy tắc cọ áp dụng qua `WorldMap.setTerrain()`; quá trình sinh bản đồ của `WorldGenerator` có logic riêng và cần giữ dòng sông xuất phát từ vùng cao.

## 4. Trình tự triển khai bắt buộc

Mỗi bước phải biên dịch được trước khi chuyển bước tiếp theo. Sau mỗi bước cập nhật `docs/ELEVATION_IMPLEMENTATION_STATUS.md` với: đã làm, lệnh kiểm tra, lỗi còn lại, bước kế tiếp.

| Bước | Công việc | Điều kiện hoàn thành |
|---|---|---|
| 1 | Ghi `git status`, chạy `npm test`, `npm run build`, `npm run assets:check`. Tạo tài liệu trạng thái và lưu kết quả gốc. | Phân biệt được lỗi cũ và lỗi mới. |
| 2 | Tạo `ElevationRules.ts` với hàm thuần, hằng số cân bằng và test ranh giới. | Quy tắc độ cao nằm một chỗ; các hàm xử lý `0`, `1`, ngưỡng dốc và giá trị lỗi đúng. |
| 3 | Thêm `WorldMap.setElevation()` và `applyElevationBrush()` với ba chế độ `raise`, `lower`, `smooth`. Tăng/giảm khởi đầu `0,02` mỗi lần tác động. Làm mượt phải đọc từ ảnh chụp vùng cũ trước khi ghi để kết quả không phụ thuộc thứ tự duyệt. Đánh dấu dirty và phát sự kiện thay đổi khi thật sự có ô đổi. | Không sửa ngoài biên, không sinh `NaN`, cọ làm mượt tất định. |
| 4 | Sửa `WorldMap.setTerrain()` để hòa giải cao độ không hợp lý khi tô địa hình. Kiểm tra các phép ghi trực tiếp trong `WorldGenerator.ts`, đặc biệt hồ và sông; không áp dụng mù quáng quy tắc cọ vào thuật toán sinh sông. Nếu cần cập nhật nhiệt độ nền khi chỉnh độ cao, đặt công thức ở một nơi; không reset linh khí động trong `QiGrid`. | Tô núi lên hồ/hồ lên núi hợp lý; cùng seed vẫn tạo cùng bản đồ. |
| 5 | Thêm lớp phủ độ cao trong `QiOverlayRenderer.ts`, nút bật/tắt trong `TimeControls.ts`, dòng độ cao và tên mức trong `InspectorPanel.ts`. Ba lớp phủ độ cao, nhiệt độ, linh khí loại trừ nhau. Chỉ duyệt ô trong khung camera. | Người chơi thấy vùng cao/thấp và thông tin ô; sprite địa hình tùy chỉnh vẫn hiện bên dưới. |
| 6 | Thêm công cụ “Nâng đất”, “Hạ đất”, “Làm mượt” vào tab địa hình `GodToolbar.ts`; nối sự kiện chuột trong `Engine.ts`. Dùng bán kính cọ hiện tại; khi chọn cọ độ cao, hủy cọ đổi `TerrainType` và ngược lại. Hiển thị vòng cọ cho cả hai chế độ. | Không có hai loại cọ cùng hoạt động; chỉnh và xem cao độ trực tiếp được. |
| 7 | Tích hợp quy tắc dốc vào `AStar.ts`: kiểm tra từng cạnh mở rộng, chi phí cạnh, đường đi thẳng, đường tạm khi hết ngân sách, và làm mượt. Dùng một tùy chọn di chuyển rõ ràng; giữ hành vi mặc định của các caller cũ nếu chưa bật tính dốc. Không biến mọi lệnh kiểm tra tầm nhìn thành kiểm tra khả năng leo dốc. | Mọi đường trả về đều không xuyên vách dốc; A* không chọn lối tắt sai. |
| 8 | Áp dụng cùng quy tắc vào bước đi thực tế của cư dân và `AnimalMovement.ts`. Kiểm tra mọi ô một bước di chuyển cắt qua, kể cả khi `dt` lớn; không chỉ kiểm tra ô đích. Khi cọ tạo vách trên đường cũ, bỏ đường và tính lại. | Cư dân và động vật đi lên dốc chậm hơn, không vượt dốc bị chặn ở tốc độ mô phỏng cao. |
| 9 | Rà `SaveManager.ts` và `SaveTypes.ts`. Giữ tuple save sáu phần tử và phiên bản hiện có vì `elevation` đã tồn tại. Trong pha staging, kiểm tra cao độ của mọi ô hữu hạn và thuộc `[0, 1]` trước khi commit thế giới. Xét sai số lưu `0,01`. | Save cũ hợp lệ tải được; save lỗi không làm thay đổi thế giới đang chơi. |
| 10 | Hoàn thiện test, kiểm tra trực tiếp các template, kiểm tra hiệu năng bản đồ 360×360 và 300 động vật. Chạy lại ba lệnh kiểm tra tổng; ghi kết quả bàn giao. | Không hồi quy AI, động vật, minimap, save hoặc tạo thế giới. |

## 5. Kiểm thử cần đăng ký vào runner

Tạo `tests/elevation-regression.ts` và đăng ký trong `tests/run.mjs` để `npm test` thực sự chạy. Các ca tối thiểu:

- Cùng seed cho cùng cao độ; cọ `smooth` không phụ thuộc thứ tự duyệt.
- `setElevation` và các cọ xử lý biên bản đồ, `0`, `1`, giá trị không hữu hạn.
- Tô núi lên hồ, hồ lên núi và tô rừng lên vùng cao; rừng không tự biến thành núi. Sông sinh từ núi vẫn có cao độ theo dòng chảy.
- A* đi vòng vách khi có đường; báo không có đường khi bị bao kín. Fast path, fallback khi hết ngân sách và smoothing không vượt vách. Đường chéo không lách qua góc bị chặn.
- Cư dân và động vật không vượt vách khi `dt` lớn; đường cũ bị vô hiệu sau khi chỉnh cao độ; tốc độ lên dốc thấp hơn trên đất bằng.
- Save/load giữ độ cao trong sai số `0,01`; save với `NaN`, số âm, `>1` bị từ chối trước khi thay thế thế giới.
- Lớp phủ chỉ vẽ vùng nhìn thấy; các nút lớp phủ loại trừ nhau; Inspector thể hiện đúng độ cao đã lưu.

Kiểm tra trực tiếp: tạo thế giới theo nhiều template, bật lớp phủ, nâng một dãy núi, hạ một thung lũng, dùng cọ làm mượt, quan sát cư dân/động vật tìm đường, lưu/tải rồi xem lại. Với 300 động vật, không quét toàn bộ 360×360 ô trong mỗi lần vẽ khung hình; chỉ duyệt ô trong camera và chỉ cập nhật minimap khi map dirty.

## 6. Chỉ dẫn cho model triển khai

- Trước khi đổi chữ ký `AStarPathfinder.findPath`, `hasLineOfSight`, `smoothPath` hoặc `WorldMap.setTerrain`, tìm mọi caller trong `src`, `tests`, `scripts`.
- Không thêm quy tắc dốc riêng cho từng loài trong đợt này. Động vật dùng cùng luật di chuyển mặt đất; khác biệt loài vẫn nằm ở tốc độ sẵn có.
- Không đặt độ cao giả vào `PositionComponent` của thực thể. `elevation` là dữ liệu ô bản đồ; nhân vật vẫn dùng tọa độ pixel 2D.
- Không sửa trực tiếp `dist`, `node_modules`, không thêm thư viện và không bỏ assertion để làm test xanh.
- Không tăng phiên bản save chỉ vì thay đổi cách dùng trường `elevation` đã có. Nếu thật sự phải đổi schema, dừng để ghi rõ lý do và cách tương thích trước khi tiếp tục.
- Không đánh đồng dốc chặn chuyển động với vật cản tầm nhìn/đạn đạo. Các hệ đó chỉ thay đổi nếu có yêu cầu thiết kế riêng.
- Hoàn thành khi cao độ có thể xem, chỉnh, lưu/tải và ảnh hưởng đến di chuyển một cách nhất quán; toàn bộ test, build và assets check đạt.
