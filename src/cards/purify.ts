import * as Unit from '../entity/Unit';
import { Spell, refundLastSpell } from './index';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Pickup from '../entity/Pickup';


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
          apply(unit, underworld)
        }
      }
      if (state.targetedPickups.length) {
        doRefund = false;
        state.targetedPickups.filter(p => p.name === Pickup.CURSED_MANA_POTION).forEach(cursedManaPotion => {
          const manaPotionSource = Pickup.pickups.find(p => p.name == Pickup.MANA_POTION);
          if (manaPotionSource) {
            Pickup.create({
              pos: cursedManaPotion,
              pickupSource: manaPotionSource,
            }, underworld, prediction);
          } else {
            console.error('Could not find manaPotionSource')
          }
          Pickup.removePickup(cursedManaPotion, underworld, prediction);

        })
      }
      if (doRefund) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.')
      }
      return state;
    },
  },
};
export function apply(unit: Unit.IUnit, underworld: Underworld) {

  for (let [modifier, modifierProperties] of Object.entries(unit.modifiers)) {
    if (modifierProperties.isCurse) {
      Unit.removeModifier(unit, modifier, underworld);
    }
  }
}
export default spell;
