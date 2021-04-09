import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import type { Spell } from '.';
import { drawSwapLine } from '../ui/GameBoardInput';

const id = 'swap';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/swap.png',
    probability: 10,
    effect: async (state, dryRun) => {
      const { caster, targets } = state;
      // Find movement change between caster and original target
      const dx = targets[0].x - caster.unit.x;
      const dy = targets[0].y - caster.unit.y;
      if (targets.length) {
        // Loop through all targets and batch swap locations
        const swapUnits = [];
        const swapPickups = [];
        for (let target of targets) {
          const swapLocation = { x: target.x - dx, y: target.y - dy };
          // You cannot swap with a statically blocked cell
          if (
            window.game.isCellStaticallyBlocked(swapLocation) ||
            window.game.isCellStaticallyBlocked(target)
          ) {
            continue;
          }
          // The unit at the target location
          const targetUnit = window.game.getUnitAt(target.x, target.y);
          if (targetUnit) {
            swapUnits.push([targetUnit, swapLocation]);
          }
          // The pickup at the target location
          const pickupAtTarget = window.game.getPickupAt(target.x, target.y);
          // Physically swap with pickups
          if (pickupAtTarget) {
            swapPickups.push([pickupAtTarget, swapLocation]);
          }
          // If there is no overlap between the swaplocation and the targets
          if (
            !targets.find(
              (t) => t.x === swapLocation.x && t.y === swapLocation.y,
            )
          ) {
            // The unit at the location that the targetUnit will swap to
            const swapUnit = window.game.getUnitAt(
              swapLocation.x,
              swapLocation.y,
            );
            if (swapUnit) {
              swapUnits.push([swapUnit, target]);
            }
            // The pickup at the swap location
            const pickupAtSwap = window.game.getPickupAt(
              swapLocation.x,
              swapLocation.y,
            );

            if (pickupAtSwap) {
              swapPickups.push([pickupAtSwap, target]);
            }
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
        for (let [pickup, newLocation] of swapPickups) {
          if (dryRun) {
            drawSwapLine(pickup, newLocation);
          } else {
            // Physically swap
            Pickup.setPosition(pickup, newLocation.x, newLocation.y);
          }
        }
      }
      return state;
    },
  },
};
export default spell;
