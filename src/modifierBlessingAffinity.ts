import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const blessingAffinityId = 'Blessing Affinity';

export default function registerBlessingAffinity() {
  registerModifiers(blessingAffinityId, {
    description: i18n('Blessing spells cost less mana'),
    costPerUpgrade: 100,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, blessingAffinityId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
