import * as Unit from '../../Unit';
import * as Image from '../../Image';
import * as math from '../../math';

export async function action(unit: Unit.IUnit) {
  if (!Unit.canMove(unit)) {
    return;
  }
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
  if (!closestEnemy) {
    // Do not move if they don't have a target
    return;
  }
  // Attack closest enemy
  if (canInteractWithCell(unit, closestEnemy.x, closestEnemy.y)) {
    await Image.attack(
      unit.image,
      unit.x,
      unit.y,
      closestEnemy.x,
      closestEnemy.y,
    );
    await Unit.takeDamage(closestEnemy, unit.damage);
  } else {
    const moveTo = math.getCoordsDistanceTowardsTarget(unit, closestEnemy, unit.moveDistance);
    unit.intendedNextMove = moveTo;
    // Update the "planning view" overlay that shows the unit's agro radius
    Unit.updateSelectedOverlay(unit);
  }
}

export function canInteractWithCell(
  unit: Unit.IUnit,
  x: number,
  y: number,
): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack any cell 1 distance from them
  return (
    (x == unit.x - 1 && y == unit.y) ||
    (x == unit.x + 1 && y == unit.y) ||
    (x == unit.x && y == unit.y - 1) ||
    (x == unit.x && y == unit.y + 1)
  );
}
