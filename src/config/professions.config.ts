import type { BuildingType } from './factions.config.ts';
import type { JobPreference } from '../modules/beings/BeingComponents.ts';

export type ProfessionBranch = 'mortal' | 'cultivation';
export type ProfessionEffect = 'goods' | 'heal' | 'repair' | 'morale' | 'security' | 'administration' | 'trade' | 'study';
export interface ProfessionRecipe {
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  effect: ProfessionEffect;
  seconds: number;
}
export interface ProfessionDefinition {
  id: string;
  name: string;
  branch: ProfessionBranch;
  description: string;
  job: JobPreference;
  domains: readonly string[];
  workplaces: readonly BuildingType[];
  minRealm: number;
  requiredElements: readonly string[];
  sectOnly?: boolean;
  demonicOnly?: boolean;
  recipe?: ProfessionRecipe;
  /** A profession can be studied before its dedicated combat/creature mechanics exist. */
  studyNote?: string;
}

export const PROFESSION_MIN_AGE = 16;
export const PROFESSION_REVIEW_DAYS = 7;
export const PROFESSION_DAILY_XP_CAP = 40;
export const PROFESSION_XP_THRESHOLDS = [0, 100, 350, 900, 2000, 4500] as const;
export const PROFESSION_RANK_NAMES = ['Học việc', 'Thợ sơ cấp', 'Thợ lành nghề', 'Chuyên gia', 'Đại sư', 'Tông sư'] as const;
export const PROFESSION_GOODS_CAP = 100;
export const PROFESSION_RESOURCE_NAMES: Record<string, string> = {
  food: 'Lương thực', wood: 'Gỗ', stone: 'Đá / quặng thô', herbs: 'Thảo dược',
  pills: 'Đan dược', spiritStones: 'Linh thạch', treasury: 'Ngân khố',
  prepared_herbs: 'Dược liệu sơ chế', metal: 'Phôi kim loại', planks: 'Gỗ gia công',
  cloth: 'Vải', spirit_metal: 'Phôi linh kim', spirit_cloth: 'Linh bố',
  talismans: 'Phù hộ thân', puppet_parts: 'Linh kiện khôi lỗi',
};

const recipe = (inputs: Record<string, number>, outputs: Record<string, number>, effect: ProfessionEffect = 'goods', seconds = 8): ProfessionRecipe => ({ inputs, outputs, effect, seconds });
const mortal = (id: string, name: string, description: string, job: JobPreference, domains: string[], workplaces: BuildingType[] = [], work?: ProfessionRecipe): ProfessionDefinition =>
  ({ id, name, description, branch: 'mortal', job, domains, workplaces, minRealm: 0, requiredElements: [], recipe: work });
const spiritual = (id: string, name: string, description: string, job: JobPreference, workplaces: BuildingType[], work: ProfessionRecipe, elements: string[] = [], minRealm = 1): ProfessionDefinition =>
  ({ id, name, description, branch: 'cultivation', job, domains: [id], workplaces, minRealm, requiredElements: elements, recipe: work });
const study = recipe({ herbs: 1, spiritStones: 1 }, {}, 'study', 12);

/** Source: user supplied "Tổng thư nghề nghiệp trong thế giới tu tiên".
 * Population percentages, mortality and weapon recipes are not imposed by the career catalog. */
