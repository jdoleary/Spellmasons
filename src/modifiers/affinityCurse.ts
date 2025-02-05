import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const affinityCurseId = 'Affinity: Curse';

export default function registerCurseAffinity() {
  registerModifiers(affinityCurseId, {
    description: ('rune_affinity_curse'),
    unitOfMeasure: '% less mana',
    _costPerUpgrade: 60,
    quantityPerUpgrade: 10,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, affinityCurseId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //
      });
    },
  });
}
