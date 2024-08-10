import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import * as config from './config';
import floatingText from "./graphics/FloatingText";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';
import { skyBeam } from "./VisualEffects";
import { chooseOneOfSeeded, getUniqueSeedString } from "./jmath/rand";
import { UnitSubType } from "./types/commonTypes";
import seedrandom from "seedrandom";

export const bountyId = 'Bounty';
export const bountyColor = 0xffdc64;
export default function registerBounty() {
  registerModifiers(bountyId, {
    description: ('rune_bounty'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyId, { isCurse: false, quantity, keepOnDeath: false }, () => {
        Unit.addEvent(unit, bountyId);
      });

      if (!prediction) {
        // Draw attention to the bounty being added
        skyBeam(unit);
        floatingText({
          coords: unit,
          text: 'Bounty!',
          style: {
            fill: 'yellow',
            ...config.PIXI_TEXT_DROP_SHADOW
          },
        });
      }
    }
  });
  registerEvents(bountyId, {
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyId];
      if (modifier) {
        // Get all units with bountyHunter
        let units = prediction ? underworld.unitsPrediction : underworld.units;
        units = units.filter(u => u.modifiers[bountyHunterId]);

        if (units.length > 0) {
          // Draw a line to each
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            for (let hunterUnit of units) {
              graphics.lineStyle(3, bountyColor, 0.7);
              graphics.moveTo(hunterUnit.x, hunterUnit.y);
              graphics.lineTo(unit.x, unit.y);
            }
          }
        }
      }
    }
  });
}

export function placeRandomBounty(bountyHunter: Unit.IUnit, underworld: Underworld, prediction: boolean, ignoreMax: boolean = false) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;

  // Get existing bounty targets
  const unitsWithBounty = getUnitsWithBounty(underworld, prediction);
  // Max bounties = number of bounty hunters on team
  const maxBounties = units.filter(u => u.faction == bountyHunter.faction && u.modifiers[bountyHunterId]).length;
  if (ignoreMax || unitsWithBounty.length < maxBounties) {
    // Find a random enemy unit and give it a bounty
    // Unit must be alive, in enemy faction, not a doodad, and not yet have a bounty
    units = units.filter(u => u.alive && (u.faction != bountyHunter.faction) && (u.unitSubType != UnitSubType.DOODAD) && !u.modifiers[bountyId]);
    if (units.length > 0) {
      const random = seedrandom(`${getUniqueSeedString(underworld)} - ${bountyHunter.id}`);
      const chosenUnit = chooseOneOfSeeded(units, random);
      if (chosenUnit) {
        Unit.addModifier(chosenUnit, bountyId, underworld, prediction);
      }
    }
  }
}

export function getUnitsWithBounty(underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  units = units.filter(u => u.modifiers[bountyId]);
  return units;
}