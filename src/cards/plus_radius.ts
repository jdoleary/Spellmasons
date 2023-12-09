import { Spell } from './index';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'Plus Radius';
const radiusIncreaseAmount = 50;
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
    effect: async (
      state,
      card,
      quantity,
      underworld,
      prediction,
      outOfRange,
    ) => {
      const adjustedRadius = radiusIncreaseAmount * quantity;
      state.aggregator.radius += adjustedRadius;
      state.targetedUnits
        .filter((u) => u.unitSubType === UnitSubType.DOODAD)
        .forEach((doodad) => {
          doodad.attackRange += adjustedRadius;
        });
      return state;
    },
  },
};
export default spell;
