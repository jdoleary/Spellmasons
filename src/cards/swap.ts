import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as Vec from '../jmath/Vec';
import * as Obstacle from '../entity/Obstacle';
import { CardCategory } from '../types/commonTypes';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';

const id = 'swap';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    sfx: 'swap',
    manaCost: 15,
    healthCost: 0,
    probability: 5,
    expenseScaling: 1,
    thumbnail: 'spellIconSwap.png',
    description: `
Swaps the caster with the source target.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      const { casterUnit, targetedUnits, targetedPickups } = state;
      playDefaultSpellSFX(card, prediction);
      // Loop through all targets and batch swap locations
      const swapUnits: [Unit.IUnit, Vec2][] = [];
      const swapPickups: [Pickup.IPickup, Vec2][] = [];
      const swapLocation = { x: casterUnit.x, y: casterUnit.y };
      // Swap the casterUnit
      const casterSwapTarget = targetedUnits[0] || targetedPickups[0]
      if (casterSwapTarget) {
        swapUnits.push([casterUnit, state.castLocation]);
      }
      const swapLocations = [swapLocation, ...underworld.findValidSpawns(swapLocation, config.COLLISION_MESH_RADIUS / 4, 4)];
      // The units at the target location
      for (let targetUnit of targetedUnits) {
        if (targetUnit) {
          swapUnits.push([targetUnit, swapLocations.shift() || swapLocation]);
        }
      }
      for (let targetPickup of targetedPickups) {
        swapPickups.push([targetPickup, swapLocations.shift() || swapLocation]);

      }

      const temporaryPosition = { x: -1000, y: -1000 };
      // First swap pickups  to a temporary location so that they don't get "picked up" by a unit that
      // hasn't swapped yet
      for (let [pickup, _newLocation] of swapPickups) {
        // Physically swap
        Pickup.setPosition(pickup, temporaryPosition.x, temporaryPosition.y);
      }
      for (let [unit, newLocation] of swapUnits) {
        // Physically swap
        Unit.setLocation(unit, newLocation);
        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(newLocation);
        }

        // Check to see if unit interacts with liquid
        Obstacle.tryFallInOutOfLiquid(unit, underworld, prediction);
      }
      // Now that the units have swapped, put the pickups at their final resting place
      for (let [pickup, newLocation] of swapPickups) {
        // Physically swap
        Pickup.setPosition(pickup, newLocation.x, newLocation.y);
        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(newLocation);
        }
      }
      return state;
    },
  },
};
export default spell;
