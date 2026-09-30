import { EventBus } from './EventBus.ts';

export type TimeSpeed = 0 | 0.5 | 1 | 2 | 3 | 5;
export const ALLOWED_TIME_SPEEDS: readonly TimeSpeed[] = [0, 0.5, 1, 2, 3, 5] as const;
export const ALLOWED_POSITIVE_TIME_SPEEDS: readonly TimeSpeed[] = [0.5, 1, 2, 3, 5] as const;
export const LEGACY_TIME_SPEEDS: readonly number[] = [10, 50] as const;

export function sanitizeTimeSpeed(raw: unknown, defaultVal: TimeSpeed = 1): TimeSpeed {
  const n = Number(raw);
  if (n === 10 || n === 50) return 5;
  if (ALLOWED_TIME_SPEEDS.includes(n as TimeSpeed)) return n as TimeSpeed;
  return defaultVal;
}

export function sanitizePositiveTimeSpeed(raw: unknown, defaultVal: TimeSpeed = 1): TimeSpeed {
  const n = Number(raw);
  if (n === 10 || n === 50) return 5;
  if (ALLOWED_POSITIVE_TIME_SPEEDS.includes(n as TimeSpeed)) return n as TimeSpeed;
  return defaultVal;
}

export interface TimeState {
  totalTicks: number;
  speed: TimeSpeed;
  clockSchema?: number;
  calendarEpochTick?: number;
  calendarEpochDays?: number;
  oldTicksPerDay?: number;
}

/**
 * Tính ngày lịch thực (có phần thập phân) tại một tick mô phỏng bất kỳ,
 * hỗ trợ liên tục cả thế giới mới (400 ticks/ngày) lẫn bản lưu cũ từ trước phiên bản 2.1 (20 ticks/ngày).
 */
export function calendarDaysAtTick(timeState: TimeState | null | undefined, tick: number): number {
  const safeTick = Math.max(0, tick);
  if (!timeState) {
    return safeTick / TimeManager.TICKS_PER_DAY;
  }
  const epochTick = timeState.calendarEpochTick ?? 0;
  const epochDays = timeState.calendarEpochDays ?? 0;
  const oldTicks = (timeState.oldTicksPerDay && timeState.oldTicksPerDay > 0) ? timeState.oldTicksPerDay : 20;

  if (safeTick <= epochTick) {
    return safeTick / oldTicks;
  }
  return epochDays + (safeTick - epochTick) / TimeManager.TICKS_PER_DAY;
}

export function calendarDayFloorAtTick(timeState: TimeState | null | undefined, tick: number): number {
  return Math.floor(calendarDaysAtTick(timeState, tick));
}

export enum Season {
  SPRING = 'XUÂN',
  SUMMER = 'HẠ',
  AUTUMN = 'THU',
  WINTER = 'ĐÔNG',
}

export interface WorldDate {
  year: number;
  month: number;
  day: number;
  season: Season;
  totalDays: number;
  totalTicks: number;
  timeOfDay: number; // 0 to 1 (0 = bình minh, 0.5 = trưa, 0.75 = hoàng hôn, 1.0 = đêm)
}

/**
 * TimeManager - Quản lý thời gian thế giới tu tiên đa tốc độ (0x - 5x)
 * Tách rời nhịp tính toán mô phỏng (Simulation Tick: 20 ticks/s) khỏi nhịp dựng hình (Render FPS)
 * Nhịp lịch chuẩn: 400 ticks/ngày (20 giây thực ở 1x), 1 năm = 360 ngày (30 ngày/tháng, 3 tháng/mùa, 4 mùa/năm)
 */
export class TimeManager {
  private static instance: TimeManager;

  public static readonly TICKS_PER_SECOND = 20; // 20 ticks/giây ở tốc độ 1x (50ms/tick)
  public static readonly TICKS_PER_DAY = 400;   // 1 ngày = 400 ticks (20 giây thực ở 1x)
  public static readonly DAYS_PER_MONTH = 30;   // 1 tháng = 30 ngày
  public static readonly MONTHS_PER_SEASON = 3; // 1 mùa = 3 tháng (90 ngày)
  public static readonly SEASONS_PER_YEAR = 4;  // 1 năm = 4 mùa (360 ngày)

