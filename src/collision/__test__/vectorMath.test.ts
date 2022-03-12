import { dotProduct, magnitude } from '../vectorMath';

describe('vectorMath', () => {
    describe('magnitude', () => {
        it('should return the magnitude of the vector', () => {
            const v = { x: 3, y: 4 };
            const actual = magnitude(v);
            const expected = 5;
            expect(actual).toEqual(expected);
        });
    });
    describe('dotProduct of 2 vectors', () => {
        it('should return 21 for a dot product of vectors with a magnitude of 6, 7 and an angle of 60 degrees', () => {
            const v1 = { x: 3, y: 3 * Math.sqrt(3) };
            const v2 = { x: 7, y: 0 }
            const actual = Math.round(dotProduct(v1, v2));
            const expected = 21;
            expect(actual).toEqual(expected);
        });
    });
});