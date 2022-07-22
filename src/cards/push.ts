import { Vec2, magnitude, clone } from '../jmath/Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';

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
    effect: async (state, underworld, prediction) => {
      let promises = [];
      const awayFrom = state.casterUnit;
      for (let unit of state.targetedUnits) {
        promises.push(forcePush(unit, awayFrom, underworld, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(forcePush(pickup, awayFrom, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), pushDistance);
  const velocity_falloff = 0.93;
  const originalPosition = clone(pushedObject);
  return await raceTimeout(2000, 'Push', new Promise<void>((resolve) => {
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
    };
  }));

}
export default spell;
