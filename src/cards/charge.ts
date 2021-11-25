import * as Unit from '../Unit';
import type { Spell } from '.';
import type { Coords } from '../commonTypes';
import { BOARD_WIDTH } from '../config';
import { drawSwapLine } from '../ui/PlanningView';

const id = 'charge';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'charge.png',
    probability: 5,
    description: `
Moves the caster in a straight line towards the initial target
if the target is on the same horizontal or vertical axis as the caster.
    `,
    effect: async (state, dryRun) => {
      const { casterUnit, targets } = state;
      const originalTarget = targets[0];

      const isOnSameHorizontal = originalTarget.x === casterUnit.x;
      const isOnSameVertical = originalTarget.y === casterUnit.y;
      if (!(isOnSameHorizontal || isOnSameVertical)) {
        return state;
      }

      // Charge does nothing if the target cell is obstructed
      if (window.underworld.isCellObstructed(originalTarget)) {
        return state;
      }
      let moveLocation: Coords | undefined;
      // Find closest non-blocked cell between those points to move to
      if (state.casterUnit.y == originalTarget.y) {
        if (state.casterUnit.x >= originalTarget.x) {
          for (let x = state.casterUnit.x - 1; x >= 0; x--) {
            const testLocation = { x, y: originalTarget.y };
            if (!window.underworld.isCellObstructed(testLocation)) {
              moveLocation = testLocation;
            } else {
              break;
            }
          }
        } else {
          for (let x = state.casterUnit.x + 1; x <= BOARD_WIDTH; x++) {
            const testLocation = { x, y: originalTarget.y };
            if (!window.underworld.isCellObstructed(testLocation)) {
              moveLocation = testLocation;
            } else {
              break;
            }
          }
        }
      }
      if (state.casterUnit.x == originalTarget.x) {
        if (state.casterUnit.y >= originalTarget.y) {
          for (let y = state.casterUnit.y - 1; y >= 0; y--) {
            const testLocation = { x: originalTarget.x, y };
            if (!window.underworld.isCellObstructed(testLocation)) {
              moveLocation = testLocation;
            } else {
              break;
            }
          }
        } else {
          for (let y = state.casterUnit.y + 1; y <= BOARD_WIDTH; y++) {
            const testLocation = { x: originalTarget.x, y };
            if (!window.underworld.isCellObstructed(testLocation)) {
              moveLocation = testLocation;
            } else {
              break;
            }
          }
        }
      }
      if (moveLocation) {
        if (dryRun) {
          drawSwapLine(casterUnit, moveLocation);
        } else {
          Unit.setLocation(casterUnit, moveLocation);
        }
      }
      return state;
    },
  },
};
export default spell;
