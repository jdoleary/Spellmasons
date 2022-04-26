import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../math';

const unit: UnitSource = {
  id: 'lobber',
  info: {
    description: 'This ranged creature will throw magic high up in the air - over walls - to deal damage to it\'s enemies.',
    image: 'units/golem-sand.png',
    subtype: UnitSubType.RANGED_RADIUS,
    probability: 30,
  },
  unitProps: {
    attackRange: 300
  },
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean) => {
    // Attack
    let attackPromise;
    if (attackTarget && canAttackTarget) {
      attackPromise = createVisualLobbingProjectile(
        unit,
        attackTarget,
        'green-thing.png',
      ).then(() => {
        if (attackTarget) {
          Unit.takeDamage(attackTarget, unit.damage, false, undefined);
        }
      });
    }
    // Movement:
    let movePromise;
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const distanceToEnemy = math.distance(unit, closestEnemy);
      // Trick to make the unit only move as far as will put them in range but no closer
      unit.stamina = distanceToEnemy - unit.attackRange;
      movePromise = Unit.moveTowards(unit, closestEnemy);
    }
    // Move and attack at the same time, but wait for the slowest to finish before moving on
    await Promise.all([attackPromise, movePromise])


  },
};

export default unit;
