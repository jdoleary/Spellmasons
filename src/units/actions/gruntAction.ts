import * as Unit from '../../Unit';
import * as math from '../../math';
import * as Vec from '../../Vec';
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
  // Move to the edge of the enemy, not to their center
  const adjustedTarget = Vec.subtract(closestEnemy, math.similarTriangles(closestEnemy.x - unit.x, closestEnemy.y - unit.y, math.distance(closestEnemy, unit), COLLISION_MESH_RADIUS * 2));
  // Movement
  await Unit.moveTowards(unit, adjustedTarget);

  // Orient; make the sprite face it's enemy
  if (closestEnemy.x > unit.x) {
    // Assuming all units are left facing, if the enemy is to the right, make it right facing
    unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
  } else {
    unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);

  }

  // Attack closest enemy
  if (canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
    await Unit.playAnimation(unit, 'units/golem_eat');

    await Unit.takeDamage(closestEnemy, unit.damage);
  }
}

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
    math.distance(unit, { x, y }) <= unit.attackRange
  );
}
