import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../Projectile';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as math from '../../jmath/math';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';
import { getBestRangedLOSTarget, rangedLOSMovement } from './actions/rangedAction';
import { findWherePointIntersectLineSegmentAtRightAngle } from '../../jmath/lineSegment';
import * as config from '../../config';

const NUMBER_OF_UNITS_GHOST_ARCHER_CAN_ATTACK = 1;
export const GHOST_ARCHER_ID = 'Ghost Archer';
const unit: UnitSource = {
  id: GHOST_ARCHER_ID,
  info: {
    description: 'ghost_archer_copy',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    damage: 40,
    attackRange: 600,
    healthMax: 80,
    manaMax: 0,
    bloodColor: 0x324860,
  },
  spawnParams: {
    probability: 50,
    budgetCost: 7,
    unavailableUntilLevelIndex: 7,
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
      unit.image.sprite.filters.unshift(
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
    const firstTarget = attackTargets && attackTargets[0]
    if (firstTarget) {
      Unit.orient(unit, firstTarget);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        let flyingProjectilePromises = [];
        // Get all units between source and target for the arrow to pierce:
        // .slice(1) selects all but the first target which is the destination which takes full
        // damage, not piercing damage

        attackTargets.slice(1).forEach(pierceTarget => {
          // Fake the collision by just calculating a delay based on the speed of the projectile
          const millisecondsUntilCollision = math.distance(unit, pierceTarget) / SPEED_PER_MILLI
          flyingProjectilePromises.push(new Promise<void>((resolve) => {

            setTimeout(() => {
              Unit.takeDamage({
                unit: pierceTarget,
                amount: unit.damage / 2,
                sourceUnit: unit,
                fromVec2: unit,
                thinBloodLine: true
              }, underworld, false);
              resolve();
            }, millisecondsUntilCollision);
          }));
        });


        flyingProjectilePromises.push(createVisualFlyingProjectile(
          unit,
          firstTarget,
          'projectile/arrow_ghost',
        ).then(() => {
          Unit.takeDamage({
            unit: firstTarget,
            amount: unit.damage,
            sourceUnit: unit,
            fromVec2: unit,
            thinBloodLine: true
          }, underworld, false);
        }));
        return Promise.all(flyingProjectilePromises);
      });
    } else {
      // If it gets to this block it means it is either out of range or cannot see enemy
      await rangedLOSMovement(unit, underworld);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const potentialTargets = getBestRangedLOSTarget(unit, underworld, false).slice(0, NUMBER_OF_UNITS_GHOST_ARCHER_CAN_ATTACK);
    if (potentialTargets && potentialTargets.length) {
      for (let target of potentialTargets) {
        // Add the pierce targets to the list of attack targets so they will show attentionMarkers
        const allTargets = [target, ...getGhostArcherHits(unit, target, underworld)]
        if (allTargets.some(t => t.unitType == UnitType.PLAYER_CONTROLLED && t.faction == unit.faction)) {
          // Do not fire an arrow if it will hit an ally player
          continue;
        } else {
          return allTargets;
        }
      }
      return [];
    } else {
      return [];
    }
  }
};
export default unit;

// Returns the units that will be hit when ghost archer fires it's piercing arrow
function getGhostArcherHits(archer: Vec2, target: Vec2, underworld: Underworld): Unit.IUnit[] {
  const arrowCollisionWidth = 25;
  return underworld.units.filter(
    (u) => {
      const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, { p1: archer, p2: target });
      const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= arrowCollisionWidth
      // Note: Filter out target as target will take full damage
      // Note: Filter out self as the ghost archer's arrow shouldn't damage itself
      return u.alive && willBeStruckByArrow && u !== target && u !== archer;
    },
  );

}