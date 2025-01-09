import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const runeSharpTeethId = 'Sharp Teeth';
export default function registerSharpTeeth() {
  registerModifiers(runeSharpTeethId, {
    description: 'rune_sharpteeth',
    unitOfMeasure: 'Damage',
    _costPerUpgrade: 70,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeSharpTeethId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      } else {
        console.error(`Cannot add rune ${runeSharpTeethId}, no player is associated with unit`);
      }
    },
  });
}
