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
    onDamage: (unit, amount, dryRun, damageDealer) => {
      // Only block damage, not heals
      if (amount > 0) {
        let adjustedAmount = amount;
        if (!dryRun) {
          floatingText({
            coords: unit,
            text: 'Shielded from damage!',
            style: {
              fill: 'blue',
            },
          });
        }
        adjustedAmount = Math.max(0, amount - unit.modifiers[id].damage_block);
        unit.modifiers[id].damage_block -= amount - adjustedAmount;

        if (unit.modifiers[id] && unit.modifiers[id].damage_block <= 0) {
          Unit.removeModifier(unit, id);
        }

        return adjustedAmount;
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
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: false,
    };
    // Add event
    unit.onDamageEvents.push(id);
    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of damage_block on this modifier
  unit.modifiers[id].damage_block = (unit.modifiers[id].damage_block || 0) + damageBlocked;
  const maxBlock = maxStack * damageBlocked;
  if (unit.modifiers[id].damage_block > maxBlock) {
    // Cap how much shield a unit can have
    unit.modifiers[id].damage_block = maxBlock;
    floatingText({ coords: unit, text: `Maximum shield` });
  }
}
export default spell;
