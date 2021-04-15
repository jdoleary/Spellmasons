import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'archer',
  info: {
    description: 'Will shoot you with an arrow!',
    image: 'images/units/golem-blue.png',
    subtype: UnitSubType.AI_bishop,
    probability: 50,
  },
  action: (unit: Unit.IUnit) => {
    // Shoot at enemy if in same horizontal, diagonal, or vertical
    let targetEnemy;
    for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
      if (canAttackCell(unit, enemy.x, enemy.y)) {
        targetEnemy = enemy;
        break;
      }
    }
    if (targetEnemy) {
      createVisualProjectile(
        unit,
        targetEnemy.x,
        targetEnemy.y,
        'images/spell/arrow.png',
      );
      Unit.takeDamage(targetEnemy, unit.damage);
    } else {
      // Move opposite to enemy
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
      if (closestEnemy) {
        const moveTo = math.oneCellAwayFromCell(unit, closestEnemy);
        unit.intendedNextMove = moveTo;
      }
    }
  },
};
function canAttackCell(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  const isDiagonal = Math.abs(x - unit.x) === Math.abs(y - unit.y);
  return isDiagonal;
}
export default unit;
