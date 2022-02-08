import type * as PIXI from 'pixi.js';
import { addPixiSprite, containerProjectiles } from './PixiUtils';
import { lerp, distance } from './math';
import type { Vec2 } from './commonTypes';
import * as config from './config';

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
function createProjectile(
  coords: Vec2,
  toX: number,
  toY: number,
  imagePath: string,
): Projectile {
  const sprite = addPixiSprite(imagePath, containerProjectiles);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.scale.set(2);

  sprite.x = coords.x;
  sprite.y = coords.y;

  sprite.rotation = Math.atan2(toY - coords.y, toX - coords.x);

  return {
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

}
const SPEED_PER_MILLI = 0.7;
export function createVisualFlyingProjectile(
  coords: Vec2,
  toX: number,
  toY: number,
  imagePath: string,
): Promise<void> {
  const instance = createProjectile(coords, toX, toY, imagePath);
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
export function createVisualLobbingProjectile(
  coords: Vec2,
  toX: number,
  toY: number,
  imagePath: string,
): Promise<void> {
  const instance = createProjectile(coords, toX, toY, imagePath);
  return new Promise((resolve) => {
    requestAnimationFrame((time) => lob(instance, time, resolve));
  });
}
// Arbitrary lobHeight (negative so it lobs the projectile UP)
const lobHeight = -100;
// lob a projectile in an arch
function lob(
  instance: Projectile,
  time: number,
  resolve: (value: void | PromiseLike<void>) => void,
) {
  if (instance.startTime == 0) {
    instance.startTime = time;
    const time_in_flight = config.LOB_PROJECTILE_SPEED;
    instance.endTime = time + time_in_flight;
  }
  instance.sprite.x = instance.x;
  instance.sprite.y = instance.y;
  instance.sprite.rotation += 0.2;
  const t =
    (time - instance.startTime) / (instance.endTime - instance.startTime);
  instance.x = lerp(instance.startX, instance.toX, t);
  // y goes from startY to toY but is offset Math.sin(Math.PI/2)*lobHeight in the middle
  const yOffset = Math.sin(t * Math.PI) * lobHeight;
  instance.y = lerp(instance.startY, instance.toY, t) + yOffset;
  // Once it's fully done animating
  if (time >= instance.endTime) {
    // Clean up the element
    if (instance.sprite.parent) {
      instance.sprite.parent.removeChild(instance.sprite);
    }
    resolve();
  } else {
    requestAnimationFrame((time) => lob(instance, time, resolve));
  }
}
