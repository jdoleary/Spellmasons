import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { Vec2, UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const range = 3;
const unit: UnitSource = {
  id: 'Priest',
  info: {
    description: 'Heals allies',
    image: 'units/priest.png',
    subtype: UnitSubType.AI_priest,
    probability: 30,
  },
  unitProps: {},
  action: async (unit: Unit.IUnit) => {
    // Move to closest ally
    const closestAlly = Unit.findClosestUnitInSameFaction(unit);
    if (closestAlly) {
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestAlly, unit.moveDistance);
      unit.intendedNextMove = moveTo;
    } else {
      // flee from closest enemey
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
      if (closestEnemy) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.moveDistance);
        unit.intendedNextMove = moveTo;
      }
    }
    // Heal an ally
    const damagedAllys = window.underworld.units.filter(
      (u) => u.faction === unit.faction && u.alive && u.health < u.healthMax,
    );
    if (damagedAllys.length) {
      for (let ally of damagedAllys) {
        if (inRange(unit, ally)) {
          const chosenUnit = damagedAllys[0];
          await createVisualProjectile(
            unit,
            chosenUnit.x,
            chosenUnit.y,
            'green-thing.png',
          );
          // Heal for 2
          await Unit.takeDamage(chosenUnit, -2);
          break;
        }
      }
    }
  },
  canInteractWithTarget: (unit, x, y) => {
    return inRange(unit, { x, y });
  },
};
function inRange(unit: Unit.IUnit, coords: Vec2): boolean {
  return math.distance(unit, coords) <= range;
}

export default unit;
