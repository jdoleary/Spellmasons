import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { ArrowProps, arrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrowTripleCardId = 'Triple Arrow';
const arrowProps: ArrowProps = {
  damage: 10,
  pierce: 1,
  arrowCount: 3,
}

const spell: Spell = {
  card: {
    id: arrowTripleCardId,
    requires: [arrow2CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrowTriple.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow_many', arrowProps.arrowCount.toString(), arrowProps.damage.toString()],
    effect: arrowEffect(arrowProps)
  }
};
export default spell;