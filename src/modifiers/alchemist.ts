import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier, Modifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import * as Pickup from '../entity/Pickup';
import seedrandom from "seedrandom";
import { Vec2 } from "../jmath/Vec";
import { chooseObjectWithProbability, getUniqueSeedString, prng, randFloat } from "../jmath/rand";
import { COLLISION_MESH_RADIUS } from "../config";
import floatingText from "../graphics/FloatingText";
import * as config from '../config';

// [quantity]% chance to summon a potion each turn
export const alchemistId = 'Alchemist';
export default function registerAlchemist() {
  registerModifiers(alchemistId, {
    description: 'rune_alchemist',
    unitOfMeasure: '%',
    _costPerUpgrade: 80,
    quantityPerUpgrade: 20,
    maxUpgradeCount: 4,
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
        const random = seedrandom(`${getUniqueSeedString(underworld)}-${unit.id}`);
        if (randFloat(0, 100, random) < modifier.quantity) {
          const coords = underworld.DEPRECIATED_findValidSpawnInRadius(unit, prediction, { allowLiquid: unit.inLiquid, radiusOverride: config.COLLISION_MESH_RADIUS });
          if (coords) {
            const pickupChoice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => {
              return { index, probability: p.name.includes('Potion') ? p.probability : 0 }
            }), random);

            if (pickupChoice && pickupChoice.index) {
              const pickup = underworld.spawnPickup(pickupChoice.index, coords, prediction);
              if (pickup && !prediction) {
                playSFXKey('spawnPotion');
                floatingText({ coords, text: alchemistId });
              }
            } else {
              console.warn(`Could not choose valid pickup for ${alchemistId}`);
            }
          } else {
            console.error("Alchemist could not find valid spawn");
          }
        }
      }
    }
  });
}