import { getAnimalSpecies } from '../../config/animals/animal.catalog.ts';
import { ANIMAL_CHILD_SCALE_FACTOR } from '../../config/animals/animal.simulation.ts';
import {
  AnimalBodyShape,
  AnimalLifeStage,
  AnimalSpeciesDefinition,
} from '../../config/animals/animal.types.ts';
import { ECSWorld } from '../../ecs/World.ts';
import {
  AnimalCarcassComponent,
  AnimalComponent,
} from '../../modules/animals/AnimalComponents.ts';
import {
  AnimationComponent,
  CharacterStateComponent,
  HealthComponent,
  NameComponent,
} from '../../modules/beings/BeingComponents.ts';
import { AnimalAssetManager } from '../assets/AnimalAssetManager.ts';

export class AnimalRenderer {
  public static getOptionalSprite(
    speciesOrId: AnimalSpeciesDefinition | string,
    lifeStage: AnimalLifeStage
  ): HTMLImageElement | undefined {
    const spec =
      typeof speciesOrId === 'string'
        ? getAnimalSpecies(speciesOrId)
        : speciesOrId;
    return AnimalAssetManager.getInstance().getAnimalSprite(spec, lifeStage);
  }

  public static renderAnimal(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    entity: number,
    screenX: number,
    screenY: number,
    basePixelSize: number,
    zoom: number,
    isSelected: boolean
  ): void {
    const animal = world.getComponent(entity, AnimalComponent);
    if (!animal) return;

    const spec = getAnimalSpecies(animal.speciesId);
    const stateComp = world.getComponent(entity, CharacterStateComponent);
    const animComp = world.getComponent(entity, AnimationComponent);
    const hp = world.getComponent(entity, HealthComponent);
    const nameComp = world.getComponent(entity, NameComponent);

    const lifeScale =
      animal.lifeStage === 'child' ? ANIMAL_CHILD_SCALE_FACTOR : 1.0;
    const effectiveScale = spec.scale * lifeScale;
    const drawSize = Math.max(8, basePixelSize * effectiveScale);
    const direction = stateComp?.direction ?? 'down';
    const isMoving = stateComp?.state === 'walk' || stateComp?.state === 'attack';
    const frameIndex = animComp?.frameIndex ?? 0;
    const bobOffset = isMoving ? (frameIndex % 2 === 0 ? -1.2 : 0.8) : 0;

    // 1. Kiểm tra sprite tùy chọn nếu đã nạp sẵn trong AssetManager
    const customSprite = this.getOptionalSprite(spec, animal.lifeStage);
    if (customSprite) {
      ctx.save();
      const half = drawSize / 2;
      if (direction === 'left') {
        ctx.translate(screenX + half, screenY - half + bobOffset);
        ctx.scale(-1, 1);
        ctx.drawImage(customSprite, 0, 0, drawSize, drawSize);
      } else {
        ctx.drawImage(
          customSprite,
          screenX - half,
          screenY - half + bobOffset,
          drawSize,
          drawSize
        );
      }
      ctx.restore();
    } else {
      // 2. Vẽ hình học cơ bản theo bodyShape, primaryColor, secondaryColor, scale
      this.drawProceduralAnimal(
        ctx,
        spec,
        animal.lifeStage,
        screenX,
        screenY + bobOffset,
        drawSize,
        direction,
        isMoving,
        frameIndex
      );
    }

    // 3. Thanh máu nhỏ khi bị thương hoặc đang được chọn
    if (hp && hp.current < hp.max && hp.current > 0 && zoom >= 0.75) {
      const barW = Math.max(14, drawSize * 0.9);
      const barH = 3;
      const barX = screenX - barW / 2;
      const barY = screenY - drawSize * 0.65 - 5;
      const ratio = Math.max(0, Math.min(1, hp.current / Math.max(1, hp.max)));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = ratio > 0.4 ? '#4ade80' : '#f87171';
      ctx.fillRect(barX, barY, barW * ratio, barH);
    }

    // 4. Vòng chọn & nhãn khi người chơi chọn cá thể động vật
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(10, drawSize * 0.65), 0, Math.PI * 2);
      ctx.stroke();

