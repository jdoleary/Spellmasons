import { addPickupTarget, addUnitTarget, Spell } from './index';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';

const id = 'Expanding';
const range = 140;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconExpanding.png',
    requiresFollowingCard: true,
    description: `
Adds a radius to the spell so it can affect more targets.
"Expanding" can be cast multiple times in succession to stack it's effect.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRange = range * quantity;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = state.targetedUnits.length ? state.targetedUnits : [state.castLocation];
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Draw visual circle for prediction
        if (prediction) {
          if (outOfRange) {
            drawPredictionCircle(target, adjustedRange, colors.outOfRangeGrey);
          } else {
            drawPredictionCircle(target, adjustedRange, colors.targetingSpellGreen, 'Expand Radius');
          }
        }
        const withinRadius = underworld.getUnitsWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add units to target
        withinRadius.forEach(unit => addUnitTarget(unit, state));

        const pickupsWithinRadius = underworld.getPickupsWithinDistanceOfTarget(
          target,
          adjustedRange,
          prediction
        );
        // Add pickups to target
        pickupsWithinRadius.forEach(unit => addPickupTarget(unit, state));
      }

      return state;
    },
  },
};
export default spell;
