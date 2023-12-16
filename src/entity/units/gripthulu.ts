import type * as PIXI from 'pixi.js';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { bloodGripthulu } from '../../graphics/ui/colors';
import type Underworld from '../../Underworld';
import { pull } from '../../cards/pull';
import { containerProjectiles } from '../../graphics/PixiUtils';
import { getAngleBetweenVec2s, Vec2 } from '../../jmath/Vec';

export const gripthulu_id = 'gripthulu';
const unit: UnitSource = {
  id: gripthulu_id,
  info: {
    description: 'gripthulu copy',
    image: 'units/poisIdle',
    subtype: UnitSubType.SPECIAL_LOS,
  },
  unitProps: {
    attackRange: 500,
    mana: 30,
    manaMax: 30,
    manaPerTurn: 10,
    manaCostToCast: 20,
    bloodColor: bloodGripthulu,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 4,
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
        new MultiColorReplaceFilter(
          [
            [0x859784, 0x6e868a], // cloak top
            [0x728771, 0x5f7377], // cloak medium
            [0x60775f, 0x516468], //cloak dark
            [0x86eb83, 0x84d5ec], // light arm
            [0x74b675, 0x7faaba], // dark arm
            [0x93cf92, 0x90c7cf], //head
            [0x8fce8e, 0x79b1b9], //head darker slightly
            [0x374937, 0x374849],//pants
          ],
          0.05
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld) => {
    if (attackTargets.length) {
      const chosenUnit = attackTargets[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit) && unit.mana >= unit.manaCostToCast) {
          unit.mana - unit.manaCostToCast;
          // Poisoners attack or move, not both; so clear their existing path
          unit.path = undefined;
          // await Unit.playAnimation(unit, unit.animations.attack);
          await Unit.playComboAnimation(unit, unit.animations.attack, () => {
            return animateDrag(unit, chosenUnit);
          });
          const pullPromise = pull(chosenUnit, unit, 1, underworld, false);
          underworld.triggerGameLoopHeadless();
          await pullPromise;
        } else {
          // Only move if not in range
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
          await Unit.moveTowards(unit, moveTo, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const livingEnemyUnits = underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive
    );
    // Gripthulu can only target one enemy
    return livingEnemyUnits.slice(0, 1);
  }
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

  const strip = new globalThis.pixi.SimpleRope(globalThis.pixi.Texture.from('gripthuluMagic.png'), points);

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
