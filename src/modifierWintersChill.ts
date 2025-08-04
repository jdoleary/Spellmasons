import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as colors from './graphics/ui/colors';
import Underworld from './Underworld';
import { chooseOneOfSeeded, getUniqueSeedString, randInt, shuffle } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import seedrandom from "seedrandom";
import { makeManaTrail } from "./graphics/Particles";
import { freezeCardId } from "./cards/freeze";
import * as Image from './graphics/Image';
import { raceTimeout } from "./Promise";
import floatingText from "./graphics/FloatingText";
import mod from "./DevelopmentMods/SamplePickup/SamplePickup";

export const wintersChillId = 'Winter\'s Chill';
export default function registerWintersChill() {
  registerModifiers(wintersChillId, {
    description: 'rune_winters_chill',
    unitOfMeasure: 'Units',
    _costPerUpgrade: 100,
    maxUpgradeCount: 10,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, wintersChillId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, wintersChillId);
      });
    }
  });
  registerEvents(wintersChillId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[wintersChillId];
      if (modifier) {
        if (unit) {
          let units = prediction ? underworld.unitsPrediction : underworld.units;
          // Find a random enemy unit and suffocate it
          // Unit must be alive, in enemy faction, and not a doodad
          units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD) && !u.modifiers[freezeCardId]);
          if (units.length > 0) {
            const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
            // Make a shallow copy so it doesn't shuffle the original units array
            const unitsShuffled = shuffle([...units], random)
            let promises = [];
            const chosenUnits = unitsShuffled.slice(0, modifier.quantity || 1);
            for (let chosenUnit of chosenUnits) {
              if (chosenUnit) {
                makeManaTrail(unit, chosenUnit, underworld, colors.convertToHashColor(colors.manaBrightBlue), colors.convertToHashColor(colors.manaBrightBlue));
                floatingText({ coords: chosenUnit, text: wintersChillId });
                playSFXKey('freeze');
                promises.push(Image.addOneOffAnimation(chosenUnit, 'spellFreeze'));
              }
            }
            await raceTimeout(2_000, 'winters chill', Promise.all(promises));
            for (let chosenUnit of chosenUnits) {
              Unit.addModifier(chosenUnit, freezeCardId, underworld, prediction, 1, { sourceUnitId: unit.id });
            }
          }
        }
      }
    },
  });
}