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

// Adds [quantity] stacks of suffocate to a random enemy on kill
export const creepingDeathId = 'Creeping Death';
export default function registerCreepingDeath() {
  registerModifiers(creepingDeathId, {
    description: i18n('rune_creeping_death'),
    costPerUpgrade: 100,
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
        if (killedUnit) {
          let units = prediction ? underworld.unitsPrediction : underworld.units;
          // Find a random enemy unit and suffocate it
          // Unit must be alive, in enemy faction, not a doodad, and not already suffocating
          units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD) && (u.modifiers[suffocateCardId] == undefined));
          if (units.length > 0) {
            const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
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