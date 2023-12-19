import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { arrowEffect } from './arrow';
import { arrow2CardId } from './arrow2';

export const arrow3CardId = 'Arrow3';
const damageDone = 40;
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
    description: ['spell_arrow', damageDone.toString()],
    effect: arrowEffect(1, damageDone),
  }
};
export default spell;