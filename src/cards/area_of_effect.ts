import type { Vec2 } from '../Vec';
import type { Spell } from '.';
import { drawDryRunCircle } from '../ui/PlanningView';

const id = 'AOE';
const range = 200;
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'aoe.png',
    requiresFollowingCard: true,
    description: `
Adds targets for the following cards to effect by "growing" existing targets
    `,
    effect: async (state, dryRun) => {
      let newTargets: Vec2[] = [];
      for (let target of state.targets) {
        const withinRadius = window.underworld.getCoordsForUnitsWithinDistanceOfTarget(
          target,
          range,
        );
        // Draw visual circle for dryRun
        drawDryRunCircle(target, range);
        newTargets.push(...withinRadius);
      }
      // Update targets
      state.targets = [...state.targets, ...newTargets];

      return state;
    },
  },
};
export default spell;
