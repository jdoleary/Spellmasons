import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import * as math from '../math';
import * as config from '../config';

const SUMMON_MANA_COST = 10;
const unit: UnitSource = {
  id: 'Summoner',
  info: {
    description: 'Summons allies every few turns',
    image: 'units/golem-summoner.png',
    subtype: UnitSubType.AI_summoner,
    probability: 30,
  },
  unitProps: {
    moveDistance: 20,
  },
  action: async (unit: Unit.IUnit) => {
    // Move opposite to closest enemy
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.moveDistance);
      await Unit.moveTowards(unit, moveTo);
    }
    // Summon unit
    if (unit.mana >= SUMMON_MANA_COST) {
      unit.mana -= SUMMON_MANA_COST;
      const sourceUnit = allUnits.grunt;
      if (sourceUnit) {
        const coords = window.underworld.getRandomCoordsWithinBounds({ xMin: config.UNIT_SIZE, yMin: config.COLLISION_MESH_RADIUS, xMax: config.MAP_WIDTH - config.COLLISION_MESH_RADIUS, yMax: config.MAP_HEIGHT - config.COLLISION_MESH_RADIUS });
        const summonedUnit = Unit.create(
          sourceUnit.id,
          // Start the unit at the summoners location
          unit.x,
          unit.y,
          // A unit always summons units in their own faction
          unit.faction,
          sourceUnit.info.image,
          UnitType.AI,
          sourceUnit.info.subtype,
          unit.strength,
          sourceUnit.unitProps
        );
        await Unit.moveTowards(summonedUnit, coords);
      } else {
        console.error('Summoner could not find unit source to summon from');
      }
    }
  },
};
export default unit;
