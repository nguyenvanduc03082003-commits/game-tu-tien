# Nghiệm thu và số liệu quan hệ xã hội — giai đoạn 5

Ngày nghiệm thu: 01-10-2026. Chu kỳ hiện tại: 400 tick/ngày, 20 tick/giây, tương đương 20 giây/ngày ở tốc độ 1x.

## 1. Kết luận

**Đạt nghiệm thu logic trong phạm vi đã kiểm tra.** 17 nhóm hồi quy xã hội đạt; toàn bộ `npm test`, build và kiểm tra asset đều kết thúc với mã 0. Đã chạy 21 lượt thu số liệu xã hội và thao tác trực tiếp trên trình duyệt. Chưa đủ bằng chứng để kết luận cân bằng xã hội đã hoàn thiện cho mọi thế giới, chủng tộc hoặc quy mô dân số.

Trong nghiệm thu đã sửa ba vấn đề có bằng chứng: reset telemetry khi host tự reset thế giới; bộ đếm hỗ trợ bị ghi cho người không có ràng buộc; đòn projectile bỏ qua các hệ quả xã hội của đòn đánh. Không thay ngưỡng hảo cảm, tín nhiệm hay tốc độ tăng quan hệ trong đợt này.

## 2. Chứng cứ kiểm tra

| Kiểm tra | Kết quả | Chứng cứ |
|---|---|---|
| Hồi quy xã hội riêng | 17 nhóm đạt | `so_lieu/NGHIEM_THU_SOCIAL_2026-10-01.log` |
| Toàn bộ bộ kiểm tra dự án | Mã thoát 0; gồm 17 nhóm mới | `so_lieu/NGHIEM_THU_TEST_2026-10-01.log` |
| Build | Đạt, 169 module; còn cảnh báo chunk lớn | `so_lieu/NGHIEM_THU_BUILD_2026-10-01.log` |
| Asset check | Đạt; ghi nhận 0 character pack, 3 equipment pack | `so_lieu/NGHIEM_THU_ASSETS_2026-10-01.log` |
| Diff whitespace | `git -c core.safecrlf=false diff --check` đạt | Kiểm tra cuối sau cập nhật tài liệu |
| Trình duyệt | Rải 10 nhân tộc, xem quan hệ, bật thu số liệu, tải autosave, kiểm tra reset | Ba bộ ảnh và bản chép UI trong `so_lieu/` |

Asset check chỉ xác nhận hợp đồng dữ liệu hiện có; không chứng minh mọi mỹ thuật đã đầy đủ. Log `NGHIEM_THU_ALL_SUITES_2026-10-01.log` là lần khảo sát ban đầu có fixture lỗi; kết quả cuối dùng log TEST ở bảng trên.

### Ma trận 17 nhóm xã hội

1. Hội thoại ghi hai phía đúng một lần; cooldown theo ngày thế giới tại 399/400 tick và khi dừng thời gian.
2. Khoảng cách 55/55,001 và HP 25%; từ chối không sửa điểm hoặc ký ức.
3. Preview, chọn đối tượng và Inspector không tạo tính cách, không tiêu thụ RNG.
4. Hỗ trợ tại đúng ngưỡng hảo cảm 20, tín nhiệm 40, HP 25% và phạm vi 180.
5. Ràng buộc kết thúc hủy hỗ trợ, làm thất bại kế hoạch cũ, BT không lấy lại mục tiêu.
6. Hủy khi episode/địch đổi, chết, HP xuống ngưỡng hoặc ra ngoài phạm vi.
7. Tự vệ thay hỗ trợ; thánh chỉ giữ ưu tiên; gán mục tiêu trực tiếp xóa metadata cũ.
8. Telemetry mặc định tắt, giới hạn 128 bộ đếm/200 mẫu, bản sao độc lập và reset.
9. Cứu viện cần chứng cứ episode đã giải quyết; thưởng đúng một lần.
10. SaveManager roundtrip thực, thiếu trường cũ, reset telemetry; save hỏng không thay thế thế giới đang có.
11. Validator từ chối NaN, nguồn không hợp lệ, mục tiêu sai và episode sai.
12. Đòn melee thực tạo tự vệ/phản bội; không trúng không tạo hệ quả.
13. Projectile thực tạo tự vệ/phản bội; projectile kết liễu giải quyết cứu viện một lần.
14. Projectile bị né không tạo hệ quả xã hội của đòn trúng.
15. Xung đột kết thúc đúng 30 ngày; hồi phục khởi động lại bộ đếm.
16. Chết đóng ràng buộc và tạo tang ký một lần, kể cả sau khi xóa ký ức.
17. Chọn đối tượng có grid và fallback nhất quán; quan hệ thường không ghi bộ đếm hỗ trợ vô nghĩa.

