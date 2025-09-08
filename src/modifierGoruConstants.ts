import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Player from './entity/Player';
import * as Unit from './entity/Unit';
import * as config from './config';
import Underworld from './Underworld';

export const soulCapacityId = 'Increase Soul Capacity'
export function registerSoulCapacity() {
  registerModifiers(soulCapacityId, {
    description: `soul-capacity-desc`,
    unitOfMeasure: 'Soul Collection Capacity per Turn',
    _costPerUpgrade: 50,
    quantityPerUpgrade: 5,
    constant: true,
    omitForWizardType: ['Deathmason', 'Spellmason'],
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const modifier = getOrInitModifier(unit, soulCapacityId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      if (modifier) {
        const startingMax = unit.soulLeftToCollectMax || 0;
        unit.soulLeftToCollectMax = config.BASE_SOULS_LEFT_TO_COLLECT + quantity
        const delta = unit.soulLeftToCollectMax - startingMax;
        if (isNullOrUndef(unit.soulLeftToCollect)) {
          unit.soulLeftToCollect = 0;
        }
        unit.soulLeftToCollect += delta;

      }
    },
    probability: 0,
  });
}
