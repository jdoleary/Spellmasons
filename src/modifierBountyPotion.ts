import seedrandom from "seedrandom";
import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as Pickup from './entity/Pickup';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';
import { chooseObjectWithProbability, getUniqueSeedString, randFloat } from "./jmath/rand";
import floatingText from "./graphics/FloatingText";
import { COLLISION_MESH_RADIUS } from "./config";

// Claiming a bounty will drop a powerful potion
export const bountyPotionId = 'Bounty: Potion';
export default function registerBountyPotion() {
  registerModifiers(bountyPotionId, {
    description: ('rune_bounty_potion'),
    unitOfMeasure: 'Potion Power',
    costPerUpgrade: 40,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyPotionId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyPotionId);
      });
    }
  });
  registerEvents(bountyPotionId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyPotionId];
      if (modifier) {
        // Only drop a potion if the killed unit has a bounty
        if (killedUnit.modifiers[bountyId]) {
          const random = seedrandom(`${getUniqueSeedString(underworld)}-${killedUnit.id}`);
          const coords = underworld.findValidSpawnInRadius(killedUnit, prediction, random, { maxRadius: COLLISION_MESH_RADIUS * 2, allowLiquid: killedUnit.inLiquid });
          if (coords) {
            const pickupChoice = chooseObjectWithProbability(Pickup.pickups.map((p, index) => {
              return { index, probability: p.name.includes('Potion') ? p.probability : 0 }
            }), random);

            if (pickupChoice && pickupChoice.index) {
              const pickup = underworld.spawnPickup(pickupChoice.index, coords, prediction);
              if (pickup) {
                Pickup.setPower(pickup, modifier.quantity);
                if (!prediction) {
                  playSFXKey('spawnPotion');
                  floatingText({ coords, text: bountyPotionId });
                }
              }
            } else {
              console.warn(`Could not choose valid pickup for ${bountyPotionId}`);
            }
          } else {
            console.log("Bount: Potion could not find valid spawn");
          }
        }
      }
    }
  });
}