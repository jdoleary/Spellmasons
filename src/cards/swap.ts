import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import type { Spell } from '.';
import { drawSwapLine } from '../ui/GameBoardInput';

const spell: Spell = {
  card: {
    id: 'swap',
    thumbnail: 'images/spell/swap.png',
    probability: 10,
    effect: (state, dryRun) => {
      const { caster, targets } = state;
      // Find movement change between caster and original target
      const dx = targets[0].x - caster.unit.x;
      const dy = targets[0].y - caster.unit.y;
      if (targets.length) {
        // Loop through all targets and swap if possible
        for (let target of targets) {
          const swapLocation = { x: target.x - dx, y: target.y - dy };
          // You cannot swap with a statically blocked cell
          if (window.game.isCellStaticallyBlocked(swapLocation)) {
            continue;
          }
          const targetUnit = window.game.getUnitAt(target.x, target.y);
          const swapUnit = window.game.getUnitAt(
            swapLocation.x,
            swapLocation.y,
          );
          const pickupToSwapWith = window.game.getPickupAt(target.x, target.y);
          if (targetUnit) {
            if (dryRun) {
              drawSwapLine(targetUnit, swapLocation);
            } else {
              // Physically swap with target
              Unit.setLocation(targetUnit, swapLocation);
            }
          }
          if (swapUnit) {
            if (dryRun) {
              drawSwapLine(caster.unit, target);
            } else {
              Unit.setLocation(caster.unit, target);
            }
          }
          // Physically swap with pickups
          if (pickupToSwapWith) {
            if (dryRun) {
              drawSwapLine(pickupToSwapWith, swapLocation);
            } else {
              Pickup.setPosition(
                pickupToSwapWith,
                swapLocation.x,
                swapLocation.y,
              );
            }
          }
        }
      }
      return state;
    },
  },
};
export default spell;
