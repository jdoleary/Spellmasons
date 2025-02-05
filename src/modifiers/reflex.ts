import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const reflexId = 'Reflex';
export default function registerReflex() {
  registerModifiers(reflexId, {
    description: ('rune_reflex'),
    unitOfMeasure: '%',
    _costPerUpgrade: 80,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, reflexId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, reflexId);
      });
    }
  });
  registerEvents(reflexId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[reflexId];
      if (modifier) {
        const addedStamina = Math.round(unit.staminaMax * modifier.quantity / 100);
        unit.stamina += addedStamina;
      }
    }
  });
}