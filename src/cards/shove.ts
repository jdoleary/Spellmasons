import { getCurrentTargets, refundLastSpell, Spell } from './index';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance, forcePushAwayFrom } from '../effects/force_move';

export const shoveCardId = 'shove';
const shoveRange = config.COLLISION_MESH_RADIUS * 2
const spell: Spell = {
  card: {
    id: shoveCardId,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'shove',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconShove.png',
    description: 'spell_shove',
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state).filter(t => {
        // Don't allow for shoving self, only allow shoving if within shoveRange
        return t !== state.casterUnit && distance(state.casterUnit, t) <= shoveRange;
      });
      if (prediction) {
        drawUICirclePrediction(state.casterUnit, shoveRange - config.COLLISION_MESH_RADIUS / 2, colors.targetBlue, 'Shove Range');
      }
      for (let entity of targets) {
        promises.push(forcePushAwayFrom(entity, state.casterUnit, defaultPushDistance * 3 * quantity, underworld, prediction));
      }
      // No targets to cast on. Refund mana
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No Targets close enough to shove')
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
