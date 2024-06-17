import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const drownCardId = 'Drown';
const damageMult = 2;
const spell: Spell = {
  card: {
    id: drownCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconDrown.png',
    sfx: 'drown',
    description: ['spell_drown', Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units that are submerged
      const targets = state.targetedUnits.filter(u => u.alive && u.inLiquid);
      if (targets.length) {
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          // playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
        }
        for (let unit of targets) {
          Unit.takeDamage({
            unit: unit,
            amount: Unit.GetSpellDamage(undefined, damageMult) * quantity,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit,
          }, underworld, prediction);
        }
      }
      // No targets to cast on. Refund mana
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No targets are submerged\nMana Refunded')
      }
      return state;
    },
  },
};
export default spell;
