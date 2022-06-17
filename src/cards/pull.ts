import { Vec2 } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../math';
import type { Circle } from '../collision/moveWithCollision';

export const id = 'pull';
const pullDistance = 15;
const spell: Spell = {
  card: {
    id,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'pull.png',
    description: `
Pulls the target(s) towards the caster 
    `,
    effect: async (state, prediction) => {
      for (let unit of state.targetedUnits) {
        pull(unit, state.casterUnit, prediction);
      }
      for (let pickup of state.targetedPickups) {
        pull(pickup, state.casterUnit, prediction);
      }
      return state;
    },
  },
};
export function pull(pushedObject: Circle, towards: Vec2, prediction: boolean): Vec2 {
  const velocity = similarTriangles(pushedObject.x - towards.x, pushedObject.y - towards.y, distance(pushedObject, towards), -pullDistance);
  if (!prediction) {
    const velocity_falloff = 0.93;
    window.forceMove.push({ pushedObject, velocity, velocity_falloff });
  }
  return velocity;

}
export default spell;
