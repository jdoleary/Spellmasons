import { Spell } from './index';
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
    requiresFollowingCard: true,
    description: 'spell_plus_radius',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRadiusBoost = radiusBoost * quantity;
      state.aggregator.radiusBoost += adjustedRadiusBoost;
      state.targetedUnits.filter(u => u.unitSubType === UnitSubType.DOODAD).forEach(doodad => {
        doodad.attackRange += adjustedRadiusBoost * 50;
      })
      return state;
    },
  },
};
export default spell;
