import { drawDryRunLine } from '../ui/PlanningView';
import type { Spell } from '.';
import type { Vec2 } from '../commonTypes';
import type * as Unit from '../Unit';
import * as config from '../config';

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
    manaCost: config.MANA_BASE_COST,
    manaMultiplier: config.MANA_MULTIPLIER_SM,
    effect: async (state, dryRun) => {
      let newTargets: Vec2[] = [];
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = getTouchingUnitsRecursive(
            target.x,
            target.y,
            [...state.targets, ...newTargets],
          );
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
function getTouchingUnitsRecursive(
  x: number,
  y: number,
  ignore: Vec2[] = [],
): Unit.IUnit[] {
  const touchingDistance = config.COLLISION_MESH_RADIUS * 4;
  let touching = window.underworld.units.filter((u) => {
    return (
      u.x <= x + touchingDistance &&
      u.x >= x - touchingDistance &&
      u.y <= y + touchingDistance &&
      u.y >= y - touchingDistance &&
      !ignore.find((i) => i.x == u.x && i.y == u.y)
    );
  });
  ignore = ignore.concat(touching.map((u) => ({ x: u.x, y: u.y })));
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
