import * as Unit from '../Unit';
import * as Image from '../Image';
import { Spell, targetsToUnits } from '.';

const id = 'vulnerable';
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    probability: 10,
    thumbnail: 'vulnerable.png',
    description: `
Makes the target(s) take double damage whenever they receive damage
in the future.
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
    onDamage: (unit, amount, damageDealer) => {
      // Magnify positive damage
      if (amount > 0) {
        return amount * 2;
      } else {
        return amount;
      }
    },
  },
  subsprites: {
    vulnerable: {
      imageName: 'vulnerable.png',
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
  // Add event
  unit.onDamageEvents.push(id);

  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}
export default spell;
