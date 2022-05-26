import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import { createVisualFlyingProjectile } from '../Projectile';
import * as config from '../config';

const CAST_MANA_COST = 100;
const unit: UnitSource = {
  id: 'Night Queen',
  info: {
    description: 'The Night Queen resurrects all of her allies when she has full mana and can attack multiple enemies at once.',
    image: 'units/nightqueen.png',
    subtype: UnitSubType.RANGED_RADIUS,
    probability: 0,
  },
  unitProps: {
    manaMax: 100,
    healthMax: 50,
  },
  extraTooltipInfo: () => {
    return `Mana cost per cast: ${CAST_MANA_COST}`;
  },
  init: (unit) => {
    if (unit.image) {
      unit.image.sprite.scale.x = 4;
      unit.image.sprite.scale.y = 4;
    }
  },
  action: async (unit: Unit.IUnit) => {
    // If they have enough mana
    if (unit.mana >= CAST_MANA_COST) {
      unit.mana -= CAST_MANA_COST;

      // Resurrect all dead and turns them to her faction 
      await Promise.all([window.underworld.units.filter(
        (u) => u.unitType === UnitType.AI && !u.alive,
      ).map(deadUnit => {
        if (deadUnit) {
          return createVisualFlyingProjectile(
            unit,
            deadUnit,
            'holy-projectile.png',
          ).then(() => {
            Unit.resurrect(deadUnit);
            // Change resurrected unit to own faction
            Unit.changeFaction(deadUnit, unit.faction);
          });
        }
      })]);
    }
    // Move randomly
    const moveCoords = window.underworld.getRandomCoordsWithinBounds(window.underworld.limits);
    await Unit.moveTowards(unit, moveCoords);
  },
};

export default unit;
