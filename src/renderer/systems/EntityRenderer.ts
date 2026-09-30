import { renderLayeredCharacter } from './LayeredCharacterRenderer.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { ViewportCamera } from '../ViewportCamera.ts';
import { AssetManager } from '../assets/AssetManager.ts';
import { FallbackPixelRenderer } from '../assets/FallbackPixelRenderer.ts';
import { RACE_DEFINITIONS } from '../../config/races.config.ts';
import { ANIMATION_CONFIGS } from '../../config/animations.config.ts';
import { getNormalizedCultivationTier } from '../../config/factions.config.ts';
import {
  PositionComponent,
  CharacterStateComponent,
  HealthComponent,
  RaceComponent,
  RealmComponent,
  NameComponent,
  AnimationComponent,
  CorpseComponent,
  GraveComponent,
  DroppedLootComponent,
  SpiritualRootComponent,
} from '../../modules/beings/BeingComponents.ts';
import { EquipmentComponent } from '../../modules/combat/CombatComponents.ts';
import { InsideBuildingComponent } from '../../modules/factions/FactionComponents.ts';
import { getEntityPotential } from '../../modules/traits/DerivedStatsService.ts';
import {
  AnimalCarcassComponent,
  AnimalComponent,
} from '../../modules/animals/AnimalComponents.ts';
import { AnimalRenderer } from './AnimalRenderer.ts';

export const MAX_VISIBLE_CHARACTER_LABELS = 12;

export interface CharacterLabelCandidate {
  entity: number;
  screenX: number;
  textY: number;
  isCorpse?: boolean;
}

/**
 * Mục 13.2:
 * eligible = sống AND (normalizedRealm >= 2 OR (assessmentComplete AND potential >= 80))
 * Giữ điều kiện zoom >= 1.0.
 */
export function shouldShowCharacterMapLabel(
  world: ECSWorld,
  entity: number,
  zoom: number = 1.0
): boolean {
  if (zoom < 1.0) return false;
  if (
    world.hasComponent(entity, AnimalComponent) ||
    world.hasComponent(entity, AnimalCarcassComponent)
  ) {
    return false;
  }

  const hp = world.getComponent(entity, HealthComponent);
  if (hp && (hp.isDead || hp.current <= 0)) return false;

  const state = world.getComponent(entity, CharacterStateComponent);
  if (state?.state === 'dead') return false;

  if (world.hasComponent(entity, CorpseComponent)) return false;

  const realm = world.getComponent(entity, RealmComponent);
  const race = world.getComponent(entity, RaceComponent);
  if (
    realm &&
    race &&
    getNormalizedCultivationTier(race.raceId, realm.stageIndex, 0) >= 2
  ) {
    return true;
  }

  const root = world.getComponent(entity, SpiritualRootComponent);
  if (root && !root.isAwakened) {
    return false;
  }

  const pot = getEntityPotential(world, entity);
  return Boolean(pot && pot.assessmentComplete && pot.total >= 80);
}

export function shouldShowCorpseMapLabel(
  world: ECSWorld,
  entity: number,
  zoom: number = 1.0
): boolean {
  if (zoom < 1.0) return false;
  const realm = world.getComponent(entity, RealmComponent);
  const race = world.getComponent(entity, RaceComponent);
  return Boolean(
    realm &&
      race &&
      getNormalizedCultivationTier(race.raceId, realm.stageIndex, 0) >= 2
  );
}

/**
 * Mục 13.2: Trần 12 nhãn đang thấy; ưu tiên selected nếu đủ điều kiện,
 * rồi cảnh giới chuẩn hóa, rồi tiềm năng P, rồi entityId; bỏ nhãn chồng lấn.
 */
