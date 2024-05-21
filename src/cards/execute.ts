import * as Unit from '../entity/Unit';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { refundLastSpell, Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import { drawUICirclePrediction } from '../graphics/PlanningView';

export const executeCardId = 'Execute';
const executeThreshold = 0.50;
const executeRange = config.COLLISION_MESH_RADIUS * 2
const spell: Spell = {
  card: {
    id: executeCardId,
    category: CardCategory.Damage,
    supportQuantity: false,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconExecution.png',
    // no animation path, animation is done with particles
    animationPath: '',
    sfx: '',
    description: ['spell_execute', `${(executeThreshold * 100).toString()}%`],
    timeoutMs: 100,
    effect: async (state, card, quantity, underworld, prediction) => {

      // Only target units under execute threshold and in range
      const targets = state.targetedUnits.filter(u =>
        u.alive &&
        u.health / u.healthMax <= executeThreshold &&
        distance(u, state.casterUnit) < executeRange);

      if (prediction) {
        drawUICirclePrediction(state.casterUnit, executeRange - config.COLLISION_MESH_RADIUS / 2, colors.targetBlue, 'Execute Range');
      }

      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No targets damaged, mana refunded');
      }

      playDefaultSpellSFX(card, prediction);
      for (let unit of targets) {
        if (!prediction) {
          // VFX
        }
        Unit.die(unit, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
