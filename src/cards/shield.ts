import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';

const id = 'shield';
const imageName = 'shield.png';
const damageBlocked = 3;
const maxStack = 1;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'shield.png',
    animationPath: 'spell-effects/spellShield',
    description: `
Protects bearer from the next ${damageBlocked} damage that they would incur.
    `,
    effect: async (state, underworld) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld);
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
    onDamage: (unit, amount, underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        // Only block damage, not heals
        if (amount > 0) {
          let adjustedAmount = amount;
          if (!prediction) {
            floatingText({
              coords: unit,
              text: 'Shielded from damage!',
              style: {
                fill: 'blue',
              },
            });
          }
          adjustedAmount = Math.max(0, amount - modifier.damage_block);
          modifier.damage_block -= amount - adjustedAmount;

          if (modifier && modifier.damage_block <= 0) {
            Unit.removeModifier(unit, id, underworld);
          }

          return adjustedAmount;
        } else {
          return amount;
        }
      } else {
        return amount;
      }
    },
  },

};

function add(unit: Unit.IUnit) {
  // First time setup
  let modifier = unit.modifiers[id];
  if (!modifier) {
    unit.modifiers[id] = {
      isCurse: false,
    };
    // Add event
    unit.onDamageEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  modifier = unit.modifiers[id];
  if (modifier) {

    // Increment the number of damage_block on this modifier
    modifier.damage_block = (modifier.damage_block || 0) + damageBlocked;
    const maxBlock = maxStack * damageBlocked;
    if (modifier.damage_block > maxBlock) {
      // Cap how much shield a unit can have
      modifier.damage_block = maxBlock;
      floatingText({ coords: unit, text: `Maximum shield` });
    }
  }
}
export default spell;
