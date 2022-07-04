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
      let promises = [];
      for (let unit of state.targetedUnits) {
        promises.push(pull(unit, state.casterUnit, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(pull(pickup, state.casterUnit, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function pull(pushedObject: Circle, towards: Vec2, prediction: boolean): Promise<Vec2> {
  const velocity = similarTriangles(pushedObject.x - towards.x, pushedObject.y - towards.y, distance(pushedObject, towards), -pullDistance);
  if (!prediction) {
    const velocity_falloff = 0.93;
    await new Promise<void>((resolve) => {
      window.forceMove.push({ pushedObject, velocity, velocity_falloff, resolve });
    });
  }
  return velocity;

}
export default spell;
