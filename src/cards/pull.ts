import { multiply, add, Vec2 } from '../jmath/Vec';
import { getCurrentTargets, Spell } from './index';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { distance, similarTriangles } from '../jmath/math';
import { forcePush } from './push';

export const id = 'pull';
export const velocityStartMagnitude = 10;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconPull.png',
    description: `
Pulls the target(s) towards the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      const caster = state.casterUnit;
      for (let entity of targets) {
        const dist = distance(caster, entity)
        const awayFrom = add(caster, similarTriangles(entity.x - caster.x, entity.y - caster.y, dist, dist * 2));
        promises.push(forcePush(entity, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
const velocity_falloff = 0.91;
export async function pull(pushedObject: HasSpace, towards: Vec2, quantity: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // Set the velocity so it's just enough to pull the unit into you
  let velocity = multiply(1 - velocity_falloff, { x: towards.x - pushedObject.x, y: towards.y - pushedObject.y });
  velocity = multiply(quantity, velocity);
  let forceMoveInst: ForceMove;
  return await raceTimeout(2000, 'Pull', new Promise<void>((resolve) => {
    // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
    // I've had feedback that it's suprising - which is bad for a tactical game
    // also I suspect it has significant performance costs for levels with many enemies
    forceMoveInst = { canCreateSecondOrderPushes: false, alreadyCollided: [], pushedObject, velocity, velocity_falloff, resolve }
    if (prediction) {
      underworld.forceMovePrediction.push(forceMoveInst);
    } else {
      underworld.forceMove.push(forceMoveInst);
    }
  })).then(() => {
    if (forceMoveInst) {
      forceMoveInst.timedOut = true;
    }
  });

}
export default spell;
