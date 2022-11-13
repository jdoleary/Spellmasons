import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { PLAYER_BASE_ATTACK_RANGE } from '../../config';
import { summoningSicknessId } from '../../modifierSummoningSickness';

const manaCostToCast = 30;
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
    damage: 'summonerHurt',
    death: 'summonerDeath'
  },
  unitProps: {
    healthMax: 12,
    damage: 0,
    attackRange: 0,
    manaCostToCast
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 6,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${manaCostToCast}`;
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld: Underworld) => {
    // Summon unit
    if (unit.mana >= unit.manaCostToCast) {
      // Summoners attack or move, not both; so clear their existing path
      unit.path = undefined;
      unit.mana -= unit.manaCostToCast;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        let sourceUnit = allUnits.archer;
        let numberOfSummons = 3 * (unit.isMiniboss ? 2 : 1);
        const enemyIsClose = underworld.units.filter(u => u.faction !== unit.faction).some(u => math.distance(unit, u) <= PLAYER_BASE_ATTACK_RANGE)
        if (enemyIsClose) {
          sourceUnit = allUnits.golem;
          numberOfSummons = 5 * (unit.isMiniboss ? 2 : 1);
        }
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
