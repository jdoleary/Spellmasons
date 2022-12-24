import * as Unit from '../Unit';
import { prng } from '../../jmath/rand';
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
import { clone, Vec2 } from '../../jmath/Vec';
import { isCoordInLiquid } from '../Obstacle';

export const SUMMONER_ID = 'summoner';
const manaCostToCast = 30;
const unit: UnitSource = {
  id: SUMMONER_ID,
  info: {
    description: 'A summoner uses mana to summon enemies.',
    image: 'units/summonerIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  animations: {
    idle: 'units/summonerIdle',
    hit: 'units/summonerHit',
    attack: 'units/summonerAttack',
    die: 'units/summonerDeath',
    walk: 'units/summonerWalk',
  },
  sfx: {
    damage: 'summonerHurt',
    death: 'summonerDeath'
  },
  unitProps: {
    healthMax: 12,
    damage: 0,
    attackRange: 550,
    manaCostToCast
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${manaCostToCast}`;
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    // attackTargets has irregular usage for this unit, see explanation in this file's getUnitAttackTargets()
    await summonerAction(unit, !!attackTargets.length, underworld, { closeUnit: allUnits.golem, farUnit: allUnits.archer }, 3);
  },
  getUnitAttackTargets: summonerGetUnitAttackTargets
};
export async function summonerAction(unit: Unit.IUnit, ableToSummon: boolean, underworld: Underworld, { closeUnit, farUnit }: { closeUnit: UnitSource | undefined, farUnit: UnitSource | undefined }, baseNumberOfSummons: number) {
  // Summon unit
  if (ableToSummon) {
    // Summoners attack or move, not both; so clear their existing path
    unit.path = undefined;
    unit.mana -= unit.manaCostToCast;
    await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
      let numberOfSummons = baseNumberOfSummons * (unit.isMiniboss ? 2 : 1);
      let lastPromise = Promise.resolve();
      const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
      for (let i = 0; i < numberOfSummons; i++) {
        const coords = findRandomGroundLocation(underworld, unit, seed);
        if (coords) {
          const enemyIsClose = underworld.units.filter(u => u.faction !== unit.faction).some(u => math.distance(coords, u) <= PLAYER_BASE_ATTACK_RANGE)
          let sourceUnit = farUnit;
          if (enemyIsClose) {
            sourceUnit = closeUnit;
          }

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
              const summonPromise = new Promise<void>(resolve => oneOffImage(coords, 'units/summonerMagic', containerUnits, resolve)).then(() => {
                Unit.moveTowards(summonedUnit, unit, underworld);
              });
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
  } else {

    const enemyIsClose = underworld.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED && u.faction !== unit.faction).some(u => math.distance(unit, u) <= PLAYER_BASE_ATTACK_RANGE)
    if (enemyIsClose) {
      // Teleport away
      const seed = seedrandom(`${underworld.turn_number}-${unit.id}`);
      const teleportFromLocation = clone(unit);
      const teleportToLocation = findRandomGroundLocation(underworld, unit, seed);
      if (teleportToLocation) {
        await new Promise<void>(resolveTeleport => {
          new Promise<void>(resolve => oneOffImage(unit, 'units/summonerMagic', containerUnits, resolve)).then(() => {
            unit.x = -1000;
            unit.y = -1000;
            makeManaTrail(teleportFromLocation, teleportToLocation, underworld, '#774772', '#5b3357').then(() => {
              new Promise<void>(resolve => oneOffImage(teleportToLocation, 'units/summonerMagic', containerUnits, resolve)).then(() => {
                unit.x = teleportToLocation.x;
                unit.y = teleportToLocation.y;
                resolveTeleport();
              });
            });
          });
        });
      }

    }
  }
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
// Similar to findRandomDisplaceLocation except it omits liquid locations
export function findRandomGroundLocation(underworld: Underworld, summoner: Unit.IUnit, seed: prng): Vec2 | undefined {
  let isValid = false;
  let randomCoord;
  const infiniteLoopLimit = 100;
  let i = 0;
  do {
    i++;
    if (i >= infiniteLoopLimit) {
      console.warn('Could not find random ground location');
      return undefined;
    }
    randomCoord = underworld.getRandomCoordsWithinBounds(underworld.limits, seed);
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
