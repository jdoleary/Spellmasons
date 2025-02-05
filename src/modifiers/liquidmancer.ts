import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

//   IMPLEMENTED IN:   inLiquid.ts doLiquidEffect()
export const liquidmancerId = 'Liquidmancer';
export default function registerLiquidmancer() {
  registerModifiers(liquidmancerId, {
    description: ('rune_liquidmancer'),
    unitOfMeasure: '% Damage',
    _costPerUpgrade: 100,
    quantityPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, liquidmancerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //Unit.addEvent(unit, liquidmancerId);
      });
    }
  });
}