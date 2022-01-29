import { testable } from '../lerpList'
const { processLerpList } = testable;
describe('lerpList', () => {
    it("should lerp the value denoted by 'key' relative to the amount of elapsed time divided by the 'duration'", () => {
        const object = { x: 0 }
        const duration = 1000
        const lerpable = {
            mutatable: object,
            key: 'x',
            startVal: object.x,
            endVal: 100,
            startTime: 0,
            duration
        };
        processLerpList(duration / 2, [lerpable]);
        expect(object.x).toEqual(lerpable.endVal / 2);
        processLerpList(duration, [lerpable]);
        expect(object.x).toEqual(lerpable.endVal);
    });
    it("should remove the lerpable object from the list when it is done lerping", () => {
        const object = { x: 0, y: 0, z: 0 }
        const lerpable0 = {
            mutatable: object,
            key: 'z',
            startVal: object.z,
            endVal: 100,
            startTime: 0,
            duration: 10
        };
        const lerpable1 = {
            mutatable: object,
            key: 'x',
            startVal: object.x,
            endVal: 100,
            startTime: 0,
            duration: 1
        };
        const lerpable2 = {
            mutatable: object,
            key: 'y',
            startVal: object.y,
            endVal: 100,
            startTime: 0,
            duration: 10
        };
        const list = [lerpable0, lerpable1, lerpable2];
        processLerpList(1, list);
        expect(list).toEqual([lerpable0, lerpable2])
    });

})