import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'Sand Golem',
  info: {
    description: 'A sand golem, runs away if you get too close!',
    image: 'units/golem-sand.png',
    subtype: UnitSubType.AI_reach,
    probability: 30,
  },
  action: (unit: Unit.IUnit) => {
    let runFromTarget;
    let targetEnemy;
    for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
      // Will run away if enemy gets within 1
      if (math.cellDistance(unit, enemy) < 2) {
        runFromTarget = enemy;
      }
      if (canInteractWithCell(unit, enemy.x, enemy.y)) {
        targetEnemy = enemy;
        break;
      }
    }
    if (targetEnemy) {
      createVisualProjectile(
        unit,
        targetEnemy.x,
        targetEnemy.y,
        'green-thing.png',
      );
      Unit.takeDamage(targetEnemy, unit.damage);
    } else {
      if (runFromTarget) {
        const moveTo = math.oneCellAwayFromCell(unit, runFromTarget);
        unit.intendedNextMove = moveTo;
      }
    }
  },
  canInteractWithCell,
};
function canInteractWithCell(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Can hit you if you are 2 away but not 1 away
  const cellDistance = math.cellDistance(unit, { x, y });
  return cellDistance == 2;
}
export default unit;
