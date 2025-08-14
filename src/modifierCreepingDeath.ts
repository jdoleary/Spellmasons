import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import * as colors from './graphics/ui/colors';
import Underworld from './Underworld';
import { chooseOneOfSeeded, getUniqueSeedString, randInt } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import { suffocateCardId } from "./cards/suffocate";
import seedrandom from "seedrandom";
import { makeManaTrail } from "./graphics/Particles";

// Inflicts a random enemy with [quantity] stacks of suffocate on kill
export const creepingDeathId = 'Creeping Death';
export default function registerCreepingDeath() {
  registerModifiers(creepingDeathId, {
    description: 'rune_creeping_death',
    unitOfMeasure: 'stacks',
    _costPerUpgrade: 100,
    // Note: Without a max, creeping death "cascades" where it insta-kills an enemy via suffocate which triggers
    // it again which insta kills another enemy
    maxUpgradeCount: 3,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, creepingDeathId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, creepingDeathId);
      });
    }
  });
  registerEvents(creepingDeathId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[creepingDeathId];
      if (modifier) {
        if (killedUnit && killedUnit.faction != unit.faction) {
          let units = prediction ? underworld.unitsPrediction : underworld.units;
          // Find a random enemy unit and suffocate it
          // Unit must be alive, in enemy faction, and not a doodad
          units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD));
          if (units.length > 0) {
            const random = seedrandom(`${getUniqueSeedString(underworld)} - ${killedUnit.id}`);
            const chosenUnit = chooseOneOfSeeded(units, random);
            if (chosenUnit) {
              if (prediction) {
                Unit.addModifier(chosenUnit, suffocateCardId, underworld, prediction, modifier.quantity, { sourceUnitId: unit.id });
              } else {
                Unit.addModifier(chosenUnit, suffocateCardId, underworld, prediction, modifier.quantity, { sourceUnitId: unit.id });
                makeManaTrail(killedUnit, chosenUnit, underworld, colors.convertToHashColor(colors.manaDarkBlue), colors.convertToHashColor(colors.manaDarkBlue));
              }
            } else {
              // No units left to choose
            }
          }
        }
      }
    },
  });
}