import { IUnit, takeDamage } from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import * as Unit from '../Unit';

export const id = 'poison';
function add(unit: IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
    };
    // Add event
    unit.onTurnStartEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of stacks of poison 
  unit.modifiers[id].stacks = (unit.modifiers[id].stacks || 0) + 1;
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
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'poison.png',
    description: `
Poisons all target(s).  Poison will deal 1 base damage every turn
at the start of the unit's turn.
    `,
    effect: async (state) => {
      for (let unit of state.targetedUnits) {
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
      // TODO: There was a bug here where somehow modifiers['poison'] was undefined after i did chain, vulx10, poisonx10
      takeDamage(unit, unit.modifiers[id].stacks || 1, false, undefined);
      return false;
    },
  },
};
export default spell;
