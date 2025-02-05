import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const affinityTargeting = 'Affinity: Targeting';

export default function registerTargetingAffinity() {
  registerModifiers(affinityTargeting, {
    description: ('rune_affinity_targeting'),
    unitOfMeasure: '% less mana',
    _costPerUpgrade: 60,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinityTargeting, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
