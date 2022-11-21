import { stampMatricies, surround } from "../LiquidPools";

describe('LiquidPools', () => {
    describe('stampArrays', () => {
        it('should stamp one array overtop of another - basic', () => {
            const source = [0, 0, 0];
            stampMatricies(source, 3, [1], 1, { x: 1, y: 0 });
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
            stampMatricies(source, 3, stamp, 2, { x: 1, y: 1 });
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
            stampMatricies(source, 3, stamp, 2, { x: 0, y: 1 });
            const expected = [
                0, 0, 0,
                1, 2, 0,
                3, 4, 0,
            ];
            expect(source).toEqual(expected);
        });
        // This is my choice to just not have the stamp do anything
        // in order to prevent overflow.  There are other ways this could be
        // handled, but this is the simplest to prevent a stamp from
        // corrupting the source by wrapping in the event that it would overflow
        it('should not stamp if the stamp would overflow the source - overflow wide', () => {
            const source = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ];
            const expected = JSON.parse(JSON.stringify(source));
            const stamp = [
                1, 2, 3,
                4, 5, 6
            ]
            stampMatricies(source, 3, stamp, 3, { x: 1, y: 0 });
            expect(source).toEqual(expected);
        });
        it('should not stamp if the stamp would overflow the source - overflow tall', () => {
            const source = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ];
            const expected = JSON.parse(JSON.stringify(source));
            const stamp = [
                1, 2, 3,
                4, 5, 6
            ]
            stampMatricies(source, 3, stamp, 3, { x: 0, y: 2 });
            expect(source).toEqual(expected);
        });
    });
    describe('surround', () => {
        it('should return the array surrounded with 0\'s', () => {
            const actual = surround([1], 1);
            const expected = {
                contents: [
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
                contents: [
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
                contents: [
                    0, 0, 0, 0, 0,
                    0, 1, 1, 1, 0,
                    0, 0, 0, 0, 0,
                ], width: 5
            };
            expect(actual).toEqual(expected);
        });

    });
});
