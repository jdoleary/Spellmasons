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
  // Movement
  await Unit.moveTowards(unit, attackTarget);

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
