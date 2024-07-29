import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const affinitySoulId = 'Affinity: Soul';

export default function registerAffinitySoul() {
  registerModifiers(affinitySoulId, {
    description: i18n('Soul spells cost [quantity]% less mana'),
    costPerUpgrade: 40,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinitySoulId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
