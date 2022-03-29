import type { Vec2 } from '../Vec';
import { deduplicateTargets, Spell } from '.';
import { drawDryRunCircle } from '../ui/PlanningView';
import { CardType, cardTypeToProbability } from './cardUtils';
import { distance } from '../math';
import * as config from '../config';

const id = 'AOE';
const range = 200;
const type = CardType.Special;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
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
        newTargets = newTargets.concat(withinRadius);
      }
      // Update targets
      state.targets = [...state.targets, ...newTargets];
      deduplicateTargets(state);

      return state;
    },
  },
};
export default spell;
