import type * as PIXI from 'pixi.js';
import { addPixiSprite, containerProjectiles } from './PixiUtils';
import { lerp, distance } from './math';
import type { Coords } from './commonTypes';

interface Projectile {
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  endTime: number;
  toX: number;
  toY: number;
  sprite: PIXI.Sprite;
}
const SPEED_PER_MILLI = 0.7;
export default function createVisualProjectile(
  coords: Coords,
  toX: number,
  toY: number,
  imagePath: string,
): Promise<void> {
  const sprite = addPixiSprite(imagePath, containerProjectiles);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.scale.set(2);

  sprite.x = coords.x;
  sprite.y = coords.y;

  sprite.rotation = Math.atan2(toY - coords.y, toX - coords.x);

  const instance = {
    x: coords.x,
    y: coords.y,
    startX: coords.x,
    startY: coords.y,
    startTime: 0,
    endTime: 0,
    toX,
    toY,
    sprite,
  };
  return new Promise((resolve) => {
    requestAnimationFrame((time) => fly(instance, time, resolve));
  });
}

function fly(
  instance: Projectile,
  time: number,
  resolve: (value: void | PromiseLike<void>) => void,
) {
  if (instance.startTime == 0) {
    instance.startTime = time;
    const time_in_flight =
      distance(instance, { x: instance.toX, y: instance.toY }) /
      SPEED_PER_MILLI;
    instance.endTime = time + time_in_flight;
  }
  instance.sprite.x = instance.x;
  instance.sprite.y = instance.y;
  const t =
    (time - instance.startTime) / (instance.endTime - instance.startTime);
  instance.x = lerp(instance.startX, instance.toX, t);
  instance.y = lerp(instance.startY, instance.toY, t);
  // Once it's fully done animating
  if (time >= instance.endTime) {
    // Clean up the element
    if (instance.sprite.parent) {
      instance.sprite.parent.removeChild(instance.sprite);
    }
    resolve();
  } else {
    requestAnimationFrame((time) => fly(instance, time, resolve));
  }
}
