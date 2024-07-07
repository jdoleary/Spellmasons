import type { IUnit } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { allCards, Spell } from './index';
import { addCardToHand } from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { suffocateCardId, updateSuffocate } from './suffocate';

export const id = 'Blood Curse';
export function hasBloodCurse(unit: IUnit): boolean {
  return Object.keys(unit.modifiers).some(m => m === id)
}
const healthMultiplier = 2;
function add(unit: IUnit, underworld: Underworld, prediction: boolean) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  // Do NOT apply this curse more than once, otherwise you could double
  // your health more than once
  if (unit.modifiers[id]) {
    return;
  }

  getOrInitModifier(unit, id, { isCurse: true, quantity: 1 }, () => {
    // Add event
    Unit.addEvent(unit, id);
    // This is done in first time setup because the modified stats are stored on the unit
    // otherwise it would apply the multiplier each time the unit is loaded
    unit.healthMax = Math.floor(unit.healthMax * healthMultiplier);
    unit.health = Math.floor(unit.health * healthMultiplier);
  });

  if (!prediction) {
    updateTooltip(unit);
  }

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, prediction);
  }
}

function remove(unit: IUnit, underworld: Underworld) {
  // Health should not go below 1
  unit.healthMax = Math.max(1, Math.floor(unit.healthMax / healthMultiplier));
  unit.health = Math.max(1, Math.floor(unit.health / healthMultiplier));
}


export function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[id]) {
    // Set tooltip:
    unit.modifiers[id].tooltip = `Blood Curse`;
  }
}

const imageName = 'spellIconBloodCurse.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: imageName,
    description: ['spell_blood_curse'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        Unit.addModifier(unit, id, underworld, prediction);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
  },
  events: {
    onTakeDamage: (unit: IUnit, amount: number, _underworld: Underworld, prediction: boolean, damageDealer?: IUnit) => {
      // Takes healing as damage
      if (amount < 0) {
        if (!prediction) {
          floatingText({ coords: unit, text: 'Blood Curse Damage!' });
        }
        return -1 * amount;
      } else {
        // Takes regular damage just as damage
        return amount;
      }
    },
  },
};
export default spell;