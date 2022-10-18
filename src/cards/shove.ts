import { getCurrentTargets, Spell } from './index';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { forcePush } from './push';
import { drawUICircle } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';

export const id = 'shove';
export const velocityStartMagnitude = 50;
const shoveRange = config.COLLISION_MESH_RADIUS * 2
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'unknown.png',
    description: `
A magical shove!
Shoves the target, hard, away from you.
The target must be within arm's reach.
Note: You can deal damage if a unit is shoved hard enough into a wall.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const awayFrom = state.casterUnit;
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state).filter(t => {
        return distance(state.casterUnit, t) <= shoveRange;
      });
      if (prediction) {
        drawUICircle(state.casterUnit, shoveRange, colors.targetBlue, 'Shove Range');
      }
      for (let entity of targets) {
        promises.push(forcePush(entity, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
