import { LineSegment } from '../collision/lineSegment';
import { Polygon2, mergePolygon2s, toLineSegments, processLineSegment, mergeCollinearOverlappingSameDirectionLines } from '../Polygon2';
import { Vec2, clone } from '../Vec';

describe('Polygon2', () => {
    describe('mergeColinearOverlappingSameDirectionLines', () => {
        describe('the possible types of merges', () => {
            it('should merge correctly when B.p1 is inside A.p1 and A.p2 and B.p2 is outside', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: A.p1, p2: B.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when B.p1 is before A.p1 and B.p2 is between A.p1 and A.p2', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: -1, y: 0 }, p2: { x: 1, y: 0 } };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: B.p1, p2: A.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when B completely encompases A', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: B.p1, p2: B.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when A completely encompases B', () => {
                const A = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const B = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: A.p1, p2: A.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when A.p2 == B.p1', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: clone(A.p2), p2: { x: 4, y: 0 } };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: A.p1, p2: B.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when A.p1 == B.p2', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: -1, y: 0 }, p2: clone(A.p1) };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    { p1: B.p1, p2: A.p2 },
                ]
                expect(actual).toEqual(expected);
            });
            it('should merge correctly when lines are identical', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: clone(A.p1), p2: clone(A.p2) };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    A,
                ]
                expect(actual).toEqual(expected);
            });
            it('should NOT merge when lines are identical but reversed', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: clone(A.p2), p2: clone(A.p1) };
                const actual = mergeCollinearOverlappingSameDirectionLines([A, B]);
                const expected = [
                    A,
                    B
                ]
                expect(actual).toEqual(expected);
            });
        })
        it('should return an array of merged lines', () => {
            const lines = [
                { p1: { x: -1, y: 0 }, p2: { x: 0, y: 0 } },
                { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
                { p1: { x: 0, y: 0 }, p2: { x: 4, y: 0 } },
            ]
            const actual = mergeCollinearOverlappingSameDirectionLines(lines);
            const expected = [
                { p1: { x: -1, y: 0 }, p2: { x: 4, y: 0 } },
            ]
            expect(actual).toEqual(expected);
        });
        it('should NOT merge overlapping colinear lines pointing in opposite directions', () => {
            const lines = [
                { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: 11, y: 0 }, p2: { x: 0, y: 0 } },
            ]
            const actual = mergeCollinearOverlappingSameDirectionLines(lines);
            const expected = [
                { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: 11, y: 0 }, p2: { x: 0, y: 0 } },
            ]
            expect(actual).toEqual(expected);
        });
        it('should NOT merge nonoverlapping colinear lines pointing in the same direction', () => {
            const lines = [
                { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: -10, y: 0 }, p2: { x: -1, y: 0 } },
            ]
            const actual = mergeCollinearOverlappingSameDirectionLines(lines);
            const expected = [
                { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: -10, y: 0 }, p2: { x: -1, y: 0 } },
            ]
            expect(actual).toEqual(expected);
        });
        it('should NOT merge only noncolinear lines', () => {
            const lines = [
                { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: -10, y: 1 }, p2: { x: 5, y: 1 } },
            ]
            const actual = mergeCollinearOverlappingSameDirectionLines(lines);
            const expected = [
                { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
                { p1: { x: -10, y: 1 }, p2: { x: 5, y: 1 } },
            ]
            expect(actual).toEqual(expected);
        });

    });
    describe('toLineSegments', () => {
        it('should turn a polygon2 into an array of line segments', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 1, y: 0 };
            const p3 = { x: 2, y: 0 };
            const poly = [
                p1, p2, p3
            ]
            const actual = toLineSegments(poly);
            const expected = [
                { p1: p1, p2: p2 },
                { p1: p2, p2: p3 },
                { p1: p3, p2: p1 },
            ]
            expect(actual).toEqual(expected);
        });
        it('should return an empty array if the polygon has no points', () => {
            const poly: Polygon2 = []
            const actual = toLineSegments(poly);
            const expected: LineSegment[] = []
            expect(actual).toEqual(expected);
        });

    });
    describe('processLineSegment', () => {
        it('real-world example: handle case when all lines have dangling beginnings', () => {
            // Before this commit's change, this caused an infinite loop because the processLineSegments
            // function was checking intersection and p2 instead of intersection and next intersection
            // to see if the poly had fully looped and was about to start over
            const a = { p1: { x: 192, y: 167 }, p2: { x: 0, y: 167 } };
            const b = { p1: { x: 25, y: 192 }, p2: { x: 25, y: 0 } };
            const c = { p1: { x: 0, y: 20 }, p2: { x: 192, y: 20 } };
            const d = { p1: { x: 128, y: -64 }, p2: { x: 128, y: 128 } };
            const e = { p1: { x: 128, y: 64 }, p2: { x: 128, y: 320 } };
            const f = { p1: { x: 192, y: 167 }, p2: { x: 0, y: 167 } };
            const lineSegments = [a, b, c, d, e, f];
            const actual = processLineSegment(lineSegments[0] as LineSegment, lineSegments);
            const expected: Vec2[] = [
                { x: 25, y: 167 },
                { x: 25, y: 20 },
                { x: 128, y: 20 },
                { x: 128, y: 64 },
                { x: 128, y: 167 }
            ];
            expect(actual).toEqual(expected);

        });
        describe('finishing a polygon in the middle of dangling lines', () => {
            let lineSegments: LineSegment[] = [];
            // b,c,d,e,b make up the square
            const b = { x: 0, y: 0 };
            const c = { x: 0, y: 5 };
            const d = { x: 5, y: 5 };
            const e = { x: 5, y: 0 };
            beforeEach(() => {
                // a is dangling before the square
                const a = { x: 0, y: -5 };
                // f is dangling after the square
                const f = { x: 5, y: -5 };
                const g = { x: 6, y: -6 };

                lineSegments = [
                    { p1: a, p2: b },
                    { p1: b, p2: c },
                    { p1: c, p2: d },
                    { p1: d, p2: e },
                    { p1: e, p2: b },
                    { p1: b, p2: f },
                    { p1: f, p2: g },
                ];
            })
            it('should discard dangling lines before and dangling lines after', () => {
                processLineSegment(lineSegments[0] as LineSegment, lineSegments);
                const actual = lineSegments;
                // Empty intentionally, all of the line segments should be used 
                // in the poly returned from processLineSegment, or omitted
                const expected: LineSegment[] = [];
                expect(actual).toEqual(expected);

            });
            it('should not include any of the dangling lines (before nor after) in the final polygon', () => {
                const poly = processLineSegment(lineSegments[0] as LineSegment, lineSegments);
                const actual = poly;
                const expected = [
                    b, c, d, e
                ];
                expect(actual).toEqual(expected);

            });
        })
        describe('mallet example', () => {
            let lineSegments: LineSegment[] = [];
            beforeEach(() => {
                lineSegments = [
                    // mallet head:
                    ...toLineSegments([
                        { x: 0, y: 0 },
                        { x: 0, y: 3 },
                        { x: 3, y: 3 },
                        { x: 3, y: 0 },
                    ]),
                    // mallet handle:
                    ...toLineSegments([
                        { x: -1, y: 2 },
                        { x: 1, y: 2 },
                        { x: 1, y: 1 },
                        { x: -1, y: 1 },
                    ]),
                ]
            })

            it('should remove lineSegments as they are processed and split line segments up if they are branched off of an intersection instead of an end point; dangling linesegments should be removed entirely because they share a vertex with the polygon that was just created but did not become a part of it', () => {
                processLineSegment(lineSegments[0] as LineSegment, lineSegments);
                const actual = lineSegments;
                const expected: LineSegment[] = [
                    { p1: { x: 1, y: 2 }, p2: { x: 1, y: 1 } }
                ];
                expect(actual).toEqual(expected);
            });
            it('should merge the mallet into one polygon', () => {
                const actual = processLineSegment(lineSegments[0] as LineSegment, lineSegments)
                const expected: Polygon2 = [
                    { x: 0, y: 0 },
                    // intersection
                    { x: 0, y: 1 },
                    { x: -1, y: 1 },
                    { x: -1, y: 2 },
                    // intersection
                    { x: 0, y: 2 },
                    { x: 0, y: 3 },
                    { x: 3, y: 3 },
                    { x: 3, y: 0 },
                ];
                expect(actual).toEqual(expected);
            });
        });
        it('should not return a poly if a lone linesegment doesn\'t connect to other line segments that eventually close the shape', () => {
            const lineSegment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 100 } }
            // These don't touch
            const lineSegment2 = { p1: { x: 1, y: 0 }, p2: { x: 1, y: 100 } }
            const actual = processLineSegment(lineSegment, [lineSegment, lineSegment2])
            const expected: Polygon2 = [];
            expect(actual).toEqual(expected);
        });
        it('should not return a poly if a lone linesegment doesn\'t connect to other line segments that eventually close the shape; 2nd example', () => {
            const lineSegment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 100 } }
            // These do touch but don't form a closed polygon
            const lineSegment2 = { p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } }
            const actual = processLineSegment(lineSegment, [lineSegment, lineSegment2])
            const expected: Polygon2 = [];
            expect(actual).toEqual(expected);
        });
        it('should omit line segments that are not part of the reconnected shape', () => {
            const pole = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 100 } }
            const flagPolygon = [

                { x: 0, y: 100 },
                { x: 1, y: 100 },
                { x: 1, y: 99 },
                { x: 0, y: 99 },
            ]
            const flag = toLineSegments(flagPolygon);
            // All that should remain is the flag since it returns to the pole without going back 
            // to the start point
            const actual = processLineSegment(pole, flag)
            const expected = flagPolygon;
            expect(actual).toEqual(expected);
        });
    });
    describe('mergePolygon2s', () => {
        describe('given multiple polygons that intersect at the same vertex on all of them', () => {
            it('2 diamonds; should merge them in the correct order', () => {
                // This example uses 4 diamonds that intersect at 0,0

                // Diamond left
                const p1 = { x: 0, y: 0 }
                const p2 = { x: -2, y: -1 }
                const p3 = { x: -3, y: 0 }
                const p4 = { x: -2, y: 1 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygonA: Polygon2 = points;
                // Diamond top
                const p1b = { x: 0, y: 0 }
                const p2b = { x: -1, y: 2 }
                const p3b = { x: 0, y: 3 }
                const p4b = { x: 1, y: 2 }
                const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
                const polygonB: Polygon2 = pointsb;
                const mergedPolygons = mergePolygon2s([polygonA, polygonB]);
                const actual = mergedPolygons;
                const expected: Polygon2[] = [
                    [
                        p1, p2, p3, p4,
                        p1b, p2b, p3b, p4b
                    ]
                ];
                expect(actual).toEqual(expected);

            });
            it('4 diamonds; should merge them in the correct order', () => {
                // This example uses 4 diamonds that intersect at 0,0

                // Diamond left
                const p1 = { x: 0, y: 0 }
                const p2 = { x: -2, y: -1 }
                const p3 = { x: -3, y: 0 }
                const p4 = { x: -2, y: 1 }
                const points: Vec2[] = [p1, p2, p3, p4];
                const polygonA: Polygon2 = points;
                // Diamond top
                const p1b = { x: 0, y: 0 }
                const p2b = { x: -1, y: 2 }
                const p3b = { x: 0, y: 3 }
                const p4b = { x: 1, y: 2 }
                const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
                const polygonB: Polygon2 = pointsb;
                // Diamond right
                const p1c = { x: 0, y: 0 }
                const p2c = { x: 2, y: 1 }
                const p3c = { x: 3, y: 0 }
                const p4c = { x: 2, y: -1 }
                const pointsc: Vec2[] = [p1c, p2c, p3c, p4c];
                const polygonC: Polygon2 = pointsc;
                // Diamond bottom
                const p1d = { x: 0, y: 0 }
                const p2d = { x: 1, y: -2 }
                const p3d = { x: 0, y: -3 }
                const p4d = { x: -1, y: -2 }
                const pointsd: Vec2[] = [p1d, p2d, p3d, p4d];
                const polygonD: Polygon2 = pointsd;
                const mergedPolygons = mergePolygon2s([polygonA, polygonB, polygonD, polygonC]);
                const actual = mergedPolygons;
                const expected: Polygon2[] = [[
                    p1, p2, p3, p4,
                    p1b, p2b, p3b, p4b,
                    p1c, p2c, p3c, p4c,
                    p1d, p2d, p3d, p4d,
                ]]
                expect(actual).toEqual(expected);

            });
        });
        it('should handle merging 4 polygons that make a donut of rectancles (with a hole in the middle)', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 10, y: 0 }
            const p3 = { x: 10, y: 10 }
            const p4 = { x: 0, y: 10 }
            const p5 = { x: 0, y: 9 }
            const p6 = { x: 9, y: 9 }
            const p7 = { x: 9, y: 1 }
            const p8 = { x: 0, y: 1 }
            // Note: The order of points matter, they must iterate the polygon clockwise
            // when I wrote this test it was counter clockwise, so the .reverse() makes it clockwise
            const points: Vec2[] = [p1, p2, p3, p4, p5, p6, p7, p8].reverse();
            const polygonA: Polygon2 = points;

            // PolygonB closes the "horseshoe" of polygon A leaving a square
            // with a square inside it (a square donut)
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 1, y: 1 }
            const p3b = { x: 1, y: 9 }
            const p4b = { x: 0, y: 9 }
            // Note: The order of points matter, they must iterate the polygon clockwise
            // when I wrote this test it was counter clockwise, so the .reverse() makes it clockwise
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b].reverse();
            const polygonB: Polygon2 = pointsb;

            const mergedPolygons = mergePolygon2s([polygonA, polygonB]);
            const actual = mergedPolygons;
            const expected = [
                [
                    { x: 9, y: 1 },
                    { x: 9, y: 9 },
                    { x: 1, y: 9 },
                    { x: 1, y: 1 },
                ],
                [
                    { x: 10, y: 10 },
                    { x: 10, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 10 },
                ],
            ]
            expect(actual).toEqual(expected);

        })

    });
    describe('given polygons that intersect at exactly a point of one of the verticies of a polygon', () => {
        it('should merge the polygons', () => {
            //square
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 2, y: 1 }
            const p4 = { x: 2, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon2 = points;

            // diamond
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 3 }
            const p4b = { x: 2, y: 2 }
            const pointsDiamond: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonDiamond: Polygon2 = pointsDiamond
            //  They will intersect directly on p1b, which means it will be in the merged poly twice
            const actual = mergePolygon2s([polygonA, polygonDiamond])
            const expected = [[p1, p2, p1b, p2b, p3b, p4b, p1b, p3, p4]];
            expect(actual).toEqual(expected);

        });
    });
    describe('given polygons that intersect at a vertex that they both share but no more', () => {
        it('should merge the polygons', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon2 = points;

            const p1b = { x: 1, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 3 }
            const p4b = { x: 2, y: 2 }
            const pointsDiamond: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonDiamond: Polygon2 = pointsDiamond;
            //  They will intersect directly on p3/p1b, which means it will be in the merged poly twice
            const actual = mergePolygon2s([polygonA, polygonDiamond]);
            const expected = [[p1, p2, p1b, p2b, p3b, p4b, p1b, p4]];
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
            const polygonA: Polygon2 = points;
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon2 = pointsb;
            const mergedPolygons = mergePolygon2s([polygonA, polygonB]);

            const actual = mergedPolygons;
            const expected = [[
                p4,
                p1,
                p2b,
                p3b,
            ]];
            expect(actual).toEqual(expected);
        });
        it('should merge them so there is only one left', () => {
            const p1 = { x: 0, y: 0 }
            const p2 = { x: 0, y: 1 }
            const p3 = { x: 1, y: 1 }
            const p4 = { x: 1, y: 0 }
            const points: Vec2[] = [p1, p2, p3, p4];
            const polygonA: Polygon2 = points;
            const p1b = { x: 0, y: 1 }
            const p2b = { x: 0, y: 2 }
            const p3b = { x: 1, y: 2 }
            const p4b = { x: 1, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon2 = pointsb;
            const mergedPolygons = mergePolygon2s([polygonA, polygonB]);
            expect(mergedPolygons.length).toEqual(1);
        });
    });
    it("should ignore branching off in a direction that goes INSIDE of the current polygon", () => {
        // If a vertex lies on a line of a poly, but it branches off inside the poly, ignore it
        const p1 = { x: 0, y: 0 }
        const p2 = { x: 0, y: 3 }
        const p3 = { x: 2, y: 3 }
        const p4 = { x: 2, y: 0 }
        const points: Vec2[] = [p1, p2, p3, p4];
        const polygonA: Polygon2 = points;
        // It won't take any of the branches that go inside
        const p1b = { x: 0, y: 1 }
        const p2b = { x: 1, y: 2 }
        const p3b = { x: 2, y: 1 }
        const p4b = { x: 1, y: 0 }
        const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
        const polygonB: Polygon2 = pointsb;
        const mergedPolygon = mergePolygon2s([polygonA, polygonB])[0];

        const actual = mergedPolygon;
        const expected = [
            p1,
            p2,
            p3,
            p4,
        ];
        expect(actual).toEqual(expected);
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
            const polygonA: Polygon2 = points;
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon2 = pointsb;
            const mergedPolygon = mergePolygon2s([polygonA, polygonB])[0];

            const actual = mergedPolygon;
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
            const polygonA: Polygon2 = points;
            const p1b = { x: -1, y: 1 }
            const p2b = { x: -1, y: 3 }
            const p3b = { x: 2, y: 3 }
            const p4b = { x: 2, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon2 = pointsb;
            const mergedPolygon = mergePolygon2s([polygonB, polygonA])[0];

            const actual = mergedPolygon;
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
            const polygonA: Polygon2 = points;
            const p1b = { x: 1, y: 1 }
            const p2b = { x: 1, y: 3 }
            const p3b = { x: 3, y: 3 }
            const p4b = { x: 3, y: 1 }
            const pointsb: Vec2[] = [p1b, p2b, p3b, p4b];
            const polygonB: Polygon2 = pointsb;
            const mergedPolygon = mergePolygon2s([polygonA, polygonB])[0];

            const actual = mergedPolygon;
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
            const polygonA: Polygon2 = points;
            const polygonB: Polygon2 = points;
            const mergedPolygons = mergePolygon2s([polygonA, polygonB]);
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
            const p5 = { x: 1, y: -1 };
            const polygonA: Polygon2 = points;
            const polygonB: Polygon2 = [...points, p5];
            const mergedPolygons = mergePolygon2s([polygonA, polygonB]);
            expect(mergedPolygons.length).toEqual(1);
            const actual = mergedPolygons[0];
            const expected = [
                p1,
                p2,
                p3,
                p4,
                p5,
            ];
            expect(actual).toEqual(expected);
        });
    });
    describe('given 3 boxes, one that overlaps 2', () => {
        it('should return a single correctly merged polygon', () => {
            const largePoly: Polygon2 = [
                { x: 0, y: 0 },
                { x: 0, y: 10 },
                { x: 4, y: 10 },
                { x: 4, y: 0 }
            ]
            const smallPoly1: Polygon2 = [
                { x: -1, y: 2 },
                { x: -1, y: 3 },
                { x: 1, y: 3 },
                { x: 1, y: 2 }
            ]
            const smallPoly2: Polygon2 = [
                { x: -1, y: 7 },
                { x: -1, y: 8 },
                { x: 1, y: 8 },
                { x: 1, y: 7 }
            ]
            const mergedPolygons = mergePolygon2s([largePoly, smallPoly1, smallPoly2]);
            const actual = mergedPolygons[0];
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
    it('should properly merge 3 polys when one of them has all of it\'s verts within the other two but it\'s walls will still affect the final merged polygon', () => {
        const polyBridge =
            [
                { "x": 0, "y": 0 },
                { "x": 0, "y": 3 },
                { "x": 3, "y": 3 },
                { "x": 3, "y": 0 }
            ]
        // Covers polyBridge's top 2 points
        const polyTop =
            [
                { "x": -1, "y": 2 },
                { "x": -1, "y": 4 },
                { "x": 4, "y": 4 },
                { "x": 4, "y": 2 }
            ]
        // Covers polyBridge's bottom 2 points
        const polyBottom = [
            { "x": -1, "y": -1 },
            { "x": -1, "y": 1 },
            { "x": 4, "y": 1 },
            { "x": 4, "y": -1 }
        ]

        const mergedPolygons = mergePolygon2s([polyBridge, polyTop, polyBottom]);
        const actual = mergedPolygons;
        const expected = [[
            { x: 0, y: 2 },
            polyTop[0],
            polyTop[1],
            polyTop[2],
            polyTop[3],
            { x: 3, y: 2 },
            { x: 3, y: 1 },
            polyBottom[2],
            polyBottom[3],
            polyBottom[0],
            polyBottom[1],
            { x: 0, y: 1 },

        ]];
        expect(actual).toEqual(expected);

    });


})