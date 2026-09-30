# Rà soát hệ sinh thái, tiến cấp và hành vi cư dân

Ngày rà soát: 27-09-2026. Phạm vi: đọc luồng chạy thực tế trong `src/`; chưa sửa gameplay trong đợt này.

## Kết luận ngắn

Các yêu cầu đều có cơ sở. Đáng ưu tiên nhất là: bỏ sinh yêu tộc mặc định, sửa vòng đời cây quả, thống nhất luồng xây dựng có thợ, và áp giới hạn người ở theo từng nhà. Hệ động vật và AI ba tầng hiện có nền tảng sử dụng được, nhưng cần kiểm thử tích hợp dài ngày thay vì chỉ dựa vào test từng hệ thống.

## Phát hiện theo yêu cầu

### 1. Thế giới mới có yêu tộc

**Đã xác nhận.** `Engine.initNewWorld()` sinh 4 yêu tộc gần giữa bản đồ và gọi `BeingFactory.generateInitialFauna()` cho thêm yêu tộc (Engine khoảng dòng 907–914). Tên `generateInitialFauna` dễ gây nhầm: hàm này tạo `yao_common`/`yao_cultivator`, không tạo `AnimalComponent` (BeingFactory khoảng dòng 436–465). Sau đó game mới sinh 15 động vật thật thuộc 5 loài cố định trong `INITIAL_WORLD_ANIMALS` (`animal.simulation.ts`, dòng 30–38). Vị trí có ngẫu nhiên theo seed, nhưng tập loài và số lượng của từng loài là cố định.

**Hướng sửa:** bỏ hai luồng sinh yêu tộc trong khởi tạo thế giới; giữ danh mục/archetype yêu tộc cho công cụ chủ động hoặc cơ chế phát sinh về sau. Dùng `AnimalSpawnService.populate()` với RNG theo seed, pool loài theo sinh cảnh, hạn mức tổng và hạn mức loài, tỷ lệ thú ăn cỏ/thú săn mồi có kiểm soát. Giữ 12 người khởi đầu vì yêu cầu ở đây nói về quần thể hoang dã. Test thế giới mới phải có `RaceComponent(beast) = 0`, số `AnimalComponent` nằm trong khoảng định trước, tọa độ hợp địa hình và cùng seed cho cùng kết quả.

### 2. Cây gỗ/cây quả và việc hái quả

**Một phần đã có, nhưng vòng đời bị hở.** `PlantFactory.generateInitialFlora()` rải sồi/tùng/liễu, bụi quả và nấm bằng RNG theo seed và địa hình (PlantFactory khoảng dòng 59–135). Tuy vậy, danh sách loài theo từng địa hình được viết cứng; `naturalSpawnWeight` trong catalog chưa thực sự điều khiển chọn loài. Bộ đếm `floraCount` chỉ tăng ở nhánh rừng rậm/thần dược, nên `maxFlora` không giới hạn đúng các cây sinh ở đồng bằng, núi, đầm lầy và cao nguyên. Engine còn đặt thêm 4 cây cố định gần trung tâm (khoảng dòng 879–887).

**Lỗi logic đã xác nhận:** hành vi hái đặt `hasFruit = false` (`BehaviorTree.ts`, khoảng dòng 916), nhưng `PlantGrowthSystem` chỉ đặt lại `hasFruit = true` trong nhánh `growthProgress < 1`. Cây đã trưởng thành có `growthProgress = 1`, nên sau lượt hái đầu sẽ không ra quả nữa. Ngoài ra `growthStep = stepTime / (growthDurationDays * 1.5)` dùng giây mô phỏng, còn một ngày game hiện dài 5 giây; chu kỳ thực tế không khớp `growthDurationDays` (`PlantGrowthSystem.ts`, khoảng dòng 78–90). Kho gỗ lại tự tăng theo số dân (`FactionSystem.ts`, khoảng dòng 868–875), chưa liên hệ với cây bị chặt.

**Hướng sửa:** chọn loài bằng `preferredTerrain` + `naturalSpawnWeight`, dùng một ngân sách cây cho mọi nhánh địa hình và RNG theo seed. Thêm trạng thái/cooldown tái ra quả theo ngày game; gắn năng suất và tốc độ tái sinh riêng cho bụi quả/nấm/cây ăn quả. Nếu muốn có **cây ăn quả thân gỗ**, bổ sung loài rõ ràng thay vì gọi bụi quả là cây gỗ. Thêm công việc đốn gỗ: AI chọn cây còn gỗ, đi tới, khai thác có thời gian, giảm tài nguyên trên cây, tăng gỗ kho đúng một lần; cây non/chưa đủ tuổi không cho gỗ. Bỏ hoặc hạ phần gỗ tự sinh theo dân số sau khi luồng đốn gỗ hoạt động.

### 3. Yêu tộc và các chủng tộc tiến cấp quá nhanh

