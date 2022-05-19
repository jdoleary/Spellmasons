import type { Spell } from '.';
import { drawPredictionCircle } from '../ui/PlanningView';
import { push } from './push';

const id = 'stomp';
const range = 200;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'stomp.png',
    description: `Pushes units away from caster`,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      for (let _ of [state.castLocation, ...state.targetedUnits]) {
        // Draw visual circle for prediction
        drawPredictionCircle(state.casterUnit, range);
        const withinRadius = window.underworld.getUnitsWithinDistanceOfTarget(
          state.casterUnit,
          range,
          prediction
        );
        // Add units to target
        withinRadius.forEach(unit => push(unit, state.casterUnit, prediction));
      }

      return state;
    },
  },
};
export default spell;
