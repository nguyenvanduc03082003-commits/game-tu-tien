# Cấu Hình Động Vật (`src/config/animals/`)

Thư mục này quản lý toàn bộ dữ liệu tĩnh, kiểu dữ liệu và danh mục 40 loài **Động vật bình thường** trong thế giới.

> **Ranh giới cốt lõi:** Động vật bình thường sinh ra, sinh sống, sinh sản và già chết hoàn toàn độc lập với **Yêu tộc** (`raceId = 'beast'`). Động vật không có linh căn, không có cảnh giới, không tu luyện, không thức tỉnh thành yêu và không sở hữu các component tu tiên hay AI cư dân.

---

## 1. Cấu trúc thư mục

- `animal.types.ts`: Định nghĩa các kiểu dữ liệu cốt lõi (`AnimalSpeciesId`, `AnimalGroup`, `AnimalDiet`, `AnimalSizePreset`, `AnimalBodyShape`, `AnimalLifeStage`, `AnimalSpeciesDefinition`, `AnimalSpeciesSeedInput`).
- `animal.defaults.ts`: Khung chỉ số mặc định theo `AnimalSizePreset` (`ANIMAL_SIZE_PRESETS`) và hàm khởi tạo `createAnimalSpecies()`.
- `animal.simulation.ts`: Hằng số mô phỏng (tốc độ tiêu hao đói 18/ngày, tầm tìm kiếm, thời gian phân hủy xác 30 ngày, giới hạn quần thể 30/loài).
- `animal.catalog.ts`: Hợp nhất danh mục từ 5 nhóm loài thành `ANIMAL_SPECIES_LIST`, `ANIMAL_SPECIES`, hàm `getAnimalSpecies()` và kiểm tra toàn vẹn `validateAnimalCatalog()`.
- `species/`: Chứa 5 tệp dữ liệu phân nhóm thuần túy:
  - `species/domestic.animals.ts`: Nhóm `domestic` (12 loài).
  - `species/small-mammals.animals.ts`: Nhóm `small_mammal` (8 loài).
  - `species/large-mammals.animals.ts`: Nhóm `large_mammal` (10 loài).
  - `species/birds.animals.ts`: Nhóm `bird` (7 loài).
  - `species/reptiles.animals.ts`: Nhóm `reptile` (3 loài).

Tên và ID hiện hành nằm trong năm tệp `species/` và được gộp tại `animal.catalog.ts`.

Khi tạo thế giới mới, chỉ các loài trong `INITIAL_WORLD_ANIMALS` ở `animal.simulation.ts` được sinh tự nhiên, với số cá thể khai báo tại đó. Hiện tại là 4 thỏ, 4 chuột đồng, 3 hươu sao, 2 cáo và 2 sói. Thay danh sách hoặc số lượng tại hằng số này để điều chỉnh quần thể khởi đầu; 40 loài trong catalog vẫn có thể được thả bằng thanh công cụ. Sinh sản sau đó có thể làm số lượng thay đổi.

---

## 2. Các trường dữ liệu của `AnimalSpeciesSeedInput`

Mỗi loài được định nghĩa thông qua hàm `createAnimalSpecies(input: AnimalSpeciesSeedInput)`:

| Trường | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `id` | `string` | Có | Mã định danh dạng chuỗi (ví dụ: `'water_buffalo'`, `'spotted_deer'`). |
| `name` | `string` | Có | Tên tiếng Việt hiển thị (ví dụ: `'Trâu'`, `'Hươu sao'`). |
| `group` | `AnimalGroup` | Có | Nhóm loài: `'domestic'`, `'small_mammal'`, `'large_mammal'`, `'bird'`, hoặc `'reptile'`. |
| `description` | `string` | Có | Mô tả đặc tính sinh thái và tập tính. |
| `sizePreset` | `AnimalSizePreset` | Có | Cỡ kích thước: `'small'`, `'medium'`, `'large'`, hoặc `'huge'`. |
| `diet` | `AnimalDiet` | Có | Chế độ ăn: `'herbivore'` (ăn cỏ/thực vật), `'carnivore'` (ăn thịt/săn mồi), `'omnivore'` (ăn tạp). |
| `habitats` | `readonly TerrainType[]` | Có | Các địa hình đi được: `PLAIN`, `HILL`, `MOUNTAIN`, `SWAMP`, `PLATEAU`, `DENSE_FOREST`. Danh sách chuẩn nằm trong `ANIMAL_PASSABLE_TERRAINS` ở `animal.simulation.ts`. |
| `spawnWeight` | `number` | Có | Trọng số xuất hiện tự nhiên khi khởi tạo bản đồ. |
| `lifespanYears` | `number` | Có | Tuổi thọ tối đa tính theo năm. |
| `adultAgeYears` | `number` | Có | Độ tuổi bước vào giai đoạn trưởng thành (`adultAgeYears < lifespanYears`). |
| `reproductionCooldownDays` | `number` | Có | Thời gian hồi sinh sản sau mỗi lần sinh con (tính theo ngày trong game). |
| `bodyShape` | `AnimalBodyShape` | Có | Kiểu hình học khi vẽ Canvas: `'quadruped'`, `'small_mammal'`, `'large_ungulate'`, `'avian'`, `'serpent'`, hoặc `'shelled_reptile'`. |
| `primaryColor` | `string` | Có | Mã màu chủ đạo (thân, lưng). |
| `secondaryColor` | `string` | Có | Mã màu phụ (bụng, bờm, hoa văn). |
| `preySpeciesIds` | `readonly string[]` | Không | Danh sách ID các loài con mồi (dành cho loài ăn thịt hoặc ăn tạp). |
| `maxHealth` | `number` | Không | Sinh lực tối đa (nếu bỏ trống, tự lấy theo `sizePreset`). |
| `attack` | `number` | Không | Sức tấn công (nếu bỏ trống, tự lấy theo `sizePreset`). |
| `defense` | `number` | Không | Sức phòng thủ (nếu bỏ trống, tự lấy theo `sizePreset`). |
| `moveSpeed` | `number` | Không | Tốc độ di chuyển px/s (nếu bỏ trống, tự lấy theo `sizePreset`). |
| `scale` | `number` | Không | Hệ số tỷ lệ kích thước (nếu bỏ trống, tự lấy theo `sizePreset`). |
| `spriteDirectory` | `string` | Không | Thư mục chứa ảnh sprite (mặc định: `assets/sprites/animals/<id>`). |

