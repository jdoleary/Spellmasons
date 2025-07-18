import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier, Modifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Upgrade from './Upgrade';
import { golem_unit_id } from "./entity/units/golem";
import seedrandom from "seedrandom";
import { Vec2 } from "./jmath/Vec";
import { getUniqueSeedString, prng, randFloat } from "./jmath/rand";
import { COLLISION_MESH_RADIUS } from "./config";
import { allUnits } from "./entity/units";
import { UnitType } from "./types/commonTypes";
import { makeRisingParticles } from "./graphics/ParticleCollection";
import { BLOOD_GOLEM_ID } from "./entity/units/bloodGolem";

// Creates enough ally golems to ensure you have X at the start of each turn
// and grants the player summon golem spell
export const golemancerId = 'Golemancer';
export default function registerGolemancer() {
  registerModifiers(golemancerId, {
    description: ['rune_golemancer', `X`],
    unitOfMeasure: 'Units',
    _costPerUpgrade: 120,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, golemancerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, golemancerId);
        const player = underworld.players.find(p => p.unit == unit);
        if (player) {
          // Give summon golem
          const newCardId = Unit.unitSourceIdToName(golem_unit_id, false);
          const upgrade = Upgrade.upgradeCardsSource.find(u => u.title == newCardId)
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find summon golem upgrade for Golemancer rune');
          }
        }
      });
    },
  });
  registerEvents(golemancerId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[golemancerId];
      if (modifier && unit.alive) {
        spawnGolems(unit, modifier.quantity, underworld, prediction);
      }
    },
    onSpawn: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[golemancerId];
      if (modifier && unit.alive) {
        spawnGolems(unit, modifier.quantity, underworld, prediction);
      }
    }
  });
}

function spawnGolems(unit: Unit.IUnit, quantity: number, underworld: Underworld, prediction: boolean) {
  let ownGolems = getLivingAllyGolems(unit, underworld, prediction).filter(u => u.summonedBy === unit && u.unitSourceId == golem_unit_id);
  if (ownGolems.length < quantity) {
    // Summon ally golems up to quantity
    const golemsToSummon = quantity - ownGolems.length;
    for (let i = 0; i < golemsToSummon; i++) {
      const coords = underworld.DEPRECIATED_findValidSpawnInRadius(unit, prediction, { allowLiquid: unit.inLiquid });
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
            unit
          );
          // Since they are made for free they shouldn't have souls
          summonedUnit.soulFragments = 0;

          if (!prediction) {
            playSFXKey('resurrect');
          }
          makeRisingParticles(summonedUnit, prediction);
          // Resurrect animation is the die animation played backwards
          Unit.playAnimation(summonedUnit, summonedUnit.animations.die, { loop: false, animationSpeed: -0.2 });
          if (summonedUnit.image) {
            summonedUnit.image.sprite.gotoAndPlay(summonedUnit.image.sprite.totalFrames - 1);
          }
        }
      } else {
        console.error("Golemancer could not find valid spawn");
      }
    }
  }
}

export function getLivingAllyGolems(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  units = units.filter(u => u.alive && u.faction == unit.faction && [golem_unit_id, BLOOD_GOLEM_ID].includes(u.unitSourceId));
  return units;
}