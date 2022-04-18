import { drawDryRunLine } from '../ui/PlanningView';
import { addUnitTarget, Spell } from '.';
import type { Vec2 } from '../Vec';
import type * as Unit from '../Unit';

const id = 'chain';
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'chain.png',
    requiresFollowingCard: true,
    description: `
Adds targets for the following cards to effect by "chaining like electricity" 
off of all existing targeted units to units touching them. 
    `,
    effect: async (state, dryRun) => {
      for (let i = 0; i < state.targetedUnits.length; i++) {
        const unit = state.targetedUnits[i];
        // Find all units touching the spell origin
        const chained_units = getTouchingUnitsRecursive(
          unit.x,
          unit.y,
          state.targetedUnits
        );
        // Update targetedUnits
        chained_units.forEach(u => addUnitTarget(u, state))
      }

      return state;
    },
  },
};
const range = 160;
function getTouchingUnitsRecursive(
  x: number,
  y: number,
  ignore: Unit.IUnit[] = [],
): Unit.IUnit[] {
  let touching = window.underworld.units.filter((u) => {
    return (
      u.x <= x + range &&
      u.x >= x - range &&
      u.y <= y + range &&
      u.y >= y - range &&
      !ignore.find((i) => i.x == u.x && i.y == u.y)
    );
  });
  ignore.push(...touching);
  // Draw dryrun lines so user can see how it chains
  touching.forEach(chained_unit => {
    drawDryRunLine({ x, y }, chained_unit);
  })
  for (let u of touching) {
    touching = touching.concat(
      getTouchingUnitsRecursive(u.x, u.y, ignore),
    );
  }
  return touching;
}
export default spell;
