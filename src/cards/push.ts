import { add, subtract, Vec2 } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles, getCoordsAtDistanceTowardsTarget } from '../math';
import { checkLavaDamageDueToMovement, lavaDamage } from '../Obstacle';
import type { IUnit } from 'src/Unit';

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
        push(unit, state.casterUnit, prediction);
      }
      return state;
    },
  },
};
export function push(unit: IUnit, awayFrom: Vec2, prediction: boolean) {
  const endPos = add(unit, similarTriangles(unit.x - awayFrom.x, unit.y - awayFrom.y, distance(unit, awayFrom), pushDistance));
  if (!prediction) {
    const step = subtract(getCoordsAtDistanceTowardsTarget(unit, endPos, speed), unit);
    window.forceMove.push({ unit, step, distance: pushDistance });
  }
  checkLavaDamageDueToMovement(unit, endPos, prediction);

}
export default spell;
