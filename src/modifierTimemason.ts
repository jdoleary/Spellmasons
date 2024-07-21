import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const runeTimemasonId = 'Timemason';

export default function registerTimemason() {
  registerModifiers(runeTimemasonId, {
    description: i18n('class_timemason'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeTimemasonId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          player.unit.manaMax *= 2;
        });
      } else {
        console.error(`Cannot add rune ${runeTimemasonId}, no player is associated with unit`);
      }
    },
    cost: 5,
  });
}
