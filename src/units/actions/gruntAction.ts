import * as Unit from '../../Unit';
import * as math from '../../math';
import { COLLISION_MESH_RADIUS } from '../../config';

export async function action(unit: Unit.IUnit) {
  if (!Unit.canMove(unit)) {
    return;
  }
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
  if (!closestEnemy) {
    // Do not move if they don't have a target
    return;
  }
  // Orient; make the sprite face it's enemy
  if (closestEnemy.x > unit.x) {
    // Assuming all units are left facing, if the enemy is to the right, make it right facing
    unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
  }
  // Movement
  // ---
  // Prevent unit from moving inside of target closestEnemy
  const moveDist = Math.min(math.distance(unit, closestEnemy) - COLLISION_MESH_RADIUS * 2, unit.moveDistance)
  const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, moveDist);
  await Unit.moveTowards(unit, moveTo);

  // Attack closest enemy
  if (canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
    await Unit.playAnimation(unit, 'units/golem_eat');

    await Unit.takeDamage(closestEnemy, unit.damage);
  }
}

const range = 10;
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
  // + COLLISION_MESH_RADIUS*2 ensures that grunt can attack if it can reach the edge of a unit,
  // rather than their center
  return (
    math.distance(unit, { x, y }) <= range + COLLISION_MESH_RADIUS * 2
  );
}
