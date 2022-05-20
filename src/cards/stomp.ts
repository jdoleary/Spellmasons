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
      // Draw visual circle for prediction
      drawPredictionCircle(state.casterUnit, range);
      // Push units away
      window.underworld.getUnitsWithinDistanceOfTarget(
        state.casterUnit,
        range,
        prediction
      ).forEach(unit => push(unit, state.casterUnit, prediction));

      window.underworld.getPickupsWithinDistanceOfTarget(
        state.casterUnit,
        range
      ).forEach(p => {
        // Push pickups away
        push(p, state.casterUnit, prediction);
      })

      return state;
    },
  },
};
export default spell;
