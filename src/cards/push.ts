import { Vec2 } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../math';
import type { Circle } from '../collision/moveWithCollision';
import * as config from '../config';

export const id = 'push';
const pushDistance = 20;
const spell: Spell = {
  card: {
    id,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'push.png',
    description: `
Pushes the target(s) away from the caster 
    `,
    effect: async (state, prediction) => {
      let promises = [];
      for (let unit of state.targetedUnits) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, unit) < config.COLLISION_MESH_RADIUS ? state.casterUnit : state.castLocation;
        promises.push(forcePush(unit, awayFrom, prediction));
      }
      for (let pickup of state.targetedPickups) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, pickup) < config.COLLISION_MESH_RADIUS ? state.casterUnit : state.castLocation;
        promises.push(forcePush(pickup, awayFrom, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, prediction: boolean): Promise<Vec2> {
  const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), pushDistance);
  if (!prediction) {
    const velocity_falloff = 0.93;
    await new Promise<void>((resolve) => {
      window.forceMove.push({ pushedObject, velocity, velocity_falloff, resolve });
    });
  }
  return velocity;

}
export default spell;
