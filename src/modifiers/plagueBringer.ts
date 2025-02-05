import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import * as config from '../config';
import Underworld from '../Underworld';
import { chooseOneOfSeeded, getUniqueSeedString, randInt } from "../jmath/rand";
import { UnitSubType } from "../types/commonTypes";
import { basePoisonStacks, poisonCardId } from "../cards/poison";
import seedrandom from "seedrandom";
import floatingText from "../graphics/FloatingText";
import { animateSpell } from "../cards/cardUtils";

// Poisons [quantity] random enemy units each turn
export const plagueBringerId = 'Plague Bringer';
export default function registerPlagueBringer() {
  registerModifiers(plagueBringerId, {
    description: i18n('rune_plague_bringer'),
    unitOfMeasure: 'units',
    _costPerUpgrade: 100,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, plagueBringerId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, plagueBringerId);
      });
    }
  });
  registerEvents(plagueBringerId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        return;
      }
      const modifier = unit.modifiers[plagueBringerId];
      if (modifier) {
        poisonRandomEnemyUnits(unit, modifier.quantity, underworld, prediction);
      }
    }
  });
}

function poisonRandomEnemyUnits(unit: Unit.IUnit, quantity: number, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  // Find a random enemy unit and poison it
  // Unit must be alive, in enemy faction, not a doodad, and not already poisoned
  units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD));
  if (units.length > 0) {
    const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
    for (let i = 0; i < quantity; i++) {
      const chosenUnit = chooseOneOfSeeded(units, random);
      if (chosenUnit) {
        floatingText({
          coords: chosenUnit, text: plagueBringerId,
          style: {
            fill: 'green',
            ...config.PIXI_TEXT_DROP_SHADOW
          },
          prediction
        });
        if (!prediction) {
          animateSpell(chosenUnit, 'spellPoison');
          playSFXKey('poison');
        }
        Unit.addModifier(chosenUnit, poisonCardId, underworld, prediction, basePoisonStacks, { sourceUnitId: unit.id });
      }
    }
  }
}