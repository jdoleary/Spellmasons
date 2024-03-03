import { ForceMove, ForceMoveType } from "../../jmath/moveWithCollision";
import { sumForceMoves } from "../force_move";

describe('forceMove', () => {
    describe('sumForceMoves', () => {
        it('Should sum the velocity', () => {
            const pushedObject = { x: 0, y: 0, radius: 1, inLiquid: false, immovable: false, beingPushed: false };
            const one: ForceMove = {
                type: ForceMoveType.UNIT_OR_PICKUP,
                pushedObject,
                velocity: { x: 1, y: 0 }
            }
            const two: ForceMove = {
                type: ForceMoveType.UNIT_OR_PICKUP,
                pushedObject,
                velocity: { x: 0, y: 1 }
            }
            sumForceMoves(one, two);
            expect(one.velocity).toEqual({ x: 1, y: 1 });

        })

    })

});