export function selectVisibleCharacterLabels(
  world: ECSWorld,
  candidates: readonly CharacterLabelCandidate[],
  selectedEntity?: number | null,
  maxLabels: number = MAX_VISIBLE_CHARACTER_LABELS
): Set<number> {
  const scored = candidates.map(c => {
    const realm = world.getComponent(c.entity, RealmComponent);
    const race = world.getComponent(c.entity, RaceComponent);
    const normalizedRealm =
      realm && race
        ? getNormalizedCultivationTier(race.raceId, realm.stageIndex, 0)
        : 0;
    const pot = c.isCorpse ? undefined : getEntityPotential(world, c.entity);
    const potentialScore =
      pot && pot.assessmentComplete ? pot.total : 0;
    const isSelected = selectedEntity === c.entity ? 1 : 0;

    return {
      ...c,
      isSelected,
      normalizedRealm,
      potentialScore,
    };
  });

  scored.sort((a, b) => {
    if (b.isSelected !== a.isSelected) return b.isSelected - a.isSelected;
    if (b.normalizedRealm !== a.normalizedRealm) {
      return b.normalizedRealm - a.normalizedRealm;
    }
    if (b.potentialScore !== a.potentialScore) {
      return b.potentialScore - a.potentialScore;
    }
    return a.entity - b.entity;
  });

  const acceptedIds = new Set<number>();
  const boxes: { minX: number; maxX: number; minY: number; maxY: number }[] = [];
  const halfW = 42;
  const height = 22;

  for (const item of scored) {
    if (acceptedIds.size >= maxLabels) break;
    const box = {
      minX: item.screenX - halfW,
      maxX: item.screenX + halfW,
      minY: item.textY - height,
      maxY: item.textY + 4,
    };

    const overlaps = boxes.some(
      b =>
        box.minX < b.maxX &&
        box.maxX > b.minX &&
        box.minY < b.maxY &&
        box.maxY > b.minY
    );
    if (overlaps && item.isSelected === 0) {
      continue;
    }

    acceptedIds.add(item.entity);
    boxes.push(box);
  }

  return acceptedIds;
}

export class EntityRenderer {
  private assetManager = AssetManager.getInstance();

  public render(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    camera: ViewportCamera,
    screenWidth: number,
    screenHeight: number,
    selectedEntity?: number | null
  ): void {
    const bounds = camera.getVisibleBounds(screenWidth, screenHeight);
    const minX = bounds.minX - 32;
    const maxX = bounds.maxX + 32;
    const minY = bounds.minY - 32;
    const maxY = bounds.maxY + 32;

    const visibleRenderables: number[] = [];

    const characters = world.query([PositionComponent, CharacterStateComponent, RaceComponent]);
    for (let i = 0; i < characters.length; i++) {
      const e = characters[i];
      if (world.hasComponent(e, InsideBuildingComponent)) continue;
      const pos = world.getComponent(e, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        visibleRenderables.push(e);
      }
    }

    const animals = world.query([PositionComponent, AnimalComponent]);
    for (let i = 0; i < animals.length; i++) {
      const e = animals[i];
      const pos = world.getComponent(e, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        visibleRenderables.push(e);
      }
    }

    const carcasses = world.query([PositionComponent, AnimalCarcassComponent]);
    for (let i = 0; i < carcasses.length; i++) {
      const e = carcasses[i];
      const pos = world.getComponent(e, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        visibleRenderables.push(e);
      }
    }

    const graves = world.query([PositionComponent, GraveComponent]);
    for (let i = 0; i < graves.length; i++) {
      const e = graves[i];
      const pos = world.getComponent(e, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        visibleRenderables.push(e);
      }
    }

    const loots = world.query([PositionComponent, DroppedLootComponent]);
    for (let i = 0; i < loots.length; i++) {
      const e = loots[i];
      const pos = world.getComponent(e, PositionComponent)!;
      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        visibleRenderables.push(e);
      }
    }

    // Chỉ sort các thực thể thực sự nằm trong tầm nhìn màn hình (tiết kiệm 95% CPU khi có 1.000+ nhân vật)
    visibleRenderables.sort((a, b) => {
      const posA = world.getComponent(a, PositionComponent)!;
      const posB = world.getComponent(b, PositionComponent)!;
      return posA.y - posB.y;
    });

