import { LineSegment, findWherePointIntersectLineSegmentAtRightAngle, lineSegmentIntersection, testables, isPointOnLineSegment, isCollinearAndOverlapping } from '../lineSegment';
import type { Vec2 } from '../../Vec';
const { slope, toStandardForm } = testables;
describe('lineSegment', () => {
    describe('getRelation', () => {
        describe('isOverlapping', () => {
            it('should return true when B fully overlaps A', () => {

                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const actual = isCollinearAndOverlapping(A, B);
                expect(actual).toEqual(true);
            });
            it('should return true when A fully overlaps B', () => {

                const A = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const B = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const actual = isCollinearAndOverlapping(A, B);
                expect(actual).toEqual(true);
            });
        });
    });
    describe('isCollinearAndOverlapping', () => {
        [
            {
                description: 'Horizontal lines that are collinear',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: 1, y: 0
                    }, p2: {
                        x: 3, y: 0
                    }
                },
                expected: true
            },
            {
                description: 'Horizontal lines that are collinear and one is large',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: -10, y: 0
                    }, p2: {
                        x: 10, y: 0
                    }
                },
                expected: true
            },
            {
                description: 'Horizontal lines that are collinear and one is large and they point in opposite directions',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: 10, y: 0
                    }, p2: {
                        x: -10, y: 0
                    }
                },
                expected: true
            },
            {
                description: 'Horizontal lines that are collinear but NOT touching because they have a gap inbetween',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: 3, y: 0
                    }, p2: {
                        x: 4, y: 0
                    }
                },
                expected: false
            },
            {
                description: 'Non parallel lines',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: 0, y: 0
                    }, p2: {
                        x: 0, y: 1
                    }
                },
                expected: false
            },
            {
                description: 'Vertical lines that are collinear',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 0, y: 2
                    }
                },
                l2: {
                    p1: {
                        x: 0, y: 1
                    }, p2: {
                        x: 0, y: 3
                    }
                },
                expected: true
            },
            {
                description: 'Vertical lines that are collinear but NOT touching because they have a gap inbetween',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 0, y: 2
                    }
                },
                l2: {
                    p1: {
                        x: 0, y: 3
                    }, p2: {
                        x: 0, y: 4
                    }
                },
                expected: false
            },
            {
                description: 'lines that are collinear and touching',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 2
                    }
                },
                l2: {
                    p1: {
                        x: 1, y: 1
                    }, p2: {
                        x: 3, y: 3
                    }
                },
                expected: true
            },
            {
                description: 'lines that are parallel but not collinear nor touching',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 5, y: 5
                    }
                },
                l2: {
                    p1: {
                        x: 1, y: 0
                    }, p2: {
                        x: 6, y: 3
                    }
                },
                expected: false
            },
            {
                description: 'lines that are overlapping but are pointing away from each other',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: 1, y: 0
                    }, p2: {
                        x: -1, y: 0
                    }
                },
                expected: true
            },
            {
                description: 'lines that are NOT overlapping and are pointing away from each other',
                l1: {
                    p1: {
                        x: 0, y: 0
                    },
                    p2: {
                        x: 2, y: 0
                    }
                },
                l2: {
                    p1: {
                        x: -1, y: 0
                    }, p2: {
                        x: -2, y: 0
                    }
                },
                expected: false
            },
        ].forEach(({ l1, l2, expected, description }) => {
            it(`should return ${expected} when lines are touching and collinear for "${description}"`, () => {
                const actual = isCollinearAndOverlapping(l1, l2);
                expect(actual).toEqual(expected);
            });
        });
    });
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
    //         const actual = intersectionOfLines(l1, l2);
    //         const expected = { x: 1, y: 0 };
    //         expect(actual).toEqual(expected);

    //     });
    //     it('should handle 2 vertical lines', () => { });
    //     it('should handle overlapping lines', () => { });
    // });
    describe('isPointOnLineSegment', () => {
        it('should return true if the point is on the line segment', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 2 } };
            const point: Vec2 = { x: 1, y: 1 };
            const actual = isPointOnLineSegment(point, ls1);
            const expected = true;
            expect(actual).toEqual(expected);
        });
        it('should return false if the point is NOT on the line segment', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 200, y: 200 } };
            const point: Vec2 = { x: 2, y: 1 };
            const actual = isPointOnLineSegment(point, ls1);
            const expected = false;
            expect(actual).toEqual(expected);
        });

    });
    describe('intersectionOfLineSegments', () => {
        describe('fully overlapping', () => {
            it('should return A.p2 when B fully overlaps A', () => {
                const A = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const B = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const actual = lineSegmentIntersection(A, B);
                expect(actual).toEqual(A.p2);
            });
            it('should return B.p2 when A fully overlaps B', () => {
                const A = { p1: { x: -10, y: 0 }, p2: { x: 10, y: 0 } };
                const B = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
                const actual = lineSegmentIntersection(A, B);
                expect(actual).toEqual(B.p2);
            });

        });
        describe('colinear', () => {
            it('test co-linear non-overlapping lines', () => {
                const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };
                const ls2: LineSegment = { p1: { x: 2, y: 2 }, p2: { x: 3, y: 3 } };
                const actual = lineSegmentIntersection(ls1, ls2);
                const expected = undefined;
                expect(actual).toEqual(expected);

            });

            it('test overlapping co-linear vertical lines', () => {
                const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 3 } };
                const ls2: LineSegment = { p1: { x: 0, y: 1 }, p2: { x: 0, y: 4 } };
                // values 0 { x: 0, y: 1 } { x: 0, y: 3 }
                const actual = lineSegmentIntersection(ls1, ls2);
                // Since there are infinite collision points, I want it to return 
                // the ls1 endpoint that is within ls2, if none, then the ls2 endpoint
                // within ls1.  Intersection point is arbitrary since there are infinite
                // points to choose from
                const expected = ls2.p1;
                expect(actual).toEqual(expected);

            });
            it('test overlapping co-linear horizontal lines', () => {
                const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 3, y: 0 } };
                const ls2: LineSegment = { p1: { x: 1, y: 0 }, p2: { x: 4, y: 0 } };
                const actual = lineSegmentIntersection(ls1, ls2);
                // Intersection point is arbitrary since there are infinite
                // points to choose from
                const expected = ls2.p1;
                expect(actual).toEqual(expected);
            });
            describe('if lines are collinear and overlapping but l1.p2 is not within the overlap', () => {
                it('choose arbitrary point among infinite intersections', () => {
                    const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 2 } };
                    const ls2: LineSegment = { p1: { x: -1, y: -1 }, p2: { x: 1, y: 1 } };
                    const actual = lineSegmentIntersection(ls1, ls2);
                    const expected = ls2.p2;
                    expect(actual).toEqual(expected);
                });
                describe('if neither l1.p2 nor l1.p1 are inside the overlap because l2 is entirely inside the overlap', () => {
                    it('should return l2.p2', () => {
                        const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 4, y: 4 } };
                        const ls2: LineSegment = { p1: { x: 1, y: 1 }, p2: { x: 2, y: 2 } };
                        const actual = lineSegmentIntersection(ls1, ls2);
                        const expected = ls2.p2;
                        expect(actual).toEqual(expected);

                    });
                });
            });
        });
        it('should return a point of intersection for 2 collinear overlapping lines facing away from each other', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: -2, y: -1 } };
            const ls2: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 1 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = { x: 0, y: 0 };
            expect(actual).toEqual(expected);
        });
        it('should return a point of intersection for 2 collinear overlapping lines facing towards each other', () => {
            const ls1: LineSegment = { p1: { x: 0, y: 0 }, p2: { x: -2, y: -1 } };
            const ls2: LineSegment = { p1: { x: 2, y: 1 }, p2: { x: 0, y: 0 } };
            const actual = lineSegmentIntersection(ls1, ls2);
            const expected = { x: 0, y: 0 };
            expect(actual).toEqual(expected);
        });
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