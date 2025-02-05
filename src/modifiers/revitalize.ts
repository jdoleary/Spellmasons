import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import * as Cards from '../cards';

// Increases incoming healing by [quantity]%
export const revitalizeId = 'Revitalize';
const QUANTITY_PER_UPGRADE = 20;
export default function registerRevitalize() {
  registerModifiers(revitalizeId, {
    unitOfMeasure: '%',
    description: i18n('revitalize_description'),
    stage: "Amount Multiplier",
    _costPerUpgrade: 40,
    quantityPerUpgrade: QUANTITY_PER_UPGRADE,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, revitalizeId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, revitalizeId);
      });
    }
  });
  registerEvents(revitalizeId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[revitalizeId];
      if (modifier) {
        // Will only increase healing (doesn't affect incoming damage)
        if (amount < 0) {
          // Each quantity = 1% healing boost
          amount *= CalcMult(modifier.quantity);
        }
      }

      return amount;
    }
  });
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% healing boost
  // toFixed() prevents floating point errors
  return parseFloat((1 + (quantity / 100)).toFixed(2));
}