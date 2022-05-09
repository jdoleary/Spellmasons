import { addUnitTarget, Spell } from '.';
import { drawDryRunCircle } from '../ui/PlanningView';

const id = 'AOE';
const range = 200;
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
    effect: async (state, dryRun) => {
      for (let target of [state.castLocation, ...state.targetedUnits]) {
        // Draw visual circle for dryRun
        drawDryRunCircle(target, range);
        const withinRadius = window.underworld.getUnitsWithinDistanceOfTarget(
          target,
          range,
          dryRun
        );
        // Add units to target
        withinRadius.forEach(unit => addUnitTarget(unit, state));
      }

      return state;
    },
  },
};
export default spell;
