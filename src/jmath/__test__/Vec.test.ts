import { describe, it, expect } from "vitest";
import { getAngleBetweenVec2s, dotProduct, isBetween, magnitude, clampVector, normalized } from '../Vec';

describe('vectorMath', () => {
    describe("getAngleBetweenVec2s", () => {
        [
            { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, expected: 0 },
            { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 }, expected: Math.PI / 4 },
            { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 }, expected: Math.PI / 2 },
            { p1: { x: 0, y: 0 }, p2: { x: -1, y: 1 }, expected: 3 * Math.PI / 4 },
            { p1: { x: 0, y: 0 }, p2: { x: -1, y: -1 }, expected: -3 * Math.PI / 4 },
            { p1: { x: 0, y: 0 }, p2: { x: -1, y: 0 }, expected: Math.PI },
        ].map(({ p1, p2, expected }) => {
            it(`expect angle between ${p1.x},${p1.y} and ${p2.x},${p2.y} to be ${expected} radians (${expected * 180 / Math.PI} degrees)`, () => {
                const actual = getAngleBetweenVec2s(p1, p2);
                expect(actual).toEqual(expected);
            });
        });
    });

    describe('magnitude', () => {
        it('should return the magnitude of the vector', () => {
            const v = { x: 3, y: 4 };
            const actual = magnitude(v);
            const expected = 5;
            expect(actual).toEqual(expected);
        });
    });
    describe('dotProduct of 2 vectors', () => {
        it('should return 21 for a dot product of vectors with a magnitude of 6, 7 and an angle of 60 degrees', () => {
            const v1 = { x: 3, y: 3 * Math.sqrt(3) };
            const v2 = { x: 7, y: 0 }
            const actual = Math.round(dotProduct(v1, v2));
            const expected = 21;
            expect(actual).toEqual(expected);
        });
        it('should return 11 for [1,2] dot [3,4]', () => {
            const v1 = { x: 1, y: 2 };
            const v2 = { x: 3, y: 4 }
            const actual = dotProduct(v1, v2);
            const expected = 11;
            expect(actual).toEqual(expected);
        });

    });
    describe('isBetween', () => {
        [
            {
                expected: false,
                testPoint: { x: 2, y: 0 },
                boundingPoint: { x: -1, y: -1 },
                boundingPoint2: { x: 1, y: 1 }
            },
            {
                expected: true,
                testPoint: { x: 0, y: 0 },
                boundingPoint: { x: -1, y: -1 },
                boundingPoint2: { x: 1, y: 1 }
            },
            {
                expected: true,
                testPoint: { x: 0, y: 0 },
                boundingPoint: { x: 1, y: 1 },
                boundingPoint2: { x: -1, y: -1 }
            },
            {
                expected: true,
                testPoint: { x: 0, y: 0 },
                boundingPoint: { x: -1, y: 1 },
                boundingPoint2: { x: 1, y: -1 }
            },
            {
                expected: true,
                testPoint: { x: 0, y: 0 },
                boundingPoint: { x: 1, y: -1 },
                boundingPoint2: { x: -1, y: 1 }
            },

        ].forEach(({ expected, testPoint, boundingPoint, boundingPoint2 }) => {
            it(`should return ${expected} for ${JSON.stringify(testPoint)} between ${JSON.stringify(boundingPoint)} and ${JSON.stringify(boundingPoint2)}`, () => {
                const actual = isBetween(testPoint, boundingPoint, boundingPoint2);
                expect(actual).toEqual(expected);
            });
        });
    });
    describe('normalized', () => {
        it('should normalize 4,4 to 1/Math.sqrt(2),1/Math.sqrt(2)', () => {
            const actual = normalized({ x: 4, y: 4 });
            const expected = { x: 1 / Math.sqrt(2), y: 1 / Math.sqrt(2) };
            expect(actual).toEqual(expected);
        });
        it('should normalize 3,4 to 0.6,0.8', () => {
            const actual = normalized({ x: 3, y: 4 });
            const expected = { x: 0.6, y: 0.8 };
            expect(actual).toEqual(expected);
        });
        it('should normalize 8,0 to 1,0', () => {
            const actual = normalized({ x: 8, y: 0 });
            const expected = { x: 1, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should normalize 0,9 to 0,1', () => {
            const actual = normalized({ x: 0, y: 9 });
            const expected = { x: 0, y: 1 };
            expect(actual).toEqual(expected);
        });

    });
    describe('clampVector', () => {
        it('should not modify the vector if it\'s magnitude is less than the clamp magnitude', () => {
            const vec = { x: 10, y: 0 };
            const actual = clampVector(vec, 20);
            const expected = { x: 10, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should clamp the vector to the max magnitude', () => {
            const vec = { x: 10, y: 0 };
            const actual = clampVector(vec, 5);
            const expected = { x: 5, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should support clamping the magnitude with angled vectors', () => {
            const vec = { x: 6, y: 8 };
            const actual = clampVector(vec, 5);
            const expected = { x: 3, y: 4 };
            expect(actual).toEqual(expected);
        });
    });
});