import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowTripleCardId } from './arrow_triple';
import { ArrowProps, arrowEffect } from './arrow';

export const arrowMultiCardId = 'Multi Arrow';
const arrowProps: ArrowProps = {
  damage: 10,
  pierce: 1,
  arrowCount: 5,
}

const spell: Spell = {
  card: {
    id: arrowMultiCardId,
    replaces: [arrowTripleCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconArrowMulti.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_many', arrowProps.arrowCount.toString(), arrowProps.damage.toString()],
    effect: arrowEffect(arrowProps)
  }
};
export default spell;