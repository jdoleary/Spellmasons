
import * as Unit from '../../Unit';
import * as math from '../../../jmath/math';
import Underworld from '../../../Underworld';

export function getBestRangedLOSTarget(unit: Unit.IUnit, underworld: Underworld): Unit.IUnit[] {
    const enemies = Unit.livingUnitsInDifferentFaction(unit, underworld);
    const attackableEnemies = enemies.filter(enemy => {
        return Unit.inRange(unit, enemy) && underworld.hasLineOfSight(unit, enemy);
    }).map(enemy => {
        return { enemy, distance: math.distance(unit, enemy) };
    });
    const sortedByDistanceAttackableEnemies = attackableEnemies.sort((a, b) => {
        return a.distance - b.distance;
    });
    return sortedByDistanceAttackableEnemies.map(e => e.enemy);
}