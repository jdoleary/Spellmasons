import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const runeFarGazerId = 'Far Gazer';

export default function registerFarGazer() {
  registerModifiers(runeFarGazerId, {
    description: i18n('class_far_gazer'),
    _costPerUpgrade: 170,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeFarGazerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          //
        });

        const factor = Math.pow(2, quantity);
        player.unit.attackRange *= factor;
        player.unit.staminaMax = player.unit.staminaMax / factor;
        player.unit.stamina = player.unit.staminaMax / factor;
      } else {
        console.error(`Cannot add rune ${runeFarGazerId}, no player is associated with unit`);
      }
    },
  });
}
