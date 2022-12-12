import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { PLAYER_BASE_ATTACK_RANGE } from '../../config';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import seedrandom from 'seedrandom';
import { findRandomDisplaceLocation } from '../../cards/displace';

export const DARK_SUMMONER_ID = 'Dark Summoner';
const manaCostToCast = 60;
const unit: UnitSource = {
  id: DARK_SUMMONER_ID,
  info: {
    description: 'The Dark Summoner will ruin you if you give him too much time - he summons common summoners who will summon yet more enemies.',
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
    healthMax: 18,
    damage: 0,
    attackRange: 0,
    manaCostToCast,
    manaMax: 60,
    manaPerTurn: 30,
    bloodColor: 0x852124
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 12,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${manaCostToCast}`;
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [0x5b3357, 0x222222], // dark robes
            [0x774772, 0x2c2c2c], // light robes
            [0xff00e4, 0x852124], //eyes
            [0x90768e, 0xaeaeae], // arm shade
          ],
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld: Underworld) => {
    // Summon unit
    if (unit.mana >= unit.manaCostToCast) {
      // Summoners attack or move, not both; so clear their existing path
      unit.path = undefined;
      unit.mana -= unit.manaCostToCast;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        let sourceUnit = allUnits.summoner;
        let numberOfSummons = unit.isMiniboss ? 2 : 1;
        const enemyIsClose = underworld.units.filter(u => u.unitType == UnitType.PLAYER_CONTROLLED && u.faction !== unit.faction).some(u => math.distance(unit, u) <= PLAYER_BASE_ATTACK_RANGE)
        if (enemyIsClose) {
          // Teleport away
          const seed = seedrandom(`${underworld.turn_number}-${unit.id}`);
          const displaceLocation = findRandomDisplaceLocation(underworld, unit.radius, seed);
          if (displaceLocation) {
            await new Promise<void>(resolveTeleport => {
              new Promise<void>(resolve => oneOffImage(unit, 'units/summonerMagic', containerUnits, resolve)).then(() => {
                unit.x = -1000;
                unit.y = -1000;
                new Promise<void>(resolve => oneOffImage(displaceLocation, 'units/summonerMagic', containerUnits, resolve)).then(() => {
                  unit.x = displaceLocation.x;
                  unit.y = displaceLocation.y;
                  resolveTeleport();
                });
              });
            });
          }

        } else {
          const spawns = underworld.findValidSpawns(unit, 20, 5);
          let lastPromise = Promise.resolve();
          for (let i = 0; i < numberOfSummons; i++) {
            if (sourceUnit) {
              const coords = spawns[i];
              if (coords) {
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
                lastPromise = summonPromise;
              } else {
                console.log("Summoner could not find valid spawn");
              }
            } else {
              console.error('summoner could not find unit source to summon from. Has the unit\'s id changed?');
            }
          }
          await lastPromise;
        }
      });
    } else {
      // Move opposite to closest enemy
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
      if (closestEnemy) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.stamina);
        await Unit.moveTowards(unit, moveTo, underworld);
      }

    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return [];
  }
};
export default unit;
