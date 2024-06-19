import { describe, it, expect, vi } from "vitest";
import { ForceMove, ForceMoveType, ForceMoveUnitOrPickup } from "../../jmath/moveWithCollision";
import { sumForceMoves } from "../force_move";

describe('forceMove', () => {
    describe('sumForceMoves', () => {
        it('Should sum the velocity', () => {
            const pushedObject = { x: 0, y: 0, radius: 1, inLiquid: false, immovable: false, beingPushed: false };
            const one: ForceMove = {
                type: ForceMoveType.PROJECTILE,
                pushedObject,
                velocity: { x: 1, y: 0 },
            }
            const two: ForceMove = {
                type: ForceMoveType.PROJECTILE,
                pushedObject,
                velocity: { x: 0, y: 1 },
            }
            sumForceMoves(one, two);
            expect(one.velocity).toEqual({ x: 1, y: 1 });
        });
        it('Should invoke resolve on the preexisting unit_or_pickup\'s forceMoveInst', () => {
            const pushedObject = { x: 0, y: 0, radius: 1, inLiquid: false, immovable: false, beingPushed: false };
            const one: ForceMoveUnitOrPickup = {
                type: ForceMoveType.UNIT_OR_PICKUP,
                pushedObject,
                velocity: { x: 1, y: 0 },
                canCreateSecondOrderPushes: false,
                velocity_falloff: 1,
                alreadyCollided: [],
                resolve: vi.fn(),
            }
            const two: ForceMoveUnitOrPickup = {
                type: ForceMoveType.UNIT_OR_PICKUP,
                pushedObject,
                velocity: { x: 0, y: 1 },
                canCreateSecondOrderPushes: false,
                velocity_falloff: 1,
                alreadyCollided: [],
                resolve: vi.fn()
            }
            sumForceMoves(one, two);
            expect(one.velocity).toEqual({ x: 1, y: 1 });
            expect(one.resolve).not.toHaveBeenCalled();
            expect(two.resolve).toHaveBeenCalled();
        });

    })

});