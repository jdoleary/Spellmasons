import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { addUnitTarget, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { drownCardId } from './drown';

export const bloodBathId = 'Blood Bath';
const damageMult = 2;
const spell: Spell = {
  card: {
    id: bloodBathId,
    category: CardCategory.Damage,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    supportQuantity: false,
    allowNonUnitTarget: true,
    ignoreRange: true,
    requires: [drownCardId],
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconDrown2.png',
    sfx: 'drown',
    description: ['spell_blood_bath', Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: target all living units that are submerged
      const targets = (prediction ? underworld.unitsPrediction : underworld.units).filter(u => u.alive && u.inLiquid);
      if (targets.length) {
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          // playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
        }
        for (let unit of targets) {
          Unit.takeDamage({
            unit: unit,
            amount: Unit.GetSpellDamage(state.casterUnit.damage, damageMult) * quantity,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit,
          }, underworld, prediction);
        }
      } else {
        // No targets to cast on. Refund mana
        refundLastSpell(state, prediction, 'No units are submerged\nMana Refunded')
      }
      return state;
    },
  },
};
export default spell;
