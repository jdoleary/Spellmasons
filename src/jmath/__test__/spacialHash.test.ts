import { generateHash, testable, getElementsSortedByDistance } from '../spacialHash';
import { vec2ToString } from '../Vec';
const {
    getCell, getElementsInHash, getRings
} = testable;

const cellSize = 10;
describe('spacialHash', () => {
    describe('getCell', () => {
        [
            { element: { x: 1, y: 1 }, expectedCell: { x: 0, y: 0 } },
            { element: { x: 0, y: 0 }, expectedCell: { x: 0, y: 0 } },
            { element: { x: 8, y: 1 }, expectedCell: { x: 0, y: 0 } },
            { element: { x: 10, y: 1 }, expectedCell: { x: 1, y: 0 } },
            { element: { x: 19, y: 1 }, expectedCell: { x: 1, y: 0 } },
            { element: { x: -1, y: -1 }, expectedCell: { x: -1, y: -1 } },
            { element: { x: 1, y: -1 }, expectedCell: { x: 0, y: -1 } },
            { element: { x: 1, y: 11 }, expectedCell: { x: 0, y: 1 } },

        ].map(({ element, expectedCell }) => {
            it(`Element ${vec2ToString(element)} should be within ${vec2ToString(expectedCell)}`, () => {
                const actual = getCell(element, cellSize);
                expect(actual).toEqual(expectedCell);
            });
        })
    })
    describe('generateHash', () => {
        it('it should return a hash of arrays of elements indexed at the cell that they are within', () => {
            const elements = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: -1, y: -1 },
                { x: -9, y: -1 },
                { x: 10, y: 10 },
            ];
            const actual = generateHash(elements, cellSize);
            const expected = {
                '0,0': [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                '-1,-1': [
                    { x: -1, y: -1 },
                    { x: -9, y: -1 },
                ],
                '1,1': [
                    { x: 10, y: 10 },
                ]
            }
            expect(actual).toEqual(expected);
        });
    });
    describe('getRings', () => {
        [
            { start: { x: 0, y: 0 }, ringsAway: 0, expected: ['0,0'] },
            {
                start: { x: 0, y: 0 }, ringsAway: 1, expected: [
                    '1,-1',
                    '1,0',
                    '1,1',
                    '0,1',
                    '-1,1',
                    '-1,0',
                    '-1,-1',
                    '0,-1',
                ]
            },
            {
                start: { x: 0, y: 0 }, ringsAway: 2, expected: [
                    '2,-2',
                    '2,-1',
                    '2,0',
                    '2,1',
                    '2,2',
                    '1,2',
                    '0,2',
                    '-1,2',
                    '-2,2',
                    '-2,1',
                    '-2,0',
                    '-2,-1',
                    '-2,-2',
                    '-1,-2',
                    '0,-2',
                    '1,-2',
                ]
            },
            {
                start: { x: 0, y: 10 }, ringsAway: 1, expected: [
                    '1,9',
                    '1,10',
                    '1,11',
                    '0,11',
                    '-1,11',
                    '-1,10',
                    '-1,9',
                    '0,9',
                ]
            },

        ].map(({ start, ringsAway, expected }) => {
            it(`should return ${JSON.stringify(expected)} given start ${vec2ToString(start)} and ringsAway: ${ringsAway}`, () => {
                const actual = getRings(start, ringsAway);
                expect(actual).toEqual(expected);
            });
        });
    });
    describe('getElementsInHash', () => {
        it('should return all the elements within X rings of startCell in hash', () => {
            const hash = {
                '0,0': [{ x: 1, y: 1 }, { x: 2, y: 2 }],
                '1,0': [{ x: 11, y: 0 }],
                '2,0': [{ x: 21, y: 0 }],
                '3,0': [{ x: 31, y: 0 }],
            };
            const actual = getElementsInHash(hash, { x: 0, y: 0 }, 2);
            const expected = [
                { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 11, y: 0 }, { x: 21, y: 0 }
            ];
            expect(actual).toEqual(expected);
        });
    });
    it('should return an array of Vec2s sorted by distance', () => {
        const points = [
            { x: 21, y: 1 },
            { x: 1, y: 1 },
            { x: 100, y: 100 },
            { x: 11, y: 1 },
            { x: -11, y: 1 },
            { x: -30, y: 0 },
            { x: -30, y: -30 },
        ];
        const hash = generateHash(points, cellSize);
        const actual = getElementsSortedByDistance({ x: 0, y: 0 }, 30, hash, cellSize);
        const expected = [
            { x: 1, y: 1 },
            { x: 11, y: 1 },
            { x: -11, y: 1 },
            { x: 21, y: 1 },
            { x: -30, y: 0 },
            { x: -30, y: -30 },
        ]
        expect(actual).toEqual(expected);
    });
    describe('find nearest in list', () => {
        it('should not return self', () => {
            const source = { x: 0, y: 0 };
            const points = [
                source,
            ];
            const expected = undefined;
            const actual = findNearestInList(source, points);
            expect(actual).toEqual(expected);
        });
        it('should return the nearest point', () => {
            const source = { x: 0, y: 0 };
            const nearest = { x: 1, y: 1 };
            const points = [
                source,
                { x: 21, y: 1 },
                nearest,
                { x: 100, y: 100 },
                { x: 11, y: 1 },
                { x: -11, y: 1 },
                { x: -30, y: 0 },
                { x: -30, y: -30 },
            ];
            const expected = nearest;
            const actual = findNearestInList(source, points);
            expect(actual).toEqual(expected);
        });
        it('should return the nearest point even if the nearest point is in a farther ring than a farther point in a closer ring', () => {
            const source = { x: 0, y: 0 };
            const nearest = { x: 10, y: 0 };
            const points = [
                source,
                // 9,9 is farther away from source than 10,0
                { x: 9, y: 9 },
                nearest,
            ];
            const expected = nearest;
            const actual = findNearestInList(source, points);
            expect(actual).toEqual(expected);
        });

    });

});