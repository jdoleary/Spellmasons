import Underworld from '../Underworld';
import * as Unit from '../entity/Unit';
import { EffectState, Spell } from './index';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import * as math from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { arrowEffect, ArrowProps } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrowFarCardId = 'Long Arrow';
const maxDamage = 50;
const minRange = 100;
const maxDamageRange = 600;
const arrowProps: ArrowProps = {
  damage: 0,
  pierce: 1,
  arrowCount: 1,
  onCollide: distanceDamage
}

const spell: Spell = {
  card: {
    id: arrowFarCardId,
    requires: [arrow2CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrowLong.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_far', maxDamage.toString()],
    effect: arrowEffect(arrowProps)
  }
};

async function distanceDamage(state: EffectState, unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  return new Promise<EffectState>((resolve) => {
    const dist = math.distance(state.casterPositionAtTimeOfCast, unit);
    const damage = Math.ceil(math.lerp(0, maxDamage, Math.max(0, dist - minRange) / maxDamageRange));
    Unit.takeDamage(unit, damage, state.casterPositionAtTimeOfCast, underworld, prediction)
    resolve(state);
  })
}

export default spell;