import * as Unit from '../../Unit';
import * as math from '../../../jmath/math';
import Underworld from '../../../Underworld';
import { add, Vec2 } from '../../../jmath/Vec';
import * as config from '../../../config';

// closest: Sort targets closest to farthest
export function getBestRangedLOSTarget(
  unit: Unit.IUnit,
  underworld: Underworld,
  closest: boolean = true,
): Unit.IUnit[] {
  const enemies = Unit.livingUnitsInDifferentFaction(unit, underworld);
  const attackableEnemies = enemies
    .filter((enemy) => {
      return (
        Unit.inRange(unit, enemy) && underworld.hasLineOfSight(unit, enemy)
      );
    })
    .map((enemy) => {
      return { enemy, distance: math.distance(unit, enemy) };
    });
  const sortedByDistanceAttackableEnemies = attackableEnemies.sort((a, b) => {
    return closest ? a.distance - b.distance : b.distance - a.distance;
  });
  return sortedByDistanceAttackableEnemies
    .map((e) => e.enemy)
    .filter(Unit.filterSmartTarget);
}

export async function rangedLOSMovement(
  unit: Unit.IUnit,
  underworld: Underworld,
) {
  // Movement:
  const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
  // Intelligently move the archer to a position where it can see the enemy
  if (closestEnemy) {
    const moveOptions = Unit.findLOSLocation(unit, closestEnemy, underworld);
    const moveChoice = moveOptions.reduce<{
      dist: number;
      pos: Vec2 | undefined;
    }>(
      (closest, cur) => {
        const dist = math.distance(cur, unit);
        if (dist < closest.dist) {
          return { dist, pos: cur };
        } else {
          return closest;
        }
      },
      { dist: Number.MAX_SAFE_INTEGER, pos: undefined },
    );

    if (moveChoice.pos && !underworld.hasLineOfSight(unit, closestEnemy)) {
      // TODO: archer movement issue: sometimes moveChoice.pos is through a wall
      // findPath is just returning one point, it fails to find a path. Oh it's because it's
      // trying to path to a point on a wall, not in walkable space
      if (underworld.hasLineOfSight(unit, moveChoice.pos)) {
        // Generally if an archer doesn't have line of sight on the enemy,
        // it will use findLOSLocation to check in an arc around the enemy for a point where there
        // is line of sight.  If the point on that arc is within LOS of the archer, move to that point
        // if not..
        await Unit.moveTowards(unit, moveChoice.pos, underworld);
      } else {
        // ...then just move towards the enemy.  This prevents weird behavior where
        // the archer tries to path toward a point ON a wall (which is technically inaccessible),
        // and the archer will just walk forward awkardly until it hits a wall instead of pathing
        // towards the enemy
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    } else {
      // Move closer until in range (or out of stamina)
      const distanceToEnemy = math.distance(unit, closestEnemy);
      // Find a point directly towards the enemy that is closer but only just enough to be in attacking range
      const closerUntilInRangePoint = add(
        unit,
        math.similarTriangles(
          closestEnemy.x - unit.x,
          closestEnemy.y - unit.y,
          distanceToEnemy,
          distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange,
        ),
      );
      await Unit.moveTowards(unit, closerUntilInRangePoint, underworld);
    }
  }
}
