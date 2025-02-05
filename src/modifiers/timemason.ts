import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const runeTimemasonId = 'Timemason';

export default function registerTimemason() {
  registerModifiers(runeTimemasonId, {
    description: 'class_timemason',
    _costPerUpgrade: 200,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeTimemasonId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          //
        });

        const factor = Math.pow(2, quantity);
        player.unit.manaMax *= factor;
        player.unit.mana *= factor;
      } else {
        console.error(`Cannot add rune ${runeTimemasonId}, no player is associated with unit`);
      }
    },
  });
}
