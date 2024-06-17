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
  let cursesRemoved = 0;
  for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
    if (modifierProperties.isCurse) {
      Unit.removeModifier(unit, modifier, underworld);
      cursesRemoved += 1;
      GameStatistics.trackCursePurified({ unit, sourceUnit }, underworld, prediction);
    }
  }

  if (!prediction && sourceUnit == globalThis.player?.unit && cursesRemoved >= 5) {
    UnlockAchievement(achievement_MiracleWorker, underworld);
  }
}
export default spell;
