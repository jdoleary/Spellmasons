import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as Pickup from './entity/Pickup';
import * as config from './config';
import Underworld from './Underworld';
import { shieldId } from "./cards/shield";

export const potionBarrierId = 'Potion Barrier';
export default function registerPotionBarrier() {
  registerModifiers(potionBarrierId, {
    description: 'Picking up a potion grants [quantity] shield, scaling with pickup power',
    costPerUpgrade: 20,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, potionBarrierId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, potionBarrierId);
      });
    }
  });
  registerEvents(potionBarrierId, {
    onPickup: async (unit: Unit.IUnit, pickup: Pickup.IPickup, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[potionBarrierId]
      if (modifier) {
        if (pickup.name.includes("Potion")) {
          const shieldToAdd = Math.floor(modifier.quantity * pickup.power);
          if (shieldToAdd > 0) {
            Unit.addModifier(unit, shieldId, underworld, prediction, shieldToAdd);
          }
        }
      }
    }
  });
}