**Có cơ sở từ công thức hiện tại.** Tiểu cảnh giới bắt đầu ở tỷ lệ 70%, cộng ngộ tính, đặc điểm, công pháp, đan và trưởng thành rồi chặn tối đa 95% (`CultivationSystem.ts`, khoảng dòng 247–289). Khi Qi đầy, hệ thống tự thử ngay (khoảng dòng 212–218). Đại cảnh giới không yêu cầu lôi kiếp được hoàn tất thẳng, không có xác suất thất bại (khoảng dòng 389–397). Chuỗi yêu tộc chỉ yêu cầu lôi kiếp từ Hóa Hình, chuỗi ma tộc chỉ ở Ma Vương (`realms.config.ts`, khoảng dòng 72–145). Lôi kiếp mất 15% máu tối đa mỗi tia trước giảm trừ (`TribulationSystem.ts`, khoảng dòng 119–133). Vì vậy cảm giác tiến cấp dễ, nhất là giai đoạn đầu, là hợp lý; chưa có số liệu chơi dài ngày để ấn định tỷ lệ mới.

**Hướng sửa:** tách cấu hình độ khó theo chủng tộc và bậc, dùng hàm chung tính `baseChance`, `qiRequirement`, `retryCooldownDays`, tổn thất khi thất bại; giới hạn tổng bonus và hiển thị xác suất thực tế ở UI. Đại cảnh giới không có lôi kiếp vẫn cần thử đột phá với xác suất/điều kiện riêng. Yêu tộc nên cần thời gian tích lũy huyết mạch và ngưỡng Qi cao hơn; ma tộc có thể mạnh nhanh nhưng chịu rủi ro phản phệ. Chốt mục tiêu định lượng trước khi chỉnh: ví dụ tỷ lệ đạt từng cảnh giới sau 1/5/20 năm game cho ba chủng tộc, rồi chạy mô phỏng nhiều seed để cân bằng. Không đổi số 70% thành một số thấp tùy ý vì bonus hiện có thể bù gần hết.

### 4. Rương kho báu hiếm trên bản đồ

**Chưa có cơ chế rương.** Có `DroppedLootComponent` dùng cho di vật sau khi xác phân rã, Inspector chỉ hiển thị; không thấy luồng nhặt di vật/rương và chuyển đồ vào túi nhân vật (`CorpseAndGraveSystem.ts`, `InspectorPanel.ts`, `BehaviorTree.ts`).

**Hướng sửa:** thêm `TreasureChestComponent` độc lập (ID, trạng thái chưa mở/đã mở, danh sách item ID + số lượng, vị trí, seed nguồn). Sinh ít theo diện tích đất có thể đi tới, ví dụ 4–8 rương trên bản đồ 360×360, tránh nước/công trình/vùng sinh người và không chồng rương. Dùng bảng loot có trọng số, đa số là ít vật phẩm phổ thông; món quý có xác suất thấp và trần số lượng. Tương tác mở rương cần khoảng cách, chuyển item một lần bằng một service chung cho UI/AI, cập nhật Inventory và save/load; rương đã mở không sinh lại quà. Test xác định cùng seed, số lượng/ràng buộc vị trí, mở hai lần không nhân đồ, đầy túi và save/load.

### 5. Công trình phải có người xây

**Chưa thống nhất.** Công trình do `CommunityTaskBoard.createTask()` tạo thường có `ConstructionSiteComponent` và thợ làm tăng `completedWorkTicks`. Nhưng `FactionFactory.spawnBuilding()` mặc định tạo công trình hoàn tất ngay (`FactionFactory.ts`, khoảng dòng 375–452); công cụ đặt công trình trong Engine gọi API mặc định này (Engine khoảng dòng 494, 539). Riêng task sáng lập lửa trại/đại điện bị loại khỏi luồng tạo site (`CommunityTaskBoard.ts`, khoảng dòng 638–651) và khi task xong có nhánh `instant: true` (khoảng dòng 952–1050). `MortalAISystem` chứa thêm một luồng xây dựng nhưng không được đăng ký trong Engine; hành vi đang chạy là `ThreeTierAISystem` + `CommunityTaskBoard`.

**Hướng sửa:** biến `startConstruction` + task thợ + giữ vật tư thành đường duy nhất cho công trình thường. Việc sáng lập cũng tạo site, yêu cầu ít nhất một thợ sống, ở gần và thực sự đóng góp tick; không hoàn tất chỉ vì hết `duration`. Công cụ Thượng Đế cần được định nghĩa rõ: nếu người chơi chọn "xây" thì đặt công trường; nếu còn quyền tạo tức thì, đó phải là hành động riêng có nhãn rõ. Tháo/dọn mã `MortalAISystem` không còn chạy sau khi đảm bảo không mất hành vi cần thiết. Test: không có thợ -> tiến độ đứng yên; thợ chết/rời đi -> dừng và có thể giao người khác; save/load giữa chừng; vật tư đặt cọc/hoàn trả đúng một lần.

