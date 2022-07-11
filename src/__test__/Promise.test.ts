import { raceTimeout } from "../Promise";

describe('raceTimeout', () => {
    beforeEach(() => {
        // Squelch expected error and debug log
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'debug').mockImplementation(() => { });
    });
    it('should return the result of the original promise, if the promise resolves before the timeout', async () => {
        const promiseResolveValue = 1;
        const expected = promiseResolveValue;
        const actual = await raceTimeout(100, 'Promise did not resolve in time', Promise.resolve(1));
        expect(actual).toEqual(expected);
    })
    it('should resolve undefined at the timeout duration if the promise has yet to resolve by the time the timeout is up', async () => {
        const timeoutResolveValue = undefined;
        const expected = timeoutResolveValue;
        const actual = await raceTimeout(10, 'Promise did not resolve in time', new Promise((_resolve) => { }));
        expect(actual).toEqual(expected);
    })
})