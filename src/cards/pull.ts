import { clone, magnitude, Vec2 } from '../jmath/Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';

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
    effect: async (state, underworld, prediction) => {
      let promises = [];
      for (let unit of state.targetedUnits) {
        promises.push(pull(unit, state.casterUnit, underworld, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(pull(pickup, state.casterUnit, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function pull(pushedObject: Circle, towards: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  const velocity = similarTriangles(pushedObject.x - towards.x, pushedObject.y - towards.y, distance(pushedObject, towards), -pullDistance);
  const velocity_falloff = 0.93;
  const originalPosition = clone(pushedObject);
  return await raceTimeout(2000, 'Pull', new Promise<void>((resolve) => {
    const forceMoveInst: ForceMove = { pushedObject, velocity, velocity_falloff, resolve }
    if (prediction) {
      // Simulate the forceMove until it's complete
      while (magnitude(forceMoveInst.velocity) > 0.1) {
        globalThis.underworld.runForceMove(forceMoveInst, prediction);
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
