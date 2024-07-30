import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

//   IMPLEMENTED IN:   inLiquid.ts doLiquidEffect()
export const liquidmancerId = 'Liquidmancer';
export default function registerLiquidmancer() {
  registerModifiers(liquidmancerId, {
    description: 'All units take [quantity]% more damage from liquid',
    costPerUpgrade: 100,
    quantityPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, liquidmancerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //Unit.addEvent(unit, liquidmancerId);
      });
    }
  });
}