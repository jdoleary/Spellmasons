import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier, Modifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Upgrade from './Upgrade';
import { golem_unit_id } from "./entity/units/golem";
import seedrandom from "seedrandom";
import { Vec2 } from "./jmath/Vec";
import { prng, randFloat } from "./jmath/rand";
import { COLLISION_MESH_RADIUS } from "./config";
import { allUnits } from "./entity/units";
import { UnitType } from "./types/commonTypes";
import { makeRisingParticles } from "./graphics/ParticleCollection";
import { BLOOD_GOLEM_ID } from "./entity/units/bloodGolem";

// Summon up to [quantity] golems each turn and grants the player summon golem spell
export const golemancerId = 'Golemancer';
export default function registerGolemancer() {
  registerModifiers(golemancerId, {
    description: 'rune_golemancer',
    costPerUpgrade: 200,
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
  let allyGolems = getLivingAllyGolems(unit, underworld, prediction);
  if (allyGolems.length < quantity) {
    const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
    // Summon ally golems up to quantity
    const golemsToSummon = quantity - allyGolems.length;
    for (let i = 0; i < golemsToSummon; i++) {
      const coords = findRandomSummonLocation(unit, unit.attackRange / 2, underworld, prediction, seed)
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
        console.log("Golemancer could not find valid spawn");
      }
    }
  }
}

export function getLivingAllyGolems(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let units = prediction ? underworld.unitsPrediction : underworld.units;
  units = units.filter(u => u.alive && u.faction == unit.faction && [golem_unit_id, BLOOD_GOLEM_ID].includes(u.unitSourceId));
  return units;
}

export function findRandomSummonLocation(unit: Unit.IUnit, radius: number, underworld: Underworld, prediction: boolean, seed: prng): Vec2 | undefined {
  let randomCoord = undefined;
  for (let i = 0; i < 100; i++) {
    // Generate a random angle in radians
    const angle = randFloat(0, 2 * Math.PI);
    const distance = randFloat(COLLISION_MESH_RADIUS, radius);

    // Set coordinate based on dir and distance
    randomCoord = {
      x: unit.x + (distance * Math.cos(angle)),
      y: unit.y + (distance * Math.sin(angle)),
    }

    // If coordinate is a valid spawn, break loop
    if (underworld.isPointValidSpawn(randomCoord, COLLISION_MESH_RADIUS, prediction)) {
      break;
    }
  }

  if (randomCoord == undefined) {
    console.warn('Could not find valid spawn point for golem, returning summoner position');
    randomCoord = { x: unit.x, y: unit.y }
  }

  return randomCoord;
}