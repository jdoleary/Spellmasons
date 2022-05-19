import { add, subtract } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles, getCoordsAtDistanceTowardsTarget } from '../math';
import { checkLavaDamageDueToMovement, lavaDamage } from '../Obstacle';

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
        const endPos = add(unit, similarTriangles(unit.x - state.casterUnit.x, unit.y - state.casterUnit.y, distance(unit, state.casterUnit), pushDistance));
        if (!prediction) {
          const step = subtract(getCoordsAtDistanceTowardsTarget(unit, endPos, speed), unit);
          window.forceMove.push({ unit, step, distance: pushDistance });
        }
        checkLavaDamageDueToMovement(unit, endPos, prediction);
      }
      return state;
    },
  },
};
export default spell;
