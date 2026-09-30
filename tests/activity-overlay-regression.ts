import assert from 'node:assert/strict';
import { ECSWorld } from '../src/ecs/World.ts';
import { EventBus } from '../src/core/EventBus.ts';
import { PositionComponent } from '../src/modules/beings/BeingComponents.ts';
import { ActivityFeedback } from '../src/renderer/systems/ActivityFeedback.ts';
import { CombatFxRenderer } from '../src/renderer/systems/CombatFxRenderer.ts';
import { ViewportCamera } from '../src/renderer/ViewportCamera.ts';

const world = new ECSWorld();
const entity = world.createEntity();
world.addComponent(entity, new PositionComponent(0, 0));
const activity = ActivityFeedback.getInstance();
activity.clear();
const combat = new CombatFxRenderer(world);
const camera = new ViewportCamera(0, 0, 2);
const drawn: string[] = [];
const ctx = {
  save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {},
  measureText(value: string) { return { width: [...value].length * 6 }; },
  fillText(value: string) { drawn.push(value); },
  font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
  fillStyle: '', strokeStyle: '', shadowBlur: 0, lineWidth: 1
} as unknown as CanvasRenderingContext2D;

EventBus.getInstance().emit('activity:feedback', {
  entityId: entity, text: 'Uống Sương Sớm 🌿💧', color: '#74c0fc'
});
for (let i = 0; i < 100; i++) {
  EventBus.getInstance().emit('activity:feedback', {
    entityId: entity, text: 'Uống Sương Sớm 🌿💧', color: '#74c0fc'
  });
}
assert.equal(activity.getRecent(entity), 'Uống Sương Sớm 🌿💧');

camera.zoom = 0.2;
activity.render(ctx, world, camera, 800, 600, entity, []);
assert.equal(drawn.length, 0, 'Overview must remain clear of routine activity text');

camera.zoom = 1;
activity.render(ctx, world, camera, 800, 600, null, []);
assert.equal(drawn.length, 0, 'Medium zoom shows only selected activity');
activity.render(ctx, world, camera, 800, 600, entity, []);
assert.ok(drawn.some(label => label.includes('Uống nước')),
  'Selected resident gets a short label instead of the full sentence');

drawn.length = 0;
activity.render(ctx, world, camera, 800, 600, entity, [
  { x: 1, y: 1, width: 20, height: 20 },
  { x: 21, y: 1, width: 20, height: 20 },
  { x: 41, y: 1, width: 20, height: 20 },
  { x: 61, y: 1, width: 20, height: 20 }
]);
assert.equal(drawn.length, 0, 'Dialogue and activity share a four-label limit');

for (let i = 0; i < 100; i++) {
  combat.addFloatingText(0, 0, `Rất nhiều chữ số sát thương ${i}`, '#fff');
}
camera.zoom = 0.2;
combat.render(ctx, world, camera, 800, 600, 0.016);
assert.equal(drawn.length, 0, 'Overview hides all floating text, including combat');
camera.zoom = 2;
combat.render(ctx, world, camera, 800, 600, 0.016);
assert.ok(drawn.length <= 5 && drawn.length > 0, 'Combat text remains bounded at close zoom');
assert.ok(drawn.every(label => ctx.measureText(label).width <= 136),
  'Long event messages cannot cross the screen');

activity.clear();
combat.clear();
assert.equal(activity.getRecent(entity), null);
console.log('PASS activity overlay: zoom, selected labels, shared budget, combat bounds and reset');
