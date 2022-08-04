import { Vec2, magnitude, clone, add, equal } from '../jmath/Vec';
import { Spell } from './index';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { findSafeFallInPoint } from '../entity/Obstacle';
import { addModifier, isUnit } from '../entity/Unit';
import * as inLiquid from '../inLiquid';

export const id = 'push';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'push.png',
    description: `
Pushes the target(s) away from the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
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
interface forcePushArgs {
  pushedObject: Circle;
  awayFrom: Vec2;
  pushDistance?: number;
  canCreateSecondOrderPushes: boolean;
  resolve: () => void;
}
export function makeForcePush(args: forcePushArgs, underworld: Underworld, prediction: boolean): ForceMove {
  const { pushedObject, awayFrom, resolve, pushDistance, canCreateSecondOrderPushes } = args;
  const endPoint = add(pushedObject, similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), pushDistance || 300));
  const originalPosition = clone(pushedObject);
  const forceMoveInst: ForceMove = { pushedObject, canCreateSecondOrderPushes, endPoint, resolve }
  // Adjust endpoint to account for falling into lava:
  const { safeFallInPosition, hitLava } = findSafeFallInPoint(pushedObject, endPoint, underworld)
  if (hitLava) {
    // Override end point
    forceMoveInst.endPoint = safeFallInPosition;
  }
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
    underworld.addForceMove(forceMoveInst);
  }
  return forceMoveInst;

}
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  let forceMoveInst: ForceMove;
  return await raceTimeout(3000, 'Push', new Promise<void>((resolve) => {
    forceMoveInst = makeForcePush({ pushedObject, awayFrom, resolve, canCreateSecondOrderPushes: true }, underworld, prediction);
  })).then(() => {
    if (forceMoveInst) {
      forceMoveInst.timedOut = true;
    }
  });

}
export default spell;
