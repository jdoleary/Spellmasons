import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

// Inflicting poison also inflicts slow [quantity] times
export const heavyToxinsId = 'Heavy Toxins';
export default function registerHeavyToxins() {
  registerModifiers(heavyToxinsId, {
    description: 'rune_heavy_toxins',
    costPerUpgrade: 40,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, heavyToxinsId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // No init
      });
    },
  });
}