    const isLOD = camera.zoom < 0.35;
    let allowedCharacterLabels: Set<number> | null = null;

    if (!isLOD && camera.zoom >= 1.0) {
      const labelCandidates: CharacterLabelCandidate[] = [];
      const size = Math.floor(18 * camera.zoom);

      for (const e of visibleRenderables) {
        if (
          world.hasComponent(e, GraveComponent) ||
          world.hasComponent(e, DroppedLootComponent) ||
          world.hasComponent(e, AnimalComponent) ||
          world.hasComponent(e, AnimalCarcassComponent)
        ) {
          continue;
        }
        const corpse = world.getComponent(e, CorpseComponent);
        if (corpse?.isBeingCarried) continue;

        const state = world.getComponent(e, CharacterStateComponent);
        const isCorpse = Boolean(corpse || state?.state === 'dead');
        const eligible = isCorpse
          ? shouldShowCorpseMapLabel(world, e, camera.zoom)
          : shouldShowCharacterMapLabel(world, e, camera.zoom);

        if (!eligible) continue;

        const pos = world.getComponent(e, PositionComponent)!;
        const screenPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
        labelCandidates.push({
          entity: e,
          screenX: screenPos.x,
          textY: screenPos.y - size * 0.65,
          isCorpse,
        });
      }

      allowedCharacterLabels = selectVisibleCharacterLabels(
        world,
        labelCandidates,
        selectedEntity,
        MAX_VISIBLE_CHARACTER_LABELS
      );
    }

    for (const entity of visibleRenderables) {
      const pos = world.getComponent(entity, PositionComponent)!;
      const screenPos = camera.worldToScreen(pos.x, pos.y, screenWidth, screenHeight);
      const size = Math.floor(18 * camera.zoom);

      // Level of Detail (LOD): Khi thu nhỏ toàn cảnh, vẽ chấm sáng màu theo cảnh giới/loài để đạt tối đa FPS
      if (isLOD) {
        const realmComp = world.getComponent(entity, RealmComponent);
        const raceComp = world.getComponent(entity, RaceComponent);
        const isGrave = world.hasComponent(entity, GraveComponent);
        const isLoot = world.hasComponent(entity, DroppedLootComponent);
        const isAnimal = world.hasComponent(entity, AnimalComponent);
        const isCarcass = world.hasComponent(entity, AnimalCarcassComponent);

        let color = '#38d9a9';
        if (isGrave || isCarcass) color = '#94a3b8';
        else if (isLoot) color = '#facc15';
        else if (isAnimal) color = '#86efac';
        else if (raceComp?.raceId === 'demon') color = '#f87171';
        else if (raceComp?.raceId === 'beast') color = '#fb923c';
        else if (realmComp && realmComp.stageIndex >= 3) color = '#c084fc';
        else if (realmComp && realmComp.stageIndex >= 1) color = '#60a5fa';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, Math.max(1.8, 4 * camera.zoom), 0, Math.PI * 2);
        ctx.fill();

        if (selectedEntity === entity) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        continue;
      }

      // =======================================================================
      // 0. DỰNG HÌNH ĐỘNG VẬT HOẶC XÁC ĐỘNG VẬT (ANIMAL / ANIMAL CARCASS)
      // =======================================================================
      if (world.hasComponent(entity, AnimalComponent)) {
        AnimalRenderer.renderAnimal(
          ctx,
          world,
          entity,
          screenPos.x,
          screenPos.y,
          Math.max(14, size),
          camera.zoom,
          selectedEntity === entity
        );
        continue;
      }

      if (world.hasComponent(entity, AnimalCarcassComponent)) {
        AnimalRenderer.renderCarcass(
          ctx,
          world,
          entity,
          screenPos.x,
          screenPos.y,
          Math.max(14, size),
          camera.zoom,
          selectedEntity === entity
        );
        continue;
      }

