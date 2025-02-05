import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

// Gain 5% of stored SP every level
export const investmentId = 'Investment';
export default function registerInvestment() {
  registerModifiers(investmentId, {
    description: ['rune_investment'],
    unitOfMeasure: '%',
    _costPerUpgrade: 30,
    quantityPerUpgrade: 5,
    maxUpgradeCount: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, investmentId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // NOTE: Logic is hard coded in Player.ts resetPlayerForNextLevel so that it only runs once per level
        Unit.addEvent(unit, investmentId);
      });
    },
  });
}
