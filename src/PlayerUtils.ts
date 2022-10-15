import * as math from './jmath/math';
import * as Player from './entity/Player';
import * as config from './config';
import { Vec2 } from './jmath/Vec';
import Underworld from './Underworld';

export function isOutOfRange(caster: Player.IPlayer, target: Vec2, underworld: Underworld): boolean {
    const castDistance = math.distance(caster.unit, target);
    const inRange = castDistance <= caster.unit.attackRange;
    if (inRange) {
        return false;
    } else {
        // Check to see if targeting a unit, pickup, or doodad that has a piece of itself in range
        const unitAtCastLocation = underworld.getUnitAt(target, false);
        if (unitAtCastLocation && math.distance(caster.unit, unitAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
            return false;
        }
        const pickupAtCastLocation = underworld.getPickupAt(target, false);
        if (pickupAtCastLocation && math.distance(caster.unit, pickupAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
            return false;
        }
        const doodadAtCastLocation = underworld.getDoodadAt(target, false);
        if (doodadAtCastLocation && math.distance(caster.unit, doodadAtCastLocation) <= caster.unit.attackRange + config.COLLISION_MESH_RADIUS) {
            return false;
        }
        // Finally, the target is out of range
        return true;
    }
}

export function getEndOfRange(caster: Player.IPlayer, target: Vec2): Vec2 {
    return math.getCoordsAtDistanceTowardsTarget(caster.unit, target, caster.unit.attackRange);
}
