import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

//   IMPLEMENTED IN:   underworld.ts forcemove()
export const heavyImpactsId = 'Heavy Impacts';
export default function registerHeavyImpacts() {
  registerModifiers(heavyImpactsId, {
    description: ('rune_heavy_impact'),
    unitOfMeasure: 'Damage',
    _costPerUpgrade: 100,
    quantityPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, heavyImpactsId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        //Unit.addEvent(unit, liquidmancerId);
      });
    }
  });
}