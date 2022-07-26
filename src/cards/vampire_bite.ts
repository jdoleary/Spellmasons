import type { IUnit } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { allCards, Spell } from './index';
import { addCardToHand, removeCardsFromHand } from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';

export const id = 'Exsanguinate';
export function isVampire(unit: IUnit): boolean {
  return Object.keys(unit.modifiers).some(m => m === id)
}
const healthMultiplier = 2;
function add(unit: IUnit, underworld: Underworld) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  // Do NOT apply this curse more than once, otherwise you could double
  // your health more than once
  if (unit.modifiers[id]) {
    return;
  }

  unit.modifiers[id] = { isCurse: true };
  // Add event
  unit.onDamageEvents.push(id);

  unit.healthMax *= healthMultiplier;
  unit.health *= healthMultiplier;

  // If unit belongs to player
  const player = underworld.players.find(p => p.unit == unit)
  if (player) {
    addCardToHand(allCards[id], player, underworld);
  }
}
function remove(unit: IUnit, underworld: Underworld) {
  // remove subsprite image
  Image.removeSubSprite(unit.image, id);

  unit.health /= healthMultiplier;
  unit.health = Math.round(unit.health);
  unit.healthMax /= healthMultiplier;
  unit.healthMax = Math.round(unit.healthMax);

  // If unit belongs to player
  const player = underworld.players.find(p => p.unit == unit)
  if (player) {
    removeCardsFromHand(player, [id], underworld);
  }

}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 0,
    thumbnail: 'bite.png',
    description: `Turns the victim into a Vampire.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: undefined,
  },
  events: {
    onDamage: (unit: IUnit, amount: number, _underworld: Underworld, prediction: boolean, damageDealer?: IUnit) => {
      // Takes healing as damage
      if (amount < 0) {
        return -1 * amount;
      } else {
        // Takes regular damage just as damage
        return amount;
      }
    },
  },
};
export default spell;
