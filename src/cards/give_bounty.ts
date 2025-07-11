import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import { addModifier, isUnit } from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { bountyId } from '../modifierBounty';

const id = 'Give Bounty';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: false,
    manaCost: 200,
    healthCost: 0,
    soulFragmentCostOverride: 6,
    expenseScaling: 1,
    costGrowthAlgorithm: 'exponential',
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconGiveBounty.png',
    requiresFollowingCard: false,
    description: ['spell_give_bounty'],
    allowNonUnitTarget: false,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      targets.forEach(t => {
        if (isUnit(t)) {
          addModifier(t, bountyId, underworld, prediction, 1);
        }
      })

      return state;
    },
  },
};
export default spell;