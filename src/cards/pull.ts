import { clone, magnitude, Vec2 } from '../jmath/Vec';
import { Spell } from './index';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';

export const id = 'pull';
const pullDistance = 15;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'pull.png',
    description: `
Pulls the target(s) towards the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const id = Math.random();
      for (let unit of state.targetedUnits) {
        promises.push(pull(unit, state.casterUnit, id, underworld, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(pull(pickup, state.casterUnit, id, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function pull(pushedObject: Circle, towards: Vec2, id: number, underworld: Underworld, prediction: boolean): Promise<void> {
  const originalPosition = clone(pushedObject);
  return await raceTimeout(2000, 'Pull', new Promise<void>((resolve) => {
    const forceMoveInst: ForceMove = { id, pushedObject, endPoint: towards, resolve }
    if (prediction) {
      // Simulate the forceMove until it's complete
      let done = false;
      while (!done) {
        done = underworld.runForceMove(forceMoveInst, prediction);
      }
      resolve();
      // Draw prediction lines
      if (globalThis.predictionGraphics) {
        globalThis.predictionGraphics.lineStyle(4, forceMoveColor, 1.0)
        globalThis.predictionGraphics.moveTo(originalPosition.x, originalPosition.y);
        globalThis.predictionGraphics.lineTo(pushedObject.x, pushedObject.y);
        globalThis.predictionGraphics.drawCircle(pushedObject.x, pushedObject.y, 4);
      }
    } else {
      underworld.forceMove.push(forceMoveInst);
    }
  }));

}
export default spell;
