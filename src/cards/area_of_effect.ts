import { addPickupTarget, addUnitTarget, Spell } from './index';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';

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
    thumbnail: 'aoe.png',
    requiresFollowingCard: true,
    description: `
Adds a radius to the spell so it can affect more targets.
"Expanding" can be cast multiple times in succession to stack it's effect.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const adjustedRange = range * quantity;
      for (let target of [state.castLocation, ...state.targetedUnits]) {
        // Draw visual circle for prediction
        drawPredictionCircle(target, adjustedRange, 'Targeting Radius');
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
