import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const runeHardenedMinionsId = 'Hardened Minions';
export default function registerHardenedMinions() {
  registerModifiers(runeHardenedMinionsId, {
    description: 'rune_hardenedminions',
    unitOfMeasure: 'Health',
    _costPerUpgrade: 50,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeHardenedMinionsId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      } else {
        console.error(`Cannot add rune ${runeHardenedMinionsId}, no player is associated with unit`);
      }
    },
  });
}
