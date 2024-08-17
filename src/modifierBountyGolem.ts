import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { bountyId } from "./modifierBounty";
import { bountyHunterId } from "./modifierBountyHunter";
import Underworld from './Underworld';
import { golem_unit_id } from "./entity/units/golem";
import { allUnits } from "./entity/units";
import { UnitType } from "./types/commonTypes";
import { makeRisingParticles } from "./graphics/ParticleCollection";
import { COLLISION_MESH_RADIUS } from "./config";
import seedrandom from "seedrandom";
import { getUniqueSeedString } from "./jmath/rand";

// Spawn [quantity] golems when claiming a bounty
export const bountyGolemId = 'Bounty: Golem';
export default function registerBountyGolem() {
  registerModifiers(bountyGolemId, {
    description: ('rune_bounty_golem'),
    unitOfMeasure: `Golem`,
    costPerUpgrade: 120,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, bountyGolemId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addModifier(unit, bountyHunterId, underworld, prediction);
        Unit.addEvent(unit, bountyGolemId);
      });
    }
  });
  registerEvents(bountyGolemId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[bountyGolemId];
      if (modifier) {
        // Create golems on kill
        if (killedUnit.modifiers[bountyId]) {
          const seed = seedrandom(`${getUniqueSeedString(underworld)}-${killedUnit.id}`);
          // Summon quantity ally golems
          const golemsToSummon = modifier.quantity;
          for (let i = 0; i < golemsToSummon; i++) {
            const coords = underworld.findValidSpawnInRadius(killedUnit, prediction, seed, { allowLiquid: killedUnit.inLiquid });
            if (coords) {
              let sourceUnit = allUnits[golem_unit_id];
              if (sourceUnit) {
                const summonedUnit = Unit.create(
                  sourceUnit.id,
                  coords.x,
                  coords.y,
                  unit.faction,
                  sourceUnit.info.image,
                  UnitType.AI,
                  sourceUnit.info.subtype,
                  sourceUnit.unitProps,
                  underworld,
                  prediction,
                );

                makeRisingParticles(summonedUnit, prediction);
                // Resurrect animation is the die animation played backwards
                Unit.playAnimation(summonedUnit, summonedUnit.animations.die, { loop: false, animationSpeed: -0.2 });
                if (summonedUnit.image) {
                  summonedUnit.image.sprite.gotoAndPlay(summonedUnit.image.sprite.totalFrames - 1);
                }
              }
            } else {
              console.log("Bounty: Golem could not find valid spawn");
            }
          }
        }
      }
    }
  });
}