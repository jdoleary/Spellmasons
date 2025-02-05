import { registerEvents, registerModifiers } from "../cards";
import { shieldId } from "../cards/shield";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Grants healing over max as a shield at [quantity]% effectiveness
// Such that at 100 quantity, 30 healing over max grants 30 shield
export const overhealId = 'Overheal';
export default function registerOverheal() {
  registerModifiers(overhealId, {
    description: 'rune_overheal',
    unitOfMeasure: '% effectiveness',
    _costPerUpgrade: 50,
    quantityPerUpgrade: 20,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, overhealId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, overhealId);
      });
    }
  });
  registerEvents(overhealId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[overhealId];
      if (modifier) {
        // If the incoming effect is healing
        if (amount < 0) {
          // overheal (aka excess healing): This calculation should happen after
          // all other modifiers that would adjust the incoming healing amount
          const overheal = (unit.health - unit.healthMax) - amount;
          if (overheal > 0) {
            // shieldToGive = overheal * % effectiveness/conversion rate
            const shieldToGive = Math.floor(overheal * CalcMult(modifier.quantity));
            if (shieldToGive != 0) {
              // Grant shield
              Unit.addModifier(unit, shieldId, underworld, prediction, shieldToGive);
            }
          }
        }
      }

      // Does not modify incoming damage/healing otherwise
      return amount;
    }
  });
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% overheal effectiveness
  return quantity / 100;
}