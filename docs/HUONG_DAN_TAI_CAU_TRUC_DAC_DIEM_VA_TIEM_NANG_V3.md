# Hướng dẫn triển khai V3: đặc điểm cư dân, tiềm năng, ý chí và tâm cảnh

> Dự án: `game_tu_tien` — TypeScript, ECS, Vite, Canvas 2D.
>
> Ngày lập: 25/09/2026. Đây là **đặc tả để triển khai**, không phải báo cáo tính năng đã hoàn thành.
>
> Đối tượng sử dụng: mô hình lập trình nhận từng công việc nhỏ, cần hợp đồng dữ liệu, công thức và điều kiện nghiệm thu cụ thể.
>
> Nguồn nội dung: `he_thong_300_dac_diem_va_danh_gia_thien_phu_V2.md` do chủ dự án cung cấp. Danh mục nguồn được đính kèm ở cuối tài liệu. Những quy tắc V3 dưới đây được ưu tiên khi khác V2.

**Cách dùng:** giao mô hình làm A00 trước, rồi lần lượt A01–A14 ở mục 16. Mỗi lượt dùng mẫu yêu cầu ở mục 19 và báo cáo kết quả theo mục 18.2. Các đoạn TypeScript là hợp đồng cần triển khai; dữ liệu 300 đặc điểm và 142 trường hiệu ứng nằm ngay trong phụ lục, không phụ thuộc việc máy triển khai có thư mục Downloads của tác giả.

## Mục lục