  private speed: TimeSpeed = 1;
  private previousSpeed: TimeSpeed = 1;
  private totalTicks: number = 0;
  private accumulator: number = 0;
  private clockSchema: number = 2;
  private calendarEpochTick: number = 0;
  private calendarEpochDays: number = 0;
  private oldTicksPerDay: number = TimeManager.TICKS_PER_DAY;
  private eventBus = EventBus.getInstance();

  private constructor() {}

  public static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  public getSpeed(): TimeSpeed {
    return this.speed;
  }

  public setSpeed(speed: TimeSpeed): void {
    const validSpeed = sanitizeTimeSpeed(speed, 1);
    if (this.speed !== validSpeed) {
      if (this.speed > 0 && validSpeed === 0) {
        this.previousSpeed = this.speed;
      } else if (this.speed === 0 && validSpeed > 0) {
        this.previousSpeed = validSpeed;
      }
      this.speed = validSpeed;
      this.eventBus.emit('time:speed_changed', { speed: this.speed });
    }
  }

  public isPaused(): boolean {
    return this.speed === 0;
  }

  public togglePause(): void {
    if (this.isPaused()) {
      this.setSpeed(this.previousSpeed > 0 ? this.previousSpeed : 1);
    } else {
      this.setSpeed(0);
    }
  }

  public resume(): void {
    if (this.isPaused()) {
      this.setSpeed(this.previousSpeed > 0 ? this.previousSpeed : 1);
    }
  }

  public getCalendarEpochTick(): number {
    return this.calendarEpochTick;
  }

  public getCalendarEpochDays(): number {
    return this.calendarEpochDays;
  }

  public getOldTicksPerDay(): number {
    return this.oldTicksPerDay;
  }

  public getClockSchema(): number {
    return this.clockSchema;
  }

  public getTimeState(): TimeState {
    return {
      totalTicks: this.totalTicks,
      speed: this.speed,
      clockSchema: this.clockSchema,
      calendarEpochTick: this.calendarEpochTick,
      calendarEpochDays: this.calendarEpochDays,
      oldTicksPerDay: this.oldTicksPerDay,
    };
  }

  public getCalendarDaysAtTick(tick: number): number {
    return calendarDaysAtTick(this.getTimeState(), tick);
  }

  public getCalendarDayFloorAtTick(tick: number): number {
    return calendarDayFloorAtTick(this.getTimeState(), tick);
  }

  public static calendarDaysAtTick(timeState: TimeState | null | undefined, tick: number): number {
    return calendarDaysAtTick(timeState, tick);
  }

  public static calendarDayFloorAtTick(timeState: TimeState | null | undefined, tick: number): number {
    return calendarDayFloorAtTick(timeState, tick);
  }

  /**
   * Tiến đồng hồ lên đúng 1 tick mô phỏng và kiểm tra sự kiện chuyển ngày/mùa/năm
   */
  public stepSingleTick(): void {
    this.totalTicks++;
    this.checkDateTransitions();
  }

  /**
   * Cập nhật thời gian theo delta time thực tế từ render loop.
   * Nếu truyền callback `onTick`, đồng hồ sẽ tăng từng tick xen kẽ với cập nhật mô phỏng thế giới,
   * đảm bảo mỗi tick mô phỏng đọc đúng thời điểm của tick đó (đặc biệt ở tốc độ 2x, 3x, 5x).
   * @param deltaRealSeconds Số giây thực trôi qua giữa 2 frame render
   * @param onTick Callback thực thi mỗi tick ngay sau khi đồng hồ tăng 1 tick
   * @returns Số lượng ticks mô phỏng đã thực thi trong frame này
   */
  public update(deltaRealSeconds: number, onTick?: (tickDt: number, tickIndex: number) => void): number {
    if (this.speed === 0) return 0;

    // Giới hạn maxDelta tránh xoắn ốc tử thần (spiral of death) khi người dùng đổi tab
    const clampedDelta = Math.min(deltaRealSeconds, 0.25);
    this.accumulator += clampedDelta * this.speed;

    const tickInterval = 1 / TimeManager.TICKS_PER_SECOND;
    let ticksToExecute = 0;

    // Tối đa 100 ticks trong 1 frame để tránh nghẽn
    const maxTicksPerFrame = 100;

    while (this.accumulator + 1e-9 >= tickInterval && ticksToExecute < maxTicksPerFrame) {
      this.accumulator = Math.max(0, this.accumulator - tickInterval);
      this.stepSingleTick();
      if (onTick) {
        onTick(tickInterval, ticksToExecute);
      }
      ticksToExecute++;
    }

    // Bảo vệ khỏi spiral of death: nếu đã chạm giới hạn ticks, reset accumulator
    if (ticksToExecute >= maxTicksPerFrame) {
      this.accumulator = 0;
    }

    return ticksToExecute;
  }

