import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import { healUnit } from "../effects/heal";
import * as Unit from '../entity/Unit';
import { bountyId } from "./bounty";
import { bountyHunterId } from "./bountyHunter";
import Underworld from '../Underworld';

export const bountyDamageId = 'Bounty: Extra Damage';
export default function registerBountyDamage() {
  registerModifiers(bountyDamageId, {
    description: ('rune_bounty_damage'),
    unitOfMeasure: '% Damage',
    stage: "Amount Multiplier",
    _costPerUpgrade: 100,
    quantityPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyDamageId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyDamageId);
      });
    }
  });
  registerEvents(bountyDamageId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[bountyDamageId];
      if (modifier) {
        // Only boost damage against bounty targets
        if (damageReciever && damageReciever.modifiers[bountyId]) {
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