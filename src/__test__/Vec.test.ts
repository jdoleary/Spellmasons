import { getAngleBetweenVec2s, dotProduct, isBetween, magnitude } from '../Vec';

describe('vectorMath', () => {
    describe("getAngleBetweenVec2s", () => {
        it('should find the angle in radians between 2 Vec2s', () => {
            const p1 = { x: 1, y: 1 };
            const p2 = { x: 1, y: 2 };
            const actual = getAngleBetweenVec2s(p1, p2);
            const expected = Math.PI / 2;
            expect(actual).toEqual(expected);
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
});