import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Your damage spells heal allies instead of dealing damage
export const bloodLettingId = 'Blood Letting';
export default function registerBlackCoin() {
  registerModifiers(bloodLettingId, {
    description: ('rune_blood_letting'),
    _costPerUpgrade: 100,
    unitOfMeasure: '% effectiveness',
    quantityPerUpgrade: 20,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bloodLettingId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, bloodLettingId);
      });
    }
  });
  registerEvents(bloodLettingId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[bloodLettingId];
      if (modifier && amount > 0 && damageDealer.faction === damageReciever?.faction) {
        // Convert damage to healing
        return amount * -1 * (modifier.quantity / 100);
      }
      return amount;
    }
  });
}