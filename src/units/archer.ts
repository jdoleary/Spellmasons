import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as math from '../math';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'An archer will try to get close enough to shoot you but not much closer.  It can only shoot you if there aren\'t any walls between you both.',
    image: 'units/archerIdle',
    subtype: UnitSubType.RANGED_LOS,
  },
  unitProps: {
    attackRange: 10000,
    manaMax: 0,
  },
  spawnParams: {
    probability: 50,
    unavailableUntilLevelIndex: 1,
  },
  animations: {
    idle: 'units/archerIdle',
    hit: 'units/archerHit',
    attack: 'units/archerAttack',
    die: 'units/archerDeath',
    walk: 'units/archerWalk',
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, _canAttackTarget: boolean) => {
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    let movePromise;
    let attackPromise;
    // Attack
    if (attackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      await Unit.playAnimation(unit, unit.animations.attack);
      attackPromise = createVisualFlyingProjectile(
        unit,
        attackTarget,
        'arrow.png',
      ).then(() => {
        Unit.takeDamage(attackTarget, unit.damage, false, undefined);
      })
    } else {
      // Movement:
      if (closestEnemy) {
        if (window.underworld.hasLineOfSight(unit, closestEnemy)) {
          const distanceToEnemy = math.distance(unit, closestEnemy);
          const moveDistance = distanceToEnemy < unit.attackRange
            ? -unit.stamina // flee as far as it can
            : Math.min(unit.stamina, distanceToEnemy - unit.attackRange) // move in range but no farther
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, moveDistance);
          movePromise = Unit.moveTowards(unit, moveTo);
        } else {
          // If they don't have line of sight, move closer
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, unit.stamina);
          movePromise = Unit.moveTowards(unit, moveTo);
        }
      }
    }
    // Move and attack at the same time, but wait for the slowest to finish before moving on
    await Promise.all([attackPromise, movePromise])
  },
};
export default unit;
