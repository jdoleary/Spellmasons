import { IUnit } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { Spell } from './index';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { chooseObjectWithProbability } from '../jmath/rand';
import seedrandom from 'seedrandom';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'Last Will';
const imageName = 'unknown.png';
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number) {
  const modifier = getOrInitModifier(unit, id, { isCurse: false, quantity }, () => {
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
  });
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
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconLastWill.png',
    description: 'spell_last_will',
    timeoutMs: 20,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
        if (!prediction) {
          floatingText({ coords: unit, text: `Added ${id}` });
        }
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
      // Last Will should not stack for balance reasons
      const quantity = 1;
      // Unique for the unit and for quantity and same across all clients due to turn_number and unit.id
      const seed = seedrandom(`${underworld.turn_number} -${unit.id} `);
      for (let i = 0; i < quantity; i++) {
        const coord = underworld.findValidSpawn({ spawnSource: unit, ringLimit: 3, prediction, radius: 32 });
        const choice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => {
          return {
            index, probability: p.name.includes('Potion') ? p.probability : 0
          }
        }), seed);
        if (choice) {
          const { index } = choice;
          if (coord) {
            underworld.spawnPickup(index, coord, prediction);
            if (!prediction) {
              // Notify spawn after a delay so it's appearance doesn't compete with
              // the visuals and the audio of the unit dying
              setTimeout(() => {
                playSFXKey('spawnPotion');
                floatingText({ coords: coord, text: id });
              }, 1300);
            }
          } else {
            console.warn(`Could not find spawn for pickup from ${id} `);
          }
        } else {
          console.warn(`Could not choose valid pickup for ${id}`);

        }
      }

    }
  }
};
export default spell;
