export enum ElementType {
  KIM = 'kim',       // Kim (Metal) - Sắc bén, kiên cố, màu hoàng kim
  MOC = 'moc',       // Mộc (Wood) - Sinh sôi, hồi phục, thảo mộc, màu lục bảo
  THUY = 'thuy',     // Thủy (Water) - Linh hoạt, nhu hòa, đầm lầy hồ nước, màu lam biếc
  HOA = 'hoa',       // Hỏa (Fire) - Bạo liệt, thiêu đốt, nhiệt độ cao, màu đỏ rực
  THO = 'tho',       // Thổ (Earth) - Trầm ổn, phòng ngự, núi non đồi bãi, màu hoàng thổ
  // Dị Linh Căn
  PHONG = 'phong',   // Phong (Wind) - Phiêu dật, tốc độ, cao nguyên, màu lục lam nhạt
  LOI = 'loi',       // Lôi (Lightning) - Cuồng bạo, thiên kiếp, màu tím điện
  BANG = 'bang',     // Băng (Ice) - Lạnh lẽo, đông kết, núi tuyết mùa đông, màu lam ngọc sáng
}

export interface ElementProperties {
  id: ElementType;
  name: string;
  color: string;
  glowColor: string;
  description: string;
}

export const ELEMENT_CONFIGS: Record<ElementType, ElementProperties> = {
  [ElementType.KIM]: {
    id: ElementType.KIM,
    name: 'Kim',
    color: '#ffd43b',
    glowColor: 'rgba(255, 212, 59, 0.4)',
    description: 'Canh kim sắc bén, cứng rắn bất hoại, thường sinh ra ở khoáng mạch quặng núi.'
  },
  [ElementType.MOC]: {
    id: ElementType.MOC,
    name: 'Mộc',
    color: '#40c057',
    glowColor: 'rgba(64, 192, 87, 0.4)',
    description: 'Sinh cơ dồi dào, tẩm bổ vạn vật, tập trung nhiều ở rừng rậm và thảo nguyên.'
  },
  [ElementType.THUY]: {
    id: ElementType.THUY,
    name: 'Thủy',
    color: '#339af0',
    glowColor: 'rgba(51, 154, 240, 0.4)',
    description: 'Nhu hòa uyển chuyển, hội tụ ở đầm lầy sông suối hồ nước.'
  },
  [ElementType.HOA]: {
    id: ElementType.HOA,
    name: 'Hỏa',
    color: '#ff6b6b',
    glowColor: 'rgba(255, 107, 107, 0.4)',
    description: 'Cuồng bạo thiêu đốt, sinh ra ở núi lửa hoặc vào mùa hạ oi bức.'
  },
  [ElementType.THO]: {
    id: ElementType.THO,
    name: 'Thổ',
    color: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    description: 'Dày dặn trầm ổn, bảo hộ sinh linh, phân bố rộng khắp mặt đất và đồi núi.'
  },
  [ElementType.PHONG]: {
    id: ElementType.PHONG,
    name: 'Phong',
    color: '#63e6be',
    glowColor: 'rgba(99, 230, 190, 0.4)',
    description: 'Gió lộng ngàn dặm, vô tung vô ảnh, dồi dào trên cao nguyên lộng gió.'
  },
  [ElementType.LOI]: {
    id: ElementType.LOI,
    name: 'Lôi',
    color: '#be4bdb',
    glowColor: 'rgba(190, 75, 219, 0.5)',
    description: 'Thiên uy hạo đãng, hình phạt của trời, xuất hiện trong mưa dông và thiên kiếp.'
  },
  [ElementType.BANG]: {
    id: ElementType.BANG,
    name: 'Băng',
    color: '#a5d8ff',
    glowColor: 'rgba(165, 216, 255, 0.4)',
    description: 'Hàn khí thấu xương, ngưng tụ tại đỉnh núi tuyết và vào mùa đông giá rét.'
  }
};