## 3. Sửa lỗi đã thực hiện

| Tệp | Vấn đề đã xác nhận | Sửa và chứng cứ |
|---|---|---|
| `src/modules/save/SaveManager.ts` | Telemetry chỉ reset ở nhánh fallback, có thể còn khi host cung cấp reset riêng | Reset sau cả hai nhánh; roundtrip với host reset riêng đạt |
| `src/modules/ai/brain/goals/StrategicGoal.ts` | Mọi quan hệ thường đều được đánh giá hỗ trợ và ghi `no_active_bond` mỗi vòng utility | Lọc companion/master/disciple/sworn còn hiệu lực trước evaluator; hồi quy và baseline tích hợp không còn bộ đếm này |
| `src/modules/combat/ProjectileSystem.ts` | Ranged hit gây mất HP/chết nhưng bỏ qua tự vệ, phản bội và chứng cứ cứu viện | Đồng bộ hook đòn trúng với melee; kiểm tra hit, dodge, lethal đạt |

Fixture cũ đã cập nhật riêng: vị trí địch trong test nghề nghiệp; kết quả hội thoại và API preference; linh căn người sáng lập; thời lượng thi công và sinh trưởng theo 400 tick/ngày; archetype benchmark; enum thời tiết trong save. Đây là sửa dữ liệu kiểm tra, không phải thay cân bằng sản xuất. Runner chung đưa suite xã hội vào đầu và hỗ trợ `--continue` để khảo sát toàn bộ lỗi.

## 4. Baseline có kiểm soát: 18 lượt × 180 ngày

Mỗi lượt có 30 nhân vật, sáu seed 11/22/33/44/55/66. Giữ vị trí, HP và tuổi; chạy SocialInteractionSystem với dt 0,25 giây. Không có AI di chuyển, sinh tồn hay thế lực. Ba kịch bản: cụm gần rảnh, cụm gần liên tục làm nông, và tách xa 250 đơn vị. Kịch bản bận liên tục là tình huống gây sức ép nhân tạo.

| Kịch bản | Bạn đầu tiên | Ràng buộc đầu tiên | Bản ghi bạn có hướng cuối lượt, trung bình | Cặp ràng buộc đang hoạt động, trung bình | Cô lập cuối lượt |
|---|---:|---:|---:|---:|---:|
| Cụm gần, rảnh | Ngày 23–36 | Ngày 59–92 | 111,67 | 19,17 | 0/30 ở mọi seed |
| Cụm gần, bận liên tục | Ngày 35–37 | Không có tới ngày 180 | 46,67 | 0 | 0/30 ở mọi seed |
| Tách xa | Không có | Không có | 0 | 0 | 30/30 ở mọi seed |

**Bản ghi có hướng không phải số đôi bạn:** A xem B là bạn và B xem A là bạn được đếm riêng. Cặp ràng buộc đếm không phân biệt thứ tự.

Tổng sáu lượt rảnh: 59.868 hội thoại hoàn tất, 28.921 trung tính và 30.947 ấm áp; tạo 69 kết nghĩa và 46 bạn đời. Tổng sáu lượt bận: 143.134 lần gọi hội thoại, 125.539 từ chối (87,71%), 11.130 vụng về, 6.465 trung tính; không có ấm áp. Nhân vật có thể có nhiều kết nghĩa nên số cặp không bị giới hạn như số cặp bạn đời.

### Chi phí chọn đối tượng

300 lần gọi mỗi cấu hình, đơn vị ms/lần chọn:

