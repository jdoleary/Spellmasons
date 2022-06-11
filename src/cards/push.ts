import { add, subtract, Vec2 } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles, getCoordsAtDistanceTowardsTarget } from '../math';
import type { Circle } from '../collision/moveWithCollision';

export const id = 'push';
const pushDistance = 100;
const speed = 5;
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
      for (let unit of state.targetedUnits) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, unit) < unit.radius ? state.casterUnit : state.castLocation;
        forcePush(unit, awayFrom, prediction);
      }
      for (let pickup of state.targetedPickups) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, pickup) < pickup.radius ? state.casterUnit : state.castLocation;
        forcePush(pickup, awayFrom, prediction);
      }
      return state;
    },
  },
};
export function forcePush(pushedObject: Circle, awayFrom: Vec2, prediction: boolean): Vec2 {
  const endPos = add(pushedObject, similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), pushDistance));
  if (!prediction) {
    const step = subtract(getCoordsAtDistanceTowardsTarget(pushedObject, endPos, speed), pushedObject);
    window.forceMove.push({ pushedObject, step, distance: pushDistance });
  }
  return endPos;

}
export default spell;
