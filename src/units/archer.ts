import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'Will shoot you with an arrow!',
    image: 'units/golem-blue.png',
    subtype: UnitSubType.AI_bishop,
    probability: 50,
  },
  unitProps: {
    attackRange: 300
  },
  action: async (unit: Unit.IUnit) => {
    // Move opposite to enemy if the enemy is too close
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy && math.distance(unit, closestEnemy) < (unit.attackRange - 10)) {
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.moveDistance);
      await Unit.moveTowards(unit, moveTo);
    }
    // Shoot at enemy
    if (closestEnemy && canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
      await createVisualProjectile(
        unit,
        closestEnemy.x,
        closestEnemy.y,
        'arrow.png',
      );
      await Unit.takeDamage(closestEnemy, unit.damage);
    }
  },
  canInteractWithTarget,
};
function canInteractWithTarget(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  return math.distance(unit, { x, y }) <= unit.attackRange;
}
export default unit;
