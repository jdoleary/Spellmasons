import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import createVisualProjectile from '../Projectile';

const CAST_MANA_COST = 30;
const unit: UnitSource = {
  id: 'demon',
  info: {
    description: 'Raises the dead and teleports!',
    image: 'units/demon.png',
    subtype: UnitSubType.AI_demon,
    probability: 30,
  },
  unitProps: {
    manaMax: 60
  },
  action: async (unit: Unit.IUnit) => {
    if (unit.mana >= CAST_MANA_COST) {
      unit.mana -= CAST_MANA_COST;

      // Resurrect a dead unit
      const deadAIs = window.underworld.units.filter(
        (u) => u.unitType === UnitType.AI && !u.alive,
      );
      if (deadAIs.length) {
        const deadUnit = deadAIs[0];
        await createVisualProjectile(
          unit,
          deadUnit.x,
          deadUnit.y,
          'green-thing.png',
        );
        Unit.resurrect(deadUnit);
        // Change resurrected unit to own faction
        Unit.changeFaction(deadUnit, unit.faction);
      }
    }
    // Move randomly
    const moveCoords = window.underworld.getRandomCoordsWithinBounds({ xMin: 2 });
    await Unit.moveTowards(unit, moveCoords);
  },
};

export default unit;
