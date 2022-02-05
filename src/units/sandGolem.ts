import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import { createVisualLobbingProjectile } from '../Projectile';

const unit: UnitSource = {
  id: 'Sand Golem',
  info: {
    description: 'A sand golem, runs away if you get too close!',
    image: 'units/golem-sand.png',
    subtype: UnitSubType.AI_reach,
    probability: 30,
  },
  unitProps: {
    attackRange: 300
  },
  action: async (unit: Unit.IUnit) => {
    let runFromTarget;
    let targetEnemy;
    for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
      // Will run away if enemy gets too close
      if (math.distance(unit, enemy) < 20) {
        runFromTarget = enemy;
      }
      if (canInteractWithTarget(unit, enemy.x, enemy.y)) {
        targetEnemy = enemy;
        break;
      }
    }
    if (targetEnemy) {
      await createVisualLobbingProjectile(
        unit,
        targetEnemy.x,
        targetEnemy.y,
        'green-thing.png',
      );
      await Unit.takeDamage(targetEnemy, unit.damage);
    } else {
      if (runFromTarget) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, runFromTarget, -unit.moveDistance);
        await Unit.moveTowards(unit, moveTo);
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
  const dist = math.distance(unit, { x, y });
  // Can hit you if you are within attackRange but not 100
  return dist > 100 && dist < unit.attackRange
}
export default unit;
