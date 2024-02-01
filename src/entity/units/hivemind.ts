import * as Unit from '../Unit';
import { prng, randInt } from '../../jmath/rand';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import * as config from '../../config';
import Underworld from '../../Underworld';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { PLAYER_BASE_ATTACK_RANGE } from '../../config';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import seedrandom from 'seedrandom';
import { makeManaTrail } from '../../graphics/Particles';
import { clone, jitter, Vec2 } from '../../jmath/Vec';
import { isCoordInLiquid, tryFallInOutOfLiquid } from '../Obstacle';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { defaultPushDistance, forcePushAwayFrom } from '../../effects/force_move';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { makeCorruptionParticles } from '../../graphics/ParticleCollection';

export const hivemindId = 'hivemind';
const unit: UnitSource = {
  id: hivemindId,
  info: {
    description: 'deathmason description',
    image: 'units/playerIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    damage: 0,
    attackRange: 200,
    healthMax: 10000,
    mana: 400,
    manaMax: 400,
    manaPerTurn: 40,
    manaCostToCast: 20,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 7,
    unavailableUntilLevelIndex: 6,
  },
  animations: {
    idle: 'units/playerIdle',
    hit: 'units/playerHit',
    attack: 'units/playerAttack',
    die: 'units/playerDeath',
    walk: 'units/playerWalk',
  },
  sfx: {
    death: 'playerUnitDeath',
    damage: 'unitDamage',
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.scale.x *= 1.5;
      unit.image.sprite.scale.y *= 1.5;
      const adjustmentFilter = new AdjustmentFilter({
        saturation: 0.4,
        contrast: 5,
        brightness: 0.2
      });
      if (!unit.image.sprite.filters) {
        unit.image.sprite.filters = [];
      }
      unit.image.sprite.filters.push(adjustmentFilter);
      makeCorruptionParticles(unit, false, underworld);
    }
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    // attackTargets has irregular usage for this unit, see explanation in this file's getUnitAttackTargets()
    const numberOfSummons = randInt(1, 6);
    await hivemindAction(unit, underworld, allUnits.baneling, numberOfSummons);
  },
  getUnitAttackTargets: summonerGetUnitAttackTargets
};
export async function hivemindAction(unit: Unit.IUnit, underworld: Underworld, summonedUnit: UnitSource | undefined, numberOfSummons: number) {
  // Damage and push nearby enemies
  const nearbyEnemies = underworld.units.filter(u => u.faction != unit.faction && math.distance(u, unit) <= PLAYER_BASE_ATTACK_RANGE)
  if (nearbyEnemies.length) {
    for (let enemy of nearbyEnemies) {
      Unit.takeDamage(enemy, 50, unit, underworld, false);
      forcePushAwayFrom(enemy, unit, defaultPushDistance, underworld, false);
    }
  }

  // Summon banelings
  unit.mana -= unit.manaCostToCast * numberOfSummons;
  await Unit.playComboAnimation(unit, 'playerAttackMedium0', async () => {
    let lastPromise = Promise.resolve();
    const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
    for (let i = 0; i < numberOfSummons; i++) {
      const coords = findRandomGroundLocation(underworld, unit, seed);
      if (coords) {
        const sourceUnit = summonedUnit;

        lastPromise = makeManaTrail(unit, coords, underworld, '#930e0e', '#ff0000').then(() => {
          if (sourceUnit) {
            const summonedUnit = Unit.create(
              sourceUnit.id,
              // Start the unit at the summoners location
              coords.x,
              coords.y,
              // A unit always summons units in their own faction
              unit.faction,
              sourceUnit.info.image,
              UnitType.AI,
              sourceUnit.info.subtype,
              sourceUnit.unitProps,
              underworld
            );
            // Add summoning sickeness so they can't act after they are summoned
            Unit.addModifier(summonedUnit, summoningSicknessId, underworld, false);
            const summonPromise = new Promise<void>(resolve => oneOffImage(coords, 'units/summonerMagic', containerUnits, resolve));
            return summonPromise;
          } else {
            console.error('summoner could not find unit source to summon from. Has the unit\'s id changed?');
          }
          return Promise.resolve();
        });
      } else {
        console.log("Summoner could not find valid spawn");
      }
    }
    await lastPromise;
  });
}
export function summonerGetUnitAttackTargets(unit: Unit.IUnit, underworld: Underworld) {
  // getUnitAttackTargets will show an attention marker if a non empty array is returned
  // and I want to show an attention marker if the summoner is going to summon but since he doesn't
  // technically have "attack targets" we'll just return an array containing himself
  // which will govern wether or not he'll summon next turn.
  // Note: since getUnitAttackTargets governs the visiblity of the attention marker
  // all mana and range checks should occur in this function, not in the action function
  if (unit.mana >= unit.manaCostToCast) {
    return [unit];
  }
  return [];
}
// Similar to findRandomDisplaceLocation except it omits liquid locations and locations near other units
// and other pickups
export function findRandomGroundLocation(underworld: Underworld, summoner: Unit.IUnit, seed: prng): Vec2 | undefined {
  let isValid = false;
  let randomCoord;
  const infiniteLoopLimit = 100;
  let i = 0;
  whileloop:
  do {
    i++;
    if (i >= infiniteLoopLimit) {
      console.warn('Could not find random ground location');
      return undefined;
    }
    // Pick a random coord that is most likely within the unit's attack range
    randomCoord = jitter(summoner, summoner.attackRange, seed);

    // Omit location that intersects with unit
    for (let u of underworld.units) {
      // Note, units' radius is rather small (to allow for crowding), so
      // this distance calculation uses neither the radius of the pickup
      // nor the radius of the unit.  It is hard coded to 2 COLLISION_MESH_RADIUSES
      // which is currently 64 px (or the average size of a unit);
      if (math.distance(randomCoord, u) < config.COLLISION_MESH_RADIUS) {
        isValid = false;
        continue whileloop;
      }
    }
    // Omit location that intersects with pickup
    for (let pu of underworld.pickups) {
      // Note, units' radius is rather small (to allow for crowding), so
      // this distance calculation uses neither the radius of the pickup
      // nor the radius of the unit.  It is hard coded to 2 COLLISION_MESH_RADIUSES
      // which is currently 64 px (or the average size of a unit);
      if (math.distance(randomCoord, pu) < config.COLLISION_MESH_RADIUS) {
        isValid = false;
        continue whileloop;
      }
    }
    // Only summon with the summoner's attack range
    isValid = math.distance(summoner, randomCoord) <= summoner.attackRange
      // Make sure the summon point is valid
      && underworld.isPointValidSpawn(randomCoord, config.COLLISION_MESH_RADIUS)
      // Make sure the summon point isn't in water
      && !isCoordInLiquid(randomCoord, underworld);
  } while (!isValid);
  return randomCoord

}
export default unit;
