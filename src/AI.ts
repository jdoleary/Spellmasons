import * as Unit from './Unit';
import * as math from './math';
import createVisualProjectile from './Projectile';
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
    if (other_unit.unitType != Unit.UnitType.AI) {
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
  // Move opposite to closest hero
  const closestPlayerUnit = Unit.findClosestPlayerTo(unit);
  if (closestPlayerUnit) {
    const moveTo = math.oneCellAwayFromCell(unit, closestPlayerUnit);
    Unit.moveTo(unit, moveTo.x, moveTo.y);
  }

  // Shoot at player if in same horizontal, diagonal, or vertical
  let targetPlayerUnit;
  for (let player of window.game.players) {
    const isOnSameHorizontal = player.unit.x === unit.x;
    const isOnSameVertical = player.unit.y === unit.y;
    const isDiagonal =
      Math.abs(player.unit.x - unit.x) === Math.abs(player.unit.y - unit.y);
    if (isOnSameHorizontal || isOnSameVertical || isDiagonal) {
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
  }
}
