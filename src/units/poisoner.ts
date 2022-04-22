import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import { createVisualFlyingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../math';
import * as poison from '../cards/poison';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'A poisoner will cast a poison curse on it\'s enemies.',
    image: 'units/golem-poison.png',
    subtype: UnitSubType.POISONER,
    probability: 30,
  },
  unitProps: {
    attackRange: 150
  },
  action: async (unit: Unit.IUnit) => {
    const nonPoisonedEnemyUnits = window.underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    if (nonPoisonedEnemyUnits.length) {
      const chosenUnit = nonPoisonedEnemyUnits[0];
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
      await Unit.moveTowards(unit, moveTo);
      if (inRange(unit, chosenUnit)) {
        createVisualFlyingProjectile(
          unit,
          chosenUnit.x,
          chosenUnit.y,
          'green-thing.png',
        );
        Unit.addModifier(chosenUnit, poison.id);
      }
    }
  },
  canInteractWithTarget: (unit, x, y) => {
    return inRange(unit, { x, y });
  },
};
function inRange(unit: Unit.IUnit, coords: Vec2): boolean {
  return math.distance(unit, coords) <= unit.attackRange;
}
export default unit;
