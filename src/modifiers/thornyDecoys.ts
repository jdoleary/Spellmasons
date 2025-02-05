import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

export const runeThornyDecoysId = 'Thorny Decoys';
export default function registerThornyDecoys() {
  registerModifiers(runeThornyDecoysId, {
    description: 'rune_thornydecoys',
    unitOfMeasure: 'Damage',
    _costPerUpgrade: 50,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeThornyDecoysId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      } else {
        console.error(`Cannot add rune ${runeThornyDecoysId}, no player is associated with unit`);
      }
    },
  });
}
