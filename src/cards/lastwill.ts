import { IUnit } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { Spell } from './index';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { chooseObjectWithProbability } from '../jmath/rand';
import seedrandom from 'seedrandom';
import floatingText from '../graphics/FloatingText';

const id = 'Last Will';
const imageName = 'unknown.png';
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: false,
      quantity
    };
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
  }
  // Temporarily use floating text until spell animation is finished
  if (!prediction) {
    floatingText({ coords: unit, text: id });
  }
}
function remove(unit: IUnit, underworld: Underworld) {
  if (unit.image) {
    // reset the scale
    unit.image.sprite.scale.x = 1.0;
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'unknown.png',
    description: `Drop a random potion on death.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
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
    onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
      // Unique for the unit and for quantity and same across all clients due to turn_number and unit.id
      const seed = seedrandom(`${underworld.turn_number}-${unit.id}`);
      for (let i = 0; i < quantity; i++) {
        const coord = underworld.findValidSpawn(unit, 3, 32);
        const choice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => ({ index, probability: p.name.includes('Potion') ? p.probability : 0 })), seed);
        if (choice) {
          const { index } = choice;
          if (coord) {
            underworld.spawnPickup(index, coord, prediction);
          } else {
            console.warn(`Could not find spawn for pickup from ${id}`);
          }
        } else {
          console.warn(`Could not choose valid pickup for ${id}`);

        }
      }

    }
  }
};
export default spell;
