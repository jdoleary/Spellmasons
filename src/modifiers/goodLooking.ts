import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import * as config from '../config';
import Underworld from '../Underworld';
import { chooseOneOfSeeded, getUniqueSeedString, randInt } from "../jmath/rand";
import { UnitSubType } from "../types/commonTypes";
import seedrandom from "seedrandom";
import { makeRisingHeartParticles } from "../graphics/ParticleCollection";

// Converts [quantity] random non-miniboss units to the player's faction on spawn
export const goodLookingId = 'Good Looking';
export default function registerGoodLooking() {
  registerModifiers(goodLookingId, {
    description: i18n('rune_good_looking'),
    unitOfMeasure: 'Units',
    _costPerUpgrade: 280,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, goodLookingId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, goodLookingId);
      });
    }
  });
  registerEvents(goodLookingId, {
    onSpawn: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[goodLookingId];
      if (modifier) {
        for (let i = 0; i < modifier.quantity; i++) {
          convertRandomUnitToMyFaction(unit, underworld, prediction);
        }
      }
    }
  });
}

function convertRandomUnitToMyFaction(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  // Find a random enemy unit and charm it
  // Unit must be alive, in enemy faction, not a doodad, and not a miniboss
  units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD) && (!u.isMiniboss));
  if (units.length > 0) {
    const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
    const chosenUnit = chooseOneOfSeeded(units, random);
    if (chosenUnit) {
      makeRisingHeartParticles(chosenUnit, prediction);
      Unit.changeFaction(chosenUnit, unit.faction);
    }
  }
}