
import type { Vec2 } from "../Vec";
import { testables, makePolygonIndexIterator, Polygon, expandPolygon, mergeOverlappingPolygons } from '../PathfindingAttempt3';
const { getLoopableIndex, isVec2InsidePolygon, findFirstPointNotInsideAnotherPoly } = testables;
describe('testables', () => {
    describe('findFirstPointNotInsideAnotherPoly', () => {
        it('should return a point that is not inside any other polygons', () => {
            const firstOutsidePoint = { x: 2, y: 2 };
            const testPoly = {
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 2 },
                    firstOutsidePoint,
                    { x: 2, y: 0 }
                ],
                inverted: false
            }
            const polys = [testPoly,
                // Surrounds point at 0,0
                {
                    points: [
                        { x: -1, y: -1 },
                        { x: -1, y: 1 },
                        { x: 1, y: 1 },
                        { x: 1, y: -1 }
                    ],
                    inverted: false
                },
                // Surrounds point at 0,2
                {
                    points: [
                        { x: -1, y: 1 },
                        { x: -1, y: 3 },
                        { x: 1, y: 3 },
                        { x: 1, y: 1 }
                    ],
                    inverted: false
                },
                // Surrounds point at 2,0
                {
                    points: [
                        { x: 1, y: -1 },
                        { x: 1, y: 1 },
                        { x: 3, y: 1 },
                        { x: 3, y: -1 }
                    ],
                    inverted: false
                },
            ]
            const actual = findFirstPointNotInsideAnotherPoly(testPoly, polys);
            const expected = firstOutsidePoint;
            expect(actual).toEqual(expected);

        });

        describe('given one of the polygons is inverted', () => {

            it('should return a point that is not inside any other polygons', () => {
                const firstOutsidePoint = { x: 2, y: 0 };
                const testPoly = {
                    points: [
                        { x: 0, y: 0 },
                        { x: 0, y: 2 },
                        { x: 2, y: 2 },
                        firstOutsidePoint
                    ],
                    inverted: false
                }
                const polys = [testPoly,
                    // Surrounds point at 0,0
                    {
                        points: [
                            { x: -1, y: -1 },
                            { x: -1, y: 1 },
                            { x: 1, y: 1 },
                            { x: 1, y: -1 }
                        ],
                        inverted: false
                    },
                    // Surrounds point at 0,2
                    {
                        points: [
                            { x: -1, y: 1 },
                            { x: -1, y: 3 },
                            { x: 1, y: 3 },
                            { x: 1, y: 1 }
                        ],
                        inverted: false
                    },
                    // Surrounds all points EXCEPT 2,0 (because it is inverted)
                    {
                        points: [
                            { x: 1, y: -1 },
                            { x: 1, y: 1 },
                            { x: 3, y: 1 },
                            { x: 3, y: -1 }
                        ],
                        inverted: true
                    },
                ]
                const actual = findFirstPointNotInsideAnotherPoly(testPoly, polys);
                const expected = firstOutsidePoint;
                expect(actual).toEqual(expected);

            });
        });
    });
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
    describe('isVec2InsidePolygon', () => {
        it('should return true when the vec is inside the square', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: 0.5, y: 0.5 }, polygon);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should return false when the vec is OUTSIDE the square', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: -100, y: 0.5 }, polygon);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return false when the vec is OUTSIDE the square 2', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygon: Polygon = { points, inverted: false };
            const actual = isVec2InsidePolygon({ x: -100, y: -100 }, polygon);
            const expected = false;
            expect(actual).toEqual(expected);
        });
        it('should return true when the vec is inside a complex polygon', () => {
            const p1 = { x: 1, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 3 }
            const p5 = { x: 3, y: 3 }
            const p6 = { x: 3, y: 2 }
            const p7 = { x: 2, y: 1 }
            const p8 = { x: 3, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4, p5, p6, p7, p8];
            const polygon: Polygon = { points, inverted: false };
            // Note, the y value of this point aligns with the y value
            // of a vertex of the polygon to it's right
            // (p7).  Because of the internal implementation of 
            // isVec2InsidePolygon, it tests a straight line to the right
            // which means it'll come up with 2 intersections for that vert
            // since that vert belongs to 2 of the vetexLineSegments of the
            // poly.  There is special handling inside of isVec2InsidePolygon
            // to account for this edge case
            const actual = isVec2InsidePolygon({ x: 1, y: 1 }, polygon);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        describe('given an inverted polygon', () => {
            it('should return FALSE when the vec is inside the inverted square', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 1 }
                const p3 = { x: 1, y: 1 }
                const p4 = { x: 1, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: true };
                const actual = isVec2InsidePolygon({ x: 0.5, y: 0.5 }, polygon);
                const expected = false;
                expect(actual).toEqual(expected);
            });
            it('should return TRUE when the vec is OUTSIDE the inverted square', () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 1 }
                const p3 = { x: 1, y: 1 }
                const p4 = { x: 1, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygon: Polygon = { points, inverted: true };
                const actual = isVec2InsidePolygon({ x: -100, y: 0.5 }, polygon);
                const expected = true;
                expect(actual).toEqual(expected);
            });

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
describe('expandPolygon', () => {
    it('should return a new polygon with all of its points grown by magnitude', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 1 }
        const p3 = { x: 1, y: 1 }
        const p4 = { x: 1, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon: Polygon = { points, inverted: false };

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        expect(newPolygon.points).toEqual([
            { x: -1, y: -1 },
            { x: -1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: -1 },
        ]);
    });
    it('should expand in the opposite direction for inverted polygons where the inside and outside are flipped', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygon: Polygon = { points, inverted: true };

        const newPolygon = expandPolygon(polygon, Math.sqrt(2));
        expect(newPolygon.points).toEqual([
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1 },
        ]);
    });

});
describe('mergeOverlappingPolygons', () => {
    describe('given a regular polygon and an inverted polygon', () => {
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 2 }
        const p3 = { x: 2, y: 2 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygonA: Polygon = { points, inverted: false };
        const p1b = { x: -1, y: -1 }
        const p2b = { x: -1, y: 1 }
        const p3b = { x: 1, y: 1 }
        const p4b = { x: 1, y: -1 }
        const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
        // NOTE: polygonB is inverted, so everything OUTSIDE of it
        // is solid matter
        const polygonB: Polygon = { points: pointsb, inverted: true };
        it('should successfully merge them and (out of necessity) turn the regular polygon into an inverted polygon', () => {
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];
            const actual = mergedPolygon.points;
            const expected = [
                { x: 1, y: 0 },
                p4b,
                p1b,
                p2b,
                { x: 0, y: 1 },
                p1,
            ]
            expect(actual).toEqual(expected);

        });
        it('should still work even if the order of the polygons in the array are reversed', () => {
            const mergedPolygon = mergeOverlappingPolygons([polygonB, polygonA])[0];
            const actual = mergedPolygon.points;
            const expected = [
                p2b,
                { x: 0, y: 1 },
                p1,
                { x: 1, y: 0 },
                p4b,
                p1b,
            ]
            console.log('actual', actual);
            expect(actual).toEqual(expected);

        });

    });
    describe('given overlapping boxes on one axis', () => {
        it("should remove the overlapping verticies and return a polygon that is one large rectangle", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1,
                p1b,
                p2b,
                p3b,
                p4b,
                p4,
            ];
            expect(actual).toEqual(expected);
        });
        describe('that do not share any verticies', () => {
            it.only("should merge the two polys to return one large rectangle", () => {
                const p1 = { x: 0, y: 0 }
                const p2 = { x: 0, y: 3 }
                const p3 = { x: 1, y: 3 }
                const p4 = { x: 1, y: 0 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygonA: Polygon = { points, inverted: false };
                const p1b = { x: 0, y: 1 }
                const p2b = { x: 0, y: 4 }
                const p3b = { x: 1, y: 4 }
                const p4b = { x: 1, y: 1 }
                const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
                const polygonB: Polygon = { points: pointsb, inverted: false };
                const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

                const actual = mergedPolygon.points;
                const expected = [
                    p1,
                    p1b,
                    p2b,
                    p3b,
                    p3,
                    p4,
                ];
                console.log('actual', actual);
                expect(actual).toEqual(expected);
            });
        });
    });
    describe('given overlapping boxes on one side', () => {
        it("should merge the polygons", () => {
            // In this example one polygon has 2 points inside
            // of the other but the other has no points inside of it
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points: points, inverted: false };
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1,
                { x: 0, y: 1 },
                p1b,
                p2b,
                p3b,
                p4b,
                { x: 1, y: 1 },
                p4,
            ];
            expect(actual).toEqual(expected);
        });
        it("should still merge the polygons even if the start polygons are in reverse order", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 1, y: 2 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points: points, inverted: false };
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonB, polygonA])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1b,
                p2b,
                p3b,
                p4b,
                { x: 1, y: 1 },
                p4,
                p1,
                { x: 0, y: 1 },
            ];
            expect(actual).toEqual(expected);
        });
    });
    describe('given boxes that each share 1 vertex inside of the other', () => {
        it("should remove inside verticies and make a polygon that is the spacial addition of the two boxes", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 1, y: 3 }
            const p3b = { x: 3, y: 3 }
            const p4b = { x: 3, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon = { points: pointsb, inverted: false };
            const mergedPolygon = mergeOverlappingPolygons([polygonA, polygonB])[0];

            const actual = mergedPolygon.points;
            const expected = [
                p1,
                p2,
                { x: 1, y: 2 },
                p2b,
                p3b,
                p4b,
                { x: 2, y: 1 },
                p4,
            ];
            expect(actual).toEqual(expected);

        });
    });
    describe('given boxes that are identical', () => {
        it("should remove one box entirely", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const polygonB: Polygon = { points, inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            const actual = mergedPolygons.length;
            const expected = 1;
            expect(actual).toEqual(expected);
        });
    });
    describe('given boxes that are mostly identical', () => {
        it("should keep the larger one", () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 2 }
            const p3 = { x: 2, y: 2 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon = { points, inverted: false };
            const polygonB: Polygon = { points: [...points, { x: 1, y: -1 }], inverted: false };
            const mergedPolygons = mergeOverlappingPolygons([polygonA, polygonB]);
            const actual = mergedPolygons.length;
            const expected = 1;
            expect(actual).toEqual(expected);
            expect(JSON.stringify(mergedPolygons[0].points)).toEqual(JSON.stringify(polygonB.points));
        });
    });
    describe('given one box fully inside the other', () => {
        const polygonOutside: Polygon = {
            points: [
                { x: 0, y: 0 },
                { x: 0, y: 4 },
                { x: 4, y: 4 },
                { x: 4, y: 0 }
            ], inverted: false
        };
        const polygonInside: Polygon = {
            points: [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 2, y: 2 },
                { x: 2, y: 1 }
            ], inverted: false
        };
        it("should remove the inside box entirely", () => {
            const mergedPolygons = mergeOverlappingPolygons([polygonOutside, polygonInside]);
            const actual = JSON.stringify(mergedPolygons[0].points);
            const expected = JSON.stringify(polygonOutside.points);
            expect(actual).toEqual(expected);
        });
        it("should still remove the inside box even if the order of the boxes is reversed when passed into mergeOverlappingPolygons", () => {
            const mergedPolygons = mergeOverlappingPolygons([polygonInside, polygonOutside]);
            const actual = JSON.stringify(mergedPolygons[0].points);
            const expected = JSON.stringify(polygonOutside.points);
            expect(actual).toEqual(expected);
        });
    });
    describe('given 3 boxes, one that overlaps 2', () => {
        it('should return a single correctly merged polygon', () => {
            const largePoly: Polygon = {
                points: [
                    { x: 0, y: 0 },
                    { x: 0, y: 10 },
                    { x: 4, y: 10 },
                    { x: 4, y: 0 }
                ],
                inverted: false
            };
            const smallPoly1: Polygon = {
                points: [
                    { x: -1, y: 2 },
                    { x: -1, y: 3 },
                    { x: 1, y: 3 },
                    { x: 1, y: 2 }
                ],
                inverted: false
            };
            const smallPoly2: Polygon = {
                points: [
                    { x: -1, y: 7 },
                    { x: -1, y: 8 },
                    { x: 1, y: 8 },
                    { x: 1, y: 7 }
                ],
                inverted: false
            };
            const mergedPolygons = mergeOverlappingPolygons([largePoly, smallPoly1, smallPoly2]);
            const actual = mergedPolygons[0].points;
            const expected = [
                { x: 0, y: 0 },
                // intersection between largePoly and smallPoly1
                { x: 0, y: 2 },
                // Some of smallPoly1's points
                { x: -1, y: 2 },
                { x: -1, y: 3 },
                // intersection between largePoly and smallPoly1
                { x: 0, y: 3 },
                // back to iterating largePoly
                // intersection between largePoly and smallPoly2
                { x: 0, y: 7 },
                // Some of smallPoly2's points
                { x: -1, y: 7 },
                { x: -1, y: 8 },
                // intersection between largePoly and smallPoly2
                { x: 0, y: 8 },
                // back to iterating largePoly
                { x: 0, y: 10 },
                { x: 4, y: 10 },
                { x: 4, y: 0 }
            ];
            expect(actual).toEqual(expected);

        });
    });

});