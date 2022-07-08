import type { Spell } from '.';
import * as Pickup from '../Pickup';
import * as Image from '../graphics/Image';
import { addPixiSpriteAnimated, containerUnits } from '../graphics/PixiUtils';

export const id = 'Delay';
const turnsItTakesTrapToWindUp = 2;
// Register as pickup:
Pickup.pickups.push(
  {
    imagePath: 'pickups/trapClosed',
    animationSpeed: 0,
    playerOnly: true,
    singleUse: false,
    name: id,
    // Traps are cast by wizards and do not spawn automatically so they must have a probability of 0
    // so they do not spawn
    probability: 0,
    scale: 1,
    // To be filled when cast
    description: '',
    turnsLeftToGrab: turnsItTakesTrapToWindUp,
    effect: () => false,
  },
);
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
Sets a spell as a trap, to be triggered when stepped on.  Wrapping a spell in a trap reduces its mana cost.  The trap will be ready to be sprung after ${turnsItTakesTrapToWindUp} turns.
    `,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      // Remove all following cards so that they exist IN the trap:
      const cardsInTrap = state.cardIds.filter(x => x !== id);
      state.cardIds = [];
      if (!prediction) {
        const trapPickupSource = Pickup.pickups.find(p => p.name == id);
        if (trapPickupSource) {
          const pickup = Pickup.create({
            pos: state.castLocation,
            pickupSource: trapPickupSource,
            onTurnsLeftDone: async (closedTrap: Pickup.IPickup) => {
              // Trap may have moved since it was cast so use the actual closedTrap pickup
              // to spawn the new one in its current location
              const x = closedTrap.x;
              const y = closedTrap.y;
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
                    const animationSprite = addPixiSpriteAnimated('pickups/trapAttack', containerUnits, {
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
                    const animationSprite2 = addPixiSpriteAnimated('pickups/trapAttackMagic', containerUnits, {
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
                    return false;
                  }
                },
              };
              window.underworld.addPickupToArray(self, prediction);

            }
          });
          pickup.description = 'The trap is winding...';
        } else {
          console.error(`Could not find pickup ${id} in pickups`);
        }
      }
      return state;
    },
  },
};
export default spell;
