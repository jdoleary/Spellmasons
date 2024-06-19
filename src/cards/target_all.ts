import { addTarget, getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import * as Unit from '../entity/Unit';
import { isUnit } from '../entity/Unit';
import { isPickup } from '../entity/Pickup';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { animateTargetSimilar } from './target_similar';
import { targetSimilar2Id } from './target_similar_2';
import { HasSpace } from '../entity/Type';

const id = 'Target Kind';
const NUMBER_OF_TARGETS_PER_STACK = 3;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    requires: [targetSimilar2Id],
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconTargetKind.png',
    requiresFollowingCard: true,
    description: ['spell_target_kind', NUMBER_OF_TARGETS_PER_STACK.toString()],
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      // We store the initial targets because target similar mutates state.targetedUnits
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const initialTargets = targets;
      const animators = [];
      for (let i = 0; i < initialTargets.length; i++) {
        targets = getCurrentTargets(state);
        const target = initialTargets[i];
        if (!target) {
          continue;
        }

        const potentialTargets = underworld.getPotentialTargets(prediction)
          // Filter out current targets
          .filter(t => !targets.includes(t))
          // Filter out dissimilar types
          // For "Target All", we only filter by units and pickups
          // Rather than filtering by unit species and pickup type
          .filter(t => {
            if (isUnit(target) && isUnit(t)) {
              if (target.alive) {
                // Match living units of the same faction
                return t.alive && t.faction == target.faction;
              } else {
                // Match any dead unit
                return !t.alive;
              }
            } else if (isPickup(target) && isPickup(t)) {
              return true;
            } else {
              return false;
            }
          })
          .sort(math.sortCosestTo(target));

        const newTargets = potentialTargets.slice(0, NUMBER_OF_TARGETS_PER_STACK * quantity);
        if (!prediction) {
          playSFXKey('targeting');
          animators.push({ pos: target, newTargets: newTargets });
        }
        for (let newTarget of newTargets) {
          addTarget(newTarget, state, underworld, prediction);
        }
      }

      await animateTargetSimilar(animators);

      return state;
    },
  },
};
export default spell;