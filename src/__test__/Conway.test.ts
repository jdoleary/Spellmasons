import { getNeighborIndices } from "../Conway";

describe('getNeighborIndices', () => {
    it('should return the neighboring indicies around the given index', () => {
        const actual = getNeighborIndices(4, 3);
        const expected = [0, 1, 2, 5, 8, 7, 6, 3];
        expect(actual).toBe(expected);

    });
});