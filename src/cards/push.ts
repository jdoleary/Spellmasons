import { Vec2, magnitude, clone } from '../Vec';
import type { Spell } from '.';
import { distance, similarTriangles } from '../math';
import type { Circle, ForceMove } from '../collision/moveWithCollision';
import * as config from '../config';
import { forceMoveColor } from '../ui/colors';

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
      for (let unit of state.targetedUnits) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, unit) < config.COLLISION_MESH_RADIUS ? state.casterUnit : state.castLocation;
        promises.push(forcePush(unit, awayFrom, prediction));
      }
      for (let pickup of state.targetedPickups) {
        // Push away from caster if unit was direct targeted by cast, otherwise push away from the
        // cast location (as in the case of AOE, push)
        const awayFrom = distance(state.castLocation, pickup) < config.COLLISION_MESH_RADIUS ? state.casterUnit : state.castLocation;
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
