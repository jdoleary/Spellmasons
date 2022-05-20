import type { Spell } from '.';
import * as Pickup from '../Pickup';
import * as Image from '../Image';
import { containerUnits } from '../PixiUtils';

export const id = 'trap';
const manaCostMultiplier = 0.8;
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    manaCostMultiplier,
    healthCost: 0,
    expenseScaling: 0,
    probability: 50,
    requiresFollowingCard: true,
    thumbnail: 'trap.png',
    description: `
Sets a spell as a trap, to be triggered when stepped on.  Wrapping a spell in a trap reduces its mana cost.
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
          radius: Pickup.PICKUP_RADIUS,
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
              window.underworld.castCards({}, state.casterUnit, cardsInTrap, unit, false, true);
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