      // =======================================================================
      // A. DỰNG HÌNH NGÔI MỘ (GRAVE)
      // =======================================================================
      const graveComp = world.getComponent(entity, GraveComponent);
      if (graveComp) {
        FallbackPixelRenderer.drawGrave(
          ctx,
          screenPos.x,
          screenPos.y,
          Math.max(16, size),
          '#ffd43b',
          graveComp.realmStageIndex
        );

        if (selectedEntity === entity) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, size * 0.75, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (camera.zoom >= 1.0 && graveComp.realmStageIndex >= 2) {
          const textY = screenPos.y - size * 0.65;
          ctx.textAlign = 'center';
          ctx.font = '10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`🪦 Mộ: ${graveComp.deceasedName}`, screenPos.x, textY);

          ctx.font = '9px "Noto Sans Dialogue", "Noto Sans", sans-serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`[${graveComp.realmStageName}]`, screenPos.x, textY - 11);
        }
        continue;
      }

      // =======================================================================
      // B. DỰNG HÌNH DI VẬT RƠI NGOÀI ĐẤT (DROPPED LOOT)
      // =======================================================================
      const lootComp = world.getComponent(entity, DroppedLootComponent);
      if (lootComp) {
        FallbackPixelRenderer.drawDroppedLoot(
          ctx,
          screenPos.x,
          screenPos.y,
          Math.max(14, Math.floor(size * 0.85))
        );

        if (selectedEntity === entity) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (camera.zoom >= 1.0) {
          const textY = screenPos.y - size * 0.55;
          ctx.textAlign = 'center';
          ctx.font = '10px "Segoe UI", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.fillText(`📦 Di Vật: ${lootComp.ownerName}`, screenPos.x, textY);
        }
        continue;
      }

      // =======================================================================
      // C. DỰNG HÌNH CƯ DÂN HOẶC THI HÀI (CHARACTER / CORPSE)
      // =======================================================================
      const stateComp = world.getComponent(entity, CharacterStateComponent)!;
      const raceComp = world.getComponent(entity, RaceComponent)!;
      const realmComp = world.getComponent(entity, RealmComponent);
      const nameComp = world.getComponent(entity, NameComponent);
      const animComp = world.getComponent(entity, AnimationComponent);
      const corpseComp = world.getComponent(entity, CorpseComponent);

      // Nếu thi hài đang được người thân cõng/bế thì không vẽ đè dưới đất
      if (corpseComp?.isBeingCarried) {
        continue;
      }

      const raceDef = RACE_DEFINITIONS[raceComp.raceId] || RACE_DEFINITIONS['human'];
      const realmColor = '#ffd43b'; // Màu hào quang cảnh giới
      const baseColor = raceDef.colorTheme;

      // 1. Kiểm tra xem người dùng đã thả file Spritesheet thật vào chưa
      const hasRealTexture = animComp && this.assetManager.hasTexture(animComp.configId);

      const layered = renderLayeredCharacter(ctx, world, entity, screenPos.x, screenPos.y, size);
      if (layered) {
        // Body and clothing were drawn together from the same pose.
      } else if (hasRealTexture && animComp && stateComp.state !== 'dead') {
        // DỰNG HÌNH BẰNG SPRITESHEET THẬT CỦA NGƯỜI DÙNG
        this.renderCustomSprite(ctx, animComp, pos, screenPos, size, stateComp.direction);
      } else {
        // DỰNG HÌNH BẰNG FALLBACK PROCEDURAL PIXEL RENDERER
        FallbackPixelRenderer.drawCharacter({
          ctx,
          screenX: screenPos.x,
          screenY: screenPos.y,
          size: Math.max(16, size),
          raceId: raceComp.raceId,
          state: stateComp.state,
          direction: stateComp.direction,
          animFrame: animComp?.frameIndex ?? 0,
          realmColor,
          baseColor
        });
      }

