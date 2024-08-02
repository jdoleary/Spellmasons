import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { randInt } from "./jmath/rand";
import { bountyColor, bountyId } from "./modifierBounty";
import { UnitSubType } from "./types/commonTypes";
import Underworld from './Underworld';

// This modifier should be applied in each other bounty modifier's add function
export const bountyHunterId = 'Bounty Hunter';
export default function registerBountyHunter() {
  registerModifiers(bountyHunterId, {
    description: ('rune_bounty_hunter'),
    keepBetweenLevels: true,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const modifier = getOrInitModifier(unit, bountyHunterId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, bountyHunterId);
      });
    }
  });
  registerEvents(bountyHunterId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyHunterId];
      if (modifier) {
        let units = prediction ? underworld.unitsPrediction : underworld.units;

        // Find a random enemy unit and give it a bounty
        // Unit must be alive, in enemy faction, not a doodad, and not yet have a bounty
        units = units.filter(u => u.alive && (u.faction != unit.faction) && (u.unitSubType != UnitSubType.DOODAD) && !u.modifiers[bountyId]);
        if (units.length > 0) {
          const chosenUnit = units[randInt(0, units.length - 1)];
          if (chosenUnit) {
            Unit.addModifier(chosenUnit, bountyId, underworld, prediction);
          }
        }
      }
    },
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyHunterId];
      if (modifier) {
        // Get all units with a bounty
        let units = prediction ? underworld.unitsPrediction : underworld.units;
        units = units.filter(u => u.modifiers[bountyId]);

        if (units.length > 0) {
          // Draw a line to each
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            for (let bountyUnit of units) {
              graphics.lineStyle(3, bountyColor, 0.7);
              graphics.moveTo(bountyUnit.x, bountyUnit.y);
              graphics.lineTo(unit.x, unit.y);
            }
          }
        }
      }
    }
  });
}