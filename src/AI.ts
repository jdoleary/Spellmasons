import * as Unit from './Unit';
import * as math from './math';
import createVisualProjectile from './Projectile';
import { ableToTakeTurn } from './Player';
export function meleeAction(unit: Unit.IUnit) {
  if (!Unit.canMove(unit)) {
    return;
  }
  const closestPlayerUnit = Unit.findClosestPlayerTo(unit);
  if (!closestPlayerUnit) {
    // Do not move if they don't have a target
    return;
  }
  const targetCell = Unit.findCellOneStepCloserTo(
    unit,
    closestPlayerUnit.x,
    closestPlayerUnit.y,
  );
  const next_x = targetCell.x;
  const next_y = targetCell.y;
  const other_unit = window.game.getUnitAt(next_x, next_y);
  // Deal damage to what you run into
  if (other_unit) {
    // Do not attack ally AI units
    if (
      other_unit.unitType != Unit.UnitType.AI &&
      canAttackCell(unit, next_x, next_y)
    ) {
      unit.image.attack(unit.x, unit.y, next_x, next_y);
      Unit.takeDamage(other_unit, unit.power, 'unit');
    }
  } else {
    // If nothing is obstructing
    // physically move
    Unit.moveTo(unit, next_x, next_y);
    // Update the "planning view" overlay that shows the unit's agro radius
    Unit.updateSelectedOverlay(unit);
  }
}
export function rangedAction(unit: Unit.IUnit) {
  // Shoot at player if in same horizontal, diagonal, or vertical
  let targetPlayerUnit;
  // Filter on players able to take their turn to ensure, for example, that dead players don't get targeted
  for (let player of window.game.players.filter(ableToTakeTurn)) {
    if (canAttackCell(unit, player.unit.x, player.unit.y)) {
      targetPlayerUnit = player.unit;
      break;
    }
  }
  if (targetPlayerUnit) {
    createVisualProjectile(
      unit,
      targetPlayerUnit.x,
      targetPlayerUnit.y,
      'images/spell/arrow.png',
    );
    Unit.takeDamage(targetPlayerUnit, unit.power, 'unit');
  } else {
    // Move opposite to closest hero
    const closestPlayerUnit = Unit.findClosestPlayerTo(unit);
    if (closestPlayerUnit) {
      const moveTo = math.oneCellAwayFromCell(unit, closestPlayerUnit);
      Unit.moveTo(unit, moveTo.x, moveTo.y);
    }
  }
}
export function reachAction(unit: Unit.IUnit) {
  let runFromTarget;
  let targetPlayerUnit;
  // Filter on players able to take their turn to ensure, for example, that dead players don't get targeted
  for (let player of window.game.players.filter(ableToTakeTurn)) {
    // Will run away if player gets within 1
    if (math.cellDistance(unit, player.unit) < 2) {
      runFromTarget = player.unit;
    }
    if (canAttackCell(unit, player.unit.x, player.unit.y)) {
      targetPlayerUnit = player.unit;
      break;
    }
  }
  if (targetPlayerUnit) {
    createVisualProjectile(
      unit,
      targetPlayerUnit.x,
      targetPlayerUnit.y,
      'images/spell/green-thing.png',
    );
    Unit.takeDamage(targetPlayerUnit, unit.power, 'unit');
  } else {
    if (runFromTarget) {
      const moveTo = math.oneCellAwayFromCell(unit, runFromTarget);
      Unit.moveTo(unit, moveTo.x, moveTo.y);
    }
  }
}

// If a unit can attack (x,y), return true
export function canAttackCell(unit: Unit.IUnit, x: number, y: number): boolean {
  // Frozen units cannot attack
  if (unit.frozenForTurns > 0) {
    return false;
  }
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack any cell 1 distance from them
  if (unit.unitSubType === Unit.UnitSubType.AI_melee) {
    return math.cellDistance(unit, { x, y }) == 1;
    // return Math.abs(unit.x - x) <= 1 && Math.abs(unit.y - y) <= 1;
  } else if (unit.unitSubType === Unit.UnitSubType.AI_ranged) {
    // Ranged units can attack like a queen in chess
    const isOnSameHorizontal = x === unit.x;
    const isOnSameVertical = y === unit.y;
    const isDiagonal = Math.abs(x - unit.x) === Math.abs(y - unit.y);
    return isOnSameHorizontal || isOnSameVertical || isDiagonal;
  } else if (unit.unitSubType === Unit.UnitSubType.AI_reach) {
    // Can hit you if you are 2 away but not 1 away
    const cellDistance = math.cellDistance(unit, { x, y });
    return cellDistance == 2;
  }
  return false;
}
