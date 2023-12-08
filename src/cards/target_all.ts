import { addTarget, getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import * as Unit from '../entity/Unit';
import { isUnit } from '../entity/Unit';
import { isPickup } from '../entity/Pickup';
import { isDoodad } from '../entity/Doodad';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { animateTargetSimilar } from './target_similar';
import { targetSimilar2Id } from './target_similar_2';

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
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      const animators = [];
      for (let i = 0; i < length; i++) {
        // Refresh the targets array so it excludes reselecting a target that was selected by the last iteration
        targets = getCurrentTargets(state);
        const target = targets[i];
        if (!target) {
          continue;
        }
        const filterFn = (x: any) => {
          if (Unit.isUnit(x) && Unit.isUnit(target)) {
            if (target.alive) {
              // Match living units of the same faction
              return x.faction == target.faction && x.alive;
            } else {
              // Match any dead unit
              return !x.alive;
            }
          } else if (!Unit.isUnit(x) && !Unit.isUnit(target)) {
            // Match both non units to each other
            return true;
          } else {
            // Do not match unit and non unit
            return false;
          }
        }
        const newTargets = underworld.getPotentialTargets(prediction)
          // Filter out current targets
          .filter(t => !targets.includes(t))
          // Filter out dissimilar types
          // @ts-ignore Find similar units by unitSourceId, find similar pickups by name
          .filter(t => {
            if (isUnit(target)) {
              return isUnit(t) && t.alive == target.alive;
            } else if (isPickup(target)) {
              return isPickup(t);
            } else if (isDoodad(target)) {
              return isDoodad(t);
            }
          })
          .filter(filterFn)
          .slice(0, NUMBER_OF_TARGETS_PER_STACK * quantity);
        if (!prediction) {
          playSFXKey('targeting');
          animators.push({ pos: target, newTargets });
        }
        for (let newTarget of newTargets) {
          addTarget(newTarget, state);
        }
      }
      await animateTargetSimilar(animators);

      return state;
    },
  },
};

export default spell;