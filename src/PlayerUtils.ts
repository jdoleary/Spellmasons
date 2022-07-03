import * as math from './math';
import * as Player from './Player';
import { Vec2 } from './Vec';

export function isOutOfRange(caster: Player.IPlayer, target: Vec2): boolean {
    const castDistance = math.distance(caster.unit, target)
    return castDistance > caster.unit.attackRange;
}
export function getEndOfRangeTarget(caster: Player.IPlayer, target: Vec2): Vec2 {
    return math.getCoordsAtDistanceTowardsTarget(caster.unit, target, caster.unit.attackRange);
}