export const PROFESSION_DEFINITIONS: readonly ProfessionDefinition[] = [
  mortal('farmer', 'Nông phu', 'Cày cấy và chăm sóc lương thực cho cư dân.', 'farmer', ['farm', 'farmer']),
  mortal('lumberjack', 'Tiều phu', 'Đốn cây, cung cấp gỗ cho xây dựng và thủ công.', 'builder', ['chop_wood']),
  mortal('builder', 'Thợ xây', 'Xây dựng và sửa chữa công trình dân sinh.', 'builder', ['build', 'builder', 'repair']),
  mortal('cook', 'Đầu bếp', 'Nấu bữa ăn từ lương thực đã thu hoạch.', 'cook', ['cook']),
  { ...mortal('sect_servant', 'Tạp dịch tiên môn', 'Gánh nước, vệ sinh và phục vụ sinh hoạt tiên môn.', 'builder', ['sect_servant'], ['village_well', 'sect_hall'], recipe({ food: 1 }, {}, 'morale')), sectOnly: true },
  { ...mortal('tenant_farmer', 'Trực canh điền nông', 'Canh tác ruộng ven tiên môn, đóng góp lương thực vào kho.', 'farmer', ['farm', 'farmer'], ['mortal_farm'], recipe({}, { food: 3 })), sectOnly: true },
  mortal('herbal_assistant', 'Dược đồng', 'Phơi sấy, cắt tỉa và phân loại dược liệu.', 'forager', ['herbal_assistant'], ['herb_garden', 'alchemy_chamber'], recipe({ herbs: 2 }, { prepared_herbs: 2 })),
  mortal('miner', 'Khoáng công', 'Khai thác đá và quặng thô gần vùng núi, tiêu hao gỗ chống đỡ.', 'builder', ['mine'], ['campfire', 'sect_hall'], recipe({ wood: 1 }, { stone: 3 }, 'goods', 10)),
  mortal('herbalist', 'Thái dược nhân', 'Thu hái cây cỏ và thảo dược ngoài thiên nhiên.', 'forager', ['forage', 'forager']),
  mortal('hunter', 'Tráp thú nhân', 'Săn bắt dã thú và thu gom thực phẩm trong rừng.', 'hunter', ['hunt', 'hunting']),
  mortal('blacksmith', 'Thiết tượng', 'Luyện phôi kim loại cho nghề rèn; công thức vũ khí sẽ bổ sung sau.', 'builder', ['craft'], ['campfire'], recipe({ stone: 3, wood: 2 }, { metal: 1 }, 'goods', 10)),
  mortal('carpenter', 'Mộc công', 'Gia công gỗ thành vật tư thủ công.', 'builder', ['carpenter'], ['thatched_hut', 'campfire'], recipe({ wood: 3 }, { planks: 2 })),
  mortal('weaver', 'Thợ dệt', 'Sản xuất vải từ nguyên liệu thực vật thu gom ở nông điền.', 'forager', ['weaver'], ['mortal_farm', 'thatched_hut'], recipe({ food: 2 }, { cloth: 1 })),
  mortal('escort', 'Tiêu sư', 'Canh giữ điểm tập kết hàng hóa, củng cố an ninh địa phương.', 'hunter', ['escort'], ['campfire', 'sect_hall'], recipe({ food: 1 }, {}, 'security')),
  mortal('innkeeper', 'Chưởng quầy', 'Chuẩn bị bữa ăn và chỗ nghỉ, phục hồi tinh thần cư dân lân cận.', 'cook', ['innkeeper'], ['thatched_hut', 'campfire'], recipe({ food: 2 }, {}, 'morale')),
  mortal('merchant', 'Hành thương', 'Đổi hàng thủ công dư thừa thành tiền cho ngân khố.', 'forager', ['trade'], ['campfire', 'sect_hall'], recipe({}, {}, 'trade', 10)),
  mortal('physician', 'Lang trung', 'Dùng dược liệu sơ chế chữa thương cho người sống ở gần.', 'forager', ['heal'], ['thatched_hut', 'herb_garden'], recipe({ prepared_herbs: 1 }, {}, 'heal')),
  mortal('martial_artist', 'Võ giả giang hồ', 'Luyện võ và đảm nhận việc bảo vệ nơi ở.', 'hunter', ['practice_martial'], ['campfire'], recipe({ food: 1 }, {}, 'security', 10)),
  mortal('official', 'Quan lại', 'Xử lý công việc hành chính, tăng ổn định địa phương.', 'builder', ['administration'], ['sect_hall'], recipe({ food: 1 }, {}, 'administration')),
  mortal('soldier', 'Binh lính', 'Trực gác công trình, bảo vệ trật tự cộng đồng.', 'hunter', ['guard'], ['sect_hall', 'campfire'], recipe({ food: 1 }, {}, 'security')),
  spiritual('alchemist', 'Luyện đan sư', 'Dùng Hỏa–Mộc luyện thảo dược thành đan dược cho kho thế lực.', 'forager', ['alchemy_chamber'], recipe({ herbs: 3, spiritStones: 1 }, { pills: 1 }, 'goods', 12), ['hoa', 'moc']),
  spiritual('artificer', 'Luyện khí sư', 'Tinh luyện phôi linh kim bằng Kim–Hỏa; chưa chế tạo vũ khí.', 'builder', ['alchemy_chamber'], recipe({ metal: 2, spiritStones: 2 }, { spirit_metal: 1 }, 'goods', 12), ['kim', 'hoa']),
  spiritual('array_master', 'Trận pháp sư', 'Dùng linh thạch duy tu độ bền hộ trận.', 'builder', ['defense_array'], recipe({ spiritStones: 1 }, {}, 'repair', 10)),
  spiritual('talisman_master', 'Phù lục sư', 'Vẽ phù hộ thân từ vải và linh lực; hộ vệ tiêu thụ khi trực gác.', 'forager', ['scripture_pavilion'], recipe({ cloth: 1, spiritStones: 1 }, { talismans: 2 }, 'goods', 10)),
  spiritual('spiritual_farmer', 'Linh thực phu', 'Chăm sóc dược điền bằng linh lực để thu hoạch linh thảo.', 'farmer', ['herb_garden'], recipe({ spiritStones: 1 }, { herbs: 4 }, 'goods', 10)),
  spiritual('geomancer', 'Tầm quáng sư', 'Tuyển luyện quặng gần núi bằng cảm ứng linh khí.', 'builder', ['meditation_cave', 'sect_hall'], recipe({ stone: 4 }, { spiritStones: 1 }, 'goods', 12)),
  spiritual('spiritual_chef', 'Linh trù sư', 'Chế biến món linh thực giúp cư dân lân cận hồi phục tinh thần.', 'cook', ['campfire'], recipe({ food: 2, herbs: 1 }, {}, 'morale')),
  spiritual('appraiser', 'Giám bảo sư', 'Thẩm định hàng thủ công cao cấp để tăng giá trị giao dịch.', 'forager', ['scripture_pavilion'], recipe({}, {}, 'trade', 12)),
  spiritual('spiritual_weaver', 'Linh chức sư', 'Dệt linh bố làm nguyên liệu pháp y; chưa tạo trang bị chiến đấu.', 'forager', ['scripture_pavilion', 'thatched_hut'], recipe({ cloth: 2, spiritStones: 1 }, { spirit_cloth: 1 }, 'goods', 12)),
  { ...spiritual('beast_tamer', 'Ngự thú sư', 'Học tập tính linh thú và phương pháp khế ước.', 'hunter', ['scripture_pavilion'], study), studyNote: 'Đang học nghề; chưa có bắt giữ, thuần hóa và khế ước thú.' },
  spiritual('puppeteer', 'Khôi lỗi sư', 'Chế tạo linh kiện cơ quan từ gỗ và kim loại.', 'builder', ['scripture_pavilion'], recipe({ planks: 2, metal: 1, spiritStones: 1 }, { puppet_parts: 1 }, 'goods', 12), [], 2),
  spiritual('spiritual_physician', 'Linh y', 'Kết hợp linh thạch và dược liệu trị thương hiệu quả hơn lang trung.', 'forager', ['herb_garden', 'meditation_cave'], recipe({ prepared_herbs: 1, spiritStones: 1 }, {}, 'heal'), ['thuy', 'moc']),
  { ...spiritual('gu_master', 'Ngự trùng sư', 'Nghiên cứu linh trùng, độc tính và phương pháp nuôi dưỡng.', 'forager', ['herb_garden'], study, [], 2), studyNote: 'Đang học nghề; chưa có đàn trùng và cổ thuật chiến đấu.' },
  { ...spiritual('diviner', 'Chiêm bặc sư', 'Nghiên cứu dịch số và thiên văn.', 'forager', ['scripture_pavilion'], study, [], 2), studyNote: 'Đang học nghề; chưa có suy diễn vận mệnh và phản phệ.' },
  { ...spiritual('corpse_refiner', 'Luyện thi sư', 'Nghiên cứu âm khí và phương pháp luyện thi trong Ma đạo.', 'builder', ['meditation_cave'], study, [], 2), demonicOnly: true, studyNote: 'Đang học nghề; chưa có thu thập thi hài và điều khiển cương thi.' },
];

export const PROFESSIONS_BY_ID = new Map(PROFESSION_DEFINITIONS.map(def => [def.id, def]));
export function getProfessionRank(xp: number): number {
  let rank = 0;
  for (let i = 1; i < PROFESSION_XP_THRESHOLDS.length; i++) if (xp >= PROFESSION_XP_THRESHOLDS[i]) rank = i;
  return rank;
}
