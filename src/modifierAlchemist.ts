import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier, Modifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Pickup from './entity/Pickup';
import seedrandom from "seedrandom";
import { Vec2 } from "./jmath/Vec";
import { chooseObjectWithProbability, prng, randFloat } from "./jmath/rand";
import { COLLISION_MESH_RADIUS } from "./config";
import floatingText from "./graphics/FloatingText";

// Summon [quantity] potions each turn
export const alchemistId = 'Alchemist';
export default function registerAlchemist() {
  registerModifiers(alchemistId, {
    description: 'rune_alchemist',
    costPerUpgrade: 120,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, alchemistId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, alchemistId);
      });
    },
  });
  registerEvents(alchemistId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[alchemistId];
      if (modifier && unit.alive) {
        spawnPotions(unit, modifier.quantity, underworld, prediction);
      }
    },
    onSpawn: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[alchemistId];
      if (modifier && unit.alive) {
        spawnPotions(unit, modifier.quantity, underworld, prediction);
      }
    }
  });
}

function spawnPotions(unit: Unit.IUnit, quantity: number, underworld: Underworld, prediction: boolean) {
  const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
  // Summon quantity potions
  for (let i = 0; i < quantity; i++) {
    const coords = findRandomSummonLocation(unit, unit.attackRange / 2, underworld, prediction, seed)
    if (coords) {
      const choice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => {
        return { index, probability: p.name.includes('Potion') ? p.probability : 0 }
      }), seed);

      if (choice && choice.index) {
        underworld.spawnPickup(choice.index, coords, prediction);
        if (!prediction) {
          playSFXKey('spawnPotion');
          floatingText({ coords, text: alchemistId });
        }
      } else {
        console.warn(`Could not choose valid pickup for ${alchemistId}`);
      }
    } else {
      console.log("Alchemist could not find valid spawn");
    }
  }
}

export function findRandomSummonLocation(unit: Unit.IUnit, radius: number, underworld: Underworld, prediction: boolean, seed: prng): Vec2 | undefined {
  let randomCoord = undefined;
  for (let i = 0; i < 100; i++) {
    // Generate a random angle in radians
    const angle = randFloat(0, 2 * Math.PI);
    const distance = randFloat(COLLISION_MESH_RADIUS * 2, radius);

    // Set coordinate based on dir and distance
    randomCoord = {
      x: unit.x + (distance * Math.cos(angle)),
      y: unit.y + (distance * Math.sin(angle)),
    }

    // If coordinate is a valid spawn, break loop
    if (underworld.isPointValidSpawn(randomCoord, COLLISION_MESH_RADIUS, prediction)) {
      break;
    }
  }

  if (randomCoord == undefined) {
    console.warn('Could not find valid spawn point for golem, returning summoner position');
    randomCoord = { x: unit.x, y: unit.y }
  }

  return randomCoord;
}