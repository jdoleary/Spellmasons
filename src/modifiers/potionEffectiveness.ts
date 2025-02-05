import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as config from '../config';
import Underworld from '../Underworld';

export const potionEffectivenessId = 'Potion Effectiveness';
export default function registerPotionEffectiveness() {
  registerModifiers(potionEffectivenessId, {
    description: 'rune_potion_effectiveness',
    unitOfMeasure: '% more effective',
    stage: "Amount Multiplier",
    _costPerUpgrade: 30,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, potionEffectivenessId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, potionEffectivenessId);
      });
    }
  });
  registerEvents(potionEffectivenessId, {
    onPickup: async (unit: Unit.IUnit, pickup: Pickup.IPickup, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[potionEffectivenessId]
      if (modifier) {
        if (pickup.name.includes("Potion")) {
          // Pickup.power determines the effectiveness of the potion, so we multiply it
          pickup.power *= CalcMult(modifier.quantity);
        }
      }
    }
  });
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% more effectiveness
  return 1 + quantity / 100;
}