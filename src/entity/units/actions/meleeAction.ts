import type { Vec2 } from '../../../jmath/Vec';
import { distance } from '../../../jmath/math';
import * as Unit from '../../Unit';
import Underworld from '../../../Underworld';

export async function meleeAction(unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, attackCB: (attackTarget: Unit.IUnit) => Promise<void>) {
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
  // Attack
  await meleeTryAttackClosestEnemy(unit, attackTarget, precalculatedCanAttack, () => attackCB(attackTarget));
}
// precalculatedCanAttack will prevent and report an attack that isn't expected.
// Attacks must be expected so that the user is warned via an attentionMarker that they
// will take damage.  Accurate attention markers are critical to the user experience because
// a single attack that isn't warned can end a player's run.
// goAheadAttackCB is invoked when the checks have been done that
// - the attack is alive and in range to attack
// - the attack was correctly warned via attentionMarkers
export async function meleeTryAttackClosestEnemy(unit: Unit.IUnit, attackTarget: Unit.IUnit, precalculatedCanAttack: boolean, goAheadAttackCB: () => Promise<void>) {
  // Attack closest enemy
  // Note: Special case: Use withinMeleeRange instead of
  // using canAttackEnemy for melee units again
  // because pathing doesn't take immovable units into account yet
  // so it might think it can attack but will be blocked.
  // Instead, just check that the distance is within the attack range
  // and let canAttackEnemy be used for just the attention markers
  // --
  // Recheck unit.alive
  // Ensure the unit only attacks if it doesn't die while moving
  // which can happen if they are in range but step on a trap that
  // deals fatal damage on their way
  if (withinMeleeRange(unit, attackTarget) && unit.alive) {
    if (!precalculatedCanAttack) {
      // This check is extra to guard against false-negative melee attack predictions which should be solved in 21a5ea2a
      // What happened was units were able to move into negative stamina if their remaining stamina was < 1 and moveDistance was greater than the 
      // remaining stamina which allowed them to move closer than predicted which under some circumstances allowed them to attack without 
      // having an attack badge above their heads.  I believe this is fully resolved in 21a5ea2a; however, precalculatingCanAttack before movement
      // is an extra safety to prevent this from happening again (though it must be applied to EVERY melee unit individually in their action() function).
      // It works by checking if they would have an attackBadge before movement, then after movement it wont let them attack even if they are in range.
      // In that case, it will hit this else block and report the error.  I suspect to never see this error logged in monitoring, but it's here just
      // in case to prevent the false-negative (which could ruin a run for a player and is super unfair.) 
      console.error('Melee prediction was incorrect!', unit.stamina, `${unit.x}, ${unit.y}`, `${attackTarget.x},${attackTarget.y}`, unit.attackRange)
    } else {
      await goAheadAttackCB();
    }
  }

}
export function withinMeleeRange(unit: Unit.IUnit, target: Vec2): boolean {
  return distance(unit, target) <= unit.attackRange;
}