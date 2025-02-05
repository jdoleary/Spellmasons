import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const modifierBasePierceId = 'Default Pierce';
export default function registerBasePierce() {
  registerModifiers(modifierBasePierceId, {
    description: ('rune_base_pierce'),
    unitOfMeasure: 'Units',
    _costPerUpgrade: 80,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, modifierBasePierceId, { isCurse: false, quantity, keepOnDeath: true }, () => {
      });
    }
  });
}