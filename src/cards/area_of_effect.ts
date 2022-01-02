import type { Coords } from '../commonTypes';
import type { Spell } from '.';
import { drawDryRunCircle } from '../ui/PlanningView';

const id = 'AOE';
const range = 200;
const spell: Spell = {
  card: {
    id,
    thumbnail: 'aoe.png',
    probability: 20,
    description: `
Adds targets for the following cards to effect by "growing" existing targets
by 1 grid cell in each direction.
    `,
    effect: async (state, dryRun) => {
      let newTargets: Coords[] = [];
      for (let target of state.targets) {
        const withinRadius = window.underworld.getCoordsForUnitsWithinDistanceOfTarget(
          target,
          range,
        );
        // Draw visual circle for dryRun
        drawDryRunCircle(target, range);
        newTargets = newTargets.concat(withinRadius);
      }
      let updatedTargets = [...state.targets, ...newTargets];
      // deduplicate
      updatedTargets = updatedTargets.filter((coord, index) => {
        return (
          updatedTargets.findIndex(
            (findCoords) => findCoords.x == coord.x && findCoords.y === coord.y,
          ) === index
        );
      });

      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
