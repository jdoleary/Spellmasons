import { addTarget, getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { isUnit } from '../entity/Unit';
import { isPickup } from '../entity/Pickup';
import { isDoodad } from '../entity/Doodad';
import { CardRarity, probabilityMap } from '../graphics/ui/CardUI';

const id = 'Target Similar';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'unknown.png',
    requiresFollowingCard: true,
    description: `
Targets the nearest entity of the same kind as the cast target.

Each stack of this spell will target an additional entity.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        const potentialTargets = underworld.getPotentialTargets(prediction)
          // Filter out current targets
          .filter(t => !targets.includes(t))
          // Filter out dissimilar types
          // @ts-ignore Find similar units by unitSourceId, find similar pickups by name
          .filter(t => {
            if (isUnit(target)) {
              return isUnit(t) && t.unitSourceId == target.unitSourceId;
            } else if (isPickup(target)) {
              return isPickup(t) && t.name == target.name;
            } else if (isDoodad(target)) {
              return isDoodad(t) && t.name == target.name;
            }
          })
          .sort((a, b) => math.distance(a, target) - math.distance(b, target));
        for (let j = 0; j < quantity; j++) {
          const newTarget = potentialTargets.shift()
          if (newTarget) {
            addTarget(newTarget, state);
          }
        }
      }

      return state;
    },
  },
};

export default spell;
