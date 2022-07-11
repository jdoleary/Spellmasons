import { Vec2, magnitude, clone } from '../jmath/Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';

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
      const awayFrom = state.casterUnit;
      for (let unit of state.targetedUnits) {
        promises.push(forcePush(unit, awayFrom, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(forcePush(pickup, awayFrom, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, prediction: boolean): Promise<void> {
  const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), pushDistance);
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
    };
  });

}
export default spell;
