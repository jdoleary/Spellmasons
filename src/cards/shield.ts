import * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import floatingText from '../FloatingText';

const id = 'shield';
const damageBlocked = 6;
const maxStack = 3;
const spell: Spell = {
  card: {
    id,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 1,
    probability: 5,
    thumbnail: 'shield.png',
    description: `
Protects bearer from the next ${damageBlocked} damage that they would incur.  Shield can be stacked up to ${maxStack} times.
    `,
    effect: async (state) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id);
      }
      return state;
    },
  },
  modifiers: { add },
  events: {
    onDamage: (unit, amount, prediction, damageDealer) => {
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
            Unit.removeModifier(unit, id);
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
  subsprites: {
    shield: {
      imageName: 'shield.png',
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
