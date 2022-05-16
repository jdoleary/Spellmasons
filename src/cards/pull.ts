import { add } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../math';

export const id = 'pull';
const pullDistance = 100;
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
      if (!prediction) {
        for (let unit of state.targetedUnits) {
          const endPos = add(unit, similarTriangles(unit.x - state.casterUnit.x, unit.y - state.casterUnit.y, distance(unit, state.casterUnit), -pullDistance));
          // window.predictionGraphics.lineStyle(4, 0x0000ff, 1.0)
          // window.predictionGraphics.drawCircle(endPosition.x, endPosition.y, 4);
          window.forceMove.push({ unit, endPos, iterationsLeft: 20 });
        }
      }
      return state;
    },
  },
};
export default spell;
