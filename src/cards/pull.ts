import { clone, multiply, Vec2 } from '../jmath/Vec';
import { Spell } from './index';
import type { Circle, ForceMove } from '../jmath/moveWithCollision';
import { forceMoveColor } from '../graphics/ui/colors';
import { raceTimeout } from '../Promise';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';

export const id = 'pull';
const pullDistance = 12;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconPull.png',
    description: `
Pulls the target(s) towards the caster 
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      for (let unit of state.targetedUnits) {
        promises.push(pull(unit, state.casterUnit, quantity, underworld, prediction));
      }
      for (let pickup of state.targetedPickups) {
        promises.push(pull(pickup, state.casterUnit, quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
const velocity_falloff = 0.93;
export async function pull(pushedObject: Circle, towards: Vec2, quantity: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // Set the velocity so it's just enough to pull the unit into you
  let velocity = multiply(1 - velocity_falloff, { x: towards.x - pushedObject.x, y: towards.y - pushedObject.y });
  velocity = multiply(quantity, velocity);
  let forceMoveInst: ForceMove;
  return await raceTimeout(2000, 'Pull', new Promise<void>((resolve) => {
    forceMoveInst = { canCreateSecondOrderPushes: true, pushedObject, velocity, velocity_falloff, resolve }
    if (prediction) {
      underworld.fullySimulateForceMove(forceMoveInst, prediction);
      resolve();
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
