import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { EffectState, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector } from '../jmath/Vec';
import Underworld from '../Underworld';
import regularArrow, { arrowEffect } from './arrow';
import { raceTimeout } from '../Promise';
import { arrowTripleCardId } from './arrow_triple';

export const arrowForkCardId = 'Shatter Arrow';
const damageDone = 30;
const spell: Spell = {
  card: {
    id: arrowForkCardId,
    requires: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowFork.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_fork', damageDone.toString()],
    effect: arrowEffect(1, damageDone, fireForkedArrows)
  }
};
async function fireForkedArrows(state: EffectState, firstTarget: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  return raceTimeout(5_000, 'fireForkedArrows', new Promise((resolve) => {
    let promises = [];
    // Now fork into regular arrows that fire in directions
    for (let newAngle of [Math.PI / 12, -Math.PI / 12, 2 * Math.PI / 12, -2 * Math.PI / 12, 3 * Math.PI / 12, -3 * Math.PI / 12]) {
      const angle = getAngleBetweenVec2s(state.casterUnit, firstTarget) + newAngle;
      const castLocation = getEndpointOfMagnitudeAlongVector(firstTarget, angle, 10_000);
      // Override casterUnit as firstTarget so forked arrows don't hit the target that they are forking off of
      promises.push(arrowEffect(1, 10, undefined, true)({ ...state, casterPositionAtTimeOfCast: firstTarget, targetedUnits: [], casterUnit: firstTarget, castLocation }, regularArrow.card, 1, underworld, prediction, false));
    }
    Promise.all(promises).then(() => {
      resolve(state);
    });
  }));

}
export default spell;