import { addTarget, getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import { isUnit } from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { bountyId } from '../modifierBounty';

const id = 'Target Bounty';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 1,
    costGrowthAlgorithm: 'nlogn',
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconTargetBounty.png',
    requiresFollowingCard: true,
    description: ['spell_target_bounty'],
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const potentialTargets = underworld.getPotentialTargets(prediction)
        // Filter out current targets
        .filter(t => !targets.includes(t))
        .filter(t => isUnit(t) && t.modifiers[bountyId]);


      const newTargets = potentialTargets.slice(0, quantity);
      for (let newTarget of newTargets) {
        addTarget(newTarget, state, underworld, prediction);
      }

      return state;
    },
  },
};
export default spell;