import type { Vec2 } from 'src/Vec';
import { distance } from '../../math';
import * as Unit from '../../Unit';

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
  // Note: Special case: don't use canAttackEnemy for melee units
  // because pathing doesn't take immovable units into account yet
  // so it might think it can attack but will be blocked.
  // Instead, just check that the distance is within the attack range
  // and let canAttackEnemy be used for just the attention markers
  if (withinMeleeRange(unit, attackTarget)) {
    await Unit.playAnimation(unit, 'units/golem_eat');
    Unit.takeDamage(attackTarget, unit.damage, false, undefined);
  }
}
export function withinMeleeRange(unit: Unit.IUnit, target: Vec2): boolean {
  return distance(unit, target) <= unit.attackRange;
}