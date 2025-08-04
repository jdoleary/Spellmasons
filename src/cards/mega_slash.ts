import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { slashEffect } from './slash';
import { heavyslashCardId } from './heavy_slash';

export const megaSlashCardId = 'Mega Slash';
const damageDone = 80;
const slashScale = 3;
const spell: Spell = {
  card: {
    id: megaSlashCardId,
    replaces: [heavyslashCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 34,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconMegaSlash.png',
    animationPath: 'spellHurtCuts',
    sfx: 'hurt3',
    description: ['spell_slash', damageDone.toString()],
    soulFragmentCostOverride: 1,
    effect: async (state, card, quantity, underworld, prediction) => {
      return await slashEffect(state, card, quantity, underworld, prediction, damageDone, slashScale);
    },
  },
};
export default spell;
