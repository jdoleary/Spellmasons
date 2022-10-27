import { getCurrentTargets, Spell } from './index';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { forcePush } from './push';
import { drawUICircle } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const id = 'shove';
export const velocityStartMagnitude = 50;
const shoveRange = config.COLLISION_MESH_RADIUS * 2
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'shove',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconShove.png',
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
      if (targets.length == 0) {
        // No targets to cast on
        // Refund mana
        state.casterUnit.mana += state.aggregator.lastSpellCost;
        if (!prediction) {
          floatingText({ coords: state.casterUnit, text: 'No Targets close enough to shove\nMana Refunded' });
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
