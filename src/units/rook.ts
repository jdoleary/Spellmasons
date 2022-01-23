import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'rook',
  info: {
    description: 'Can slliiiiiiiiiiide',
    image: 'units/golem-red.png',
    subtype: UnitSubType.AI_rook,
    probability: 10,
  },
  unitProps: {},
  action: async (unit: Unit.IUnit) => {
    // Shoot at enemy if in same horizontal, diagonal, or vertical
    let targetEnemy;
    for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
      if (canInteractWithTarget(unit, enemy.x, enemy.y)) {
        targetEnemy = enemy;
        break;
      }
    }
    if (targetEnemy) {
      await createVisualProjectile(
        unit,
        targetEnemy.x,
        targetEnemy.y,
        'arrow.png',
      );
      await Unit.takeDamage(targetEnemy, unit.damage);
    } else {
      // Move opposite to enemy
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
      if (closestEnemy) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.moveDistance);
        unit.intendedNextMove = moveTo;
      }
    }
  },
  canInteractWithTarget,
};
function canInteractWithTarget(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  const isOnSameHorizontal = x === unit.x;
  const isOnSameVertical = y === unit.y;
  return isOnSameHorizontal || isOnSameVertical;
}
export default unit;
