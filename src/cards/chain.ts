import { drawDryRunLine } from '../ui/PlanningView';
import { Spell, targetsToUnits } from '.';
import type { Vec2 } from '../Vec';
import * as Vec from '../Vec';
import type * as Unit from '../Unit';
import * as config from '../config';

const id = 'chain';
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'chain.png',
    requiresFollowingCard: true,
    description: `
Adds targets for the following cards to effect by "chaining like electricity" 
off of all existing targeted units to units touching them. 
    `,
    effect: async (state, dryRun) => {
      let newTargets: Vec2[] = [];
      for (let unit of targetsToUnits(state.targets)) {
        // Find all units touching the spell origin
        const chained_units = getTouchingUnitsRecursive(
          unit.x,
          unit.y,
          [...state.targets, ...newTargets],
        );
        newTargets = newTargets.concat(chained_units);

      }
      // Update targets
      state.targets = [...state.targets, ...newTargets];

      return state;
    },
  },
};
const range = 160;
function getTouchingUnitsRecursive(
  x: number,
  y: number,
  ignore: Vec2[] = [],
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
  ignore.push(...touching.map(Vec.clone));
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
