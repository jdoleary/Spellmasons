import { registerEvents, registerModifiers } from "../cards";
import { freezeCardId } from "../cards/freeze";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';

export const witchBaneId = 'Witch Bane';
export default function registerWitchBane() {
  registerModifiers(witchBaneId, {
    description: 'rune_witch_bane',
    unitOfMeasure: '% Damage',
    stage: "Amount Multiplier",
    _costPerUpgrade: 50,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 20,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, witchBaneId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, witchBaneId);
      });
    }
  });
  registerEvents(witchBaneId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      const modifier = damageDealer.modifiers[witchBaneId];
      if (modifier) {
        if (damageReciever && damageReciever.manaMax > 0) {
          floatingText({ coords: damageReciever, text: `${i18n(witchBaneId)}: +${modifier.quantity}% ${i18n('Damage')}`, prediction });
          return amount * (1 + (modifier.quantity / 100));
        } else {
          return amount;
        }
      }

      return amount;
    }
  });
}