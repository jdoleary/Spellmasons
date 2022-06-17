import type { Spell } from '.';
import * as Pickup from '../Pickup';
import * as Image from '../Image';
import { addPixiSprite, containerUnits } from '../PixiUtils';
import * as TimeRelease from '../TimeRelease';

export const id = 'trap';
const manaCostMultiplier = 0.8;
const turnsItTakesTrapToWindUp = 2;
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
Sets a spell as a trap, to be triggered when stepped on.  Wrapping a spell in a trap reduces its mana cost.  The trap will be ready to be sprung after ${turnsItTakesTrapToWindUp} turns.
    `,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      // Remove all following cards so that they exist IN the trap:
      const cardsInTrap = state.cardIds.filter(x => x !== id);
      state.cardIds = [];
      if (!prediction) {
        TimeRelease.create({
          pos: state.castLocation,
          description: 'The trap is winding...',
          imagePath: 'pickups/trapClosed.png', turnsLeft: turnsItTakesTrapToWindUp, onRelease: async () => {
            const x = state.castLocation.x;
            const y = state.castLocation.y;
            const imagePath = 'pickups/trap';
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
                  // Play trap spring animation
                  const animationSprite = addPixiSprite('pickups/trapAttack', containerUnits, {
                    loop: false,
                    onComplete: () => {
                      if (animationSprite.parent) {
                        animationSprite.parent.removeChild(animationSprite);
                      }
                    }
                  });
                  animationSprite.anchor.set(0.5);
                  animationSprite.x = x;
                  animationSprite.y = y;
                  const animationSprite2 = addPixiSprite('pickups/trapAttackMagic', containerUnits, {
                    loop: false,
                    onComplete: () => {
                      animationSprite2.parent.removeChild(animationSprite2);
                    }
                  });
                  animationSprite2.anchor.set(0.5);
                  animationSprite2.x = x;
                  animationSprite2.y = y;

                  window.underworld.castCards({}, state.casterUnit, cardsInTrap, unit, false, true);
                  return true;
                } else {
                  console.error('Tried to trigger trap, but unit was undefined')
                }
              },
            };
            window.underworld.addPickupToArray(self);

          }
        })

      }
      return state;
    },
  },
};
export default spell;
