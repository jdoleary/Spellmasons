import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import { forcePushToDestination } from "./effects/force_move";
import floatingText from "./graphics/FloatingText";
import { raceTimeout } from "./Promise";

export const whirlpoolId = 'Whirlpool';
export default function registerWhirlpool() {
  registerModifiers(whirlpoolId, {
    description: 'rune_whirlpool',
    _costPerUpgrade: 120,
    unitOfMeasure: 'Units',
    quantityPerUpgrade: 1,
    maxUpgradeCount: 3,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, whirlpoolId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, whirlpoolId);
      });
    },
  });
  registerEvents(whirlpoolId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Whirlpool only works if the unit is alive to prevent it from running forever after their death
      if (!unit.alive) {
        return
      }
      const modifier = unit.modifiers[whirlpoolId];
      if (modifier) {
        const submergedCorpses = underworld.getAllUnits(prediction).filter(u => !u.alive && u.inLiquid && !u.flaggedForRemoval);
        const candidatesForPull = underworld.getAllUnits(prediction).filter(u => u.alive && !u.inLiquid && u.faction !== unit.faction && !u.flaggedForRemoval);
        const promises = [];
        for (let submergedCorpse of submergedCorpses) {
          let triggered = false;
          for (let i = 0; i < (modifier.quantity || 1); i++) {
            const nearest = Unit.closestInListOfUnits(submergedCorpse, candidatesForPull);
            if (nearest) {
              // Remove candidate so multiple corpses pull different enemies
              candidatesForPull.splice(candidatesForPull.indexOf(nearest), 1);
              // Pull the enemy to the submerged corpse
              promises.push(forcePushToDestination(nearest, submergedCorpse, 1, underworld, prediction));
              triggered = true;
            }
          }
          if (triggered) {
            floatingText({ coords: submergedCorpse, text: i18n(whirlpoolId), prediction });
            // Remove corpse
            Unit.cleanup(submergedCorpse, true);
          }
        }
        await raceTimeout(2_000, 'whirlpool', Promise.all(promises));
      }

    }
  });
}