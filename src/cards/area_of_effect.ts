import { addPickupTarget, addUnitTarget, Spell } from '.';
import { drawPredictionCircle } from '../ui/PlanningView';

const id = 'Expanding';
const range = 140;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'aoe.png',
    requiresFollowingCard: true,
    description: `
Adds a radius to the spell so it can affect more targets
    `,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      for (let target of [state.castLocation, ...state.targetedUnits]) {
        // Draw visual circle for prediction
        drawPredictionCircle(target, range);
        const withinRadius = window.underworld.getUnitsWithinDistanceOfTarget(
          target,
          range,
          prediction
        );
        // Add units to target
        withinRadius.forEach(unit => addUnitTarget(unit, state));

        const pickupsWithinRadius = window.underworld.getPickupsWithinDistanceOfTarget(
          target,
          range
        );
        // Add pickups to target
        pickupsWithinRadius.forEach(unit => addPickupTarget(unit, state));
      }

      return state;
    },
  },
};
export default spell;
