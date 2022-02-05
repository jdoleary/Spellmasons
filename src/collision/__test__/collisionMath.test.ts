import { LineSegment, findWherePointIntersectLineSegmentAtRightAngle, lineSegmentIntersection, testables } from '../collisionMath';
const { slope, toStandardForm } = testables;
describe('collisionMath', () => {
    // describe('intersectionOfLines', () => {
    //     it('should return the point of intersection for 2 lines', () => {
    //         const ls1: LineSegment = { p1: { x: -1, y: -1 }, p2: { x: 1, y: 1 } };
    //         const ls2: LineSegment = { p1: { x: -1, y: 1 }, p2: { x: 1, y: -1 } };
    //         const l1 = toStandardForm(ls1);
    //         const l2 = toStandardForm(ls2);
    //         const actual = intersectionOfLines(l1 as LineInStandardForm, l2 as LineInStandardForm);
    //         const expected = { x: 0, y: 0 };
    //         expect(actual).toEqual(expected);

    //     });
    //     it('should handle 1 vertical line', () => {
    //         const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
    //         const ls2: LineSegment = { p1: { x: 1, y: -1 }, p2: { x: 1, y: 1 } };
    //         const l1 = toStandardForm(ls1);
    //         const l2 = toStandardForm(ls2);
    //         console.log("jtest ", l2);
    //         const actual = intersectionOfLines(l1, l2);
    //         const expected = { x: 1, y: 0 };
    //         expect(actual).toEqual(expected);

    //     });
    //     it('should handle 2 vertical lines', () => { });
    //     it('should handle overlapping lines', () => { });
    // });
    describe('intersectionOfLineSegments', () => {
        it('should return the point of intersection for 2 lines', () => {
            const ls1: LineSegment = { p1: { x: -1, y: -1 }, p2: { x: 1, y: 1 } };
            const ls2: LineSegment = { p1: { x: -1, y: 1 }, p2: { x: 1, y: -1 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = { x: 0, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should handle intersections for vertical lines', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
            const ls2: LineSegment = { p1: { x: 1, y: -1 }, p2: { x: 1, y: 1 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = { x: 1, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should return undefined for colinear lines that intersect', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
            const ls2: LineSegment = { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            // Note: Technically there are infinite intersecting points,
            // but I'm opting to return undefined in this corner case.
            // I may decide to change this in the future
            const expected = undefined
            expect(actual).toEqual(expected);
        });
        it('should return undefined for colinear lines that do NOT intersect', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
            const ls2: LineSegment = { p1: { x: 3, y: 0 }, p2: { x: 4, y: 0 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = undefined;
            expect(actual).toEqual(expected);
        });
        it('should return undefined for line segments that do not intersect', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
            const ls2: LineSegment = { p1: { x: 1, y: 10 }, p2: { x: 2, y: 0.5 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = undefined;
            expect(actual).toEqual(expected);
        });
        it('should return undefined for parallel, non-intersecting lines', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
            const ls2: LineSegment = { p1: { x: 0, y: 10 }, p2: { x: 2, y: 10 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = undefined;
            expect(actual).toEqual(expected);
        });
    });
    describe('toStandardForm', () => {
        it('Should convert a lineSegment to a line in standard form', () => {
            const p1 = { x: 1, y: 2 };
            const p2 = { x: 2, y: 3 };
            const actual = toStandardForm({ p1, p2 })
            const expected = {
                a: -1,
                x: 1,
                b: 1,
                y: 2,
                c: -1
            };
            expect(actual).toEqual(expected);
        });
        it('Should return undefined if the line\'s slope is undefined ', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 0, y: 2 };
            const actual = toStandardForm({ p1, p2 })
            const expected = undefined;
            expect(actual).toEqual(expected);
        });

    });
    describe('slope', () => {
        it('Should return the slope of a line: example 1', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 2, y: 0 };
            const actual = slope({ p1, p2 })
            const expected = 0;
            expect(actual).toEqual(expected);
        });
        it('Should return the slope of a line: example 2', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 2, y: 2 };
            const actual = slope({ p1, p2 })
            const expected = 1;
            expect(actual).toEqual(expected);
        });
        it('Should handle an undefined slope', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 0, y: 2 };
            const actual = slope({ p1, p2 })
            const expected = undefined;
            expect(actual).toEqual(expected);
        });
    });
    describe('findWherePointIntersectLineSegmentAtRightAngle', () => {
        it('should return the point if the point is on the line segment already', () => {
            const point = { x: 1, y: 1 };
            const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = point;
            expect(actual).toEqual(expected);
        });
        it('should handle a vertical line1 (slope is undefined)', () => {
            const point = { x: 1, y: 2 };
            const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 3 } };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 0, y: 2 };
            expect(actual).toEqual(expected);
        });
        it('should handle a vertical line2 (slope is undefined)', () => {
            const point = { x: 1, y: 1 };
            const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 3, y: 0 } };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 1, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should return the point of intersection between a vector from the point at a right angle towards the line and the line segment', () => {
            const point = { x: 3, y: 0 };
            const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 1.5, y: 1.5 };
            expect(actual).toEqual(expected);
        });
        it('should return the point of intersection between a vector from the point at a right angle towards the line and the line segment when the point is at a perfect right angle from p2', () => {
            const point = { x: 5, y: 3 };
            const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 4, y: 4 } };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 4, y: 4 };
            expect(actual).toEqual(expected);
        });
        it('should return the point of intersection between a vector from the point at a right angle towards the line and the line segment - with different length A and B', () => {
            const point = { x: 4, y: 2 };
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 4, y: 4 };
            const line: LineSegment = { p1, p2 };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 3, y: 3 };
            expect(actual).toEqual(expected);
        });
        it('should return the point of intersection even if p1 and p2 are reversed', () => {
            const point = { x: 4, y: 2 };
            const p1 = { x: 4, y: 4 };
            const p2 = { x: 0, y: 0 };
            const line: LineSegment = { p1, p2 };
            const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
            const expected = { x: 3, y: 3 };
            expect(actual).toEqual(expected);
        });
        describe("when intersection is not on the line segment", () => {
            it('should return undefined (when line is vertical)', () => {
                const point = { x: 0, y: 4 };
                const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 3 } };
                const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
                const expected = undefined;
                expect(actual).toEqual(expected);
            });
            it('should return undefined (line is horizontal)', () => {
                const point = { x: 4, y: 0 };
                const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 3, y: 0 } };
                const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
                const expected = undefined;
                expect(actual).toEqual(expected);
            });
            it('should return undefined', () => {
                const point = { x: 2, y: 2 };
                const line: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };
                const actual = findWherePointIntersectLineSegmentAtRightAngle(point, line);
                const expected = undefined;
                expect(actual).toEqual(expected);
            });
        });
    });
    describe('intersectionOfLineSegments', () => {
        it('should return the point of intersection of two line segments', () => {

        });
        it('should handle vertical lines', () => { });
        it('should return undefined if the point is not on the first line segment', () => { });
        it('should return undefined if the point is not on the second line segment', () => { });

    });
});