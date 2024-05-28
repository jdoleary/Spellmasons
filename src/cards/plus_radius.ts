import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'Plus Radius';
const radiusBoost = 1;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconPlusRadius.png',
    description: 'spell_plus_radius',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRadiusBoost = radiusBoost * quantity;
      state.aggregator.radiusBoost += adjustedRadiusBoost;
      const urns = state.targetedUnits.filter(u => u.unitSubType === UnitSubType.DOODAD);
      urns.forEach(doodad => {
        doodad.attackRange += adjustedRadiusBoost * 50;
      })

      // Plus radius requires other cards unless used to target an urn
      if (!(state.cardIds.some(c => c != id) || urns.length != 0)) {
        refundLastSpell(state, prediction);
      }
      return state;
    },
  },
};
export default spell;
