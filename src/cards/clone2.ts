import { Spell } from './index';
import { CardCategory } from '../types/commonTypes';

import { CardRarity, probabilityMap } from '../types/commonTypes';
import { clone_id, cloneEffect } from './clone';

const id = 'ultra clone';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Soul,
    replaces: [clone_id],
    manaCost: 120,
    healthCost: 0,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    expenseScaling: 4,
    supportQuantity: true,
    thumbnail: 'spellIconClone2.png',
    description: 'spell_clone_2',
    effect: cloneEffect(true)
  },
};

export default spell;
