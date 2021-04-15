import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'Priest',
  info: {
    description: 'Heals allies',
    image: 'images/units/priest.png',
    subtype: UnitSubType.AI_priest,
    probability: 30,
  },

  action: (unit: Unit.IUnit) => {
    // Move opposite to closest enemy
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const moveTo = math.oneCellAwayFromCell(unit, closestEnemy);
      unit.intendedNextMove = moveTo;
    }
    // Heal an ally
    const damagedAllys = window.game.units.filter(
      (u) => u.faction === unit.faction && u.alive && u.health < u.healthMax,
    );
    if (damagedAllys.length) {
      const chosenUnit = damagedAllys[0];
      createVisualProjectile(
        unit,
        chosenUnit.x,
        chosenUnit.y,
        'images/spell/green-thing.png',
      );
      // Heal for 2
      Unit.takeDamage(chosenUnit, -2);
    }
  },
};

export default unit;
