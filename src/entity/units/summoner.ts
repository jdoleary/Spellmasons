import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { chooseObjectWithProbability } from '../../jmath/rand';

const SUMMON_MANA_COST = 30;
const unit: UnitSource = {
  id: 'summoner',
  info: {
    description: 'A summoner uses mana to summon enemies.',
    image: 'units/summonerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  animations: {
    idle: 'units/summonerIdle',
    hit: 'units/summonerHit',
    attack: 'units/summonerAttack',
    die: 'units/summonerDeath',
    walk: 'units/summonerWalk',
  },
  sfx: {
    death: 'summonerDeath'
  },
  unitProps: {
    healthMax: 12,
    damage: 0,
    attackRange: 0,
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 6,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${SUMMON_MANA_COST}`;
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld: Underworld) => {
    // Summon unit
    if (unit.mana >= SUMMON_MANA_COST) {
      // Summoners attack or move, not both; so clear their existing path
      unit.path = undefined;
      unit.mana -= SUMMON_MANA_COST;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        const { sourceUnit, number: NUMBER_OF_SUMMONS } = chooseObjectWithProbability([
          {
            sourceUnit: allUnits.grunt,
            probability: 100,
            number: 5
          },
          {
            sourceUnit: allUnits.archer,
            probability: 50,
            number: 3,
          },
          {
            sourceUnit: allUnits.lobber,
            probability: 10,
            number: 2,
          },
        ], underworld.random) || { sourceUnit: allUnits.grunt, number: 5 };
        const spawns = underworld.findValidSpawns(unit, 20, 5);
        let lastPromise = Promise.resolve();
        for (let i = 0; i < NUMBER_OF_SUMMONS; i++) {
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
                unit.strength,
                sourceUnit.unitProps,
                underworld
              );
              const summonPromise = new Promise<void>(resolve => oneOffImage(coords, 'units/summonerMagic', containerUnits, resolve)).then(() => {
                Unit.moveTowards(summonedUnit, unit, underworld);
              });
              lastPromise = summonPromise;
            } else {
              console.log("Summoner could not find valid spawn");
            }
          }
          else {
            console.error('summoner could not find unit source to summon from');
          }
        }
        await lastPromise;
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
};
export default unit;
