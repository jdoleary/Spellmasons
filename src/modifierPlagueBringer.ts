import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import Underworld from './Underworld';
import { chooseOneOfSeeded, getUniqueSeedString, randInt } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import { poisonCardId } from "./cards/poison";
import seedrandom from "seedrandom";

// Poisons [quantity] random enemy units on spawn
export const plagueBringerId = 'Plague Bringer';
export default function registerPlagueBringer() {
  registerModifiers(plagueBringerId, {
    description: i18n('rune_plague_bringer'),
    costPerUpgrade: 40,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, plagueBringerId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, plagueBringerId);
      });
    }
  });
  registerEvents(plagueBringerId, {
    onSpawn: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[plagueBringerId];
      if (modifier) {
        for (let i = 0; i < modifier.quantity; i++) {
          poisonRandomEnemyUnit(unit, underworld, prediction);
        }
      }
    }
  });
}

function poisonRandomEnemyUnit(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  // Find a random enemy unit and poison it
  // Unit must be alive, in enemy faction, not a doodad, and not already poisoned
  units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD));
  if (units.length > 0) {
    const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
    const chosenUnit = chooseOneOfSeeded(units, random);
    if (chosenUnit) {
      Unit.addModifier(chosenUnit, poisonCardId, underworld, prediction, 1, { sourceUnitId: unit.id });
    }
  }
}