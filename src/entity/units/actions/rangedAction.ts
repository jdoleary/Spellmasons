
import * as Unit from '../../Unit';
import * as math from '../../../mathematics/math';

export function getBestRangedLOSTarget(unit: Unit.IUnit): Unit.IUnit | undefined {
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