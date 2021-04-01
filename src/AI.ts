import * as Unit from './Unit';
import * as math from './math';
import createVisualProjectile from './Projectile';
import { enemySource } from './EnemyUnit';
import { UnitType, UnitSubType, Faction } from './commonTypes';

function livingUnitsInDifferentFaction(u: Unit.IUnit, faction: Faction) {}
export function meleeAction(unit: Unit.IUnit) {
  if (!Unit.canMove(unit)) {
    return;
  }
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
  if (!closestEnemy) {
    // Do not move if they don't have a target
    return;
  }
  const targetCell = Unit.findCellOneStepCloserTo(
    unit,
    closestEnemy.x,
    closestEnemy.y,
  );
  const next_x = targetCell.x;
  const next_y = targetCell.y;
  const other_unit = window.game.getUnitAt(next_x, next_y);
  // Deal damage to what you run into
  if (other_unit) {
    // Do not attack ally units
    if (
      other_unit.faction != unit.faction &&
      canAttackCell(unit, next_x, next_y)
    ) {
      unit.image.attack(unit.x, unit.y, next_x, next_y);
      Unit.takeDamage(other_unit, unit.power);
    }
  }
  // set move intention
  unit.intendedNextMove = { x: next_x, y: next_y };
  // Update the "planning view" overlay that shows the unit's agro radius
  Unit.updateSelectedOverlay(unit);
}
export function rangedAction(unit: Unit.IUnit) {
  // Shoot at enemy if in same horizontal, diagonal, or vertical
  let targetEnemy;
  for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
    if (canAttackCell(unit, enemy.x, enemy.y)) {
      targetEnemy = enemy;
      break;
    }
  }
  if (targetEnemy) {
    createVisualProjectile(
      unit,
      targetEnemy.x,
      targetEnemy.y,
      'images/spell/arrow.png',
    );
    Unit.takeDamage(targetEnemy, unit.power);
  } else {
    // Move opposite to enemy
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy) {
      const moveTo = math.oneCellAwayFromCell(unit, closestEnemy);
      unit.intendedNextMove = moveTo;
    }
  }
}
export function reachAction(unit: Unit.IUnit) {
  let runFromTarget;
  let targetEnemy;
  for (let enemy of Unit.livingUnitsInDifferentFaction(unit)) {
    // Will run away if enemy gets within 1
    if (math.cellDistance(unit, enemy) < 2) {
      runFromTarget = enemy;
    }
    if (canAttackCell(unit, enemy.x, enemy.y)) {
      targetEnemy = enemy;
      break;
    }
  }
  if (targetEnemy) {
    createVisualProjectile(
      unit,
      targetEnemy.x,
      targetEnemy.y,
      'images/spell/green-thing.png',
    );
    Unit.takeDamage(targetEnemy, unit.power);
  } else {
    if (runFromTarget) {
      const moveTo = math.oneCellAwayFromCell(unit, runFromTarget);
      unit.intendedNextMove = moveTo;
    }
  }
}
export function summonerAction(unit: Unit.IUnit) {
  // Move opposite to closest enemy
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
  if (closestEnemy) {
    const moveTo = math.oneCellAwayFromCell(unit, closestEnemy);
    unit.intendedNextMove = moveTo;
  }
  // Summon unit
  // Every x number of tunrs
  if (window.game.turn_number % 3 === 0) {
    const coords = window.game.getRandomEmptyCell({ xMin: 2 });
    if (coords) {
      const sourceUnit = enemySource[0];
      const summonedUnit = Unit.create(
        // Start the unit at the summoners location
        unit.x,
        unit.y,
        Faction.ENEMY,
        sourceUnit.image,
        UnitType.AI,
        sourceUnit.subtype,
      );
      Unit.moveTo(summonedUnit, coords);
    }
  }
}
export function demonAction(unit: Unit.IUnit) {
  // Resurrect a unit
  const deadAIs = window.game.units.filter(
    (u) => u.unitType === UnitType.AI && !u.alive,
  );
  if (deadAIs.length) {
    const deadUnit = deadAIs[0];
    createVisualProjectile(
      unit,
      deadUnit.x,
      deadUnit.y,
      'images/spell/green-thing.png',
    );
    Unit.resurrect(deadUnit);
    deadUnit.faction = Faction.ENEMY;
  }
  // Move randomly
  const moveCoords = window.game.getRandomEmptyCell({ xMin: 2 });
  if (moveCoords) {
    unit.intendedNextMove = moveCoords;
  }
}

// If a unit can attack (x,y), return true
export function canAttackCell(unit: Unit.IUnit, x: number, y: number): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack any cell 1 distance from them
  if (unit.unitSubType === UnitSubType.AI_melee) {
    return math.cellDistance(unit, { x, y }) == 1;
    // return Math.abs(unit.x - x) <= 1 && Math.abs(unit.y - y) <= 1;
  } else if (unit.unitSubType === UnitSubType.AI_bishop) {
    const isDiagonal = Math.abs(x - unit.x) === Math.abs(y - unit.y);
    return isDiagonal;
  } else if (unit.unitSubType === UnitSubType.AI_rook) {
    // Ranged units can attack like a queen in chess
    const isOnSameHorizontal = x === unit.x;
    const isOnSameVertical = y === unit.y;
    return isOnSameHorizontal || isOnSameVertical;
  } else if (unit.unitSubType === UnitSubType.AI_reach) {
    // Can hit you if you are 2 away but not 1 away
    const cellDistance = math.cellDistance(unit, { x, y });
    return cellDistance == 2;
  }
  return false;
}
