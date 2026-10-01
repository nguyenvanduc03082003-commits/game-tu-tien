# Quan hệ xã hội — nghiệm thu giai đoạn 6, đợt 6

Ngày: 2026-10-01. Báo cáo được dựng từ JSON/log trong docs/so_lieu, không suy kết quả từ build.

## 1. Kết luận và cấu hình

Đã thêm hồi quy G6, chạy đối chứng 18 lượt, tích hợp 3 lượt 60 ngày, đồ thị hệ thống Engine 12 lượt dài hạn và 18 lượt hiệu năng tuần tự. Không sửa gameplay hoặc tăng utility trong đợt này. Giữ cấu hình **thử nghiệm**: 3 cuộc gặp trung tính đủ điều kiện → tối đa +1 tín nhiệm/chiều, affinity hai phía từ 10, trần thưởng familiarity 60, nghỉ từ 10 ngày làm hết tiến độ. Các nguồn tín nhiệm khác vẫn được vượt 60.

Có bằng chứng cơ chế tiến triển và persistence hoạt động. Chưa đủ bằng chứng chốt cân bằng toàn game: các map đều dựng có kiểm soát; không có đối chứng G6 trước sửa cùng revision cho toàn bộ hệ thống; các nhánh hiếm trên browser còn thiếu. G6 không được gọi là hoàn tất mọi gate trực quan.

## 2. Thay đổi của đợt 6

- tests/social-phase6-regression.ts: 17 nhóm, kiểm tra ngưỡng affinity/trust/expiry, neutral 1/2/3, trùng tick, trần phân số, cooldown 399/400, reader readonly, save 2/3 và thưởng sau load, validation/atomic load, lọc cặp/overlap/distance, parity fixture và số lần RNG, mục tiêu AI chết, phản bội/tử vong, telemetry và HTML UI readonly.
- tests/run.mjs đăng ký suite G6.
- tests/social-world-baseline.ts dựng đủ 30 hệ thống bằng constructor/registration đối chiếu Engine hiện tại, ECS sắp theo priority; grid trước và sau update, 400 tick/ngày, dt 0,05. Có CLI seed/archetype/performance và log mỗi 30 ngày.
- tests/social-baseline-output.ts thêm hash harness G6. tests/social-phase6-summary.mjs dựng báo cáo/CSV/manifest.

Các lỗi gặp lúc viết fixture là kỳ vọng test sai: getRelationship trả null; meeting evaluator trả rejected; target bị xóa là undefined; TimeManager load thiếu epoch bị hiểu theo clock cũ. Đã sửa fixture theo contract. Không coi những lỗi đó là lỗi game. Lượt toàn ma trận đầu bị dừng để thêm log tiến độ và tách seed; log G6_DOT6_WORLD.log không phải bằng chứng hoàn thành.

## 3. Hồi quy và build

- G6_DOT6_REGRESSION.log: 17 nhóm G6 đạt.
- G6_DOT6_ALL_TESTS_FINAL_V3.log: xem SUITE SUMMARY để xác nhận 19/19 suite, trong đó G5 giữ 17 nhóm. Những lỗi lưu trữ cố ý trong test là tình huống fault injection, không phải suite fail.
- G6_DOT6_BUILD.log: build đạt; vẫn cảnh báo chunk >500 kB.
- G6_DOT6_ASSETS.log: kiểm tra asset đạt; không chứng minh chất lượng hiển thị runtime.
- G6_DOT6_DIFF_CHECK.log: diff check.

Parity chỉ đã xác minh trên fixture vị trí ổn định, cùng thứ tự commit, cùng delta/clock/loại quan hệ và số lần RNG. Không suy thành parity toàn Engine. Lọc trùng một lượt quét chủ động thay đổi khả năng thử lại sau callback đồng bộ; thay đổi này đã nêu từ đợt 2.

## 4. Đối chứng có kiểm soát — 30 cư dân, 180 ngày, 6 seed/kịch bản

| Kịch bản | Lượt | Ngày bạn đầu, theo seed | Ngày bond đầu, theo seed | Bạn có hướng TB | Cặp bond TB | Lượt thưởng theo chiều |
| --- | --- | --- | --- | --- | --- | --- |
| cluster_idle | 6 | 26/29/26/24/23/32 | 73/63/64/53/54/69 | 81.67 | 34.17 | 7695 |
| cluster_busy | 6 | 37/36/36/36/35/36 | —/97/95/94/94/93 | 40.67 | 3 | 800 |
| separated | 6 | —/—/—/—/—/— | —/—/—/—/—/— | 0 | 0 | 0 |

