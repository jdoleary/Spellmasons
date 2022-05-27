import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../math';
import * as poison from '../cards/poison';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'A poisoner will cast a poison curse on it\'s enemies.',
    image: 'units/golem-poison.png',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 300
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
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
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit)) {
          createVisualLobbingProjectile(
            unit,
            chosenUnit,
            'green-thing.png',
          );
          Unit.addModifier(chosenUnit, poison.id);
        }
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
        await Unit.moveTowards(unit, moveTo);
      }
    }
  },
};
export default unit;
