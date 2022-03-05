
import type { Vec2 } from "../Vec";
import { testables, makePolygonIndexIterator, Polygon } from '../PathfindingAttempt3';

const { getLoopableIndex } = testables;
describe('testables', () => {
    describe('getLoopableIndex', () => {
        it('should return array[n] if n is within the limit of the array', () => {
            const array = [0, 1, 2, 3];
            const index = 1;
            const actual = getLoopableIndex(index, array);
            const expected = index;
            expect(actual).toEqual(expected);
        });
        it('should return the proper element as if the array looped infinitely when index is > the limit of the array', () => {
            const array = [0, 1, 2, 3];
            const outOfBoundsAmount = 2;
            const index = array.length + outOfBoundsAmount;
            const actual = getLoopableIndex(index, array);
            const expected = outOfBoundsAmount;
            expect(actual).toEqual(expected);
        });
        it('should return the proper element as if the array looped infinitely when index is < 0', () => {
            const array = [0, 1, 2, 3];
            const outOfBoundsAmount = -1;
            const index = outOfBoundsAmount;
            const actual = getLoopableIndex(index, array);
            const expected = 3;
            expect(actual).toEqual(expected);
        });
    });

});


describe('makePolygonIterator', () => {
    it('should iterate all the points of a polygon starting from the startPoint and looping back to the beginning until each points is iterated', () => {
        const p0 = { x: 0, y: 0 }
        const p1 = { x: 0, y: 1 }
        const p2 = { x: 1, y: 1 }
        const p3 = { x: 1, y: 0 }
        const points: Vec2[] = [p0, p1, p2, p3];
        const polygon: Polygon = { points, inverted: false }
        const iterator = makePolygonIndexIterator(polygon, 2);
        const actual = Array.from(iterator)
        const expected = [2, 3, 0, 1];
        expect(actual).toEqual(expected);
    });
    describe('given an inverted polygon', () => {
        it('should iterate all the points of a polygon IN REVERSE ORDER starting from the startPoint and looping back to the END until each points is iterated', () => {
            const p0 = { x: 0, y: 0 }
            const p1 = { x: 0, y: 1 }
            const p2 = { x: 1, y: 1 }
            const p3 = { x: 1, y: 0 }
            const points: Vec2[] = [p0, p1, p2, p3];
            const polygon: Polygon = { points, inverted: true }
            const iterator = makePolygonIndexIterator(polygon, 1);
            const actual = Array.from(iterator)
            const expected = [1, 0, 3, 2];
            expect(actual).toEqual(expected);
        });
    });
});
// describe('expandPolygon', () => {
//     it('should return a new polygon with all of its points grown by magnitude', () => {
//         const p1 = { x: 0, y: 0 }
//         const p2 = { x: 0, y: 1 }
//         const p3 = { x: 1, y: 1 }
//         const p4 = { x: 1, y: 0 }
//         const points: Vec2[] = [p1, p2, p3, p4];
//         const polygon: Polygon = { points, inverted: false };

//         const newPolygon = expandPolygon(polygon, Math.sqrt(2));
//         expect(newPolygon.points).toEqual([
//             { x: -1, y: -1 },
//             { x: -1, y: 2 },
//             { x: 2, y: 2 },
//             { x: 2, y: -1 },
//         ]);
//     });
//     it('should expand in the opposite direction for inverted polygons where the inside and outside are flipped', () => {
//         const p1 = { x: 0, y: 0 }
//         const p2 = { x: 0, y: 2 }
//         const p3 = { x: 2, y: 2 }
//         const p4 = { x: 2, y: 0 }
//         const points: Vec2[] = [p1, p2, p3, p4];
//         const polygon: Polygon = { points, inverted: true };

//         const newPolygon = expandPolygon(polygon, Math.sqrt(2));
//         expect(newPolygon.points).toEqual([
//             { x: 1, y: 1 },
//             { x: 1, y: 1 },
//             { x: 1, y: 1 },
//             { x: 1, y: 1 },
//         ]);
//     });

// });