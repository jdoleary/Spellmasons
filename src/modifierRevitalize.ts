import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Increases incoming healing by (quantity)%
export const revitalizeId = 'Revitalize';
export default function registerRevitalize() {
  registerModifiers(revitalizeId, {
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, revitalizeId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, revitalizeId);
      });

      if (!prediction) {
        updateTooltip(unit);
      }
    }
  });
  registerEvents(revitalizeId, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[revitalizeId];
      if (modifier) {
        // Will only increase healing (doesn't affect incoming damage)
        if (amount < 0) {
          // Each quantity = 1% healing boost
          amount = Math.ceil(amount * CalcMult(modifier.quantity));
        }
      }

      return amount;
    }
  });
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[revitalizeId];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${CalcMult(modifier.quantity)}x ${i18n('Incoming')} ${i18n('Healing')}`;
  }
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% healing boost
  return 1 + (quantity / 100);
}