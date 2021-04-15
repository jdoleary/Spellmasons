import type * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import createVisualProjectile from '../Projectile';
import floatingText from '../FloatingText';

const unit: UnitSource = {
  id: 'Poisoner',
  info: {
    description: 'Poisons enemies',
    image: 'images/units/golem-poison.png',
    subtype: UnitSubType.AI_poisoner,
    probability: 30,
  },
  action: (unit: Unit.IUnit) => {
    const nonPoisonedEnemyUnits = window.game.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    if (nonPoisonedEnemyUnits.length) {
      const chosenUnit = nonPoisonedEnemyUnits[0];
      createVisualProjectile(
        unit,
        chosenUnit.x,
        chosenUnit.y,
        'images/spell/green-thing.png',
      );
      floatingText({
        cellX: chosenUnit.x,
        cellY: chosenUnit.y,
        text: 'TODO poison!',
      });
    }
  },
};
export default unit;
