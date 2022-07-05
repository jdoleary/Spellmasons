import type { Spell } from '.';
import { drawPredictionCircle } from '../ui/PlanningView';
import { forcePush } from './push';

const id = 'stomp';
const range = 140;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'stomp.png',
    description: `Pushes units away from caster`,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
      // Draw visual circle for prediction
      drawPredictionCircle(state.casterUnit, range);
      // Push units away
      const unitPushPromises = window.underworld.getUnitsWithinDistanceOfTarget(
        state.casterUnit,
        range,
        prediction
      ).map(unit => forcePush(unit, state.casterUnit, prediction));

      // Push pickups away
      const pickupPushPromises = window.underworld.getPickupsWithinDistanceOfTarget(
        state.casterUnit,
        range
      ).map(p => forcePush(p, state.casterUnit, prediction))
      await Promise.all([...unitPushPromises, ...pickupPushPromises]);
      return state;
    },
  },
};
export default spell;
