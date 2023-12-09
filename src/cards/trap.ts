import { Spell } from './index';
import * as Pickup from '../entity/Pickup';
import { CardCategory } from '../types/commonTypes';

export const id = 'Trap';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 0,
    probability: 50,
    thumbnail: 'spellIconDelay.png',
    description: `
Sets a trap that does ${Pickup.spike_damage} damage.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const pickupSource = Pickup.pickups.find(
        (p) => p.name == Pickup.PICKUP_SPIKES_NAME,
      );
      if (pickupSource) {
        const pickupInst = Pickup.create(
          {
            pos: state.castLocation,
            pickupSource,
            logSource: 'trap.ts',
          },
          underworld,
          prediction,
        );
      }
      return state;
    },
  },
};
export default spell;
