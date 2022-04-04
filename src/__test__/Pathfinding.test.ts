import { removeBetweenIndexAtoB, pointsEveryXDistanceAlongPath } from '../Pathfinding';
import type { Vec2 } from '../Vec';
describe('Pathfinding', () => {
    describe('removeBetweenIndexAtoB', () => {
        it('should remove all the indices between A and B', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 3);
            const expected = [0, 1, 3, 4, 5];
            expect(actual).toEqual(expected);
        });
        it('should remove all the indices between A and B; 2', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 4);
            const expected = [0, 1, 4, 5];
            expect(actual).toEqual(expected);
        });
        it('should remove all the indices between A and B; 3', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, array.length);
            const expected = [0, 1];
            expect(actual).toEqual(expected);
        });
        it('should not remove any values if indexB is only one greater than indexA', () => {
            const array = [0, 1, 2, 3, 4, 5]
            const actual = removeBetweenIndexAtoB(array, 1, 2);
            const expected = array;
            expect(actual).toEqual(expected);
        });
        describe('corner cases', () => {
            it('should return the array unaltered if B is < A', () => {
                const array = [0, 1, 2, 3, 4, 5]
                const actual = removeBetweenIndexAtoB(array, 3, 1);
                const expected = array;
                expect(actual).toEqual(expected);
            });
            it('should return the array unaltered if B == A', () => {
                const array = [0, 1, 2, 3, 4, 5]
                const actual = removeBetweenIndexAtoB(array, 3, 3);
                const expected = array;
                expect(actual).toEqual(expected);
            });
        });
    });
});
describe('pointsEveryXDistanceAlongPath', () => {
    it('should return an array of points every X distance along a straight path', () => {
        const startPoint = { x: -1, y: 0 };
        const path: Vec2[] = [
            { x: 5, y: 0 },
        ]
        const actual = pointsEveryXDistanceAlongPath(startPoint, path, 2);
        const expected = [
            { x: 1, y: 0 },
            { x: 3, y: 0 },
            { x: 5, y: 0 },
        ];
        expect(actual).toEqual(expected);
    });
    it('should return an array of points every X distance along a non-straight path', () => {
        const startPoint = { x: -1, y: 0 };
        const path: Vec2[] = [
            { x: 3, y: 0 },
            { x: 3, y: 2 },
        ]
        const actual = pointsEveryXDistanceAlongPath(startPoint, path, 2);
        const expected = [
            { x: 1, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 2 },
        ];
        expect(actual).toEqual(expected);
    });
    it('should handle non-straight paths', () => {
        const startPoint = { x: -1, y: 0 };
        const path: Vec2[] = [
            { x: 2, y: 0 },
            { x: 2, y: 2 },
        ]
        const actual = pointsEveryXDistanceAlongPath(startPoint, path, 2);
        const expected = [
            { x: 1, y: 0 },
            { x: 2, y: 1 },
        ];
        expect(actual).toEqual(expected);
    });
    it('should handle distances between points that are many times greater than the distanceOfIncrements', () => {
        const startPoint = { x: 0, y: 0 };
        const path: Vec2[] = [
            { x: 10, y: 0 },
        ]
        const actual = pointsEveryXDistanceAlongPath(startPoint, path, 2);
        const expected = [
            { x: 2, y: 0 },
            { x: 4, y: 0 },
            { x: 6, y: 0 },
            { x: 8, y: 0 },
            { x: 10, y: 0 },
        ];
        expect(actual).toEqual(expected);
    });
    it('should return an array of points every X distance along a path', () => {
        const startPoint = { x: 0, y: 0 };
        const path: Vec2[] = [
            { x: 2, y: 0 },
            { x: 5, y: 0 },
            { x: 5.5, y: 0 },
            { x: 6.5, y: 0 },
            { x: 8, y: 0 },
            { x: 14, y: 0 },
            { x: 14, y: 2 },
            { x: 14, y: 3 },
            { x: 14, y: 3.5 },
            { x: 14, y: 5 },
            { x: 14, y: 6 },
        ]
        const actual = pointsEveryXDistanceAlongPath(startPoint, path, 2);
        const expected = [
            { x: 2, y: 0 },
            { x: 4, y: 0 },
            { x: 6, y: 0 },
            { x: 8, y: 0 },
            { x: 10, y: 0 },
            { x: 12, y: 0 },
            { x: 14, y: 0 },
            { x: 14, y: 2 },
            { x: 14, y: 4 },
            { x: 14, y: 6 },
        ];
        expect(actual).toEqual(expected);
    });
});