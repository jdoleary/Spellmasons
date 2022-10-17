
import * as Unit from '../../Unit';
import * as math from '../../../jmath/math';
import Underworld from '../../../Underworld';

export function getBestRangedLOSTarget(unit: Unit.IUnit, underworld: Underworld): Unit.IUnit | undefined {
    const enemies = Unit.livingUnitsInDifferentFaction(unit, underworld);
    return enemies.reduce<{ distance: number, hasLineOfSight: boolean, unit: Unit.IUnit | undefined }>((bestTarget, enemy) => {
        const dist = math.distance(unit, enemy);
        if (Unit.inRange(unit, enemy) && underworld.hasLineOfSight(unit, enemy) && dist < bestTarget.distance) {
            return { distance: dist, hasLineOfSight: true, unit: enemy }
        } else {
            return bestTarget;
        }
    }, { distance: Number.MAX_SAFE_INTEGER, hasLineOfSight: false, unit: undefined }).unit;

}