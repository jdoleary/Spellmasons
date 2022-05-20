import { add, subtract, Vec2 } from '../Vec';
import type { Spell } from '.';
import { distance, getCoordsAtDistanceTowardsTarget, similarTriangles } from '../math';
import { checkLavaDamageDueToMovement } from '../Obstacle';
import type { Circle } from 'src/collision/moveWithCollision';

export const id = 'pull';
const pullDistance = 100;
const speed = 5;
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
        const endPos = pull(unit, state.casterUnit, prediction);
        checkLavaDamageDueToMovement(unit, endPos, prediction);
      }
      for (let pickup of state.targetedPickups) {
        pull(pickup, state.casterUnit, prediction);
      }
      return state;
    },
  },
};
export function pull(pushedObject: Circle, towards: Vec2, prediction: boolean): Vec2 {
  const endPos = add(pushedObject, similarTriangles(pushedObject.x - towards.x, pushedObject.y - towards.y, distance(pushedObject, towards), -pullDistance));
  if (!prediction) {
    const step = subtract(getCoordsAtDistanceTowardsTarget(pushedObject, endPos, speed), pushedObject);
    window.forceMove.push({ pushedObject, step, distance: pullDistance });
  }
  return endPos;

}
export default spell;
