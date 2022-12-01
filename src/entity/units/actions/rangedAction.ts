
import * as Unit from '../../Unit';
import * as math from '../../../jmath/math';
import Underworld from '../../../Underworld';

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