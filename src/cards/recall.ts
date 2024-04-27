import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { addTarget, getCurrentTargets, refundLastSpell, Spell } from './index';
import type { Vec2 } from '../jmath/Vec';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import Underworld from '../Underworld';
import { prng } from '../jmath/rand';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as config from '../config';
import { teleport } from '../effects/teleport';
import { distance } from '../jmath/math';
import { isOutOfBounds } from '../graphics/PlanningView';

const recallId = 'recall';
const spell: Spell = {
  card: {
    id: recallId,
    category: CardCategory.Movement,
    supportQuantity: false,
    sfx: 'swap',
    manaCost: 15,
    healthCost: 0,
    probability: probabilityMap[CardRarity.UNCOMMON],
    expenseScaling: 1,
    thumbnail: 'spellIconRecall.png',
    description: 'spell_recall',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      // If there is a mark on the ground, recall all targets to it
      // Else place a mark at the target location

      // Find the closest mark
      const mark = (prediction ? underworld.pickupsPrediction : underworld.pickups)
        .filter(p => !p.flaggedForRemoval && p.name == Pickup.RECALL_POINT)
        .sort((a, b) => distance(a, state.casterUnit) - distance(b, state.casterUnit))[0];

      if (mark) {
        // Remove all recall points from target list,
        // we don't want to recall a mark to itself or to another mark
        const targets = getCurrentTargets(state).filter(t => !(Pickup.isPickup(t) && t.name == Pickup.RECALL_POINT));
        if (targets.length == 0) targets.push(state.casterUnit);

        // Teleport all targets to the mark
        for (let target of targets) {
          teleport(target, mark, underworld, prediction, true);
        }

        // Remove mark
        Pickup.removePickup(mark, underworld, prediction);
      } else {
        const target = state.castLocation;

        if (underworld.isCoordOnWallTile(target) || isOutOfBounds(target, underworld)) {
          console.warn("Can't place mark out of bounds");
          refundLastSpell(state, prediction, "Can't place mark out of bounds")
          return state;
        } else {
          const pickupSource = Pickup.pickups.find(p => p.name == Pickup.RECALL_POINT);
          if (pickupSource) {
            const pickupInst = Pickup.create({
              pos: target,
              pickupSource,
              logSource: 'recall.ts'
            }, underworld, prediction);
            addTarget(pickupInst, state, underworld);
          }
        }
      }
      playDefaultSpellSFX(card, prediction);
      return state;
    },
  },
};
export default spell;
