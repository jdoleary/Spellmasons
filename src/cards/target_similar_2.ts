import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { targetSimilarEffect, targetSimilarId } from './target_similar';

export const targetSimilar2Id = 'Target Similar 2';
const spell: Spell = {
  card: {
    id: targetSimilar2Id,
    replaces: [targetSimilarId],
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconTargetSimilar2.png',
    requiresFollowingCard: true,
    description: 'spell_target_similar',
    allowNonUnitTarget: true,
    timeoutMs: 400,
    effect: targetSimilarEffect(2),
  }
};
export default spell;