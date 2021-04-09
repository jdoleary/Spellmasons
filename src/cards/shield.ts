import * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import floatingText from '../FloatingText';

const id = 'shield';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/shield.png',
    probability: 10,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          addTo(unit);
        }
      }
      return state;
    },
  },
  events: {
    onDamage: (unit, amount, damageDealer) => {
      // Only block damage, not heals
      if (amount > 0) {
        floatingText({
          cellX: unit.x,
          cellY: unit.y,
          text: 'Shielded from damage!',
          style: {
            fill: 'blue',
          },
        });

        unit.modifiers[id] && unit.modifiers[id].stacks--;
        if (unit.modifiers[id] && unit.modifiers[id].stacks <= 0) {
          Unit.removeModifier(unit, id);
        }

        // Take no damage
        return 0;
      } else {
        return amount;
      }
    },
  },
  subsprites: {
    shield: {
      imageName: 'images/spell/shield.png',
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

function addTo(unit: Unit.IUnit) {
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
  // Increment the number of stacks of shield
  unit.modifiers[id].stacks = (unit.modifiers[id].stacks || 0) + 1;
}
export default spell;
