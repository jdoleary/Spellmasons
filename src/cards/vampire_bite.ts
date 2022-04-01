import type { IUnit } from '../Unit';
import * as Image from '../Image';
import { allCards, Spell, targetsToUnits } from '.';
import { addCardToHand } from '../CardUI';

const id = 'bite';
export function add(unit: IUnit) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  unit.modifiers[id] = { isCurse: true };
  // Add event
  unit.onDamageEvents.push(id);
  // Add subsprite image
  Image.addSubSprite(unit.image, id);

  // If unit belongs to player
  const player = window.underworld.players.find(p => p.unit == unit)
  if (player) {
    addCardToHand(allCards[id], player);
  }
}

const spell: Spell = {
  subsprites: {
    bite: {
      imageName: 'units/vampire_eyes.png',
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1,
        y: 1,
      },
    },
  },
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 0,
    thumbnail: 'bite.png',
    description: `Turns the victim into a Vampire.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of targetsToUnits(state.targets)) {
        add(unit);
      }
      return state;
    },
  },
  events: {
    onDamage: (unit: IUnit, amount: number, damageDealer?: IUnit) => {
      // Takes healing as damage
      if (amount < 0) {
        return -1 * amount;
      } else {
        // Takes regular damage at half
        return Math.round(amount / 2);

      }
    },
  },
};
export default spell;
