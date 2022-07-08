import { clone, magnitude, Vec2 } from '../mathematics/Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../mathematics/math';
import type { Circle, ForceMove } from '../mathematics/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';

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
export async function pull(pushedObject: Circle, towards: Vec2, prediction: boolean): Promise<void> {
  const velocity = similarTriangles(pushedObject.x - towards.x, pushedObject.y - towards.y, distance(pushedObject, towards), -pullDistance);
  const velocity_falloff = 0.93;
  const originalPosition = clone(pushedObject);
  return await new Promise<void>((resolve) => {
    const forceMoveInst: ForceMove = { pushedObject, velocity, velocity_falloff, resolve }
    if (prediction) {
      // Simulate the forceMove until it's complete
      while (magnitude(forceMoveInst.velocity) > 0.1) {
        window.underworld.runForceMove(forceMoveInst);
      }
      resolve();
      // Draw prediction lines
      window.predictionGraphics.lineStyle(4, forceMoveColor, 1.0)
      window.predictionGraphics.moveTo(originalPosition.x, originalPosition.y);
      window.predictionGraphics.lineTo(pushedObject.x, pushedObject.y);
      window.predictionGraphics.drawCircle(pushedObject.x, pushedObject.y, 4);
    } else {
      window.forceMove.push(forceMoveInst);
    }
  });

}
export default spell;
