interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  swingSpeed: number;
  swingOffset: number;
}

export class MenuBackground {
  public particlesEnabled: boolean = true;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private petals: Petal[] = [];
  private isRunning: boolean = false;
  private animId: number = 0;
  private taijiAngle: number = 0;

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    `;
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initParticles(): void {
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;

    // 1. Tinh hoa Linh Khí (Spirit Dust)
    const particleColors = ['#58a6ff', '#7ee787', '#ffd700', '#a371f7', '#38bdf8'];
    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2, // Bay nhẹ lên trời
        size: Math.random() * 2.5 + 1.0,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: Math.random() * 0.6 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // 2. Cánh Hoa Đào Tiên (Peach Blossom Petals)
    this.petals = [];
    for (let i = 0; i < 35; i++) {
      this.petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.random() * 0.8 + 0.3, // Trôi dạt sang phải theo gió
        vy: Math.random() * 0.6 + 0.4, // Rơi nhẹ xuống
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03,
        size: Math.random() * 5 + 4,
        swingSpeed: Math.random() * 0.02 + 0.01,
        swingOffset: Math.random() * Math.PI * 2
      });
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resize();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  private loop(): void {
    if (!this.isRunning) return;

    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const now = Date.now();

    // 1. Nền Gradient Đêm Huyền Ảo Tiên Giới
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.5, '#0b1324');
    bgGrad.addColorStop(1, '#111d35');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Vầng hào quang Thái Cực Bát Quái xoay chậm ở trung tâm
    this.taijiAngle += 0.003;
    const cx = w * 0.5;
    const cy = h * 0.45;
    const taijiRadius = Math.min(w, h) * 0.35;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.taijiAngle);

    // Hào quang vàng kim & thanh lam tỏa sáng
    const auraGrad = ctx.createRadialGradient(0, 0, taijiRadius * 0.2, 0, 0, taijiRadius * 1.2);
    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
    auraGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.03)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, taijiRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Vòng tròn Bát quái vi diệu
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, taijiRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, taijiRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // 3. Dãy núi Thập Vạn Đại Sơn mờ ảo phía chân trời
    this.drawMountainLayer(ctx, w, h, h * 0.65, '#08101f', 120, 0.001);
    this.drawMountainLayer(ctx, w, h, h * 0.78, '#060c18', 80, 0.002);
    this.drawMountainLayer(ctx, w, h, h * 0.88, '#03070f', 50, 0.003);

    // 4. Lớp Sương Mù Linh Khí Lững Lờ
    const mistTime = now / 4000;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.025)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5 + Math.sin(mistTime) * 80, h * 0.8, w * 0.6, 120, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Cập nhật & Vẽ Tinh Hoa Linh Khí (Particles) & 6. Cánh Hoa Đào Tiên (Petals)
    if (!this.particlesEnabled) return;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const alpha = p.alpha + Math.sin(now * p.pulseSpeed + p.pulseOffset) * 0.25;

      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, alpha));
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Cập nhật & Vẽ Cánh Hoa Đào Tiên (Petals)
    for (const petal of this.petals) {
      petal.x += petal.vx + Math.sin(now * petal.swingSpeed + petal.swingOffset) * 0.6;
      petal.y += petal.vy;
      petal.rotation += petal.vRot;

      if (petal.y > h + 20) {
        petal.y = -20;
        petal.x = Math.random() * w * 0.8;
      }
      if (petal.x > w + 20) {
        petal.x = -20;
      }

      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      ctx.fillStyle = 'rgba(255, 182, 193, 0.75)';
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      // Vẽ hình giọt nước/cánh hoa
      ctx.ellipse(0, 0, petal.size, petal.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawMountainLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    baseY: number,
    color: string,
    peakHeight: number,
    freq: number
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);

    const step = 20;
    for (let x = 0; x <= w; x += step) {
      const y = baseY - Math.sin(x * freq * 1.5) * peakHeight * 0.6 - Math.cos(x * freq * 0.8 + 2) * peakHeight * 0.4;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
}
