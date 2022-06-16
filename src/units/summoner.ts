import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import * as math from '../math';

const SUMMON_MANA_COST = 30;
const unit: UnitSource = {
  id: 'summoner',
  info: {
    description: 'A summoner uses mana to summon grunts.',
    image: 'units/golem-summoner.png',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  animations: {
    idle: 'units/golem-summoner.png',
    hit: 'units/golem-summoner.png',
    attack: 'units/golem-summoner.png',
    die: 'units/golem-summoner.png',
    walk: 'units/golem-summoner.png',
  },
  unitProps: {
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
  },
  extraTooltipInfo: () => {
    return `Mana cost per summon: ${SUMMON_MANA_COST}`;
  },
  action: async (unit: Unit.IUnit) => {
    // Summon unit
    if (unit.mana >= SUMMON_MANA_COST) {
      unit.mana -= SUMMON_MANA_COST;
      const sourceUnit = allUnits.grunt;
      if (sourceUnit) {
        const coords = window.underworld.findValidSpawn(unit, 5)
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
            sourceUnit.unitProps
          );
          await Unit.moveTowards(summonedUnit, unit);
        } else {
          console.log("Summoner could not find valid spawn");
        }
        // Unit.setLocation(summonedUnit, coords);
      } else {
        console.error('summoner could not find unit source to summon from');
      }
    }
    // Move opposite to closest enemy
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.stamina);
      await Unit.moveTowards(unit, moveTo);
    }
  },
};
export default unit;
