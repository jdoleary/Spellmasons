
import * as Unit from '../../Unit';
import * as math from '../../math';
import type { CanInteractWithTarget, Attack } from './actionInterfaces';

export async function action(unit: Unit.IUnit, canInteractWithTarget: CanInteractWithTarget, attackCb: Attack) {
    let targetEnemy: Unit.IUnit | undefined;
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
    if (closestEnemy && canInteractWithTarget(unit, closestEnemy.x, closestEnemy.y)) {
        targetEnemy = closestEnemy;
    }
    // Attack
    let attackPromise;
    if (targetEnemy) {
        attackPromise = attackCb(targetEnemy);
    }
    // Movement:
    let movePromise;
    if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        const moveDistance = distanceToEnemy < unit.attackRange
            ? -unit.moveDistance // flee as far as it can
            : Math.min(unit.moveDistance, distanceToEnemy - unit.attackRange) // move in range but no farther
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, moveDistance);
        movePromise = Unit.moveTowards(unit, moveTo);
    }
    // Move and attack at the same time, but wait for the slowest to finish before moving on
    await Promise.all([attackPromise, movePromise])
}