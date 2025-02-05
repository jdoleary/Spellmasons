import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import { distance } from "../jmath/math";
import Underworld from '../Underworld';

export const bruteId = 'Melee Specialist';
const radius = 0.25;
export default function registerMeleeSpecialist() {
  registerModifiers(bruteId, {
    description: ['rune_melee_specialist', Math.floor(100 * radius).toString() + '%'],
    unitOfMeasure: '% Damage',
    stage: "Amount Multiplier",
    _costPerUpgrade: 100,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bruteId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, bruteId);
      });
    }
  });
  registerEvents(bruteId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[bruteId];
      if (modifier) {
        // Only boost damage against bounty targets
        if (damageReciever && distance(damageReciever, damageDealer) <= damageDealer.attackRange * radius) {
          // +1% damage per quantity
          amount *= CalcMult(modifier.quantity);
        }
      }

      return amount;
    }
  });
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% damage boost
  // toFixed() prevents floating point errors
  return parseFloat((1 + (quantity / 100)).toFixed(2));
}