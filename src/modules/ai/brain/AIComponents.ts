import { Component } from '../../../ecs/Component.ts';
import { Point2D } from '../pathfinding/AStar.ts';

export type StrategicGoalType =
  | 'OBEY_DECREE'            // Phụng Mệnh Thần Linh
  | 'BREAKTHROUGH'           // Đột Phá Bình Cảnh
  | 'SECLUDED_CULTIVATION'   // Bế Quan Tu Luyện (Tụ khí)
  | 'SURVIVE_VITAL'          // Sinh Tồn Cấp Thiết (Đói, Khát, Kiệt sức, Trú bão)
  | 'COMBAT_DEFENSE'         // Tự Vệ & Huyết Chiến
  | 'FLEE_DANGER'            // Rút Lui / Bỏ Chạy Khỏi Cường Địch
  | 'LABOUR_WORK'            // Lao Động Dân Sinh (Ruộng, Xây dựng, Nấu nướng, Luyện đan)
  | 'SOCIAL_RECREATE'        // Giao Lưu, Nghỉ Ngơi, Chăm Sóc Hài Đồng
  | 'WANDER_SERENDIPITY'     // Dạo Bước Du Ngoạn (Tìm cơ duyên kỳ ngộ)
  | 'BURY_KIN'               // Chôn Cất / An Táng Người Thân
  | 'REFLECT_RECOVER';       // Suy Ngẫm & Hóa Giải Biến Cố

export type PlanStepType =
  | 'MOVE_TO'                // Di chuyển tới vị trí (sử dụng A*)
  | 'INTERACT_BUILDING'      // Tương tác công trình (giếng nước, lửa trại, động phủ...)
  | 'COLLECT_RESOURCE'       // Thu hoạch dâu rừng / thảo dược
  | 'USE_PILL'               // Dùng đan dược trong túi (Kim Sáng Đan, Trúc Cơ Đan...)
  | 'MEDITATE_QI'            // Ngồi thiền hấp thu linh khí
  | 'EXECUTE_BREAKTHROUGH'   // Kích phát bình cảnh đột phá
  | 'ATTACK_TARGET'          // Tấn công tiêu diệt mục tiêu
  | 'FLEE_FROM_TARGET'       // Rút chạy xa khỏi mục tiêu nguy hiểm
  | 'PERFORM_WORK'           // Thực hiện công việc (cày ruộng, gõ búa, nấu nướng)
  | 'SLEEP_REST'             // Ngủ nghỉ hồi phục sinh lực
  | 'IDLE_WAIT'              // Tạm dừng chờ đợi
  | 'REFLECT_EXPERIENCE';    // Suy ngẫm hóa giải trải nghiệm / tâm cảnh

export interface PlanStep {
  type: PlanStepType;
  description: string;
  targetPos?: Point2D;
  targetEntityId?: number;
  duration?: number;
  customData?: any;
}

export type GodDecreeType =
  | 'breakthrough'           // Thánh chỉ: Lệnh bế quan đột phá
  | 'build'                  // Thánh chỉ: Lệnh đại tu / dựng công trình
  | 'farm'                   // Thánh chỉ: Lệnh khai hoang canh tác
  | 'attack'                 // Thánh chỉ: Lệnh thảo phạt cường địch
  | 'relocate';              // Thánh chỉ: Lệnh di dời tới điểm chỉ định

export interface GodDecreeData {
  decreeType: GodDecreeType;
  title: string;
  targetPos?: Point2D;
  targetEntityId?: number;
  buildingType?: string;
  issuedTime: number;
}

/**
 * TẦNG 1: BỘ NÃO CHIẾN LƯỢC (STRATEGIC BRAIN COMPONENT)
 * Lưu trữ điểm thôi thúc (Utility Score 0-100) của từng mục tiêu và mục tiêu chiến lược đang được chọn.
 */
export class AIStrategicBrainComponent implements Component {
  public utilityScores: Record<StrategicGoalType, number> = {
    OBEY_DECREE: 0,
    BREAKTHROUGH: 0,
    SECLUDED_CULTIVATION: 0,
    SURVIVE_VITAL: 0,
    COMBAT_DEFENSE: 0,
    FLEE_DANGER: 0,
    LABOUR_WORK: 0,
    SOCIAL_RECREATE: 0,
    WANDER_SERENDIPITY: 10,
    BURY_KIN: 0,
    REFLECT_RECOVER: 0
  };

  public currentGoal: StrategicGoalType = 'WANDER_SERENDIPITY';
  public goalReason: string = 'Khởi đầu tự nhiên';
  public goalEvaluationTimer: number = 0;
  public activeDecree: GodDecreeData | null = null;
  public targetCorpseEntityId: number | null = null;

  constructor(initialGoal: StrategicGoalType = 'WANDER_SERENDIPITY') {
    this.currentGoal = initialGoal;
  }

