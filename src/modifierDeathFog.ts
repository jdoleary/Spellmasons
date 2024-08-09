import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import Underworld from './Underworld';
import { chooseOneOfSeeded, randInt } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import { suffocateCardId } from "./cards/suffocate";

// Suffocates [quantity] random enemy units each turn
export const deathFogId = 'Death Fog';
export default function registerDeathFog() {
  registerModifiers(deathFogId, {
    description: i18n('rune_death_fog'),
    costPerUpgrade: 80,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, deathFogId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, deathFogId);
      });
    }
  });
  registerEvents(deathFogId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[deathFogId];
      if (modifier) {
        for (let i = 0; i < modifier.quantity; i++) {
          suffocateRandomEnemyUnit(unit, underworld, prediction);
        }
      }
    },
  });
}

function suffocateRandomEnemyUnit(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  // Find a random enemy unit and suffocate it
  // Unit must be alive, in enemy faction, and not a doodad
  units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD));
  if (units.length > 0) {
    const chosenUnit = chooseOneOfSeeded(units, underworld.random);
    if (chosenUnit) {
      Unit.addModifier(chosenUnit, suffocateCardId, underworld, prediction);
    }
  }
}