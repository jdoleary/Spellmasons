import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import Underworld from './Underworld';
import { getUniqueSeedString, randFloat } from "./jmath/rand";
import seedrandom from "seedrandom";

// [quantity]% chance to resurrect a unit on kill
export const onKillRessurectId = 'On Kill Resurrect';
export default function registerOnKillResurrect() {
  registerModifiers(onKillRessurectId, {
    description: 'rune_on_kill_resurrect',
    unitOfMeasure: '%',
    costPerUpgrade: 80,
    quantityPerUpgrade: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, onKillRessurectId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, onKillRessurectId);
      });
    }
  });
  registerEvents(onKillRessurectId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[onKillRessurectId];
      if (modifier) {
        if (killedUnit) {
          const seed = getUniqueSeedString(underworld) + killedUnit.id;
          const chance = Math.min(100, modifier.quantity);
          if (randFloat(0, 100, seedrandom(seed)) < chance) {
            killedUnit.faction = unit.faction;
            Unit.resurrect(killedUnit, underworld);
          }
        }
      }
    }
  });
}