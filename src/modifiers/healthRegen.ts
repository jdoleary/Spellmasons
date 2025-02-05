import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import { healUnit } from "../effects/heal";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Regenerates [quantity] health at the start of each turn
export const healthRegenId = 'Health Regen';
export default function registerHealthRegen() {
  registerModifiers(healthRegenId, {
    description: ('rune_health_regen'),
    unitOfMeasure: 'Health Regen',
    _costPerUpgrade: 20,
    quantityPerUpgrade: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, healthRegenId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, healthRegenId);
      });

    }
  });
  registerEvents(healthRegenId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[healthRegenId];
      if (modifier) {
        healUnit(unit, modifier.quantity, unit, underworld, prediction);
      }
    }
  });
}
