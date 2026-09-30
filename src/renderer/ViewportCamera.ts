export class ViewportCamera {
  public x: number = 0; // Tọa độ tâm camera trong thế giới
  public y: number = 0;
  public zoom: number = 2.0; // Mặc định phóng to 2x để nhìn rõ chi tiết pixel

  public readonly minZoom: number = 0.1;
  public readonly maxZoom: number = 5.0;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(initialX: number = 0, initialY: number = 0, zoom: number = 2.0) {
    this.x = initialX;
    this.y = initialY;
    this.zoom = zoom;
  }

  private boundCanvas: HTMLCanvasElement | null = null;

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      e.preventDefault();
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isDragging) {
      const dx = (e.clientX - this.lastMouseX) / this.zoom;
      const dy = (e.clientY - this.lastMouseY) / this.zoom;
      this.x -= dx;
      this.y -= dy;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
      this.isDragging = false;
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));

    if (newZoom !== this.zoom) {
      // Zoom giữ nguyên vị trí trỏ chuột trong thế giới
      const mouseWorldBefore = this.screenToWorld(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      this.zoom = newZoom;
      const mouseWorldAfter = this.screenToWorld(e.clientX, e.clientY, window.innerWidth, window.innerHeight);

      this.x += mouseWorldBefore.x - mouseWorldAfter.x;
      this.y += mouseWorldBefore.y - mouseWorldAfter.y;
    }
  };

  public setupInputHandlers(canvas: HTMLCanvasElement): void {
    this.boundCanvas = canvas;
    
    // Bắt đầu kéo bản đồ (Chuột phải hoặc Chuột giữa hoặc giữ phím Space + Chuột trái)
    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    
    // Chặn menu chuột phải mặc định trên canvas để dùng làm thao tác điều khiển
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    
    // Phóng to / Thu nhỏ theo vị trí con trỏ chuột
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  public dispose(): void {
    if (this.boundCanvas) {
      this.boundCanvas.removeEventListener('mousedown', this.handleMouseDown);
      this.boundCanvas.removeEventListener('contextmenu', this.handleContextMenu);
      this.boundCanvas.removeEventListener('wheel', this.handleWheel);
      this.boundCanvas = null;
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  public worldToScreen(wx: number, wy: number, screenWidth: number, screenHeight: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + screenWidth / 2,
      y: (wy - this.y) * this.zoom + screenHeight / 2,
    };
  }

  public screenToWorld(sx: number, sy: number, screenWidth: number, screenHeight: number): { x: number; y: number } {
    return {
      x: (sx - screenWidth / 2) / this.zoom + this.x,
      y: (sy - screenHeight / 2) / this.zoom + this.y,
    };
  }

  public getVisibleBounds(screenWidth: number, screenHeight: number): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfW = (screenWidth / 2) / this.zoom;
    const halfH = (screenHeight / 2) / this.zoom;
    return {
      minX: this.x - halfW,
      minY: this.y - halfH,
      maxX: this.x + halfW,
      maxY: this.y + halfH,
    };
  }
}
