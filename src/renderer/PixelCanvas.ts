export class PixelCanvas {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public width: number = 0;
  public height: number = 0;

  constructor(canvasId: string = 'game-canvas') {
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      throw new Error(`Không tìm thấy thẻ canvas với ID: ${canvasId}`);
    }
    this.canvas = el;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Không thể khởi tạo 2D Context cho Canvas!');
    }
    this.ctx = context;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);

    // Tắt khử răng cưa để giữ độ sắc nét hoàn hảo của Pixel Art
    this.ctx.imageSmoothingEnabled = false;
  }

  public clear(color: string = '#0d1117'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}
