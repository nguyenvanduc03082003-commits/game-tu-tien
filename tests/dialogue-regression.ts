import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { DialogueRenderer } from '../src/renderer/systems/DialogueRenderer.ts';
import { ViewportCamera } from '../src/renderer/ViewportCamera.ts';

// Simulate the burst of speech events produced when the world runs at 50x.
let now = 0;
const renderer = new DialogueRenderer(() => now);
const world = new ECSWorld();
const speakers: number[] = [];
for (let i = 0; i < 50; i++) {
  const entity = world.createEntity();
  world.addComponent(entity, new PositionComponent(0, 0));
  speakers.push(entity);
  renderer.add({ entityId: entity, text: `Lời thoại dài số ${i}: thiên địa linh khí dồi dào, cùng thưởng trà ngộ đạo.` });
  now += 310;
}

const drawn: string[] = [];
const context = {
  save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {},
  measureText(value: string) { return { width: [...value].length * 6 }; },
  fillText(value: string) { drawn.push(value); },
  font: '', textAlign: '', textBaseline: '', globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1
} as unknown as CanvasRenderingContext2D;
const camera = new ViewportCamera(0, 0, 2);

renderer.render(context, world, camera, 800, 600, 0.016, null);
assert.ok(drawn.length <= 8, 'At most four visible bubbles of two lines each');
assert.ok(drawn.length > 0);
assert.ok(drawn.every(line => context.measureText(line).width <= 164));
assert.ok(context.font.includes('Noto Sans Dialogue'));

drawn.length = 0;
camera.zoom = 1;
renderer.render(context, world, camera, 800, 600, 0.016, null);
assert.ok(drawn.length <= 4, 'Medium zoom shows at most two bubbles');

drawn.length = 0;
camera.zoom = 0.2;
renderer.render(context, world, camera, 800, 600, 0.016, null);
assert.equal(drawn.length, 0, 'Distant overview hides ordinary dialogue');

drawn.length = 0;
renderer.render(context, world, camera, 800, 600, 0.016, speakers.at(-1)!);
assert.ok(drawn.length > 0 && drawn.length <= 2, 'Selected speaker remains visible in overview');

drawn.length = 0;
renderer.add({ entityId: speakers.at(-1)!, text: 'Câu trùng đến ngay lập tức' });
renderer.render(context, world, camera, 800, 600, 0.016, speakers.at(-1)!);
assert.ok(drawn.every(line => !line.includes('Câu trùng')), 'Per-speaker cooldown prevents repeats');

renderer.clear();
drawn.length = 0;
renderer.render(context, world, camera, 800, 600, 0.016, speakers.at(-1)!);
assert.equal(drawn.length, 0, 'World reset clears old dialogue');
console.log('PASS dialogue: zoom limits, Vietnamese font, line width, burst control and reset');
