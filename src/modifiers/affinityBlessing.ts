import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const affinityBlessingId = 'Affinity: Blessing';

export default function registerBlessingAffinity() {
  registerModifiers(affinityBlessingId, {
    description: ('rune_affinity_blessing'),
    unitOfMeasure: '% less mana',
    _costPerUpgrade: 60,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinityBlessingId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
