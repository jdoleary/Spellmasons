import * as Unit from '../Unit';
import type { Spell } from '.';
import { removePickup } from '../Pickup';
import { remove } from '../Obstacle';
import { UnitType } from '../commonTypes';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'obliterate';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'obliterate.png',
    probability: 5,
    description: `
Completely obliterates all targets.
    `,
    manaCost: MANA_BASE_COST * 40,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          Unit.die(unit);
          if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
            // Image.setPosition(unit.image, -10000, -10000);
            Unit.setLocation(unit, { x: NaN, y: NaN });
          } else {
            Unit.cleanup(unit);
          }
        }
        const pickup = window.underworld.getPickupAt(target);
        if (pickup) {
          // TODO don't remove portal
          removePickup(pickup);
        }
        const obstacle = window.underworld.getObstacleAt(target);
        if (obstacle) {
          remove(obstacle);
        }
      }
      return state;
    },
  },
};
export default spell;
