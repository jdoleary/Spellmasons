import type { Spell } from '.';
import type * as Pickup from '../Pickup';
import * as Image from '../Image';
import { containerUnits } from '../PixiUtils';

export const id = 'trap';
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: 0,
    expenseScaling: 0,
    probability: 50,
    requiresFollowingCard: true,
    thumbnail: 'trap.png',
    description: `
Sets a spell as a trap, to be triggered when stepped on.
    `,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      // Remove all following cards so that they exist IN the trap:
      const cardsInTrap = state.cardIds.filter(x => x !== id);
      state.cardIds = [];
      if (!prediction) {
        const imagePath = 'pickups/trap.png';
        const x = state.castLocation.x;
        const y = state.castLocation.y;
        const self: Pickup.IPickup = {
          x,
          y,
          name: 'Trap',
          description: `Triggers a spell when stepped on.  This trap contains: ${cardsInTrap.join(', ')}.`,
          imagePath,
          // Pickups are stored in containerUnits so that they
          // will be automatically z-indexed
          image: Image.create({ x, y }, imagePath, containerUnits),
          singleUse: true,
          playerOnly: false,
          effect: ({ unit }) => {
            if (unit) {
              window.underworld.castCards({}, state.casterUnit, cardsInTrap, unit, false);
            } else {
              console.error('Tried to trigger trap, but unit was undefined')
            }
          },
        };

        window.underworld.addPickupToArray(self);
      }
      return state;
    },
  },
};
export default spell;
