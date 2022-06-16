import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';

const CAST_MANA_COST = 30;
const unit: UnitSource = {
  id: 'demon',
  info: {
    description: 'A demon resurrects its allies.',
    image: 'units/demon.png',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  animations: {
    idle: 'units/demon.png',
    hit: 'units/demon.png',
    attack: 'units/demon.png',
    die: 'units/demon.png',
    walk: 'units/demon.png',
  },
  unitProps: {
    manaMax: 60
  },
  spawnParams: {
    probability: 10,
    unavailableUntilLevelIndex: 8,
  },
  extraTooltipInfo: () => {
    return `Mana cost per cast: ${CAST_MANA_COST}`;
  },
  action: async (unit: Unit.IUnit) => {
    // If they have enough mana
    if (unit.mana >= CAST_MANA_COST) {
      unit.mana -= CAST_MANA_COST;

      // Resurrect a dead unit
      const deadAIs = window.underworld.units.filter(
        (u) => u.unitType === UnitType.AI && !u.alive,
      );
      if (deadAIs.length) {
        const deadUnit = deadAIs[0];
        if (deadUnit) {
          await createVisualFlyingProjectile(
            unit,
            deadUnit,
            'green-thing.png',
          ).then(() => {
            Unit.resurrect(deadUnit);
            // Change resurrected unit to own faction
            Unit.changeFaction(deadUnit, unit.faction);
          });
        }
      }
    }
    // Move randomly
    const moveCoords = window.underworld.getRandomCoordsWithinBounds(window.underworld.limits);
    await Unit.moveTowards(unit, moveCoords);
  },
};

export default unit;
