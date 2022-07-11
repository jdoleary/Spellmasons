import { clockwiseAngle, normalizeAngle, isAngleBetweenAngles } from '../Angle';
describe('Angle', () => {
    describe('clockwiseAngle', () => {
        const testPairs = [
            [-135, 135, 90],
            [45, -45, 90],
            [-45, 45, 270],
            [355, -90, 85],
            [-90, 0, 270],
            // floating point error, but it works good enough:
            [-90, 359, 271.00000000000006],
        ];
        for (let [from, to, expected] of testPairs) {
            it(`should return the angle ${expected} going counterclockwise between the angles ${from} and ${to}`, () => {
                // @ts-expect-error ts(2532) from & to are possibly undefined
                const actual = clockwiseAngle(from * Math.PI / 180, to * Math.PI / 180) * 180 / Math.PI;
                expect(actual).toEqual(expected);
            });
        }
    });
    describe("normalizeAngle", () => {
        it("should return an angle between 0 and Math.PI*2 (positive example)", () => {
            const angle = Math.PI * 5;
            const actual = normalizeAngle(angle);
            const expected = Math.PI;
            expect(actual).toEqual(expected);
        });
        it("should not change the angle if it is already between 0 and 360", () => {
            const angle = Math.PI / 2;
            const actual = normalizeAngle(angle);
            const expected = angle;
            expect(actual).toEqual(expected);

        });
        it("should return an angle between 0 and Math.PI *2 (negative example)", () => {
            const angle = -3 * Math.PI / 2;
            const actual = normalizeAngle(angle) * 180 / Math.PI;
            const expected = 90;
            expect(actual).toEqual(expected);
        });
        it("should return an angle between 0 and Math.PI*2", () => {
            const angle = -Math.PI / 2;
            const actual = normalizeAngle(angle);
            const expected = 3 * Math.PI / 2;
            expect(actual).toEqual(expected);
        });

    });
    describe("isAngleBetweenAngles", () => {
        const testGroups: [number, number, number, boolean][] = [
            [0, -Math.PI / 2, Math.PI / 2, false],
            [2 * Math.PI - 0.1, -Math.PI / 2, Math.PI / 2, false],
            // [0, Math.PI / 2, -Math.PI / 2, true],
            // [Math.PI, Math.PI / 2, -Math.PI / 2, false],
            // [-3 * Math.PI / 4, Math.PI / 2, 0, false],
            // [-91 * Math.PI / 180, -90 * Math.PI / 180, 0, true]

        ];
        for (let [testAngle, angleLowerBound, angleUpperBound, expected] of testGroups) {
            it(`should return ${expected} for ${testAngle * 180 / Math.PI} between ${angleLowerBound * 180 / Math.PI} and ${angleUpperBound * 180 / Math.PI}`, () => {
                const actual = isAngleBetweenAngles(testAngle, angleLowerBound, angleUpperBound);
                expect(actual).toEqual(expected);
            });
        }
    });
});