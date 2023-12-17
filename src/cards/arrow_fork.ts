import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { EffectState, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector } from '../jmath/Vec';
import Underworld from '../Underworld';
import regularArrow, { ArrowProps, arrowEffect } from './arrow';
import { raceTimeout } from '../Promise';
import { arrowTripleCardId } from './arrow_triple';

export const arrowForkCardId = 'Shatter Arrow';
const arrowProps: ArrowProps = {
  damage: 30,
  pierce: 1,
  arrowCount: 1,
  onCollide: fireForkedArrows
}
const forkedArrowProps: ArrowProps = {
  damage: 10,
  pierce: 1,
  arrowCount: 1,
}

const spell: Spell = {
  card: {
    id: arrowForkCardId,
    requires: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowFork.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_fork', arrowProps.damage.toString()],
    effect: arrowEffect(arrowProps)
  }
};

async function fireForkedArrows(state: EffectState, unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  return raceTimeout(5_000, 'fireForkedArrows', new Promise((resolve) => {
    let promises = [];
    // Now fork into regular arrows that fire in directions
    for (let newAngle of [Math.PI / 12, -Math.PI / 12, 2 * Math.PI / 12, -2 * Math.PI / 12, 3 * Math.PI / 12, -3 * Math.PI / 12]) {
      const angle = getAngleBetweenVec2s(state.casterUnit, unit) + newAngle;
      const castLocation = getEndpointOfMagnitudeAlongVector(unit, angle, 10_000);
      // Override casterUnit as firstTarget so forked arrows don't hit the target that they are forking off of
      promises.push(arrowEffect(forkedArrowProps)({ ...state, casterPositionAtTimeOfCast: unit, targetedUnits: [], casterUnit: unit, castLocation }, regularArrow.card, 1, underworld, prediction));
    }
    Promise.all(promises).then(() => {
      resolve(state);
    });
  }));

}
export default spell;