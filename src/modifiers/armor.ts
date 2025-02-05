import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Reduces incoming damage by [quantity]
export const armorId = 'Armor';
export default function registerArmor() {
  registerModifiers(armorId, {
    description: ('rune_armor'),
    unitOfMeasure: 'Armor',
    stage: "Amount Flat",
    _costPerUpgrade: 20,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, armorId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, armorId);
      });
    }
  });
  registerEvents(armorId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[armorId];
      if (modifier) {
        // Will only reduce damage (doesn't affect healing)
        if (amount > 0) {
          // Cannot reduce incoming damage below 1
          amount = Math.max(amount - modifier.quantity, 1);
        }
      }

      return amount;
    }
  });
}