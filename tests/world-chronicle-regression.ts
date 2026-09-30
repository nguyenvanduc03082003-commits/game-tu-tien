import assert from 'node:assert/strict';
import { WorldChronicle } from '../src/ui/WorldChronicle.ts';
import { EventBus } from '../src/core/EventBus.ts';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  fn();
  passed++;
  console.log('PASS chronicle:', name);
}

// Mock DOM
function createMockElement(tag: string = 'div'): any {
  const listeners: Record<string, Function[]> = {};
  const children: any[] = [];
  let _innerHTML = '';
  const el: any = {
    tagName: tag.toUpperCase(),
    style: {},
    className: '',
    textContent: '',
    parentElement: null,
    title: '',
    children,
    get innerHTML() {
      return _innerHTML;
    },
    set innerHTML(val: string) {
      _innerHTML = val;
      if (val === '') {
        children.length = 0;
      }
    },
    appendChild(child: any) {
      child.parentElement = el;
      children.push(child);
      return child;
    },
    removeChild(child: any) {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        child.parentElement = null;
        children.splice(idx, 1);
      }
      return child;
    },
    get firstChild() {
      return children[0] ?? null;
    },
    addEventListener(event: string, fn: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }
  };
  return el;
}

export function runWorldChronicleRegressionTests() {
  const prevDoc = (globalThis as any).document;

  try {
    (globalThis as any).document = {
      createElement: (tag: string) => createMockElement(tag)
    };

    const eventBus = EventBus.getInstance();

    test('6: Phát world:log loại birth xuất hiện trong WorldChronicle', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);
      chronicle.clear();

      eventBus.emit('world:log', {
        type: 'birth',
        message: '👶 Lý Tiêu Dao đón một sinh linh mới.'
      });

      const logList = (chronicle as any).logList;
      assert.equal(logList.children.length, 1, 'Phải có 1 log được thêm');
      const item = logList.children[0];
      assert.equal(item.textContent, '👶 Lý Tiêu Dao đón một sinh linh mới.');
      assert.equal(item.style.color, '#63e6be', 'Màu chữ sự kiện sinh phải là xanh ngọc #63e6be');
      chronicle.destroy();
    });

    test('6: Phát world:log loại death xuất hiện trong WorldChronicle', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);
      chronicle.clear();

      eventBus.emit('world:log', {
        type: 'death',
        message: '💀 Lão Tôn tử vong do đói khát lâu ngày...'
      });

      const logList = (chronicle as any).logList;
      assert.equal(logList.children.length, 1);
      const item = logList.children[0];
      assert.equal(item.textContent, '💀 Lão Tôn tử vong do đói khát lâu ngày...');
      assert.equal(item.style.color, '#ced4da', 'Màu chữ sự kiện tử phải là xám tro #ced4da');
      chronicle.destroy();
    });

    test('6: Loại không được phép (unsupported) bị bỏ qua', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);
      chronicle.clear();

      eventBus.emit('world:log', {
        type: 'random_spam_event',
        message: 'Thông báo không hợp lệ'
      });

      const logList = (chronicle as any).logList;
      assert.equal(logList.children.length, 0, 'Loại không được phép không được xuất hiện');
      chronicle.destroy();
    });

    test('6: Gom nhóm thông điệp trùng lặp liên tiếp để tránh spam', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);
      chronicle.clear();

      // Phát 3 lần cùng 1 thông báo
      eventBus.emit('world:log', { type: 'birth', message: '👶 Đón sinh linh mới.' });
      eventBus.emit('world:log', { type: 'birth', message: '👶 Đón sinh linh mới.' });
      eventBus.emit('world:log', { type: 'birth', message: '👶 Đón sinh linh mới.' });

      const logList = (chronicle as any).logList;
      assert.equal(logList.children.length, 1, 'Chỉ hiển thị 1 dòng duy nhất');
      assert.equal(logList.children[0].textContent, '👶 Đón sinh linh mới. (x3)');
      chronicle.destroy();
    });

    test('6: clear() xóa sạch nhật ký và reset trạng thái gom nhóm', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);

      eventBus.emit('world:log', { type: 'birth', message: '👶 Sinh linh A' });
      assert.ok((chronicle as any).logList.children.length > 0);

      chronicle.clear();
      assert.equal((chronicle as any).logList.children.length, 0, 'clear() phải xóa sạch log');

      // Phát lại đúng thông điệp đó, phải tạo item mới x1, không dồn vào cái cũ
      eventBus.emit('world:log', { type: 'birth', message: '👶 Sinh linh A' });
      assert.equal((chronicle as any).logList.children.length, 1);
      assert.equal((chronicle as any).logList.children[0].textContent, '👶 Sinh linh A');
      chronicle.destroy();
    });

    test('6: Giới hạn tối đa 35 dòng không làm tràn danh sách', () => {
      const parent = createMockElement('div');
      const chronicle = new WorldChronicle(parent);
      chronicle.clear();

      for (let i = 0; i < 40; i++) {
        eventBus.emit('world:log', { type: 'death', message: `💀 Người thứ ${i} qua đời` });
      }

      const logList = (chronicle as any).logList;
      assert.equal(logList.children.length, 35, 'Số dòng không được vượt quá 35');
      // Dòng đầu tiên hiện tại phải là người thứ 5 (0..4 đã bị pop)
      assert.equal(logList.children[0].textContent, '💀 Người thứ 5 qua đời');
      assert.equal(logList.children[34].textContent, '💀 Người thứ 39 qua đời');
      chronicle.destroy();
    });
  } finally {
    (globalThis as any).document = prevDoc;
  }

  console.log(`${passed} chronicle regression tests passed`);
}

runWorldChronicleRegressionTests();