      // 2. Vẽ Vũ Khí hoặc Công Cụ trên tay nhân vật (Chỉ khi còn sống)
      if (stateComp.state !== 'dead') {
        const equip = world.getComponent(entity, EquipmentComponent);
        if (equip) {
          const weaponOffset = size * 0.45;
          const isWorking = stateComp.state === 'farm' || stateComp.state === 'build';
          // Khi làm việc thì cầm công cụ, hoặc nếu không có vũ khí thì mang theo công cụ
          const displayedMainItem = (isWorking && equip.workTool) ? equip.workTool : (equip.mainHand ?? equip.workTool);

          // Tay Thuận (Bên Phải)
          if (displayedMainItem) {
            ctx.fillStyle = displayedMainItem.color;
            ctx.fillRect(screenPos.x + weaponOffset - 2, screenPos.y, 3, 10);
            if (displayedMainItem.glowColor) {
              ctx.fillStyle = displayedMainItem.glowColor;
              ctx.fillRect(screenPos.x + weaponOffset - 3, screenPos.y - 1, 5, 3);
            }
          }
          // Tay Phụ (Bên Trái - Song Trì)
          if (!isWorking && equip.isDualWielding() && equip.offHand) {
            ctx.fillStyle = equip.offHand.color;
            ctx.fillRect(screenPos.x - weaponOffset - 1, screenPos.y, 3, 10);
            if (equip.offHand.glowColor) {
              ctx.fillStyle = equip.offHand.glowColor;
              ctx.fillRect(screenPos.x - weaponOffset - 2, screenPos.y - 1, 5, 3);
            }
          }
        }
      }

      // 3. Vẽ vòng tròn được chọn (Selected Indicator)
      if (selectedEntity === entity) {
        ctx.strokeStyle = stateComp.state === 'dead' ? '#94a3b8' : '#40c057';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size * 0.75, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Hiển thị Tên & Cảnh Giới khi Zoom đủ gần và nằm trong tập nhãn ưu tiên (tối đa 12 nhãn, không chồng lấn)
      if (camera.zoom >= 1.0 && allowedCharacterLabels?.has(entity)) {
        const textY = screenPos.y - size * 0.65;
        ctx.textAlign = 'center';

        if (stateComp.state === 'dead') {
          ctx.font = '10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`💀 ${corpseComp?.deceasedName ?? nameComp?.name ?? 'Thi Hài'}`, screenPos.x, textY);

          ctx.font = '9px "Noto Sans Dialogue", "Noto Sans", sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`[Thi Hài • ${corpseComp?.realmStageName ?? realmComp?.stageName ?? 'Phàm Nhân'}]`, screenPos.x, textY - 11);
        } else {
          // Tên nhân vật sống
          ctx.font = '10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(nameComp?.name ?? 'Vô Danh', screenPos.x, textY);

          // Huy hiệu Cảnh giới
          if (realmComp) {
            ctx.font = '9px "Noto Sans Dialogue", "Noto Sans", sans-serif';
            ctx.fillStyle = realmColor;
            ctx.fillText(`[${realmComp.stageName}]`, screenPos.x, textY - 11);
          }
        }
      }
    }
  }

  private renderCustomSprite(
    ctx: CanvasRenderingContext2D,
    animComp: AnimationComponent,
    _pos: PositionComponent,
    screenPos: { x: number; y: number },
    size: number,
    direction: string
  ): void {
    const img = this.assetManager.getTexture(animComp.configId)!;
    const config = ANIMATION_CONFIGS[animComp.configId];
    if (!config) return;

    const clip = config.clips[animComp.currentClip];
    const frameIndex = animComp.frameIndex;
    const frameW = config.frameWidth;
    const frameH = config.frameHeight;

    const row = clip?.row ?? 0;
    const col = (clip?.startCol ?? 0) + frameIndex;

    const sx = col * frameW;
    const sy = row * frameH;

    const dx = Math.floor(screenPos.x - size / 2);
    const dy = Math.floor(screenPos.y - size / 2);

    ctx.save();
    // Lật ảnh nếu hướng sang trái và spritesheet chỉ vẽ hướng phải
    if (direction === 'left') {
      ctx.translate(dx + size, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, size, size);
    } else {
      ctx.drawImage(img, sx, sy, frameW, frameH, dx, dy, size, size);
    }
    ctx.restore();
  }
}
