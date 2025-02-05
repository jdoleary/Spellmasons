import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { getUniqueSeedString, randFloat } from "../jmath/rand";
import seedrandom from "seedrandom";
import { resurrectWithAnimation } from "../cards/resurrect";
import floatingText from "../graphics/FloatingText";

// [quantity]% chance to resurrect a unit on kill
export const onKillRessurectId = 'On Kill Resurrect';
export default function registerOnKillResurrect() {
  registerModifiers(onKillRessurectId, {
    description: 'rune_on_kill_resurrect',
    unitOfMeasure: '%',
    maxUpgradeCount: 5,
    _costPerUpgrade: 80,
    quantityPerUpgrade: 5,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, onKillRessurectId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, onKillRessurectId);
      });
    }
  });
  registerEvents(onKillRessurectId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (prediction) {
        // Hide the result of on kill resurrect during prediction
        return
      }
      const modifier = unit.modifiers[onKillRessurectId];
      let animationPromise = Promise.resolve();
      if (modifier) {
        if (killedUnit) {
          const random = seedrandom(`${getUniqueSeedString(underworld)} - ${killedUnit.id}`);
          const chance = Math.min(100, modifier.quantity);
          if (randFloat(0, 100, random) < chance) {
            floatingText({ coords: killedUnit, text: onKillRessurectId, prediction })
            // Because on kill async is not properly supported
            // we need to resurrect the data and without awaiting
            // the animation
            // Can remove below after fixing onKill async
            Unit.resurrect(killedUnit, underworld);
            Unit.changeFaction(killedUnit, unit.faction);
            // Can remove above after fixing onKill async
            await resurrectWithAnimation(killedUnit, unit, unit.faction, underworld, prediction);
          }
        }
      }
      await animationPromise;
    }
  });
}