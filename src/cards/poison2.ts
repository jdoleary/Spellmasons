import { Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { poisonCardId } from './poison';

export const poison2CardId = 'Poison 2';
export const basePoisonStacks = 30;
const spell: Spell = {
  card: {
    id: poison2CardId,
    category: CardCategory.Curses,
    replaces: [poisonCardId],
    sfx: 'poison',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconPoison2.png',
    animationPath: 'spellPoison',
    description: ['spell_poison', basePoisonStacks.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, poisonCardId, underworld, prediction, basePoisonStacks * quantity, { sourceUnitId: state.casterUnit.id });
        }
      }
      return state;
    },
  },
};


export default spell;