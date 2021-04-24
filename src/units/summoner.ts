import * as Unit from '../Unit';
import { allUnits, UnitSource } from './index';
import { UnitSubType, UnitType } from '../commonTypes';
import * as math from '../math';

const unit: UnitSource = {
  id: 'Summoner',
  info: {
    description: 'Summons allies every few turns',
    image: 'units/golem-summoner.png',
    subtype: UnitSubType.AI_summoner,
    probability: 30,
  },
  action: async (unit: Unit.IUnit) => {
    // Move opposite to closest enemy
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const moveTo = math.oneCellAwayFromCell(unit, closestEnemy);
      unit.intendedNextMove = moveTo;
    }
    // Summon unit
    // Every x number of tunrs
    if (window.underworld.turn_number % 2 === 0) {
      const coords = window.underworld.getRandomEmptyCell({ xMin: 2 });
      if (coords) {
        const sourceUnit = allUnits.grunt;
        if (sourceUnit) {
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
          );
          await Unit.moveTo(summonedUnit, coords);
        } else {
          console.error('Summoner could not find unit source to summon from');
        }
      }
    }
  },
};
export default unit;
