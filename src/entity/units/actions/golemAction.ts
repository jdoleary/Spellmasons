import type { Vec2 } from '../../../jmath/Vec';
import { distance } from '../../../jmath/math';
import * as Unit from '../../Unit';
import Underworld from '../../../Underworld';

export async function action(unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, _canAttackTarget: boolean) {
  if (!Unit.canMove(unit)) {
    return;
  }
  // Attack only one target
  const attackTarget = attackTargets && attackTargets[0];
  if (!attackTarget) {
    // Do not move if they don't have a target
    return;
  }
  // Calculate ahead of time to ensure they won't attack if the badge doesn't show
  const precalculatedCanAttack = underworld.canUnitAttackTarget(unit, attackTarget);
  // Movement
  await Unit.moveTowards(unit, attackTarget, underworld);

  // Attack closest enemy
  // Note: Special case: don't use canAttackEnemy for melee units
  // because pathing doesn't take immovable units into account yet
  // so it might think it can attack but will be blocked.
  // Instead, just check that the distance is within the attack range
  // and let canAttackEnemy be used for just the attention markers
  if (withinMeleeRange(unit, attackTarget)) {
    if (precalculatedCanAttack) {
      await Unit.playComboAnimation(unit, unit.animations.attack, async () =>
        Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false, undefined)
      );
    } else {
      // This check is extra to guard against false-negative melee attack predictions which should be solved in 21a5ea2a
      // What happened was units were able to move into negative stamina if their remaining stamina was < 1 and moveDistance was greater than the 
      // remaining stamina which allowed them to move closer than predicted which under some circumstances allowed them to attack without 
      // having an attack badge above their heads.  I believe this is fully resolved in 21a5ea2a; however, precalculatingCanAttack before movement
      // is an extra safety to prevent this from happening again (though it must be applied to EVERY melee unit individually in their action() function).
      // It works by checking if they would have an attackBadge before movement, then after movement it wont let them attack even if they are in range.
      // In that case, it will hit this else block and report the error.  I suspect to never see this error logged in monitoring, but it's here just
      // in case to prevent the false-negative (which could ruin a run for a player and is super unfair.) 
      console.error('Melee prediction was incorrect!', unit.stamina, `${unit.x}, ${unit.y}`, `${attackTarget.x},${attackTarget.y}`, unit.attackRange)
    }
  }
}
export function withinMeleeRange(unit: Unit.IUnit, target: Vec2): boolean {
  return distance(unit, target) <= unit.attackRange;
}