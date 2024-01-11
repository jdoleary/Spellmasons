import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { getCurrentTargets, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as Vec from '../jmath/Vec';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { HasSpace } from '../entity/Type';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { swap_id } from './swap';
import { teleport } from '../effects/teleport';

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
        teleport(state.casterUnit, target, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
