import { registerEvents, registerModifiers } from "../cards";
import { freezeCardId } from "../cards/freeze";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';

export const icyVeinsId = 'Icy Veins';
export default function registerIcyVeins() {
  registerModifiers(icyVeinsId, {
    description: 'rune_icy_veins',
    unitOfMeasure: '% Damage',
    stage: "Amount Multiplier",
    _costPerUpgrade: 200,
    quantityPerUpgrade: 300,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, icyVeinsId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, icyVeinsId);
      });
    }
  });
  registerEvents(icyVeinsId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[icyVeinsId];
      if (modifier) {
        if (damageReciever && damageReciever.modifiers[freezeCardId]) {
          floatingText({ coords: damageReciever, text: icyVeinsId, prediction });
          return amount * (modifier.quantity / 100);
        } else {
          return amount;
        }
      }

      return amount;
    }
  });
}