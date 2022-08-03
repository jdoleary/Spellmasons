import { Vec2, magnitude, clone, add, equal } from '../jmath/Vec';
import { Spell } from './index';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { findSafeFallInPoint, lavaDamage } from '../entity/Obstacle';
import { isUnit, takeDamage } from '../entity/Unit';
import { addMask } from '../graphics/Image';

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
    forceMoveInst.onComplete = () => {
      if (isUnit(forceMoveInst.pushedObject)) {
        const unit = forceMoveInst.pushedObject;
        unit.resolveDoneMoving();
        takeDamage(unit, lavaDamage, underworld, prediction);
        if (unit.image) {
          addMask(unit.image, 'liquid-mask');
        }
      }
    }
  }
  if (prediction) {
    // Simulate the forceMove until it's complete
    let done = false;
    while (!done) {
      // TODO: TOO much recursion when push on devSpawnAllUnits because the predictions don't get added to an array to check against
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
  return forceMoveInst;

}
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  return await raceTimeout(3000, 'Push', new Promise<void>((resolve) => {
    makeForcePush({ pushedObject, awayFrom, resolve, canCreateSecondOrderPushes: true }, underworld, prediction);
  }));

}
export default spell;
