
import * as Unit from '../../Unit';
import * as math from '../../math';
import type { CanInteractWithTarget, Attack } from './actionInterfaces';

export function getBestTarget(unit: Unit.IUnit): Unit.IUnit | undefined {
    const enemies = Unit.livingUnitsInDifferentFaction(unit);
    return enemies.reduce<{ distance: number, hasLineOfSight: boolean, unit: Unit.IUnit | undefined }>((bestTarget, enemy) => {
        const dist = math.distance(unit, enemy);
        if (window.underworld.hasLineOfSight(unit, enemy) && dist < bestTarget.distance) {
            return { distance: dist, hasLineOfSight: true, unit: enemy }
        } else {
            return bestTarget;
        }
    }, { distance: Number.MAX_SAFE_INTEGER, hasLineOfSight: false, unit: undefined }).unit;

}
// If the ranged unit requires line of sight to attack, does not consider attack range
export async function actionLineOfSight(unit: Unit.IUnit, attackCb: Attack) {
    let targetEnemy: Unit.IUnit | undefined = getBestTarget(unit);
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
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