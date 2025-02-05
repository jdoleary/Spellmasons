import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const affinityMovementId = 'Affinity: Movement';

export default function registerMovementAffinity() {
  registerModifiers(affinityMovementId, {
    description: ('rune_affinity_movement'),
    unitOfMeasure: '% less mana',
    _costPerUpgrade: 60,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinityMovementId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