1. [Mục tiêu và quyết định đã chốt](#1-mục-tiêu-và-quyết-định-đã-chốt)
2. [Hiện trạng mã nguồn và phạm vi](#2-hiện-trạng-mã-nguồn-và-phạm-vi)
3. [Khái niệm và đơn vị](#3-khái-niệm-và-đơn-vị)
4. [Phân loại đặc điểm](#4-phân-loại-đặc-điểm)
5. [Hợp đồng dữ liệu](#5-hợp-đồng-dữ-liệu)
6. [Công thức tiềm năng](#6-công-thức-tiềm-năng)
7. [Sinh nhân vật và thức tỉnh](#7-sinh-nhân-vật-và-thức-tỉnh)
8. [Quản lý đặc điểm, xung đột và tiến hóa](#8-quản-lý-đặc-điểm-xung-đột-và-tiến-hóa)
9. [Hiệu ứng gameplay và chống tính trùng](#9-hiệu-ứng-gameplay-và-chống-tính-trùng)
10. [Rèn luyện ý chí và tâm cảnh](#10-rèn-luyện-ý-chí-và-tâm-cảnh)
11. [Trạng thái tinh thần và trải nghiệm](#11-trạng-thái-tinh-thần-và-trải-nghiệm)
12. [Nối vào AI, tu luyện và chiến đấu](#12-nối-vào-ai-tu-luyện-và-chiến-đấu)
13. [Giao diện và hiển thị tên](#13-giao-diện-và-hiển-thị-tên)
14. [Lưu, nạp và di trú dữ liệu](#14-lưu-nạp-và-di-trú-dữ-liệu)
15. [Danh sách file cần tạo và sửa](#15-danh-sách-file-cần-tạo-và-sửa)
16. [Các gói công việc để giao mô hình](#16-các-gói-công-việc-để-giao-mô-hình)
17. [Ma trận kiểm thử và cân bằng](#17-ma-trận-kiểm-thử-và-cân-bằng)
18. [Tiêu chí hoàn thành và mẫu bàn giao](#18-tiêu-chí-hoàn-thành-và-mẫu-bàn-giao)
19. [Mẫu yêu cầu giao cho mô hình triển khai](#19-mẫu-yêu-cầu-giao-cho-mô-hình-triển-khai)
20. [Phụ lục A — Danh mục 300 đặc điểm để nhập dữ liệu](#phụ-lục-a--danh-mục-300-đặc-điểm-để-nhập-dữ-liệu)
21. [Phụ lục B — Quyết định xử lý từng trường hiệu ứng nguồn](#phụ-lục-b--quyết-định-xử-lý-từng-trường-hiệu-ứng-nguồn)
22. [Phụ lục C — Đối chiếu catalog repository](#phụ-lục-c--đối-chiếu-catalog-repository)

## 1. Mục tiêu và quyết định đã chốt

### 1.1. Yêu cầu bắt buộc từ chủ dự án

- Cư dân có ngộ tính, tư chất và thể chất khi sinh ra; các đặc điểm phải đóng góp vào những thuộc tính phù hợp.
- Đặc điểm có nhóm dùng chung và nhóm riêng của Nhân, Yêu, Ma; tất cả dùng bậc 1–5.
- Ý chí và tâm cảnh phát triển thông qua hành động, trải nghiệm và thời gian rèn luyện.
- Tiềm năng tổng hợp tính theo **55% bẩm sinh + 45% trưởng thành**:

Chủ dự án đã chốt Ngộ tính 30%, Tư chất 15%, Thể chất 10% và tổng phần trưởng thành 45%. **Cách chia phần trưởng thành thành Ý chí 25% + Tâm cảnh 20% là đề xuất của hướng dẫn này**, vì yêu cầu chưa chốt riêng hai tỷ lệ đó. Dùng cách chia này làm mốc triển khai đầu tiên; không trình bày nó như một quyết định đã được chủ dự án xác nhận.

```text
P = 0.30 * comprehension
  + 0.15 * aptitude
  + 0.10 * physique
  + 0.25 * willpower
  + 0.20 * mindset
```

- Cả năm thành phần đều ở thang 0–100 trước khi nhân trọng số. Tổng cũng ở thang 0–100.
- Tên trên bản đồ ưu tiên người có tu vi từ Trúc Cơ tương đương hoặc tiềm năng cao; không khôi phục việc hiện tên mọi cư dân.

### 1.2. Các quyết định kỹ thuật của đặc tả này

Các con số về XP, xác suất, tốc độ hồi phục, màu sắc, giới hạn nhãn, ngưỡng 80 và cách chia Ý chí 25% / Tâm cảnh 20% bên dưới là **giá trị cân bằng đề xuất cho lần triển khai đầu**, không phải mọi con số đều đã được chủ dự án trực tiếp yêu cầu. Khi code lần đầu, dùng đúng để có một mốc kiểm thử; hiệu chỉnh sau bằng dữ liệu mô phỏng. Các trọng số bẩm sinh 30/15/10 và tổng trưởng thành 45% vẫn là yêu cầu cố định.

1. Dùng năm thành phần ở trên làm điểm tiềm năng chính; không dùng công thức sắp xếp sáu trục của V2 để thay thế.
2. Giữ ý tưởng sở trường của V2 cho giai đoạn bổ sung AI; sở trường, khí vận và sức chiến đấu không được cộng thành thành phần thứ sáu của P.
3. Tách `mindset` = tâm cảnh trưởng thành khỏi `mentalState` = trạng thái tinh thần hiện tại.
4. Không dùng logistic cho điểm chính. Điểm 80 luôn có cùng ý nghĩa; UI chỉ làm tròn để hiển thị.
5. Bậc đặc điểm biểu thị độ hiếm/ngân sách cơ chế. Không dùng `tier * 20` để tính tiềm năng.
6. Bản lưu phải giữ được thiên phú của người đã sinh. Load lại, đổi tuổi hoặc đổi mức zoom không được bốc lại đặc điểm.
7. Không tính tiềm năng từ ATK/HP hiện tại, cảnh giới, trang bị, vị trí linh khí hay đan dược tăng sức mạnh tạm thời.
8. Không tự cộng XP theo tuổi. Cư dân không hoạt động thì chỉ già đi, không tự đạt ý chí/tâm cảnh 100.
9. Không tăng ý chí/tâm cảnh trực tiếp vì đói, mất máu hoặc giết mục tiêu yếu.
10. Mã giao diện chỉ đọc điểm; không được làm thay đổi điểm, phát thưởng hay bốc ngẫu nhiên.

### 1.3. Kết quả phải nhìn thấy sau khi hoàn thành lõi

- Click một cư dân: thấy ba chỉ số bẩm sinh, hai chỉ số trưởng thành, tổng tiềm năng, trạng thái tinh thần riêng và lý do tăng điểm gần nhất.
- Trẻ sinh mới giữ ổn định dữ liệu bẩm sinh khi lớn lên; thức tỉnh linh căn chỉ công bố kết quả đã có.
- Nhân vật rèn luyện hợp lệ tăng XP; khi làm lại tác vụ lỗi/đứng kẹt không được thưởng.
- Mỗi đặc điểm hiện đúng bậc, nguồn gốc, điều kiện chủng tộc, tác dụng đã hoạt động.
- Save/load giữa một trải nghiệm đang xử lý tiếp tục đúng tiến độ; không nhận thưởng lần hai.

## 2. Hiện trạng mã nguồn và phạm vi

### 2.1. Những điểm đã đối chiếu với repository

| Hiện trạng | Hệ quả khi triển khai |
|---|---|
| `src/config/traits.config.ts` có 105 định nghĩa, `TraitTier` mới là 1–4 | Không giả định có sẵn 200 trait như bản V2 |
| `TraitsComponent` có ba mảng `innateTraits`, `techniqueTraits`, `trainingTraits` | Cần API thống nhất, tránh đổi một mảng mà hệ khác vẫn đọc mảng cũ |
| `ComprehensionComponent.current` dùng thang 0–100000 | Có adapter 1000 đơn vị cũ = 1 điểm chuẩn; không chia nhầm 100 |
| `BeingFactory.spawnFromArchetype` đang bốc trait và nhân modifier ngay khi tạo | Cần chuyển về generator và evaluator tập trung |
| `SpiritualRootSystem.awakenSpiritualRoot` đang bốc lại linh căn lúc 12 tuổi | Cần lưu kết quả tiềm ẩn khi sinh, thức tỉnh không roll lại |
| `createNewborn` đang gọi `spawnFromArchetype`, rồi mới gắn cha mẹ | Phải truyền thông tin cha mẹ vào generator trước khi bốc huyết mạch |
| AI đang chạy là `ThreeTierAISystem` + `StrategicGoal` + `AIPlanner` + `BehaviorTree` | Không nối cơ chế mới chỉ vào `MortalAISystem` đã deprecated |
| Tệp component AI là `src/modules/ai/brain/AIComponents.ts` | Không tạo nhầm đường dẫn `brain/components/AIPlannerComponent.ts` |
| `TimeManager`: 20 tick/ngày, 360 ngày/năm; 1 giây mô phỏng = 1 ngày hiện tại | Cooldown mới phải ghi rõ ngày/tick, không dùng giây thực |
| `EventBus` singleton gọi callback ngay trong `emit` | Dùng hàng đợi theo world để tránh mutation lồng nhau và thưởng chéo world |
| SaveManager phục hồi vào `stagingWorld`, sau đó thay thế dữ liệu world đang chơi | Migration phải chạy trong staging, không phát sự kiện gameplay |
| `MemoryComponent` chỉ giữ tối đa 40 ký ức và dùng `Date.now()` cho ID | Không dùng toàn bộ danh sách ký ức này làm sổ XP hay khóa chống thưởng trùng |
| `AlchemySystem` chủ yếu tự dùng đan/hồi sinh; `BuildingSystem` tự sản xuất đan vào kho thế lực mà chưa chỉ rõ người làm | Không gán XP luyện đan cho một cư dân tùy ý đứng gần; cần job có người phụ trách trước khi nối nghề này |
| `EntityRenderer.shouldShowCharacterMapLabel` dùng Trúc Cơ, Thiên Linh Căn hoặc hai trait bậc Thiên | Thay nhánh xét thiên phú bằng điểm P sau khi lõi sẵn sàng |

### 2.2. Phạm vi phát hành

**Mốc Lõi bắt buộc:** schema, danh mục có xác thực, năm điểm, sinh/thức tỉnh, XP, trạng thái tinh thần, trait service, các hiệu ứng nền đang có game, UI, migration, kiểm thử.

**Mốc Mở rộng:** hồi sinh Phượng Hoàng, đoạt xá, pháp tắc thời gian/không gian, đội hình quân đoàn, ngành nghề chưa có hệ thống, kiểm định thiên phú sai số và AI chọn sáu con đường. Chúng cần hệ gameplay thật, không chỉ vài trường số trong config.

Toàn bộ 300 ID phải nhập và kiểm tra được ở mốc Lõi, nhưng trait có cơ chế chưa triển khai phải có `implementation: 'planned'`, bị loại khỏi pool sinh mới. Không ghi “đã hỗ trợ 300 trait đầy đủ” nếu còn planned. Bàn giao phải báo số active/planned/legacyOnly cùng các phụ thuộc còn thiếu.

Không tự phát triển toàn bộ hệ đoạt xá, chiến tranh quân đoàn, thú cưỡi hoặc pháp tắc trong cùng gói lõi. Đó là đầu việc riêng, có tiêu chí nghiệm thu riêng.

## 3. Khái niệm và đơn vị

| Tên code | Tên UI | Miền | Nguồn dữ liệu |
|---|---|---:|---|
| `comprehension` | Ngộ tính | 0–100 | Nền khi sinh + đóng góp đặc điểm bẩm sinh + cải biến căn cơ vĩnh viễn |
| `aptitude` | Tư chất | 0–100 | Linh căn/căn cơ + đóng góp phù hợp, không lấy từ lượng Qi đang có |
| `physique` | Thể chất | 0–100 | Căn cốt bẩm sinh + huyết mạch + cải biến vĩnh viễn |
| `willpower` | Ý chí | 0–100 | Suy ra từ `willpowerXp` đã kiếm được |
| `mindset` | Tâm cảnh | 0–100 | Suy ra từ `mindsetXp` đã kiếm được |
| `mentalState` | Trạng thái tinh thần | −100..100 | Biến động cảm xúc, áp lực ký ức, hồi phục |
| `potential` | Tiềm năng | 0–100 | Công thức năm trọng số bắt buộc |
| `innateContribution` | Nền tảng bẩm sinh | 0–55 | 0.30C + 0.15A + 0.10B |
| `growthContribution` | Thành quả rèn luyện | 0–45 | 0.25W + 0.20M |
| `fortune` | Khí vận | Quy định riêng của hệ sự kiện | Không tham gia P |

Quy ước số:

- Xác suất lưu 0–1; `+20%` xác suất tuyệt đối trong bảng nguồn = cộng `0.20`, không phải `20`.
- `x1.25` = hệ số nhân 1.25; `+25` giáp = cộng 25 đơn vị.
- XP là số thực không âm; không làm tròn XP sau từng tick.
- Ngày mô phỏng = `TimeManager.getDate().totalDays`; cần phần lẻ thì dùng `totalTicks / TICKS_PER_DAY`.
- `cooldownDays`, `halfLifeDays`, `durationTicks` phải có hậu tố đơn vị trong tên trường.
- Giá trị `NaN`, `Infinity`, `-Infinity` là dữ liệu không hợp lệ; không cho lọt vào cache, save hoặc UI.
- 0 là giá trị hợp lệ. Dùng `??`, không dùng `||` để thay mặc định cho điểm, XP hay entity ID.

## 4. Phân loại đặc điểm

### 4.1. Bốn chiều phân loại độc lập

Mỗi trait có đồng thời:

1. **Phạm vi chủng tộc:** chung, Nhân, Yêu, Ma hoặc danh sách chủng tộc cụ thể.
2. **Nguồn:** bẩm sinh, hậu thiên, huyết mạch, chuyển thế.
3. **Lĩnh vực:** thể chất, căn cơ, tâm tính, chiến đấu, nghề nghiệp, xã hội, sinh tồn.
4. **Bậc:** 1–5.

Ví dụ: Long Huyết Bá Thể = Yêu / huyết mạch / thể chất / bậc 4. Kiên Nhẫn Bền Bỉ = chung / bẩm sinh về khuynh hướng / tâm tính / bậc 2; trait này hỗ trợ tốc độ rèn ý chí, không tặng hàng chục điểm ý chí trưởng thành.

### 4.2. Bậc hiển thị và chi phí

| Bậc | Tên | Màu | Chi phí chuẩn | Vai trò |
|---:|---|---|---:|---|
| 1 | Phàm phẩm | `#94a3b8` | 3 | Khác biệt nhỏ, thói quen, bất lợi hoặc đánh đổi |
| 2 | Linh phẩm | `#34d399` | 8 | Ưu thế rõ trong một mặt |
| 3 | Địa phẩm | `#a78bfa` | 18 | Chuyên hóa mạnh hoặc kinh nghiệm hiếm |
| 4 | Thiên phẩm | `#fbbf24` | 35 | Thiên phú/huyết mạch xuất chúng |
| 5 | Tiên phẩm | `#fb7185` | 60 | Cơ chế hiếm thay đổi cách chơi |

Bậc không phải cấp độ tu luyện, không phải đạo đức tốt/xấu. Một trait bất lợi vẫn có thể hiếm. Không bắt buộc mọi trait phải có đủ năm phiên bản nâng cấp.

### 4.3. Chung và riêng theo chủng tộc

- Chung: ngộ tính, nghị lực, tính cách, đa số khả năng sinh tồn và nghề học được.
- Riêng Nhân: Nhân Hoàng Huyết Mạch, những đạo thể có truyền thuyết rõ là Nhân tộc.
- Riêng Yêu: huyết mạch/đặc trưng sinh học Yêu tộc; cần kiểm tra thêm dòng dõi hoặc hình thể.
- Riêng Ma: ma căn, ma thể và huyết mạch Ma tộc. Không đánh đồng “Ma tộc” với “mọi người tu công pháp ma”.

**Điều chỉnh V2:** chuyển cả 21 trait `profession` đang đặt trong nhóm Nhân sang nhóm chung. Trait hậu thiên nghề nghiệp yêu cầu đã khai trí, biết học nghề và có hình thể phù hợp. Trường hợp chuyển thế vẫn phải vượt qua điều kiện chuyển thế. Vì vậy số lượng chung/riêng V3 sẽ khác 165/45/45/45; không cố giữ tỷ lệ đẹp bằng cách phân loại sai.

Thêm lớp điều kiện:

```text
allowedRaces → allowedSpecies/lineageTags → capability → activation condition
```

- `sentient`: Nhân, Ma đủ tuổi nhận thức; Yêu đã Khai Trí hoặc dữ liệu xác nhận tương đương.
- `canLearnProfession`: sentient, đủ khả năng hành động; không có nghĩa mọi Yêu đều có bàn tay người.
- `hasManipulator`: người/Ma hoặc Yêu đã Hóa Hình; vượn chỉ được nếu cấu hình loài hỗ trợ nghề đó.
- `hasWings`, `hasShell`, `aquatic`, `feline`, `canine`: lấy từ profile loài/hình thể, không đoán từ tên cư dân.
- `lineageTags` có thể tồn tại ở trạng thái tiềm ẩn trước khi trait huyết mạch thức tỉnh.

Loài hiện có trong `Appearance.ts`: wolf, tiger, leopard, bear, eagle, dragon, ape, deer, rabbit, crane. Các dòng Hồ, Quy, Tê không được giả định có asset/loài tương ứng. Trait yêu cầu dòng chưa có nguồn phải planned hoặc chỉ tồn tại dưới dạng huyết mạch tiềm ẩn được định nghĩa rõ; không gán ngẫu nhiên cho sói.

### 4.4. Nguồn và trạng thái thức tỉnh

- `innate`: bốc khi sinh; tác động tiềm năng có thể tiềm ẩn trước khi kiểm định.
- `lineage`: cần lineage tag được thừa kế hoặc nguồn tổ tiên hợp lệ; không bốc chỉ vì đủ budget.
- `reincarnation`: seed chuyển thế riêng; không gán mọi NPC “thiên kiêu” thành chuyển thế.
- `acquired`: có sự kiện và điều kiện thành tựu. Khi nhận phải lưu ngày và bằng chứng.
- Trait sở hữu nhưng `dormant` không cho hiệu ứng gameplay; thông tin bẩm sinh thật vẫn có thể nằm trong hồ sơ ẩn nếu đó là căn cơ sẵn có.

Những mô tả yêu cầu lịch duyệt, nghề đã học hoặc trạng thái đã đạt phải được kiểm tra lại. Tên “thiên phú nghề” có thể innate; tên “đại sư/tông sư” thường là acquired. Không suy ra chỉ bằng một regex; dùng bảng override tại phụ lục và danh sách rà soát ở gói A02.

### 4.5. Mặc định khi nhập catalog — để không phải tự đoán 300 lần

1. Giữ tier của nguồn. Race/origin dùng các cột V3 trong phụ lục A, không quay lại cột gốc.
2. `traitCost` lấy bảng bậc; `spawnWeight=1` cho trait có thể sinh mới. acquired/planned/legacyOnly có spawnWeight=0 trong pool bẩm sinh.
3. Tất cả lineage cần tag được khai báo; thiếu mapping lineage cụ thể thì planned, không mặc định cho mọi thành viên cùng race.
4. acquired phải có predicate thành tựu đã định nghĩa. Không có predicate thì planned cho đến khi gói tương ứng hoàn thành.
5. Trait còn một modifier hoặc special effect chưa có consumer thì planned. Không cho active một nửa mà vẫn dùng toàn bộ mô tả gốc.
6. `conflictsWith` ban đầu kế thừa các xung đột cũ của cùng ID còn tồn tại; sau đó thêm group bên dưới. ID đã tách nghĩa không kế thừa nhầm xung đột cũ.
7. Badge dùng dimension và màu tier; description giữ bản nguồn để tham khảo, sau đó viết tooltip theo tác dụng thực.
8. Cho phép file nguồn thiết kế chứa `sourceEffectsText` phục vụ audit; engine chỉ đọc modifier có kiểu đã chuyển đổi.

Danh sách `primary_root` tường minh:

```text
phe_linh_can, bien_di_am_linh_can, am_duong_song_tu, ngu_hanh_cau_toan,
thien_linh_can, cuu_tieu_than_loi_can, thai_duong_chan_hoa_can, hon_don_dao_can,
kim_linh_can_tinh_thuan, moc_linh_can_tinh_thuan, thuy_linh_can_tinh_thuan,
hoa_linh_can_tinh_thuan, tho_linh_can_tinh_thuan, quang_minh_linh_can,
thai_am_linh_can, thai_duong_linh_can, hu_khong_linh_can, luan_hoi_dao_can
```

Các ID trên là danh sách khi nhập, không phải phép kiểm tra hậu tố lúc game chạy. `an_linh_can` cũ là Ẩn Linh Căn, không nằm trong danh sách này; xem phụ lục A.2.

Root override mặc định cho danh sách này: bậc1→impure/purity25; bậc2→true/65; bậc3→earth/85; bậc4–5→heaven/100. qiRateFactor lấy hệ số `qiRate` của chính dòng nguồn nếu có; nếu không dùng factor mặc định của loại root. Phần tử lấy bảng cấu hình, ví dụ kim/moc/thuy/hoa/tho, quang, am, duong, loi. Không chuyển thuộc tính lạ thành một phần tử ngẫu nhiên. Kiểu phần tử chưa được công pháp hỗ trợ là dữ liệu căn cơ, chưa đồng nghĩa đã có phép chiến đấu mới.

Các root hỗn hợp: Âm Dương=`['am','duong']`, Ngũ Hành/Hỗn Độn=`['kim','moc','thuy','hoa','tho']`. Không lấy số phần tử làm công thức phân cấp root thay cho rootType đã chốt. Root không có phần tử rõ như Luân Hồi cần giá trị riêng trong config và giữ planned nếu chưa có handler bắt buộc.

`major_physique`: trait dimension=physique, tier>=4, origin không phải lineage; loại `ba_vuong_trong_dong` vì là đặc trưng mắt. `ancestral_bloodline`: lineage tier>=3. `reincarnation`: toàn bộ origin=reincarnation. `destiny_major`: dimension=social, tier>=4, origin không phải acquired. `combat_experience`: kinh_nghiem_non_not và bach_chien_bat_bai.

Đây là quy tắc sinh metadata tại build/import. Metadata được lưu rõ trong từng definition để review được; không chạy đoán group từ tên người hay mô tả trong runtime.

### 4.6. Dòng dõi và thành tựu chưa đủ dữ liệu

Lineage tag phải có nguồn: thừa kế từ cha/mẹ, một founder được generator cấp tag hợp lệ hoặc sự kiện phản tổ. Dòng dõi của founder cơ bản có thể dựa vào loài (wolf→wolf, tiger→tiger, dragon→dragon, ape→ape, deer→deer, eagle/crane→avian), không ngẫu nhiên gán fox/turtle/rhino khi hình thể chưa hỗ trợ.

- Long Huyết/Tổ Long/Thanh Long yêu cầu dragon; vượn yêu cầu ape; Nguyệt Lang yêu cầu wolf; Thanh Khâu/Cửu Vĩ yêu cầu fox; Huyền Quy/Huyền Vũ yêu cầu turtle; Kim Giác Tê yêu cầu rhino.
- Các dòng thần thú lai hoặc tổ Ma không có founder/lineage generator thì planned. Không suy ra cứ race=demon là Cổ Ma Chân Tổ.
- `hoa_hinh_hoan_my`: awarded một lần khi Yêu đạt Hóa Hình đúng milestone, không phải ngay khi có đủ XP tâm cảnh.
- `yeu_dan_tinh_thuan`: cần Kết Đan và tiêu chí chất lượng đan; nếu chỉ có stage mà chưa có chất lượng, giữ planned.
- Những origin override như Vạn Cổ Đạo Tâm, Vô Địch Thiên Hạ, Vô Thượng Sát Thần cần hệ thành tựu riêng; không tự dùng điều kiện tuổi>100 hay killCount>100 để kích hoạt tất cả.

Các entry planned vẫn được save/migration giữ ID. Điều kiện “planned không spawn” không có nghĩa xóa trait đang nằm trong save cũ.

## 5. Hợp đồng dữ liệu

Các đoạn TypeScript là hợp đồng để triển khai. Có thể đổi cách chia file nhưng không được đổi ý nghĩa trường. Không tạo hai nguồn dữ liệu cạnh tranh cho cùng thuộc tính.

### 5.1. Định nghĩa catalog

```ts
type RaceId = 'human' | 'beast' | 'demon';
type TraitTier = 1 | 2 | 3 | 4 | 5;
type TraitOrigin = 'innate' | 'acquired' | 'lineage' | 'reincarnation';
type InnateAxis = 'comprehension' | 'aptitude' | 'physique';
type TraitDimension = 'physique' | 'root' | 'mindset' | 'combat'
  | 'profession' | 'social' | 'survival';
type ImplementationState = 'active' | 'planned' | 'legacyOnly';

interface TraitCondition {
  kind: 'minAge' | 'minRealm' | 'capability' | 'lineage'
    | 'hasTrait' | 'achievement';
  key?: string;
  value?: number;
}

interface TraitDefinitionV3 {
  id: string;
  name: string;
  description: string;
  tier: TraitTier;
  dimension: TraitDimension;
  origin: TraitOrigin;
  allowedRaces: 'all' | readonly RaceId[];
  allowedSpecies?: readonly string[];
  requiredLineageTags?: readonly string[];
  activation: readonly TraitCondition[];
  acquisition: readonly TraitCondition[];
  exclusiveGroups: readonly string[];
  conflictsWith: readonly string[];
  evolvesFrom?: string;
  implementation: ImplementationState;
  deferredReason?: string;
  spawnWeight: number; // 0 = không tự sinh
  traitCost: number;
  innateDelta: Partial<Record<InnateAxis, number>>;
  primaryRootOverride?: {
    rootType: 'impure' | 'true' | 'earth' | 'heaven';
    purity: number;
    elements: string[];
    qiRateFactor: number;
  };
  learningAffinity: Partial<Record<'combat' | 'profession' | 'cultivation', number>>;
  modifiers: readonly TraitModifier[];
  effects: readonly TraitEffect[];
  legacyAliases?: readonly string[];
}
```

`TraitModifier` phải là union có tên trường và đơn vị hữu hạn. Không giữ `Record<string, number>` trong engine cuối. `TraitEffect` phải là union các handler thật, ví dụ `regeneration`, `lowHpAttack`, `tribulationResistance`; planned không được giả làm handler rỗng trả thành công.

`TraitCondition` phải được validator kiểm tra cặp kind/key/value. Có thể thay bằng discriminated union chặt hơn khi code. Không chạy chuỗi mô tả bằng `eval`.

### 5.2. Trait runtime của cư dân

```ts
interface OwnedTrait {
  id: string;
  origin: TraitOrigin;
  acquiredAtDay: number;
  sourceEventId?: string;
  state: 'active' | 'dormant' | 'legacy';
  legacyGrandfathered?: boolean;
}

class TraitsComponent {
  entries: OwnedTrait[] = [];
  revision = 0;
  // Giai đoạn chuyển tiếp: getter cho innateTraits / trainingTraits.
  // techniqueTraits được chuyển sang bộ chuyển đổi công pháp, xem mục 9.
}
```

- Dùng cùng class constructor được import từ mọi nơi; ECS nhận diện component bằng constructor, không theo chuỗi tên.
- Một ID có tối đa một entry đang sở hữu; tiến hóa dùng transaction remove/add.
- Mảng cũ trở thành view chỉ đọc hoặc adapter rõ ràng. Không cho vừa sửa entries vừa push mảng cũ.
- Lưu provenance để biết trait đã sinh, được luyện hay migrate; không đoán lại mỗi lần load.

### 5.3. Hồ sơ tiềm năng

```ts
interface InnateScores { comprehension: number; aptitude: number; physique: number }
interface PendingRoot {
  rootType: 'none' | 'impure' | 'true' | 'earth' | 'heaven';
  purity: number;
  elements: string[];
  primaryTraitId?: string;
}
interface FoundationChange {
  id: string;             // khóa duy nhất của cải biến
  eventId: string;
  day: number;
  delta: Partial<InnateScores>;
  reason: string;
}
class TalentProfileComponent {
  schemaVersion = 3;
  birthSeed = 0;
  seedClass = 'ordinary';
  base: InnateScores = { comprehension: 0, aptitude: 0, physique: 0 };
  pendingRoot: PendingRoot | null = null;
  lineageTags: string[] = [];
  foundationChanges: FoundationChange[] = [];
  knowledge: 'unassessed' | 'revealed' | 'estimatedLegacy' = 'unassessed';
  migrationBaseIsResolved = false;
  legacyAnchor?: LegacyPotentialAnchor;
  revision = 0;
  // Cache được tạo lại sau load, không phải dữ liệu nguồn của save.
}
```

`base` = nền trước trait đối với nhân vật V3 mới. Với legacy chưa tách ngược chính xác, dùng chế độ baseline đã giải quyết ở mục 14; không vừa nhập điểm cũ đã có trait vừa cộng thêm toàn bộ trait lần nữa.

### 5.4. Trưởng thành và cảm xúc

```ts
interface GrowthDayBucket {
  day: number;
  routineWill: number;
  routineMind: number;
  experienceWill: number;
  experienceMind: number;
}
interface GrowthFamilyDayBucket {
  day: number;
  counts: Record<string, number>; // familyKey -> số event hợp lệ trong ngày
}
interface ExperienceRecord {
  id: string;
  eventId: string;
  kind: 'setback' | 'bereavement' | 'danger' | 'responsibility' | 'insight';
  createdDay: number;
  severity: number;       // 1..5
  emotion: number;        // -100..100, áp lực ban đầu
  halfLifeDays: number;
  reflectionDays: number;
  requiredReflectionDays: number;
  readyForReflectionAtDay: number;
  growthAwarded: boolean;
  resolvedAtDay?: number;
}
class GrowthMindComponent {
  willpowerXp = 0;
  mindsetXp = 0;
  mentalState = 0;
  lastIntegratedTick = 0;
  dailyBuckets: GrowthDayBucket[] = []; // tối đa 31 ngày
  familyDayBuckets: GrowthFamilyDayBucket[] = []; // dùng tính novelty, cũng lưu trong save
  cooldownUntilDay: Record<string, number> = {};
  recentEventIds: { id: string; day: number }[] = [];
  claimedMilestones: string[] = [];
  experiences: ExperienceRecord[] = [];
  recentGains: { day: number; willXp: number; mindXp: number; reason: string }[] = [];
  backgroundSource: 'newborn' | 'generatedAdult' | 'legacy' = 'newborn';
  revision = 0;
}
```

Giới hạn: recentEventIds 256; experiences 24; recentGains 20. `claimedMilestones` chỉ chứa khóa mốc hữu hạn như từng đại cảnh giới/tiểu cảnh giới, không thêm khóa cho mỗi tick hoặc mỗi bữa ăn. Các counter nhiệm vụ/tác vụ lưu số lần thay vì ID vô hạn.

`familyDayBuckets` giữ tối đa 31 ngày, mỗi ngày tối đa 64 nhóm chi tiết cộng một nhóm dự phòng cho mỗi `GrowthEventKind`. `familyKey` lấy từ danh mục nhóm hoạt động cố định hoặc nội dung như công pháp/công thức; không chứa encounterId, eventId hay timestamp. Khi vượt 64 nhóm chi tiết, gộp nhóm mới vào `overflow:<kind>` để không né giới hạn; số nhóm dự phòng bị chặn bởi enum sự kiện hữu hạn. Cùng save và cùng thứ tự event phải cho cùng cách gộp. Bucket XP tổng và bucket số lần là hai dữ liệu khác nhau, không suy số lần từ lượng XP đã nhận.

### 5.5. Kết quả hàm tính điểm

```ts
interface PotentialResult {
  scores: InnateScores & { willpower: number; mindset: number };
  innateContribution: number;
  growthContribution: number;
  total: number;              // chưa làm tròn
  displayTotal: number;       // làm tròn 1 số lẻ
  assessmentComplete: boolean;
  grade: 'ordinary' | 'capable' | 'excellent' | 'genius' | 'prodigy';
}
```

API bắt buộc: `calculatePotential(profile, growth, resolvedTraits): PotentialResult` là hàm thuần. Không nhận Canvas, Engine hay EventBus; không Math.random; không mutation tham số.

## 6. Công thức tiềm năng

### 6.1. Điểm bẩm sinh

```text
score(axis) = clamp(base(axis) + traitDelta(axis) + foundationDelta(axis), 0, 100)
```

Đóng góp nhiều trait trên một trục: loại trùng ID, chọn trait bẩm sinh/huyết mạch/chuyển thế thật sự được sở hữu về căn cơ, sắp riêng các delta dương theo độ lớn và các delta âm theo trị tuyệt đối. Với mỗi phía, hệ số lần lượt `1, 0.5, 0.25, 0.125...`. Tổng delta trait trên mỗi trục giới hạn −45..45. Tie-break bằng ID để kết quả không đổi theo thứ tự mảng.

Tách `resolveInnateContributors` khỏi `resolveActiveTraits`: trait bẩm sinh còn dormant vì chưa thức tỉnh vẫn thuộc tiềm năng thật, nhưng chưa có hiệu ứng gameplay và chưa được công bố. Trait dormant do xung đột legacy không tính thêm; migration anchor giữ kết quả đã chốt. Nhờ vậy việc chỉ reveal thông tin không làm đổi gene đã sinh.

Ngoại lệ primary root: trait định nghĩa loại linh căn không cộng thêm `aptitude` lần hai. Loại root và purity đã quyết định nền tư chất. Trait căn cơ phụ có thể cộng aptitude theo cấu hình riêng.

### 6.2. Nền tư chất từ linh căn

| Loại | Điểm nền loại | Purity mặc định nếu nguồn thiếu |
|---|---:|---:|
| none | 0 | 0 |
| impure | 25 | 25 |
| true | 60 | 65 |
| earth | 85 | 85 |
| heaven | 100 | 100 |

```text
aptitudeBase = 0.8 * rootTypeScore + 0.2 * purity
```

`none` bắt buộc purity=0 và điểm tư chất nền=0. Không sinh âm. Root đặc biệt như Hỗn Độn được biểu diễn bằng primaryTraitId và rootType tương thích; không sửa enum toàn dự án thành 15 loại trong gói đầu.

Yêu/Ma có căn cơ tương ứng, vẫn chuẩn hóa về thang trên. Giữ khả năng tu luyện của hệ chủng tộc hiện tại; không vô tình áp điều kiện “75% vô linh căn Nhân tộc” sang toàn bộ Yêu/Ma.

### 6.3. Chuẩn hóa đóng góp từ bảng V2

Đây là quy tắc chuyển **dữ liệu thiết kế**, không phải thuật toán suy luận chạy mỗi frame:

1. Đối với trait innate/lineage/reincarnation: `Ngộ` → `innateDelta.comprehension = 0.5 * Ngộ`; `Linh` → `aptitude = 0.5 * Linh`; `Thể` → `physique = 0.5 * Thể`.
2. Primary root xóa aptitudeDelta; tư chất đã lấy từ root.
3. Trait acquired không tăng ba trục bẩm sinh qua vector. Đóng góp nghề/chiến đấu đi vào sở trường hoặc hiệu ứng; cải biến căn cơ thật phải qua sự kiện riêng.
4. `Đạo tâm` của V2 không cộng thẳng vào mindset hoặc willpower. Chuyển thành hỗ trợ tốc độ rèn/hồi phục có trần, xem mục 10.
5. `Chiến`, `Nghệ`, `Khí vận` không đi trực tiếp vào P.
6. Các override sửa lỗi logic trong tài liệu có ưu tiên cao hơn quy tắc chuyển tự động.
7. Ghi con số kết quả vào catalog V3; không parse chuỗi tiếng Việt trong engine.

Override bắt buộc:

| ID | Điều chỉnh |
|---|---|
| `mu_tit_dan_dao` | learningAffinity.profession = −6; không giữ Nghệ +6; innateDelta rỗng |
| `tam_tinh_nong_noi` | Không cộng đạo tâm/ngộ tính từ riêng trait này; đổi thành khuynh hướng hành vi và mentalState penalty |
| `tat_nguyen_bam_sinh` | Không tự cộng thể chất hoặc XP ý chí vì khuyết tật; có thể giữ hỗ trợ thích nghi nếu có luyện tập thật |
| `doan_menh_chi_tuong`, `khi_huyet_hu_nhuoc` | Xóa Thể +1 nguồn; không coi giảm HP/thọ nguyên là tăng căn cốt |
| `y_chi_bac_nhuoc` | Không tặng Ngộ +3 mặc định; dùng giảm tốc độ rèn/độ kiên trì, không trừ XP đã kiếm |
| `kinh_nghiem_non_not` | Không cộng Chiến +2; dùng trạng thái kinh nghiệm ban đầu, không tăng tiềm năng bẩm sinh |
| `can_cu_bu_thong_minh` | Bỏ bonus ngộ tính nguồn; giữ khuynh hướng chăm chỉ và tốc độ rèn, không vừa giảm comprehension vừa cộng điểm ngộ tính không có lý do |

### 6.4. XP sang điểm trưởng thành

Dùng cùng đường cong cho ý chí và tâm cảnh, XP lưu riêng:

```text
xpForScore(s) = 20*s + 0.4*s*s
scoreFromXp(x) = clamp((-20 + sqrt(400 + 1.6*clamp(x,0,6000))) / 0.8, 0, 100)
```

| Điểm | Tổng XP |
|---:|---:|
| 0 | 0 |
| 10 | 240 |
| 25 | 750 |
| 50 | 2000 |
| 75 | 3750 |
| 100 | 6000 |

Không cần nhân thêm công thức giảm tăng trưởng của V2: đường cong XP đã làm điểm cao khó tăng. Khi XP chạm 6000, mọi thưởng tiếp theo dừng ở 6000.

### 6.5. Ví dụ bắt buộc dùng trong kiểm thử

```text
C=80, A=70, B=60, W=40, M=50
P = 24 + 10.5 + 6 + 10 + 10 = 60.5

W tăng từ 40 lên 60, các phần khác giữ nguyên:
P mới = 65.5; mức tăng chính xác = 5.

C=A=B=100, W=M=0 → P=55.
C=A=B=0, W=M=100 → P=45.
C=A=B=W=M=100 → P=100.
```

UI phân hạng: `<40 Bình thường`, `40..<60 Khá`, `60..<75 Ưu tú`, `75..<90 Thiên tài`, `90..100 Thiên kiêu`. Đây là mức tiềm năng hiện tại, không phải danh hiệu cảnh giới. Trẻ chưa kiểm định được hiển thị “Chưa đánh giá đầy đủ” thay cho một kết luận phẩm chất chắc chắn.

## 7. Sinh nhân vật và thức tỉnh

### 7.1. RNG phải có thể lặp lại

Tạo `GenerationContext` chứa `worldSeed`, `birthOrdinal`, `raceId`, `speciesId`, `parentProfiles`, `mode`, `rng`. Dùng `src/core/SeededRNG.ts` hoặc một adapter tương thích; không dùng sort với comparator `Math.random() - 0.5`.

- `birthOrdinal` tăng một lần sau khi sinh thành công, lưu vào save. Không dùng thời gian hệ điều hành.
- Tách stream bốc ngoại hình/tên và stream bẩm sinh. Thêm một lần roll tên không được thay đổi linh căn.
- Seed đặc điểm suy ra từ worldSeed + birthOrdinal + phiên bản generator, không phụ thuộc số frame đã render.
- Load nhân vật cũ không gọi generator. Migration dùng hash ổn định của worldSeed + ID nếu cần giá trị fallback, không sinh birthOrdinal mới.
- `mode: 'natural' | 'curated'`: natural dùng xác suất; curated là archetype do người chơi chọn cố ý. Thống kê dân số ngẫu nhiên không trộn curated.

### 7.2. Quy trình tạo mới, theo đúng thứ tự

1. Kiểm tra race/species và cha mẹ trước khi tạo entity; trường hợp thất bại không tiêu thụ birthOrdinal.
2. Xác định lineage tags từ cha mẹ; giữ dữ liệu tổ tiên ngắn gọn, không duyệt cả cây gia phả mỗi lần render.
3. Roll seedClass và budget; roll nền ngộ tính/thể chất.
4. Roll kết quả linh căn tiềm ẩn một lần.
5. Chọn trait từ catalog active, đúng race/species/origin, có đủ budget và không xung đột.
6. Nếu chọn primary root trait thì áp root override vào kết quả root trước khi chốt base. Chỉ một primary root.
7. Tạo TalentProfile, Traits, GrowthMind và baseline chỉ số chiến đấu.
8. Tính tất cả chỉ số dẫn xuất một lần bằng evaluator.
9. Nếu newborn: tuổi 0, không có công pháp hoặc thành tựu hậu thiên tự phát, ý chí XP=0, tâm cảnh XP=0, mentalState=0.
10. Nếu tạo người trưởng thành: giữ khoảng tuổi khởi tạo 15–30 hiện có; dùng nền trải nghiệm ở mục 7.5.
11. Gắn quan hệ cha mẹ hai chiều như hiện tại. Chỉ phát sự kiện sinh sau khi toàn bộ component hợp lệ.

### 7.3. Seed class và budget đề xuất

| Seed class | Tỷ lệ | Budget trait | Bậc tối đa tự roll | Slot bẩm sinh tối đa | Cộng nền C/B |
|---|---:|---:|---:|---:|---:|
| ordinary | 55% | 10–25 | 2 | 2 | 0 |
| capable | 28% | 25–45 | 3 | 3 | +3 |
| talented | 12% | 45–70 | 3 | 3 | +8 |
| prodigy | 4% | 70–100 | 4 | 4 | +15 |
| exceptional | 0.9% | 100–140 | 5 | 4 | +22 |
| legendary | 0.1% | 140–160 | 5 | 4 | +30 |

Hai điều kiện `traitCost <= remainingBudget` **và** `tier <= seedMaxTier` đều bắt buộc. Đủ 60 budget không tự cho phép seed talented nhận tier 5.

- Slot là giới hạn trên, không bắt buộc dùng hết; còn dư budget là bình thường.
- Trait bất lợi: bản đầu không hoàn tiền budget. Mỗi người tối đa một trait thuần bất lợi từ pool ngẫu nhiên. Nếu bổ sung hoàn tiền sau, phải có test vòng lặp/budget, không thêm tùy tiện trong khi code.
- Mỗi bậc có pool weighted; `spawnWeight` mặc định 1 trong cùng bậc. Chọn bậc trong các bậc hợp lệ với trọng số `1:64, 2:25, 3:8, 4:2.7, 5:0.3`, rồi chọn ID. Đây là trọng số có điều kiện sau seed/race/budget, không phải xác suất tier trên toàn dân số.
- Retry tối đa 32 lựa chọn/nhân vật; không có ứng viên thì kết thúc, không lặp vô hạn.
- Lineage và reincarnation vẫn cần điều kiện nguồn; legendary không được bỏ qua chủng tộc.
- `curated` có bộ trait chỉ định được kiểm tra; cho phép bỏ giới hạn xác suất/budget nhưng không bỏ validator hay kích hoạt hiệu ứng chưa tồn tại.

Nền chỉ số mới đề xuất, trước trait và seed offset: C trung tâm Nhân=50, Yêu=30, Ma=40; B trung tâm Nhân=35, Yêu=60, Ma=50. Roll đều ±8 rồi cộng offset và clamp 0–100. Đây là **thay đổi cân bằng cho thế hệ V3 mới**; save cũ dùng điểm đã có, không ép Yêu 8000 ngộ tính thành 30000 khi load.

Mẫu thừa kế: nếu có cả cha mẹ và có base chưa chứa trait, `childBase = 0.6*rolledBase + 0.4*mean(parentBase)` cho C/B. Không lấy tổng tiềm năng cha mẹ để truyền cho con. Không truyền XP ý chí, XP tâm cảnh hay trạng thái tinh thần. Trait huyết mạch thừa kế chỉ làm tăng trọng số ứng viên (x2 một cha/mẹ, x4 cả hai), vẫn phải phù hợp ngân sách, bậc và lineage.

### 7.4. Linh căn và 12 tuổi

- Nhân natural giữ xác suất gốc hiện tại khi roll root: none 75%, impure 20%, true 4%, earth 0.99%, heaven 0.01%, trước primary-trait override.
- Yêu/Ma giữ căn cơ mặc định có thể tu luyện như hệ hiện tại; cải biến phân bố phải là thay đổi cân bằng riêng.
- Root có thể tốt mà không có ID trait cùng tên. Linh căn là một thuộc tính; không bắt buộc tạo trait để biểu diễn lại đúng thuộc tính đó.
- Những trait như `thien_linh_can`, `hon_don_dao_can`, `cuu_tieu_than_loi_can` phải có `primaryRootOverride` được khai báo trong config; không lấy tên để đoán lúc chạy.
- Sinh newborn: `SpiritualRootComponent` giữ `isAwakened=false`, phần đã công bố để none/0; kết quả thật nằm trong pendingRoot. Base aptitude thật suy ra từ pendingRoot, UI chưa công bố.
- Thức tỉnh lúc 12 tuổi: sao chép pendingRoot vào component linh căn, đặt knowledge=revealed, ghi một sự kiện. Không roll lại và không xóa/gán lại các mảng trait.
- Legacy chưa thức tỉnh, chưa có pendingRoot: migration tạo kết quả tiềm ẩn một lần bằng seed ổn định; lưu lại ngay trong dữ liệu chuyển đổi. Hai lần load cùng save phải cho cùng kết quả.
- Không đổi tuổi trưởng thành 15 của hệ ngoại hình thành 12. Tuổi thức tỉnh và tuổi trưởng thành là hai quy tắc khác nhau.

### 7.5. Người trưởng thành được tạo trực tiếp

NPC tạo ở tuổi 15–30 chưa có lịch sử mô phỏng từ nhỏ. Tạo một lần `backgroundSource='generatedAdult'`, W roll 15–30, M roll 10–25 bằng stream riêng; chuyển điểm thành XP bằng `xpForScore`.

Ghi mô tả “Nền trải nghiệm trước khi xuất hiện”. Không bịa từng chiến công/độ kiếp để giải thích. Đây là khởi tạo bối cảnh, không phải buff tăng tự động mỗi khi tuổi thay đổi.

### 7.6. Archetype hiện tại

Rà `mortal_human`, `prodigy_human`, `wild_beast`, `awakened_beast`, `mortal_demon`, `blood_demon`.

- `mortal_demon` hiện được gán Sát Phạt Quyết Đoán bậc cao: không giữ việc mọi Ma tốt đều có cùng một trait hiếm trong mode natural.
- `awakened_beast` natural không tự động có Long Huyết Bá Thể nếu loài/huyết thống không hợp.
- `prodigy_human` curated có thể bảo đảm Thiên Linh Căn + ngộ tính tốt; Kiếm Tiên Chuyển Thế chỉ gán nếu preset ghi rõ nguồn chuyển thế.
- Giữ các đảm bảo ngoại hình, trang bị rỗng và túi đan rỗng trong test hiện tại. Không mở rộng gói này thành thay đổi đồ khởi đầu.

## 8. Quản lý đặc điểm, xung đột và tiến hóa

### 8.1. API duy nhất được phép thay đổi trait

```ts
type TraitMutationReason = 'birth' | 'achievement' | 'evolution' | 'migration' | 'godTool';
type TraitMutationResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: string };

grantTrait(world, entityId, traitId, context): TraitMutationResult;
removeTrait(world, entityId, traitId, context): TraitMutationResult;
evolveTrait(world, entityId, fromId, toId, context): TraitMutationResult;
resolveActiveTraits(world, entityId): readonly TraitDefinitionV3[];
```

Mỗi mutation hợp lệ: kiểm tra -> thay entries -> tăng revision -> đánh dấu cache -> rebuild chỉ số -> phát sự kiện thông báo. Thất bại ở bước kiểm tra không được sửa mảng, XP hay tài nguyên.

Nhận lại trait đã có trả `{ok:true,changed:false}`; không nhân lại chỉ số, không thưởng lại XP.

### 8.2. Nhóm loại trừ

| Group | Giới hạn | Quy tắc |
|---|---:|---|
| primary_root | 1 | Root chính, không bao gồm mọi trait có dimension=root |
| major_physique | 1 | Đạo thể/thánh thể lớn; căn cốt nhỏ không tự bị loại |
| reincarnation | 1 | Không đồng thời nhiều thân phận chuyển thế |
| ancestral_bloodline | 1 | Huyết mạch chủ đạo; biến thể hỗn huyết cần định nghĩa riêng |
| destiny_major | 1 | Mệnh cách lớn, không bao gồm mọi tính cách xã hội |
| combat_experience | 1 | Các mức kinh nghiệm chiến đấu thay thế nhau |

Danh sách thành viên phải được khai báo trong catalog. Validator báo lỗi nếu A conflicts B mà B không tồn tại; runtime coi xung đột là hai chiều dù nguồn chỉ khai một chiều. Nếu điều kiện mâu thuẫn với chính trait hoặc có chu kỳ evolution, catalog không được active.

### 8.3. Các chain tối thiểu cần có

- `long_huyet_ba_the` → `to_long_chan_huyet`: chỉ thay khi cùng dòng và có sự kiện phản tổ; không cộng hai multiplier HP.
- `kinh_nghiem_non_not` → `bach_chien_bat_bai`: ngưỡng theo encounter đủ thử thách, không đếm mọi cú đánh. Không tự tạo ID “Bách Chiến Chi Sĩ” nếu catalog không có.
- `loi_kiep_toi_the`: nhận đúng một lần ở lần vượt đại kiếp hợp lệ đầu tiên, lần sau chỉ ghi kinh nghiệm kiếp theo mốc.

Các chain khác là dữ liệu bổ sung. Không suy luận tiến hóa bằng số bậc liền nhau; hai trait khác chủ đề không tự biến thành nhau.

### 8.4. Điều kiện trait hậu thiên nền

| Trait/nhóm | Điều kiện tối thiểu |
|---|---|
| Lôi Kiếp Tôi Thể | Hoàn tất một đợt kiếp, còn sống, event có ID mốc |
| Bách Chiến Bất Bại | Ít nhất 100 encounter thắng đủ thử thách, 20 đối thủ khác nhau, không chỉ giết dân thường/dã thú yếu |
| Nghề bậc 1 | Kết quả làm nghề có bằng chứng; không roll lúc sinh |
| Nghề bậc 2 | 30 tác vụ nghề hoàn tất, trải qua ít nhất 30 ngày |
| Nghề bậc 3 | 150 tác vụ, ít nhất 180 ngày; hệ nghề phải hỗ trợ tác vụ đó |
| Nghề bậc 4 | 500 tác vụ, ít nhất 720 ngày và một sản phẩm/thành tựu khó đã được hệ nghề xác nhận |
| Nghề bậc 5 | 1500 tác vụ, ít nhất 1800 ngày và milestone chuyên biệt; không chỉ tăng counter để phong cấp |

Nhóm nghề V3 chỉ active khi có event nghề thật. Các lĩnh vực chưa có gameplay như phù/trận/thuần thú giữ planned. Tự động tăng tier khi ngày đủ mà chưa làm nghề là lỗi.

## 9. Hiệu ứng gameplay và chống tính trùng

### 9.1. Phân biệt điểm và chỉ số hiệu lực

`innateDelta` trả lời “người này có căn cơ gì”; `modifiers/effects` trả lời “đặc điểm đang làm gì trong mô phỏng”. Không lấy ATK sau trang bị chia ngược ra thể chất hoặc lấy kết quả tu luyện để đo ngộ tính.

Thiết kế một `TraitEffectResolver` tập trung. Các hệ gọi accessor như `getQiRateFactor`, `getAttackFactor`, `getBreakthroughBonus`, `getWillTrainingFactor`; không mỗi hệ tự nhân lại toàn bộ catalog theo cách riêng.

### 9.2. Nguồn chân lý theo chỉ số

| Chỉ số | Nguồn chuẩn | Chỗ cập nhật |
|---|---|---|
| Ngộ tính chuẩn | TalentProfile + trait bẩm sinh + foundation changes | PotentialCalculator |
| `ComprehensionComponent.current` cũ | `round(comprehension * 1000)` | Adapter, mỗi khi profile đổi |
| Tư chất | Root đã chốt + căn cơ phụ | PotentialCalculator |
| Tốc độ Qi | Race × root factor × trait phụ × công pháp × trạng thái | CultivationSystem qua resolver |
| HP/ATK/DEF/armor/move | Baseline không chứa trait + cảnh giới + trait + phần equipment hiện có | DerivedStatsService |
| Ý chí/tâm cảnh | XP hợp lệ | GrowthSystem |
| Trạng thái tinh thần | Trải nghiệm + môi trường + recovery | MentalStateSystem |

Modifier `comprehension: xN` trong V2 chuyển thành hỗ trợ **học công pháp** (`techniqueLearningFactor`), không nhân `ComprehensionComponent.current` lần nữa khi đã tính vector Ngộ vào profile. Tooltip phải phản ánh đúng “tốc độ lĩnh ngộ công pháp”, không hứa tăng chỉ số ngộ tính nếu không tăng.

### 9.3. Linh căn chỉ tính một lần

Ví dụ cũ: rootType=heaven nhân 3, trait Thiên Linh Căn lại nhân 1.9 → 5.7. Đây là đường tính cần loại bỏ.

Quy tắc V3:

1. Root factor mặc định: none=0, impure=0.6, true=1.2, earth=1.8, heaven=1.9 cho tuyến linh khí. Giữ ngoại lệ tu luyện của chủng tộc/con đường đã có, không chặn Yêu/Ma do component mô phỏng root none sai nguồn.
2. Nếu primary root trait có qiRate riêng, nó **thay root factor**, không thuộc danh sách trait phụ nhân thêm.
3. `thien_linh_can` dùng rootFactor=1.9; `elementPurity` không cộng 45 lên purity vốn 100. Purity là dữ liệu căn cơ, không phải % modifier tùy ý.
4. Trait phụ như Tiên Thiên Đạo Thể được xử lý ở nhóm trait phụ, có diminishing và cap.
5. Giá trị none=0 chỉ chặn tuyến tu linh khí đang yêu cầu linh căn. Thể tu độc lập là tính năng khác; `tuyet_linh_chi_the` không được ghi “đã có thể tu hoàn chỉnh” nếu chưa xây tuyến đó.

### 9.4. Tổng hợp modifier

Không liên tục làm `hp.max *= traitMultiplier` khi render, load hoặc nhận trait.

- Multiplier cùng stat chuyển sang log: `log(m)`; tách buff dương và debuff âm, sắp theo độ lớn, trọng số `1, 0.5, 0.25...`; cuối cùng `exp(sum)`.
- Flat bonus cộng một lần, clamp theo giới hạn từng stat.
- Xác suất bonus cộng đơn vị 0..1; clamp ở công thức cuối.
- Chỉ các trait khác ID và active mới góp hiệu ứng. Không cộng ID xuất hiện ở hai mảng legacy hai lần.
- Chỉ áp diminishing lên phần **trait**. Không vô tình đổi cách nhân cảnh giới hay toàn bộ trang bị ngoài phạm vi.

Giới hạn phần trait đề xuất: HP factor 0.35–3.0; ATK 0.35–2.5; Qi phụ 0.25–2.5; tốc độ chạy 0.5–1.8; tốc độ đánh 0.5–1.8; bonus crit tối đa +0.40; bonus dodge +0.35; bonus đột phá −0.40..+0.35. Trần cuối crit/dodge tiếp tục áp theo hệ chiến đấu, không sửa để đạt 100% né.

### 9.5. Rebuild chỉ số có thể lặp an toàn

Tạo `StatBaselineComponent` lưu HP/ATK/DEF/armor/tốc độ/thọ nguyên nền trước trait và thông tin scale cảnh giới cần thiết. Rebuild luôn tính từ baseline, không từ kết quả rebuild lần trước.

- Khi HP max thay đổi: giữ tỷ lệ `oldCurrent/oldMax`, clamp 0..1; không hồi đầy HP do thêm/bỏ trait. Rebuild người đã chết không làm sống lại.
- Khi đột phá có luật hồi đầy HP hiện tại: đó là hiệu ứng riêng của đột phá, xảy ra sau rebuild, đúng một lần.
- Khi lifespan thay đổi: giữ tuổi hiện tại, không sửa tuổi sinh.
- Những tăng trưởng vĩnh viễn khác như đan kéo dài thọ nguyên phải ghi vào `permanentStatAdjustments` có nguồn, nằm ngoài trait baseline. Rà các chỗ đang trực tiếp làm `life.maxLifespan += years`; nếu không đưa chúng vào nguồn rebuild, lần đổi trait sau sẽ làm mất số năm đã uống đan. Các điều chỉnh này không tự tăng P.
- Khi trait đổi: equipment được hệ equipment tính đúng một lần; không lưu equipment vào baseline.
- Không tính lại toàn bộ dân số mỗi frame. Dùng `revision` + dirty flag, flush entity bị thay đổi; khi cần đúng ngay trong giao dịch nhận trait thì rebuild đồng bộ entity đó.

### 9.6. Công pháp đang nằm trong `techniqueTraits`

Đối chiếu từng ID với `TECHNIQUE_DEFINITIONS`. ID là công pháp phải được đọc từ CultivationTechniqueComponent và hệ công pháp, không đưa sang pool sinh trait V3.

- Công pháp không mất khi dọn mảng cũ.
- ID trait thật bị xếp nhầm vào mảng technique được chuyển sang entries với origin đúng.
- Bảy ID chỉ có trong catalog cũ xử lý theo mục 14, không xóa âm thầm.
- Hệ `FactionSystem`, Inspector và các sự kiện kỳ ngộ hiện có dùng tên ID cũ cần cập nhật qua adapter.

### 9.7. Hiệu ứng chưa có hệ thống xử lý

Danh sách trường V2 đầy đủ ở phụ lục B. Mỗi trường phải ở đúng một trong ba trạng thái: mapped vào handler đang có, đổi thiết kế có lý do, hoặc deferred.

Nếu một trait cần `phoenixReviveCharge`, `timeInsight`, `possessionPower`, `domainPower`… mà chưa có handler, đặt planned cho cả trait ở lần đầu. Không bỏ riêng hiệu ứng làm nên tên tuổi trait rồi vẫn hiện mô tả như đã hoạt động.

## 10. Rèn luyện ý chí và tâm cảnh

### 10.1. Điều kiện tối thiểu để có thể nhận XP

- Entity còn sống, có GrowthMind và TalentProfile, đã có khả năng nhận thức tương ứng.
- Nhân/Ma: đủ 12 tuổi cho cơ chế trưởng thành chủ động ở bản đầu. Yêu: đã Khai Trí. Trước đó không cho trẻ hoặc dã thú farm công việc/giết chóc để lên tâm cảnh.
- Sự kiện phải đến từ hành động thật đã hoàn thành hoặc milestone thật; không nghe `activity:feedback`, chữ nổi, lời thoại hoặc chuỗi biên niên sử để thưởng.
- Mục tiêu khó phù hợp; hành động quá dễ hoặc lặp lại có diminishing.
- Mọi kiểm tra chạy trước khi thay XP/counter.

### 10.2. Sự kiện có kiểu dữ liệu

```ts
type GrowthEventKind =
  | 'work_completed' | 'study_completed' | 'meditation_completed'
  | 'mentoring_completed' | 'encounter_survived'
  | 'breakthrough_succeeded' | 'breakthrough_failed'
  | 'tribulation_passed' | 'responsibility_completed'
  | 'bereavement' | 'reflection_completed';

interface GrowthEvent {
  world: ECSWorld; // chỉ runtime, dùng chặn sự kiện nhầm world
  eventId: string;
  entityId: number;
  kind: GrowthEventKind;
  tick: number;
  familyKey: string; // nhóm hoạt động dùng chống lặp
  milestoneKey?: string;
  difficulty: number; // do producer xác nhận, không do UI gửi tự do
  evidence: {
    taskId?: string;
    planRevision?: number;
    stepIndex?: number;
    encounterId?: string;
    experienceId?: string;
    targetEntityId?: number;
    realmTarget?: string;
    durationTicks?: number;
    actualDamage?: number;
    actualOutput?: number;
  };
}
```

Không dùng `Date.now()` làm khóa thưởng. Task/encounter/plan phải có ID ổn định trong save. Nếu planner chưa có ID, thêm `planRevision` tăng mỗi lần tạo kế hoạch; khóa hoàn tất `entityId:planRevision:stepIndex`. Khi resume sau load giữ revision đó.

### 10.3. Bảng thưởng ban đầu

Mức thưởng là **XP**, không phải điểm 0–100. Một nguồn ngừng cho XP khi **tổng điểm hiện tại của trục đó** đạt trần ghi trong bảng. Ví dụ ý chí đã 45 thì lao động có trần 40 không tăng thêm ý chí; thử thách có trần 85 vẫn có thể tăng. Không cộng riêng một hạn mức 40 điểm từ lao động vào điểm đã kiếm từ các nguồn khác.

| Hoạt động đã được xác nhận | XP ý chí | XP tâm cảnh | Cooldown theo nhóm | Trần điểm nguồn W/M | Ghi chú |
|---|---:|---:|---:|---|---|
| Hoàn thành lao động hữu ích | 0.5 | 0 | 1 ngày | 40 / — | Có sản phẩm/tiến độ thật; bỏ qua vòng chạy rỗng |
| Học/chế tác bài mới phù hợp | 1 | 1 | 3 ngày | 60 / 50 | Cùng công thức quá dễ sẽ giảm dần |
| Phiên tu luyện tập trung đủ 1 ngày | 1 | 0.5 | 1 ngày | 50 / 40 | Không phải mỗi tick ngồi thiền |
| Đàm đạo có nội dung với người hướng dẫn | 1 | 3 | 7 ngày | 75 / 75 | Yêu cầu hệ mentoring xác nhận, không mọi lời thoại |
| Sống sót/thắng cuộc chạm trán khó | 5 | 0 | 7 ngày | 85 / — | Tạo experience để suy ngẫm; không thưởng mỗi hit |
| Đột phá tiểu cảnh giới thành công | 6 | 4 | Một lần/mốc | 100 / 100 | Mốc gồm chain + stage + substage |
| Vượt đại kiếp thành công | 20 | 10 | Một lần/mốc | 100 / 100 | Không cộng thêm thưởng đại cảnh giới cho cùng kiếp |
| Hoàn thành trách nhiệm lớn | 8 | 4 | 30 ngày | 90 / 90 | Có task được giao trước, không tự nhận rồi tự hủy |
| Thất bại đột phá | 0 | 0 | — | — | Tạo experience; không thưởng cho spam thất bại |
| Người thân mất | 0 | 0 | Một lần/người mất | — | Tác động cảm xúc, không tự tăng trưởng thành |
| Suy ngẫm thành công sau thất bại | 4 | 6 | 30 ngày/cùng loại mục tiêu | 100 / 100 | Experience chưa được thưởng |
| Hóa giải biến cố lớn | 3 | 10 | Một lần/experience | 100 / 100 | Cần đủ thời gian và hoạt động phục hồi |

`mentoring_completed`, nghề chuyên biệt hoặc responsibility chưa có producer thì giữ tắt; không tự phát event giả để đạt bảng thưởng. Các nguồn lao động, thiền, kiếp, thất bại, suy ngẫm và biến cố phải hoạt động ở mốc Lõi.

### 10.4. Công thức thưởng

```text
rawAward = baseXp * difficultyFactor * noveltyFactor * trainingFactor
acceptedAward = min(rawAward,
                    remainingDailyCap,
                    remainingRolling30DayCap,
                    xpForScore(sourceScoreCeiling) - currentXp,
                    6000 - currentXp)
acceptedAward = max(0, acceptedAward)
```

- Với source không có trần riêng, sourceScoreCeiling=100.
- `difficultyFactor`: 0 nếu quá dễ/không hợp lệ; 0.5 cho thử thách vừa dưới mức hiện tại; 1 phù hợp; 1.25 khó nhưng hợp lệ. Không vượt 1.25 để tránh thưởng khổng lồ khi tự tìm đối thủ không thể thắng.
- `noveltyFactor` trong 30 ngày theo `familyKey`: lần 1 =1, lần 2 =0.35, lần 3 =0.1, từ lần 4 =0. Dùng quy tắc này cho experience lặp; routine dùng cooldown + trần riêng, không triệt tiêu toàn bộ việc làm thường ngày sau ba lần.
- Tính số lần trước event từ `familyDayBuckets` trong các ngày `[currentDay-29, currentDay]`. Event mới hợp lệ được ghi vào số lần dù award=0 vì hết trần; event trùng không ghi lần nữa. Làm sạch bucket cũ sau khi đổi ngày và lưu bucket cùng save. Routine không dùng novelty nhưng vẫn áp cooldown và ngân sách routine.
- `trainingFactor` từ trait trong 0.5–1.25; không được âm hoặc >1.25.
- Trần routine: mỗi ngày W≤2, M≤1; rolling 30 ngày W≤20, M≤12.
- Trần experience: mỗi ngày W≤25, M≤15; rolling 30 ngày W≤100, M≤80.
- Chỉ phần XP thực sự nhận được mới trừ ngân sách. Event hợp lệ nhưng award=0 vẫn đánh dấu đã xử lý, không tích trữ để phát lại khi hết cooldown.
- Cooldown tính theo ngày mô phỏng, không theo lúc người chơi mở bảng nhân vật.

### 10.5. Dữ liệu đủ để tính độ khó

- Work: task hoàn tất và actualOutput>0 hoặc building progress thực tăng. Hủy kế hoạch, đường đi thất bại, thiếu nguyên liệu hoặc mục tiêu biến mất = không thưởng.
- Study: công thức/công pháp/chương học có ID; mastery trước/sau thật sự thay đổi và nội dung chưa quá dễ. Nếu chưa có dữ liệu này thì không phát study event.
- Encounter: snapshot sức mạnh hiệu dụng lúc bắt đầu; đối thủ ít nhất 0.75 lần khả năng nhân vật, có giao chiến thật. Không chỉ dùng raw `realm.combatPower` nếu nó bỏ qua toàn bộ equipment; tạo một accessor chung hoặc ghi rõ fallback có giới hạn.
- Mỗi encounter kết thúc khi mục tiêu chết, hai bên tách xa và không đánh nhau đủ 3 ngày, hoặc nhân vật thoát nguy hiểm; dùng encounterId ổn định. Không coi mỗi tick target=null là encounter mới.
- Thương tổn tự gây, đánh mục tiêu cùng phe không thù địch và lặp một đối thủ yếu không tạo XP. Không thưởng dựa riêng vào số HP đã mất.
- Mốc cảnh giới: dùng mục tiêu thực, không lấy tên hiển thị có thể thay đổi/ngôn ngữ.

### 10.6. Trait hỗ trợ ý chí/tâm cảnh

- `willpowerBonus` V2 **không cộng trực tiếp** vào điểm/XP. Chuyển thành `willTrainingBonus = clamp(value/200, -0.25, +0.25)`.
- `willpowerGrowth +15%` → +0.15 vào nhóm tốc độ rèn, rồi áp cap toàn nhóm.
- `Đạo tâm` từ vector nguồn chuyển thành `mindTrainingBonus = clamp(daoHeart/200, -0.15, +0.15)`, trừ các override logic đã nêu.
- `mindStateBonus` chỉ điều chỉnh điểm cân bằng cảm xúc, tổng clamp −20..20; không đổi mindset.
- Giữ chênh lệch tính cách nhưng không để newborn sở hữu sẵn 60/100 ý chí do một trait bậc 5.
- Trait earned như Kiên Định sau một thành tựu không vừa tặng một lượng XP tương đương thành tựu vừa được hệ sự kiện thưởng lại lần nữa.

### 10.7. Hàng đợi, thời gian và khóa chống trùng

1. Event producer phát đúng sau transaction hành động thành công.
2. GrowthSystem nhận event có `event.world === this.world`, đưa vào queue, không xử lý lồng ngay trong CombatSystem.
3. GrowthSystem chạy sau hệ gameplay ở cuối tick (priority đề xuất 90), xử lý theo tick rồi eventId.
4. Kiểm tra ID, milestone, cooldown, nguồn thử thách, giới hạn, rồi phát thưởng một lần.
5. Lưu bucket/cooldown/milestone trong component. recentEventIds chỉ là lớp phụ; không được dựa duy nhất vào một mảng 256 ID để chống phát lại mốc cũ.
6. Event runtime cũ hơn 720 ngày bị từ chối; bản lưu đang tiếp tục tác vụ dùng ID/counter đã lưu, không dựng lại lịch sử thành event mới.
7. Hàng đợi phải rỗng ở điểm chụp save cuối tick. Nếu cho phép save giữa tick thì phải serialize pending event có thứ tự, bỏ trường world và rebind khi load; bản đầu nên chỉ snapshot ở ranh giới tick.
8. reset() xóa queue và liên kết world cũ; destroy() hủy listener bằng hàm unsubscribe từ EventBus.on.
9. Pause không tích XP; 1× và 50× trong cùng số ngày, cùng chuỗi hành động phải có XP như nhau.

## 11. Trạng thái tinh thần và trải nghiệm

### 11.1. Điểm cân bằng

```text
target = clamp(
    0.2 * mindset
  + traitMentalBias
  + needsPressure
  + relationshipSupport
  + environmentSupport
  + memoryPressure,
  -100, 100)

tauDays = clamp(7 / recoveryFactor, 2, 30)
alpha = 1 - exp(-elapsedDays / tauDays)
mentalState += (target - mentalState) * alpha
mentalState = clamp(mentalState, -100, 100)
```

Tính theo từng ngày mô phỏng để target có cùng chuỗi mẫu ở 1× và 50×. Nếu update đi qua nhiều ngày, lặp các ngày cần tính với điều kiện đã được hệ mô phỏng cập nhật, không lấy một snapshot hiện tại giả cho lịch sử đã bỏ qua.

`recoveryFactor` mặc định1, traits clamp0.5..2. Không dùng tích phân Euler `state += ... * dt` không giới hạn với bước thời gian lớn vì có thể vượt miền và dao động.

Giá trị nền đề xuất: nhu cầu đói/khát/ngủ nguy cấp đóng góp tối đa −20 tổng; môi trường an toàn/tĩnh lặng +5; quan hệ hỗ trợ +0..10; không có đồng bạn không bị phạt cố định đến mức không thể hồi phục. Hệ chưa có dữ liệu môi trường cụ thể dùng 0, không lấy tên khu vực để đoán.

### 11.2. Áp lực ký ức mới

```text
pressure(record, day) = emotion * 2^(-(day-createdDay)/halfLifeDays)
memoryPressure = clamp(sum(top 5 pressures by absolute value), -70, 30)
```

| Biến cố | Emotion đầu | Half-life | Thời gian tối thiểu trước suy ngẫm |
|---|---:|---:|---:|
| Thất bại đột phá | −12 | 15 ngày | 3 ngày |
| Thoát trận nguy hiểm | −10 | 10 ngày | 3 ngày |
| Mất bạn thân | −25 | 60 ngày | 15 ngày |
| Mất cha/mẹ/con/đạo lữ | −40 | 120 ngày | 30 ngày |
| Thành tựu lớn | +15 | 20 ngày | Không cần |

Không đổi `MemoryComponent` hiện tại thành nguồn đếm kinh nghiệm. Dùng ExperienceRecord với ID sự kiện gốc; có thể ghi đồng thời một ký ức UI để kể chuyện. Khi ký ức UI bị cắt vì quá 40 bản ghi, XP và experience quan trọng vẫn không mất.

Khi quá 24 experience: bỏ bản đã resolved có áp lực còn lại nhỏ nhất trước, rồi bản chưa resolved có mức nghiêm trọng thấp nhất; hòa thì bỏ bản cũ hơn rồi ID. Không loại experience đang được step suy ngẫm khóa; nếu chỉ còn bản khóa thì hoãn thêm và ghi diagnostic. Loại bản ghi không cấp XP, không xóa khóa producer/cooldown và không cho dựng lại cùng biến cố sau load. Nếu cần giảm tải tâm trạng của các biến cố nhỏ liên tiếp, gộp áp lực theo kind/ngày trước khi tạo bản mới; không gộp ID đã nhận thưởng thành một cơ hội thưởng khác.

### 11.3. Suy ngẫm và hóa giải

Thêm goal `REFLECT_RECOVER` và step `REFLECT_EXPERIENCE`. Cần:

- Có experience chưa resolved/growthAwarded và đã qua readyForReflectionAtDay.
- Không chiến đấu, không nguy cấp đói/khát, còn sống, có nơi đứng hợp lệ. Không yêu cầu phải có tông môn để người phàm vẫn hồi phục được.
- Mỗi ngày thực hiện đủ một phiên yên tĩnh 1 ngày mô phỏng tăng reflectionDays tối đa1. Bị gián đoạn không nhận nguyên một ngày.
- requiredReflectionDays = 3 với thất bại nhỏ; 5 với nguy hiểm; 10 với mất bạn; 20 với mất người thân gần.
- Hoàn tất: giảm cường độ cảm xúc còn 40% để ký ức không biến mất hoàn toàn, đánh dấu resolvedAtDay, phát reflection_completed một lần. Sau đó áp decay bình thường.
- Ghi “Đã dần hóa giải…” trong lịch sử, không dùng câu “đã quên người thân”.
- Ngồi thiền thông thường có thể hồi mentalState qua thời gian, nhưng không được tự hoàn thành mọi experience và nhận XP tâm cảnh nếu không có step reflection.

### 11.4. Tránh vòng suy sụp vĩnh viễn

Tâm trạng thấp không tự trừ willpowerXp/mindsetXp. Khi mentalState<−40, AI tăng nhu cầu nghỉ/đàm đạo/suy ngẫm. Không cấm mọi hành động giúp hồi phục chỉ vì trạng thái đang thấp.

Phiên bản lõi không tự thêm bệnh tâm lý vĩnh viễn hoặc buộc nhân vật tấn công bừa bãi. Tâm ma, thương tổn tinh thần dài hạn và khả năng chữa trị chuyên sâu là cơ chế riêng, cần thêm lựa chọn hồi phục nếu triển khai.

## 12. Nối vào AI, tu luyện và chiến đấu

### 12.1. Đăng ký và thứ tự xử lý

Trong `Engine` tạo instance và đăng ký như hệ hiện có, không tạo singleton chứa world cố định:

| Thành phần mới | Ưu tiên đề xuất | Trách nhiệm |
|---|---:|---|
| DerivedStatsSystem hoặc flush dirty trước gameplay | 18 | Rebuild thay đổi từ tick trước trước khi AI priority19 đọc |
| MentalStateSystem | 18.5 | Tích phân cảm xúc theo ngày, không phát XP |
| GrowthSystem | 90 | Thu và giải quyết event cuối tick, cập nhật XP, experience, cache |

Cho `grantTrait/evolveTrait` rebuild đồng bộ đúng entity khi transaction cần chỉ số mới ngay; dirty flush đầu tick xử lý các thay đổi hàng loạt còn lại. Không giữ `priority=90` rồi để đột phá trong cùng tick đọc chỉ số cũ sau khi nhận trait.

`resetWorldState()` phải gọi reset của tất cả hệ mới. `destroy()` phải hủy listener. Test tạo hai ECSWorld trong cùng process không được làm entity số1 ở world B nhận event của world A.

### 12.2. Bản đồ điểm phát sự kiện

| File/hàm hiện tại | Điểm nối cụ thể | Không được làm |
|---|---|---|
| `BehaviorTreeExecutor.tick` | Ngay sau step thật sự success và trước/đồng thời đánh dấu nextStep, phát completion có planRevision/stepIndex | Phát mỗi lần status=running |
| `BehaviorTree.executeWork/executeInteract` | Ghi actualOutput/progress vào kết quả step, có đủ tài nguyên và mục tiêu | Thưởng nếu bị kẹt đường hoặc không có nguyên liệu |
| `CommunityTaskBoard` hoàn tất công trình/nhiệm vụ | Producer cho trách nhiệm lớn; cùng task chỉ chọn một nơi phát | Vừa board vừa behavior cùng thưởng không có chung ID |
| `CultivationSystem` nhánh đột phá tiểu cảnh giới | Succeeded/failed với realmTarget và attemptId | Lấy chuỗi log để suy ra thành công |
| `TribulationSystem` kiếp hoàn tất | Phát một event cho milestone; gọi TraitService cho Lôi Kiếp Tôi Thể | Phát theo từng tia sét |
| `CombatSystem` | Ghi contribution vào encounter tracker; kết thúc encounter mới xét XP | Thưởng cố định mỗi đòn hoặc mỗi mạng |
| `CorpseAndGraveSystem` chuyển sinh linh sang corpse lần đầu | Tạo bereavement cho quan hệ thân cận hợp lệ | Quét mỗi tick thấy corpse rồi tạo lại mất mát |
| `SocialInteractionSystem` | Phân biệt trò chuyện thường và mentoring đã đủ điều kiện | Cứ emit social:speech là +tâm cảnh |
| `BuildingSystem` nhánh alchemy_chamber và hệ job nghề tương lai | Chỉ phát khi đã có workerId, jobId và output thật; hiện tại sản xuất tự động không cho XP cư dân | Gán thưởng cho người gần lò nhất hoặc thưởng vì uống đan trong AlchemySystem |

Nhánh thất bại của hành vi do A* timeout là lỗi tác vụ, không phải “nghịch cảnh rèn tâm”. Không thưởng failureInsight hay tạo experience trưởng thành cho lỗi kỹ thuật/pathfinding.

### 12.3. Bổ sung action AI suy ngẫm

Sửa `AIComponents.ts` thêm goal và step nêu ở mục 11, cập nhật `utilityScores`, `getGoalName`, `getGoalBadgeColor`, switch trong planner/executor và mọi phép exhaustiveness.

Utility đề xuất:

```text
Nếu có nguy hiểm chiến đấu/nhu cầu sinh tồn nguy cấp: giữ goal sinh tồn hiện tại.
Nếu chưa đủ tuổi/khai trí hoặc không có experience sẵn sàng: reflectScore=0.
Nếu có experience sẵn sàng:
  reflectScore = clamp(25 + max(0, -mentalState)*0.5 + min(15, unprocessedCount*3), 0, 75)
```

- Không đưa reflectScore lên cao hơn sinh tồn cấp thiết.
- Sắp experience theo độ nghiêm trọng giảm dần, rồi ngày tăng dần, rồi ID. Đã khóa một experience trong step thì không đổi mỗi frame.
- Planner tìm điểm nghỉ hiện có hoặc vị trí an toàn hiện tại; không bắt buộc tạo công trình mới.
- Đặt `customData.experienceId` hoặc payload có kiểu cho step. Save/load phải giữ ID này.
- Chỉ trạng thái `REFLECT_EXPERIENCE` thật sự diễn ra mới tăng progress. `MOVE_TO`, ngủ hoặc nhàn rỗi không giả làm suy ngẫm.
- UI có thể ghi “Suy ngẫm về thất bại”, “Tĩnh tâm sau biến cố”; dùng ActivityFeedback hiện tại, không đưa chữ dài trở lại combat floating text.

### 12.4. Ý chí/tâm cảnh phải có tác dụng thực tế

Điểm P là thông tin đánh giá, không nhân thẳng mọi chỉ số lên bằng P. Từng thành phần có vai trò riêng:

- Ngộ tính: học công pháp và bonus đột phá thông qua adapter hiện có; không vừa thêm bonus trực tiếp vừa thêm lại cùng bonus từ trait Ngộ Tính Siêu Phàm nếu đó là cùng nguồn.
- Tư chất: căn cơ/root factor, khả năng tuyến tu luyện.
- Thể chất: đánh giá nền căn cốt, trait effect điều khiển sức khỏe/chiến đấu; bản đầu không tự thêm một HP multiplier mới từ điểm physique vào công thức vốn đã có trait.
- Ý chí: giảm dao động vì thất bại, giữ hành động rèn luyện trong điều kiện an toàn, hỗ trợ chống kiếp có giới hạn.
- Tâm cảnh: hỗ trợ ổn định khi đột phá và hồi phục tinh thần, không buộc người điểm cao phải nhân từ hoặc người Ma tộc phải thấp.

Bonus đột phá từ trưởng thành đề xuất:

```text
growthBreakthroughBonus = 0.08*(willpower/100) + 0.12*(mindset/100)
stateFactor = clamp(1 + mentalState/500, 0.80, 1.10)
Pbreak = clamp((PexistingWithoutGrowth + growthBreakthroughBonus) * stateFactor, 0.05, 0.95)
```

`PexistingWithoutGrowth` là xác suất hiện tại sau khi chuẩn hóa trait root và bonus có trần. Không đồng thời áp công thức đột phá tích sáu hệ số của V2 trong cùng gói; như vậy sẽ thay cân bằng quá nhiều và khó xác định nguồn lỗi. Lưu xác suất cuối vào dữ liệu diagnostic cho test, không ép UI người chơi đọc công thức.

Giảm sát thương lôi kiếp từ ý chí ở bản đầu:

```text
willReduction = 0.15 * (willpower/100)
damageAfterWill = max(1, floor(damageBeforeWill * (1-willReduction)))
```

Không dùng 200 làm mẫu số khi thuộc tính đã chuẩn hóa 0–100. Cơ chế Tâm Ma đầy đủ chưa có trong lõi thì `heartDemonResistance` là planned; không nhận đã hỗ trợ chỉ vì có một trường số.

### 12.5. Sở trường nghề và đường tu luyện

Giữ dữ liệu `learningAffinity` như thông tin hỗ trợ, không sinh thêm sáu trục độc lập phải đồng bộ với năm điểm trong mốc Lõi. UI có thể hiển thị các sở trường đang có gameplay; phần chưa có ghi rõ chưa hỗ trợ trong công cụ phát triển, không hứa tác dụng cho người chơi.

Mốc mở rộng mới bổ sung PathAffinityService và từng nghề/con đường thật. Khi đó dùng C/A/B/W/M làm đầu vào cùng affinity chuyên môn, không sửa công thức P. Không dùng điểm nghề để phong chủng tộc khác thành “vô dụng” chỉ vì họ chưa có bàn tay.

## 13. Giao diện và hiển thị tên

### 13.1. Inspector

Thêm khối “Tiềm năng” vào bảng thông tin cư dân:

```text
Tiềm năng: 65,5 / 100 — Ưu tú

Ngộ tính      80,0     đóng góp 24,0 / 30
Tư chất       70,0     đóng góp 10,5 / 15
Thể chất      60,0     đóng góp  6,0 / 10
Ý chí         60,0     đóng góp 15,0 / 25
Tâm cảnh      50,0     đóng góp 10,0 / 20

Trạng thái tinh thần: Đang lo âu (−24)
Gần đây: +4 XP ý chí, +6 XP tâm cảnh — Hóa giải thất bại đột phá.
```

- Khối bẩm sinh ghi tổng /55, trưởng thành /45.
- Tooltip phân biệt XP và điểm; không ghi “+6 tâm cảnh” nếu chỉ được +6 XP.
- Trẻ chưa thức tỉnh: tư chất “Chưa thức tỉnh”; điểm tổng “Chưa đánh giá đầy đủ”. Không hiển thị root tiềm ẩn qua tooltip vô tình.
- Người lớn migration thiếu căn cơ gốc: có ghi chú ngắn “Ước tính từ dữ liệu cũ” ở inspector khi cần, không spam world log.
- Badge trait: tên, bậc1–5, nguồn, active/dormant; tooltip chỉ mô tả hiệu ứng đã có handler.
- UI lấy dữ liệu plain text an toàn qua `textContent` hoặc escape. Không đưa tên người chơi/chuỗi save vào HTML thô.
- Chỉ refresh khi entity được chọn và revision thay đổi, hoặc theo nhịp UI hiện có; không render lại toàn inspector 60 lần/giây do cảm xúc.

### 13.2. Lọc nhãn tên

```text
eligible = sống
        AND (normalizedRealm >= 2
             OR (assessmentComplete AND potential >= 80))
```

- Chuẩn hóa cảnh giới chỉ từ stageIndex/chain, không dùng combatPower để người Luyện Khí mặc đồ mạnh thành Trúc Cơ.
- Giữ điều kiện zoom>=1× hiện có. Nhân vật không đủ điều kiện vẫn chọn được và xem tên trong inspector.
- Xóa điều kiện “có hai trait bậc Thiên” và “Thiên Linh Căn luôn hiện tên” cũ sau khi điểm mới hoạt động.
- Không query/sort toàn dân số để tính top1% mỗi frame; ngưỡng 80 là ngưỡng tuyệt đối.
- Trần đề xuất 12 nhãn đang thấy; ưu tiên selected nếu đủ điều kiện, rồi cảnh giới, rồi P, rồi entityId. Bỏ nhãn chồng lấn.
- Font Noto Sans đang có, cỡ chữ theo screen pixel giới hạn hiện tại; không nhân cỡ chữ vô hạn theo camera.zoom.
- Mộ/thi hài giữ quy tắc cảnh giới đã có, không dùng growth XP sau chết. Di vật là nhãn vật thể riêng.
- Không khôi phục các đường vẽ chữ hoạt động đã chuyển sang ActivityFeedback.

### 13.3. Biên niên sử và log

Chỉ ghi những mốc lớn: lần đánh giá đầy đủ đầu tiên, đổi phẩm tiềm năng, đạt mốc trưởng thành25/50/75/100, thức tỉnh huyết mạch, hóa giải biến cố lớn. Không log mỗi +0.5 XP.

Mốc đã ghi cần có khóa để load không spam lại. CharacterHistory chỉ là nhật ký, không dùng việc nhật ký bị cắt để cho phép thưởng mốc lần hai.

## 14. Lưu, nạp và di trú dữ liệu

### 14.1. Phiên bản

Thêm `traitSystemVersion: 3` và `talentGenerationVersion: 1` vào metadata/settings của save hoặc khối riêng được SaveTypes khai báo. Đừng coi `metadata.version` của định dạng save toàn game là phiên bản duy nhất của catalog.

Định dạng V3 phải lưu:

| Dữ liệu | Bắt buộc lưu |
|---|---|
| Traits | Entries, origin, acquiredAtDay, sourceEventId, dormant/legacy |
| Talent | Base, pendingRoot, lineageTags, knowledge, birthSeed, seedClass, foundation changes, legacy anchor |
| Growth | Hai XP, mentalState, lastIntegratedTick, cooldowns, day buckets, family day buckets, recent event IDs, milestone, experiences, recent gains |
| Derived stats | Baseline chưa chứa trait, các anchor cần bảo toàn save cũ |
| World | birthOrdinal, phiên bản generator, các counter encounter/plan cần chống replay |
| Cache | Không bắt buộc lưu; rebuild từ nguồn khi load |

`ReadonlyMap`, `Set` và class instance chuyển sang array/object JSON rõ ràng; load khôi phục lại class bằng constructor.

### 14.2. Giao dịch load an toàn

1. Validate phần bắt buộc của save trước khi tác động world hiện tại như cơ chế hiện có.
2. Tạo stagingWorld, đọc component legacy hoặc V3.
3. Migrate trong staging với options `emitEvents:false`, `grantGrowth:false`.
4. Xác thực toàn bộ điểm/trait/counter và xây cache trong staging.
5. Chỉ khi mọi bước thành công mới reset hệ của world hiện tại rồi replaceEntitiesFrom.
6. Rebind các hệ vào world đang chạy, đặt lastIntegratedTick bằng tick save khi thích hợp; không giả lập hàng chục năm offline vì máy đã tắt.
7. Nếu lỗi: giữ nguyên world, thời gian, entity counter và cache đang chơi theo giao dịch hiện tại. Không để schema lỗi khiến thế giới bị xóa.

### 14.3. Quy tắc di trú trait cũ

- Danh mục đang chạy có 105 ID, chỉ 98 xuất hiện trong nguồn V2. Bảy ID còn lại không được bỏ.
- Tạo `legacy-traits.config.ts` chứa snapshot các định nghĩa cũ cần đọc; chỉ dùng compatibility/migration, không nhân toàn bộ snapshot và config V3 cùng lúc.
- Với ID có trong V3: giữ ID và quyền sở hữu; cập nhật metadata theo schema mới. Nếu một trait từng bị gán sai race, đánh dấu legacyGrandfathered, giữ thông tin; không sinh thêm trường hợp mới.
- Với unknown ID: giữ entry legacy và raw ID, tooltip “Đặc điểm từ bản lưu cũ”; không crash, không tự gán một trait mạnh cùng tên gần giống.
- Không đổi alias chỉ dựa trên tên Việt. Mỗi alias cần bảng oldId -> newId và test.
- Nếu nhiều ID cũ xung đột mới: giữ entries để không mất dữ liệu, chọn một hiệu ứng active trong exclusive group theo bậc giảm dần rồi ID; phần còn lại dormant với lý do. Baseline ở mục14.5 bảo toàn chỉ số snapshot, không tăng chồng lại.
- Technique ID phải chuyển về công pháp hoặc legacy compatibility đúng nguồn; không tự biến công pháp thành trait bẩm sinh.

Bảy ID cần quyết định tường minh:

| ID cũ | Xử lý lần đầu |
|---|---|
| `van_thu_chi_huu` | Giữ legacyOnly; không tự đồng nhất với Ngự Thú Sư hậu thiên |
| `ngu_long_bi_thuat` | Giữ legacyOnly ở tuyến công pháp/kỹ năng tương ứng |
| `uy_nghiem_trang_trong` | Giữ legacyOnly; có thể lập alias sau khi cân bằng |
| `hien_hoa_nhan_hau` | Giữ legacyOnly, không tự xóa tính cách |
| `truong_sinh_quyet` | Kiểm tra TECHNIQUE_DEFINITIONS; ưu tiên công pháp, không roll như trait mới |
| `hoa_viem_chan_kinh` | Tương tự, không nhận hiệu ứng hai lần |
| `dan_dao_nhap_mon` | Tương tự, bảo toàn năng lực đang có |

Ngoài bảy ID thiếu, có một ID **trùng chuỗi nhưng đổi nghĩa**: `an_linh_can`. Giữ nghĩa Ẩn Linh Căn của save cũ, còn Biến Dị Ám Linh Căn trong nguồn V2 dùng ID mới `bien_di_am_linh_can`. Đây là trường hợp tương thích thứ tám; bảng tên khác nhau ở phụ lục C giúp rà thêm. Dòng276 đổi `kim_giac_tê_huyet` thành `kim_giac_te_huyet` có alias nhập riêng. Không tạo alias toàn cục từ `an_linh_can` cũ sang căn cơ bóng tối mới.

### 14.4. Di trú điểm tiềm năng

Save cũ không đủ dữ liệu để phục hồi chính xác mọi gene chưa có modifier. Không được tuyên bố tách ngược hoàn hảo.

1. `observedC = clamp(c.comp.current / 1000, 0, 100)` nếu có; thiếu thì dùng race default cũ /1000, không RNG.
2. `observedA` từ root đã lưu theo mục6.2. Chưa thức tỉnh thì tạo pendingRoot ổn định và knowledge=estimatedLegacy/unassessed đúng trạng thái.
3. `observedB`: ước tính từ race base physique và trait hiện có, bằng bảng cấu hình legacy riêng: baseline Nhân35, Yêu60, Ma50 + đóng góp physique V3 đã cap. Không lấy HP đã nhân cảnh giới làm điểm.
4. Không có lịch sử rèn luyện đáng tin cậy: người đã trưởng thành và có nhận thức dùng W=25, M=20; newborn/chưa nhận thức dùng0. Ghi backgroundSource=legacy. Không lấy killCount hoặc số dòng history để cộng hàng nghìn XP.
5. Ghi migration anchor để tránh tính trùng:

```ts
interface LegacyPotentialAnchor {
  observedScores: InnateScores;
  traitDeltaAtMigration: InnateScores;
}
```

Khi có anchor:

```text
currentScore = clamp(observedScore
                     + currentTraitDelta - traitDeltaAtMigration
                     + foundationDeltaSinceMigration, 0,100)
```

Không cộng observedScore và toàn bộ currentTraitDelta. Tách đường xử lý anchor rõ ràng khỏi trường hợp newborn V3. Cha mẹ có anchor không cung cấp gene pre-trait chắc chắn; bỏ phần blend di truyền C/B của người đó, vẫn truyền lineage tags hợp lệ.

### 14.5. Di trú chỉ số gameplay đã được nhân sẵn

Snapshot HP/ATK/DEF/armor/move/lifespan trong save đã có trait. Để giữ trạng thái đang chơi:

- Tính aggregate V3 dự định áp cho các trait active đã giải quyết.
- Suy ra baseline còn lại sao cho `rebuild(baseline, aggregateV3, realm) == savedStats`, sai số làm tròn tối đa1 với stat nguyên.
- Ví dụ `savedHpMax=300`, aggregate trait HP=1.5 và scale realm=2: baseline=100. Không đặt baseline=300 rồi nhân1.5 và2 thành900.
- Trường cộng: lấy giá trị snapshot trừ bonusV3 theo đúng thứ tự công thức. Tránh chia0, kiểm tra giới hạn trước khi tạo baseline.
- Nếu component không đủ thông tin để tách, lưu anchor stats tại migration và aggregate tại migration; các thay đổi sau áp theo tỷ lệ/chênh lệch aggregate mới so với anchor. Ghi nguồn estimatedLegacy.
- Giữ HP hiện tại/tỷ lệ sống, cooldown chiến đấu, tuổi và mục tiêu AI. Không hồi đầy HP hay reset đột phá chỉ vì migrate.
- Load lần hai phải đi nhánh V3, không tách ngược lần nữa.

### 14.6. XP và trạng thái sau load

- Clamp XP hữu hạn về0..6000; giá trị không hữu hạn reject save V3 trước commit.
- `dailyBuckets` không có ngày tương lai hoặc trùng ngày; gộp theo ngày nếu dữ liệu legacy chuyển đổi cần làm sạch.
- Cooldown lưu thời điểm ngày tuyệt đối, không reset về0 khi load.
- Experience đã growthAwarded=true không nhận thưởng khi deserialize; pending chưa hoàn thành tiếp tục đúng reflectionDays.
- `lastIntegratedTick > savedTotalTicks` là lỗi hoặc cần đưa về tick save có diagnostic; không tích phân với elapsed âm.
- Reset world/new game không giữ claimedMilestones hoặc cooldown của cư dân cũ cùng entityId.
- Phiên bản traitSystemVersion tương lai chưa hỗ trợ: từ chối rõ ràng và giữ world hiện tại, không thử đoán dữ liệu.

## 15. Danh sách file cần tạo và sửa

### 15.1. File mới đề xuất

| File | Nội dung | Không được chứa |
|---|---|---|
| `src/config/traits/trait.types.ts` | Type/union V3 | Import Engine/Canvas |
| `src/config/traits/common.traits.ts` | Trait chung | RNG hoặc mutation world |
| `src/config/traits/human.traits.ts` | Trait riêng Nhân | Trait nghề chung chỉ vì trước đây thuộc Nhân |
| `src/config/traits/beast.traits.ts` | Trait riêng Yêu, điều kiện lineage/species | Đoán loài bằng tên |
| `src/config/traits/demon.traits.ts` | Trait riêng Ma | Gán mọi Ma cùng trait bậc4 |
| `src/config/traits/legacy-traits.config.ts` | Snapshot/alias cũ cần migrate | Pool sinh mới |
| `src/config/talent.config.ts` | Trọng số, base generation, seed budget, root map, màu phẩm | Ngưỡng rải trong UI |
| `src/config/mental-growth.config.ts` | XP, cooldown, trần, ký ức, tau | Thời gian thực |
| `src/modules/traits/TraitCatalog.ts` | Registry, validator, index theo race/tier | Lặp parse markdown lúc game chạy |
| `src/modules/traits/TraitService.ts` | Grant/remove/evolve/activation | Tự thưởng lại mỗi lần resolve |
| `src/modules/traits/TraitEffectResolver.ts` | Tổng hợp modifier, chống double count | RNG |
| `src/modules/traits/DerivedStatsService.ts` | Rebuild idempotent | Nhân vào stat đã được nhân |
| `src/modules/talent/TalentComponents.ts` | TalentProfile, GrowthMind, baseline/anchor DTO | UI DOM |
| `src/modules/talent/PotentialCalculator.ts` | Hàm thuần điểm và XP conversion | EventBus/Math.random |
| `src/modules/talent/TalentGenerator.ts` | Roll có seed và điều kiện | Roll lại khi load |
| `src/modules/talent/GrowthEvents.ts` | Event union, ID và payload | Dùng text sự kiện làm khóa |
| `src/modules/talent/GrowthSystem.ts` | Queue, dedupe, XP, milestones | Chấm điểm mỗi frame render |
| `src/modules/talent/MentalStateSystem.ts` | Tích phân trạng thái, áp lực experience | Trừ XP vì tâm trạng |
| `src/modules/talent/EncounterTracker.ts` | Gộp cú đánh thành encounter có bằng chứng | XP theo mỗi mạng giết |
| `src/modules/save/TraitTalentMigration.ts` | Pure migration/anchor | Phát reward/load side effect |

Không bắt buộc tạo một System rỗng chỉ để đúng tên file. Các module thuần có thể là function/service. Nếu gộp file, ghi mapping trong tài liệu trạng thái để mô hình tiếp theo tìm được.

### 15.2. File hiện có cần sửa

| File | Thay đổi |
|---|---|
| `src/config/traits.config.ts` | Thành facade re-export giữ đường import cũ; đổi tier1–5; bỏ random sorter cũ |
| `src/config/races.config.ts` | Bổ sung base generation/capability phù hợp hoặc tham chiếu config mới; không giữ pool quyết định thứ hai |
| `src/config/archetypes.config.ts` | Tách curated preset và natural generation, origin rõ |
| `src/modules/beings/BeingComponents.ts` | Refactor Traits, adapter Comprehension, re-export class mới nếu cần tương thích |
| `src/modules/beings/BeingFactory.ts` | Tạo profile trước derived stats; truyền parent profiles khi newborn; RNG |
| `src/modules/beings/ReproductionSystem.ts` | Context sinh tự nhiên và counter; bảo toàn gia đình/ngoại hình |
| `src/modules/cultivation/SpiritualRootSystem.ts` | Reveal pendingRoot; không roll lại |
| `src/modules/cultivation/CultivationSystem.ts` | Resolver Qi/đột phá, milestone events, adapter ngộ tính |
| `src/modules/cultivation/TribulationSystem.ts` | TraitService, event một lần/kiếp, giảm damage từ W |
| `src/modules/ai/brain/AIComponents.ts` | Goal/step reflection, planRevision và dữ liệu save cần thiết |
| `src/modules/ai/brain/goals/StrategicGoal.ts` | Utility reflection/recovery giữ ưu tiên sinh tồn |
| `src/modules/ai/brain/planner/AIPlanner.ts` | Tạo step suy ngẫm và stable IDs |
| `src/modules/ai/brain/behavior/BehaviorTree.ts` | Completed event có bằng chứng, executor reflection |
| `src/modules/ai/systems/ThreeTierAISystem.ts` | Reset, đọc TraitService; giữ AI hiện tại |
| `src/modules/ai/community/CommunityTaskBoard.ts` | Task result nguồn XP có ID, phân định producer |
| `src/modules/combat/CombatSystem.ts` | Encounter tracker, đọc chỉ số đã resolved |
| `src/modules/beings/CorpseAndGraveSystem.ts` | Một sự kiện chết/quan hệ; không tưởng corpse mới mỗi frame |
| `src/modules/social/SocialInteractionSystem.ts` | Nối hỗ trợ tinh thần/mentoring hợp lệ |
| `src/modules/alchemy/AlchemySystem.ts` | Giữ dùng đan/hồi sinh; cập nhật ledger stat vĩnh viễn, không giả làm producer chế tác |
| `src/modules/factions/BuildingSystem.ts` | Phân biệt sản xuất tự động và job có người làm; giữ kho thế lực, không phát XP vô chủ |
| `src/modules/ai/NeedsSystem.ts` | Dùng tổng hợp hunger/thirst modifier một lần nếu hỗ trợ |
| `src/modules/factions/FactionSystem.ts` | Cập nhật các chỗ đọc mảng trait/ngộ tính, không phá tuyển mộ/lập tông |
| `src/core/Engine.ts` | Đăng ký, reset, birth context, điểm chụp save cuối tick |
| `src/modules/save/SaveTypes.ts` | Khai báo DTO/version/counter mới |
| `src/modules/save/SaveManager.ts` | Serialize/staging migration/rebind |
| `src/ui/InspectorPanel.ts` | Năm điểm, total, trạng thái, origin/tier, không HTML unsafe |
| `src/renderer/systems/EntityRenderer.ts` | Lọc theo P và realm, giữ zoom/font |
| `tests/ai-regression.ts`, `tests/run.mjs` | Đăng ký test mới theo runner đang dùng |

Trước khi sửa: chạy `rg -n "TraitsComponent|innateTraits|trainingTraits|techniqueTraits|ComprehensionComponent|TRAIT_DEFINITIONS" src tests` để rà mọi consumer. Danh sách trên là mốc đã kiểm tra, không thay thế việc tìm kiếm nếu repo đã thay đổi.

## 16. Các gói công việc để giao mô hình

Không giao “code toàn bộ 300 trait” trong một lượt. Làm tuần tự từng gói; mỗi gói phải để dự án build được, cập nhật báo cáo trạng thái và không tuyên bố các gói sau đã xong.

### A00 — Chụp hiện trạng và khóa phạm vi

**Đọc:** tài liệu này, package.json, ECS/World, TimeManager, BeingFactory, traits.config, SaveManager và các test hiện có.

**Thực hiện:** chạy baseline `npm test`, `npm run build`; ghi lỗi có sẵn nếu có. Tạo `docs/TRAIT_TALENT_IMPLEMENTATION_STATUS.md` với A00–A14, trạng thái pending/doing/done/blocked và bằng chứng. Kiểm kê mọi nơi đọc hoặc sửa trait. Chưa thay đổi tính năng.

**Nghiệm thu:** xác định được runner, đường dẫn file thật và hành vi hiện tại. Nếu repo đã đổi so với đặc tả, cập nhật mapping, không dựa vào số dòng cố định.

### A01 — Schema, hàm điểm và DTO độc lập

**Tạo:** trait.types, talent.config, mental-growth.config, TalentComponents, PotentialCalculator.

**Thực hiện:** đưa trọng số cố định vào hằng số và validate tổng bằng 1. Implement clamp hữu hạn, chuyển đổi XP, hàm điểm thuần và kiểu legacy anchor. Chưa thay BeingFactory.

**Kiểm thử:** ví dụ 60.5; toàn 0/toàn 100; ý chí tăng 20 làm tổng tăng 5; roundtrip XP; dữ liệu NaN; thứ tự trait; trạng thái tinh thần không làm đổi P.

**Nghiệm thu:** TypeScript sạch, test thuần chạy trong Node mà không cần document/window/Canvas.

### A02 — Nhập 300 ID và phân loại V3

**Tạo/sửa:** bốn file catalog, facade traits.config, TraitCatalog validator, bảng legacy.

**Thực hiện:** nhập dữ liệu phụ lục A, giữ ID; áp override origin/race/vector; mở bậc 1–5; chuyển 21 nghề sang common; khai báo primary root và exclusive groups. Xác định implementation của mỗi ID; xuất báo cáo active/planned cùng key còn thiếu từ phụ lục B.

**Không thực hiện:** xóa trait giống tên, ép cả 300 active, dùng chuỗi tiếng Việt làm mã điều kiện hoặc thay hiệu ứng đoạt xá bằng tăng ATK.

**Kiểm thử:** đủ 300 ID nguồn và registry legacy riêng; ID duy nhất; race/origin/tier hợp lệ; mọi tham chiếu tồn tại; không có vòng tiến hóa; planned không spawn; chuyển thế cần seed riêng.

**Nghiệm thu:** validator xác thực toàn catalog. Tính thống kê V3 từ dữ liệu thực sau phân loại lại, không sao chép tỷ lệ 165/45/45/45 của V2.

### A03 — TraitService và resolver có thể gọi lặp an toàn

**Tạo/sửa:** TraitService, TraitEffectResolver, DerivedStatsService, StatBaselineComponent; giữ facade tương thích cho nơi đọc cũ.

**Thực hiện:** giao dịch grant/remove/evolve; loại ID trùng; kiểm tra exclusive/conflict; snapshot baseline; diminishing; root factor từ một nguồn; adapter công pháp.

**Kiểm thử:** thêm cùng trait hai lần chỉ tác dụng một lần; bỏ trait khôi phục đúng; tiến hóa không cộng cả cũ và mới; nhận trait sai chủng tộc không làm thay đổi dữ liệu; người chết không sống lại; HP giữ tỷ lệ; rebuild 100 lần không tăng stat.

**Nghiệm thu:** hiệu ứng nền có handler thật và được gọi qua resolver chung. Tooltip chỉ phản ánh hiệu ứng đã hỗ trợ.

### A04 — Save schema và migration trước khi bật sinh mới

**Tạo/sửa:** TraitTalentMigration, SaveTypes, SaveManager.

**Thực hiện:** serialize component mới, baseline/anchor; đọc 105 ID cũ; xử lý bảy ID thiếu và trường hợp `an_linh_can` đổi nghĩa; load trong staging; giá trị legacy mặc định; lưu cooldown, novelty, milestone và experience; từ chối phiên bản tương lai chưa biết.

**Kiểm thử:** fixture save cũ; HP/Qi không nhân đôi; load lần hai giữ điểm; unknown trait giữ ID; load lỗi không xóa world; ngộ tính cũ 100000 thành 100; root 0 không bị thay mặc định.

**Nghiệm thu:** có thể tạo dữ liệu V3 mà vẫn đọc save cũ. Không hoãn migration đến cuối dự án.

### A05 — Sinh bẩm sinh, di truyền và thức tỉnh

**Tạo/sửa:** TalentGenerator, BeingFactory, ReproductionSystem, SpiritualRootSystem, cấu hình archetype/race.

**Thực hiện:** GenerationContext có seed; phân biệt natural/curated; birthOrdinal; budget và tier cap; điều kiện lineage; truyền cha mẹ trước khi sinh; pendingRoot; bối cảnh người trưởng thành.

**Kiểm thử:** newborn XP=0; cùng seed tạo cùng hồ sơ; đổi RNG ngoại hình không đổi root; con không nhận XP cha mẹ; sói không nhận đặc điểm cánh sai loài; planned không spawn; 12 tuổi không roll lại; giữ ngoại hình và gia đình.

**Nghiệm thu:** entity mới dùng V3, save cũ giữ dữ liệu đã migrate. Nếu test ngoại hình cũ so sánh nguyên JSON Traits nhưng activation được phép thay đổi, sửa thành kiểm tra ID/origin không bị roll lại; không xóa test.

### A06 — XP và hàng đợi sự kiện độc lập

**Tạo:** GrowthEvents, GrowthSystem.

**Thực hiện:** event ID ổn định; kiểm tra world; dedupe; milestone; novelty; cooldown; giới hạn ngày/30 ngày; trần nguồn; clamp XP; recent gains; reset/destroy.

**Kiểm thử:** event fixture có bằng chứng; event trùng, cũ, sai world; routine cap; experience cap; milestone đã nhận; hai world cùng entity ID; pause; bước thời gian khác nhau; save ở ranh giới tick.

**Nghiệm thu:** XP đúng bảng và không tăng theo render FPS. Chưa ghi “NPC đã rèn luyện” nếu producer thật chưa nối.

### A07 — Producer lao động, thiền, đột phá và kiếp

**Sửa:** BehaviorTree, AIComponents, AIPlanner, CommunityTaskBoard, CultivationSystem, TribulationSystem. Nghề luyện đan chỉ nối khi đã có job/worker/output thật theo mục 12.2; uống đan trong AlchemySystem không phải producer luyện nghề.

**Thực hiện:** planRevision, khóa hoàn thành ổn định, bằng chứng output; chọn đúng một producer cho mỗi hành động; grant Lôi Kiếp qua TraitService; mỗi đại kiếp một phần thưởng.

**Kiểm thử:** chạy kế hoạch thật thành công có XP; A* timeout không XP; thiếu nguyên liệu không XP; thiền chưa đủ phiên không XP; nhiều tia sét chỉ một milestone; thất bại chỉ tạo experience; save/resume không thưởng lại step.

**Nghiệm thu:** recent gains xuất hiện từ AI thật trong fixture, không chỉ từ event mock.

### A08 — Encounter và mất mát

**Tạo/sửa:** EncounterTracker, CombatSystem, CorpseAndGraveSystem, đọc quan hệ xã hội.

**Thực hiện:** gộp đòn thành encounter; đo độ khó; kiểm tra đóng góp/sống sót; tránh lặp một đối thủ; phát death event một lần; xác định cha/mẹ/con/đạo lữ/bạn thân bằng dữ liệu quan hệ.

**Kiểm thử:** giết mục tiêu yếu không XP; không thưởng mỗi đòn; kill và corpse không tạo hai mất mát; người xa lạ không gây tang sự như người thân; corpse trong save không phát lại; encounter đang dở load được.

**Nghiệm thu:** chiến đấu rèn ý chí từ thử thách thật, không trở thành cách farm XP dễ nhất.

### A09 — Tinh thần và suy ngẫm

**Tạo/sửa:** MentalStateSystem, ExperienceRecord, goal/step reflection, StrategicGoal, AIPlanner, BehaviorTree.

**Thực hiện:** suy giảm áp lực ký ức; hồi phục theo hàm mũ; tiến độ suy ngẫm; ngày sẵn sàng; gián đoạn; thưởng một lần; cảm xúc không trừ XP.

**Kiểm thử:** mất người thân làm trạng thái giảm nhưng P giữ nguyên; một phiên thiền không xóa tang thương; suy ngẫm đủ ngày mới có XP; load giữ tiến độ; ưu tiên nhu cầu nguy cấp; 1×/50× cho kết quả như nhau.

**Nghiệm thu:** cư dân có đường phục hồi thật, không kẹt mãi ở goal lỗi hoặc cảm xúc thấp.

### A10 — Gameplay đọc chỉ số mới

**Sửa:** nơi đọc thuộc tính trong Cultivation/Combat/Needs/Alchemy/Faction, Engine flush/reset.

**Thực hiện:** áp bonus W/M/state đúng một lần; adapter ngộ tính; bỏ tính trùng root; cache theo revision; giữ thang ngộ tính cũ cho hệ thế lực đang cần. Chuyển tăng chỉ số vĩnh viễn do đan dược sang ledger `permanentStatAdjustments`, để rebuild trait không xóa hiệu quả đã nhận.

**Kiểm thử:** root và trait Thiên Linh Căn không thành 5.7×; đổi trang bị không đổi P; lượng Qi tăng theo môi trường nhưng P không đổi; Trúc Cơ vẫn lập tông đúng; HP không tăng khi load; kiểm tra race mới không phá save cũ.

**Nghiệm thu:** không còn hai vòng riêng nhân cùng đặc điểm; đã rà mọi consumer bằng rg.

### A11 — Inspector, badge và nhãn tên

**Sửa:** InspectorPanel, EntityRenderer, mọi view đang giới hạn bậc 4.

**Thực hiện:** năm thanh thuộc tính, đóng góp, tổng điểm, cảm xúc riêng; nguồn/bậc 5; ẩn root chưa đánh giá; nhãn dùng P>=80; giữ font, zoom và giới hạn tránh chồng.

**Kiểm thử:** fixture đúng 60.5; badge bậc 5; căn cơ ẩn không lọt qua tooltip; P=79.9 không hiện nhãn, P=80 đã đánh giá thì hiện; Trúc Cơ vẫn hiện; zoom0.2 ẩn nhãn; tên trong save không thực thi HTML.

**Kiểm tra ảnh:** xem khung đông cư dân ở 0.2×, 1×, 2×; kiểm tra font Việt, độ rộng panel và nhãn chồng. Nếu dùng browser headless, đặt profile trong temp ngoài repository để Vite không watch cache trình duyệt bị khóa.

### A12 — Catalog hoàn thiện và báo cáo coverage

**Thực hiện:** rà toàn bộ trait nguồn; thống kê active/planned/legacyOnly; map mọi modifier ở phụ lục B; kiểm tra tên/mô tả/nguồn; điều kiện lineage/capability; trait active có tác dụng thực tế.

**Kiểm thử:** validation 300 ID; mỗi handler có ca đại diện; alias; origin đã sửa; nghề chung không chặn Yêu đủ điều kiện.

**Nghiệm thu:** báo cáo coverage giải thích đúng phần đã chạy. Trait planned trở thành backlog có phụ thuộc rõ; không gọi là đã hoàn thiện cả 300 hiệu ứng.

### A13 — Cân bằng và hồi quy đầy đủ

**Thực hiện:** sinh 100000 profile không render; mô phỏng trưởng thành; xuất histogram theo race, seed và điểm; kiểm thử toàn bộ; so sánh benchmark trước/sau.

**Chỉ hiệu chỉnh:** thông số config có bằng chứng thống kê. Không đổi trọng số 30/15/10/25/20. Seed class và phẩm tiềm năng thực phải báo riêng, không ép chúng cùng tên thì cùng kết quả.

**Nghiệm thu:** ma trận mục17 qua; ảnh UI đã được xem; báo cáo có cấu hình, seed, cỡ mẫu và giới hạn.

### A14 — Tài liệu bàn giao và cơ chế mở rộng

**Thực hiện:** cập nhật status cuối, thay đổi, rủi ro, kiểm thử, migration notes và danh sách planned. Mỗi cơ chế mở rộng ghi producer, consumer, persistence, test và điều kiện chuyển active.

**Nghiệm thu:** mô hình tiếp theo tiếp tục được từ status mà không cần đọc lịch sử chat. Không để TODO mơ hồ “bổ sung các hiệu ứng khác”.

Thứ tự phụ thuộc: A04 trước A05 để có đường lưu/nạp trước khi sinh mới; A06 trước A07–A09 để thống nhất sự kiện; A11 sau A10 để UI phản ánh dữ liệu thật.

## 17. Ma trận kiểm thử và cân bằng

### 17.1. File test đề xuất

| File | Phạm vi |
|---|---|
| `tests/talent-potential-regression.ts` | Công thức, XP, clamp và nguồn điểm |
| `tests/trait-catalog-regression.ts` | 300 ID, bậc, race, origin, key và graph |
| `tests/trait-runtime-regression.ts` | Resolver, grant/remove/evolve và idempotence |
| `tests/talent-generation-regression.ts` | Seed, nguồn gốc, root và sinh con |
| `tests/mental-growth-regression.ts` | XP, chống lặp, cảm xúc và suy ngẫm |
| `tests/talent-save-regression.ts` | Migration, roundtrip, rollback, tiến độ dở dang |
| `tests/entity-label-regression.ts` | Cập nhật bộ lọc tên từ số trait sang điểm |
| `tests/talent-population.mjs` | Thống kê generator, chạy riêng khỏi test nhanh |

Runner hiện tại `tests/run.mjs` bundle TypeScript bằng esbuild rồi chạy Node. Tái sử dụng cách này; không thêm Jest/Vitest chỉ cho hệ mới. TypeScript project chỉ include src, nên build thành công không có nghĩa các test TypeScript đã được chạy.

### 17.2. Các ca chức năng bắt buộc

| Mã | Tình huống | Kết quả |
|---|---|---|
| P01 | Năm điểm 80/70/60/40/50 | 60.5 |
| P02 | Tất cả 100 | Tổng 100 |
| P03 | Bẩm sinh 100, trưởng thành 0 | Tổng 55 |
| P04 | Bẩm sinh 0, trưởng thành 100 | Tổng 45 |
| P05 | Chỉ ý chí tăng 20 | Tổng tăng 5 |
| P06 | mentalState từ 100 xuống −100 | P không đổi |
| P07 | Đổi trang bị, cảnh giới, linh khí môi trường | P không đổi nếu không có cải biến căn cơ |
| P08 | Đảo thứ tự trait | Điểm và modifier giống nhau |
| P09 | Trait ID lặp trong save cũ | Chỉ tính một lần |
| P10 | XP 0/240/750/2000/3750/6000 | Điểm 0/10/25/50/75/100 |
| P11 | NaN/Infinity trong save V3 | Từ chối trước commit |
| P12 | Khí vận tăng | P không đổi |
| C01 | Catalog nguồn | 300 ID riêng biệt, bậc 1–5 |
| C02 | Nghề chung và Yêu đã Hóa Hình | Qua điều kiện nếu nghề active |
| C03 | Dã thú chưa khai trí | Không tự làm nghề/rèn tâm chủ động |
| C04 | Huyết mạch không có dòng tổ tiên | Không sinh trait |
| C05 | Trait chuyển thế, seed thường | Không sinh trait |
| C06 | Trait acquired, nhân vật newborn | Không sinh trait |
| C07 | Seed talented, budget70 | Không tier5 vì cap3 |
| C08 | Nhận root chính thứ hai | Thất bại, không thay đổi một phần |
| C09 | Evolution có vòng | Validator báo lỗi |
| C10 | Trait thiếu handler | Không active/spawn |
| G01 | Cùng generation seed | Cùng base/root/trait/lineage |
| G02 | Đổi số lần roll ngoại hình | Stream thiên phú không đổi |
| G03 | Newborn | XP0, không có thành tựu/công pháp hậu thiên |
| G04 | Cha mẹ ý chí100 | Con không thừa kế XP |
| G05 | Trước/sau12 tuổi | Reveal root đã chốt, không roll trait lại |
| G06 | Load hai lần save chưa thức tỉnh | Pending root giống nhau |
| R01 | Rebuild100 lần | HP/ATK không tăng |
| R02 | Grant trait đã có | changed=false, không nhận lại thưởng |
| R03 | Long Huyết tiến hóa thành Tổ Long | Không cộng hai hệ số HP |
| R04 | HP max thay đổi | Giữ tỷ lệ HP; người chết không sống lại |
| R05 | Root heaven và trait Thiên Linh Căn | Chỉ áp root một lần |
| R06 | Dùng đan tăng thọ nguyên rồi rebuild trait 100 lần | Phần tăng vĩnh viễn giữ nguyên, không mất và không tăng thêm |
| X01 | Công việc thành công có output | XP đúng bảng |
| X02 | Tác vụ lỗi/timeout/đường bị chặn | Không XP |
| X03 | Event ID trùng | Một phần thưởng |
| X04 | Cùng kiếp qua hai producer | Một milestone |
| X05 | Đạt giới hạn ngày/30 ngày | Không vượt trần |
| X06 | Routine đạt trần điểm nguồn | Không giảm điểm, không tăng tiếp từ nguồn này |
| X07 | World pause | XP, trạng thái, tiến độ không nhảy |
| X08 | 1×/50×, cùng tick/seed/hành động | XP và trạng thái khớp trong sai số1e−6 |
| X09 | Spam mục tiêu yếu | Không farm XP |
| X10 | Event world A, cùng ID ở B | World B không nhận |
| X11 | XP6000 nhận thêm thưởng | Vẫn6000 |
| X12 | Hai experience cùng family, save/load rồi nhận lần thứ ba trong 30 ngày | Novelty lần ba là 0.1, không trở lại 1 |
| X13 | Ý chí hiện tại 45, lao động trần 40 và encounter trần 85 | Lao động không tăng; encounter còn đủ điều kiện vẫn tăng |
| M01 | Mất người thân | Trạng thái giảm, XP/P giữ nguyên |
| M02 | Thời gian thực trôi khi pause | Tang thương không tự hết |
| M03 | Experience chưa đủ ngày | Không nhận thưởng suy ngẫm |
| M04 | Suy ngẫm đủ tiến độ | Thưởng một lần, cường độ còn40% trước decay |
| M05 | Bị chiến đấu ngắt phiên | Không ghi đủ ngày giả |
| M06 | Ký ức UI bị cắt ở40 bản ghi | Mốc XP và experience không mất |
| M07 | Có 24 experience rồi thêm biến cố thứ 25 | Loại theo quy tắc xác định, không loại bản đang suy ngẫm và không tự thưởng |
| S01 | Save/load V3 | Năm điểm, XP, trạng thái, trait, root giữ nguyên |
| S02 | Save cũ105 ID | Không crash, không mất bảy ID riêng |
| S03 | HP cũ đã có trait | Không nhân thêm; sai số nguyên≤1 |
| S04 | Save lỗi trong staging | Giữ world đang chơi |
| S05 | Load experience đã thưởng | Không thưởng lại |
| S06 | Cooldown và bucket30 ngày | Không farm bằng reload |
| S07 | New world tái dùng entity ID | Không nhận mốc của world cũ |
| S08 | Trait version tương lai | Từ chối và giữ world hiện tại |
| S09 | Save cũ có `an_linh_can`, catalog mới có Biến Dị Ám Linh Căn | Save giữ nghĩa Ẩn Linh Căn; trait bóng tối mang ID riêng `bien_di_am_linh_can` |
| U01 | Stage1, P79.9 | Không hiện nhãn |
| U02 | Stage1, P80 đã kiểm định | Hiện ở zoom≥1 |
| U03 | Stage2, P thấp | Hiện ở zoom≥1 |
| U04 | Trẻ chưa kiểm định, P thật≥80 | Không lộ thông tin qua nhãn |
| U05 | P cao, zoom0.2 | Không hiện nhãn |
| U06 | Tên chứa HTML trong save | Hiện văn bản, không thực thi |

Không cần một test riêng cho từng con số của 300 trait. Kiểm tra hợp đồng catalog, từng loại handler, nguồn gốc/xung đột và một số build đại diện. Tránh test chỉ sao chép công thức implementation mà không có expected độc lập.

### 17.3. Thử nghiệm dân số

Tạo 100000 profile không render, seed cố định20260925, ba chủng tộc cùng cỡ mẫu hoặc báo riêng. Chỉ natural; không trộn curated. Xuất:

- Tỷ lệ seed class, tier cao nhất, số trait, ID hiếm, active/planned được chọn.
- Histogram C/A/B, W/M khởi đầu và P; tách nhóm chưa kiểm định.
- Tỷ lệ root trước/sau primary override; không báo “heaven0.01%” nếu override đã làm tăng.
- Số vi phạm race/species/origin/exclusive/budget: bắt buộc0.
- Số tier5 trong seed có cap dưới5: bắt buộc0.
- Thời gian trên mỗi profile và bộ nhớ.

Xác suất dùng dung sai thống kê, không đòi đúng100 nhân vật legendary trên100000 lần roll. Có thể dùng khoảng ±5×sqrt(n×p×(1−p)), thêm biên tối thiểu3. Seed class khác phẩm P; không assert hai nhãn phải trùng.

### 17.4. Mô phỏng trưởng thành

Các kịch bản deterministic:

1. Chỉ ăn/ngủ/đứng yên100 năm: P không tự tăng theo tuổi.
2. Chỉ lao động thường100 năm: nguồn này không đưa W vượt40; M không tăng.
3. Chỉ thiền thường100 năm: nguồn này không đưa W vượt50 hoặc M vượt40.
4. Kết hợp thử thách/suy ngẫm/kiếp: có thể vượt trần routine nhờ nguồn khác hợp lệ.
5. Cùng bẩm sinh, người rèn luyện đạt P cao hơn; chênh lệch từ nhóm trưởng thành không vượt45.
6. Bẩm sinh100 nhưng không rèn: không tự đạt P100.
7. Sau biến cố, trạng thái có đường phục hồi; tâm cảnh tăng khi hóa giải, không ngay lúc bị tổn thương.
8. Batch30 ngày và từng ngày, cùng chuỗi đầu vào, phải khớp; không bỏ qua thời điểm thưởng.

Mô phỏng1000–10000 năm trong V2 là benchmark riêng sau khi core ổn định; không làm test nhanh chạy hàng giờ. Nếu cần bỏ chết tự nhiên để thử đường XP, dùng fixture bất tử chỉ trong test và ghi rõ.

### 17.5. Hồi quy hiện có

Giữ appearance, faction/settlement, AI, save, simulation audit và appearance catalog. Đặc biệt: trẻ giữ ngoại hình, trang bị ban đầu rỗng, hợp nhất làng, cư trú riêng môn phái, staging rollback, xử lý1×/50× và reset world.

Cập nhật expectation của entity-label-regression theo đặc tả mới, nhưng giữ ca Luyện Khí có combatPower rất cao không tự thành Trúc Cơ.

Lệnh kiểm tra cuối:

```powershell
npm test
npm run build
node tests/talent-population.mjs
```

Lệnh cuối là file mới phải tạo ở A13, chưa có sẵn. Build có cảnh báo bundle>500kB từ trước; báo riêng nếu còn, không nhầm cảnh báo đó với lỗi TypeScript.

## 18. Tiêu chí hoàn thành và mẫu bàn giao

### 18.1. Checklist Lõi

- [ ] Công thức30/15/10/25/20 đúng mọi nơi.
- [ ] Ngộ tính0–100 và adapter0–100000 không tính trùng.
- [ ] Newborn có dữ liệu bẩm sinh ổn định; thức tỉnh không roll lại.
- [ ] Ý chí/tâm cảnh dài hạn tách khỏi cảm xúc động.
- [ ] Catalog300 ID hợp lệ, bậc1–5, có điều kiện race/lineage/capability.
- [ ] Có thống kê active/planned/legacyOnly; planned không spawn.
- [ ] XP từ hành động/trải nghiệm thật, không từ chữ UI hoặc frame.
- [ ] Dedupe/cooldown lưu được và không nhận chéo world.
- [ ] Grant/remove/evolve/rebuild có thể gọi lặp an toàn.
- [ ] Root, trait và công pháp không áp cùng hiệu ứng hai lần.
- [ ] Save cũ105 ID đọc được; bảy ID không mất; load lỗi giữ world.
- [ ] Inspector và nhãn tên đọc điểm mới, font gọn ở các mức zoom.
- [ ] Test/build qua; thống kê có seed; đã xem ảnh UI.
- [ ] Những nguồn XP được tuyên bố hoạt động không còn TODO thay cho producer thật.

### 18.2. Báo cáo sau từng gói

```markdown
## Axx — Tên gói
- Trạng thái: done / đang làm / cần xử lý thêm.
- File tạo/sửa: ...
- API đã có: ...
- Hành vi kiểm chứng được: ...
- Test đã chạy và kết quả: ...
- Migration/compatibility: ...
- Giới hạn còn lại: ...
- Việc tiếp theo: Ayy, đầu vào cần dùng ...
```

Không đánh dấu done khi mới có type/config nhưng chưa có producer/consumer thuộc phạm vi. Nếu test cũ sai với thay đổi chủ đích, giải thích behavior mới và cập nhật expected; không xóa test để đạt màu xanh.

### 18.3. Những việc không tự ý thay đổi

1. Đổi trọng số hoặc dùng công thức sáu trục thay P.
2. Cộng bậc trait trực tiếp vào P.
3. Dùng tuổi, số frame, số lần mở inspector để phát XP.
4. Trừ điểm trưởng thành vì tâm trạng xấu nhất thời.
5. Sinh trait sai chủng tộc hoặc thiếu handler chỉ vì đủ budget.
6. Nhân hiệu ứng linh căn ở cả root và resolver lần nữa.
7. Migration gọi factory sinh lại cư dân hoặc làm mất trait ID.
8. Gắn TODO thay cho cơ chế đã tuyên bố hoàn thành.
9. Đưa schema và lời hướng dẫn kỹ thuật vào màn hình chơi.
10. Thay đổi thế lực, ngoại hình hoặc công pháp rộng ngoài nhu cầu tích hợp.

## 19. Mẫu yêu cầu giao cho mô hình triển khai

Copy đoạn sau khi bắt đầu một lượt code:

```text
Bạn đang làm dự án G:\game_tu_tien.
Đọc docs/HUONG_DAN_TAI_CAU_TRUC_DAC_DIEM_VA_TIEM_NANG_V3.md
và docs/TRAIT_TALENT_IMPLEMENTATION_STATUS.md nếu file trạng thái đã tồn tại.

Chỉ triển khai gói Axx: [tên gói]. Đọc các phụ thuộc đã hoàn thành trước khi sửa.
Giữ công thức: Ngộ tính30%, Tư chất15%, Thể chất10%, Ý chí25%, Tâm cảnh20%.
MentalState là cảm xúc, không phải tâm cảnh trưởng thành.

Danh mục300 trait ở phụ lục là dữ liệu nguồn; áp quy tắc/override V3 phần chính.
Trait thiếu handler phải planned, không sinh mới; không im lặng bỏ hiệu ứng.
Giữ bản lưu cũ, ngoại hình, gia đình, thế lực và AI hiện có hoạt động.

Hoàn thành API, producer/consumer trong phạm vi; chạy test được chỉ định;
cập nhật trạng thái cùng bằng chứng. Nếu tài liệu hoặc repo có mâu thuẫn,
ghi rõ và ưu tiên yêu cầu đã chốt ở mục1, không tự chọn công thức khác.
Báo file thay đổi, hành vi mới, kết quả test và phần chưa hoàn thành.
```

Mỗi lượt giao1–2 gói vừa đủ. Dùng báo cáo Axx làm đầu vào Axx+1; không buộc mô hình đọc lại cả300 dòng catalog cho một thay đổi chỉ liên quan XP hoặc save.

## Phụ lục A — Danh mục 300 đặc điểm để nhập dữ liệu

Nguồn được kiểm đếm: 300 dòng, ID nguồn không trùng. SHA-256 của văn bản UTF-8 nguồn: `de44ec47bf8e7b87f118f3731c7310273464d7fb7c87ffbb7cb16d27a9d3a5e7`.

### A.1. Cách sử dụng bảng

- Các cột race/origin là phân loại V3 sau override; tier và tên lấy từ bản nguồn trừ đổi ID được nêu rõ.
- Vector và hiệu ứng vẫn là **giá trị tham khảo V2**, phải qua chuyển đổi/override/cap ở mục6 và9. Không sao chép chúng thành số cộng trực tiếp vào P.
- Mô tả nguồn là ý tưởng nội dung. Mô tả UI V3 phải viết theo handler đã hoạt động, không hứa bất tử/miễn nhiễm tuyệt đối khi chỉ có bonus.
- Chưa có implementation gán sẵn cho từng trait trong tài liệu: A02 phải tính nó từ phụ thuộc thật trong repo. Đây là cổng kỹ thuật xác định được, không phải quyền tùy ý bật mọi trait.
- Không phải đọc 300 dòng để làm gói XP. Khi làm catalog, nhập dữ liệu bằng script có validator và rà các ngoại lệ dưới đây.

Phân bố race V3 sau khi chuyển nghề: `{"all":186,"human":24,"beast":45,"demon":45}`. Phân bố origin V3 sau các override đã nêu: `{"innate":221,"acquired":43,"reincarnation":3,"lineage":33}`.

### A.2. Hai ID cần xử lý riêng

1. Dòng276 nguồn dùng `kim_giac_tê_huyet` có dấu trong ID. ID V3 chuẩn là `kim_giac_te_huyet`; giữ alias từ cách viết nguồn khi nhập dữ liệu V2. Đây là ID mới của danh mục nguồn, không được tự sửa hàng loạt mọi ID cũ.
2. Dòng034 nguồn dùng `an_linh_can` cho **Biến Dị Ám Linh Căn**, nhưng cùng ID trong repository hiện là **Ẩn Linh Căn**, một đặc điểm khác nghĩa. Dùng ID mới `bien_di_am_linh_can` cho dòng034. Giữ `an_linh_can` cũ dưới dạng legacyOnly cho save cũ. Không tạo alias toàn cục giữa hai nghĩa. Bảy ID thiếu cộng trường hợp này thành tám trường hợp tương thích cần kiểm tra.

### A.3. Override nguồn gốc bắt buộc

| ID nguồn | Origin V3 | Lý do/điều kiện |
|---|---|---|
| `pham_cot_troc_khi` | acquired | Cần cơ chế trọc khí tích lũy; chưa có thì planned. |
| `van_co_dao_tam` | acquired | Yêu cầu trưởng thành và sự kiện đạo tâm, không tặng cho newborn. |
| `thien_nhan_hop_nhat` | acquired | Trạng thái lĩnh ngộ đạt được, cần milestone. |
| `minh_tam_kien_tinh` | acquired | Từ trải nghiệm đã được hóa giải. |
| `vo_nga_dao_tam` | acquired | Cần milestone lĩnh ngộ và tâm cảnh cao. |
| `vo_dich_thien_ha` | acquired | Danh hiệu/thành tựu, không gắn bẩm sinh cho trẻ. |
| `vo_thuong_sat_than` | acquired | Thành tựu con đường sát phạt; chưa có quy tắc chuyên biệt thì planned. |
| `nho_dao_chi_thanh` | acquired | Học kinh văn và đạt thành tựu; không chỉ mang dòng Nhân là có. |
| `hoa_hinh_hoan_my` | acquired | Yêu đã Hóa Hình, stageIndex>=2, có milestone. |
| `yeu_dan_tinh_thuan` | acquired | Yêu đã Kết Đan, stageIndex>=3; không gán đan sẵn lúc sinh. |
| `tu_la_chien_the` | lineage | Mô tả nguồn Tu La; yêu cầu lineage tag tu_la. |
| `cuu_vi_thien_ho` | lineage | Nguồn Hồ tộc; không roll lên mọi Yêu. |
| `van_ma_trieu_tong` | lineage | Hoàng tộc Ma giới; yêu cầu lineage tag demon_royal. |
| `hu_khong_phap_than` | acquired | Pháp thân đã thành, cần hệ tu luyện không gian; planned trong lõi. |

### A.4. Dữ liệu nguồn kèm phân loại V3

| # | ID V3 | Tên | Bậc | Race V3 | Lĩnh vực | Origin V3 | Vector V2 — tham khảo | Hiệu ứng V2 — cần chuẩn hóa | Mô tả nguồn |
|---:|---|---|---:|---|---|---|---|---|---|
| 001 | `doan_menh_chi_tuong` | Đoản Mệnh Chi Tướng | 1 | all | physique | innate | Linh +1; Thể +1 | lifespan: -45, hp: x0.78, qiRate: x1.12 | Sinh cơ hao tổn từ trong bụng mẹ, nhưng đổi lại kinh mạch nhạy cảm với linh khí. |
| 002 | `tat_nguyen_bam_sinh` | Tật Nguyền Bẩm Sinh | 1 | all | physique | innate | Thể +6 | moveSpeed: x0.70, dodge: -10%, willpowerGrowth: +15%, painResistance: +15% | Tay chân khiếm khuyết khiến di chuyển chậm chạp, nhưng rèn luyện được ý chí kiên cường. |
| 003 | `bach_benh_quan_than` | Bách Bệnh Quấn Thân | 1 | all | physique | innate | Thể -4; Chiến -5 | hp: x0.62, def: -5, atk: x0.82, diseaseResistance: -20% | Cơ thể ốm yếu quanh năm, khí huyết suy bại, phòng ngự kém. |
| 004 | `khi_huyet_hu_nhuoc` | Khí Huyết Hư Nhược | 1 | all | physique | innate | Thể +1 | hp: x0.82, physique: -4, hungerRate: x0.82 | Khí huyết lưu thông chậm, thể lực kém nhưng ít tiêu hao thức ăn. |
| 005 | `can_cot_cuong_trang` | Cân Cốt Cường Tráng | 2 | all | physique | innate | Thể +14 | hp: x1.25, def: +8, physique: +6 | Xương cốt rắn chắc, cơ bắp cuồn cuộn, chịu đòn tốt hơn người thường. |
| 006 | `bat_tu_tieu_cuong` | Bất Tử Tiểu Cường | 2 | all | physique | innate | Thể +14 | hp: x1.3, def: +10, dodge: +10%, lifespan: +50 | Sinh mệnh lực dai dẳng đến khó tin, trọng thương vẫn cố lết đi được. |
| 007 | `kinh_mach_rong_lon` | Kinh Mạch Rộng Lớn | 2 | all | physique | innate | Linh +2; Thể +13 | qiRate: x1.25, breakthrough: +8%, hp: x1.1 | Kinh mạch dẻo dai và rộng gấp rưỡi bình thường, vận chuyển linh lực mượt mà. |
| 008 | `thien_sinh_than_luc` | Thiên Sinh Thần Lực | 2 | all | physique | innate | Thể +12; Chiến +2; Nghệ +2 | atk: x1.3, physique: +8, craftingSpeed: x1.2 | Sinh ra đã có sức mạnh ngàn cân, làm việc nặng hay cận chiến đều vượt trội. |
| 009 | `thuan_duong_chi_the` | Thuần Dương Chi Thể | 3 | all | physique | innate | Linh +2; Thể +24; Chiến +3 | hp: x1.5, atk: x1.4, qiRate: x1.3, lifespan: +80, heartDemonResistance: +20% | Dương khí hừng hực như mặt trời ban trưa, khí huyết dồi dào, tà ma khó xâm. |
| 010 | `cuu_am_tuyet_mach` | Cửu Âm Tuyệt Mạch | 3 | all | physique | innate | Linh +25; Ngộ +15; Thể -12 | qiRate: x1.55, comprehension: x1.45, hp: x0.72, lifespan: -35, iceAffinity: +35% | Hàn khí thấu xương, cực kỳ hợp tu luyện công pháp âm hàn nhưng tổn hại tuổi thọ. |
| 011 | `kim_cang_bat_hoai` | Kim Cang Bất Hoại | 3 | all | physique | innate | Thể +25 | hp: x1.6, def: +25, armor: +25, moveSpeed: x0.9 | Nhục thân cứng rắn như kim cương bất hoại, đao kiếm tầm thường chém chỉ tóe lửa. |
| 012 | `loi_kiep_toi_the` | Lôi Kiếp Tôi Thể | 3 | all | physique | acquired | Thể +24; Chiến +3 | hp: x1.5, atk: x1.4, def: +15, armor: +15, willpowerBonus: +25 | Thân thể từng tắm trong thiên lôi kiếp, gân cốt mang lôi uy vạn quân. |
| 013 | `ba_vuong_trong_dong` | Bá Vương Trọng Đồng | 4 | all | physique | innate | Ngộ +4; Thể +30; Chiến +5 | crit: +25%, dodge: +20%, atk: x1.6, comprehension: x1.5 | Một mắt hai con ngươi của bậc chí tôn, nhìn thấu mọi sơ hở chiêu thức đối phương. |
| 014 | `khong_gian_dao_the` | Không Gian Đạo Thể | 4 | all | physique | innate | Ngộ +6; Thể +30 | moveSpeed: x1.7, dodge: +35%, comprehension: x1.8 | Thân thể tương hợp với pháp tắc không gian, bước chân hư ảo xuất quỷ nhập thần. |
| 015 | `bat_diet_kim_than` | Bất Diệt Kim Thân | 4 | all | physique | innate | Thể +39 | hp: x2.1, def: +35, armor: +38, lifespan: +200 | Huyết nhục hóa thành bất diệt kim khu, vạn pháp khó thương, sinh cơ vô tận. |
| 016 | `tinh_than_chien_the` | Tinh Thần Chiến Thể | 4 | all | physique | innate | Linh +4; Thể +38; Chiến +6 | hp: x2, atk: x1.75, qiRate: x1.5, armor: +20 | Dẫn quang huy tinh tú trên chín tầng trời tôi luyện nhục thân, ban đêm càng mạnh. |
| 017 | `hon_don_than_ma_the` | Hỗn Độn Thần Ma Thể | 5 | all | physique | innate | Linh +6; Thể +56; Chiến +10 | hp: x2.70, atk: x2.25, armor: +50, qiRate: x1.80, willpowerBonus: +55 | Nhục thân ngang hàng Thần Ma thời khai thiên lập địa, dung nạp vạn chủng năng lượng. |
| 018 | `bat_tu_bat_diet_khu` | Bất Tử Bất Diệt Khu | 5 | all | physique | innate | Thể +55 | hp: x2.60, def: +45, lifespan: +600, breakthrough: +20%, regeneration: +250% | Còn một giọt máu cũng có thể tái tạo nhục thân, thọ cùng trời đất. |
| 019 | `thoi_gian_linh_the` | Thời Gian Linh Thể | 5 | all | physique | innate | Ngộ +9; Thể +42 | atkSpeed: x1.50, moveSpeed: x1.45, comprehension: x2.10, dodge: +35%, timeInsight: +25% | Pháp tắc tuế nguyệt vờn quanh thân, tốc độ ra đòn và lĩnh ngộ vượt ngoài dòng chảy thời gian. |
| 020 | `hong_mong_tien_thai` | Hồng Mông Tiên Thai | 5 | all | physique | innate | Linh +11; Ngộ +10; Thể +42 | qiRate: x2.40, breakthrough: +30%, comprehension: x2.20, lifespan: +500, bottleneckPenalty: x0.55 | Thai cốt kết từ một sợi Hồng Mông Tử Khí thuở sơ khai, tu luyện không gặp bình cảnh. |
| 021 | `phe_linh_can` | Ngũ Hành Phế Linh Căn | 1 | all | root | innate | Linh -22; Thể +4; Đạo tâm -4 | qiRate: x0.45, breakthrough: -18%, hp: x1.10, multiElementCompatibility: +15% | Linh căn tạp loạn lại mỏng manh, hấp thu linh khí cực chậm nhưng cơ thể dẻo dai. |
| 022 | `kinh_mach_tac_nghen` | Kinh Mạch Tắc Nghẽn | 1 | all | root | innate | Linh -4; Đạo tâm -4 | qiRate: x0.6, breakthrough: -10%, willpowerBonus: +10 | Nhiều huyệt đạo bẩm sinh đóng kín, phải tốn gấp đôi công sức để dẫn khí nhập thể. |
| 023 | `linh_khi_bai_xich` | Linh Khí Bài Xích | 1 | all | root | innate | Linh -6 | qiRate: x0.5, def: +5 | Thể chất khó giữ được linh khí, ngồi thiền nửa ngày tán mất một nửa. |
| 024 | `hoa_khi_xung_tam` | Hỏa Khí Xung Tâm | 1 | all | root | innate | Linh +6; Chiến +1; Đạo tâm -9 | atk: x1.15, breakthrough: -12%, heartDemonResistance: -15% | Hỏa độc tích tụ trong linh căn, tính tình nóng nảy dễ bị tẩu hỏa nhập ma. |
| 025 | `tuyet_linh_chi_the` | Tuyệt Linh Chi Thể | 2 | all | root | innate | Linh -28; Thể +30; Chiến +4 | qiRate: x0.15, hp: x1.90, atk: x1.55, armor: +22, bodyCultivationGain: +35% | Không thể tu luyện linh khí như thường nhân, nhưng nhục thân cường hãn tuyệt luân. |
| 026 | `dia_mach_chi_tu` | Địa Mạch Chi Tử | 2 | all | root | innate | Linh +12; Thể +2 | def: +12, armor: +15, hp: x1.3, moveSpeed: x0.9 | Thổ linh căn hậu trọng, đứng trên mặt đất phòng ngự tăng mạnh và hồi phục bền bỉ. |
| 027 | `thuy_than_chuc_phuc` | Thủy Thần Chúc Phúc | 2 | all | root | innate | Linh +14 | qiRate: x1.3, dodge: +10%, thirstRate: x0.55, mindStateBonus: +10 | Thủy linh căn tinh thuần, tâm tĩnh như nước, ít khi cảm thấy khát. |
| 028 | `thao_moc_than_hoa` | Thảo Mộc Thân Hòa | 2 | all | root | innate | Linh +14 | lifespan: +40, alchemy: +12%, qiRate: x1.2 | Hơi thở gần gũi với cỏ cây hoa lá, sinh cơ dồi dào và nhạy bén với linh dược. |
| 029 | `thien_loi_chi_tu` | Thiên Lôi Chi Tử | 3 | all | root | innate | Linh +20; Chiến +4 | atk: x1.5, crit: +15%, moveSpeed: x1.2, breakthrough: +10% | Dị chủng Lôi linh căn, mỗi đòn đánh đều kèm theo tiếng sấm sét kinh hồn. |
| 030 | `chan_hoa_chi_linh` | Chân Hỏa Chi Linh | 3 | all | root | innate | Linh +22; Chiến +3 | atk: x1.35, alchemy: +30%, qiRate: x1.3 | Hỏa linh căn cực phẩm, bẩm sinh khống chế chân hỏa, sát thương và luyện đan đều mạnh. |
| 031 | `moc_linh_truong_sinh` | Mộc Linh Trường Sinh | 3 | all | root | innate | Linh +22; Thể +3 | lifespan: +180, hp: x1.4, qiRate: x1.25 | Mộc linh căn tràn đầy sinh cơ, tuổi thọ kéo dài và tự lành vết thương nhanh. |
| 032 | `bang_phach_han_the` | Băng Phách Hàn Thể | 3 | all | root | innate | Linh +22 | def: +15, armor: +15, breakthrough: +15%, qiRate: x1.3, heartDemonResistance: +25% | Dị chủng Băng linh căn, tâm trí lạnh lùng tĩnh lặng, không bị tâm ma quấy nhiễu. |
| 033 | `phong_than_ho_the` | Phong Thần Hộ Thể | 3 | all | root | innate | Linh +20 | moveSpeed: x1.45, dodge: +20%, atkSpeed: x1.25 | Dị chủng Phong linh căn, thân nhẹ như gió cuốn, tốc độ di chuyển và xuất chiêu cực nhanh. |
| 034 | `bien_di_am_linh_can` | Biến Dị Ám Linh Căn | 3 | all | root | innate | Linh +20; Chiến +3 | crit: +20%, atk: x1.4, dodge: +15% | Linh căn thuộc tính bóng tối hiếm gặp, giỏi ẩn nấp và tung đòn chí mạng. |
| 035 | `am_duong_song_tu` | Âm Dương Song Linh Căn | 3 | all | root | innate | Linh +24; Ngộ +3 | qiRate: x1.55, comprehension: x1.4, breakthrough: +10% | Trong người tồn tại cả Âm lẫn Dương hài hòa, linh lực sinh sôi không ngừng. |
| 036 | `ngu_hanh_cau_toan` | Ngũ Hành Cân Bằng | 3 | all | root | innate | Linh +24 | qiRate: x1.5, def: +10, breakthrough: +15%, lifespan: +60 | Kim Mộc Thủy Hỏa Thổ ngũ hành tương sinh hoàn hảo, căn cơ vững chắc không tỳ vết. |
| 037 | `thien_linh_can` | Thiên Linh Căn | 4 | all | root | innate | Linh +37 | qiRate: x1.90, breakthrough: +22%, elementPurity: +45% | Độc nhất một hệ linh căn đạt độ thuần khiết tuyệt đối, được thiên địa linh khí sủng ái. |
| 038 | `cuu_tieu_than_loi_can` | Cửu Tiêu Thần Lôi Căn | 4 | all | root | innate | Linh +36; Chiến +7 | atk: x1.9, crit: +25%, qiRate: x1.8, heartDemonResistance: +35% | Linh căn biến dị tối thượng hệ Lôi, đại diện cho Thiên Phạt, khắc chế mọi tà ma. |
| 039 | `thai_duong_chan_hoa_can` | Thái Dương Chân Hỏa Căn | 4 | all | root | innate | Linh +38; Thể +3; Chiến +7 | atk: x1.85, qiRate: x2, alchemy: +40%, hp: x1.4 | Mang theo hỏa chủng của Đại Nhật Kim Ô, thiêu rụi vạn vật, luyện đan tuyệt đỉnh. |
| 040 | `hon_don_dao_can` | Hỗn Độn Đạo Căn | 5 | all | root | innate | Linh +53; Thể +4; Chiến +5 | qiRate: x2.35, atk: x1.65, hp: x1.50, breakthrough: +28%, allElementCompatibility: +60% | Linh căn khởi nguyên của vũ trụ, dung hợp mọi nguyên tố, tốc độ tu luyện kinh thế hãi tục. |
| 041 | `dan_don_ngu_ngo` | Đần Độn Ngốc Nghếch | 1 | all | mindset | innate | Ngộ -8; Thể +1 | comprehension: x0.55, breakthrough: -10%, hp: x1.15, heartDemonResistance: +10% | Đầu óc chậm hiểu, đọc bí tịch như vịt nghe sấm, nhưng tâm tư đơn giản ít tạp niệm. |
| 042 | `da_nghi_tram_trong` | Đa Nghi Thận Trọng | 1 | all | mindset | innate | Ngộ +3 | dodge: +10%, def: +5, breakthrough: -5%, mindStateBonus: -5 | Làm việc gì cũng suy tính quá nhiều, giỏi phòng bị nhưng thiếu quyết đoán khi đột phá. |
| 043 | `tram_mac_it_loi` | Trầm Mặc Ít Lời | 1 | all | mindset | innate | Linh +1; Ngộ +4; Đạo tâm +4 | qiRate: x1.15, comprehension: x1.15, mindStateBonus: +8 | Không thích giao du ồn ào, chỉ lặng lẽ ngồi một góc chuyên tâm tu luyện. |
| 044 | `tam_tinh_thao_dong` | Tâm Tính Xao Động | 1 | all | mindset | innate | Linh -6; Ngộ +3 | qiRate: x0.75, breakthrough: -10%, moveSpeed: x1.1, mindStateBonus: -15 | Tâm tư bất định, ngồi thiền hay nghĩ ngợi lung tung, dễ bị ngoại cảnh thu hút. |
| 045 | `y_chi_bac_nhuoc` | Ý Chí Bạc Nhược | 1 | all | mindset | innate | Ngộ +3; Đạo tâm -4 | willpowerBonus: -25, breakthrough: -12%, moveSpeed: x1.05 | Gặp khó khăn hay đau đớn là muốn bỏ cuộc, rất sợ lôi kiếp và nghịch cảnh. |
| 046 | `tam_ma_quan_than` | Tâm Ma Quấn Thân | 2 | all | mindset | innate | Linh +2; Ngộ +7; Chiến +2; Đạo tâm -1 | atk: x1.3, qiRate: x1.3, breakthrough: -25%, heartDemonResistance: -30% | Chấp niệm sâu nặng hóa thành tâm ma, lực chiến tăng vọt nhưng đột phá cực kỳ nguy hiểm. |
| 047 | `truc_giac_nhay_ben` | Trực Giác Nhạy Bén | 2 | all | mindset | innate | Ngộ +7; Đạo tâm +8 | dodge: +15%, crit: +8%, mindStateBonus: +10 | Giác quan thứ sáu cực nhạy trước sát khí, thường né được đòn hiểm trong gang tấc. |
| 048 | `can_cu_bu_thong_minh` | Cần Cù Bù Thông Minh | 2 | all | mindset | innate | Linh +2; Ngộ +5; Nghệ +2; Đạo tâm +8 | qiRate: x1.25, craftingSpeed: x1.25, comprehension: x0.9, willpowerBonus: +15 | Tuy tư chất bình thường nhưng chịu thương chịu khó gấp bội người khác. |
| 049 | `kien_nhan_ben_bi` | Kiên Nhẫn Bền Bỉ | 2 | all | mindset | innate | Ngộ +7; Đạo tâm +8 | willpowerBonus: +22, mindStateBonus: +12, breakthrough: +8% | Chịu được cô độc và gian khổ hàng chục năm không một lời than vãn. |
| 050 | `khong_so_cai_chet` | Không Sợ Cái Chết | 2 | all | mindset | innate | Ngộ +7; Chiến +2; Đạo tâm +8 | willpowerBonus: +22, atk: x1.25, def: -5 | Coi cái chết nhẹ tựa lông hồng, càng vào chỗ chết ý chí càng bùng nổ. |
| 051 | `don_ngo_ky_tai` | Đốn Ngộ Kỳ Tài | 3 | all | mindset | innate | Ngộ +17; Đạo tâm +13 | comprehension: x1.75, breakthrough: +12%, mindStateBonus: +18, insightEventChance: +20% | Thường xuyên rơi vào trạng thái đốn ngộ huyền diệu khi ngắm nhìn thiên nhiên. |
| 052 | `xich_tu_chi_tam` | Xích Tử Chi Tâm | 3 | all | mindset | innate | Linh +3; Ngộ +13; Đạo tâm +13 | breakthrough: +18%, qiRate: x1.35, comprehension: x1.3, heartDemonResistance: +30% | Tâm hồn trong sáng thuần khiết như trẻ thơ, không vướng bụi trần, tâm ma bất xâm. |
| 053 | `kien_dinh_nhu_thiet` | Đạo Tâm Như Thiết | 3 | all | mindset | innate | Ngộ +11; Thể +1; Đạo tâm +13 | breakthrough: +18%, def: +10, hp: x1.15, willpowerBonus: +35, heartDemonResistance: +30% | Ý chí kiên cường không gì lay chuyển, kháng mọi ảo ảnh và hiệu ứng hoảng loạn. |
| 054 | `nhat_tam_nhi_dung` | Nhất Tâm Nhị Dụng | 3 | all | mindset | innate | Ngộ +16; Nghệ +3; Đạo tâm +13 | comprehension: x1.6, atkSpeed: x1.25, craftingSpeed: x1.4 | Tinh thần lực phân làm hai luồng độc lập, vừa chiến đấu vừa bấm quyết hoặc chế tác. |
| 055 | `bang_thanh_ngoc_khiet` | Băng Thanh Ngọc Khiết | 3 | all | mindset | innate | Linh +2; Ngộ +11; Đạo tâm +13 | mindStateBonus: +30, heartDemonResistance: +30%, qiRate: x1.3, breakthrough: +15% | Tâm cảnh trong trẻo như băng ngọc, mọi cám dỗ hồng trần đều không thể làm gợn sóng. |
| 056 | `ngo_tinh_sieu_pham` | Ngộ Tính Siêu Phàm | 4 | all | mindset | innate | Linh +2; Ngộ +24; Đạo tâm +20 | comprehension: x2.05, breakthrough: +18%, qiRate: x1.25, techniqueLearning: +40% | Trí tuệ thông suốt cổ kim, bất kỳ công pháp thần thông nào nhìn qua một lần là hiểu. |
| 057 | `sat_phat_chi_tam` | Sát Phạt Quyết Đoán | 4 | all | mindset | innate | Ngộ +16; Chiến +5; Đạo tâm +20 | atk: x1.65, crit: +20%, atkSpeed: x1.2, willpowerBonus: +30, heartDemonResistance: +25% | Ra tay tàn nhẫn dứt khoát, lấy sát chứng đạo, giết địch không làm đạo tâm dao động. |
| 058 | `bat_khuat_chien_y` | Bất Khuất Chiến Ý | 4 | all | mindset | innate | Ngộ +16; Thể +3; Chiến +4; Đạo tâm +20 | willpowerBonus: +50, atk: x1.5, hp: x1.4, breakthrough: +20% | Dù trời sập xuống cũng không cúi đầu, ý chí chiến đấu nghiền nát mọi thiên kiếp. |
| 059 | `van_co_dao_tam` | Vạn Cổ Đạo Tâm | 5 | all | mindset | acquired | Linh +5; Ngộ +23; Đạo tâm +27 | mindStateBonus: +55, willpowerBonus: +60, heartDemonResistance: +70%, breakthrough: +28%, qiRate: x1.60 | Đạo tâm vững bền qua vạn cổ tang thương, tâm ma vừa sinh ra đã bịluyện hóa thành tu vi. |
| 060 | `thien_nhan_hop_nhat` | Thiên Nhân Hợp Nhất | 5 | all | mindset | acquired | Linh +7; Ngộ +33; Đạo tâm +27 | comprehension: x2.20, qiRate: x1.90, mindStateBonus: +48, dodge: +22%, breakthrough: +25% | Tâm cảnh hòa làm một với Thiên Đạo, mỗi nhịp thở đều là sự vận hành của quy tắc vũ trụ. |
| 061 | `nhat_gan_so_chet` | Nhát Gan Sợ Chết | 1 | all | combat | innate | Chiến -2; Đạo tâm -4 | atk: x0.7, moveSpeed: x1.15, dodge: +12%, willpowerBonus: -15 | Chưa đánh đã nghĩ đường chạy trốn, lực chiến yếu nhưng chạy thoát thân cực nhanh. |
| 062 | `huu_dung_vo_muu` | Hữu Dũng Vô Mưu | 1 | all | combat | innate | Chiến +7 | atk: x1.15, def: -8, dodge: -10% | Chỉ biết lao lên chém giết điên cuồng mà quên mất phòng thủ. |
| 063 | `kinh_nghiem_non_not` | Kinh Nghiệm Non Nớt | 1 | all | combat | acquired | Chiến +2 | atk: x0.85, crit: -5%, dodge: -5% | Chưa từng trải qua thực chiến sinh tử, gặp kẻ địch thường luống cuống tay chân. |
| 064 | `ra_don_do_du` | Ra Đòn Do Dự | 1 | all | combat | innate | Chiến +6 | atkSpeed: x0.8, crit: -5%, def: +5 | Sát tâm không đủ, khi xuất chiêu hay ngập ngừng khiến tốc độ đánh giảm sút. |
| 065 | `than_xa_thu` | Bách Bộ Xuyên Dương | 2 | all | combat | innate | Chiến +14 | crit: +18%, atk: x1.25 | Nhãn lực và khả năng định vị mục tiêu từ xa chuẩn xác tuyệt đối. |
| 066 | `phuc_kich_cao_thu` | Phục Kích Cao Thủ | 2 | all | combat | innate | Chiến +12 | crit: +15%, dodge: +12%, moveSpeed: x1.15 | Giỏi ẩn mình trong bóng tối, chờ thời cơ tung đòn đánh lén hiểm hóc. |
| 067 | `tram_sat_linh_thu` | Thợ Săn Yêu Thú | 2 | all | combat | acquired | Chiến +14 | atk: x1.3, crit: +10% | Dày dạn kinh nghiệm đi săn nơi rừng thiêng nước độc, nắm rõ yếu hại của dã thú. |
| 068 | `can_chien_hung_han` | Cận Chiến Hung Hãn | 2 | all | combat | innate | Thể +1; Chiến +14 | atk: x1.25, atkSpeed: x1.15, hp: x1.1 | Càng áp sát đối thủ đòn đánh càng dồn dập và tàn bạo. |
| 069 | `phan_xa_ben_nhay` | Phản Xạ Bén Nhạy | 2 | all | combat | innate | Chiến +12 | dodge: +16%, atkSpeed: x1.12 | Thần kinh phản xạ cực nhanh trước đòn tấn công bất ngờ. |
| 070 | `bach_chien_bat_bai` | Bách Chiến Bất Bại | 3 | all | combat | acquired | Chiến +23 | atk: x1.4, def: +15, armor: +15, willpowerBonus: +20 | Trải qua hàng trăm trận huyết chiến sinh tử, kinh nghiệm chiến đấu dày dạn vô song. |
| 071 | `than_hanh_bach_bien` | Thần Hành Bách Biến | 3 | all | combat | innate | Chiến +20 | moveSpeed: x1.45, dodge: +25% | Thân pháp ảo diệu như bóng ma, để lại tàn ảnh khiến kẻ địch không thể chạm tới. |
| 072 | `ho_the_cuong_khi` | Hộ Thể Cương Khí | 3 | all | combat | innate | Thể +2; Chiến +20 | def: +20, armor: +25, hp: x1.2 | Chân nguyên tự động ngưng tụ thành lớp giáp vô hình bảo vệ toàn thân. |
| 073 | `cuong_chien_huyet_no` | Cuồng Chiến Huyết Nộ | 3 | all | combat | innate | Chiến +24 | atk: x1.55, atkSpeed: x1.25, def: -8, willpowerBonus: +15 | Càng bị thương nặng càng trở nên điên cuồng, đổi phòng thủ lấy sức công phá hủy diệt. |
| 074 | `quyen_tran_son_ha` | Quyền Trấn Sơn Hà | 3 | all | combat | innate | Thể +2; Chiến +24 | atk: x1.45, armor: +15, hp: x1.2 | Quyền pháp đại khai đại hợp, mỗi cú đấm mang theo kình lực chấn vỡ núi đá. |
| 075 | `nhat_kich_tat_sat` | Nhất Kích Tất Sát | 4 | all | combat | innate | Chiến +35 | crit: +35%, atk: x1.6 | Không ra tay thì thôi, một khi xuất chiêu là nhắm thẳng tử huyệt đoạt mạng. |
| 076 | `nghich_chien_thuong_khung` | Nghịch Chiến Thượng Khung | 4 | all | combat | innate | Thể +3; Chiến +37 | atk: x1.9, crit: +20%, hp: x1.4, breakthrough: +15%, willpowerBonus: +40 | Ý chí chiến đấu nghịch thiên, chuyên vượt cấp chém giết cường giả cảnh giới cao hơn. |
| 077 | `van_phu_mac_dich` | Vạn Phu Mạc Địch | 4 | all | combat | innate | Thể +4; Chiến +36 | atk: x1.7, def: +30, armor: +30, hp: x1.5 | Một người trấn giữ quan ải, vạn quân không thể bước qua, công thủ toàn diện. |
| 078 | `huyet_chien_bat_phuong` | Huyết Chiến Bát Phương | 4 | all | combat | innate | Chiến +36 | atk: x1.75, atkSpeed: x1.35, crit: +20%, willpowerBonus: +30 | Giữa vòng vây trùng điệp sát khí càng hăng, tốc độ xuất chiêu và bạo kích tăng mạnh. |
| 079 | `chien_than_tai_the` | Chiến Thần Tại Thế | 5 | all | combat | innate | Thể +5; Chiến +52 | atk: x2.20, crit: +35%, atkSpeed: x1.45, hp: x1.65, willpowerBonus: +50 | Hóa thân của Chiến Thần thượng cổ, bước vào trận chiến là áp đảo hoàn toàn quần hùng. |
| 080 | `vo_dich_thien_ha` | Vô Địch Thiên Hạ | 5 | all | combat | acquired | Chiến +52 | atk: x2.25, def: +42, armor: +42, mindStateBonus: +45, willpowerBonus: +60, moraleAura: +25% | Niềm tin vô địch tuyệt đối tạo nên khí thế bẻ gãy mọi thần thông của kẻ địch. |
| 081 | `van_rui_deo_bam` | Sao Quả Tạ Chiếu Mệnh | 1 | all | social | innate | Đạo tâm -2 | breakthrough: -20%, alchemy: -25%, dodge: -10% | Đi đường bằng cũng vấp ngã, luyện đan dễ nổ lò, độ kiếp hay bị sét đánh trúng đầu tiên. |
| 082 | `tham_lam_vo_day` | Tham Lam Vô Đáy | 1 | all | social | innate | Nghệ +1; Đạo tâm -7 | craftingSpeed: x1.15, breakthrough: -10%, prestige: -15, heartDemonResistance: -15% | Nhìn thấy tài bảo là sáng mắt, chăm chỉ vơ vét nhưng dễ sinh tâm ma khi đột phá. |
| 083 | `co_doc_lanh_lung` | Cô Độc Lạnh Lùng | 1 | all | social | innate | Linh +1; Đạo tâm +2 | prestige: -10, mindStateBonus: +10, qiRate: x1.1 | Không thích kết giao bạn bè, sống khép kín nhưng giữ được tâm cảnh tĩnh lặng. |
| 084 | `dao_hoa_van_do` | Đào Hoa Kiếp | 2 | all | social | innate | Linh +1; Đạo tâm +4 | moveSpeed: x1.15, qiRate: x1.15, def: -5, mindStateBonus: -8 | Dung mạo tuấn tú thu hút nhiều nhân duyên nhưng cũng dễ vướng vào ân oán tình thù. |
| 085 | `khac_the_khac_tu` | Thiên Sát Cô Tinh | 2 | all | social | innate | Chiến +2; Đạo tâm +4 | atk: x1.3, crit: +15%, prestige: -20, willpowerBonus: +20 | Mệnh cách khắc chết người thân bạn bè, cả đời cô độc trên con đường sát phạt. |
| 086 | `doc_lai_doc_vang` | Độc Lai Độc Vãng | 2 | all | social | innate | Linh +2; Đạo tâm +4 | moveSpeed: x1.2, qiRate: x1.2, dodge: +10% | Thích hành tẩu một mình nơi hoang dã, tự sinh tự diệt, thân pháp linh hoạt. |
| 087 | `luon_leo_giao_hoat` | Lươn Lẹo Giảo Hoạt | 2 | all | social | innate | Đạo tâm +4 | dodge: +18%, moveSpeed: x1.15, crit: +10% | Mồm mép tép nhảy, giỏi luồn cúi và tìm đường lui khi gặp nguy hiểm. |
| 088 | `am_hiem_doc_ac` | Tâm Ngoan Thủ Lạt | 2 | all | social | innate | Chiến +2; Đạo tâm -5 | atk: x1.3, crit: +15%, breakthrough: -5%, heartDemonResistance: -10% | Làm việc bất chấp thủ đoạn, ra tay tàn độc không chừa đường sống. |
| 089 | `truong_nghia_so_tai` | Trọng Tình Trọng Nghĩa | 2 | all | social | acquired | Đạo tâm +4 | prestige: +20, breakthrough: +10%, mindStateBonus: +15 | Sẵn sàng xả thân vì bằng hữu, được đồng môn kính trọng, đạo tâm sáng tỏ. |
| 090 | `phuc_trach_tham_hau` | Phúc Trạch Thâm Hậu | 3 | all | social | innate | Đạo tâm +6; Khí vận +25 | breakthrough: +18%, lifespan: +80, alchemy: +15% | Tổ tiên tích đức, gặp dữ hóa lành, đi dạo cũng nhặt được linh thảo bảo vật. |
| 091 | `lanh_tu_quan_luan` | Khí Chất Lãnh Tụ | 3 | all | social | acquired | Ngộ +2; Chiến +2; Đạo tâm +6 | prestige: +50, comprehension: x1.3, atk: x1.2, willpowerBonus: +20 | Phong thái uy nghiêm bẩm sinh, lời nói có trọng lượng, thu phục lòng người dễ dàng. |
| 092 | `bach_nhan_chi_thuong` | Bách Nhân Chi Thượng | 3 | all | social | innate | Linh +2; Đạo tâm +6 | prestige: +40, qiRate: x1.25, def: +12 | Khí độ tôn quý vượt trội đám đông, đi tới đâu cũng tạo dựng uy danh lớn. |
| 093 | `khi_van_chi_tu` | Khí Vận Chi Tử | 4 | all | social | innate | Linh +3; Đạo tâm +9; Khí vận +45 | breakthrough: +28%, alchemy: +25%, dodge: +18%, qiRate: x1.35, fortune: +45 | Con cưng của Thiên Đạo, rơi xuống vực thẳm cũng nhặt được bí tịch tuyệt thế. |
| 094 | `thien_dao_quyen_co` | Thiên Đạo Quyến Cố | 4 | all | social | innate | Linh +4; Đạo tâm +9; Khí vận +55 | breakthrough: +25%, qiRate: x1.55, lifespan: +150, heartDemonResistance: +28%, fortune: +55 | Khí vận tử kim bao phủ đỉnh đầu, thiên kiếp giáng xuống cũng nhẹ đi ba phần. |
| 095 | `dai_dao_chi_tu` | Đại Đạo Chi Tử | 5 | all | social | innate | Linh +7; Ngộ +6; Đạo tâm +13; Khí vận +90 | breakthrough: +30%, qiRate: x1.85, comprehension: x1.70, alchemy: +35%, dodge: +22%, prestige: +80, fortune: +90 | Chân mệnh thiên tử của cả kỷ nguyên, hội tụ khí vận toàn giới, vạn sự tất thành. |
| 096 | `the_han_so_lanh` | Thể Hàn Sợ Lạnh | 1 | all | survival | innate | Thể -1; Đạo tâm +2 | hp: x0.85, moveSpeed: x0.9 | Cơ thể nhiễm hàn khí từ nhỏ, sức khỏe suy giảm và tay chân cứng đờ khi trời lạnh. |
| 097 | `ngu_say_ngan_nam` | Thụy Mộng Tiên Du | 1 | all | survival | innate | Linh +1; Thể +3; Nghệ -8; Đạo tâm +2 | qiRate: x1.15, moveSpeed: x0.8, craftingSpeed: x0.7, mindStateBonus: +10 | Ham ngủ lười vận động, nhưng trong lúc ngủ say linh khí vẫn tự động vận chuyển. |
| 098 | `da_day_khong_day` | Dạ Dày Không Đáy | 1 | all | survival | innate | Thể +4; Đạo tâm +2 | hungerRate: x1.15, hp: x1.15, physique: +4 | Ăn uống tốn gấp rưỡi người thường nhưng bù lại khí huyết dồi dào. |
| 099 | `cu_dem_da_tinh` | Dạ Hành Giả | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | moveSpeed: x1.2, dodge: +12%, crit: +10% | Tinh thần cực kỳ tỉnh táo và linh hoạt vào ban đêm, giỏi săn bắn và tập kích. |
| 100 | `thich_ung_bang_tuyet` | Hàn Băng Bất Xâm | 2 | all | survival | innate | Thể +8; Đạo tâm +3 | def: +10, hp: x1.15 | Cơ thể thích nghi hoàn hảo với giá rét, da thịt săn chắc chống chịu tốt. |
| 101 | `hoa_nhiet_bat_xam` | Vạn Hỏa Bất Xâm | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | armor: +12, alchemy: +15% | Không sợ nắng nóng hay lửa đốt, rất thích hợp canh giữ lò đan hoặc lò rèn. |
| 102 | `thinh_giac_nhay_ben` | Thính Giác Nhạy Bén | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | dodge: +14%, crit: +8% | Nghe được tiếng lá rơi và nhịp tim kẻ địch từ khoảng cách hàng dặm. |
| 103 | `thien_ly_nhan` | Thiên Lý Nhãn | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | crit: +12%, dodge: +10%, moveSpeed: x1.15 | Đôi mắt tinh tường nhìn xa vạn dặm, phát hiện linh thảo và con mồi từ rất sớm. |
| 104 | `tich_coc_tien_the` | Tích Cốc Tiên Thể | 3 | all | survival | innate | Linh +3; Thể +11; Đạo tâm +5 | hungerRate: x0.55, thirstRate: x0.55, qiRate: x1.35 | Cơ thể tự hấp thu linh khí thay cho ngũ cốc, gần như không cần ăn uống. |
| 105 | `tho_ty_nam_son` | Thọ Tỷ Nam Sơn | 3 | all | survival | innate | Thể +13; Đạo tâm +5 | lifespan: +220, hp: x1.2 | Sinh mệnh lực bền bỉ như tùng bách trên núi cao, sống lâu gấp bội người cùng cảnh giới. |
| 106 | `bach_doc_bat_xam` | Bách Độc Bất Xâm | 3 | all | survival | innate | Thể +14; Đạo tâm +5 | hp: x1.35, def: +12, alchemy: +20% | Cơ thể kháng lại mọi loại kịch độc và chướng khí, máu thịt có thể giải độc. |
| 107 | `phong_loi_bat_dong` | Phong Lôi Bất Động | 3 | all | survival | acquired | Thể +11; Đạo tâm +5 | def: +18, armor: +18, willpowerBonus: +25 | Dù bão tố sấm sét ập đến vẫn vững như bàn thạch, chịu đựng nghịch cảnh xuất sắc. |
| 108 | `van_kiep_bat_diet` | Vạn Kiếp Bất Diệt | 4 | all | survival | acquired | Thể +23; Đạo tâm +8 | hp: x1.85, lifespan: +280, def: +28, willpowerBonus: +42, disasterResistance: +25% | Trải qua muôn vàn tai ương kiếp nạn mà không chết, sinh cơ và ý chí đều đạt cực hạn. |
| 109 | `thon_khi_thuc_nhat` | Thôn Khí Thực Nhật | 4 | all | survival | innate | Linh +5; Thể +19; Đạo tâm +8 | hungerRate: x0.08, thirstRate: x0.08, qiRate: x1.65, hp: x1.40 | Nuốt tinh hoa nhật nguyệt thay cho thức ăn phàm tục, linh lực tự sinh mỗi khắc. |
| 110 | `truong_sinh_bat_lao` | Trường Sinh Bất Lão | 5 | all | survival | innate | Linh +5; Thể +32; Đạo tâm +10 | lifespan: +700, hp: x2.10, qiRate: x1.60, mindStateBonus: +38, agingPenalty: x0.20 | Dung mạo và sinh cơ vĩnh viễn dừng ở thời kỳ đỉnh phong, thọ nguyên dài đến tận cùng tuế nguyệt. |
| 111 | `mu_tit_dan_dao` | Nổ Lò Chuyên Nghiệp | 1 | all | profession | acquired | Chiến +1; Nghệ +6 | alchemy: -35%, atk: x1.1 | Không có chút thiên phú nào với lửa và dược liệu, động vào lò đan là nổ tung. |
| 112 | `vung_ve_luyen_khi` | Vụng Về Tay Chân | 1 | all | profession | acquired | Nghệ -4 | craftingSpeed: x0.6, alchemy: -20% | Đôi tay thô kệch, cầm búa rèn hay xây dựng công trình đều chậm chạp và hay hỏng. |
| 113 | `pham_cot_troc_khi` | Phàm Cốt Trọc Khí | 1 | human | physique | acquired | Linh -6; Thể +6 | qiRate: x0.75, hungerRate: x1.15, willpowerBonus: +10 | Ăn ngũ cốc phàm trần quá lâu khiến trọc khí tích tụ, phải tẩy tủy vất vả mới tu tiên được. |
| 114 | `mot_sach_yeu_duoi` | Mọt Sách Yếu Đuối | 1 | human | mindset | innate | Ngộ +4; Thể -6; Chiến -6; Đạo tâm +4 | comprehension: x1.15, hp: x0.75, atk: x0.75 | Cả ngày chỉ biết đọc sách thánh hiền, thông hiểu đạo lý nhưng trói gà không chặt. |
| 115 | `long_tran_chua_dut` | Lòng Trần Chưa Dứt | 1 | human | mindset | innate | Ngộ +3 | prestige: +12, breakthrough: -10%, mindStateBonus: -10 | Còn nặng lòng với công danh phú quý thế gian, khi bế quan dễ sinh tạp niệm. |
| 116 | `than_dong_khai_khoang` | Thần Đồng Khai Khoáng | 2 | all | profession | acquired | Thể +1; Nghệ +15 | craftingSpeed: x1.35, armor: +10, hp: x1.15 | Nhìn vân đá trên vách núi là biết bên trong có linh thạch hay quặng quý. |
| 117 | `dau_bep_than_cap` | Linh Trù Thần Cấp | 2 | all | profession | acquired | Linh +1; Thể +2; Nghệ +12 | hungerRate: x0.55, hp: x1.25, qiRate: x1.15 | Nấu linh thực giữ trọn 10 phần linh khí, giúp bản thân và đồng môn no lâu, tăng tu vi. |
| 118 | `thao_duoc_tinh_thong` | Thảo Dược Tinh Thông | 2 | all | profession | acquired | Thể +1; Nghệ +12 | alchemy: +20%, hp: x1.15, lifespan: +30 | Thuộc lòng hàng ngàn loại linh thảo, hái thuốc và sơ chế dược liệu không bao giờ sai sót. |
| 119 | `kientruc_than_tuong` | Kiến Trúc Thần Tượng | 2 | all | profession | acquired | Nghệ +15 | craftingSpeed: x1.35, def: +8 | Bậc thầy xây dựng cung điện, động phủ và công trình tông môn với tốc độ thần tốc. |
| 120 | `thuong_nghiep_ky_tai` | Thương Nghiệp Kỳ Tài | 2 | all | profession | acquired | Ngộ +2; Nghệ +12 | prestige: +25, comprehension: x1.2 | Đầu óc tính toán nhạy bén, giỏi giao thương buôn bán mang lại danh tiếng cho tông môn. |
| 121 | `tru_ma_tien_si` | Trừ Ma Vệ Đạo | 2 | human | combat | innate | Chiến +14 | atk: x1.3, breakthrough: +10%, prestige: +15, willpowerBonus: +15 | Mang lòng chính nghĩa diệt trừ yêu ma bảo vệ thương sinh, đạo tâm vững vàng. |
| 122 | `trung_quan_ai_mon` | Trung Tâm Cảnh Cảnh | 2 | human | social | acquired | Đạo tâm +4 | prestige: +25, def: +10, breakthrough: +8%, willpowerBonus: +20 | Một lòng trung thành tuyệt đối với tông môn, sẵn sàng tử chiến bảo vệ sơn môn. |
| 123 | `vo_cau_linh_the` | Vô Cấu Linh Thể | 3 | human | physique | innate | Linh +4; Thể +20 | qiRate: x1.55, breakthrough: +15%, dodge: +10% | Cơ thể bẩm sinh không chút tạp chất phàm trần, hấp thu linh khí nhanh và dễ đột phá. |
| 124 | `tien_phong_dao_cot` | Tiên Phong Đạo Cốt | 3 | human | mindset | innate | Linh +3; Ngộ +11; Đạo tâm +13 | qiRate: x1.4, prestige: +20, lifespan: +50, mindStateBonus: +25 | Phong thái thoát tục như thần tiên hạ phàm, đi đến đâu cũng được người đời kính ngưỡng. |
| 125 | `than_nong_chuyen_the` | Thần Nông Chuyển Thế | 3 | all | profession | reincarnation | Nghệ +20 | lifespan: +100, alchemy: +25%, hungerRate: x0.6 | Bẩm sinh có hơi thở thân thiện với linh thảo, trồng trọt và luyện đan đều đạt hiệu quả cao. |
| 126 | `tran_phap_dai_su` | Trận Pháp Đại Sư | 3 | all | profession | acquired | Ngộ +5; Nghệ +20 | comprehension: x1.6, def: +20, dodge: +15% | Thấu hiểu quy luật vận hành của thiên địa trận văn, mượn thế đất trời để phòng ngự. |
| 127 | `phu_luc_tien_thien` | Phù Lục Tiên Thiên | 3 | all | profession | acquired | Ngộ +3; Chiến +3; Nghệ +20 | atk: x1.35, comprehension: x1.4, moveSpeed: x1.15 | Họa phù nhanh như chớp giật, mỗi nét bút đều dẫn động thiên địa linh lực công kích địch. |
| 128 | `am_khi_chi_vuong` | Ám Khí Chi Vương | 3 | human | combat | acquired | Chiến +22 | crit: +20%, atkSpeed: x1.3, atk: x1.2 | Tinh thông các loại phi đao, châm độc và cơ quan ám khí của thế gia Nhân tộc. |
| 129 | `hao_nhien_chinh_khi` | Hạo Nhiên Chính Khí | 3 | human | mindset | innate | Ngộ +11; Chiến +3; Đạo tâm +13 | willpowerBonus: +35, mindStateBonus: +30, heartDemonResistance: +30%, atk: x1.35 | Trong ngực nuôi dưỡng một luồng Hạo Nhiên Chính Khí của Nho gia, vạn tà bất xâm. |
| 130 | `nho_dao_chi_thanh` | Nho Đạo Chí Thánh | 3 | human | social | acquired | Linh +2; Ngộ +5; Đạo tâm +6 | comprehension: x1.65, prestige: +45, mindStateBonus: +25, qiRate: x1.3 | Đọc vạn quyển sách, dùng văn nhập đạo, lời nói hóa thành pháp tắc giáo hóa chúng sinh. |
| 131 | `hoang_co_thanh_the` | Hoang Cổ Thánh Thể | 4 | human | physique | innate | Linh -6; Thể +38; Chiến +18; Đạo tâm +8 | hp: x2.45, atk: x1.85, armor: +30, qiRate: x0.75, lifespan: +300, willpowerBonus: +45, bodyCultivationGain: +40% | Nhục thân chí tôn của Nhân tộc thời Hoang Cổ, khí huyết màu vàng kim áp đảo vạn tộc. |
| 132 | `tien_thien_dao_the` | Tiên Thiên Đạo Thể | 4 | human | physique | innate | Linh +8; Ngộ +7; Thể +30 | qiRate: x1.95, comprehension: x1.85, breakthrough: +23%, dodge: +15%, mindStateBonus: +35, daoAffinity: +35% | Thân thể gần gũi với Đại Đạo nhất của Nhân tộc, ngôn xuất pháp tùy, tu luyện thần tốc. |
| 133 | `linh_lung_that_khieu` | Linh Lung Thất Khiếu | 4 | human | mindset | innate | Linh +4; Ngộ +25; Đạo tâm +20 | comprehension: x2.1, qiRate: x1.5, breakthrough: +20%, alchemy: +25%, mindStateBonus: +30 | Trái tim có bảy khiếu thông thiên, thấu hiểu vạn vật, ngộ tính và đan đạo đều tuyệt đỉnh. |
| 134 | `kiem_tien_chuyen_the` | Kiếm Tiên Chuyển Thế | 4 | human | combat | reincarnation | Chiến +36 | atk: x1.8, crit: +25%, atkSpeed: x1.3, willpowerBonus: +35 | Kiếm tâm thông minh, một nhành cỏ trong tay cũng hóa thành thần kiếm chém rách bầu trời. |
| 135 | `dan_dao_tong_su` | Đan Đạo Tông Sư | 4 | all | profession | acquired | Linh +2; Ngộ +3; Nghệ +30 | alchemy: +50%, comprehension: x1.4, qiRate: x1.2 | Cảm nhận dược tính và khống hỏa đạt mức xuất thần nhập hóa, luyện đan bách phát bách trúng. |
| 136 | `luyen_khi_ky_tai` | Luyện Khí Kỳ Tài | 4 | all | profession | acquired | Chiến +2; Nghệ +37 | craftingSpeed: x1.9, atk: x1.3, armor: +15 | Đôi tay khéo léo trời phú, rèn đúc pháp bảo thần binh nhanh gấp đôi và uy lực vượt trội. |
| 137 | `nhan_hoang_huyet_mach` | Nhân Hoàng Huyết Mạch | 5 | human | social | lineage | Linh +6; Thể +10; Chiến +8; Đạo tâm +13 | hp: x2.20, atk: x1.95, prestige: +100, willpowerBonus: +60, breakthrough: +28%, qiRate: x1.75, leadershipAura: +30% | Dòng máu của Nhân Hoàng thượng cổ thống lĩnh Cửu Châu, vạn dân quy phục, khí vận hộ thể. |
| 138 | `tien_thien_kiem_thai` | Tiên Thiên Kiếm Thai | 5 | human | combat | innate | Chiến +53 | atk: x2.35, crit: +40%, atkSpeed: x1.45, willpowerBonus: +50, swordAffinity: +70% | Đan điền tự thai nghén một thanh Tiên Thiên Bản Mệnh Kiếm, nhất kiếm phá vạn pháp. |
| 139 | `van_phap_thong_huyen_the` | Vạn Pháp Thông Huyền Thể | 5 | all | profession | acquired | Linh +7; Ngộ +10; Nghệ +49 | comprehension: x2.25, alchemy: +55%, craftingSpeed: x1.90, qiRate: x1.90, mindStateBonus: +45, professionLearning: +50% | Đan, Khí, Trận, Phù tứ đại tiên nghệ của Nhân tộc đều tự thông không cần thầy dạy. |
| 140 | `trich_tien_lam_tran` | Trích Tiên Lâm Trần | 5 | human | mindset | reincarnation | Linh +10; Ngộ +33; Đạo tâm +27 | qiRate: x2.20, comprehension: x2.20, breakthrough: +32%, mindStateBonus: +55, heartDemonResistance: +55%, reincarnationMemory: +35% | Chân Tiên trên chín tầng trời chuyển thế lịch kiếp, mang theo tiên vận và đạo cảnh siêu phàm. |
| 141 | `da_tinh_kho_thuan` | Dã Tính Khó Thuần | 1 | beast | mindset | innate | Ngộ -5; Chiến +1; Đạo tâm +4 | atk: x1.15, comprehension: x0.7, mindStateBonus: -12 | Bản tính hung hăng hoang dã chưa phai, khó tập trung ngồi thiền nhưng đánh nhau rất liều. |
| 142 | `linh_tri_cham_mo` | Linh Trí Chậm Mở | 1 | beast | mindset | innate | Ngộ -8; Thể +1; Đạo tâm +4 | comprehension: x0.55, hp: x1.15, physique: +4 | Khai trí muộn hơn đồng loại, tư duy đơn giản nhưng khí huyết nguyên thủy dồi dào. |
| 143 | `huyet_mach_pha_tap` | Huyết Mạch Pha Tạp | 1 | beast | physique | lineage | Linh -5; Thể +6; Đạo tâm -4 | qiRate: x0.8, breakthrough: -10%, dodge: +8% | Huyết mạch trải qua nhiều đời đã loãng, khó thức tỉnh thần thông tổ tiên. |
| 144 | `so_lua_bam_sinh` | Sợ Lửa Bẩm Sinh | 1 | beast | survival | innate | Thể +3; Đạo tâm -2 | def: -6, moveSpeed: x1.12, willpowerBonus: -10 | Bộ lông hoặc lớp da nhạy cảm với nhiệt độ cao, bản năng e ngại hỏa diễm và sấm sét. |
| 145 | `tap_tinh_ngu_dong` | Tập Tính Ngủ Đông | 1 | beast | survival | innate | Thể +3; Đạo tâm +2 | hungerRate: x0.6, lifespan: +40, moveSpeed: x0.85 | Tiêu hao rất ít thức ăn và tuổi thọ dài hơn, nhưng cử động có phần chậm chạp. |
| 146 | `da_tinh_nguyen_thuy` | Dã Tính Nguyên Thủy | 2 | beast | survival | innate | Ngộ -10; Thể +7; Chiến +2; Đạo tâm +3 | moveSpeed: x1.3, atk: x1.25, comprehension: x0.6 | Giữ trọn bản năng săn mồi của dã thú rừng sâu, tốc độ và sức cắn xé kinh người. |
| 147 | `man_hoang_cu_luc` | Man Hoang Cự Lực | 2 | beast | physique | innate | Thể +14; Chiến +2; Nghệ +2 | atk: x1.3, hp: x1.25, craftingSpeed: x1.3, physique: +8 | Mang dòng máu cự thú thời man hoang (Hùng/Viên), một tát vỗ nát tảng đá lớn. |
| 148 | `thiet_giap_lan_phien` | Thiết Giáp Lân Phiến | 2 | beast | physique | innate | Thể +14 | armor: +15, def: +12, hp: x1.2 | Toàn thân phủ lớp vảy hoặc da dày cứng như sắt nguội, giảm mạnh sát thương vật lý. |
| 149 | `loi_trao_xe_gio` | Lợi Trảo Xé Gió | 2 | beast | combat | innate | Chiến +14 | crit: +16%, atk: x1.25, atkSpeed: x1.15 | Móng vuốt sắc bén như thần binh lợi khí (Hổ/Báo/Lang), mỗi cú vồ dễ gây chí mạng. |
| 150 | `son_lam_chi_vuong` | Sơn Lâm Chi Vương | 2 | beast | social | innate | Chiến +2; Đạo tâm +4 | prestige: +25, atk: x1.2, willpowerBonus: +20 | Uy thế chúa sơn lâm khiến bách thú tầm thường phải cúi đầu nhường đường. |
| 151 | `phong_duc_phi_hanh` | Phong Dực Phi Hành | 2 | beast | survival | innate | Thể +7; Đạo tâm +3 | moveSpeed: x1.3, dodge: +18% | Đôi cánh chim ưng/tiên hạc cưỡi gió lướt mây, tốc độ di chuyển và né tránh vượt trội. |
| 152 | `linh_giac_bao_nguy` | Linh Giác Báo Nguy | 2 | beast | mindset | innate | Ngộ +7; Đạo tâm +8 | dodge: +20%, moveSpeed: x1.2, mindStateBonus: +15 | Linh thú (Lộc/Thỏ) có trực giác thiên nhiên cực nhạy trước tai họa và sát khí. |
| 153 | `thuc_than_thao_thiet` | Huyết Mạch Thao Thiết | 3 | beast | survival | innate | Linh +3; Thể +15; Chiến +2; Đạo tâm +5 | hungerRate: x1.55, hp: x1.5, qiRate: x1.4, atk: x1.3 | Dạ dày có thể tiêu hóa vạn vật thành tinh lực tu luyện, nhưng lúc nào cũng đói cồn cào. |
| 154 | `thanh_khau_ho_huyet` | Thanh Khâu Hồ Huyết | 3 | beast | mindset | lineage | Linh +3; Ngộ +16; Đạo tâm +13 | comprehension: x1.65, dodge: +22%, qiRate: x1.4, mindStateBonus: +20 | Huyết mạch Hồ tộc núi Thanh Khâu, thông minh tuyệt đỉnh, thân pháp uyển chuyển mê hoặc. |
| 155 | `loi_bang_vu_duc` | Lôi Bằng Vũ Dực | 3 | beast | combat | innate | Chiến +23 | moveSpeed: x1.45, atkSpeed: x1.3, crit: +18%, atk: x1.4 | Mang một tia huyết mạch Kim Sí Đại Bằng, lao xuống như sấm sét xé toạc bầu trời. |
| 156 | `huyen_quy_tho_nguyen` | Huyền Quy Thọ Nguyên | 3 | beast | physique | innate | Thể +20 | lifespan: +220, armor: +25, def: +25, moveSpeed: x0.85 | Huyết mạch Huyền Quy cổ đại, giáp lưng dày không thể phá vỡ và tuổi thọ trường tồn. |
| 157 | `bach_ho_sat_phat` | Bạch Hổ Sát Phạt | 3 | beast | combat | innate | Chiến +24 | atk: x1.55, crit: +22%, willpowerBonus: +25 | Thừa hưởng Canh Kim sát khí của Bạch Hổ, móng vuốt chém đứt mọi hộ thể cương khí. |
| 158 | `thong_linh_bao_the` | Thông Linh Bảo Thể | 3 | beast | root | innate | Linh +24 | qiRate: x1.55, breakthrough: +18%, mindStateBonus: +25 | Thân thể linh thú thuần khiết hòa hợp với linh mạch tự nhiên, tu luyện nhanh gấp bội. |
| 159 | `yeu_dan_tinh_thuan` | Yêu Đan Tinh Thuần | 3 | beast | root | acquired | Linh +24; Thể +4 | qiRate: x1.55, hp: x1.45, breakthrough: +15%, lifespan: +120 | Yêu đan kết tụ trong cơ thể tròn trịa không tỳ vết, dự trữ yêu lực và thọ nguyên dồi dào. |
| 160 | `bach_thu_trieu_bai` | Bách Thú Triều Bái | 3 | beast | social | innate | Thể +2; Chiến +2; Đạo tâm +6 | prestige: +50, atk: x1.3, hp: x1.3, willpowerBonus: +25 | Huyết mạch vương giả trong Yêu tộc, tiếng gầm vang vọng khiến muôn thú thần phục. |
| 161 | `long_huyet_ba_the` | Long Huyết Bá Thể | 4 | beast | physique | lineage | Thể +39; Chiến +6 | hp: x2.1, atk: x1.8, armor: +25, lifespan: +250, willpowerBonus: +40 | Trong người chảy dòng máu Chân Long thượng cổ, long uy cuồn cuộn, nhục thân bá đạo. |
| 162 | `cuu_vi_thien_ho` | Cửu Vĩ Thiên Hồ | 4 | beast | mindset | lineage | Linh +8; Ngộ +25; Đạo tâm +20 | comprehension: x2.1, qiRate: x2, dodge: +30%, mindStateBonus: +40, breakthrough: +25% | Huyết mạch Cửu Vĩ Thiên Hồ hoàng tộc, ngộ tính ngang ngửa Tiên Thiên Đạo Thể của Nhân tộc. |
| 163 | `bat_tu_phuong_huyet` | Bất Tử Phượng Huyết | 4 | beast | physique | lineage | Linh +7; Thể +39; Chiến +6 | hp: x2.1, qiRate: x1.9, atk: x1.7, lifespan: +300, breakthrough: +20% | Mang dòng máu Phượng Hoàng niết bàn trong biển lửa, sinh cơ mãnh liệt và chân hỏa hộ thân. |
| 164 | `thuy_thu_ky_lan` | Thụy Thú Kỳ Lân | 4 | beast | social | innate | Linh +8; Đạo tâm +9 | breakthrough: +25%, qiRate: x2, prestige: +60, heartDemonResistance: +40% | Thụy thú mang điềm lành của trời đất, đi tới đâu linh khí tụ hội, thiên kiếp không nỡ đánh mạnh. |
| 165 | `thuong_co_cung_ky` | Thượng Cổ Cùng Kỳ | 4 | beast | combat | innate | Chiến +37 | atk: x1.9, crit: +28%, atkSpeed: x1.3, willpowerBonus: +35 | Huyết mạch Tứ Đại Hung Thú thượng cổ, càng chém giết càng hung tàn bất khả chiến bại. |
| 166 | `hoa_hinh_hoan_my` | Hóa Hình Hoàn Mỹ | 4 | beast | root | acquired | Linh +36; Ngộ +9; Thể +6 | comprehension: x2.1, qiRate: x1.8, hp: x1.8, breakthrough: +25% | Phá bỏ hoàn toàn gông cùm linh trí của thú loại, vừa có nhục thân Yêu tộc vừa có ngộ tính Nhân tộc. |
| 167 | `to_long_chan_huyet` | Tổ Long Chân Huyết | 5 | beast | physique | lineage | Thể +56; Chiến +10 | hp: x2.70, atk: x2.25, armor: +50, lifespan: +600, willpowerBonus: +60, dragonBloodline: +100% | Huyết mạch phản tổ đạt tới cấp độ Thủy Tổ Chân Long, nhục thân nghiền nát chư thiên vạn giới. |
| 168 | `con_bang_thon_thien` | Côn Bằng Thôn Thiên | 5 | beast | combat | innate | Linh +10; Chiến +51 | moveSpeed: x1.95, dodge: +40%, atk: x2.15, qiRate: x2.20, devourEfficiency: +35% | Hóa Côn nuốt biển, hóa Bằng vỗ cánh chín vạn dặm, tốc độ và lực thôn phệ đứng đầu thái cổ. |
| 169 | `hong_hoang_di_chung` | Hồng Hoang Dị Chủng | 5 | beast | root | innate | Linh +53; Thể +12; Chiến +8 | hp: x2.45, qiRate: x2.35, atk: x2.05, breakthrough: +30%, lifespan: +700, primalLawAffinity: +45% | Sinh linh thần dị sót lại từ thời Hồng Hoang sơ khai, mỗi giọt máu đều chứa pháp tắc nguyên thủy. |
| 170 | `van_yeu_chi_to` | Vạn Yêu Chi Tổ | 5 | beast | social | innate | Linh +9; Ngộ +8; Chiến +8; Đạo tâm +13 | qiRate: x2.10, comprehension: x2.05, atk: x2.00, prestige: +120, willpowerBonus: +65, mindStateBonus: +50, beastCommand: +50% | Yêu Đế tái thế, thống ngự vạn yêu thiên hạ, mở ra thời đại hoàng kim cho Yêu tộc. |
| 171 | `ma_khi_phan_phe` | Ma Khí Phản Phệ | 1 | demon | physique | innate | Thể +2; Chiến +1; Đạo tâm -4 | hp: x0.85, atk: x1.15, breakthrough: -8% | Cơ thể chưa chịu nổi ma khí bá đạo, thỉnh thoảng kinh mạch đau nhức nhưng công kích tăng nhẹ. |
| 172 | `khat_mau_mu_quang` | Khát Máu Mù Quáng | 1 | demon | mindset | innate | Ngộ -3; Chiến +1; Đạo tâm +4 | atk: x1.15, def: -10, mindStateBonus: -20, comprehension: x0.75 | Ngửi thấy mùi máu là mất hết lý trí, chỉ biết tấn công điên loạn không màng sống chết. |
| 173 | `so_anh_thien_duong` | Sợ Ánh Thiên Dương | 1 | demon | survival | innate | Thể +1; Đạo tâm +2 | hp: x0.9, moveSpeed: x0.92, dodge: +10% | Thuộc dòng dõi ma vật u tối, dưới ánh mặt trời gay gắt cảm thấy bức bối khó chịu. |
| 174 | `ma_hon_ton_khuyet` | Ma Hồn Tổn Khuyết | 1 | demon | mindset | innate | Linh +1; Ngộ +3; Đạo tâm -5 | breakthrough: -15%, heartDemonResistance: -20%, qiRate: x1.15 | Thần hồn bẩm sinh có vết nứt, dễ bị tâm ma xâm nhập khi đột phá cảnh giới. |
| 175 | `tan_nhan_da_nghi` | Tàn Nhẫn Đa Nghi | 1 | demon | social | innate | Đạo tâm +2 | crit: +12%, dodge: +8%, prestige: -20 | Không bao giờ tin tưởng bất kỳ ai, luôn đề phòng cả đồng tộc nhưng ra đòn cực kỳ hiểm độc. |
| 176 | `dien_cuong_khat_mau` | Điên Cuồng Khát Máu | 2 | demon | mindset | innate | Ngộ +7; Chiến +2; Đạo tâm +4 | atk: x1.3, crit: +15%, def: -10, breakthrough: -15% | Bản tính hiếu sát của Ma tộc, càng chém giết càng hưng phấn nhưng làm tâm cảnh bất ổn. |
| 177 | `u_minh_quy_the` | U Minh Quỷ Thể | 2 | demon | physique | innate | Thể +8 | dodge: +20%, moveSpeed: x1.25, crit: +10%, hp: x0.85 | Thân thể nửa thực nửa hư như u hồn địa phủ, di chuyển không tiếng động và khó bị đánh trúng. |
| 178 | `phan_cot_nghich_tu` | Phản Cốt Bẩm Sinh | 2 | demon | social | innate | Chiến +2; Đạo tâm +4 | atk: x1.3, crit: +12%, prestige: -30, willpowerBonus: +22 | Sinh ra đã mang xương phản nghịch, không chịu khuất phục cường quyền, ý chí bướng bỉnh. |
| 179 | `thuc_thi_hap_huyet` | Thực Thi Hấp Huyết | 2 | demon | survival | innate | Thể +9; Chiến +2; Đạo tâm +3 | hungerRate: x0.55, hp: x1.3, atk: x1.2 | Có thể hấp thu tinh huyết của con mồi để bù đắp cơn đói và phục hồi thương thế. |
| 180 | `hac_am_an_sat` | Hắc Ám Ẩn Sát | 2 | demon | combat | innate | Chiến +12 | crit: +20%, moveSpeed: x1.2, dodge: +12% | Hòa mình hoàn toàn vào bóng đêm, tung ra một đòn cắt cổ kết liễu mục tiêu. |
| 181 | `ma_giap_ho_than` | Ma Giáp Hộ Thân | 2 | demon | physique | innate | Thể +12; Chiến +1 | armor: +15, def: +14, atk: x1.15 | Ma khí ngưng kết trên bề mặt da thành lớp giáp gai đen kịt, vừa chống đòn vừa hung dữ. |
| 182 | `oan_khi_trien_than` | Oán Khí Triền Thân | 2 | demon | root | innate | Linh +14; Chiến +2 | qiRate: x1.3, atk: x1.25, mindStateBonus: -10 | Quanh người luôn có oán hồn gào thét, làm kẻ địch khiếp sợ và tăng tốc độ hấp thu ma khí. |
| 183 | `thien_ma_huyet_the` | Thiên Ma Huyết Thể | 3 | demon | physique | lineage | Linh +3; Thể +25; Chiến +4 | hp: x1.6, atk: x1.55, qiRate: x1.4 | Huyết mạch quý tộc của Ma giới, sinh mệnh lực dồi dào và lực công kích tàn bạo. |
| 184 | `huyet_hai_thao_thien` | Huyết Hải Thao Thiên | 3 | demon | combat | innate | Linh +3; Thể +5; Chiến +24 | hp: x1.6, atk: x1.55, qiRate: x1.35 | Chân nguyên hóa thành biển máu ngập trời, nuốt chửng sinh cơ vạn vật xung quanh. |
| 185 | `cuu_u_ma_hoa` | Cửu U Ma Hỏa | 3 | demon | root | innate | Linh +23; Chiến +4 | atk: x1.55, crit: +18%, qiRate: x1.4 | Khống chế ngọn lửa đen từ tầng đáy Cửu U, đốt cháy cả nhục thân lẫn linh hồn đối thủ. |
| 186 | `thon_hon_doat_phach` | Thôn Hồn Đoạt Phách | 3 | demon | mindset | innate | Ngộ +16; Chiến +3; Đạo tâm +13 | comprehension: x1.65, atk: x1.4, willpowerBonus: +25 | Luyện hóa tàn hồn kẻ bại trận để tăng trưởng ngộ tính và tinh thần lực của bản thân. |
| 187 | `tu_la_chien_the` | Tu La Chiến Thể | 3 | demon | combat | lineage | Chiến +24 | atk: x1.55, atkSpeed: x1.3, armor: +20, willpowerBonus: +35 | Dòng máu Tu La tộc sinh ra vì chiến tranh, trên chiến trường không biết mệt mỏi là gì. |
| 188 | `ma_tam_chung_dao` | Ma Tâm Chủng Đạo | 3 | demon | mindset | acquired | Linh +4; Ngộ +11; Đạo tâm +13 | breakthrough: +18%, qiRate: x1.5, heartDemonResistance: +30%, mindStateBonus: +25 | Lấy tâm ma làm hạt giống đạo quả, biến mọi tạp niệm và dục vọng thành động lực đột phá. |
| 189 | `duc_gioi_ma_co` | Dục Giới Ma Cơ | 3 | demon | social | innate | Linh +4; Đạo tâm +6 | dodge: +25%, prestige: +35, qiRate: x1.45, crit: +15% | Nhất cử nhất động đều mang ma lực câu hồn đoạt phách, làm tan rã ý chí chiến đấu của địch. |
| 190 | `bach_cot_ma_khu` | Bạch Cốt Ma Khu | 3 | demon | physique | innate | Thể +25 | def: +25, armor: +25, hp: x1.6, willpowerBonus: +30 | Toàn bộ xương cốt được tôi luyện thành Bạch Cốt Thần Ma cứng hơn huyền thiết, không biết đau đớn. |
| 191 | `hon_don_thon_thien` | Hỗn Độn Thôn Thiên | 4 | demon | root | innate | Linh +38; Chiến +7; Đạo tâm -4 | qiRate: x2, atk: x1.9, breakthrough: -15%, willpowerBonus: +40 | Bá đạo thôn phệ vạn vật và linh khí đất trời để cưỡng ép tăng tu vi với tốc độ khủng khiếp. |
| 192 | `thai_co_ma_nhan` | Thái Cổ Ma Nhãn | 4 | demon | combat | lineage | Ngộ +6; Chiến +37 | crit: +35%, atk: x1.9, comprehension: x1.7, dodge: +20% | Giữa trán mở ra con mắt thứ ba của Cổ Ma, bắn ra tia sáng hủy diệt xuyên thủng mọi phòng ngự. |
| 193 | `bat_tu_huyet_ma` | Bất Tử Huyết Ma | 4 | demon | physique | innate | Linh +5; Thể +39 | hp: x2.1, lifespan: +300, def: +25, qiRate: x1.6 | Hóa thân thành biển máu bất tử, chừng nào huyết khí chưa cạn thì không ai giết nổi. |
| 194 | `van_ma_trieu_tong` | Vạn Ma Triều Tông | 4 | demon | social | lineage | Linh +6; Chiến +6; Đạo tâm +9 | prestige: +80, atk: x1.8, qiRate: x1.8, breakthrough: +25%, willpowerBonus: +45 | Hoàng tộc Ma giới chân chính, ma uy trấn áp thiên địa, vạn ma quỳ lạy nghe lệnh. |
| 195 | `huy_diet_ma_loi` | Hủy Diệt Ma Lôi | 4 | demon | root | innate | Linh +30; Chiến +7 | atk: x1.9, crit: +25%, moveSpeed: x1.4, breakthrough: +20% | Dị chủng Hắc Ám Ma Lôi mang pháp tắc hủy diệt thuần túy, ngay cả thiên kiếp cũng phải kiêng dè. |
| 196 | `luc_dao_thien_ma` | Lục Đạo Thiên Ma | 4 | demon | mindset | innate | Linh +7; Ngộ +25; Đạo tâm +20 | mindStateBonus: +45, heartDemonResistance: +40%, comprehension: x2.1, qiRate: x1.9 | Chúa tể của các loài Thiên Ma, tự do ra vào tâm cảnh chúng sinh, vĩnh viễn không bị tẩu hỏa nhập ma. |
| 197 | `co_ma_chan_to` | Cổ Ma Chân Tổ | 5 | demon | physique | lineage | Thể +56; Chiến +10 | hp: x2.75, atk: x2.30, armor: +50, lifespan: +600, willpowerBonus: +65, demonBloodline: +100% | Huyết mạch Thủy Tổ Cổ Ma sinh ra từ trước khi có Thiên Đạo, nhục thân và ma lực đều vô địch. |
| 198 | `hon_don_ma_thai` | Hỗn Độn Ma Thai | 5 | demon | root | innate | Linh +54; Ngộ +9; Thể +9 | qiRate: x2.45, breakthrough: +30%, hp: x2.10, comprehension: x2.10, dualEnergyCompatibility: +60% | Sinh ra từ lõi Hỗn Độn Ma Uyên, coi ma khí và linh khí đều là thức ăn bổ dưỡng nhất. |
| 199 | `vo_thuong_sat_than` | Vô Thượng Sát Thần | 5 | demon | combat | acquired | Chiến +53 | atk: x2.40, crit: +45%, atkSpeed: x1.50, willpowerBonus: +70, heartDemonResistance: +55%, killInsight: +30% | Lấy sát nhập đạo đạt cảnh giới chí cao, mỗi sinh mạng gục xuống dưới chân đều hóa thành đạo hạnh. |
| 200 | `vinh_hang_ma_chu` | Vĩnh Hằng Ma Chủ | 5 | demon | mindset | innate | Linh +10; Ngộ +33; Chiến +9; Đạo tâm +27 | qiRate: x2.20, comprehension: x2.20, atk: x2.10, prestige: +120, mindStateBonus: +60, willpowerBonus: +70, demonCommand: +50% | Đạo tâm Ma Chủ vĩnh hằng bất diệt, ngang hàng với Thiên Đạo, thống lĩnh ma giới muôn đời. |
| 201 | `cot_mach_manh_hep` | Cốt Mạch Mảnh Hẹp | 1 | all | physique | innate | Thể +3; Chiến -2 | hp: x0.88, atk: x0.90, moveSpeed: x1.08 | Kinh cốt nhỏ và kinh mạch chịu tải kém, khó bộc phát sức mạnh nhưng thân pháp nhẹ hơn người thường. |
| 202 | `huyet_khi_nghich_luu` | Huyết Khí Nghịch Lưu | 1 | all | physique | innate | Thể +4; Chiến +1 | hp: x0.92, atk: x1.12, staminaRecovery: x0.75 | Khí huyết vận hành ngược nhịp, dễ hụt hơi khi giao chiến kéo dài nhưng bộc phát ngắn hạn khá mạnh. |
| 203 | `cot_chat_mat_dac` | Cốt Chất Mật Đặc | 2 | all | physique | innate | Thể +13 | hp: x1.18, def: +10, moveSpeed: x0.94 | Xương nặng và đặc hơn bình thường, tăng khả năng chịu lực nhưng giảm đôi chút độ linh hoạt. |
| 204 | `linh_huyet_du_doi` | Linh Huyết Dồi Dào | 2 | all | physique | innate | Linh +1; Thể +14 | hp: x1.22, qiRate: x1.18, regeneration: +18% | Máu thịt chứa nhiều linh tính, hồi phục nhanh và hỗ trợ vận hành linh lực. |
| 205 | `ngoc_cot_linh_co` | Ngọc Cốt Linh Cơ | 3 | all | physique | innate | Linh +2; Thể +24 | hp: x1.45, def: +20, qiRate: x1.30, lifespan: +80 | Xương cốt như ngọc, cơ thể ít tạp chất và tương hợp tốt với linh khí tinh thuần. |
| 206 | `kim_co_ngoc_tuy` | Kim Cơ Ngọc Tủy | 3 | all | physique | innate | Thể +24; Chiến +3 | hp: x1.50, atk: x1.35, armor: +22, bodyCultivationGain: +22% | Gân cốt và tủy cốt đồng thời được cường hóa, thích hợp con đường thể tu lẫn pháp thể song tu. |
| 207 | `vo_lau_bao_the` | Vô Lậu Bảo Thể | 4 | all | physique | innate | Linh +4; Thể +37 | hp: x1.85, qiRate: x1.55, hungerRate: x0.55, thirstRate: x0.55, resourceEfficiency: +30% | Tinh khí gần như không thất thoát, giảm tiêu hao khi chiến đấu và bế quan dài ngày. |
| 208 | `hu_khong_phap_than` | Hư Không Pháp Thân | 4 | all | physique | acquired | Thể +34 | hp: x1.55, moveSpeed: x1.55, dodge: +38%, spaceResistance: +35% | Nhục thân có thể chạm vào khe hở không gian trong khoảnh khắc, thiên về né tránh và thoát hiểm. |
| 209 | `luan_hoi_dao_the` | Luân Hồi Đạo Thể | 5 | all | physique | innate | Ngộ +7; Thể +52 | hp: x2.20, comprehension: x1.90, breakthrough: +28%, reincarnationGrowth: +45% | Cơ thể khắc dấu luân hồi, mỗi lần vượt đại kiếp có cơ hội tái cấu trúc căn cơ thay vì chỉ tăng chỉ số thô. |
| 210 | `tien_thien_vo_cau_thai` | Tiên Thiên Vô Cấu Thai | 5 | all | physique | innate | Linh +9; Thể +53 | hp: x2.35, qiRate: x2.10, heartDemonResistance: +45%, impurityGain: x0.25, lifespan: +450 | Thân thể gần trạng thái tiên thiên thuần tịnh, độc chướng và tạp khí rất khó lưu lại. |
| 211 | `kim_linh_can_tinh_thuan` | Kim Linh Căn Tinh Thuần | 2 | all | root | innate | Linh +14; Chiến +1 | qiRate: x1.22, atk: x1.18, metalAffinity: +30% | Kim linh căn thuần, thiên về sắc bén, công kích và luyện khí kim thuộc. |
| 212 | `moc_linh_can_tinh_thuan` | Mộc Linh Căn Tinh Thuần | 2 | all | root | innate | Linh +14 | qiRate: x1.22, regeneration: +15%, woodAffinity: +30% | Mộc linh căn thuần, sinh cơ mạnh, hợp linh thực, trị thương và công pháp mộc hệ. |
| 213 | `thuy_linh_can_tinh_thuan` | Thủy Linh Căn Tinh Thuần | 2 | all | root | innate | Linh +14 | qiRate: x1.22, dodge: +10%, waterAffinity: +30% | Thủy linh căn thuần, vận khí mềm mại và ổn định, hợp thủ pháp biến hóa dài hơi. |
| 214 | `hoa_linh_can_tinh_thuan` | Hỏa Linh Căn Tinh Thuần | 2 | all | root | innate | Linh +14; Chiến +1 | qiRate: x1.22, atk: x1.18, fireAffinity: +30%, alchemy: +10% | Hỏa linh căn thuần, linh lực bộc phát mạnh, thuận lợi cho hỏa pháp và luyện đan. |
| 215 | `tho_linh_can_tinh_thuan` | Thổ Linh Căn Tinh Thuần | 2 | all | root | innate | Linh +14 | qiRate: x1.20, def: +12, earthAffinity: +30% | Thổ linh căn thuần, căn cơ ổn định, phòng thủ và khả năng chịu phản phệ tốt. |
| 216 | `quang_minh_linh_can` | Quang Minh Linh Căn | 3 | all | root | innate | Linh +24 | qiRate: x1.45, heartDemonResistance: +25%, lightAffinity: +50% | Dị linh căn quang hệ, khắc chế uế khí và có thiên hướng hồi phục, thanh tẩy. |
| 217 | `thai_am_linh_can` | Thái Âm Linh Căn | 3 | all | root | innate | Linh +24; Ngộ +2 | qiRate: x1.48, comprehension: x1.25, yinAffinity: +50% | Linh căn thiên âm nhưng ổn định hơn Cửu Âm Tuyệt Mạch, mạnh về hàn nguyệt và thần hồn. |
| 218 | `thai_duong_linh_can` | Thái Dương Linh Căn | 3 | all | root | innate | Linh +24; Thể +2; Chiến +3 | qiRate: x1.48, atk: x1.35, yangAffinity: +50%, hp: x1.20 | Linh căn chí dương, bộc phát hỏa dương mạnh và tăng sức sống. |
| 219 | `hu_khong_linh_can` | Hư Không Linh Căn | 4 | all | root | innate | Linh +36; Ngộ +6 | qiRate: x1.80, comprehension: x1.70, moveSpeed: x1.35, spaceAffinity: +70% | Linh căn hiếm liên hệ không gian, học thuật dịch chuyển và trận pháp không gian nhanh hơn rõ rệt. |
| 220 | `luan_hoi_dao_can` | Luân Hồi Đạo Căn | 5 | all | root | innate | Linh +52; Ngộ +9 | qiRate: x2.25, comprehension: x2.15, breakthrough: +30%, deathLawAffinity: +75%, failureInsight: +40% | Đạo căn hiếm tương hợp sinh tử và luân hồi; thất bại lớn có thể chuyển hóa thành tích lũy căn cơ. |
| 221 | `tam_tinh_nong_noi` | Tâm Tính Nóng Nảy | 1 | all | mindset | innate | Ngộ +3; Chiến +1; Đạo tâm +4 | atk: x1.10, mindStateBonus: -10, meditationEfficiency: -15% | Dễ nóng vội trước lợi ích và khi bị khiêu khích, bộc phát nhanh nhưng khó bế quan lâu. |
| 222 | `tri_nho_mo_ho` | Trí Nhớ Mơ Hồ | 1 | all | mindset | innate | Ngộ -1; Đạo tâm +4 | comprehension: x0.85, professionLearning: -15% | Khó ghi nhớ kinh văn dài và công thức phức tạp, học kỹ nghệ chậm hơn. |
| 223 | `hieu_hoc_chuyen_can` | Hiếu Học Chuyên Cần | 2 | all | mindset | innate | Ngộ +8; Đạo tâm +8 | comprehension: x1.18, professionLearning: +18%, willpowerGrowth: +10% | Có thói quen ghi chép, đối chiếu và luyện tập lặp lại, tiến bộ ổn định dù không bộc phát. |
| 224 | `tam_nhu_chi_thuy` | Tâm Như Chỉ Thủy | 2 | all | mindset | innate | Ngộ +7; Đạo tâm +8 | mindStateBonus: +18, mindRecovery: +20%, heartDemonResistance: +15% | Cảm xúc ít dao động, dễ duy trì thiền định và hồi phục sau biến cố tinh thần. |
| 225 | `dao_si` | Đạo Si | 3 | all | mindset | innate | Linh +2; Ngộ +15; Đạo tâm +13 | comprehension: x1.55, qiRate: x1.25, prestige: -8, obsessionGain: +15% | Có thể quên ăn quên ngủ khi nghiên cứu một đạo, học rất sâu nhưng dễ lệch khỏi đời sống xã hội. |
| 226 | `minh_tam_kien_tinh` | Minh Tâm Kiến Tính | 3 | all | mindset | acquired | Ngộ +11; Đạo tâm +13 | mindStateBonus: +28, heartDemonResistance: +30%, breakthrough: +12% | Nhìn rõ động cơ và chấp niệm của bản thân, giảm mạnh dao động tâm cảnh khi thất bại. |
| 227 | `kiem_tam_thong_minh` | Kiếm Tâm Thông Minh | 4 | all | mindset | innate | Ngộ +23; Đạo tâm +20 | comprehension: x1.85, crit: +28%, swordAffinity: +55%, willpowerBonus: +35 | Tâm niệm sắc bén, dễ hiểu kiếm ý và phát hiện sơ hở trong chiêu thức. |
| 228 | `vo_duc_vo_cau` | Vô Dục Vô Cầu | 4 | all | mindset | innate | Ngộ +16; Đạo tâm +20 | mindStateBonus: +42, heartDemonResistance: +55%, prestige: -10, greedWeight: x0.30 | Dục vọng vật chất rất thấp, tâm ma khó lợi dụng nhưng động lực tranh đoạt tài nguyên cũng giảm. |
| 229 | `vo_nga_dao_tam` | Vô Ngã Đạo Tâm | 5 | all | mindset | acquired | Ngộ +33; Đạo tâm +27 | comprehension: x2.30, mindStateBonus: +58, heartDemonResistance: +65%, insightEventChance: +35% | Khi nhập định có thể tạm bỏ chấp niệm bản ngã để lĩnh hội quy luật khách quan của thiên địa. |
| 230 | `nhat_niem_thong_thien` | Nhất Niệm Thông Thiên | 5 | all | mindset | innate | Ngộ +34; Đạo tâm +27 | comprehension: x2.40, breakthrough: +30%, willpowerBonus: +55, greatInsightChance: +30% | Trong khoảnh khắc cực hạn có thể nối liền nhiều mảnh lĩnh ngộ thành một lần đại đốn ngộ. |
| 231 | `thu_the_qua_muc` | Thủ Thế Quá Mức | 1 | all | combat | innate | Chiến +3 | def: +6, atk: x0.88, atkSpeed: x0.90 | Quá coi trọng phòng thủ nên bỏ lỡ thời cơ phản kích. |
| 232 | `ham_chien_vo_do` | Ham Chiến Vô Độ | 1 | all | combat | innate | Chiến +7 | atk: x1.12, def: -6, staminaCost: +15% | Thích giao tranh trực diện ngay cả khi không cần thiết, dễ hao tổn thể lực. |
| 233 | `du_dau_thanh_thao` | Du Đấu Thành Thạo | 2 | all | combat | acquired | Chiến +13 | moveSpeed: x1.20, dodge: +14%, atk: x1.12 | Biết giữ khoảng cách và đổi góc đánh liên tục, thích hợp cung, pháp khí và phi kiếm. |
| 234 | `pha_chieu_nhay_ben` | Phá Chiêu Nhạy Bén | 2 | all | combat | acquired | Chiến +12 | crit: +12%, dodge: +12%, counterChance: +15% | Quan sát nhịp tấn công đối phương để phản kích đúng lúc. |
| 235 | `chien_thuat_gia` | Chiến Thuật Gia | 3 | all | combat | acquired | Ngộ +2; Chiến +20 | comprehension: x1.30, squadDamage: +18%, squadDefense: +18% | Giỏi chọn địa hình, phối hợp đội hình và ưu tiên mục tiêu, mạnh hơn rõ trong chiến đấu nhóm. |
| 236 | `phap_vo_song_tu` | Pháp Võ Song Tu | 3 | all | combat | innate | Linh +2; Chiến +23 | atk: x1.40, qiRate: x1.28, atkSpeed: x1.22, stanceSwitchCost: x0.55 | Có khả năng luân chuyển linh lực giữa pháp thuật và cận chiến mà ít bị gián đoạn. |
| 237 | `nhat_kiem_pha_phap` | Nhất Kiếm Phá Pháp | 4 | all | combat | innate | Chiến +36 | atk: x1.75, crit: +30%, shieldPierce: +35%, swordAffinity: +45% | Kiếm ý chuyên phá lớp hộ thể và kết cấu pháp thuật thay vì chỉ tăng sát thương thô. |
| 238 | `thien_co_chien_giac` | Thiên Cơ Chiến Giác | 4 | all | combat | innate | Chiến +30 | dodge: +35%, atkSpeed: x1.30, ambushResistance: +45%, squadInitiative: +30% | Cảm nhận được biến đổi chiến trường sớm hơn người khác, đặc biệt mạnh trong né chiêu và chỉ huy. |
| 239 | `van_phap_chien_than` | Vạn Pháp Chiến Thân | 5 | all | combat | innate | Chiến +51 | atk: x2.15, def: +40, techniqueAdaptation: +60%, weaponPenalty: x0.25 | Có thể thích nghi nhanh với nhiều loại công pháp chiến đấu và giảm bất lợi khi đổi phong cách. |
| 240 | `nhat_chien_thong_dao` | Nhất Chiến Thông Đạo | 5 | all | combat | innate | Ngộ +7; Chiến +50 | atk: x2.05, comprehension: x1.85, combatInsightChance: +40%, willpowerBonus: +55 | Trong sinh tử chiến có xác suất lĩnh ngộ trực tiếp nguyên lý của kỹ năng đang sử dụng. |
| 241 | `mieng_luoi_vung_ve` | Miệng Lưỡi Vụng Về | 1 | all | social | innate | Đạo tâm +2 | prestige: -10, negotiation: -15% | Khó diễn đạt ý định và dễ gây hiểu lầm trong giao tiếp. |
| 242 | `de_bi_anh_huong` | Dễ Bị Ảnh Hưởng | 1 | all | social | innate | Đạo tâm -2 | prestige: +5, willpowerBonus: -10, persuasionResistance: -20% | Thường thay đổi quyết định theo người xung quanh, dễ hòa nhập nhưng cũng dễ bị thao túng. |
| 243 | `thien_sinh_than_thien` | Thiên Sinh Thân Thiện | 2 | all | social | innate | Đạo tâm +4 | prestige: +20, relationshipGain: +20% | Khí chất dễ gần giúp giảm xung đột và xây dựng quan hệ nhanh hơn. |
| 244 | `nhan_qua_nhay_cam` | Nhân Quả Nhạy Cảm | 3 | all | social | innate | Ngộ +2; Đạo tâm +6; Khí vận +15 | comprehension: x1.20, relationshipInsight: +35%, fortune: +15 | Nhạy với ân oán và quan hệ nhân quả, dễ phát hiện mối liên kết quan trọng giữa người với người. |
| 245 | `quy_nhan_tuong_tro` | Quý Nhân Tương Trợ | 3 | all | social | innate | Đạo tâm +6; Khí vận +30 | prestige: +35, fortune: +30, mentorEncounter: +25% | Trong những nút thắt quan trọng thường dễ gặp người sẵn lòng trợ giúp, nhưng không đảm bảo miễn phí. |
| 246 | `de_vuong_khi_tuong` | Đế Vương Khí Tượng | 4 | all | social | innate | Đạo tâm +9 | prestige: +75, squadMorale: +30%, leadership: +40%, rivalryRisk: +15% | Khí chất lãnh đạo mạnh, tăng hiệu quả chỉ huy nhưng dễ thu hút tranh chấp quyền lực. |
| 247 | `thien_menh_so_bac` | Thiên Mệnh Số Bạc | 4 | all | social | innate | Đạo tâm +9; Khí vận +45 | fortune: +45, disasterChance: +25%, rareEncounterChance: +35% | Mệnh cách thường gặp đại cơ duyên kèm đại tai kiếp; biên độ vận mệnh lớn hơn người thường. |
| 248 | `nhan_qua_chi_chu` | Nhân Quả Chi Chủ | 5 | all | social | innate | Đạo tâm +13; Khí vận +55 | prestige: +90, fortune: +55, relationshipInsight: +70%, karmaControl: +45% | Có thiên phú đặc biệt trong việc nhìn, tích và chuyển hóa nhân quả; mạnh trong hệ thống quan hệ dài hạn. |
| 249 | `co_the_nhay_cam` | Cơ Thể Nhạy Cảm | 1 | all | survival | innate | Thể +3; Đạo tâm +2 | dodge: +8%, environmentResistance: -15%, poisonDetection: +20% | Nhạy với nhiệt độ và độc tố, phát hiện nguy hiểm sớm nhưng chịu môi trường khắc nghiệt kém. |
| 250 | `hoi_phuc_tot` | Hồi Phục Tốt | 2 | all | survival | innate | Thể +8; Đạo tâm +3 | hp: x1.15, regeneration: +22% | Vết thương nhẹ liền nhanh và ít để lại di chứng. |
| 251 | `sa_mac_thich_nghi` | Sa Mạc Thích Nghi | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | thirstRate: x0.65, heatResistance: +35%, moveSpeed: x1.10 | Cơ thể giữ nước tốt và chịu nóng lâu, phù hợp vùng hoang mạc. |
| 252 | `thuy_sinh_thich_nghi` | Thủy Sinh Thích Nghi | 2 | all | survival | innate | Thể +7; Đạo tâm +3 | swimSpeed: x1.35, oxygenUse: x0.55, waterResistance: +30% | Có thể nín thở rất lâu và di chuyển hiệu quả trong nước. |
| 253 | `linh_tuc_tuan_hoan` | Linh Tức Tuần Hoàn | 3 | all | survival | innate | Linh +2; Thể +11; Đạo tâm +5 | qiRate: x1.25, regeneration: +28%, staminaRecovery: +30% | Khi nghỉ ngơi, cơ thể tự tuần hoàn linh lực để hồi phục thể lực và vết thương. |
| 254 | `thien_dia_thich_ung` | Thiên Địa Thích Ứng | 4 | all | survival | innate | Thể +20; Đạo tâm +8 | hp: x1.55, environmentResistance: +50%, adaptationRate: +60% | Sau thời gian cư trú, cơ thể thích nghi dần với khí hậu, chướng khí và áp lực linh khí địa phương. |
| 255 | `van_vuc_sinh_ton` | Vạn Vực Sinh Tồn | 5 | all | survival | innate | Thể +32; Đạo tâm +10 | hp: x2.10, hungerRate: x0.35, thirstRate: x0.35, environmentResistance: +75%, disasterResistance: +45% | Có khả năng sống sót ở phần lớn môi trường cực đoan và giảm mạnh thiệt hại từ thiếu tài nguyên. |
| 256 | `mach_tuong_thien_phu` | Mạch Tượng Thiên Phú | 1 | all | profession | innate | Nghệ +6 | healing: +10%, alchemy: +5% | Có cảm giác tự nhiên với kinh mạch và thương thế, nhưng kiến thức còn thô sơ. |
| 257 | `thu_phap_kheo_leo` | Thủ Pháp Khéo Léo | 2 | all | profession | innate | Nghệ +14 | craftingSpeed: x1.28, alchemy: +12%, inscription: +18% | Đôi tay ổn định, thích hợp phù lục, luyện khí, cơ quan và y thuật tinh tế. |
| 258 | `linh_thuc_nong_su` | Linh Thực Nông Sư | 2 | all | profession | acquired | Nghệ +12 | farmingYield: +30%, alchemy: +10%, hungerRate: x0.85 | Hiểu chu kỳ sinh trưởng và linh khí đất, tăng hiệu quả trồng trọt linh thực. |
| 259 | `ngu_thu_su` | Ngự Thú Sư | 2 | all | profession | acquired | Nghệ +12 | taming: +30%, prestige: +15, relationshipGain: +10% | Giỏi quan sát tập tính và xây dựng khế ước với linh thú. |
| 260 | `y_dao_thong_hieu` | Y Đạo Thông Hiểu | 3 | all | profession | acquired | Ngộ +2; Nghệ +20 | healing: +35%, alchemy: +22%, comprehension: x1.25 | Am hiểu thương thế, kinh mạch và dược lý, cứu trị đồng môn hiệu quả. |
| 261 | `co_quan_tinh_toan` | Cơ Quan Tinh Toán | 3 | all | profession | acquired | Ngộ +2; Nghệ +24 | craftingSpeed: x1.50, trapEfficiency: +35%, comprehension: x1.25 | Giỏi cơ quan thuật và kết cấu máy móc, xây bẫy và công trình tinh vi. |
| 262 | `phap_tu_thien_phu` | Pháp Tu Thiên Phú | 3 | human | root | innate | Linh +24; Ngộ +3 | qiRate: x1.48, comprehension: x1.40, spellControl: +30% | Khả năng vận dụng pháp quyết và điều khiển linh lực tinh tế hơn mức bình thường. |
| 263 | `kiem_cot` | Kiếm Cốt | 3 | human | combat | innate | Chiến +23 | atk: x1.40, crit: +20%, swordAffinity: +45% | Xương cốt và tư thế tự nhiên phù hợp kiếm đạo, giảm thời gian làm quen với kiếm pháp. |
| 264 | `van_tu_dao_tam` | Văn Tự Đạo Tâm | 3 | human | mindset | innate | Ngộ +15; Đạo tâm +13 | comprehension: x1.55, professionLearning: +25%, mindStateBonus: +20 | Có khả năng từ kinh văn, bia đá và cổ tự suy ra ý nghĩa sâu hơn. |
| 265 | `ngu_hanh_dao_the` | Ngũ Hành Đạo Thể | 4 | human | physique | innate | Linh +6; Ngộ +5; Thể +30 | qiRate: x1.75, comprehension: x1.65, breakthrough: +22%, fiveElementControl: +60% | Đạo thể cân bằng năm hành, thiên về ổn định, chuyển đổi thuộc tính và trận pháp. |
| 266 | `thien_co_tran_tam` | Thiên Cơ Trận Tâm | 4 | all | profession | innate | Ngộ +7; Nghệ +30 | comprehension: x1.90, formation: +55%, def: +28 | Nhìn địa hình và dòng linh khí như mạng lưới trận văn, cực mạnh trong trận pháp. |
| 267 | `dan_tam_thong_huyen` | Đan Tâm Thông Huyền | 4 | all | profession | innate | Ngộ +4; Nghệ +30 | alchemy: +55%, comprehension: x1.55, pillFailure: -35% | Cảm nhận dược tính thay đổi theo từng nhịp lửa, thiên phú luyện đan gần cấp tông sư. |
| 268 | `kiem_tam_vo_cau` | Kiếm Tâm Vô Cấu | 4 | human | combat | innate | Chiến +36 | atk: x1.80, crit: +32%, swordAffinity: +65%, heartDemonResistance: +30% | Kiếm tâm ít tạp niệm, càng chuyên một kiếm đạo càng tăng tốc lĩnh ngộ. |
| 269 | `van_dao_tien_cot` | Vạn Đạo Tiên Cốt | 5 | human | physique | innate | Linh +10; Ngộ +10; Thể +42 | qiRate: x2.20, comprehension: x2.25, breakthrough: +30%, techniqueCompatibility: +70% | Cốt cách có khả năng dung nạp nhiều hệ pháp tắc mà ít xung đột, thiên về đa đạo. |
| 270 | `nhan_dao_thanh_nhan` | Nhân Đạo Thánh Nhân | 5 | human | social | innate | Ngộ +8; Đạo tâm +13 | prestige: +110, comprehension: x2.00, leadership: +60%, factionGrowth: +40%, willpowerBonus: +60 | Có thiên phú tập hợp nhân tâm và từ quan hệ xã hội lĩnh hội Nhân Đạo, mạnh khi dẫn dắt cộng đồng. |
| 271 | `lang_quan_tap_tinh` | Lang Quần Tập Tính | 1 | beast | social | lineage | Đạo tâm +2 | squadDamage: +10%, squadDefense: +10%, soloMorale: -10% | Bản năng bầy đàn mạnh, chiến đấu tốt hơn khi ở cạnh đồng loại nhưng khó độc hành. |
| 272 | `linh_loc_minh_cam` | Linh Lộc Mẫn Cảm | 2 | beast | mindset | lineage | Ngộ +7; Đạo tâm +8 | dodge: +16%, mindStateBonus: +15, herbDetection: +25% | Huyết mạch linh lộc nhạy với biến đổi linh khí và nguy hiểm tự nhiên. |
| 273 | `cu_vien_cuong_co` | Cự Viên Cường Cốt | 2 | beast | physique | lineage | Thể +13; Chiến +2 | atk: x1.28, hp: x1.18, climbSpeed: x1.40 | Huyết mạch viên loại tăng lực tay và khả năng leo trèo, thích hợp cận chiến. |
| 274 | `tien_hac_thanh_khi` | Tiên Hạc Thanh Khí | 2 | beast | survival | lineage | Linh +1; Thể +7; Đạo tâm +3 | moveSpeed: x1.25, qiRate: x1.15, dodge: +12% | Huyết mạch hạc giúp thân nhẹ, khí tức ổn định và thích nghi không trung. |
| 275 | `xich_ho_me_anh` | Xích Hồ Mê Ảnh | 3 | beast | combat | lineage | Chiến +20 | dodge: +25%, crit: +16%, illusionAffinity: +45% | Huyết mạch hồ ly thiên về ảo ảnh, đánh lạc hướng và né tránh. |
| 276 | `kim_giac_te_huyet` | Kim Giác Tê Huyết | 3 | beast | physique | lineage | Thể +24 | hp: x1.55, armor: +25, chargeDamage: +35% | Huyết mạch tê giác cổ tăng khả năng va chạm và chống phá giáp. |
| 277 | `thanh_xa_doc_mach` | Thanh Xà Độc Mạch | 3 | beast | root | lineage | Linh +23 | qiRate: x1.35, poisonResistance: +55%, poisonDamage: +35% | Kinh mạch chứa độc linh lực, bản thân kháng độc và có thể luyện hóa độc khí. |
| 278 | `nguyet_lang_huyet` | Nguyệt Lang Huyết | 3 | beast | combat | lineage | Chiến +23 | moveSpeed: x1.40, atk: x1.38, nightCombat: +30%, squadDamage: +15% | Huyết mạch lang tộc cộng hưởng ánh trăng, tăng truy kích và phối hợp bầy đàn vào ban đêm. |
| 279 | `huyen_vu_giap_mach` | Huyền Vũ Giáp Mạch | 4 | beast | physique | lineage | Thể +38 | hp: x2.00, armor: +38, def: +35, moveSpeed: x0.88 | Dòng máu Huyền Vũ tăng phòng ngự và sức bền hơn là sát thương. |
| 280 | `chu_tuoc_hoa_mach` | Chu Tước Hỏa Mạch | 4 | beast | root | lineage | Linh +36; Chiến +6 | qiRate: x1.75, atk: x1.70, fireAffinity: +70%, phoenixReviveCharge: +1 | Huyết mạch Chu Tước cho chân hỏa tinh thuần và khả năng hồi sinh hạn chế qua hỏa kiếp. |
| 281 | `bach_trach_thong_hue` | Bạch Trạch Thông Tuệ | 4 | beast | mindset | lineage | Ngộ +24; Đạo tâm +20 | comprehension: x1.95, heartDemonResistance: +38%, creatureKnowledge: +60% | Huyết mạch Bạch Trạch giỏi nhận biết yêu tà, dị thú và tri thức cổ xưa. |
| 282 | `thanh_long_moc_mach` | Thanh Long Mộc Mạch | 4 | beast | physique | lineage | Linh +5; Thể +38 | hp: x1.95, qiRate: x1.65, regeneration: +35%, woodAffinity: +60% | Huyết mạch Thanh Long thiên về sinh cơ, mộc pháp và uy áp long tộc. |
| 283 | `ngu_phuong_than_huyet` | Ngũ Phương Thần Huyết | 5 | beast | root | lineage | Linh +52; Thể +10 | qiRate: x2.30, hp: x2.20, elementCompatibility: +75%, bloodlineConflict: -60% | Huyết mạch dung hợp dấu vết nhiều thần thú, linh hoạt nhưng đòi hỏi căn cơ rất cao. |
| 284 | `thien_yeu_phap_tuong` | Thiên Yêu Pháp Tướng | 5 | beast | combat | lineage | Thể +10; Chiến +52 | atk: x2.20, hp: x2.30, willpowerBonus: +55, ancestralAvatarPower: +70% | Có thể thức tỉnh pháp tướng tổ huyết trong thời gian ngắn thay vì luôn duy trì chỉ số áp đảo. |
| 285 | `van_linh_cung_chu` | Vạn Linh Cộng Chủ | 5 | beast | social | lineage | Đạo tâm +13; Khí vận +35 | prestige: +115, beastCommand: +65%, taming: +55%, fortune: +35 | Khí tức khiến nhiều linh thú tự nhiên bớt thù địch và dễ hình thành quần thể dưới quyền. |
| 286 | `am_anh_phu_the` | Ám Ảnh Phụ Thể | 1 | demon | mindset | innate | Ngộ +3; Đạo tâm -1 | dodge: +8%, mindStateBonus: -12, heartDemonResistance: -10% | Thần hồn dễ bị bóng tối và oán niệm bám theo, tăng cảnh giác nhưng giảm ổn định tâm trí. |
| 287 | `ma_van_bat_on` | Ma Văn Bất Ổn | 1 | demon | root | innate | Linh +7; Đạo tâm -4 | qiRate: x1.10, breakthrough: -8%, instability: +20% | Ma văn trên cơ thể hấp thu ma khí thất thường, lúc mạnh lúc yếu. |
| 288 | `u_anh_ma_the` | U Ảnh Ma Thể | 2 | demon | physique | lineage | Thể +10 | dodge: +18%, moveSpeed: x1.20, hp: x0.92, stealth: +30% | Thân thể thiên về bóng tối và ẩn nấp, khó bị phát hiện nhưng sức bền trực diện không cao. |
| 289 | `huyet_chu_ngung_mach` | Huyết Chú Ngưng Mạch | 2 | demon | root | innate | Linh +14 | qiRate: x1.25, cursePower: +30%, hpCost: +10% | Kinh mạch có thể dùng tinh huyết kích hoạt chú thuật, đổi sinh cơ lấy bộc phát. |
| 290 | `oan_hon_thong_cam` | Oán Hồn Thông Cảm | 2 | demon | mindset | innate | Ngộ +9; Đạo tâm +8 | comprehension: x1.20, soulAffinity: +30%, mindStateBonus: -8 | Có thể cảm nhận cảm xúc của oán hồn, tăng khả năng điều khiển nhưng dễ chịu ảnh hưởng ngược. |
| 291 | `huyet_luyen_chien_phap` | Huyết Luyện Chiến Pháp | 3 | demon | combat | acquired | Chiến +24 | atk: x1.50, atkSpeed: x1.25, lowHpPower: +35%, healingReceived: -10% | Càng bị thương càng dễ kích hoạt ma công huyết luyện, nhưng dễ vượt ngưỡng an toàn. |
| 292 | `u_minh_hon_can` | U Minh Hồn Căn | 3 | demon | root | lineage | Linh +24; Ngộ +2 | qiRate: x1.50, comprehension: x1.30, soulAffinity: +55% | Dị ma căn thiên về thần hồn, tử khí và u minh pháp thuật. |
| 293 | `vo_anh_ma_bo` | Vô Ảnh Ma Bộ | 3 | demon | combat | acquired | Chiến +20 | moveSpeed: x1.45, dodge: +28%, stealth: +35% | Thân pháp ma đạo thiên về xóa dấu khí tức và đổi vị trí ngắn liên tục. |
| 294 | `that_tinh_ma_tam` | Thất Tình Ma Tâm | 3 | demon | mindset | innate | Linh +3; Ngộ +14; Đạo tâm +13 | qiRate: x1.35, comprehension: x1.35, emotionConversion: +45% | Có thể dùng hỉ nộ ai lạc làm nhiên liệu ma công; cảm xúc càng rõ, kỹ năng tương ứng càng mạnh. |
| 295 | `doat_xa_thien_phu` | Đoạt Xá Thiên Phú | 4 | demon | mindset | innate | Ngộ +22; Đạo tâm +20 | comprehension: x1.80, soulDefense: +60%, possessionPower: +45%, karmaGain: +30% | Thần hồn bẩm sinh mạnh, có khả năng chiếm đoạt hoặc chống đoạt xá tốt hơn nhưng phải chịu nhân quả lớn. |
| 296 | `ma_vuc_phap_the` | Ma Vực Pháp Thể | 4 | demon | physique | lineage | Linh +4; Thể +37; Chiến +5 | hp: x1.90, atk: x1.65, domainPower: +45%, qiRate: x1.55 | Cơ thể khuếch tán ma khí thành lĩnh vực ngắn, làm suy yếu kẻ địch quanh mình. |
| 297 | `van_chu_ma_nhan` | Vạn Chú Ma Nhãn | 4 | demon | combat | lineage | Ngộ +5; Chiến +30 | crit: +35%, comprehension: x1.65, cursePower: +55%, soulPierce: +35% | Ma nhãn nhìn thấy sơ hở thần hồn và dấu ấn chú thuật, mạnh trong nguyền rủa mục tiêu đơn. |
| 298 | `vo_gian_ma_the` | Vô Gian Ma Thể | 5 | demon | physique | lineage | Linh +10; Thể +54; Chiến +9 | hp: x2.55, atk: x2.15, qiRate: x2.20, abyssAdaptation: +80% | Thể chất thích nghi Ma Vực cực hạn, càng ở môi trường ma khí đậm càng tăng sức mạnh. |
| 299 | `thien_ma_vo_tuong` | Thiên Ma Vô Tướng | 5 | demon | mindset | lineage | Ngộ +33; Đạo tâm +27 | comprehension: x2.30, heartDemonResistance: +65%, soulDefense: +75%, techniqueMimic: +40% | Thần hồn không cố định hình thái, khó bị công kích tinh thần và dễ mô phỏng tâm pháp người khác. |
| 300 | `ma_dao_ban_nguyen` | Ma Đạo Bản Nguyên | 5 | demon | root | innate | Linh +54; Chiến +10 | qiRate: x2.50, atk: x2.25, breakthrough: +30%, demonLawAffinity: +85%, tribulationSeverity: +20% | Ma căn chạm tới bản nguyên ma đạo; sức mạnh lớn nhưng mọi hành vi cực đoan đều tích lũy nhân quả và thiên kiếp. |

## Phụ lục B — Quyết định xử lý từng trường hiệu ứng nguồn

Có **142 tên trường hiệu ứng khác nhau** trong bảng nguồn. Đây là một lý do không thể chỉ mở rộng type rồi tuyên bố mọi trait đã có tác dụng.

### B.1. Quy tắc xử lý

- `Lõi`: trường có phép chuyển và nơi xử lý xác định; A03/A10 vẫn phải triển khai consumer và test thật trước khi active.
- `Mở rộng`: giữ dữ liệu tham khảo trong metadata tài liệu, không đưa key tùy ý vào resolver. Trait cần key này giữ planned cho đến khi có hệ xử lý.
- Một số trường như `alchemy` trông quen nhưng AlchemySystem hiện tại không phải hệ chế tác có xác suất/worker. Không được đánh dấu hỗ trợ chỉ vì tên class giống.
- Union `TraitModifier` lấy các tên canonical đã được hỗ trợ, mỗi tên có unit, mergeMode và clamp. Các key chưa biết phải bị validator báo, không silently ignore.
- Trường có vector nhưng chưa có gameplay cũng không được tự coi là active chỉ để đủ300.

| Trường V2 | Số trait dùng | Phạm vi | Tên chuẩn / xử lý |
|---|---:|---|---|
| `abyssAdaptation` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `adaptationRate` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `agingPenalty` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `alchemy` | 22 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `allElementCompatibility` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `ambushResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `ancestralAvatarPower` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `armor` | 29 | Lõi | `armorFlat` — DerivedStatsService; đơn vị điểm. |
| `atk` | 107 | Lõi | `attackFactor` — DerivedStatsService; không nhân equipment hai lần. |
| `atkSpeed` | 22 | Lõi | `attackSpeedFactor` — CombatStats cooldown; không tăng theo frame. |
| `beastCommand` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `bloodlineConflict` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `bodyCultivationGain` | 3 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `bottleneckPenalty` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `breakthrough` | 67 | Lõi | `breakthroughChanceBonus` — Cộng điểm xác suất, tổng phần trait -0.40..+0.35. |
| `chargeDamage` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `climbSpeed` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `combatInsightChance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `comprehension` | 68 | Lõi | `techniqueLearningFactor` — Công pháp mastery XP; không nhân điểm ngộ tính chuẩn lần hai. |
| `counterChance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `craftingSpeed` | 13 | Lõi | `workSpeedFactor` — Chỉ tác vụ chế tác/xây dựng phù hợp; áp tiến độ hoặc thời lượng, không cả hai. |
| `creatureKnowledge` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `crit` | 45 | Lõi | `critChanceBonus` — Cộng điểm xác suất: 20%=0.20, áp trần cuối. |
| `cursePower` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `daoAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `deathLawAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `def` | 46 | Lõi | `defenseFlat` — DerivedStatsService; đơn vị điểm. |
| `demonBloodline` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `demonCommand` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `demonLawAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `devourEfficiency` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `disasterChance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `disasterResistance` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `diseaseResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `dodge` | 52 | Lõi | `dodgeChanceBonus` — Cộng điểm xác suất: 20%=0.20, giữ cap chiến đấu. |
| `domainPower` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `dragonBloodline` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `dualEnergyCompatibility` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `earthAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `elementCompatibility` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `elementPurity` | 1 | Lõi | `primaryRootData` — Chuyển vào định nghĩa root, không cộng +45 lên purity100. Không handler tăng stat độc lập. |
| `emotionConversion` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `environmentResistance` | 3 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `factionGrowth` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `failureInsight` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `farmingYield` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `fireAffinity` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `fiveElementControl` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `formation` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `fortune` | 8 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `greatInsightChance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `greedWeight` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `healing` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `healingReceived` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `heartDemonResistance` | 31 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `heatResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `herbDetection` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `hp` | 87 | Lõi | `healthFactor` — DerivedStatsService; multiplier trên baseline, cap phần trait. |
| `hpCost` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `hungerRate` | 13 | Lõi | `hungerRateFactor` — NeedsSystem; trên tốc độ hao hụt thực. |
| `iceAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `illusionAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `impurityGain` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `inscription` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `insightEventChance` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `instability` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `karmaControl` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `karmaGain` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `killInsight` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `leadership` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `leadershipAura` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `lifespan` | 30 | Lõi | `lifespanYears` — Năm, giữ tuổi và ledger đan dược vĩnh viễn. |
| `lightAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `lowHpPower` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `meditationEfficiency` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `mentorEncounter` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `metalAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `mindRecovery` | 1 | Lõi | `mentalRecoveryBonus` — Tốc độ hồi theo tauDays; không thưởng XP. |
| `mindStateBonus` | 44 | Lõi | `mentalEquilibriumBias` — Chỉ trạng thái cảm xúc; tổng phần trait -20..20. |
| `moraleAura` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `moveSpeed` | 43 | Lõi | `moveSpeedFactor` — Position.speed từ baseline. |
| `multiElementCompatibility` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `negotiation` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `nightCombat` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `obsessionGain` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `oxygenUse` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `painResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `persuasionResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `phoenixReviveCharge` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `physique` | 6 | Lõi | `legacyPhysiqueFlat` — Chỉ body/combat nếu có consumer thật; không cộng đồng thời vào điểm thể chất ngoài innateDelta. |
| `pillFailure` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `poisonDamage` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `poisonDetection` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `poisonResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `possessionPower` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `prestige` | 34 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `primalLawAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `professionLearning` | 4 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `qiRate` | 111 | Lõi | `qiRateFactor` — CultivationSystem; primary root thay root factor, trait phụ theo resolver. |
| `rareEncounterChance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `regeneration` | 6 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `reincarnationGrowth` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `reincarnationMemory` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `relationshipGain` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `relationshipInsight` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `resourceEfficiency` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `rivalryRisk` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `shieldPierce` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `soloMorale` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `soulAffinity` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `soulDefense` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `soulPierce` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `spaceAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `spaceResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `spellControl` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `squadDamage` | 3 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `squadDefense` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `squadInitiative` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `squadMorale` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `staminaCost` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `staminaRecovery` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `stanceSwitchCost` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `stealth` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `swimSpeed` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `swordAffinity` | 5 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `taming` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `techniqueAdaptation` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `techniqueCompatibility` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `techniqueLearning` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `techniqueMimic` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `thirstRate` | 6 | Lõi | `thirstRateFactor` — NeedsSystem; trên tốc độ hao hụt thực. |
| `timeInsight` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `trapEfficiency` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `tribulationSeverity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `waterAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `waterResistance` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `weaponPenalty` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `willpowerBonus` | 53 | Lõi | `willTrainingBonus` — Chuyển value/200, clamp theo mục10.6; không cộng XP. |
| `willpowerGrowth` | 2 | Lõi | `willTrainingBonus` — Đổi phần trăm sang hệ số cộng, cap toàn nhóm. |
| `woodAffinity` | 2 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `yangAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |
| `yinAffinity` | 1 | Mở rộng | Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ. |

### B.2. Hợp đồng handler tối thiểu

Mỗi handler có `id`, kiểu payload, đơn vị, trigger, cooldown theo ngày/tick, giới hạn, chính sách stacking, dữ liệu save nếu có, test cho người chết/reset/load. Không dùng `effect: string` được diễn giải tùy ý ở runtime.

Với trait phối hợp nhiều handler, mọi handler cần thiết đều phải hỗ trợ. Ví dụ trait hồi sinh cần charge được lưu, điều kiện chết đúng một lần, xử lý corpse/grave, ưu tiên tương tác với đan hồi sinh và test save/load; chỉ thêm `regeneration` không tương đương hồi sinh.

## Phụ lục C — Đối chiếu catalog repository

Kiểm kê lúc soạn: **105 định nghĩa**; **98 ID trùng chuỗi** với V2; **7 ID không có trong V2**. Trùng chuỗi chưa bảo đảm cùng nghĩa, như trường hợp an_linh_can.

### C.1. ID không có trong bản nguồn

| ID | Tên cũ |
|---|---|
| `van_thu_chi_huu` | Vạn Thú Chi Hữu |
| `ngu_long_bi_thuat` | Ngự Long Bí Thuật |
| `uy_nghiem_trang_trong` | Uy Nghiêm Trang Trọng |
| `hien_hoa_nhan_hau` | Hiền Hòa Nhân Hậu |
| `truong_sinh_quyet` | Trường Sinh Quyết |
| `hoa_viem_chan_kinh` | Hỏa Viêm Chân Kinh |
| `dan_dao_nhap_mon` | Đan Đạo Dị Tài |

### C.2. ID có tên khác giữa mã hiện tại và V2

Rà nghĩa trước khi migrate. Đổi cách gọi nhưng cùng ý nghĩa có thể giữ ID; khác cơ chế/căn cơ phải tách ID có định tuyến phiên bản rõ ràng. Không tự đổi lại mọi tên chỉ để bảng này trống.

| ID | Tên trong mã hiện tại | Tên ở V2 |
|---|---|---|
| `linh_lung_that_khieu` | Linh Lung Thất Khiếu Tâm | Linh Lung Thất Khiếu |
| `phe_linh_can` | Phế Linh Căn (Tạp Linh Căn) | Ngũ Hành Phế Linh Căn |
| `am_duong_song_tu` | Âm Dương Hòa Hợp | Âm Dương Song Linh Căn |
| `ngu_hanh_cau_toan` | Ngũ Hành Câu Toàn | Ngũ Hành Cân Bằng |
| `an_linh_can` | Ẩn Linh Căn | Biến Dị Ám Linh Căn |
| `dan_don_ngu_ngo` | Đần Độn Ngu Ngơ | Đần Độn Ngốc Nghếch |
| `don_ngo_ky_tai` | Độn Ngộ Kỳ Tài | Đốn Ngộ Kỳ Tài |
| `da_nghi_tram_trong` | Đa Nghi Như Tào | Đa Nghi Thận Trọng |
| `tam_tinh_thao_dong` | Tâm Tính Thao Động | Tâm Tính Xao Động |
| `bat_tu_tieu_cuong` | Bất Tử Kiên Cường | Bất Tử Tiểu Cường |
| `than_xa_thu` | Thần Xạ Vô Song | Bách Bộ Xuyên Dương |
| `tram_sat_linh_thu` | Đồ Tể Dã Thú | Thợ Săn Yêu Thú |
| `tru_ma_tien_si` | Tru Ma Tiên Sĩ | Trừ Ma Vệ Đạo |
| `phu_luc_tien_thien` | Bùa Chú Tiên Thiên | Phù Lục Tiên Thiên |
| `dau_bep_than_cap` | Đầu Bếp Thần Cấp | Linh Trù Thần Cấp |
| `mu_tit_dan_dao` | Mù Tịt Đan Đạo | Nổ Lò Chuyên Nghiệp |
| `vung_ve_luyen_khi` | Vụng Về Rèn Đúc | Vụng Về Tay Chân |
| `thien_ly_nhan` | Thiên Lý Nhãn Dược Sư | Thiên Lý Nhãn |
| `van_rui_deo_bam` | Vận Rủi Đeo Bám | Sao Quả Tạ Chiếu Mệnh |
| `lanh_tu_quan_luan` | Lãnh Tụ Quần Luân | Khí Chất Lãnh Tụ |
| `dao_hoa_van_do` | Đào Hoa Vận Đỏ | Đào Hoa Kiếp |
| `truong_nghia_so_tai` | Trượng Nghĩa Sơ Tài | Trọng Tình Trọng Nghĩa |
| `trung_quan_ai_mon` | Trung Quân Ái Môn | Trung Tâm Cảnh Cảnh |
| `phan_cot_nghich_tu` | Phản Cốt Nghịch Tử | Phản Cốt Bẩm Sinh |
| `am_hiem_doc_ac` | Âm Hiểm Độc Ác | Tâm Ngoan Thủ Lạt |
| `thuc_than_thao_thiet` | Thực Thần Thao Thiết | Huyết Mạch Thao Thiết |
| `cu_dem_da_tinh` | Cú Đêm Dã Tính | Dạ Hành Giả |
| `ngu_say_ngan_nam` | Ngủ Say Như Hợi | Thụy Mộng Tiên Du |
| `thich_ung_bang_tuyet` | Thích Ứng Băng Tuyết | Hàn Băng Bất Xâm |
| `hoa_nhiet_bat_xam` | Hỏa Nhiệt Bất Xâm | Vạn Hỏa Bất Xâm |
| `hon_don_thon_thien` | Hỗn Độn Thôn Thiên Công | Hỗn Độn Thôn Thiên |

### C.3. Kiểm tra cuối trước khi nhập dữ liệu

Chạy parser chỉ để tạo dữ liệu cấu hình; commit kết quả có type và validation. Không để game tải file markdown từ Downloads. Nếu script nhập chạy lại, phải cho cùng dữ liệu và không ghi đè các override V3 đã được review.
