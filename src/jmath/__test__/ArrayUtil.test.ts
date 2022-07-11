
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex, vec2ToOneDimentionIndexPreventWrap } from '../ArrayUtil';
describe('should take an index and a width of a rectangle and return the x,y coordinates of the cell which is at that index if counted from left to right and top to bottom', () => {
    const testPairs = [
        {
            coords: { x: 1, y: 0 },
            index: 1,
            width: 10,
        },
        {
            coords: { x: 1, y: 1 },
            index: 11,
            width: 10,
        },
        {
            coords: { x: 0, y: 1 },
            index: 10,
            width: 10,
        },
        {
            coords: { x: 1, y: 1 },
            index: 7,
            width: 6,
        },
        {
            coords: { x: 0, y: 2 },
            index: 12,
            width: 6,
        },
    ];
    for (let { coords, index, width } of testPairs) {
        it(`indexToXY: Coords: ${JSON.stringify(
            coords,
        )}; index: ${index}; width: ${width}`, () => {
            const expected = coords;
            const acutal = oneDimentionIndexToVec2(index, width);
            expect(acutal).toEqual(expected);
        });
        it(`xyToIndex: Coords: ${JSON.stringify(
            coords,
        )}; index: ${index}; width: ${width}`, () => {
            const expected = index;
            const acutal = vec2ToOneDimentionIndex(coords, width);
            expect(acutal).toEqual(expected);
        });
    }
});
describe('vec2ToOneDimentionIndexPreventWrap should prevent wrapping so that if an edge\'s neighbor is queried but it has no neighbor it will return and invalid index to show there is no neighbor', () => {
    it('should return -1 index when there is no neighbor', () => {
        // There is no 4,0; it goes from 3,0 to 1,1; so this function should return -1 to show that there is no 4,0
        const coords = { x: 4, y: 0 };
        const width = 3;
        const expected = -1;
        const acutal = vec2ToOneDimentionIndexPreventWrap(coords, width);
        expect(acutal).toEqual(expected);
    });
    it('should return the correct index when it is within bounds', () => {
        const coords = { x: 2, y: 0 };
        const width = 3;
        const expected = 2;
        const acutal = vec2ToOneDimentionIndexPreventWrap(coords, width);
        expect(acutal).toEqual(expected);
    });

})