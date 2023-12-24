import type * as PIXI from 'pixi.js';
import { addPixiSpriteAnimated, containerProjectiles, PixiSpriteOptions } from '../graphics/PixiUtils';
import { lerp, distance } from '../jmath/math';
import type { Vec2 } from '../jmath/Vec';
import * as Vec from '../jmath/Vec';
import * as config from '../config';
import * as math from '../jmath/math';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { normalizedVector } from '../jmath/moveWithCollision';

interface LobbedProjectile {
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  endTime: number;
  target: Vec2;
  // intercept allows arrows to "hit" a target
  // and disappear
  // before they arrive at the target they were aimed
  // at.  This allows arrows to hit a unit anywhere (not 
  // redirecting to the target's center position in order
  // to hit them)
  interceptEndTarget?: Vec2;
  interceptEndTime?: number;
  sprite: PIXI.Sprite | undefined;
}
function createLobbedProjectile(
  coords: Vec2,
  target: Vec2,
  imagePath: string,
  options?: PixiSpriteOptions,
  interceptEndTarget?: Vec2
): LobbedProjectile {
  const sprite = addPixiSpriteAnimated(imagePath, containerProjectiles, Object.assign({ animationSpeed: 0.25, loop: true }, options || {}));
  if (sprite) {

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

    sprite.x = coords.x;
    sprite.y = coords.y;

    sprite.rotation = Math.atan2(target.y - coords.y, target.x - coords.x);
  }

  return {
    x: coords.x,
    y: coords.y,
    startX: coords.x,
    startY: coords.y,
    startTime: 0,
    endTime: 0,
    target,
    sprite,
    interceptEndTarget,
  };

}
export interface Projectile {
  x: number;
  y: number;
  startPoint: Vec2;
  endPoint: Vec2;
  doesPierce?: boolean;
  sprite: PIXI.Sprite | undefined;
}
export interface ForceMoveProjectile {
  pushedObject: Projectile;
  velocity: Vec2;
  onCollisionFn: string;
  timedOut?: boolean;
  resolve: () => void;
}
function createProjectile(
  coords: Vec2,
  target: Vec2,
  imagePath: string,
  options?: PixiSpriteOptions,
  doesPierce?: boolean
): Projectile {
  const sprite = addPixiSpriteAnimated(imagePath, containerProjectiles, Object.assign({ animationSpeed: 0.25, loop: true }, options || {}));
  if (sprite) {

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

    sprite.x = coords.x;
    sprite.y = coords.y;

    sprite.rotation = Math.atan2(target.y - coords.y, target.x - coords.x);
  }

  return {
    x: coords.x,
    y: coords.y,
    startPoint: Vec.clone(coords),
    endPoint: target,
    sprite,
    doesPierce
  };

}
export const SPEED_PER_MILLI = 0.8;
export async function createFlyingProjectile(
  coords: Vec2,
  target: Vec2,
  imagePath: string,
  underworld: Underworld,
  prediction: boolean,
  doesPierce?: boolean,
): Promise<void> {
  // TODO remove:
  if (prediction) {
    return Promise.resolve();
  }
  // Use this similarTriangles calculation to make the projectile animation pretty so it doesn't originate from the exact center of the
  // source but at the edge instead
  const startPoint = math.distance(coords, target) <= config.COLLISION_MESH_RADIUS
    ? coords
    : Vec.subtract(coords, math.similarTriangles(coords.x - target.x, coords.y - target.y, math.distance(coords, target), config.COLLISION_MESH_RADIUS));
  const projectile = createProjectile(startPoint, target, imagePath, undefined, doesPierce);
  console.log('jtest set endpoint', target);
  let forceMoveProjectile: ForceMoveProjectile;
  return await raceTimeout(10_000, 'createFlyingProjectile', new Promise<void>((resolve) => {
    const normalVec = normalizedVector(projectile.startPoint, projectile.endPoint);
    if (!normalVec.vector) {
      console.error('Failed to normalize vector for projectile');
      resolve();
      return;
    }

    forceMoveProjectile = {
      pushedObject: projectile,
      velocity: Vec.multiply(SPEED_PER_MILLI, normalVec.vector),
      onCollisionFn: 'test',
      resolve
    }
    if (prediction) {
      underworld.forceMoveProjectilePrediction.push(forceMoveProjectile);
    } else {

      underworld.addForceMoveProjectile(forceMoveProjectile);
    }
  })).then(() => {
    console.log('jtest resolved in projectile')
    if (forceMoveProjectile) {
      forceMoveProjectile.timedOut = true;
    }
    // Clean up the element
    if (projectile.sprite?.parent) {
      projectile.sprite.parent.removeChild(projectile.sprite);
    }
  });
  // const time_in_flight =
  //   distance(instance, instance.endPoint) /
  //   SPEED_PER_MILLI;
  // // + 1000 is an arbitrary delay to give the original promise ample time to finish without a timeout error
  // // being reported
  // return raceTimeout(time_in_flight + 1000, 'createVisualFlyingProjectile', new Promise((resolve) => {
  //   if (globalThis.headless) {
  //     fly(instance, 0, resolve);
  //   } else {
  //     requestAnimationFrame((time) => fly(instance, time, resolve));
  //   }
  // }));
}

export function createVisualLobbingProjectile(
  coords: Vec2,
  target: Vec2,
  imagePath?: string,
  options?: PixiSpriteOptions
): Promise<void> {
  if (!imagePath) {
    return Promise.resolve();
  }
  const instance = createLobbedProjectile(coords, target, imagePath, options);
  // + 1000 is an arbitrary delay to give the original promise ample time to finish without a timeout error
  // being reported
  return raceTimeout(config.LOB_PROJECTILE_SPEED + 1000, 'createVisualLobbingProjectile', new Promise((resolve) => {
    if (globalThis.headless) {
      lob(instance, 0, resolve);
    } else {
      requestAnimationFrame((time) => lob(instance, time, resolve));
    }
  }));
}
// Arbitrary lobHeight (negative so it lobs the projectile UP)
const lobHeight = -100;
// lob a projectile in an arch
function lob(
  instance: LobbedProjectile,
  time: number,
  resolve: (value: void | PromiseLike<void>) => void,
) {
  if (instance.startTime == 0) {
    instance.startTime = time;
    const time_in_flight = config.LOB_PROJECTILE_SPEED;
    instance.endTime = time + time_in_flight;
  }
  if (instance.sprite) {
    instance.sprite.x = instance.x;
    instance.sprite.y = instance.y;
  }
  if (globalThis.headless) {
    // Simulate finishing immediately on headless since there are no visuals:
    // Note: this block must occur AFTER the instance is initialized
    time = instance.endTime;
  }
  const t =
    (time - instance.startTime) / (instance.endTime - instance.startTime);
  instance.x = lerp(instance.startX, instance.target.x, t);
  // y goes from startY to toY but is offset Math.sin(Math.PI/2)*lobHeight in the middle
  const yOffset = Math.sin(t * Math.PI) * lobHeight;
  instance.y = lerp(instance.startY, instance.target.y, t) + yOffset;
  // Once it's fully done animating
  if (time >= instance.endTime) {
    // Clean up the element
    if (instance.sprite?.parent) {
      instance.sprite.parent.removeChild(instance.sprite);
    }
    resolve();
  } else {
    requestAnimationFrame((time) => lob(instance, time, resolve));
  }
}
