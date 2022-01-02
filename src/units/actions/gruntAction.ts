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
  if (canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
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

const range = 100;
export function canInteractWithTarget(
  unit: Unit.IUnit,
  x: number,
  y: number,
): boolean {
  // Dead units cannot attack
  if (!unit.alive) {
    return false;
  }
  // Melee units can attack target "range" distance from them
  return (
    math.distance(unit, { x, y }) <= range
  );
}