### 6. Giới hạn số người trong một nhà

**Chưa được cưỡng chế ở mức cư trú.** `thatched_hut.housingCapacity = 3`, `SmartObjectManager` có 3 slot nghỉ (config và SmartObjectManager), nhưng `FactionFactory.assignResidence()` chấp nhận `homeBuildingEntityId` mà không đếm người đang ở trong nhà và không từ chối khi đầy (FactionFactory khoảng dòng 737–803). AI ngủ chọn slot trống bất kỳ, hoặc vẫn tạo bước ngủ khi không tìm được chỗ (`AIPlanner.ts`, khoảng dòng 416–428). `SettlementComponent.housingCapacity` chỉ là tổng thống kê, không phải giới hạn cho từng nhà.

**Hướng sửa:** dùng `housingCapacity` của định nghĩa công trình làm nguồn duy nhất; API `assignHome` chọn nhà cùng settlement còn chỗ, không phải phế tích/công trường, rồi gán `ResidenceComponent.homeBuildingEntityId`. Khi nhà hỏng/bị phá/dân chết/chuyển đi, giải phóng chỗ và phân nhà lại; thiếu nhà thì cư dân ở trạng thái không có nhà với ảnh hưởng sinh tồn rõ ràng. AI ngủ ưu tiên nhà được gán; slot dùng cho tương tác tạm thời, không thay thế quyền cư trú. Lưu/nạp kiểm tra và sửa liên kết nhà không hợp lệ. Test 3/3 người nhận nhà, người thứ 4 không vào, chuyển người/đập nhà/nạp lại đều nhất quán.

### 7. Hành vi cư dân, yêu tộc và động vật

`ThreeTierAISystem` đang chạy cho nhân/yêu/ma với mục tiêu sinh tồn, tu luyện và lao động; động vật thường có `AnimalAISystem`, `AnimalMovementSystem`, `AnimalLifecycleSystem` và `AnimalReproductionSystem` riêng. Đây là phân tách đúng hướng. Các test động vật hiện kiểm tra đi lại, ăn, săn, sinh sản và tử vong, nhưng chưa kiểm tra hệ sinh thái sau nhiều năm game cùng với cây quả, nguồn gỗ và nhà ở.

Các điểm cần rà khi sửa: AI thu hái có thể nhiều cư dân cùng nhắm một cây quả; hành động thu hái hiện trả thành công cả khi quả đã bị người khác hái. AI nghỉ vẫn có thể ngủ khi không có slot. Công việc xây cần xác nhận đường đi, thuộc đúng thế lực, thợ còn sống và tính tiến độ đúng một lần. Sau khi bỏ yêu tộc ban đầu, các nhánh AI dành cho yêu tộc phải vẫn hoạt động khi người chơi tạo thủ công hoặc khi thêm cơ chế hóa yêu sau này. Không khôi phục `MortalAISystem` song song với ba tầng vì sẽ có hai bộ AI điều khiển một cư dân.

## Thứ tự triển khai đề xuất

1. **Khởi tạo thế giới:** bỏ yêu tộc mặc định; gieo động vật theo sinh cảnh và seed; sửa test sinh thế giới.
2. **Cây và tài nguyên:** sửa giới hạn rải cây, đơn vị ngày và tái ra quả; thêm cây ăn quả nếu cần, công việc đốn gỗ và cơ chế gỗ vào kho.
3. **Xây dựng và nhà:** thống nhất site + thợ cho mọi công trình thường; áp sức chứa từng nhà và tái phân nhà.
4. **Tiến cấp:** gom công thức theo chủng tộc/bậc, mô phỏng nhiều seed rồi cân bằng theo mục tiêu định lượng.
5. **Rương kho báu:** entity riêng, loot có trọng số, mở một lần, save/load và UI.
6. **Kiểm thử tích hợp:** chạy nhiều seed và mốc thời gian ở 0.5×/1×/5×; kiểm tra quần thể, tử vong, thu hoạch, xây dựng, sức chứa, tiến cấp và hiệu năng. Chạy `npm test`, `npm run build`, `npm run assets:check` sau từng bước.

## Quyết định thiết kế cần giữ nhất quán

- "Không có yêu tộc khi tạo thế giới" chỉ áp dụng lúc khởi tạo; các bản lưu cũ có yêu tộc vẫn phải nạp bình thường.
- Ngẫu nhiên phải theo seed: cùng seed/template/kích thước cho cùng hệ sinh thái và rương ban đầu.
- Nhà đầy là quy tắc cư trú; slot ngủ là quy tắc tương tác tạm thời. Hai con số phải lấy từ cùng cấu hình nhưng không thay thế cho nhau.
- Đồ trong rương và vật tư xây dựng là tài nguyên hữu hạn: thao tác thất bại không được tạo hoặc mất đồ.
