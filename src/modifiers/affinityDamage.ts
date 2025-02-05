import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const affinityDamageId = 'Affinity: Damage';

export default function registerDamageAffinity() {
  registerModifiers(affinityDamageId, {
    description: ('rune_affinity_damage'),
    unitOfMeasure: '% less mana',
    _costPerUpgrade: 60,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinityDamageId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
