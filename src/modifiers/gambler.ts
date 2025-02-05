import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const runeGamblerId = 'Gambler';

export default function registerGambler() {
  registerModifiers(runeGamblerId, {
    description: i18n('class_gambler'),
    _costPerUpgrade: 70,
    maxUpgradeCount: 2,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeGamblerId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      } else {
        console.error(`Cannot add rune ${runeGamblerId}, no player is associated with unit`);
      }
    },
  });
}
