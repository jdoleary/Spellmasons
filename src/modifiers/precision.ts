import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const precisionId = 'Precision';

export default function registerPrecision() {
  registerModifiers(precisionId, {
    description: 'rune_precision',
    _costPerUpgrade: 150,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, precisionId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // exception: logic is in cardUtils.ts
      });
    },
  });
}