Seed theo thứ tự 11/22/33/44/55/66; — là chưa quan sát đến cuối kỳ. busy là làm farm liên tục, không đại diện lịch sinh hoạt tự nhiên. separated đứng cách nhau 250. So với số liệu G5 lịch sử, busy đã có bond ở 5/6 seed thay vì chưa quan sát ở 6/6. Bạn có hướng giảm có thể liên quan việc đổi nhãn sang bond; không gọi đó là mất toàn bộ quan hệ. Không ép seed chưa có bond thành lỗi.

## 5. Tích hợp 60 ngày và đối chiếu G5

| Seed | Community calls G5 | Community calls G6 | Giảm calls | Completed tổng G5 | Completed tổng G6 | Ngày bạn G6 | Sống G6 | Thời gian goal xã hội |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 401981 | 2080 | 99.48% | 3273 | 3154 | Chưa quan sát | 30 | 11.43% |
| 22 | 472151 | 1227 | 99.74% | 3554 | 4135 | Chưa quan sát | 30 | 11.14% |
| 33 | 230868 | 1197 | 99.48% | 2575 | 3087 | 59 | 30 | 9.09% |

Số lần gọi community giảm trên 99% ở cả ba seed. Đây là giảm lời gọi commit, không phải phần trăm giảm thời gian CPU. Tổng completed, nhịp faction/bạn khác G5 vì G6 đồng thời đổi trust và guard AI. Không có căn cứ gọi mọi thay đổi là do spatial grid. Goal xã hội tính bằng tích lũy từng tick của cư dân sống, không dùng mẫu chụp ngày. Mẫu recent plan bị giới hạn 200, không là toàn bộ lịch sử.

## 6. Đời sống dài hạn — đồ thị hệ thống Engine

| Nhóm | Seed | Ngày | Ban đầu | Sống gốc | Bạn đầu | Bond đầu | Bạn có hướng | Bạn tương hỗ | Cặp bond | Chưa tương tác còn sống | Faction | Công trình | Thưởng/chiều |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mortal_human | 11 | 360 | 30 | 29 | 75 | 173 | 476 | 182 | 50 | 0 | 1 | 10 | 3801 |
| yao_common | 11 | 360 | 30 | 30 | Chưa quan sát | Chưa quan sát | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| mortal_demon | 11 | 360 | 30 | 30 | Chưa quan sát | Chưa quan sát | 0 | 0 | 0 | 0 | 0 | 0 | 6 |
| mixed | 11 | 180 | 90 | 17 | 1 | Chưa quan sát | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| mortal_human | 22 | 360 | 30 | 30 | 71 | 108 | 522 | 201 | 44 | 0 | 1 | 10 | 4447 |
| yao_common | 22 | 360 | 30 | 30 | Chưa quan sát | Chưa quan sát | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| mortal_demon | 22 | 360 | 30 | 30 | Chưa quan sát | Chưa quan sát | 0 | 0 | 0 | 0 | 0 | 0 | 6 |
| mixed | 22 | 180 | 90 | 20 | 1 | Chưa quan sát | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| mortal_human | 33 | 360 | 30 | 26 | 66 | 136 | 212 | 100 | 43 | 0 | 2 | 15 | 2227 |
| yao_common | 33 | 360 | 30 | 30 | Chưa quan sát | Chưa quan sát | 0 | 0 | 0 | 0 | 1 | 3 | 8 |
| mortal_demon | 33 | 360 | 30 | 30 | 262 | Chưa quan sát | 2 | 0 | 0 | 0 | 1 | 3 | 8 |
| mixed | 33 | 180 | 90 | 14 | 1 | Chưa quan sát | 5 | 0 | 0 | 0 | 0 | 0 | 0 |

**Phạm vi:** map64×64 phẳng elevation0,3, một cột sông, 80 cây thức ăn trưởng thành, QiGrid khởi tạo mặc định; không tạo lại thế giới bằng WorldGenerator. Cư dân tạo tự nhiên đúng ba mẫu. Sinh tồn, thời tiết, tai biến, tu luyện, sinh sản, chiến đấu/projectile, nghề và xã hội đều đăng ký. Các hệ thống động vật có mặt nhưng không có quần thể động vật ban đầu. Không có renderer, input, Engine event handlers hay lịch chạy browser. Vì thế đây là mô phỏng headless theo đồ thị hệ thống, không phải xác minh toàn bộ ứng dụng Engine. Thứ tự chạy và priority nằm trong JSON mỗi lượt.

