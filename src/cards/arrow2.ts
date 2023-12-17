import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { ArrowProps, arrowCardId, arrowEffect } from './arrow';

export const arrow2CardId = 'Arrow 2';
const arrowProps: ArrowProps = {
  damage: 20,
  pierce: 1,
  arrowCount: 1,
}
const spell: Spell = {
  card: {
    id: arrow2CardId,
    replaces: [arrowCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconArrow2.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', arrowProps.damage.toString()],
    effect: arrowEffect(arrowProps)
  }
};
export default spell;