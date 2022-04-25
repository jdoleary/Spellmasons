import * as Unit from '../../Unit';
import * as math from '../../math';
import * as Vec from '../../Vec';
import { COLLISION_MESH_RADIUS } from '../../config';

export async function action(unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean) {
  if (!Unit.canMove(unit)) {
    return;
  }
  if (!attackTarget) {
    // Do not move if they don't have a target
    return;
  }
  // Move to the edge of the enemy, not to their center
  const adjustedTarget = Vec.subtract(attackTarget, math.similarTriangles(attackTarget.x - unit.x, attackTarget.y - unit.y, math.distance(attackTarget, unit), COLLISION_MESH_RADIUS * 2));
  // Movement
  await Unit.moveTowards(unit, adjustedTarget);

  // Orient; make the sprite face it's enemy
  if (unit.image) {
    if (attackTarget.x > unit.x) {
      // Assuming all units are left facing, if the enemy is to the right, make it right facing
      unit.image.sprite.scale.x = -Math.abs(unit.image.sprite.scale.x);
    } else {
      unit.image.sprite.scale.x = Math.abs(unit.image.sprite.scale.x);
    }
  }

  // Attack closest enemy
  if (canAttackTarget) {
    await Unit.playAnimation(unit, 'units/golem_eat');
    Unit.takeDamage(attackTarget, unit.damage, false, undefined);
  }
}
