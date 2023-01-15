
import * as Unit from '../../Unit';
import * as math from '../../../jmath/math';
import Underworld from '../../../Underworld';
import { add, Vec2 } from '../../../jmath/Vec';

// closest: Sort targets closest to farthest
export function getBestRangedLOSTarget(unit: Unit.IUnit, underworld: Underworld, closest: boolean = true): Unit.IUnit[] {
    const enemies = Unit.livingUnitsInDifferentFaction(unit, underworld);
    const attackableEnemies = enemies.filter(enemy => {
        return Unit.inRange(unit, enemy) && underworld.hasLineOfSight(unit, enemy);
    }).map(enemy => {
        return { enemy, distance: math.distance(unit, enemy) };
    });
    const sortedByDistanceAttackableEnemies = attackableEnemies.sort((a, b) => {
        return closest ? a.distance - b.distance : b.distance - a.distance;
    });
    return sortedByDistanceAttackableEnemies.map(e => e.enemy);
}

export async function rangedLOSMovement(unit: Unit.IUnit, underworld: Underworld) {
    // Movement:
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    // Intelligently move the archer to a position where it can see the enemy
    if (closestEnemy) {
        const moveOptions = Unit.findLOSLocation(unit, closestEnemy, underworld);
        const moveChoice = moveOptions.reduce<{ dist: number, pos: Vec2 | undefined }>((closest, cur) => {
            const dist = math.distance(cur, unit);
            if (dist < closest.dist) {
                return { dist, pos: cur }
            } else {
                return closest
            }
        }, { dist: Number.MAX_SAFE_INTEGER, pos: undefined });

        let startPoint: Vec2 = unit;
        let moveTowardsPointsArray = [];
        if (moveChoice.pos) {
            startPoint = moveChoice.pos;
            // Move to obtain Line of Sight to enemy
            moveTowardsPointsArray.push(moveChoice.pos);
        }
        // Move closer until in range (or out of stamina)
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // Find a point directly towards the enemy that is closer but only just enough to be in attacking range
        const closerUntilInRangePoint = add(startPoint, math.similarTriangles(closestEnemy.x - startPoint.x, closestEnemy.y - startPoint.y, distanceToEnemy, distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange));
        moveTowardsPointsArray.push(closerUntilInRangePoint);
        await Unit.moveTowardsMulti(unit, moveTowardsPointsArray, underworld);
    }

}