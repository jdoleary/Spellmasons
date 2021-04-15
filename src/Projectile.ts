import type * as PIXI from 'pixi.js';
import { addPixiSprite, containerProjectiles } from './PixiUtils';
import { cellToBoardCoords, lerp, distance } from './math';
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
) {
  const sprite = addPixiSprite(imagePath, containerProjectiles);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.scale.set(2);

  const { x, y } = cellToBoardCoords(coords.x, coords.y);
  sprite.x = x;
  sprite.y = y;

  const { x: toXBoard, y: toYBoard } = cellToBoardCoords(toX, toY);
  sprite.rotation = Math.atan2(toYBoard - y, toXBoard - x);

  const instance = {
    x,
    y,
    startX: x,
    startY: y,
    startTime: 0,
    endTime: 0,
    toX: toXBoard,
    toY: toYBoard,
    sprite,
  };
  requestAnimationFrame((time) => fly(instance, time));
}

function fly(instance: Projectile, time: number) {
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
  } else {
    requestAnimationFrame((time) => fly(instance, time));
  }
}
