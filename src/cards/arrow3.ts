import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { ArrowProps, makeArrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrow3CardId = 'Arrow3';
const arrowProps: ArrowProps = {
  damage: 40,
  pierce: 1,
  arrowCount: 1,
}
const spell: Spell = {
  card: {
    id: arrow3CardId,
    replaces: [arrow2CardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconArrow3.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', arrowProps.damage.toString()],
    effect: makeArrowEffect(arrowProps),
  }
};
export default spell;