  public getGoalName(): string {
    switch (this.currentGoal) {
      case 'OBEY_DECREE': return '📜 Phụng Mệnh Thần Linh';
      case 'BREAKTHROUGH': return '⚡ Đột Phá Cảnh Giới';
      case 'SECLUDED_CULTIVATION': return '🧘 Bế Quan Tụ Khí';
      case 'SURVIVE_VITAL': return '🍖 Sinh Tồn Cấp Thiết';
      case 'COMBAT_DEFENSE': return '⚔️ Huyết Chiến Tự Vệ';
      case 'FLEE_DANGER': return '💨 Rút Lui Thoát Hiểm';
      case 'LABOUR_WORK': return '🔨 Lao Động Sản Xuất';
      case 'SOCIAL_RECREATE': return '🍵 Giao Lưu Nghỉ Dưỡng';
      case 'WANDER_SERENDIPITY': return '🌌 Du Ngoạn Kỳ Ngộ';
      case 'BURY_KIN': return '🪦 An Táng Người Thân';
      case 'REFLECT_RECOVER': return '🕯️ Tĩnh Tâm Suy Ngẫm';
    }
  }

  public getGoalBadgeColor(): string {
    switch (this.currentGoal) {
      case 'OBEY_DECREE': return '#ffd700'; // Vàng kim thần thánh
      case 'BREAKTHROUGH': return '#a855f7'; // Tím tử lôi
      case 'SECLUDED_CULTIVATION': return '#38bdf8'; // Xanh ngọc linh khí
      case 'SURVIVE_VITAL': return '#f87171'; // Đỏ nguy cấp
      case 'COMBAT_DEFENSE': return '#ef4444'; // Đỏ chiến trận
      case 'FLEE_DANGER': return '#fb923c'; // Cam rút chạy
      case 'LABOUR_WORK': return '#facc15'; // Vàng lao động
      case 'SOCIAL_RECREATE': return '#4ade80'; // Xanh lá hòa hợp
      case 'WANDER_SERENDIPITY': return '#60a5fa'; // Xanh lam cơ duyên
      case 'BURY_KIN': return '#c084fc'; // Tím tưởng niệm / an táng
      case 'REFLECT_RECOVER': return '#2dd4bf'; // Ngọc bích tĩnh tâm
    }
  }
}

/**
 * TẦNG 2: BỘ LẬP KẾ HOẠCH (AI PLANNER COMPONENT)
 * Quản lý danh sách các bước phân rã hành động từ Mục tiêu chiến lược.
 */
export class AIPlannerComponent implements Component {
  public planRevision: number = 0;
  public currentPlanGoal: StrategicGoalType | null = null;
  public steps: PlanStep[] = [];
  public currentStepIndex: number = 0;
  public planStatus: 'idle' | 'executing' | 'completed' | 'failed' = 'idle';
  public planFailureReason?: string;
  public replanRequested: boolean = false;
  public stepElapsedTimer: number = 0;
  public replanCooldown: number = 0; // Thời gian chờ trước khi được phép lập kế hoạch mới (chống bão 60 FPS)


  constructor() {}

  public getCurrentStep(): PlanStep | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  public isPlanFinished(): boolean {
    return this.currentStepIndex >= this.steps.length;
  }

  public nextStep(): void {
    this.currentStepIndex++;
    this.stepElapsedTimer = 0;
    if (this.currentStepIndex >= this.steps.length) {
      this.planStatus = 'completed';
    }
  }

  public failCurrentPlan(reason: string): void {
    this.planStatus = 'failed';
    this.planFailureReason = reason;
    this.replanRequested = true;
  }
}

/**
 * TẦNG 3: BEHAVIOR TREE & MICRO EXECUTION COMPONENT
 * Quản lý phản xạ vi mô, dẫn đường A*, né đòn tức thì (Dodge) và đồng bộ hoạt ảnh.
 */
export class AIBehaviorTreeComponent implements Component {
  public activeNodeName: string = 'Root';
  public pathWaypoints: Point2D[] = [];
  public currentWaypointIndex: number = 0;

  // Trạng thái né đòn vi mô (Active Dodge)
  public isDodging: boolean = false;
  public dodgeTimer: number = 0;
  public dodgeCooldown: number = 0; // Giới hạn tần suất né đòn (giây)
  public dodgeVector: { x: number; y: number } = { x: 0, y: 0 };

  // Bộ đếm thời gian cho hành vi hiện tại
  public nodeTickTimer: number = 0;

  constructor() {}

  public hasPath(): boolean {
    return this.pathWaypoints.length > 0 && this.currentWaypointIndex < this.pathWaypoints.length;
  }

  public clearPath(): void {
    this.pathWaypoints = [];
    this.currentWaypointIndex = 0;
  }

  public getCurrentWaypoint(): Point2D | null {
    if (this.hasPath()) {
      return this.pathWaypoints[this.currentWaypointIndex];
    }
    return null;
  }
}

/**
 * COMPONENT THÁNH CHỈ THẦN LINH (GOD DECREE)
 * Đánh dấu một cư dân đang nhận sắc lệnh trực tiếp từ Thượng Đế.
 */
export class GodDecreeComponent implements Component {
  public decree: GodDecreeData;

  constructor(decree: GodDecreeData) {
    this.decree = decree;
  }
}
