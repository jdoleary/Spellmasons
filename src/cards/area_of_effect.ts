import type { Vec2 } from '../commonTypes';
import type { Spell } from '.';
import { drawDryRunCircle } from '../ui/PlanningView';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'AOE';
const range = 200;
const type = CardType.Special;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'aoe.png',
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
      let updatedTargets = [...state.targets, ...newTargets];
      // deduplicate
      updatedTargets = updatedTargets.filter((coord, index) => {
        return (
          updatedTargets.findIndex(
            (findCoords) => findCoords.x == coord.x && findCoords.y === coord.y,
          ) === index
        );
      });

      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
