import * as math from './math';
import * as Player from './Player';
import { Vec2 } from './Vec';
import * as config from './config';

// If desired target is within range it will return the desiredTarget, else
// it will return a target in that direction as far as the player can reach.
export function getCastTarget(caster: Player.IPlayer, desiredTarget: Vec2): Vec2 {
    let target = desiredTarget;
    // This is for usability.  If the mouse is close enough to end of cast range,
    // it assumes the target is end of cast range.  This is useful especially when AOE is in the spell
    // and the player may not be paying super close attention to the center of the cast
    const castDistance = math.distance(caster.unit, target)
    if (castDistance >= caster.unit.attackRange && castDistance < caster.unit.attackRange + config.COLLISION_MESH_RADIUS * 2) {
        // If mouse is beyond cast range, change target to end of cast range.
        // This is a matter of convenience, especially for AOE where the player
        // instinctively assumes that a click will trigger the spell on the whole visible radius.
        const endOfRange = math.getCoordsAtDistanceTowardsTarget(caster.unit, target, caster.unit.attackRange);
        target = endOfRange;
    }
    return target;
}
