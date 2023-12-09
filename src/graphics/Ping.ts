import type * as PIXI from 'pixi.js';
import { GlowFilter } from '@pixi/filter-glow';
import type { Vec2 } from '../jmath/Vec';
import { addPixiSprite, app, containerFloatingText, withinCameraBounds } from './PixiUtils';

interface DisappearingSprite {
  x: number;
  y: number;
  alpha: number;
  valpha: number;
  pixiSprite: PIXI.Sprite;
  keepWithinCameraBounds: boolean;
}
interface DisappearingSpriteInsructions {
  coords: Vec2;
  color?
  : number;
  container?: PIXI.Container;
  style?: Partial<PIXI.ITextStyle>;
  keepWithinCameraBounds?: boolean;
}
export default function pingSprite({
  coords,
  color = 0xfff,
  container = containerFloatingText,
  keepWithinCameraBounds = true
}: DisappearingSpriteInsructions) {
  if (!(globalThis.pixi && app && container)) {
    return Promise.resolve();
  }
  const pixiSprite = addPixiSprite('sparkle.png', containerFloatingText);
  if (pixiSprite) {
    // pixiSprite.tint = color;
    pixiSprite.x = coords.x;
    pixiSprite.y = coords.y;
    pixiSprite.anchor.x = 0.5;
    pixiSprite.anchor.y = 0.5;
    // Keep floating text the same size regardless of camera zoom
    pixiSprite.scale.x = 1 / app.stage.scale.x;
    pixiSprite.scale.y = 1 / app.stage.scale.y;
    // Add glow:
    pixiSprite.filters = [
      new GlowFilter({ distance: 15, outerStrength: 4, innerStrength: 0, color })
    ];
    const instance = {
      x: pixiSprite.x,
      y: pixiSprite.y,
      pixiSprite,
      alpha: 1,
      valpha: -0.2,
      keepWithinCameraBounds,
    };
    container.addChild(pixiSprite);
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => disappear(instance, resolve));
    })
  } else {
    return Promise.reject();
  }
}
function disappear(instance: DisappearingSprite, resolve: (value: void) => void) {
  if (instance.alpha > 0) {
    instance.alpha -= Math.max(instance.valpha, 0);
    instance.valpha += 0.004;
    instance.pixiSprite.rotation += 0.02;
    instance.y -= 0.1;
    if (instance.keepWithinCameraBounds) {
      const pos = withinCameraBounds(instance);
      instance.pixiSprite.y = pos.y;
      instance.pixiSprite.x = pos.x;
    } else {
      instance.pixiSprite.y = instance.y;
      instance.pixiSprite.x = instance.x;
    }
    instance.pixiSprite.alpha = instance.alpha;
    // Once it's fully hidden / done animating
    if (instance.alpha <= 0) {
      // Clean up the element
      if (instance.pixiSprite.parent) {
        instance.pixiSprite.parent.removeChild(instance.pixiSprite);
      }
      resolve();
    } else {
      requestAnimationFrame(() => disappear(instance, resolve));
    }
  }
}