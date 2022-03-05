import { getAngleBetweenVec2s } from '../Vec';
describe("getAngleBetweenVec2s", () => {
    it('should find the angle in radians between 2 Vec2s', () => {
        const p1 = { x: 1, y: 1 };
        const p2 = { x: 1, y: 2 };
        const actual = getAngleBetweenVec2s(p1, p2);
        const expected = Math.PI / 2;
        expect(actual).toEqual(expected);
    });
});