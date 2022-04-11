import { IUnit, takeDamage } from '../Unit';
import * as Image from '../Image';
import { Spell, targetsToUnits } from '.';
import * as Unit from '../Unit';

export const id = 'poison';
function add(unit: IUnit) {
  // Note: Curse can stack multiple times but doesn't keep any state
  // so it doesn't need a first time setup like freeze does

  unit.modifiers[id] = { isCurse: true };
  // Add event
  unit.onTurnStartEvents.push(id);
  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}

const spell: Spell = {
  subsprites: {
    poison: {
      imageName: 'poison.png',
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'poison.png',
    description: `
Poisons all target(s).  Poison will deal 1 base damage every turn
at the start of the unit's turn.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let unit of targetsToUnits(state.targets)) {
        Unit.addModifier(unit, id);
      }
      return state;
    },
  },
  modifiers: {
    add
  },
  events: {
    onTurnStart: async (unit: IUnit) => {
      takeDamage(unit, 1, false, undefined);
      return false;
    },
  },
};
export default spell;
