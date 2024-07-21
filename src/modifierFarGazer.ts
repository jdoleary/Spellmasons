import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const runeFarGazerId = 'Far Gazer';

export default function registerFarGazer() {
  registerModifiers(runeFarGazerId, {
    description: i18n('class_far_gazer'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeFarGazerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          player.unit.attackRange *= 2;
          player.unit.staminaMax = Math.floor(player.unit.staminaMax / 2);
        });
      } else {
        console.error(`Cannot add rune ${runeFarGazerId}, no player is associated with unit`);
      }
    },
    cost: 5,
  });
}
