import type * as PIXI from 'pixi.js';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { bloodDragger } from '../../graphics/ui/colors';
import type Underworld from '../../Underworld';
import { pull } from '../../cards/pull';
import { containerProjectiles } from '../../graphics/PixiUtils';
import { getAngleBetweenVec2s, Vec2 } from '../../jmath/Vec';

const manaCostToCast = 15;
const unit: UnitSource = {
  id: 'dragger',
  info: {
    description: 'A dragger will pull you into danger if it gets close enough to do so',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 420,
    bloodColor: bloodDragger,
    manaCostToCast
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
  },
  animations: {
    idle: 'units/poisIdle',
    hit: 'units/poisHit',
    attack: 'units/poisAttack',
    die: 'units/poisDeath',
    walk: 'units/poisWalk',
  },
  sfx: {
    damage: 'poisonerHurt',
    death: 'poisonerDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        // @ts-ignore for some reason ts is flagging this as an error but it works fine
        // in pixi.
        new MultiColorReplaceFilter(
          [
            [0x93d491, 0x91c7d4], // skinMedium
            [0x86eb83, 0x83d7eb], //skinLight
            [0x77f773, 0x83d7eb], //skinVeryLight
            [0x74b675, 0x74a7b6], // skinDark
            [0x60775f, 0x5f7377], // clothesDark
            [0x60775f, 0x849497], // clothesLight
          ],
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld) => {
    const livingEnemyUnits = underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive
    );
    if (livingEnemyUnits.length) {
      const chosenUnit = livingEnemyUnits[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit) && unit.mana >= unit.manaCostToCast) {
          unit.mana - unit.manaCostToCast;
          // Poisoners attack or move, not both; so clear their existing path
          unit.path = undefined;
          await Unit.playAnimation(unit, unit.animations.attack);
          await animateDrag(unit, chosenUnit);
          await pull(chosenUnit, unit, 1, underworld, false);
        } else {
          // Only move if not in range
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
          await Unit.moveTowards(unit, moveTo, underworld);
        }
      }
    }
  },
};
const forwardSpeed = 0.2;
const backwardSpeed = 0.5;
export async function animateDrag(start: Vec2, end: Vec2) {
  if (!globalThis.pixi) {
    return;
  }
  let count = 0;

  const NUM_OF_POINTS = 20;
  const ropeLength = math.distance(start, end) / NUM_OF_POINTS;

  const points: PIXI.Point[] = [];

  for (let i = 0; i < NUM_OF_POINTS; i++) {
    points.push(new globalThis.pixi.Point(0, 0));
  }

  const strip = new globalThis.pixi.SimpleRope(globalThis.pixi.Texture.from('draggerMagic.png'), points);

  strip.x = start.x;
  strip.y = start.y;
  // Make strip grow towards target
  strip.rotation = getAngleBetweenVec2s(start, end);

  containerProjectiles?.addChild(strip);
  return new Promise<void>((resolve) => {
    // start animating
    requestAnimationFrame(animate);
    const waveHeight = 10;
    const endCount = 10;
    let retracting = false;

    function animate() {
      if (retracting) {
        count -= backwardSpeed;
      } else {
        count += forwardSpeed;
      }
      if (count >= endCount) {
        resolve();
        retracting = true;
      }
      const animatedLength = math.lerp(0, ropeLength, count / endCount);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point) {
          point.y = Math.sin((i * 0.5) + count) * waveHeight * i / 8;
          point.x = i * animatedLength;
          // Pull target back with last point
          // if (retracting) {
          //   const isLastPoint = i == points.length - 1;
          //   if (isLastPoint) {
          //     end.x = point.x;
          //     end.y = point.y;
          //   }
          // }
        }
      }

      if (retracting && count <= 0) {
        // clean up
        containerProjectiles?.removeChild(strip);

      } else {
        // keep animating
        requestAnimationFrame(animate);
      }
    }
  });
}
export default unit;
