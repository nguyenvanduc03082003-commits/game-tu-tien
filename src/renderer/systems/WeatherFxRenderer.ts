import { WeatherType } from '../../modules/weather/WeatherTypes.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { EventBus } from '../../core/EventBus.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class WeatherFxRenderer {
  public particlesEnabled: boolean = true;
  private particles: Particle[] = [];
  private maxParticles: number = 300;
  private flashAlpha: number = 0;
  private activeLightning: { x: number; y: number; timer: number } | null = null;

  public reset(): void {
    this.flashAlpha = 0;
    this.activeLightning = null;
  }

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0,
        vy: 0,
        size: 2,
        alpha: 0.7
      });
    }

    // Lắng nghe sự kiện sét đánh để giật màn hình
    EventBus.getInstance().on<{ x: number; y: number }>('disaster:lightning_strike', (data) => {
      this.flashAlpha = 0.55;
      this.activeLightning = { x: data.x, y: data.y, timer: 0.15 };
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    weather: WeatherType,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    dt: number
  ): void {
    // 1. Giảm dần độ lóe sáng sấm chớp
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    }

    // 2. Vẽ tia sét giáng từ trời xuống đất
    if (this.activeLightning) {
      const sPos = camera.worldToScreen(this.activeLightning.x, this.activeLightning.y, screenWidth, screenHeight);
      this.drawLightningBolt(ctx, sPos.x, sPos.y);
      this.activeLightning.timer -= dt;
      if (this.activeLightning.timer <= 0) {
        this.activeLightning = null;
      }
    }

    if (!this.particlesEnabled || weather === WeatherType.CLEAR) return;

    // 3. Cập nhật và vẽ hạt mưa / tuyết
    const isRain = weather === WeatherType.RAIN || weather === WeatherType.THUNDERSTORM;
    const isSnow = weather === WeatherType.SNOW;
    const isFog = weather === WeatherType.FOG;

    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (isRain) {
        // Mưa rơi xiên nhanh
        p.vy = 550;
        p.vx = -80;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.strokeStyle = weather === WeatherType.THUNDERSTORM ? '#74c0fc' : '#a5d8ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.02, p.y + 8);
        ctx.stroke();
      } else if (isSnow) {
        // Tuyết rơi lững lờ đung đưa
        p.vy = 80;
        p.vx = Math.sin(Date.now() / 300 + i) * 30;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(p.x, p.y, 2, 2);
      } else if (isFog) {
        // Sương mù trôi chậm
        p.vx = 15;
        p.x += p.vx * dt;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tái tạo hạt khi bay ra ngoài màn hình
      if (p.y > screenHeight) {
        p.y = -10;
        p.x = Math.random() * screenWidth;
      }
      if (p.x < 0) p.x = screenWidth;
      if (p.x > screenWidth) p.x = 0;
    }

    ctx.restore();
  }

  private drawLightningBolt(ctx: CanvasRenderingContext2D, targetX: number, targetY: number): void {
    ctx.save();
    ctx.strokeStyle = '#eebefa';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#be4bdb';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    let curX = targetX + (Math.random() * 40 - 20);
    let curY = 0;
    ctx.moveTo(curX, curY);

    const segments = 8;
    const dy = targetY / segments;

    for (let i = 0; i < segments; i++) {
      curY += dy;
      curX += (Math.random() * 30 - 15);
      if (i === segments - 1) {
        curX = targetX;
        curY = targetY;
      }
      ctx.lineTo(curX, curY);
    }

    ctx.stroke();

    // Lõi tia sét màu trắng tinh
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
