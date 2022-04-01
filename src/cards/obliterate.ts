import * as Unit from '../Unit';
import { Spell, targetsToUnits } from '.';
import { removePickup } from '../Pickup';
import { remove } from '../Obstacle';
import { UnitType } from '../commonTypes';

const id = 'obliterate';
const spell: Spell = {
  card: {
    id,
    manaCost: 80,
    healthCost: 0,
    probability: 1,
    thumbnail: 'obliterate.png',
    description: `
Completely obliterates all targets.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of targetsToUnits(state.targets)) {
        Unit.die(unit);
        if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
          // Image.setPosition(unit.image, -10000, -10000);
          Unit.setLocation(unit, { x: NaN, y: NaN });
        } else {
          Unit.cleanup(unit);
        }
      }
      for (let target of state.targets) {
        const pickup = window.underworld.getPickupAt(target);
        if (pickup) {
          // TODO don't remove portal, or go to game over if the portal is destroyed because then the players are stuck
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
