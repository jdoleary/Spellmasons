import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import type { Spell } from '.';
import type { Vec2 } from '../Vec';
import * as config from '../config';

const id = 'swap';
const spell: Spell = {
  card: {
    id,
    manaCost: 50,
    healthCost: 0,
    probability: 5,
    expenseScaling: 1,
    thumbnail: 'swap.png',
    description: `
Swaps the caster with the source target.
    `,
    effect: async (state, dryRun) => {
      const { casterUnit, targetedUnits } = state;
      // Loop through all targets and batch swap locations
      const swapUnits: [Unit.IUnit, Vec2][] = [];
      const swapPickups: [Pickup.IPickup, Vec2][] = [];
      const swapLocation = { x: casterUnit.x, y: casterUnit.y };
      // The unit at the location that the targetUnit will swap to
      const swapUnit = window.underworld.getUnitAt(swapLocation);
      if (swapUnit && targetedUnits[0]) {
        swapUnits.push([swapUnit, targetedUnits[0]]);
      }
      const swapLocations = [swapLocation, ...window.underworld.findValidSpawns(swapLocation, config.COLLISION_MESH_RADIUS / 4, 4)];
      // The units at the target location
      for (let targetUnit of targetedUnits) {
        if (targetUnit) {
          swapUnits.push([targetUnit, swapLocations.shift() || swapLocation]);
        }
        // The pickup at the target location
        const pickupAtTarget = window.underworld.getPickupAt(state.castLocation);
        // Physically swap with pickups
        if (pickupAtTarget) {
          swapPickups.push([pickupAtTarget, swapLocation]);
        }
        // The pickup at the swap location
        const pickupAtSwap = window.underworld.getPickupAt(swapLocation);

        if (pickupAtSwap) {
          swapPickups.push([pickupAtSwap, targetUnit]);
        }
      }
      // Don't swap if there is nothing to swap with
      // comparing to <=1 because the caster will always
      // be added to swapUnits
      if (swapPickups.length + swapUnits.length <= 1) {
        return state;
      }
      for (let [pickup, newLocation] of swapPickups) {
        if (!dryRun) {
          // Physically swap
          Pickup.setPosition(pickup, newLocation.x, newLocation.y);
        }
      }
      for (let [unit, newLocation] of swapUnits) {
        if (!dryRun) {
          // Physically swap
          Unit.setLocation(unit, newLocation);
        }
      }
      return state;
    },
  },
};
export default spell;
