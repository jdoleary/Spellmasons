import { test_ignorePromiseSpy } from "./promiseSpy";

export function raceTimeout(ms: number, message: string, promise: Promise<any>, options?: { skipSpyPromise?: boolean }): Promise<any> {
    const timeoutPromise = new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            console.error('raceTimeout:', message);
            resolve(undefined);
        }, ms);
        promise.then(x => {
            //console.log(x, message, 'finished after', Date.now() - start);
            // Ensure that the timeout doesn't trigger now that the promise has resolved
            // natually within the allowed time
            clearTimeout(timeoutId);
            // Pass on the result of the promise
            resolve(x);
        }).catch(reject);
    });
    if (options?.skipSpyPromise) {
        test_ignorePromiseSpy(timeoutPromise);
        test_ignorePromiseSpy(promise);
    }
    return timeoutPromise;
}

// reportIfTakingTooLong is a wrapper that logs an error if a promise takes
// over `reportAfterMS` milliseconds to resolve.  It returns the promise exactly
// as it was passed in so it can be await'd and have the return value unaltered.
export function reportIfTakingTooLong(reportAfterMS: number, message: string, promise: Promise<any>): Promise<any> {
    const start = Date.now();
    const timeoutId = setTimeout(() => {
        console.error('reportIfTakingTooLong', message);
    }, reportAfterMS);

    promise.then(() => {
        clearTimeout(timeoutId);
    });

    return promise
}