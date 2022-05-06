import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex } from "../WaveFunctionCollapse";

describe('oneDimetnionIndexToVec2', () => {
    it('should return the 2d index for 1d index position on a 2d array stored as a 1d array', () => {
        // Sample Array
        // const array = [
        //     0, 1, 2, 3,
        //     4, 5, 6, 7
        // ];
        const width = 4;
        const index = 6;
        const actual = oneDimentionIndexToVec2(index, width)
        const expected = { x: 2, y: 1 }
        expect(actual).toEqual(expected)
    })

});
describe('vec2ToOneDimetionIndex', () => {
    it('should return the 1d index for 2d array stored as a 1d array', () => {
        // Sample Array
        // const array = [
        //     0, 1, 2, 3,
        //     4, 5, 6, 7
        // ];
        const width = 4;
        const actual = vec2ToOneDimentionIndex({ x: 2, y: 1 }, width)
        const expected = 6;
        expect(actual).toEqual(expected)
    })

});