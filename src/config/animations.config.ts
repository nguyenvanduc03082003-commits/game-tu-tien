export type AnimationState = 
  | 'idle' 
  | 'walk' 
  | 'meditate' 
  | 'attack' 
  | 'breakthrough' 
  | 'dead'
  | 'sleep'
  | 'farm'
  | 'cook'
  | 'build'
  | 'recreate';
export type Direction = 'down' | 'up' | 'left' | 'right';

export interface FrameClip {
  row: number;         // Hàng trong spritesheet (0-indexed)
  startCol?: number;   // Cột bắt đầu (mặc định: 0)
  frameCount: number;  // Số lượng frame trong chuỗi
  frameRate: number;   // Số frame trên 1 giây (FPS)
  loop: boolean;       // Lặp lại hay phát 1 lần
}

export interface SpriteSheetConfig {
  id: string;
  name: string;
  texturePath: string; // Đường dẫn đến file ảnh trong public/assets/sprites/...
  frameWidth: number;  // Chiều rộng mỗi frame (vd: 16 hoặc 32)
  frameHeight: number; // Chiều cao mỗi frame (vd: 16 hoặc 32)
  clips: Partial<Record<AnimationState, FrameClip>>;
}

/**
 * ANIMATION_CONFIGS - Cấu hình nạp Spritesheet hoạt ảnh
 * Khi bạn vẽ xong đồ họa của mình, chỉ cần copy file PNG vào public/assets/sprites/...
 * và khai báo thông số frame ở đây!
 */
export const ANIMATION_CONFIGS: Record<string, SpriteSheetConfig> = {
  human_base: {
    id: 'human_base',
    name: 'Nhân Tộc Cơ Bản',
    texturePath: 'assets/sprites/characters/human_base.png',
    frameWidth: 32,
    frameHeight: 32,
    clips: {
      idle:         { row: 0, frameCount: 4, frameRate: 5, loop: true },
      walk:         { row: 1, frameCount: 6, frameRate: 10, loop: true },
      meditate:     { row: 2, frameCount: 4, frameRate: 4, loop: true }, // Ngồi thiền
      attack:       { row: 3, frameCount: 4, frameRate: 12, loop: false },
      breakthrough: { row: 4, frameCount: 6, frameRate: 8, loop: false },
      dead:         { row: 5, frameCount: 1, frameRate: 1, loop: false },
    }
  },
  beast_base: {
    id: 'beast_base',
    name: 'Yêu Tộc Cơ Bản',
    texturePath: 'assets/sprites/characters/beast_base.png',
    frameWidth: 32,
    frameHeight: 32,
    clips: {
      idle:         { row: 0, frameCount: 4, frameRate: 4, loop: true },
      walk:         { row: 1, frameCount: 4, frameRate: 8, loop: true },
      meditate:     { row: 2, frameCount: 3, frameRate: 3, loop: true }, // Thở hấp thu nguyệt hoa
      attack:       { row: 3, frameCount: 4, frameRate: 12, loop: false },
      breakthrough: { row: 4, frameCount: 4, frameRate: 6, loop: false },
      dead:         { row: 5, frameCount: 1, frameRate: 1, loop: false },
    }
  },
  demon_base: {
    id: 'demon_base',
    name: 'Ma Tộc Cơ Bản',
    texturePath: 'assets/sprites/characters/demon_base.png',
    frameWidth: 32,
    frameHeight: 32,
    clips: {
      idle:         { row: 0, frameCount: 4, frameRate: 5, loop: true },
      walk:         { row: 1, frameCount: 6, frameRate: 10, loop: true },
      meditate:     { row: 2, frameCount: 4, frameRate: 4, loop: true },
      attack:       { row: 3, frameCount: 4, frameRate: 14, loop: false },
      breakthrough: { row: 4, frameCount: 5, frameRate: 8, loop: false },
      dead:         { row: 5, frameCount: 1, frameRate: 1, loop: false },
    }
  }
};