Living/goalSeconds/residentSeconds trong bảng và JSON theo **cohort ban đầu**. Trẻ mới sinh vẫn được systems xử lý nhưng không nằm trong mẫu số cohort. Số công trình/faction là toàn world. Friends/bonds của người sống có thể bao gồm mục tiêu ngoài cohort. MutualFriendPairs đòi hai nhãn friend; activeBondPairs chuẩn hóa cặp và kiểm tra hai phía/episode qua isActiveBondBetween, không chia số record cho 2. Bond gộp các loại, không phải riêng đạo lữ. Một năm không đủ đánh giá toàn thọ nguyên. Đọc StrategicGoal.ts cho thấy nhánh giao lưu thường ngày dùng else if (!isBeast): yêu tộc trưởng thành không được tính utility từ khung tối/recreation/quan hệ ở nhánh này; vẫn có ngoại lệ chăm trẻ và tâm trạng thấp. Đây là giới hạn đã xác minh bằng nguồn, chưa sửa trong đợt nghiệm thu; không kết luận nó là nguyên nhân duy nhất của mọi run yêu tộc. Các run 360 ngày chưa thu lịch sử nguyên nhân từng người; nhóm hỗn hợp có probe bổ sung bên dưới.

Nhóm hỗn hợp có 90 người nhưng cùng 80 cây với nhóm 30: đó là mức tải tài nguyên khác, không dùng để suy riêng ảnh hưởng chủng tộc. executionMs dài hạn chạy đồng thời các seed nên không dùng làm so sánh CPU trước/sau.

### Probe tử vong nhóm hỗn hợp

| Seed | Tử vong | Ngày đầu | Ngày cuối | Nhân còn sống | Yêu còn sống | Ma còn sống | Lịch sử tử trận | Điểm no thấp nhất lúc chết |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 73 | 0.0675 | 4.4825 | 0 | 0 | 17 | 73 | 58.90 |
| 22 | 70 | 0.0325 | 8.095 | 0 | 0 | 20 | 70 | 58.11 |
| 33 | 76 | 0.0325 | 9.42 | 0 | 0 | 14 | 76 | 60.62 |

Probe mới 10 ngày đã tái lập đủ số tử vong của cohort ghi nhận trong 180 ngày ở cả ba seed. Toàn bộ 219 trường hợp có lịch sử Tử Trận Sa Trường; điểm no lúc chết đều trên 58. CorpseSystem cập nhật mỗi 0,25 giây nên reason có thể chưa tồn tại ở tick đầu; probe theo dõi thêm để đọc thi thể và lịch sử. deathReason trong thi thể dùng câu cố định, không phản ánh nguyên nhân. CombatSystem.ts:101 coi ma tộc là predator, nhánh tìm mục tiêu loại cùng tộc và cho phép khác tộc; đây là đường hành vi phù hợp với chiến đấu sớm. Kết luận trong fixture này: tử vong do chiến đấu đã có bằng chứng lịch sử, không phải thiếu thức ăn. Không suy thành quy luật mọi map hoặc mọi seed. BeingFactory.ts:323 chỉ thêm MortalNeedsComponent và DailyScheduleComponent cho human; đây là một giới hạn khác của nhịp ma/yêu.

## 7. Hiệu năng — chạy tuần tự sau các workload khác

| Người | Telemetry | Lặp | Mean tick ms | p50 ms | p95 ms | p99 ms |
| --- | --- | --- | --- | --- | --- | --- |
| 30 | Tắt | 3 | 1.34 | 1.04 | 2.67 | 7.82 |
| 30 | Bật | 3 | 1.36 | 1.08 | 2.71 | 7.51 |
| 100 | Tắt | 3 | 4.77 | 2.80 | 7.62 | 84.05 |
| 100 | Bật | 3 | 4.89 | 2.74 | 8.35 | 85.35 |
| 300 | Tắt | 3 | 23.06 | 8.74 | 29.28 | 680.70 |
| 300 | Bật | 3 | 23.88 | 8.72 | 27.94 | 688.34 |

Mỗi lượt 4 ngày, bỏ 400 tick warmup, đo 1200 tick tiếp theo; cùng seed1100/1101/1102 ở mỗi cặp tắt/bật. Các số trong bảng là trung bình ba giá trị tương ứng, không phải percentile gộp. Tick gồm sync grid + world.update + sync grid, chưa bao gồm đo goal/cohort sau tick và renderer. Wrapper đo từng system thêm overhead giống nhau ở hai trạng thái. systemUpdateMs và process.memoryUsage cuối lượt ở JSON; memory không là peak hay so retained heap sau GC. Đối chiếu telemetry tắt/bật đạt parity snapshot và thời gian goal ở cả 9 cặp seed/quy mô. Mean tăng khoảng 2,0–3,6% trong mẫu này; thứ tự chạy tắt trước/bật sau có thể gây bias, chưa là ước lượng overhead thống kê. Với 300 người, p99 trung bình khoảng 681–688 ms, vượt xa ngân sách 50 ms cho tick20Hz. FactionSystem đứng đầu tổng thời gian system ở các lượt 300 người, sau đó ThreeTierAISystem và SocialInteractionSystem; chưa tách riêng từng nhánh trong faction. Vì vậy gate hiệu năng quy mô lớn chưa đạt, không gọi toàn hệ thống đã mượt. Tổng thời gian update trung bình mỗi run 4 ngày ở 300 người, telemetry bật (ms, gồm warmup):

