import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';

const SUMMON_MANA_COST = 30;
const unit: UnitSource = {
  id: 'summoner',
  info: {
    description: 'A summoner uses mana to summon grunts.',
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
  unitProps: {
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
        const sourceUnit = allUnits.grunt;
        if (sourceUnit) {
          const coords = underworld.findValidSpawn(unit, 5)
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
            await Unit.moveTowards(summonedUnit, unit, underworld);
          } else {
            console.log("Summoner could not find valid spawn");
          }
          // Unit.setLocation(summonedUnit, coords);
        }
        else {
          console.error('summoner could not find unit source to summon from');
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
};
export default unit;
