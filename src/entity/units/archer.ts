import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import { Vec2 } from '../../jmath/Vec';
import Underworld from '../../Underworld';
import { getBestRangedLOSTarget } from './actions/rangedAction';
import * as config from '../../config';

export const ARCHER_ID = 'archer';
const unit: UnitSource = {
  id: ARCHER_ID,
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 500,
    manaMax: 0,
    damage: 1,
    healthMax: 4,
  },
  spawnParams: {
    probability: 50,
    unavailableUntilLevelIndex: 3,
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
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, _canAttackTarget: boolean) => {
    // Archer just checks attackTarget, not canAttackTarget to know if it can attack because getBestRangedLOSTarget() will return undefined
    // if it can't attack any targets
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      await Unit.playComboAnimation(unit, unit.animations.attack, () => {
        return createVisualFlyingProjectile(
          unit,
          attackTarget,
          'projectile/arrow',
        ).then(() => {
          Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined, { thinBloodLine: true });
        })

      });
    } else {
      // Movement:
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
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
          // Move to sight lines
          await Unit.moveTowards(unit, moveChoice.pos, underworld);
          // Move closer
          // The following is a hacky way to make them move in range, but not too close, to the enemy
          const distanceToEnemy = math.distance(unit, closestEnemy);
          unit.stamina = Math.min(unit.stamina, distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange);
          await Unit.moveTowards(unit, closestEnemy, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return getBestRangedLOSTarget(unit, underworld);
  }
};
export default unit;
