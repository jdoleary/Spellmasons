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

export const id = 'Blood Curse';
export function hasBloodCurse(unit: IUnit): boolean {
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

  const modifier = getOrInitModifier(unit, id, { isCurse: true, quantity: 1 }, () => {
    // Add subsprite image
    Image.addSubSprite(unit.image, imageName);
    // Add event
    unit.onDamageEvents.push(id);

    unit.healthMax *= healthMultiplier;
    unit.health *= healthMultiplier;

    // If unit belongs to player
    const player = underworld.players.find(p => p.unit == unit)
    if (player) {
      addCardToHand(allCards[id], player, underworld);
    }
  });

}
function remove(unit: IUnit, underworld: Underworld) {
  // remove subsprite image
  Image.removeSubSprite(unit.image, id);

  unit.health /= healthMultiplier;
  unit.health = Math.round(unit.health);
  unit.healthMax /= healthMultiplier;
  unit.healthMax = Math.round(unit.healthMax);
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
    description: `A unit cursed with ${id} will receive 2 times their max health but any future healing will be taken as damage`,
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
    // init is noop; not needed to restore bloodcurse
    init: () => { },
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.25,
        y: 0.25,
      },
    },
  },
  events: {
    onDamage: (unit: IUnit, amount: number, _underworld: Underworld, prediction: boolean, damageDealer?: IUnit) => {
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
