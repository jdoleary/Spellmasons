import * as Unit from '../Unit';
import type { Spell } from '.';
import { removePickup } from '../Pickup';
import { remove } from '../Obstacle';

const id = 'obliterate';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'obliterate.png',
    probability: 5,
    description: `
Completely obliterates all targets.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target);
        if (unit) {
          unit.alive = false;
          Unit.cleanup(unit);
        }
        const pickup = window.game.getPickupAt(target);
        if (pickup) {
          // TODO don't remove portal
          removePickup(pickup);
        }
        const obstacle = window.game.getObstacleAt(target);
        if (obstacle) {
          remove(obstacle);
        }
      }
      return state;
    },
  },
};
export default spell;
