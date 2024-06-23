import * as Unit from '../entity/Unit';
import { Spell, refundLastSpell } from './index';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Pickup from '../entity/Pickup';
import * as GameStatistics from '../GameStatistics';
import { UnlockAchievement, achievement_MiracleWorker } from '../Achievements';


export const purifyCardId = 'purify';
// Removes all curse modifiers
const spell: Spell = {
  card: {
    id: purifyCardId,
    category: CardCategory.Blessings,
    sfx: 'purify',
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconPurify.png',
    animationPath: 'spell-effects/spellPurify',
    description: 'spell_purify',
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits;
      let doRefund = true;
      if (targets.length) {
        doRefund = false;
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          apply(unit, underworld, prediction, state.casterUnit)
        }
      }
      if (doRefund) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.')
      }
      return state;
    },
  },
};
export function apply(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit: Unit.IUnit) {
  // If the player purifies 5 or more curses from a single unit at once, unlock achievement
  if (!prediction && sourceUnit == globalThis.player?.unit && Object.entries(unit.modifiers).filter(m => m[1].isCurse).length >= 5) {
    UnlockAchievement(achievement_MiracleWorker, underworld);
  }

  for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
    if (modifierProperties.isCurse) {
      Unit.removeModifier(unit, modifier, underworld);
    }
  }
}
export default spell;
