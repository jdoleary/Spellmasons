import { Vec2, clone } from '../jmath/Vec';
import { getCurrentTargets, Spell } from './index';
import { distance, similarTriangles } from '../jmath/math';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';

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
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconPush.png',
    description: `
Pushes the target(s) away from the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const awayFrom = state.casterUnit;
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePush(entity, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
interface forcePushArgs {
  pushedObject: HasSpace;
  awayFrom: Vec2;
  velocityStartMagnitude: number;
  canCreateSecondOrderPushes: boolean;
  resolve: () => void;
}
export function makeForcePush(args: forcePushArgs, underworld: Underworld, prediction: boolean): ForceMove {
  const { pushedObject, awayFrom, resolve, velocityStartMagnitude, canCreateSecondOrderPushes } = args;
  const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), velocityStartMagnitude);
  const velocity_falloff = 0.93;
  // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
  // I've had feedback that it's suprising - which is bad for a tactical game
  // also I suspect it has significant performance costs for levels with many enemies
  const forceMoveInst: ForceMove = { pushedObject, alreadyCollided: [], canCreateSecondOrderPushes: false, velocity, velocity_falloff, resolve }
  if (prediction) {
    underworld.forceMovePrediction.push(forceMoveInst);
  } else {
    underworld.forceMove.push(forceMoveInst);
  }
  return forceMoveInst;

}
export async function forcePush(pushedObject: HasSpace, awayFrom: Vec2, magnitude: number, underworld: Underworld, prediction: boolean): Promise<void> {
  let forceMoveInst: ForceMove;
  return await raceTimeout(3000, 'Push', new Promise<void>((resolve) => {
    // Experiment: canCreateSecondOrderPushes is now ALWAYS disabled.
    // I've had feedback that it's suprising - which is bad for a tactical game
    // also I suspect it has significant performance costs for levels with many enemies
    forceMoveInst = makeForcePush({ pushedObject, awayFrom, velocityStartMagnitude: magnitude, resolve, canCreateSecondOrderPushes: false }, underworld, prediction);
  })).then(() => {
    if (forceMoveInst) {
      forceMoveInst.timedOut = true;
    }
  });

}
export default spell;