| System | Tổng update ms trung bình/run |
| --- | --- |
| FactionSystem | 20070.72 |
| ThreeTierAISystem | 8689.68 |
| SocialInteractionSystem | 3694.89 |

 Cửa sổ 4 ngày đo chi phí ban đầu, chưa là stress test xã hội/bond ở world già. Không chốt mục tiêu hiệu năng dài hạn chỉ từ bảng này.

## 8. UI, nhánh hiếm và các gate còn thiếu

Đợt 5 đã có browser smoke rải/đọc ma tộc, load autosave, debug bật/tắt, ảnh và console trong artifact G6_DOT5_*. Đợt 6 kiểm tra HTML tiến độ 2/3, hết hạn và cap readonly bằng test, **chưa thay thế ảnh trực quan các trạng thái đó**. G5 hồi quy giữ melee/projectile/self-defense/betrayal/rescue/dodge và tang ký; đây là bằng chứng tự động. Chưa xác minh trực quan từng case hỗ trợ/cứu viện/né/tang hoặc phân bố spawn ba chủng tộc đầy đủ.

Còn thiếu để chốt toàn bộ gate: đối chứng optimization-only toàn Engine cùng seed/revision; phân bố thiên phú/personality và chỉ số sống/sản lượng chi tiết cho mọi cohort; mô phỏng chia phiên so liên tục toàn world/episode/RNG, thay vì chỉ save progress và G5 intent; stress hiệu năng world trưởng thành; browser nhánh hiếm. Giữ cấu hình thử, không mở thêm cân bằng sinh tồn/nghề/tu luyện trong đợt này.

## 9. Bản đồ triển khai toàn G6

| Đợt | Thành phần | Trạng thái |
| --- | --- | --- |
| 1 | SocialSimulationTelemetry, baseline-output, phân bố thời gian goal | Có metric và hash; không có snapshot G6 trước sửa toàn Engine |
| 2 | CommunityConversationService và FactionSystem | Lọc cặp xa/cooldown/trùng, bao gồm người trong nhà; parity fixture đạt; hiệu năng faction còn nút thắt |
| 3 | SocialFamiliarityService, SocialComponents, SocialSaveCodec, SaveManager, lifecycle | Tiến độ/clone/validation/save2/3 và reset đã kiểm tra; cấu hình còn thử |
| 4 | SocialDecisionService, AIPlanner, BehaviorTree, SocialPlanTelemetry | Guard mục tiêu chết/xa/nguy hiểm, lifecycle metric; giữ utility, các chủng tộc thiếu contract lịch/nhu cầu |
| 5 | SocialRelationshipInspector và InspectorPanel | UI tiến độ/debug, browser smoke đợt5 và readonly HTML đợt6; trực quan nhánh hiếm chưa đủ |
| 6 | Hồi quy, world/performance/probe/CSV/manifest | Ma trận đã chạy và báo cáo; nghiệm thu kỹ thuật có giới hạn, chưa chốt cân bằng/hiệu năng lớn |

## 10. Tái lập và chứng cứ

Lệnh:

```powershell
node tests/run-social.mjs tests/social-phase6-regression.ts
node tests/run.mjs --continue
node tests/run-social.mjs tests/social-baseline.ts --output docs/so_lieu/NEW_CONTROLLED.json
node tests/run-social.mjs tests/social-integration-baseline.ts --output docs/so_lieu/NEW_INTEGRATION.json
node tests/run-social.mjs tests/social-world-baseline.ts --seed 11 --output docs/so_lieu/NEW_WORLD11.json
node tests/run-social.mjs tests/social-world-baseline.ts --performance --output docs/so_lieu/NEW_PERF.json
node tests/run-social.mjs tests/social-world-baseline.ts --archetype mixed --days 10 --output docs/so_lieu/NEW_DEATH_PROBE.json
npm.cmd run build
npm.cmd run assets:check
git -c core.safecrlf=false diff --check
node tests/social-phase6-summary.mjs
```

Chạy seed22/33 tương tự. Không ghi đè JSON cũ khi chạy lại; helper từ chối overwrite mặc định. JSON có source/config SHA256 và version Node. Manifest G6_DOT6_MANIFEST.json hash các chứng cứ G6 đợt6. Báo cáo tổng kết dùng dữ liệu này; artifact mang tên AFTER là trạng thái G6 hiện tại, không phải đối chứng trước thay đổi.
