import { ECSWorld } from '../../ecs/World.ts';
import { AppearanceComponent, AppearanceRegistry } from './Appearance.ts';
import { ARMOR_DEFINITIONS, EquipmentComponent } from '../combat/CombatComponents.ts';
export function equipArmor(world:ECSWorld,id:number,itemId:string|null): string|null {
  const equip=world.getComponent(id,EquipmentComponent);
  if(!equip) return 'Nhân vật không có ô trang phục';
  if(itemId===null) {equip.bodyArmor=null;return null;}
  const item=ARMOR_DEFINITIONS[itemId];
  if(!item) return 'Không tìm thấy trang phục';
  const appearance=world.getComponent(id,AppearanceComponent);
  const definition=appearance?AppearanceRegistry.instance.appearances.get(appearance.appearanceId):undefined;
  const visual=appearance?AppearanceRegistry.instance.visual(itemId,appearance):undefined;
  if(!definition||!visual||visual.frameSize!==definition.frameSize) return 'Chưa có bộ ảnh trang phục tương thích với dáng nhân vật này';
  equip.bodyArmor=item;
  return null;
}
