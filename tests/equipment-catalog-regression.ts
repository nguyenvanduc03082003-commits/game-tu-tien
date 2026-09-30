import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { WEAPON_DEFINITIONS } from '../src/config/weapons.config.ts';
import { TOOL_DEFINITIONS } from '../src/config/tools.config.ts';
import { ARMOR_DEFINITIONS, EquipmentComponent } from '../src/modules/combat/CombatComponents.ts';
import { AppearanceComponent, AppearanceRegistry } from '../src/modules/appearance/Appearance.ts';
import { equipArmor } from '../src/modules/appearance/EquipmentAppearance.ts';
import { ECSWorld } from '../src/ecs/World.ts';

async function main(): Promise<void> {
const gear = [
  ...Object.values(WEAPON_DEFINITIONS),
  ...Object.values(TOOL_DEFINITIONS),
  ...Object.values(ARMOR_DEFINITIONS),
].filter(item => item.id.startsWith('raven_'));
assert.equal(gear.length, 9, 'The selected set contains three weapons, three tools, and three armors');
const toolbarSource = await readFile(path.join(process.cwd(), 'src/ui/GodToolbar.ts'), 'utf8');
const engineSource = await readFile(path.join(process.cwd(), 'src/core/Engine.ts'), 'utf8');
assert.ok(!toolbarSource.includes('buildWeaponTab'), 'GodToolbar no longer exposes direct gear gifting');
assert.ok(!engineSource.includes('activeWeaponId'), 'Engine no longer equips gear from map clicks');

for (const item of gear) {
  assert.ok(item.iconPath, `${item.id} has an icon path`);
  const png = await readFile(path.join(process.cwd(), 'public', item.iconPath));
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${item.id} icon is a PNG`);
  assert.equal(png.readUInt32BE(16), 32, `${item.id} icon width`);
  assert.equal(png.readUInt32BE(20), 32, `${item.id} icon height`);
}

const armorItems = Object.values(ARMOR_DEFINITIONS).filter(item => item.id.startsWith('raven_'));
const equipment = [];
for (const item of armorItems) {
  const folder = path.join(process.cwd(), 'public/assets/sprites/equipment', item.id, 'humanoid_standard');
  const visual = JSON.parse(await readFile(path.join(folder, 'visual.json'), 'utf8'));
  assert.equal(visual.frameSize, 64);
  const stages: Record<string, { front: string }> = {};
  for (const stage of ['child', 'adult', 'elder']) {
    const atlas = await readFile(path.join(folder, stage, 'front.png'));
    assert.equal(atlas.toString('hex', 0, 8), '89504e470d0a1a0a', `${item.id}/${stage} atlas is a PNG`);
    assert.equal(atlas.readUInt32BE(16), 384, `${item.id}/${stage} atlas width`);
    assert.equal(atlas.readUInt32BE(20), 512, `${item.id}/${stage} atlas height`);
    stages[stage] = { front: `assets/sprites/equipment/${item.id}/humanoid_standard/${stage}/front.png` };
  }
  equipment.push({ itemId: item.id, bodyProfile: 'humanoid_standard', frameSize: 64, stages });
}

const registry = AppearanceRegistry.instance;
registry.install({
  version: 1,
  appearances: [{
    id: 'human/human/equipment_test', raceId: 'human', speciesId: 'human',
    bodyProfile: 'humanoid_standard', frameSize: 64, weight: 1,
    stages: Object.fromEntries(['child', 'adult', 'elder'].map(stage => [stage, { body: `${stage}/body`, casual: `${stage}/casual` }]))
  }],
  equipment,
  diagnostics: []
});
const world = new ECSWorld();
const resident = world.createEntity();
world.addComponent(resident, new AppearanceComponent('human/human/equipment_test', 'human', 'humanoid_standard'));
world.addComponent(resident, new EquipmentComponent());
for (const item of armorItems) {
  assert.equal(equipArmor(world, resident, item.id), null, `${item.name} can be equipped`);
  assert.equal(world.getComponent(resident, EquipmentComponent)!.bodyArmor?.id, item.id);
}

console.log('PASS equipment-catalog: 9 named icons, valid item stats, and wearable armor atlases');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