  private checkDateTransitions(): void {
    const totalDays = Math.floor(this.getCalendarDaysAtTick(this.totalTicks));
    const prevDays = Math.floor(this.getCalendarDaysAtTick(this.totalTicks - 1));

    if (totalDays > prevDays) {
      const date = this.getDate();
      this.eventBus.emit('time:day_passed', date);

      // Chuyển mùa
      if (date.day === 1 && (date.month - 1) % TimeManager.MONTHS_PER_SEASON === 0) {
        this.eventBus.emit('time:season_changed', { season: date.season, year: date.year });
      }

      // Năm mới
      if (date.day === 1 && date.month === 1) {
        this.eventBus.emit('time:year_passed', { year: date.year });
      }
    }
  }

  public getTotalTicks(): number {
    return this.totalTicks;
  }

  public getDate(): WorldDate {
    const exactDays = this.getCalendarDaysAtTick(this.totalTicks);
    const totalDays = Math.floor(exactDays);
    const dayInYear = totalDays % (TimeManager.DAYS_PER_MONTH * 12);
    const year = Math.floor(totalDays / (TimeManager.DAYS_PER_MONTH * 12)) + 1; // Bắt đầu từ Năm 1
    const month = Math.floor(dayInYear / TimeManager.DAYS_PER_MONTH) + 1;
    const day = (dayInYear % TimeManager.DAYS_PER_MONTH) + 1;

    // Tính mùa: Tháng 1-3: Xuân, 4-6: Hạ, 7-9: Thu, 10-12: Đông
    let season = Season.SPRING;
    if (month >= 4 && month <= 6) season = Season.SUMMER;
    else if (month >= 7 && month <= 9) season = Season.AUTUMN;
    else if (month >= 10 && month <= 12) season = Season.WINTER;

    // Thời gian trong ngày [0..1)
    const timeOfDay = Math.max(0, Math.min(1, exactDays - totalDays));

    return {
      year,
      month,
      day,
      season,
      totalDays,
      totalTicks: this.totalTicks,
      timeOfDay,
    };
  }

  public loadState(state: TimeState): void {
    this.totalTicks = Math.max(0, Math.floor(state.totalTicks));
    this.accumulator = 0;
    this.clockSchema = state.clockSchema ?? 2;
    this.calendarEpochTick = state.calendarEpochTick !== undefined ? state.calendarEpochTick : this.totalTicks;
    this.calendarEpochDays = state.calendarEpochDays !== undefined ? state.calendarEpochDays : (this.totalTicks / (state.oldTicksPerDay || 20));
    this.oldTicksPerDay = (state.oldTicksPerDay && state.oldTicksPerDay > 0) ? state.oldTicksPerDay : 20;

    const validSpeed = sanitizeTimeSpeed(state.speed, 1);
    this.speed = validSpeed;
    if (validSpeed > 0) {
      this.previousSpeed = validSpeed;
    }
  }

  public saveState(): TimeState {
    return {
      totalTicks: this.totalTicks,
      speed: this.speed,
      clockSchema: 2,
      calendarEpochTick: this.calendarEpochTick,
      calendarEpochDays: this.calendarEpochDays,
      oldTicksPerDay: this.oldTicksPerDay,
    };
  }

  public reset(): void {
    this.totalTicks = 0;
    this.accumulator = 0;
    this.speed = 1;
    this.previousSpeed = 1;
    this.clockSchema = 2;
    this.calendarEpochTick = 0;
    this.calendarEpochDays = 0;
    this.oldTicksPerDay = TimeManager.TICKS_PER_DAY;
  }
}