---

## 3. Khung chỉ số mặc định theo `AnimalSizePreset`

Nếu không khai báo ghi đè chỉ số riêng, `createAnimalSpecies()` sẽ lấy giá trị mặc định từ `ANIMAL_SIZE_PRESETS` (`animal.defaults.ts`):

- **`small`**: HP 20, Công 2, Thủ 0, Tốc độ 35, Scale 0.75
- **`medium`**: HP 50, Công 6, Thủ 2, Tốc độ 40, Scale 0.95
- **`large`**: HP 100, Công 12, Thủ 5, Tốc độ 35, Scale 1.15
- **`huge`**: HP 200, Công 20, Thủ 10, Tốc độ 25, Scale 1.40

---

## 4. Hướng dẫn từng bước thêm một loài mới

Ví dụ: Bổ sung loài **Sơn dương (`mountain_goat`)** vào nhóm thú lớn.

### Bước 1: Mở tệp nhóm loài tương ứng
Mở tệp `src/config/animals/species/large-mammals.animals.ts`.

### Bước 2: Thêm phần tử vào mảng export của nhóm
Thêm khai báo vào mảng `LARGE_MAMMAL_ANIMAL_SPECIES`:

```ts
import { TerrainType } from '../../terrains.config.ts';
import { createAnimalSpecies } from '../animal.defaults.ts';
import { AnimalSpeciesDefinition } from '../animal.types.ts';

export const LARGE_MAMMAL_ANIMAL_SPECIES: readonly AnimalSpeciesDefinition[] = [
  // ... các loài hiện có ...
  createAnimalSpecies({
    id: 'mountain_goat',
    name: 'Sơn dương',
    group: 'large_mammal',
    description: 'Thú ăn cỏ nhanh nhẹn, leo trèo tài tình trên vách đá và đồi núi cao.',
    sizePreset: 'medium',
    diet: 'herbivore',
    habitats: [TerrainType.HILL, TerrainType.MOUNTAIN, TerrainType.PLATEAU],
    spawnWeight: 8,
    lifespanYears: 16,
    adultAgeYears: 2.0,
    reproductionCooldownDays: 55,
    bodyShape: 'large_ungulate',
    primaryColor: '#8a7968',
    secondaryColor: '#d6cec2',
  }),
];
```

*Lưu ý:* `AnimalSpeciesId` là kiểu `string`, không cần sửa union type. Cũng không cần chỉnh sửa `animal.catalog.ts` vì catalog tự gộp mảng `LARGE_MAMMAL_ANIMAL_SPECIES`.

### Bước 3: Cập nhật kiểm tra số lượng nếu mở rộng quy mô
Hàm `validateAnimalCatalog()` trong `src/config/animals/animal.catalog.ts` và bộ test trong `tests/animal-catalog-regression.ts` đang kiểm tra mốc cố định **40 loài** (12 domestic, 8 small_mammal, 10 large_mammal, 7 bird, 3 reptile).

Khi bổ sung loài thứ 41, hãy cập nhật số lượng kỳ vọng trong `validateAnimalCatalog()` và các test tương ứng:
- Tổng số loài: `40` -> `41`
- Số lượng nhóm: `large_mammal: 10` -> `11`

### Bước 4: Kiểm tra biên dịch và test hồi quy
Chạy lệnh kiểm tra:
```powershell
npm.cmd test
npm.cmd run build
```
Sau khi hoàn tất, giao diện người dùng (God Toolbar), bộ sinh tự nhiên (`AnimalSpawnService`), hệ thống hiển thị (`AnimalRenderer`) và hệ thống lưu/nạp (`SaveManager 2.0.0`) sẽ tự động nhận diện và xử lý loài mới.
