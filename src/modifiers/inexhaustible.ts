import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const inexhaustibleId = 'Inexhaustible';

export default function registerInexhaustible() {
  registerModifiers(inexhaustibleId, {
    description: 'rune_inexhaustible',
    _costPerUpgrade: 200,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, inexhaustibleId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // 
      });
    },
  });
}
