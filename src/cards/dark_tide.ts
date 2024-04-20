import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import Underworld from '../Underworld';
import { drownCardId } from './drown';

export const darkTideId = 'Dark Tide';
const spell: Spell = {
  card: {
    id: darkTideId,
    category: CardCategory.Curses,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    allowNonUnitTarget: true,
    ignoreRange: true,
    requires: [drownCardId],
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconDrown3.png',
    sfx: 'drown',
    description: ['spell_dark_tide'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: target all living units that are submerged
      const targets = (prediction ? underworld.unitsPrediction : underworld.units).filter(u => u.alive && u.inLiquid);
      if (targets.length) {
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          // playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
        }
        for (let unit of targets) {
          // Adds dark tide modifier, preventing the unit from moving.
          Unit.addModifier(unit, darkTideId, underworld, prediction, quantity);
        }
      } else {
        // No targets to cast on. Refund mana
        refundLastSpell(state, prediction, 'No units are submerged\nMana Refunded')
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Decrement how many turns left the unit is affected by dark tide
      const modifier = unit.modifiers[darkTideId];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit.removeModifier(unit, darkTideId, underworld);
        }
      }
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, darkTideId, { isCurse: true, quantity }, () => {
    unit.onTurnEndEvents.push(darkTideId);
  });
}
export default spell;