      if (zoom >= 0.8) {
        const label = nameComp?.name ?? spec.name;
        ctx.textAlign = 'center';
        ctx.font = '10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, screenX, screenY - drawSize * 0.72 - 6);
      }
      ctx.restore();
    }
  }

  public static renderCarcass(
    ctx: CanvasRenderingContext2D,
    world: ECSWorld,
    entity: number,
    screenX: number,
    screenY: number,
    basePixelSize: number,
    zoom: number,
    isSelected: boolean
  ): void {
    const carcass = world.getComponent(entity, AnimalCarcassComponent);
    if (!carcass) return;

    const spec = getAnimalSpecies(carcass.speciesId);
    const drawSize = Math.max(8, basePixelSize * spec.scale * 0.85);

    ctx.save();
    ctx.translate(screenX, screenY);

    // Bóng dưới đất
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, drawSize * 0.12, drawSize * 0.46, drawSize * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân xác nằm nghiêng tối màu
    ctx.fillStyle = spec.primaryColor;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(0, 0, drawSize * 0.4, drawSize * 0.22, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Vệt xương sườn trắng ngà biểu thị xác động vật
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(1, drawSize * 0.07);
    for (let i = -1; i <= 1; i++) {
      const rx = i * drawSize * 0.12;
      ctx.beginPath();
      ctx.moveTo(rx, -drawSize * 0.12);
      ctx.lineTo(rx, drawSize * 0.12);
      ctx.stroke();
    }

    ctx.restore();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(9, drawSize * 0.6), 0, Math.PI * 2);
      ctx.stroke();

      if (zoom >= 0.8) {
        ctx.textAlign = 'center';
        ctx.font = '10px "Noto Sans Dialogue", "Noto Sans", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`Xác ${spec.name}`, screenX, screenY - drawSize * 0.65 - 4);
      }
      ctx.restore();
    }
  }

  private static drawProceduralAnimal(
    ctx: CanvasRenderingContext2D,
    spec: AnimalSpeciesDefinition,
    lifeStage: AnimalLifeStage,
    x: number,
    y: number,
    size: number,
    direction: string,
    isMoving: boolean,
    frameIndex: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const facingSign = direction === 'left' ? -1 : 1;
    ctx.scale(facingSign, 1);

    const primary = spec.primaryColor;
    const secondary = spec.secondaryColor;
    const legSwing = isMoving ? (frameIndex % 2 === 0 ? 1.5 : -1.5) : 0;

    // Bóng đổ mặt đất
    ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.28, size * 0.42, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const shape: AnimalBodyShape = spec.bodyShape;

    switch (shape) {
      case 'small_mammal': {
        // 4 chân ngắn
        ctx.fillStyle = secondary;
        ctx.fillRect(-size * 0.24, size * 0.12, size * 0.09, size * 0.18 + legSwing * 0.3);
        ctx.fillRect(-size * 0.08, size * 0.12, size * 0.09, size * 0.18 - legSwing * 0.3);
        ctx.fillRect(size * 0.08, size * 0.12, size * 0.09, size * 0.18 + legSwing * 0.3);
        ctx.fillRect(size * 0.2, size * 0.12, size * 0.09, size * 0.18 - legSwing * 0.3);

        // Đuôi nhỏ
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.arc(-size * 0.34, -size * 0.02, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Thân bầu dục nhỏ
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(-size * 0.04, 0, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Đầu tròn
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(size * 0.24, -size * 0.08, size * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // Tai
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.ellipse(size * 0.2, -size * 0.24, size * 0.06, size * 0.12, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Mắt
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(size * 0.29, -size * 0.11, Math.max(1.5, size * 0.05), Math.max(1.5, size * 0.05));
        break;
      }

      case 'quadruped': {
        // 4 chân vừa
        ctx.fillStyle = secondary;
        ctx.fillRect(-size * 0.28, size * 0.08, size * 0.1, size * 0.24 + legSwing * 0.4);
        ctx.fillRect(-size * 0.12, size * 0.08, size * 0.1, size * 0.24 - legSwing * 0.4);
        ctx.fillRect(size * 0.1, size * 0.08, size * 0.1, size * 0.24 + legSwing * 0.4);
        ctx.fillRect(size * 0.24, size * 0.08, size * 0.1, size * 0.24 - legSwing * 0.4);

        // Đuôi
        ctx.strokeStyle = secondary;
        ctx.lineWidth = Math.max(2, size * 0.09);
        ctx.beginPath();
        ctx.moveTo(-size * 0.32, -size * 0.04);
        ctx.lineTo(-size * 0.48, size * 0.06);
        ctx.stroke();

        // Thân vừa
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(-size * 0.03, -size * 0.02, size * 0.34, size * 0.21, 0, 0, Math.PI * 2);
        ctx.fill();

        // Đầu rõ hướng
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(size * 0.29, -size * 0.12, size * 0.18, size * 0.14, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Tai nhọn
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(size * 0.2, -size * 0.22);
        ctx.lineTo(size * 0.25, -size * 0.36);
        ctx.lineTo(size * 0.31, -size * 0.22);
        ctx.closePath();
        ctx.fill();

        // Mắt
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(size * 0.35, -size * 0.15, Math.max(1.5, size * 0.05), Math.max(1.5, size * 0.05));
        break;
      }

      case 'large_ungulate': {
        // 4 chân trụ lớn
        ctx.fillStyle = secondary;
        ctx.fillRect(-size * 0.3, size * 0.06, size * 0.12, size * 0.26 + legSwing * 0.4);
        ctx.fillRect(-size * 0.13, size * 0.06, size * 0.12, size * 0.26 - legSwing * 0.4);
        ctx.fillRect(size * 0.1, size * 0.06, size * 0.12, size * 0.26 + legSwing * 0.4);
        ctx.fillRect(size * 0.25, size * 0.06, size * 0.12, size * 0.26 - legSwing * 0.4);

        // Thân lớn
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(-size * 0.02, -size * 0.04, size * 0.38, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bờm / vai màu phụ
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.ellipse(size * 0.16, -size * 0.08, size * 0.18, size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Đầu lớn
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(size * 0.33, -size * 0.14, size * 0.19, size * 0.16, 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Sừng / ngà theo màu phụ
        ctx.strokeStyle = secondary;
        ctx.lineWidth = Math.max(1.8, size * 0.08);
        ctx.beginPath();
        ctx.moveTo(size * 0.28, -size * 0.24);
        ctx.lineTo(size * 0.38, -size * 0.38);
        ctx.stroke();

        // Mắt
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(size * 0.39, -size * 0.17, Math.max(1.8, size * 0.05), Math.max(1.8, size * 0.05));
        break;
      }

      case 'avian': {
        // 2 chân mảnh
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = Math.max(1.2, size * 0.06);
        ctx.beginPath();
        ctx.moveTo(-size * 0.05, size * 0.1);
        ctx.lineTo(-size * 0.05 + legSwing * 0.3, size * 0.28);
        ctx.moveTo(size * 0.07, size * 0.1);
        ctx.lineTo(size * 0.07 - legSwing * 0.3, size * 0.28);
        ctx.stroke();

        // Đuôi ngắn
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, 0);
        ctx.lineTo(-size * 0.38, -size * 0.14);
        ctx.lineTo(-size * 0.34, size * 0.06);
        ctx.closePath();
        ctx.fill();

        // Thân tròn nhỏ
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.24, size * 0.19, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cánh khép
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.ellipse(-size * 0.03, 0, size * 0.16, size * 0.11, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Đầu & Mỏ
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(size * 0.2, -size * 0.12, size * 0.13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(size * 0.31, -size * 0.15);
        ctx.lineTo(size * 0.44, -size * 0.11);
        ctx.lineTo(size * 0.31, -size * 0.07);
        ctx.closePath();
        ctx.fill();

        // Mắt
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(size * 0.23, -size * 0.15, Math.max(1.4, size * 0.05), Math.max(1.4, size * 0.05));
        break;
      }

      case 'serpent': {
        // Thân uốn sóng
        const wave = isMoving ? (frameIndex % 2 === 0 ? 1 : -1) : 1;
        ctx.strokeStyle = primary;
        ctx.lineWidth = Math.max(3, size * 0.18);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size * 0.38, size * 0.08);
        ctx.quadraticCurveTo(-size * 0.12, -size * 0.18 * wave, size * 0.08, size * 0.05);
        ctx.quadraticCurveTo(size * 0.22, size * 0.18 * wave, size * 0.3, -size * 0.04);
        ctx.stroke();

        // Vân phụ trên lưng
        ctx.strokeStyle = secondary;
        ctx.lineWidth = Math.max(1.5, size * 0.07);
        ctx.stroke();

        // Đầu tam giác
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.moveTo(size * 0.26, -size * 0.14);
        ctx.lineTo(size * 0.46, -size * 0.04);
        ctx.lineTo(size * 0.26, size * 0.06);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'shelled_reptile': {
        // 4 chân nhỏ
        ctx.fillStyle = secondary;
        ctx.fillRect(-size * 0.24, size * 0.1, size * 0.1, size * 0.12);
        ctx.fillRect(size * 0.14, size * 0.1, size * 0.1, size * 0.12);

        // Mai bầu dục có vân
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(-size * 0.02, 0, size * 0.3, size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = secondary;
        ctx.lineWidth = Math.max(1, size * 0.06);
        ctx.beginPath();
        ctx.ellipse(-size * 0.02, 0, size * 0.18, size * 0.12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Đầu nhỏ thò ra
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.arc(size * 0.31, 0.02 * size, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Dấu hiệu tuổi già nhẹ (viền bạc mảnh trên lưng nếu elder)
    if (lifeStage === 'elder') {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -size * 0.04, size * 0.22, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }

    ctx.restore();
  }
}
