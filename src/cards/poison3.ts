import { Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { poisonCardId } from './poison';
import { poison2CardId } from './poison2';

export const poison3CardId = 'Poison 3';
export const basePoisonStacks = 50;
const spell: Spell = {
  card: {
    id: poison3CardId,
    category: CardCategory.Curses,
    replaces: [poison2CardId],
    sfx: 'poison',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconPoison3.png',
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