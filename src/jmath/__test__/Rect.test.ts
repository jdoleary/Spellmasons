import { isWithinRect } from '../Rect';

describe('isWithinRect', () => {
    [
        { p1: { x: 0, y: 0 }, rect: { top: -1, left: -1, bottom: 1, right: 1 }, expected: true, message: 'returns true if point is within the rect' },
        { p1: { x: -10, y: 0 }, rect: { top: -1, left: -1, bottom: 1, right: 1 }, expected: false, message: 'returns false if point is outside the rect to the left' },
        { p1: { x: 10, y: 0 }, rect: { top: -1, left: -1, bottom: 1, right: 1 }, expected: false, message: 'returns false if point is outside the rect to the right' },
        { p1: { x: 0, y: -10 }, rect: { top: -1, left: -1, bottom: 1, right: 1 }, expected: false, message: 'returns false if point is outside the rect to the top' },
        { p1: { x: 0, y: 10 }, rect: { top: -1, left: -1, bottom: 1, right: 1 }, expected: false, message: 'returns false if point is outside the rect to the bottom' },
    ].map(({ p1, rect, expected, message }) => {
        it(message, () => {
            const actual = isWithinRect(p1, rect);
            expect(actual).toEqual(expected);
        });
    });
});