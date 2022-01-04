import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import type { Spell } from '.';
import type { Coords } from '../commonTypes';
import { drawSwapLine } from '../ui/PlanningView';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'swap';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'swap.png',
    probability: 10,
    description: `
Swaps the caster with the source target.
    `,
    manaCost: MANA_BASE_COST * 10,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      const { casterUnit, targets } = state;
      const target = targets[0];
      // Find movement change between caster and original target
      const dx = targets[0].x - casterUnit.x;
      const dy = targets[0].y - casterUnit.y;
      // Loop through all targets and batch swap locations
      const swapUnits: [Unit.IUnit, Coords][] = [];
      const swapPickups: [Pickup.IPickup, Coords][] = [];
      const swapLocation = { x: target.x - dx, y: target.y - dy };
      // The unit at the target location
      const targetUnit = window.underworld.getUnitAt(target);
      if (targetUnit) {
        swapUnits.push([targetUnit, swapLocation]);
      }
      // The pickup at the target location
      const pickupAtTarget = window.underworld.getPickupAt(target);
      // Physically swap with pickups
      if (pickupAtTarget) {
        swapPickups.push([pickupAtTarget, swapLocation]);
      }
      // If there is no overlap between the swaplocation and the targets
      if (
        !targets.find((t) => t.x === swapLocation.x && t.y === swapLocation.y)
      ) {
        // The unit at the location that the targetUnit will swap to
        const swapUnit = window.underworld.getUnitAt(swapLocation);
        if (swapUnit) {
          swapUnits.push([swapUnit, target]);
        }
        // The pickup at the swap location
        const pickupAtSwap = window.underworld.getPickupAt(swapLocation);

        if (pickupAtSwap) {
          swapPickups.push([pickupAtSwap, target]);
        }
      }
      for (let [pickup, newLocation] of swapPickups) {
        if (dryRun) {
          drawSwapLine(pickup, newLocation);
        } else {
          // Physically swap
          Pickup.setPosition(pickup, newLocation.x, newLocation.y);
        }
      }
      for (let [unit, newLocation] of swapUnits) {
        if (dryRun) {
          drawSwapLine(unit, newLocation);
        } else {
          // Physically swap
          Unit.setLocation(unit, newLocation);
        }
      }
      return state;
    },
  },
};
export default spell;