| Dân số | Không grid | Có grid |
|---:|---:|---:|
| 30 | 0,146 | 0,142 |
| 100 | 0,407 | 0,347 |
| 300 | 1,114 | 0,927 |

Đây là microbenchmark bộ chọn đối tượng trong môi trường có các tác vụ chạy đồng thời. Không suy ra FPS, chi phí toàn engine hoặc cam kết hiệu năng. Giới hạn 12 đối tượng giữ lại không đồng nghĩa chỉ đánh giá 12 đối tượng ban đầu.

## 5. Baseline tích hợp AI: 3 lượt × 60 ngày

Mỗi lượt 30 nhân tộc từ BeingFactory, tính cách/thiên phú ngẫu nhiên theo seed. dt 0,05 giây, gọi clock, grid và hệ thống AI/sinh tồn/xã hội/chiến đấu/thế lực/ngoại giao/xây dựng/nghề nghiệp/thực vật/xác chết. Bản đồ đồng bằng 64×64 có nguồn nước và 80 cây thực phẩm trưởng thành. AI reset BT/A* mỗi tick.

Chưa có weather, cultivation, reproduction, animals hoặc projectile trong harness này. Không xem đây là chạy toàn Engine.

| Seed | Sống ở ngày 60 | Bạn đầu tiên | Bạn có hướng ở ngày 60 | Ràng buộc | Thế lực đầu tiên | Thế lực cuối | Công trình cuối |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 30/30 | 57 | 3 | 0 | 30 | 1 | 9 |
| 22 | 30/30 | Chưa có | 0 | 0 | 39 | 1 | 9 |
| 33 | 30/30 | 60 | 1 | 0 | 31 | 2 | 15 |

Không nhân vật đang sống nào hoàn toàn cô lập cuối lượt. Chưa quan sát ràng buộc/cứu viện tự nhiên trong 60 ngày; các nhánh đó được kiểm tra bằng hồi quy có dựng tình huống.

| Seed | Lần gọi hội thoại | Hoàn tất | Tỷ lệ hoàn tất | Từ chối do khoảng cách |
|---:|---:|---:|---:|---:|
| 11 | 403.694 | 3.273 | 0,81% | 322.801 (79,96%) |
| 22 | 474.031 | 3.554 | 0,75% | 382.005 (80,59%) |
| 33 | 232.416 | 2.575 | 1,11% | 189.077 (81,35%) |

Các số này đếm lời gọi/kiểm tra của hệ thống, không phải hàng trăm nghìn cuộc trò chuyện người chơi nhìn thấy. Phần lớn đến từ cộng đồng thế lực quét các cặp; phạm vi cộng đồng rộng hơn phạm vi hội thoại 55. Cần giảm các lần gọi chắc chắn ngoài phạm vi trước khi mở rộng dân số.

Goal SURVIVE_VITAL chiếm 70,4–87,3% **mẫu chụp hằng ngày**; không phải tỷ lệ thời gian liên tục. Ưu tiên sinh tồn và di chuyển làm quan hệ chậm hơn cụm đứng gần. Kết quả gameplay trước/sau lọc telemetry hỗ trợ giống nhau; không so sánh executionMs giữa hai lần để tuyên bố tăng tốc vì tải CPU khác nhau.

## 6. Nghiệm thu trên trình duyệt

Thế giới thử tên “Nghiệm thu xã hội 01-10”, seed 10301, map 150. Khởi tạo không có cư dân có trí tuệ; rải 10 nhân tộc bằng UI. Quan sát nhân vật Lý Thanh Phong có mạng lưới tăng từ 6 lên 7 quan hệ, ký ức trò chuyện và bảng giải thích điều kiện/hai phía.

