import fs from 'node:fs';
import { createHash } from 'node:crypto';

const sourcePath = 'C:/Users/nguye/Downloads/he_thong_300_dac_diem_va_danh_gia_thien_phu_V2.md';
const guidePath = 'G:/game_tu_tien/docs/HUONG_DAN_TAI_CAU_TRUC_DAC_DIEM_VA_TIEM_NANG_V3.md';
const source = fs.readFileSync(sourcePath, 'utf8');
let group = '', dimension = '';
const rows = [];
for (const line of source.split(/\r?\n/)) {
  const gh = line.match(/^## (Chung|Nhân Tộc|Yêu Tộc|Ma Tộc) —/);
  const dh = line.match(/^### .*\(`([^`]+)`\)/);
  if (gh) group = gh[1];
  if (dh) dimension = dh[1];
  if (!/^\|\s*\d{3}\s*\|/.test(line)) continue;
  const c = line.split('|').map(s=>s.trim());
  if (c.length !== 11) throw new Error(`Invalid row ${c[1]}: ${c.length} cells`);
  const strip = s => s.replace(/^[`*]+|[`*]+$/g, '');
  rows.push({number:c[1],id:strip(c[2]),name:strip(c[3]),tier:Number(c[4]),origin:c[6],vector:strip(c[7]),effects:strip(c[8]),description:c[9],group,dimension});
}
if (rows.length!==300 || new Set(rows.map(r=>r.id)).size!==300) throw new Error('Catalog counts invalid');
const originOverrides = {
  pham_cot_troc_khi: ['Hậu thiên','Cần cơ chế trọc khí tích lũy; chưa có thì planned.'],
  van_co_dao_tam: ['Hậu thiên','Yêu cầu trưởng thành và sự kiện đạo tâm, không tặng cho newborn.'],
  thien_nhan_hop_nhat: ['Hậu thiên','Trạng thái lĩnh ngộ đạt được, cần milestone.'],
  minh_tam_kien_tinh: ['Hậu thiên','Từ trải nghiệm đã được hóa giải.'],
  vo_nga_dao_tam: ['Hậu thiên','Cần milestone lĩnh ngộ và tâm cảnh cao.'],
  vo_dich_thien_ha: ['Hậu thiên','Danh hiệu/thành tựu, không gắn bẩm sinh cho trẻ.'],
  vo_thuong_sat_than: ['Hậu thiên','Thành tựu con đường sát phạt; chưa có quy tắc chuyên biệt thì planned.'],
  nho_dao_chi_thanh: ['Hậu thiên','Học kinh văn và đạt thành tựu; không chỉ mang dòng Nhân là có.'],
  hoa_hinh_hoan_my: ['Hậu thiên','Yêu đã Hóa Hình, stageIndex>=2, có milestone.'],
  yeu_dan_tinh_thuan: ['Hậu thiên','Yêu đã Kết Đan, stageIndex>=3; không gán đan sẵn lúc sinh.'],
  tu_la_chien_the: ['Huyết mạch','Mô tả nguồn Tu La; yêu cầu lineage tag tu_la.'],
  cuu_vi_thien_ho: ['Huyết mạch','Nguồn Hồ tộc; không roll lên mọi Yêu.'],
  van_ma_trieu_tong: ['Huyết mạch','Hoàng tộc Ma giới; yêu cầu lineage tag demon_royal.'],
  hu_khong_phap_than: ['Hậu thiên','Pháp thân đã thành, cần hệ tu luyện không gian; planned trong lõi.'],
};
for (const key of Object.keys(originOverrides)) if (!rows.some(r=>r.id===key)) throw new Error(`Override missing ${key}`);

const canonical = id => id==='kim_giac_tê_huyet'?'kim_giac_te_huyet':id==='an_linh_can'?'bien_di_am_linh_can':id;
const raceCode = group => ({'Chung':'all','Nhân Tộc':'human','Yêu Tộc':'beast','Ma Tộc':'demon'}[group]);
const originCode = origin => ({'Bẩm sinh':'innate','Hậu thiên':'acquired','Huyết mạch':'lineage','Chuyển thế':'reincarnation'}[origin]);
const counts = (array,key) => array.reduce((a,r)=>(a[key(r)]=(a[key(r)]??0)+1,a),{});
const correctedRows=rows.map(r=>({...r,canonicalId:canonical(r.id),v3Race:r.dimension==='profession'?'all':raceCode(r.group),v3Origin:originCode(originOverrides[r.id]?.[0]??r.origin)}));
const currentSource=fs.readFileSync('G:/game_tu_tien/src/config/traits.config.ts','utf8');
const current=[...currentSource.matchAll(/^  ([a-z][a-z0-9_]+): \{\r?\n    id: '[^']+',\r?\n    name: '([^']+)'/gm)].map(m=>({id:m[1],name:m[2]}));
const missing=current.filter(r=>!rows.some(s=>s.id===r.id));
const nameDiff=current.filter(r=>rows.some(s=>s.id===r.id&&s.name!==r.name)).map(r=>({id:r.id,oldName:r.name,v2Name:rows.find(s=>s.id===r.id).name}));
const sha=createHash('sha256').update(source).digest('hex');
let text='\n## Phụ lục A — Danh mục 300 đặc điểm để nhập dữ liệu\n\n';
text+=`Nguồn được kiểm đếm: 300 dòng, ID nguồn không trùng. SHA-256 của văn bản UTF-8 nguồn: \`${sha}\`.\n\n`;
text+='### A.1. Cách sử dụng bảng\n\n';
text+='- Các cột race/origin là phân loại V3 sau override; tier và tên lấy từ bản nguồn trừ đổi ID được nêu rõ.\n';
text+='- Vector và hiệu ứng vẫn là **giá trị tham khảo V2**, phải qua chuyển đổi/override/cap ở mục6 và9. Không sao chép chúng thành số cộng trực tiếp vào P.\n';
text+='- Mô tả nguồn là ý tưởng nội dung. Mô tả UI V3 phải viết theo handler đã hoạt động, không hứa bất tử/miễn nhiễm tuyệt đối khi chỉ có bonus.\n';
text+='- Chưa có implementation gán sẵn cho từng trait trong tài liệu: A02 phải tính nó từ phụ thuộc thật trong repo. Đây là cổng kỹ thuật xác định được, không phải quyền tùy ý bật mọi trait.\n';
text+='- Không phải đọc 300 dòng để làm gói XP. Khi làm catalog, nhập dữ liệu bằng script có validator và rà các ngoại lệ dưới đây.\n\n';
text+=`Phân bố race V3 sau khi chuyển nghề: \`${JSON.stringify(counts(correctedRows,r=>r.v3Race))}\`. Phân bố origin V3 sau các override đã nêu: \`${JSON.stringify(counts(correctedRows,r=>r.v3Origin))}\`.\n\n`;
text+='### A.2. Hai ID cần xử lý riêng\n\n';
text+='1. Dòng276 nguồn dùng `kim_giac_tê_huyet` có dấu trong ID. ID V3 chuẩn là `kim_giac_te_huyet`; giữ alias từ cách viết nguồn khi nhập dữ liệu V2. Đây là ID mới của danh mục nguồn, không được tự sửa hàng loạt mọi ID cũ.\n';
text+='2. Dòng034 nguồn dùng `an_linh_can` cho **Biến Dị Ám Linh Căn**, nhưng cùng ID trong repository hiện là **Ẩn Linh Căn**, một đặc điểm khác nghĩa. Dùng ID mới `bien_di_am_linh_can` cho dòng034. Giữ `an_linh_can` cũ dưới dạng legacyOnly cho save cũ. Không tạo alias toàn cục giữa hai nghĩa. Bảy ID thiếu cộng trường hợp này thành tám trường hợp tương thích cần kiểm tra.\n\n';
text+='### A.3. Override nguồn gốc bắt buộc\n\n| ID nguồn | Origin V3 | Lý do/điều kiện |\n|---|---|---|\n';
for (const [id,[origin,why]] of Object.entries(originOverrides)) text+=`| \`${id}\` | ${originCode(origin)} | ${why} |\n`;
text+='\n### A.4. Dữ liệu nguồn kèm phân loại V3\n\n';
text+='| # | ID V3 | Tên | Bậc | Race V3 | Lĩnh vực | Origin V3 | Vector V2 — tham khảo | Hiệu ứng V2 — cần chuẩn hóa | Mô tả nguồn |\n';
text+='|---:|---|---|---:|---|---|---|---|---|---|\n';
for (const r of correctedRows.sort((a,b)=>Number(a.number)-Number(b.number))) {
 text+=`| ${r.number} | \`${r.canonicalId}\` | ${r.name} | ${r.tier} | ${r.v3Race} | ${r.dimension} | ${r.v3Origin} | ${r.vector} | ${r.effects} | ${r.description} |\n`;
}

const mapped = {
 hp:['healthFactor','DerivedStatsService; multiplier trên baseline, cap phần trait.'],
 atk:['attackFactor','DerivedStatsService; không nhân equipment hai lần.'],
 def:['defenseFlat','DerivedStatsService; đơn vị điểm.'],
 armor:['armorFlat','DerivedStatsService; đơn vị điểm.'],
 atkSpeed:['attackSpeedFactor','CombatStats cooldown; không tăng theo frame.'],
 crit:['critChanceBonus','Cộng điểm xác suất: 20%=0.20, áp trần cuối.'],
 dodge:['dodgeChanceBonus','Cộng điểm xác suất: 20%=0.20, giữ cap chiến đấu.'],
 moveSpeed:['moveSpeedFactor','Position.speed từ baseline.'],
 lifespan:['lifespanYears','Năm, giữ tuổi và ledger đan dược vĩnh viễn.'],
 qiRate:['qiRateFactor','CultivationSystem; primary root thay root factor, trait phụ theo resolver.'],
 breakthrough:['breakthroughChanceBonus','Cộng điểm xác suất, tổng phần trait -0.40..+0.35.'],
 comprehension:['techniqueLearningFactor','Công pháp mastery XP; không nhân điểm ngộ tính chuẩn lần hai.'],
 hungerRate:['hungerRateFactor','NeedsSystem; trên tốc độ hao hụt thực.'],
 thirstRate:['thirstRateFactor','NeedsSystem; trên tốc độ hao hụt thực.'],
 craftingSpeed:['workSpeedFactor','Chỉ tác vụ chế tác/xây dựng phù hợp; áp tiến độ hoặc thời lượng, không cả hai.'],
 willpowerBonus:['willTrainingBonus','Chuyển value/200, clamp theo mục10.6; không cộng XP.'],
 willpowerGrowth:['willTrainingBonus','Đổi phần trăm sang hệ số cộng, cap toàn nhóm.'],
 mindStateBonus:['mentalEquilibriumBias','Chỉ trạng thái cảm xúc; tổng phần trait -20..20.'],
 mindRecovery:['mentalRecoveryBonus','Tốc độ hồi theo tauDays; không thưởng XP.'],
 physique:['legacyPhysiqueFlat','Chỉ body/combat nếu có consumer thật; không cộng đồng thời vào điểm thể chất ngoài innateDelta.'],
 elementPurity:['primaryRootData','Chuyển vào định nghĩa root, không cộng +45 lên purity100. Không handler tăng stat độc lập.'],
};
const effectKeys = [...new Set(rows.flatMap(r=>[...r.effects.matchAll(/([A-Za-z][A-Za-z0-9]*):/g)].map(m=>m[1])))].sort();
text+='\n## Phụ lục B — Quyết định xử lý từng trường hiệu ứng nguồn\n\n';
text+=`Có **${effectKeys.length} tên trường hiệu ứng khác nhau** trong bảng nguồn. Đây là một lý do không thể chỉ mở rộng type rồi tuyên bố mọi trait đã có tác dụng.\n\n`;
text+='### B.1. Quy tắc xử lý\n\n';
text+='- `Lõi`: trường có phép chuyển và nơi xử lý xác định; A03/A10 vẫn phải triển khai consumer và test thật trước khi active.\n';
text+='- `Mở rộng`: giữ dữ liệu tham khảo trong metadata tài liệu, không đưa key tùy ý vào resolver. Trait cần key này giữ planned cho đến khi có hệ xử lý.\n';
text+='- Một số trường như `alchemy` trông quen nhưng AlchemySystem hiện tại không phải hệ chế tác có xác suất/worker. Không được đánh dấu hỗ trợ chỉ vì tên class giống.\n';
text+='- Union `TraitModifier` lấy các tên canonical đã được hỗ trợ, mỗi tên có unit, mergeMode và clamp. Các key chưa biết phải bị validator báo, không silently ignore.\n';
text+='- Trường có vector nhưng chưa có gameplay cũng không được tự coi là active chỉ để đủ300.\n\n';
text+='| Trường V2 | Số trait dùng | Phạm vi | Tên chuẩn / xử lý |\n|---|---:|---|---|\n';
for (const key of effectKeys) {
 const used=rows.filter(r=>new RegExp(`\\b${key}:`).test(r.effects)).length;
 const m=mapped[key];
 text+=`| \`${key}\` | ${used} | ${m?'Lõi':'Mở rộng'} | ${m?`\`${m[0]}\` — ${m[1]}`:'Cần hệ gameplay/handler, unit, điều kiện kích hoạt và kiểm thử; planned cho đến khi có đầy đủ.'} |\n`;
}
text+='\n### B.2. Hợp đồng handler tối thiểu\n\n';
text+='Mỗi handler có `id`, kiểu payload, đơn vị, trigger, cooldown theo ngày/tick, giới hạn, chính sách stacking, dữ liệu save nếu có, test cho người chết/reset/load. Không dùng `effect: string` được diễn giải tùy ý ở runtime.\n\n';
text+='Với trait phối hợp nhiều handler, mọi handler cần thiết đều phải hỗ trợ. Ví dụ trait hồi sinh cần charge được lưu, điều kiện chết đúng một lần, xử lý corpse/grave, ưu tiên tương tác với đan hồi sinh và test save/load; chỉ thêm `regeneration` không tương đương hồi sinh.\n';

text+='\n## Phụ lục C — Đối chiếu catalog repository\n\n';
text+=`Kiểm kê lúc soạn: **${current.length} định nghĩa**; **${current.length-missing.length} ID trùng chuỗi** với V2; **${missing.length} ID không có trong V2**. Trùng chuỗi chưa bảo đảm cùng nghĩa, như trường hợp an_linh_can.\n\n`;
text+='### C.1. ID không có trong bản nguồn\n\n| ID | Tên cũ |\n|---|---|\n';
for (const r of missing) text+=`| \`${r.id}\` | ${r.name} |\n`;
text+='\n### C.2. ID có tên khác giữa mã hiện tại và V2\n\n';
text+='Rà nghĩa trước khi migrate. Đổi cách gọi nhưng cùng ý nghĩa có thể giữ ID; khác cơ chế/căn cơ phải tách ID có định tuyến phiên bản rõ ràng. Không tự đổi lại mọi tên chỉ để bảng này trống.\n\n';
text+='| ID | Tên trong mã hiện tại | Tên ở V2 |\n|---|---|---|\n';
for (const r of nameDiff) text+=`| \`${r.id}\` | ${r.oldName} | ${r.v2Name} |\n`;
text+='\n### C.3. Kiểm tra cuối trước khi nhập dữ liệu\n\n';
text+='Chạy parser chỉ để tạo dữ liệu cấu hình; commit kết quả có type và validation. Không để game tải file markdown từ Downloads. Nếu script nhập chạy lại, phải cho cùng dữ liệu và không ghi đè các override V3 đã được review.\n';

const guide=fs.readFileSync(guidePath,'utf8');
if (guide.includes('## Phụ lục A —')) throw new Error('Appendices already exist');
fs.appendFileSync(guidePath,text,'utf8');
console.log(JSON.stringify({rows:rows.length,canonicalUnique:new Set(correctedRows.map(r=>r.canonicalId)).size,raceCounts:counts(correctedRows,r=>r.v3Race),originCounts:counts(correctedRows,r=>r.v3Origin),effectKeys:effectKeys.length,current:current.length,missing:missing.map(r=>r.id),differentNames:nameDiff,bytes:fs.statSync(guidePath).size},null,2));
