import * as math from './jmath/math';
import * as Player from './entity/Player';
import { Vec2 } from './jmath/Vec';
import * as config from './config';

export function isOutOfRange(caster: Player.IPlayer, target: Vec2, allowCoyoteCastMargin: boolean): boolean {
    const castDistance = math.distance(caster.unit, target)
    return castDistance > caster.unit.attackRange + (allowCoyoteCastMargin ? config.CAST_RANGE_COYOTE_MARGIN : 0);
}

export function getEndOfRange(caster: Player.IPlayer, target: Vec2): Vec2 {
    return math.getCoordsAtDistanceTowardsTarget(caster.unit, target, caster.unit.attackRange);
}
// A CONVENIENCE function that adjusts the target to end range if the player clicks
// just beyond end range and is trying to target end range so they don't have to be pixel perfect
export function getAdjustedCastTarget(caster: Player.IPlayer, target: Vec2): Vec2 {
    if (isOutOfRange(caster, target, false) && !isOutOfRange(caster, target, true)) {
        // If the mouse is out of the cast range but WITHIN the cast range + margin, change the target
        // to the end of range
        return getEndOfRange(caster, target);
    } else {
        return target;
    }

}
