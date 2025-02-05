import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import { healManaUnit, healUnit } from "../effects/heal";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Restores [quantity] mana on kill
export const onKillManaId = 'Mana on Kill';
export default function registerOnKillMana() {
  registerModifiers(onKillManaId, {
    description: 'rune_on_kill_mana',
    unitOfMeasure: 'Mana',
    _costPerUpgrade: 20,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, onKillManaId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, onKillManaId);
      });
    }
  });
  registerEvents(onKillManaId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[onKillManaId];
      if (modifier) {
        if (killedUnit) {
          healManaUnit(unit, modifier.quantity, unit, underworld, prediction);
        }
      }
    }
  });
}