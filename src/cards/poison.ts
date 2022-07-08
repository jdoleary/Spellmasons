import { IUnit, takeDamage } from '../entity/Unit';
import * as Image from '../graphics/Image';
import type { Spell } from '.';
import * as Unit from '../entity/Unit';

export const id = 'poison';
const imageName = 'poison.png'
function add(unit: IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
    };
    // Add event
    if (!unit.onTurnStartEvents.includes(id)) {
      unit.onTurnStartEvents.push(id);
    }
    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of stacks of poison 
  const modifier = unit.modifiers[id];
  if (modifier) {
    modifier.stacks = (modifier.stacks || 0) + 1;
  } else {
    console.error('Poison modifier does not exist')
  }
}

const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'poison.png',
    animationPath: 'spell-effects/spellPoison',
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
    add,
    subsprite: {
      imageName,
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
  events: {
    onTurnStart: async (unit: IUnit, prediction: boolean) => {
      // TODO: There was a bug here where somehow modifiers['poison'] was undefined after i did chain, vulx10, poisonx10
      const modifier = unit.modifiers[id];
      if (modifier) {
        takeDamage(unit, modifier.stacks || 1, prediction, undefined);
      } else {
        console.error('Should have poison modifier on unit but it is missing')
      }
      return false;
    },
  },
};
export default spell;
