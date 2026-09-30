import { AppearanceComponent, AppearanceRegistry } from '../../modules/appearance/Appearance.ts';
import { System } from '../../ecs/System.ts';
import { ECSWorld } from '../../ecs/World.ts';
import { ANIMATION_CONFIGS } from '../../config/animations.config.ts';
import { CharacterStateComponent, AnimationComponent } from '../../modules/beings/BeingComponents.ts';

export class AnimationSystem implements System {
  public name = 'AnimationSystem';
  public enabled = true;
  public priority = 80; // Chạy gần cuối trước khi render

  public update(world: ECSWorld, dt: number): void {
    const entities = world.query([CharacterStateComponent, AnimationComponent]);

    for (const entity of entities) {
      const stateComp = world.getComponent(entity, CharacterStateComponent)!;
      const animComp = world.getComponent(entity, AnimationComponent)!;

      // Nếu trạng thái thay đổi, đổi clip và reset frame
      if (animComp.currentClip !== stateComp.state) {
        animComp.currentClip = stateComp.state;
        animComp.frameIndex = 0;
        animComp.elapsedTime = 0;
      }

      // Cập nhật frame theo FPS của clip
      const appearance = world.getComponent(entity, AppearanceComponent);
      if (appearance && AppearanceRegistry.instance.appearances.has(appearance.appearanceId)) {
        const moving=stateComp.state==='walk';
        const frames=moving?6:4;
        animComp.elapsedTime+=dt;
        const ticks=Math.floor(animComp.elapsedTime*(moving?10:5));
        animComp.elapsedTime-=ticks/(moving?10:5);
        animComp.frameIndex=stateComp.state==='dead'?0:(animComp.frameIndex+ticks)%frames;
        continue;
      }
      const config = ANIMATION_CONFIGS[animComp.configId];
      const clip = config?.clips[animComp.currentClip];

      const fps = clip?.frameRate ?? 6;
      const frameDuration = 1 / fps;
      const maxFrames = clip?.frameCount ?? 4;

      animComp.elapsedTime += dt;
      if (animComp.elapsedTime >= frameDuration) {
        animComp.elapsedTime -= frameDuration;
        if (clip?.loop ?? true) {
          animComp.frameIndex = (animComp.frameIndex + 1) % maxFrames;
        } else {
          animComp.frameIndex = Math.min(maxFrames - 1, animComp.frameIndex + 1);
        }
      }
    }
  }
}
