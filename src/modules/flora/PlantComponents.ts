import { Component } from '../../ecs/Component.ts';
import { PlantCategory, PLANT_DEFINITIONS } from '../../config/plants.config.ts';

export class PlantComponent implements Component {
  public speciesId: string;
  public category: PlantCategory;
  public tier: number;
  public stage: number = 0;           // 0: Mầm non, 1: Cây con, 2: Trưởng thành, 3: Đơm hoa / Kết quả / Hóa linh
  public growthProgress: number = 0;  // 0.0 đến 1.0 (mô tả độ lớn/trưởng thành của cây)
  public ageDays: number = 0;
  public qiAccumulated: number = 0;
  public isSpiritualized: boolean = false;
  public hasFruit: boolean = false;
  public fruitRegrowDaysRemaining: number = 0; // Cooldown tính bằng ngày game để mọc lại quả
  public woodRemaining: number = 0;            // Lượng gỗ hiện tại có thể khai thác
  public maxWood: number = 0;                  // Lượng gỗ tối đa của cây trưởng thành
  public woodRegrowDaysRemaining: number = 0;  // Cooldown hồi phục gỗ (ngày game)
  public reservedWood: number = 0;             // Lượng gỗ đang được công nhân đặt cọc khai thác

  constructor(speciesId: string, category: PlantCategory, tier: number, initialStage: number | string = 2) {
    this.speciesId = speciesId;
    this.category = category;
    this.tier = tier;

    let stageNum = 2;
    if (typeof initialStage === 'string') {
      if (initialStage === 'seedling') stageNum = 0;
      else if (initialStage === 'growing') stageNum = 1;
      else if (initialStage === 'mature') stageNum = 2;
      else if (initialStage === 'flowering') stageNum = 3;
      else stageNum = 2;
    } else if (typeof initialStage === 'number') {
      stageNum = initialStage;
    }

    this.stage = stageNum;
    this.growthProgress = stageNum >= 2 ? 1.0 : (stageNum === 1 ? 0.4 : 0.0);
    this.hasFruit = stageNum >= 2 && category === 'food';
    this.fruitRegrowDaysRemaining = 0;
    this.woodRegrowDaysRemaining = 0;
    this.reservedWood = 0;

    const def = PLANT_DEFINITIONS[speciesId];
    this.maxWood = def?.woodYield ?? 0;
    if (this.maxWood > 0) {
      if (this.stage >= 2) {
        this.woodRemaining = this.maxWood;
      } else if (this.stage === 1) {
        this.woodRemaining = Math.floor(this.maxWood * 0.4);
      } else {
        this.woodRemaining = 0;
      }
    } else {
      this.woodRemaining = 0;
    }
  }
}