- Telemetry mặc định tắt; mở Inspector không tự bật.
- Cửa sổ trước sửa ghi 77 hội thoại: 73 trung tính, 4 vụng về; 680 đề xuất ràng buộc bị từ chối vì thiếu hảo cảm; 90.903 lần đánh giá hỗ trợ không có ràng buộc. Bộ đếm cuối là nhiễu vòng đánh giá AI.
- Tải autosave qua CHƠI TIẾP thành công, còn 10 cư dân; bảng thu số liệu trở về tắt/rỗng. Ảnh `SOCIAL_BROWSER_RESET_2026-10-01.png` xác nhận.
- Cửa sổ sau sửa: 14 lần gọi hội thoại, 13 trung tính/1 vụng về, 128 đề xuất bị từ chối; không còn bộ đếm hỗ trợ không ràng buộc. TXT được đọc trước PNG nên ảnh có thể ở tick kế tiếp.
- Đọc tối đa 10 console error gần nhất trả danh sách rỗng tại lần kiểm tra cuối. Không suy ra toàn bộ lịch sử không lỗi.

Cửa sổ trước/sau có độ dài khác nhau; không tính tỷ lệ mỗi ngày hoặc phần trăm tăng tốc từ hai ảnh. Chưa thao tác trực quan một trận hỗ trợ/né projectile/tang lễ; bằng chứng các nhánh đó là test tự động.

## 7. Giới hạn và công việc tiếp theo

1. **Ưu tiên cao: giảm quét hội thoại ngoài phạm vi của cộng đồng.** Lọc bằng spatial grid/khoảng cách và thời gian chờ trước lời gọi; giữ nguyên ngữ nghĩa và số lần commit.
2. **Cân bằng cần quyết định:** nhân vật bận liên tục có thể tăng hảo cảm nhưng khó tăng tín nhiệm từ casual. Với trust 50, ngay ở affinity 100 và sociability 1, receptivity bận tối đa 0,625 < ngưỡng ấm áp 0,65. Người rảnh có sociability <0,3 cũng có thể chưa đạt ấm áp qua casual đơn thuần. Kênh khác có thể tăng trust; chưa đổi công thức trong nghiệm thu này.
3. **Bổ sung baseline toàn Engine dài hơn:** nhiều chủng tộc, thời tiết, tuổi/thọ nguyên, sinh sản và xung đột; đo xác suất trợ giúp/cứu viện, ràng buộc kết thúc và tang ký tự nhiên.
4. **Hiệu năng:** đo riêng tick toàn engine với telemetry tắt/bật tại cùng tải và cấu hình; số hiện tại không đủ xác lập giới hạn dân số.
5. **Persistence:** roundtrip và trường thiếu đã đạt trong fixture; chưa chứng minh mọi bản lưu người dùng hoặc phiên bản cũ đều di trú được.

## 8. Tệp và tái lập

- `tests/social-phase5-regression.ts`: 17 nhóm hồi quy; `tests/social-fixture.ts`: fixture hợp lệ.
- `tests/social-baseline.ts`: 18 lượt độc lập; JSON `so_lieu/QUAN_HE_XA_HOI_BASELINE_2026-10-01.json`.
- `tests/social-integration-baseline.ts`: ba lượt tích hợp; JSON `so_lieu/QUAN_HE_XA_HOI_INTEGRATION_2026-10-01.json`.
- `so_lieu/QUAN_HE_XA_HOI_INTEGRATION_TRUOC_SUA_2026-10-01.json`: đối chiếu trước lọc telemetry.
- `so_lieu/QUAN_HE_XA_HOI_TONG_HOP_2026-10-01.csv`: tổng hợp 21 lượt.
- `so_lieu/QUAN_HE_XA_HOI_MANIFEST_2026-10-01.json`: SHA256 nguồn/harness/số liệu tại nghiệm thu.
- `so_lieu/SOCIAL_BROWSER*`: bản chép giao diện và ảnh minh chứng.

```powershell
node tests/run-social.mjs
node tests/run-social.mjs tests/social-baseline.ts
node tests/run-social.mjs tests/social-integration-baseline.ts
npm.cmd test
npm.cmd run build
npm.cmd run assets:check
git -c core.safecrlf=false diff --check
```

Các harness baseline ghi lại JSON đầu ra. Không chạy song song nếu cần so sánh thời gian thực thi. Các thay đổi có sẵn trong working tree được giữ lại; báo cáo này chỉ nhận trách nhiệm đối với ba sửa lỗi và bộ kiểm tra/số liệu mô tả ở trên.
