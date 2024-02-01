import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { slashCardId, slashEffect } from './slash';

export const heavyslashCardId = 'Heavy Slash';
const damageDone = 40;
const slashScale = 2;
const spell: Spell = {
  card: {
    id: heavyslashCardId,
    replaces: [slashCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 18,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconHeavySlash.png',
    animationPath: 'spell-effects/spellHurtCuts',
    sfx: 'hurt2',
    description: ['spell_slash', damageDone.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      return await slashEffect(state, card, quantity, underworld, prediction, damageDone, slashScale);
    },
  },
};
export default spell;
