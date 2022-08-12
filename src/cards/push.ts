import { Vec2, clone } from '../jmath/Vec';
import { Spell } from './index';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';

export const id = 'push';
export const velocityStartMagnitude = 10;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconPush.png',
    description: `
Pushes the target(s) away from the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const awayFrom = state.casterUnit;
      playDefaultSpellSFX(card, prediction);
      for (let unit of state.targetedUnits) {
        promises.push(forcePush(unit, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(forcePush(pickup, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
interface forcePushArgs {
  pushedObject: Circle;
  awayFrom: Vec2;
  velocityStartMagnitude: number;
  canCreateSecondOrderPushes: boolean;
  resolve: () => void;
}
export function makeForcePush(args: forcePushArgs, underworld: Underworld, prediction: boolean): ForceMove {
  const { pushedObject, awayFrom, resolve, velocityStartMagnitude, canCreateSecondOrderPushes } = args;
  const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), velocityStartMagnitude);
  const velocity_falloff = 0.93;
  const forceMoveInst: ForceMove = { pushedObject, canCreateSecondOrderPushes, velocity, velocity_falloff, resolve }
  if (prediction) {
    underworld.fullySimulateForceMove(forceMoveInst, prediction);
    resolve();
  } else {
    underworld.forceMove.push(forceMoveInst);
  }
  return forceMoveInst;

}
export async function forcePush(pushedObject: Circle, awayFrom: Vec2, magnitude: number, underworld: Underworld, prediction: boolean): Promise<void> {
  let forceMoveInst: ForceMove;
  return await raceTimeout(3000, 'Push', new Promise<void>((resolve) => {
    forceMoveInst = makeForcePush({ pushedObject, awayFrom, velocityStartMagnitude: magnitude, resolve, canCreateSecondOrderPushes: true }, underworld, prediction);
  })).then(() => {
    if (forceMoveInst) {
      forceMoveInst.timedOut = true;
    }
  });

}
export default spell;
