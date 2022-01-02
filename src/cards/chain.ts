import { drawDryRunLine } from '../ui/PlanningView';
import type { Spell } from '.';
import type { Coords } from '../commonTypes';

const id = 'chain';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'chain.png',
    probability: 10,
    description: `
Adds targets for the following cards to effect by "chaining like electricity" 
off of all existing targeted units to units touching them. 
    `,
    effect: async (state, dryRun) => {
      let newTargets: Coords[] = [];
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = window.underworld.getTouchingUnitsRecursive(
            target.x,
            target.y,
            [...state.targets, ...newTargets],
          );
          chained_units.forEach(chained_unit => {
            drawDryRunLine(unit, chained_unit);
          })
          newTargets = newTargets.concat(chained_units);
        }
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
