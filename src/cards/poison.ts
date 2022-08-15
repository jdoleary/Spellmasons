import { IUnit, takeDamage } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';

export const id = 'poison';
const imageName = 'poison.png'
function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
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
    modifier.stacks = (modifier.stacks || 0) + quantity;
  } else {
    console.error('Poison modifier does not exist')
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconPoison.png',
    animationPath: 'spell-effects/spellPoison',
    description: `
Poisons all target(s).  Poison will deal 1 base damage every turn
at the start of the unit's turn.
"Poison" can be cast multiple times in succession to stack it's effect.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      await Promise.all([playDefaultSpellAnimation(card, state.targetedUnits, prediction), playDefaultSpellSFX(card, prediction)]);
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
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
    onTurnStart: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      // TODO: There was a bug here where somehow modifiers['poison'] was undefined after i did chain, vulx10, poisonx10
      const modifier = unit.modifiers[id];
      // Don't take damage on prediction because it is confusing for people to see the prediction damage that poison will do,
      // they assume prediction damage is only from their direct cast, not including the start of the next turn
      if (!prediction) {
        if (modifier) {
          takeDamage(unit, modifier.stacks || 1, unit, underworld, prediction, undefined);
        } else {
          console.error('Should have poison modifier on unit but it is missing')
        }
      }
      return false;
    },
  },
};
export default spell;
