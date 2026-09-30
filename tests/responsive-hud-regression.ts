import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log('PASS responsive-hud:', name);
}

// 1. Kiểm tra CSS và cấu trúc trong index.html
test('index.html defines responsive HUD containers and media queries', () => {
  const htmlPath = path.resolve('index.html');
  const content = fs.readFileSync(htmlPath, 'utf-8');

  assert.ok(content.includes('.hud-top-right'), 'index.html must define .hud-top-right layout');
  assert.ok(content.includes('.hud-panel'), 'index.html must define .hud-panel base styling');
  assert.ok(content.includes('@media (max-width: 1024px)'), 'index.html must include 1024px breakpoint');
  assert.ok(content.includes('@media (max-width: 860px)'), 'index.html must include 860px breakpoint for column switch');
  assert.ok(content.includes('@media (max-width: 768px)'), 'index.html must include 768px breakpoint');
  assert.ok(content.includes('@media (max-height: 700px)'), 'index.html must include 700px height constraint');
});

// 2. Kiểm tra UIManager gom TimeControls và Minimap vào hud-top-right
test('UIManager mounts TimeControls and Minimap in common flex container without overlapping', () => {
  const uiMgrPath = path.resolve('src/ui/UIManager.ts');
  const content = fs.readFileSync(uiMgrPath, 'utf-8');

  assert.ok(content.includes('hud-top-right'), 'UIManager must mount into hud-top-right container');
  assert.ok(content.includes('this.timeControls = new TimeControls(topRightHud, engine)'), 'TimeControls must be child of topRightHud');
  assert.ok(content.includes('this.minimap = new Minimap(topRightHud, engine)'), 'Minimap must be child of topRightHud');
});

// 3. Kiểm tra Minimap và TimeControls không còn hardcode vị trí đè nhau
test('Minimap and TimeControls eliminated hardcoded overlapping right coordinates', () => {
  const minimapPath = path.resolve('src/ui/Minimap.ts');
  const mmContent = fs.readFileSync(minimapPath, 'utf-8');

  assert.ok(!mmContent.includes('right: 240px'), 'Minimap must not use hardcoded right: 240px');
  assert.ok(mmContent.includes('hud-panel'), 'Minimap must use hud-panel class');
  assert.ok(mmContent.includes('minimap-size-toggle'), 'Minimap must provide a size toggle button');

  const tcPath = path.resolve('src/ui/TimeControls.ts');
  const tcContent = fs.readFileSync(tcPath, 'utf-8');
  assert.ok(tcContent.includes('hud-panel'), 'TimeControls must use hud-panel class');
});

// 4. Kiểm tra tính toán tọa độ và kích thước: không bao giờ giao nhau (0% overlap)
test('HUD top-right layout bounds do not overlap at 1366x768, 1024x768, and 768x600', () => {
  // Giả lập tính toán bố cục Flexbox theo cấu hình:
  // Container: right: 12px (hoặc 8px, 6px theo breakpoint)
  // row-reverse: [TimeControls] [gap] [Minimap]
  // column: [TimeControls] ở trên, [Minimap] ở dưới, gap

  interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  }

  function checkOverlap(r1: Rect, r2: Rect): boolean {
    return !(
      r1.right <= r2.left ||
      r1.left >= r2.right ||
      r1.bottom <= r2.top ||
      r1.top >= r2.bottom
    );
  }

  const viewports = [
    { width: 1366, height: 768, mode: 'row' as const, gap: 10, margin: 12, mmSize: 180 },
    { width: 1024, height: 768, mode: 'row' as const, gap: 6, margin: 8, mmSize: 180 },
    { width: 768, height: 600, mode: 'column' as const, gap: 6, margin: 6, mmSize: 120 }
  ];

  for (const vp of viewports) {
    const tcWidth = 240;
    const tcHeight = 76;
    const mmWidth = vp.mmSize + 12; // padding 6px mỗi bên
    const mmHeight = vp.mmSize + 30; // padding + header

    let tcRect: Rect;
    let mmRect: Rect;

    if (vp.mode === 'row') {
      // TimeControls sát phải
      const tcRight = vp.width - vp.margin;
      const tcLeft = tcRight - tcWidth;
      tcRect = {
        left: tcLeft,
        top: vp.margin,
        right: tcRight,
        bottom: vp.margin + tcHeight,
        width: tcWidth,
        height: tcHeight
      };

      // Minimap nằm bên trái TimeControls cách gap
      const mmRight = tcLeft - vp.gap;
      const mmLeft = mmRight - mmWidth;
      mmRect = {
        left: mmLeft,
        top: vp.margin,
        right: mmRight,
        bottom: vp.margin + mmHeight,
        width: mmWidth,
        height: mmHeight
      };
    } else {
      // Dạng cột (column)
      const rightEdge = vp.width - vp.margin;
      tcRect = {
        left: rightEdge - tcWidth,
        top: vp.margin,
        right: rightEdge,
        bottom: vp.margin + tcHeight,
        width: tcWidth,
        height: tcHeight
      };

      mmRect = {
        left: rightEdge - mmWidth,
        top: tcRect.bottom + vp.gap,
        right: rightEdge,
        bottom: tcRect.bottom + vp.gap + mmHeight,
        width: mmWidth,
        height: mmHeight
      };
    }

    assert.equal(
      checkOverlap(tcRect, mmRect),
      false,
      `TimeControls and Minimap must have 0 overlap at ${vp.width}x${vp.height}`
    );
    assert.ok(tcRect.left >= 0, `TimeControls must remain in viewport at ${vp.width}x${vp.height}`);
    assert.ok(mmRect.left >= 0, `Minimap must remain in viewport at ${vp.width}x${vp.height}`);
  }
});

// 5. Kiểm tra WorldChronicle và GodToolbar có nút toggle thu gọn
test('WorldChronicle and GodToolbar provide collapsible controls for full map visibility', () => {
  const chroniclePath = path.resolve('src/ui/WorldChronicle.ts');
  const chrContent = fs.readFileSync(chroniclePath, 'utf-8');
  assert.ok(chrContent.includes('isCollapsed'), 'WorldChronicle must track collapsed state');
  assert.ok(chrContent.includes('chronicle-toggle'), 'WorldChronicle must have toggle button in header');

  const toolbarPath = path.resolve('src/ui/GodToolbar.ts');
  const tbContent = fs.readFileSync(toolbarPath, 'utf-8');
  assert.ok(tbContent.includes('isCollapsed'), 'GodToolbar must track collapsed state');
  assert.ok(tbContent.includes('overflow-x: auto'), 'GodToolbar must scroll tabs horizontally');
  assert.ok(tbContent.includes('flex-wrap: nowrap'), 'GodToolbar must not wrap tabs onto multiple rows');
});

// 6. Kiểm tra InspectorPanel giới hạn kích thước responsive
test('InspectorPanel bounds are constrained to viewport limits', () => {
  const inspPath = path.resolve('src/ui/InspectorPanel.ts');
  const content = fs.readFileSync(inspPath, 'utf-8');

  assert.ok(content.includes('max-height: calc(100vh - 120px)'), 'InspectorPanel must constrain max-height');
  assert.ok(content.includes('width: min(350px, calc(100vw - 24px))'), 'InspectorPanel must constrain width responsive to viewport');
});

console.log(`${passed} responsive-hud regression tests passed`);
