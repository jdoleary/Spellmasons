import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import createVisualProjectile from '../Projectile';

const unit: UnitSource = {
  id: 'demon',
  info: {
    description: 'Raises the dead and teleports!',
    image: 'units/demon.png',
    subtype: UnitSubType.AI_demon,
    probability: 30,
  },
  action: async (unit: Unit.IUnit) => {
    // Resurrect a dead unit
    const deadAIs = window.game.units.filter(
      (u) => u.unitType === UnitType.AI && !u.alive,
    );
    if (deadAIs.length) {
      const deadUnit = deadAIs[0];
      createVisualProjectile(unit, deadUnit.x, deadUnit.y, 'green-thing.png');
      Unit.resurrect(deadUnit);
      // Change resurrected unit to own faction
      Unit.changeFaction(deadUnit, unit.faction);
    }
    // Move randomly
    const moveCoords = window.game.getRandomEmptyCell({ xMin: 2 });
    if (moveCoords) {
      unit.intendedNextMove = moveCoords;
    }
  },
};

export default unit;
