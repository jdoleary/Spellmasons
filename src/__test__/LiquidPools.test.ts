import { stampArrays, surround } from "../LiquidPools";

describe('LiquidPools', () => {
    describe('stampArrays', () => {
        it('should stamp one array overtop of another - basic', () => {
            const source = [0, 0, 0];
            stampArrays(source, 3, [1], 1, { x: 1, y: 0 });
            const expected = [0, 1, 0];
            expect(source).toEqual(expected);
        });
        it('should stamp one array overtop of another - 2d with position', () => {
            const source = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ];
            const stamp = [
                1, 2,
                3, 4,
            ]
            stampArrays(source, 3, stamp, 2, { x: 1, y: 1 });
            const expected = [
                0, 0, 0,
                0, 1, 2,
                0, 3, 4,
            ];
            expect(source).toEqual(expected);
        });
        it('should stamp one array overtop of another - 2d with position - case 2', () => {
            const source = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ];
            const stamp = [
                1, 2,
                3, 4,
            ]
            stampArrays(source, 3, stamp, 2, { x: 0, y: 1 });
            const expected = [
                0, 0, 0,
                1, 2, 0,
                3, 4, 0,
            ];
            expect(source).toEqual(expected);
        });
        // This case is not currently handled
        it.skip('should handle overflow gracefully by expanding the source', () => {
            const source = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ];
            const stamp = [
                1, 2, 3,
                4, 5, 6
            ]
            stampArrays(source, 3, stamp, 3, { x: 1, y: 0 });
            const expected = [
                0, 1, 2, 3,
                0, 4, 5, 6,
                0, 0, 0, 0
            ];
            expect(source).toEqual(expected);
        });
    });
    describe('surround', () => {
        it('should return the array surrounded with 0\'s', () => {
            const actual = surround([1], 1);
            const expected = {
                tiles: [
                    0, 0, 0,
                    0, 1, 0,
                    0, 0, 0
                ], width: 3
            };
            expect(actual).toEqual(expected);
        });
        it('should work for tall matricies', () => {
            const actual = surround([
                1,
                1,
                1
            ], 1);
            const expected = {
                tiles: [
                    0, 0, 0,
                    0, 1, 0,
                    0, 1, 0,
                    0, 1, 0,
                    0, 0, 0
                ], width: 3
            };
            expect(actual).toEqual(expected);
        });
        it('should work for wide matricies', () => {
            const actual = surround([
                1, 1, 1
            ], 3);
            const expected = {
                tiles: [
                    0, 0, 0, 0, 0,
                    0, 1, 1, 1, 0,
                    0, 0, 0, 0, 0,
                ], width: 5
            };
            expect(actual).toEqual(expected);
        });

    });
});