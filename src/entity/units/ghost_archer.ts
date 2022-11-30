import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../Projectile';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as math from '../../jmath/math';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';
import { getBestRangedLOSTarget } from './actions/rangedAction';
import { findWherePointIntersectLineSegmentAtRightAngle } from '../../jmath/lineSegment';
import * as config from '../../config';

const NUMBER_OF_UNITS_GHOST_ARCHER_CAN_ATTACK = 1;
export const GHOST_ARCHER_ID = 'Ghost Archer';
const unit: UnitSource = {
  id: GHOST_ARCHER_ID,
  info: {
    description: `The Ghost Archer\'s arrows pierce units, dealing 1/2 damage to them, on it\'s way to it\'s target. `,
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 600,
    manaMax: 0,
    damage: 6,
    healthMax: 8,
    bloodColor: 0x324860
  },
  spawnParams: {
    probability: 50,
    unavailableUntilLevelIndex: 10,
  },
  animations: {
    idle: 'units/archerIdle',
    hit: 'units/archerHit',
    attack: 'units/archerAttack',
    die: 'units/archerDeath',
    walk: 'units/archerWalk',
  },
  sfx: {
    damage: 'archerHurt',
    death: 'archerDeath',
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      // Ghost unit is slightly transparent
      unit.image.sprite.alpha = 0.8;
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [0x866262, 0x569769], //skinLight
            [0x7c5353, 0x4d865e], //skinMedium
            [0x603232, 0x376144], //skinDark
            [0x838d9f, 0x141c17], //loin cloth
            [0x3fc7c2, 0x141c17], // feathers 
          ],
          0.05
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    // Archer just checks attackTarget, not canAttackTarget to know if it can attack because getBestRangedLOSTarget() will return undefined
    // if it can't attack any targets
    // Attack
    if (attackTargets && attackTargets[0]) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTargets[0]);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        let flyingProjectilePromise = Promise.resolve();
        for (let target of attackTargets) {
          // Get all units between source and target for the arrow to pierce:
          underworld.units.filter(
            (u) => {
              const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, { p1: unit, p2: target });
              const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= config.COLLISION_MESH_RADIUS * 2
              // Note: Filter out target as target will take full damage
              // Note: Filter out self as the ghost archer's arrow shouldn't damage itself
              return u.alive && willBeStruckByArrow && u !== target && u !== unit;
            },
          ).forEach(pierceTarget => {
            // Fake the collision by just calculating a delay based on the speed of the projectile
            const millisecondsUntilCollision = math.distance(unit, pierceTarget) / SPEED_PER_MILLI
            setTimeout(() => {
              Unit.takeDamage(pierceTarget, unit.damage / 2, unit, underworld, false, undefined, { thinBloodLine: true });
            }, millisecondsUntilCollision);
          });


          flyingProjectilePromise = createVisualFlyingProjectile(
            unit,
            target,
            'projectile/arrow',
          ).then(() => {
            Unit.takeDamage(target, unit.damage, unit, underworld, false, undefined, { thinBloodLine: true });
          });
        }
        return flyingProjectilePromise;
      });
    } else {
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
      // Movement:
      // Intelligently move the archer to a position where it can see the enemy
      if (closestEnemy) {
        const moveOptions = Unit.findLOSLocation(unit, closestEnemy, underworld);
        const moveChoice = moveOptions.reduce<{ dist: number, pos: Vec2 | undefined }>((closest, cur) => {
          const dist = math.distance(cur, unit);
          if (dist < closest.dist) {
            return { dist, pos: cur }
          } else {
            return closest
          }
        }, { dist: Number.MAX_SAFE_INTEGER, pos: undefined })

        if (moveChoice.pos) {
          await Unit.moveTowards(unit, moveChoice.pos, underworld);
        } else {
          // Move closer
          await Unit.moveTowards(unit, closestEnemy, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return getBestRangedLOSTarget(unit, underworld).slice(0, NUMBER_OF_UNITS_GHOST_ARCHER_CAN_ATTACK);
  }
};
export default unit;
