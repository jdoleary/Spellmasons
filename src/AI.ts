import * as Unit from './Unit';
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
  const bump_into_units = window.game
    ? window.game.getUnitsAt(next_x, next_y)
    : [];
  // Deal damage to what you run into
  for (let other_unit of bump_into_units) {
    // Do not attack self
    if (other_unit === unit) {
      continue;
    }
    // Do not attack ally AI units
    if (other_unit.unitType === Unit.UnitType.AI) {
      continue;
    }
    unit.image.attack(unit.x, unit.y, next_x, next_y);
    Unit.takeDamage(other_unit, unit.power, 'unit');
  }
  const alive_bump_into_units = bump_into_units.filter((u) => u.alive);
  // If nothing is obstructing
  if (alive_bump_into_units.length === 0) {
    // physically move
    Unit.moveTo(unit, next_x, next_y);
    // Update the "planning view" overlay that shows the unit's agro radius
    Unit.updateSelectedOverlay(unit);
  }
}
export function rangedAction(unit: Unit.IUnit) {
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
