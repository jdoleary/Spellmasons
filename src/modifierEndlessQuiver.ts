import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const endlessQuiverId = 'Endless Quiver';

export default function registerEndlessQuiver() {
  registerModifiers(endlessQuiverId, {
    description: i18n('Arrows have no expense scaling'),
    costPerUpgrade: 200,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, endlessQuiverId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // 
      });
    },
  });
}
