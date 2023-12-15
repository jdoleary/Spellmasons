import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as Vec from '../jmath/Vec';
import * as Obstacle from '../entity/Obstacle';
import { CardCategory } from '../types/commonTypes';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { swap_id } from './swap';

const id = 'teleport';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    sfx: 'swap',
    requires: [swap_id],
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 1,
    allowNonUnitTarget: true,
    thumbnail: 'spellIconTeleport.png',
    description: 'spell_teleport',
    effect: async (state, card, quantity, underworld, prediction) => {
      playDefaultSpellSFX(card, prediction);

      let targets: Vec2[] = getCurrentTargets(state)
      if (targets.length == 0) {
        targets = [state.castLocation];
      }
      for (let target of targets) {
        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(target);
        }
        Unit.setLocation(state.casterUnit, target);
        Obstacle.tryFallInOutOfLiquid(state.casterUnit, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
